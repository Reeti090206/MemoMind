"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  Clock, 
  HelpCircle, 
  ShieldAlert, 
  AlertTriangle,
  TrendingUp, 
  User, 
  Calendar,
  Flame,
  Award,
  LineChart,
  HelpCircle as HelpCircleIcon,
  ChevronRight,
  TrendingDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Robust Fallbacks
const MOCK_ANALYTICS = {
  repeated_discussions: [
    { topic: "Authentication Strategy", occurrence_count: 3, warning: "Circular discussion warning: 'Authentication Strategy' has appeared in 3 consecutive syncs (Meeting #1, #2, #3) without a definitive conclusion, impacting decision velocity." },
    { topic: "Real-time Gateway Choice", occurrence_count: 2, warning: "Friction alert: 'Real-time Gateway' has appeared in 2 syncs without consensus between FastAPI and Node." }
  ],
  unresolved_trend: [
    { label: "Project Alpha Kickoff", open: 0, resolved: 0 },
    { label: "Database Deep-Dive", open: 1, resolved: 0 },
    { label: "SaaS Scaling Shift", open: 1, resolved: 1 }
  ],
  speaking_distribution: { "Aman (Backend)": 43, "Reeti (Frontend)": 37, "Sarah (Product)": 20 },
  decision_turnaround: 20.1,
  efficiency_timeline: [
    { date: "2026-05-10", score: 92.0, tension: 8.0, title: "Project Alpha Kickoff & DB Planning" },
    { date: "2026-05-14", score: 78.5, tension: 24.0, title: "Database & Auth Architecture Deep-Dive" },
    { date: "2026-05-18", score: 86.0, tension: 15.0, title: "SaaS Scaling & Microservices Shift" }
  ],
  contradictions_log: [
    { id: 1, meeting_id: 3, description: "Shifted architectural direction: previously decided to 'Avoid microservices' (Meeting #1) to minimize complexity, but recently 'Decided to migrate to microservices' (Meeting #3) for user-profile scaling.", confidence: 0.88 }
  ]
};

const pageContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const panelVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 90, 
      damping: 14 
    } 
  }
};

const itemContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(MOCK_ANALYTICS);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/analytics");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.log("Using mockup fallback for Analytics");
      }
    }
    loadAnalytics();
  }, []);

  return (
    <motion.div 
      variants={pageContainerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      
      {/* Title */}
      <motion.div variants={panelVariants}>
        <h2 className="text-2xl font-bold text-white tracking-tight">System Analytics & Audits</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Evaluate structural alignment quotients, circular discussion loops, speaking parity ratios, and cross-meeting conflicts.
        </p>
      </motion.div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Circular Discussions & Contradictions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Circular Discussion Warnings */}
          <motion.div 
            variants={panelVariants}
            className="p-6 rounded-2xl glass-panel border border-obsidian-border/80 space-y-4 hover:border-cyber-rose/20 transition-all duration-300 relative overflow-hidden bg-obsidian-dark/20"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-rose/5 blur-[50px] rounded-full pointer-events-none" />
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-cyber-rose animate-pulse" /> Circular Topic Detection
            </h3>
            <p className="text-xs text-gray-400">Identifies unresolved topics repeated across meetings causing decision friction.</p>

            <motion.div 
              variants={itemContainerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3.5"
            >
              {data.repeated_discussions && data.repeated_discussions.map((d: any, idx: number) => (
                <motion.div 
                  key={idx} 
                  variants={listItemVariants}
                  whileHover={{ scale: 1.01, x: 2 }}
                  className="p-4 rounded-xl bg-cyber-rose/5 border border-cyber-rose/15 hover:border-cyber-rose/30 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-cyber-rose">
                    <span>TOPIC: {d.topic}</span>
                    <span className="px-2 py-0.5 rounded bg-cyber-rose/10 border border-cyber-rose/25 uppercase font-bold tracking-wider text-[9px]">
                      Mentions: {d.occurrence_count} meetings
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-light font-sans">
                    {d.warning}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Contradiction Log */}
          <motion.div 
            variants={panelVariants}
            className="p-6 rounded-2xl glass-panel border border-obsidian-border/80 space-y-4 hover:border-cyber-purple/20 transition-all duration-300 relative overflow-hidden bg-obsidian-dark/20"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/5 blur-[50px] rounded-full pointer-events-none" />
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-cyber-purple" /> Policy Overrides & Contradictions
            </h3>
            <p className="text-xs text-gray-400">Chronicle of decisions that directly override or modify historical sync resolutions.</p>

            <motion.div 
              variants={itemContainerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {data.contradictions_log && data.contradictions_log.map((log: any) => (
                <motion.div 
                  key={log.id} 
                  variants={listItemVariants}
                  whileHover={{ y: -1 }}
                  className="p-4 rounded-xl bg-obsidian-light/50 border border-obsidian-border hover:border-cyber-purple/25 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyber-purple">
                    <span>Audit Flag #{log.id}</span>
                    <span>Confidence match: {(log.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-light">{log.description}</p>
                  <div className="pt-2 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-gray-500">Flagged in Meeting #{log.meeting_id}</span>
                    <Link href="/decisions" className="text-cyber-cyan hover:text-white hover:underline flex items-center gap-0.5 font-semibold">
                      Trace Lineage <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </motion.div>
              ))}
              {(!data.contradictions_log || data.contradictions_log.length === 0) && (
                <p className="text-xs text-gray-500 italic py-6">No architectural conflicts currently flagged.</p>
              )}
            </motion.div>
          </motion.div>

          {/* Efficiency & Tension timelines */}
          <motion.div 
            variants={panelVariants}
            className="p-6 rounded-2xl glass-panel border border-obsidian-border/80 space-y-4 hover:border-cyber-cyan/20 transition-all duration-300 bg-obsidian-dark/20"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LineChart className="h-5 w-5 text-cyber-cyan animate-pulse" /> Meeting Efficiency Timeline
            </h3>
            <p className="text-xs text-gray-400">Productivity alignments vs team friction scores across history.</p>

            <motion.div 
              variants={itemContainerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 pt-2"
            >
              {data.efficiency_timeline && data.efficiency_timeline.map((meet: any, idx: number) => (
                <motion.div 
                  key={idx} 
                  variants={listItemVariants}
                  whileHover={{ scale: 1.015 }}
                  className="p-4 rounded-xl bg-obsidian-light/40 border border-obsidian-border/80 flex items-center justify-between gap-6 hover:border-cyber-cyan/30 transition-all duration-200"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">{meet.title}</h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">Date: {meet.date}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-gray-500 text-[9px] font-semibold block uppercase tracking-wider">EFFICIENCY</span>
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        className="text-cyber-emerald font-bold"
                      >
                        {meet.score}%
                      </motion.span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 text-[9px] font-semibold block uppercase tracking-wider">FRICTION</span>
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        className="text-cyber-rose font-bold"
                      >
                        {meet.tension}%
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

        </div>

        {/* Right Column: Speaking dominance chart & Turnaround */}
        <div className="space-y-6">
          
          {/* Speaking parity breakdown */}
          <motion.div 
            variants={panelVariants}
            className="p-6 rounded-2xl glass-panel border border-obsidian-border/80 space-y-4 hover:border-cyber-purple/20 transition-all duration-300 bg-obsidian-dark/20"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-cyber-purple" /> Speaking Parity Index
            </h3>
            <p className="text-xs text-gray-400">Speaking dominance percentage tracked across historical interactions.</p>

            <div className="space-y-4 pt-2">
              {data.speaking_distribution && Object.entries(data.speaking_distribution).map(([name, pct]: any, idx: number) => (
                <div key={name} className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400 font-light">{name}</span>
                    <span className="text-white font-bold">{pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 60, damping: 13, delay: 0.3 + idx * 0.1 }}
                      className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Decision turnarounds */}
          <motion.div 
            variants={panelVariants}
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl glass-panel border border-obsidian-border/80 text-center space-y-3 relative overflow-hidden bg-obsidian-dark/30 hover:border-cyber-cyan/35 transition-all duration-300"
          >
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyber-cyan/5 blur-[40px] rounded-full pointer-events-none" />
            <Clock className="h-8 w-8 text-cyber-cyan mx-auto animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Alignment Turnaround Speed</h3>
            <motion.p 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
              className="text-3xl font-black text-white font-mono"
            >
              {data.decision_turnaround} hrs
            </motion.p>
            <p className="text-[10px] text-cyber-emerald leading-relaxed max-w-xs mx-auto">
              Average velocity required to debate, draft, align, and commit a pending decision.
            </p>
          </motion.div>

          {/* Unresolved topic progression widget */}
          <motion.div 
            variants={panelVariants}
            className="p-6 rounded-2xl glass-panel border border-obsidian-border/80 space-y-4 bg-obsidian-dark/20 hover:border-cyber-cyan/15 transition-all duration-300"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <HelpCircleIcon className="h-4.5 w-4.5 text-cyber-cyan" /> Unresolved Open Items
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <motion.div 
                whileHover={{ x: 2 }}
                className="flex justify-between p-2.5 rounded bg-obsidian-light/50 border border-obsidian-border hover:border-obsidian-border/80 transition-colors"
              >
                <span className="text-gray-400">Total Opened</span>
                <span className="text-white font-bold">2 items</span>
              </motion.div>
              <motion.div 
                whileHover={{ x: 2 }}
                className="flex justify-between p-2.5 rounded bg-obsidian-light/50 border border-obsidian-border hover:border-cyber-emerald/10 transition-colors"
              >
                <span className="text-cyber-emerald">Total Resolved</span>
                <span className="text-cyber-emerald font-bold">1 item</span>
              </motion.div>
              <motion.div 
                whileHover={{ x: 2 }}
                className="flex justify-between p-2.5 rounded bg-obsidian-light/50 border border-cyber-rose/10 hover:border-cyber-rose/25 transition-colors"
              >
                <span className="text-cyber-rose">Awaiting Review</span>
                <span className="text-cyber-rose font-bold animate-pulse">1 item</span>
              </motion.div>
            </div>
          </motion.div>

        </div>

      </div>
    </motion.div>
  );
}
