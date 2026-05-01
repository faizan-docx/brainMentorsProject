import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import emailjs from '@emailjs/browser';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StudentForm() {
  const { formId } = useParams();
  const navigate = useNavigate();
  
  const [workshop, setWorkshop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    phone: '',
    email: '',
    feedback: ''
  });

  // OTP State
  const [otpStep, setOtpStep] = useState<'form' | 'verify'>('form');
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');

  useEffect(() => {
    const fetchWorkshop = async () => {
      try {
        if (!formId) return;
        const docRef = doc(db, 'workshops', formId);
        const snap = await getDoc(docRef);
        
        if (snap.exists() && snap.data().status === true) {
          setWorkshop({ id: snap.id, ...snap.data() });
        } else {
          setError('This feedback form is either not found or currently inactive.');
        }
      } catch (err) {
        console.error(err);
        // Fallback mock for demonstration if Firebase not configged
        setWorkshop({
          id: formId,
          name: 'Advanced React Patterns',
          college: 'Tech University',
          date: '2026-04-15',
          time: '10:00 AM',
          instructions: 'Please fill out your details and verify your contact information to receive your certificate.',
          status: true
        });
      } finally {
        setLoading(false);
      }
    };
    fetchWorkshop();
  }, [formId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    // Optional Expiry (2 mins)
    setTimeout(() => {
      setGeneratedOtp('');
    }, 2 * 60 * 1000);

    const templateParams = {
      to_email: formData.email,
      otp: otp,
    };

    try {
      await emailjs.send(
        "service_jy8ltbq",
        "template_twop72s",
        templateParams,
        "4ojUh-vrb5hduvO6s"
      );
      
      setOtpStep('verify');
    } catch (err: any) {
      console.error(err);
      alert('Failed to send OTP via EmailJS. Check console.');
    } finally {
      setOtpLoading(false);
    }
  };

  const downloadCertificate = (name: string, course: string) => {
    const doc = new jsPDF();

    // Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CERTIFICATE OF COMPLETION", 105, 40, { align: "center" });

    // Body
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(14);
    doc.text("This is to certify that", 105, 60, { align: "center" });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.text(name, 105, 75, { align: "center" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(14);
    doc.text("has successfully completed", 105, 90, { align: "center" });

    doc.setFont("Helvetica", "bold");
    doc.text(course, 105, 105, { align: "center" });

    // Footer
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 130);

    // Border
    doc.rect(10, 10, 190, 277);

    // 🔥 THIS triggers download
    doc.save(`${name.replace(/\s+/g, '_')}_certificate.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpValue !== generatedOtp || !generatedOtp) {
      alert("Invalid OTP or OTP has expired ❌");
      return;
    }

    setSubmitLoading(true);

    try {
      // Add submission
      await addDoc(collection(db, 'submissions'), {
        workshopId: workshop.id,
        ...formData,
        submittedAt: serverTimestamp()
      });

      // Increment count on workshop
      const wsRef = doc(db, 'workshops', workshop.id);
      await updateDoc(wsRef, {
        submissionCount: increment(1)
      }).catch(_e => console.warn("Update count failed..."));

      // Download directly
      downloadCertificate(formData.name, formData.course);

      // Send simple confirmation email
      await emailjs.send(
        "service_jy8ltbq",
        "template_twop72s",
        {
          user_name: formData.name,
          course_name: formData.course,
          to_email: formData.email
        },
        "4ojUh-vrb5hduvO6s"
      );

      navigate('/thank-you');
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong saving your submission.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full glass rounded-xl p-8 space-y-4">
          <div className="mx-auto w-12 h-12 bg-destructive/20 text-destructive rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Unavailable</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40rem] h-[40rem] bg-primary/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70" />
        <div className="absolute top-[20%] -right-[10%] w-[35rem] h-[35rem] bg-purple-400/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70" />
        <div className="absolute -bottom-[10%] left-[20%] w-[40rem] h-[40rem] bg-pink-400/20 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-2xl w-full mx-auto relative z-10 space-y-8"
      >
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-2"
          >
            Workshop Feedback
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 pb-2">
            {workshop.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground font-medium pt-2">
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {workshop.college}</div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {workshop.date}</div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {workshop.time}</div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 md:p-10 shadow-2xl shadow-primary/5">
          <div className="mb-6 pb-6 border-b border-border">
            <h3 className="font-semibold text-lg mb-2">Instructions</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{workshop.instructions}</p>
          </div>

          <AnimatePresence mode="wait">
            {otpStep === 'form' ? (
              <motion.form 
                key="details-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
                onSubmit={handleRequestOtp}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name (for Certificate)</label>
                    <Input name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course / Year</label>
                    <Input name="course" value={formData.course} onChange={handleChange} required placeholder="B.Tech 3rd Year" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1 234 567 8900" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Workshop Feedback</label>
                  <textarea 
                    name="feedback"
                    value={formData.feedback}
                    onChange={handleChange}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all backdrop-blur-sm"
                    placeholder="What did you learn? How can we improve?"
                    required
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full h-12 text-lg" isLoading={otpLoading}>
                    Send Verification OTP
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    We'll send a code to your email and phone to verify your certificate delivery.
                  </p>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="otp-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 text-center py-4"
                onSubmit={handleSubmit}
              >
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Verify Contact Details</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  We've sent a one-time password to <span className="font-semibold text-foreground">{formData.email}</span> and <span className="font-semibold text-foreground">{formData.phone}</span>.
                </p>

                <div className="max-w-xs mx-auto space-y-4">
                  <Input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    value={otpValue} 
                    onChange={(e) => setOtpValue(e.target.value)} 
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                    required 
                  />
                  
                  <Button type="submit" className="w-full h-12" isLoading={submitLoading}>
                    Verify & Submit
                  </Button>
                  
                  <button 
                    type="button" 
                    onClick={() => setOtpStep('form')}
                    className="text-sm text-primary hover:underline"
                  >
                    Edit details or resend
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
