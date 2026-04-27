import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, Copy, CheckCircle2, Link as LinkIcon, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    date: '',
    time: '',
    instructions: '',
    status: false,
  });

  useEffect(() => {
    if (id) {
      // Fetch existing form...
      const fetchForm = async () => {
        try {
          const docRef = doc(db, 'workshops', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData(docSnap.data() as any);
          }
        } catch (error) {
          console.error("Error fetching form", error);
        }
      };
      fetchForm();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formId = id || generateId();
      await setDoc(doc(db, 'workshops', formId), {
        ...formData,
        submissionCount: formData.name ? 0 : 0, // mock existing
        updatedAt: serverTimestamp(),
        ...(!id && { createdAt: serverTimestamp() })
      });
      navigate('/admin/dashboard');
    } catch (error) {
      console.error("Error saving form", error);
      alert("Failed to save. Ensure Firebase is configured properly.");
    } finally {
      setLoading(false);
    }
  };

  const formLink = `${window.location.origin}/f/${id || 'preview-id'}`;

  const copyLink = () => {
    navigator.clipboard.writeText(formLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {id ? 'Edit Workshop' : 'Create Workshop'}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-6 shadow-sm space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-border pb-2">General Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Workshop Name</label>
                  <Input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="e.g. Advanced React Patterns" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">College Name</label>
                  <Input 
                    name="college" 
                    value={formData.college} 
                    onChange={handleChange} 
                    placeholder="e.g. Tech University" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input 
                    name="date" 
                    type="date" 
                    value={formData.date} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input 
                    name="time" 
                    type="time" 
                    value={formData.time} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-semibold border-b border-border pb-2">Instructions</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Instructions for Students</label>
                <textarea 
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all backdrop-blur-sm"
                  placeholder="Please provide clear instructions for the feedback process..."
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} className="gap-2">
              <Save className="w-4 h-4" />
              Save Workshop
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="glass rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold border-b border-border pb-2">Status & Link</h2>
            
            <label className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
              <div>
                <div className="font-semibold text-foreground">Active Status</div>
                <div className="text-sm text-muted-foreground">Allow submissions</div>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                  type="checkbox" 
                  name="status"
                  id="toggle" 
                  checked={formData.status}
                  onChange={handleChange}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-muted peer focus:ring-0 checked:bg-white checked:right-0 checked:border-primary transition-all z-10" 
                />
                <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-6 rounded-full bg-muted cursor-pointer transition-colors peer-checked:bg-primary`}></label>
              </div>
            </label>

            {formData.status && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2"
              >
                <div className="text-sm font-medium">Shareable Link</div>
                <div className="flex items-center gap-2 p-3 bg-secondary/80 rounded-lg border border-border/50">
                  <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate w-full">{formLink}</span>
                  <button 
                    onClick={copyLink}
                    className="p-1.5 hover:bg-background rounded-md transition-colors shrink-0 text-primary"
                    title="Copy Link"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-primary" />}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
