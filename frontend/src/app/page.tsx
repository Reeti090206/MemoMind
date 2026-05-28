"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  HelpCircle, 
  TrendingUp, 
  Plus, 
  Sparkles,
  ArrowRight, 
  ChevronRight,
  ShieldAlert,
  Award,
  Info
} from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";

// Default initial state
const DEFAULT_WIDGETS = {
  total_meetings: 0,
  unresolved_discussions: 0,
  active_tasks: 0,
  overdue_items: 0,
  total_decisions: 0,
  contradictions_count: 0,
  latest_insight: "All decisions and action plans are currently aligned across the workspace."
};

// Framer Motion Animation Settings
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
};

export default function Dashboard() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const emailParam = user?.email ? `?user_email=${encodeURIComponent(user.email)}` : "";
        const [widgetsRes, meetingsRes, decisionsRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/api/analytics/widgets${emailParam}`),
          fetch(`http://127.0.0.1:8000/api/meetings${emailParam}`),
          fetch(`http://127.0.0.1:8000/api/decisions${emailParam}`)
        ]);

        if (widgetsRes.ok) setWidgets(await widgetsRes.json());
        if (meetingsRes.ok) setMeetings(await meetingsRes.json());
        if (decisionsRes.ok) setDecisions(await decisionsRes.json());
      } catch (err) {
        console.log("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [user]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    return `${mins} min${mins !== 1 ? "s" : ""}`;
  };

  const getFriendlyAlertText = (rawInsight: string) => {
    return (
      <span>
        <strong>Workspace Intelligence Alert:</strong> {rawInsight}
      </span>
    );
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      
      {/* 1. Header Hero Panel */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 bg-[var(--foreground)]/[0.01] border border-[var(--color-obsidian-border)] rounded-3xl backdrop-blur-2xl relative overflow-hidden shadow-2xl"
      >
        {/* Subtle ambient circle inside hero */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyber-purple/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
              <Sparkles className="h-3 w-3 animate-pulse" /> AI Assistant Online
            </span>
          </div>
          <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight leading-none text-glow-cyber">
            Team Memory Overview
          </h2>
          <p className="text-[var(--foreground)]/70 text-sm leading-relaxed">
            Your team's shared memory bank. We keep track of your agreements, action plans, and key decisions from past syncs so you can find them instantly.
          </p>
        </div>
        
        <div className="flex flex-row items-center gap-3 shrink-0 relative z-10">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link 
              href="/upload" 
              className="flex items-center gap-2 px-5 py-3 text-xs bg-gradient-to-tr from-cyber-purple to-cyber-cyan hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all duration-300 rounded-xl text-[var(--foreground)] font-bold tracking-wider uppercase border border-[var(--color-obsidian-border)]"
            >
              <Plus className="h-4 w-4" /> Add Meeting
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* 2. Interactive Friendly AI Smart Alert */}
      <motion.div 
        variants={itemVariants}
        className="p-5 bg-gradient-to-r from-cyber-rose/10 via-cyber-purple/5 to-transparent border border-cyber-rose/15 rounded-2xl relative overflow-hidden group shadow-lg"
      >
        <div className="absolute top-0 right-0 h-full w-[2px] bg-cyber-rose" />
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-cyber-rose/15 border border-cyber-rose/20 flex items-center justify-center shrink-0 shadow-lg">
            <ShieldAlert className="h-5 w-5 text-cyber-rose animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-cyber-rose uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span>💡 Plan Conflict Alert</span>
            </h4>
            <p className="text-[var(--foreground)]/80 text-sm leading-relaxed mt-0.5">
              {getFriendlyAlertText(widgets.latest_insight)}
            </p>
            <div className="pt-2 flex gap-3 text-[11px] font-semibold text-cyber-cyan hover:text-[var(--foreground)] transition-colors cursor-pointer items-center">
              <Link href="/decisions" className="flex items-center gap-1">
                See decision details <ArrowRight className="h-3 w-3 animate-pulse" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Sleek Redesigned Widgets Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Meetings Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, borderColor: "rgba(139, 92, 246, 0.25)", scale: 1.02 }}
          className="p-5 rounded-2xl border border-[var(--color-obsidian-border)] glass-card relative overflow-hidden group transition-all duration-300 shadow-md cursor-pointer bg-transparent"
        >
          <div className="absolute top-[-40px] right-[-40px] w-24 h-24 bg-cyber-purple/5 rounded-full blur-2xl group-hover:bg-cyber-purple/10 transition-colors" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--foreground)]/70 font-bold font-mono uppercase tracking-wider">Meetings Stored</span>
            <div className="h-8 w-8 rounded-lg bg-cyber-purple/10 flex items-center justify-center border border-cyber-purple/20 shadow-sm shrink-0">
              <Calendar className="h-4.5 w-4.5 text-cyber-purple" />
            </div>
          </div>
          <p className="text-3xl font-black text-[var(--foreground)] mt-4 font-mono leading-none tracking-tight">
            {widgets.total_meetings}
          </p>
          <p className="text-[10px] text-cyber-emerald mt-2 font-mono flex items-center gap-1 font-semibold">
            <TrendingUp className="h-3.5 w-3.5" /> Ready to search
          </p>
        </motion.div>

        {/* Pending Decisions Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, borderColor: "rgba(6, 182, 212, 0.25)", scale: 1.02 }}
          className="p-5 rounded-2xl border border-[var(--color-obsidian-border)] glass-card relative overflow-hidden group transition-all duration-300 shadow-md cursor-pointer bg-transparent"
        >
          <div className="absolute top-[-40px] right-[-40px] w-24 h-24 bg-cyber-cyan/5 rounded-full blur-2xl group-hover:bg-cyber-cyan/10 transition-colors" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--foreground)]/70 font-bold font-mono uppercase tracking-wider">Open Questions</span>
            <div className="h-8 w-8 rounded-lg bg-cyber-cyan/10 flex items-center justify-center border border-cyber-cyan/20 shadow-sm shrink-0">
              <HelpCircle className="h-4.5 w-4.5 text-cyber-cyan" />
            </div>
          </div>
          <p className="text-3xl font-black text-[var(--foreground)] mt-4 font-mono leading-none tracking-tight">
            {widgets.unresolved_discussions}
          </p>
          <p className="text-[10px] text-amber-400 mt-2 font-mono flex items-center gap-1 font-semibold">
            <Info className="h-3.5 w-3.5" /> Needs an answer
          </p>
        </motion.div>

        {/* Active Tasks Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, borderColor: "rgba(16, 185, 129, 0.25)", scale: 1.02 }}
          className="p-5 rounded-2xl border border-[var(--color-obsidian-border)] glass-card relative overflow-hidden group transition-all duration-300 shadow-md cursor-pointer bg-transparent"
        >
          <div className="absolute top-[-40px] right-[-40px] w-24 h-24 bg-cyber-emerald/5 rounded-full blur-2xl group-hover:bg-cyber-emerald/10 transition-colors" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--foreground)]/70 font-bold font-mono uppercase tracking-wider">Tasks We Are Doing</span>
            <div className="h-8 w-8 rounded-lg bg-cyber-emerald/10 flex items-center justify-center border border-cyber-emerald/20 shadow-sm shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5 text-cyber-emerald" />
            </div>
          </div>
          <p className="text-3xl font-black text-[var(--foreground)] mt-4 font-mono leading-none tracking-tight">
            {widgets.active_tasks}
          </p>
          <p className="text-[10px] text-cyber-cyan mt-2 font-mono flex items-center gap-1 font-semibold">
            <Clock className="h-3.5 w-3.5" /> Currently running
          </p>
        </motion.div>

        {/* Action Needed Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, borderColor: "rgba(244, 63, 94, 0.25)", scale: 1.02 }}
          className="p-5 rounded-2xl border border-[var(--color-obsidian-border)] glass-card relative overflow-hidden group transition-all duration-300 shadow-md cursor-pointer bg-transparent"
        >
          <div className="absolute top-[-40px] right-[-40px] w-24 h-24 bg-cyber-rose/5 rounded-full blur-2xl group-hover:bg-cyber-rose/10 transition-colors" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--foreground)]/70 font-bold font-mono uppercase tracking-wider">Items Needing Action</span>
            <div className="h-8 w-8 rounded-lg bg-cyber-rose/10 flex items-center justify-center border border-cyber-rose/20 shadow-sm shrink-0">
              <AlertTriangle className="h-4.5 w-4.5 text-cyber-rose" />
            </div>
          </div>
          <p className="text-3xl font-black text-[var(--foreground)] mt-4 font-mono leading-none tracking-tight">
            {widgets.overdue_items}
          </p>
          <p className="text-[10px] text-cyber-rose mt-2 font-mono flex items-center gap-1 font-semibold animate-pulse">
            <ShieldAlert className="h-3.5 w-3.5" /> Past deadline
          </p>
        </motion.div>

      </div>

      {/* 4. Split Dashboard Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Hand: Saved Decisions and Sync feeds */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Timeline of Decisions */}
          <motion.div 
            variants={itemVariants}
            className="p-6 border border-[var(--color-obsidian-border)] bg-transparent glass-card backdrop-blur-md rounded-3xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2.5">
                  <Award className="h-5 w-5 text-cyber-purple" /> Saved Decisions
                </h3>
                <p className="text-xs text-[var(--foreground)]/70 mt-0.5">A history of what your team agreed on and key updates.</p>
              </div>
              <Link href="/decisions" className="text-xs text-cyber-cyan hover:text-[var(--foreground)] flex items-center gap-1 transition-colors font-semibold">
                Explore Decisions <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {decisions.slice(0, 4).map((dec) => {
                const isActive = dec.status === "accepted";
                
                return (
                  <motion.div 
                    key={dec.id} 
                    variants={itemVariants}
                    whileHover={{ scale: 1.01, x: 4, borderColor: "rgba(139, 92, 246, 0.25)" }}
                    className={`p-5 rounded-2xl border transition-all duration-300 ${
                      isActive 
                        ? "bg-[var(--foreground)]/[0.01] border-[var(--color-obsidian-border)]" 
                        : "bg-white/[0.005] border-[var(--color-obsidian-border)] opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div className="space-y-2">
                        <p className={`text-sm leading-relaxed ${isActive ? "text-gray-100 font-semibold" : "text-[var(--foreground)]/50 line-through"}`}>
                          {dec.text}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-[var(--foreground)]/50 font-mono">
                          <span>{dec.date}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--foreground)]/[0.05]" />
                          <span className="text-[var(--foreground)]/70">{dec.meeting_title}</span>
                        </div>
                      </div>
                      
                      {/* State Badges with pulsing indicators */}
                      <span className={`px-3 py-1 rounded-xl text-[9px] font-bold font-mono tracking-wider uppercase flex items-center gap-1.5 shrink-0 border ${
                        isActive
                          ? "bg-cyber-emerald/10 border-cyber-emerald/20 text-cyber-emerald"
                          : "bg-cyber-rose/10 border-cyber-rose/20 text-cyber-rose"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive ? "bg-cyber-emerald animate-ping" : "bg-cyber-rose"}`} />
                        {isActive ? "Active Plan" : "Updated"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Synced Meetings List */}
          <motion.div 
            variants={itemVariants}
            className="p-6 border border-[var(--color-obsidian-border)] bg-transparent glass-card backdrop-blur-md rounded-3xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2.5">
                  <Clock className="h-5 w-5 text-cyber-cyan" /> Recent Meetings
                </h3>
                <p className="text-xs text-[var(--foreground)]/70 mt-0.5">Click any meeting to review what was discussed, read transcripts, and see summaries.</p>
              </div>
              <Link href="/meetings" className="text-xs text-cyber-cyan hover:text-[var(--foreground)] flex items-center gap-1 transition-colors font-semibold">
                All Meetings <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.map((meet) => (
                <motion.div
                  key={meet.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="rounded-2xl"
                >
                  <Link
                    href={`/meetings?id=${meet.id}`}
                    className="block p-5 h-full rounded-2xl border border-[var(--color-obsidian-border)] bg-[var(--foreground)]/[0.01] hover:bg-white/[0.03] hover:border-cyber-purple/20 transition-all duration-300 flex flex-col justify-between gap-4 group shadow-sm"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-[var(--foreground)] group-hover:text-cyber-cyan transition-colors line-clamp-1">{meet.title}</h4>
                        <span className="text-[9px] text-[var(--foreground)]/50 font-mono flex items-center gap-1 shrink-0 bg-[var(--foreground)]/[0.05] px-2 py-0.5 rounded-lg">
                          <Clock className="h-3 w-3" /> {formatDuration(meet.duration)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--foreground)]/70 line-clamp-2 leading-relaxed">
                        {meet.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--color-obsidian-border)] pt-3 mt-1 text-[10px] font-mono text-[var(--foreground)]/50">
                      <span>{meet.date.split(" ")[0]}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple font-semibold">
                        Meeting Smoothness: {meet.efficiency_score}%
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Right Hand: Health and productivity metrics */}
        <div className="space-y-8 col-span-1">
          
          <motion.div 
            variants={itemVariants}
            className="p-6 border border-[var(--color-obsidian-border)] bg-transparent glass-card backdrop-blur-md rounded-3xl space-y-6"
          >
            <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyber-emerald" /> Team Success Stats
            </h3>

            {/* Turnaround speed widget */}
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="p-5 rounded-2xl border border-[var(--color-obsidian-border)] bg-[var(--foreground)]/[0.05] text-center relative overflow-hidden group cursor-pointer shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-cyber-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <p className="text-xs text-[var(--foreground)]/50 uppercase tracking-wider font-mono">Average Agreement Speed</p>
              <p className="text-4xl font-black text-[var(--foreground)] mt-2 font-mono tracking-tighter">20.1 hrs</p>
              <p className="text-[10px] text-cyber-emerald font-mono mt-1 font-semibold flex items-center justify-center gap-1">
                ▲ 8% faster agreement than last week
              </p>
            </motion.div>

            {/* Agreement / Productivity Dial gauges */}
            <div className="space-y-5">
              
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[var(--foreground)]/70">Consistency with Past Decisions</span>
                  <span className="font-bold text-cyber-purple font-mono">85.5%</span>
                </div>
                <div className="h-2 w-full bg-[var(--foreground)]/[0.05] rounded-full overflow-hidden p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "85.5%" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan rounded-full" 
                  />
                </div>
                <p className="text-[9px] text-[var(--foreground)]/50 mt-1 font-mono leading-relaxed">Percentage of new agreements that fit smoothly with our past logs.</p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[var(--foreground)]/70">Meeting Smoothness</span>
                  <span className="font-bold text-cyber-cyan font-mono">85.3%</span>
                </div>
                <div className="h-2 w-full bg-[var(--foreground)]/[0.05] rounded-full overflow-hidden p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "85.3%" }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-emerald rounded-full" 
                  />
                </div>
                <p className="text-[9px] text-[var(--foreground)]/50 mt-1 font-mono leading-relaxed">Measures speaker distribution and clarity of decisions resolved.</p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[var(--foreground)]/70">Team Atmosphere (Debate Level)</span>
                  <span className="font-bold text-cyber-rose font-mono">15.7%</span>
                </div>
                <div className="h-2 w-full bg-[var(--foreground)]/[0.05] rounded-full overflow-hidden p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "15.7%" }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-cyber-rose to-cyber-purple rounded-full" 
                  />
                </div>
                <p className="text-[9px] text-[var(--foreground)]/50 mt-1 font-mono leading-relaxed">Tracks constructive debates or differing views discussed in meetings.</p>
              </div>

            </div>
          </motion.div>

        </div>

      </div>

    </motion.div>
  );
}
