import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
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
    try {
      const requestOtpFn = httpsCallable(functions, 'requestOtp');
      await requestOtpFn({ email: formData.email, phone: formData.phone });
      setOtpStep('verify');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const verifyOtpFn = httpsCallable(functions, 'verifyOtp');
      await verifyOtpFn({ email: formData.email, otp: otpValue });

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

      navigate('/thank-you');
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Invalid OTP. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-accent/20 blur-3xl rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto relative z-10 space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground bg-clip-text">
            {workshop.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {workshop.college}</div>
            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {workshop.date}</div>
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {workshop.time}</div>
          </div>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl shadow-indigo-500/10">
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
                    placeholder="Enter 4-digit OTP" 
                    value={otpValue} 
                    onChange={(e) => setOtpValue(e.target.value)} 
                    className="text-center text-lg tracking-widest"
                    maxLength={4}
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
