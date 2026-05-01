import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { Plus, Users, Calendar, ArrowRight, ExternalLink, Download, MapPin, Edit } from 'lucide-react';

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

  const handleExportCSV = async (workshopId: string, workshopName: string) => {
    try {
      const q = query(collection(db, 'submissions'), where('workshopId', '==', workshopId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("No submissions found for this workshop.");
        return;
      }

      const rows = [
        ['Name', 'Email', 'Phone', 'Course', 'Feedback', 'Submitted At'] // Header
      ];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dateStr = data.submittedAt ? new Date(data.submittedAt.toMillis()).toLocaleString() : 'Unknown';

        // Escape quotes and wrap in quotes to handle commas in feedback
        const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

        rows.push([
          escapeCSV(data.name),
          escapeCSV(data.email),
          escapeCSV(data.phone),
          escapeCSV(data.course),
          escapeCSV(data.feedback),
          escapeCSV(dateStr)
        ]);
      });

      const csvContent = rows.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${workshopName.replace(/\s+/g, '_')}_Submissions.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export data.");
    }
  };

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              className="glass rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start md:items-center gap-4 md:gap-6 w-full md:w-auto">
                <div className={`mt-1.5 md:mt-0 flex-shrink-0 w-3 h-3 rounded-full ${workshop.status ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-destructive'}`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg md:text-xl leading-tight">{workshop.name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {workshop.college}</span>
                    <span className="hidden sm:block w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {workshop.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t border-border/50 md:border-t-0 pt-4 md:pt-0">
                <div className="flex items-baseline gap-2 md:block md:text-right">
                  <span className="block text-3xl md:text-2xl font-bold text-foreground">{workshop.submissionCount}</span>
                  <span className="text-sm md:text-xs text-muted-foreground uppercase tracking-wider font-medium">Responses</span>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleExportCSV(workshop.id, workshop.name)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all active:scale-95 font-medium"
                    title="Export CSV"
                  >
                    <Download className="w-5 h-5" />
                    <span className="sm:hidden text-sm">Export</span>
                  </button>
                  <Link
                    to={`/admin/builder/${workshop.id}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all active:scale-95 shadow-md shadow-primary/20 font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </Link>
                  <Link
                    to={`/f/${workshop.id}`}
                    target="_blank"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-all active:scale-95 font-medium"
                    title="Open Live Form"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span className="sm:hidden text-sm">Open</span>
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
