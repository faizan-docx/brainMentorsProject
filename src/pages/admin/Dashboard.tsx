import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { Plus, Users, Calendar, ArrowRight, ExternalLink } from 'lucide-react';

interface Workshop {
  id: string;
  name: string;
  college: string;
  date: string;
  status: boolean;
  submissionCount: number;
}

export default function AdminDashboard() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we'd fetch from actual collections. Using mock static data if Firebase is unconfigured.
    const q = query(collection(db, 'workshops'), orderBy('createdAt', 'desc'));
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workshop[];
      
      // If no data, use mock
      if (data.length === 0) {
        setWorkshops([
          { id: '1', name: 'React Advanced Patterns', college: 'Tech University', date: '2026-04-15', status: true, submissionCount: 42 },
          { id: '2', name: 'UI/UX Masterclass', college: 'Design Institute', date: '2026-03-20', status: false, submissionCount: 120 },
        ]);
      } else {
        setWorkshops(data);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firestore error (likely missing config), using mock data", error);
      setWorkshops([
        { id: '1', name: 'React Advanced Patterns', college: 'Tech University', date: '2026-04-15', status: true, submissionCount: 42 },
        { id: '2', name: 'UI/UX Masterclass', college: 'Design Institute', date: '2026-03-20', status: false, submissionCount: 120 },
      ]);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) return <div className="animate-pulse flex space-x-4">Loading workshops...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your workshop operations.</p>
        </div>
        <Link 
          to="/admin/builder" 
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Create Form
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <Calendar className="w-5 h-5" />
            <h3 className="font-medium">Total Workshops</h3>
          </div>
          <p className="text-4xl font-bold">{workshops.length}</p>
        </div>
        <div className="glass rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <Users className="w-5 h-5" />
            <h3 className="font-medium">Total Submissions</h3>
          </div>
          <p className="text-4xl font-bold">{workshops.reduce((acc, curr) => acc + curr.submissionCount, 0)}</p>
        </div>
        <div className="glass rounded-xl p-6 flex flex-col justify-between shadow-sm border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3 text-primary mb-4">
            <ArrowRight className="w-5 h-5" />
            <h3 className="font-medium">Active Forms</h3>
          </div>
          <p className="text-4xl font-bold text-primary">{workshops.filter(w => w.status).length}</p>
        </div>
      </div>

      <div className="space-y-4 pt-6">
        <h2 className="text-xl font-bold">Recent Workshops</h2>
        <div className="grid gap-4">
          {workshops.map((workshop, i) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={workshop.id}
              className="glass rounded-xl p-5 flex items-center justify-between group hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-6">
                <div className={`w-3 h-3 rounded-full ${workshop.status ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-destructive'}`} />
                <div>
                  <h3 className="font-semibold text-lg">{workshop.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{workshop.college}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{workshop.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="block text-2xl font-bold">{workshop.submissionCount}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Responses</span>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link 
                    to={`/admin/builder/${workshop.id}`}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </Link>
                  <Link 
                    to={`/f/${workshop.id}`}
                    target="_blank"
                    className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
          {workshops.length === 0 && (
            <div className="text-center py-12 text-muted-foreground glass rounded-xl">
              No workshops found. Create one to get started!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
