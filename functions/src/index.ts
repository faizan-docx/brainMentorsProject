import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

admin.initializeApp();

// Configure details via environment variables in real app
const EMAIL_USER = process.env.EMAIL_USER || 'mock@example.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'mock-pass';
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0/MOCK_ID/messages';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || 'mock-token';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or any service
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

export const requestOtp = functions.https.onCall(async (data, context) => {
  const { email, phone } = data;
  if (!email || !phone) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and phone are required');
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString(); // simple 4 digit OTP
  
  try {
    await transporter.sendMail({
      from: '"WorkshopHub" <' + EMAIL_USER + '>',
      to: email,
      subject: 'Your WorkshopHub Verification OTP',
      text: `Your One-Time Password is: ${otp}`
    });
  } catch (e) {
    functions.logger.warn("Failed to send OTP email (likely mock config)", e);
  }

  // Save OTP to Firestore with 5 mins TTL
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000);
  
  await admin.firestore().collection('otps').doc(email).set({
    otp,
    phone,
    expiresAt
  });

  return { success: true, message: "OTP sent successfully" };
});

export const verifyOtp = functions.https.onCall(async (data, context) => {
  const { email, otp } = data;
  if (!email || !otp) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and OTP are required');
  }

  const docRef = admin.firestore().collection('otps').doc(email);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'OTP not found or expired');
  }

  const otpData = docSnap.data();
  if (otpData?.expiresAt.toMillis() < Date.now()) {
    await docRef.delete();
    throw new functions.https.HttpsError('failed-precondition', 'OTP expired');
  }

  if (otpData?.otp !== otp) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid OTP');
  }

  // Clean up
  await docRef.delete();

  return { success: true, message: "OTP verified successfully" };
});

export const onSubmissionCreate = functions.firestore
  .document('submissions/{docId}')
  .onCreate(async (snap, context) => {
    const submission = snap.data();
    const { name, email, phone, workshopId } = submission;

    functions.logger.info(`Processing certificate for ${name} (${email}) for workshop ${workshopId}`);

    try {
      const workshopSnap = await admin.firestore().collection('workshops').doc(workshopId).get();
      const workshop = workshopSnap.data();

      if (!workshop) throw new Error("Workshop not found");

      let pdfDoc;
      if (workshop.templateUrl) {
        // Load custom template from Firebase Storage (via public URL)
        const response = await axios.get(workshop.templateUrl, { responseType: 'arraybuffer' });
        pdfDoc = await PDFDocument.load(response.data);
        
        const pages = pdfDoc.getPages();
        const page = pages[0];
        
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const { width, height } = page.getSize();
        
        // Print the name in the center (adjust coordinates based on your template design)
        page.drawText(name.toUpperCase(), { 
          x: width / 2 - 100, 
          y: height / 2, 
          size: 30, 
          font: helveticaFont, 
          color: rgb(0.1, 0.1, 0.1) 
        });
      } else {
        // Fallback to generating a blank PDF
        pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 400]);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        page.drawText('CERTIFICATE OF PARTICIPATION', { x: 100, y: 320, size: 24, font: helveticaFont, color: rgb(0, 0.3, 0.7) });
        page.drawText('This is proudly presented to', { x: 180, y: 270, size: 14, color: rgb(0, 0, 0) });
        page.drawText(name.toUpperCase(), { x: 150, y: 220, size: 30, font: helveticaFont, color: rgb(0.1, 0.1, 0.1) });
        page.drawText(`For actively participating in: ${workshop.name}`, { x: 100, y: 160, size: 14, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(`Date: ${workshop.date}`, { x: 100, y: 130, size: 12 });
        page.drawText(`College: ${workshop.college}`, { x: 300, y: 130, size: 12 });
      }

      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = Buffer.from(pdfBytes);

      const bucket = admin.storage().bucket();
      const file = bucket.file(`certificates/${workshopId}/${snap.id}.pdf`);
      await file.save(pdfBuffer, { contentType: 'application/pdf' });
      await file.makePublic();
      const certUrl = file.publicUrl();

      try {
        await transporter.sendMail({
          from: '"WorkshopHub" <' + EMAIL_USER + '>',
          to: email,
          subject: `Your Certificate for ${workshop.name}`,
          text: `Hi ${name},\n\nThank you for attending ${workshop.name}. Attached is your certificate of participation.\n\nYou can also view it here: ${certUrl}\n\nBest regards,\nWorkshopHub`,
          attachments: [
            {
              filename: `${name.replace(/\s+/g, '_')}_Certificate.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        });
      } catch (e) {
        functions.logger.warn("Failed to send certificate email", e);
      }

      try {
        await axios.post(
          WHATSAPP_API_URL,
          {
            messaging_product: "whatsapp",
            to: phone,
            type: "document",
            document: {
              link: certUrl,
              caption: `Hi ${name}! 🎉 Thank you for joining ${workshop.name}. Here is your certificate of participation!`
            }
          },
          { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
        );
      } catch (e) {
        functions.logger.warn("Failed to send WhatsApp message", e);
      }

    } catch (error) {
      functions.logger.error("Error generating certificate:", error);
      throw new functions.https.HttpsError('internal', 'Failed to generate and deliver certificate.');
    }
});
