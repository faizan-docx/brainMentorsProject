import { motion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Confetti-like background particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          initial={{
            opacity: 0,
            x: Math.random() * window.innerWidth,
            y: -20,
            backgroundColor: ['#6366f1', '#ec4899', '#3b82f6', '#10b981'][Math.floor(Math.random() * 4)]
          }}
          animate={{
            opacity: [0, 1, 0],
            y: window.innerHeight + 20,
            x: `+=${Math.random() * 200 - 100}`,
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="glass rounded-3xl p-10 max-w-lg w-full text-center space-y-6 shadow-2xl relative z-10 border-t border-white/20"
      >
        <div className="mx-auto bg-gradient-to-tr from-green-400 to-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
          <PartyPopper className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          Thank You!
        </h1>
        
        <div className="space-y-2 text-muted-foreground">
          <p className="text-lg">Your feedback has been successfully submitted.</p>
          <p className="text-sm">
            Your personalized certificate is being generated and will be delivered to your Email and WhatsApp shortly.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
