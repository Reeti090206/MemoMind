"use client";

import { useState, useEffect } from "react";
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
import { motion } from "framer-motion";

// Mock fallbacks for robust local rendering
const MOCK_WIDGETS = {
  total_meetings: 3,
  unresolved_discussions: 1,
  active_tasks: 3,
  overdue_items: 2,
  total_decisions: 4,
  contradictions_count: 1,
  latest_insight: "Contradiction alert! Shift in decision detected: Decision on microservices scaling contradicts previous monolithic architecture strategy from Kickoff sync."
};

const MOCK_MEETINGS = [
  { id: 3, title: "SaaS Scaling & Microservices Shift", date: "2026-05-18 11:15", duration: 3240, efficiency_score: 86.0, summary: "Decided to shift to microservices for user profile APIs due to horizontal scale expectations. Clerk OAuth was finalized." },
  { id: 2, title: "Database & Auth Architecture Deep-Dive", date: "2026-05-14 14:30", duration: 2880, efficiency_score: 78.5, summary: "Technical deep-dive on auth setup and database selection. PostgreSQL was chosen. Auth choice deferred due to pricing reviews." },
  { id: 1, title: "Project Alpha Kickoff & DB Planning", date: "2026-05-10 10:00", duration: 3540, efficiency_score: 92.0, summary: "Kickoff sync for Project Alpha. Aman recommended avoiding microservices to minimize initial architecture overhead." }
];

const MOCK_DECISIONS = [
  { id: 3, text: "Migrate core user and feed profile modules to a microservices architecture to support horizontal load scaling.", status: "accepted", meeting_title: "SaaS Scaling & Microservices Shift", date: "2026-05-18" },
  { id: 4, text: "Implement Clerk OAuth for user authentication to accelerate launch speed.", status: "accepted", meeting_title: "SaaS Scaling & Microservices Shift", date: "2026-05-18" },
  { id: 2, text: "Select PostgreSQL as the primary relational database platform instead of SQLite for production durability.", status: "accepted", meeting_title: "Database & Auth Architecture Deep-Dive", date: "2026-05-14" },
  { id: 1, text: "Avoid microservices and build a unified monolithic backend to avoid API gateway and networking overhead.", status: "changed", meeting_title: "Project Alpha Kickoff & DB Planning", date: "2026-05-10" }
];

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
  const [widgets, setWidgets] = useState(MOCK_WIDGETS);
  const [meetings, setMeetings] = useState(MOCK_MEETINGS);
  const [decisions, setDecisions] = useState(MOCK_DECISIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [widgetsRes, meetingsRes, decisionsRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/analytics/widgets"),
          fetch("http://127.0.0.1:8000/api/meetings"),
          fetch("http://127.0.0.1:8000/api/decisions")
        ]);

        if (widgetsRes.ok) setWidgets(await widgetsRes.json());
        if (meetingsRes.ok) setMeetings(await meetingsRes.json());
        if (decisionsRes.ok) setDecisions(await decisionsRes.json());
      } catch (err) {
        console.log("Using dynamic mockup fallbacks for Dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    return `${mins} min${mins !== 1 ? "s" : ""}`;
  };

  // Convert technical raw insights into simple and friendly team statements
  const getFriendlyAlertText = (rawInsight: string) => {
    if (rawInsight.toLowerCase().includes("contradiction")) {
      return (
        <span>
          <strong>Decision Shift Detected:</strong> Your team recently decided to <span className="text-white font-semibold">migrate to microservices</span> (in SaaS Scaling), which changes the earlier plan to <span className="text-gray-400 line-through">avoid microservices</span> discussed during your Project Kickoff.
        </span>
      );
    }
    return rawInsight;
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
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 bg-gradient-to-r from-obsidian-light/80 via-obsidian-light/40 to-cyber-purple/5 border border-white/5 rounded-3xl backdrop-blur-2xl relative overflow-hidden"
      >
        {/* Subtle ambient circle inside hero */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyber-purple/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
              <Sparkles className="h-3 w-3 animate-pulse" /> Team Brain Online
            </span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">
            Team Memory Hub
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your shared organizational memory. We automatically track key decisions, action items, and pending debates from every meeting so your team stays aligned.
          </p>
        </div>
        
        <div className="flex flex-row items-center gap-3 shrink-0 relative z-10">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link 
              href="/upload" 
              className="flex items-center gap-2 px-5 py-3 text-xs bg-gradient-to-tr from-cyber-purple to-cyber-cyan hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all duration-300 rounded-xl text-white font-bold tracking-wider uppercase border border-white/10"
            >
              <Plus className="h-4 w-4" /> Upload Meeting
            </Link>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link 
              href="/search" 
              className="flex items-center gap-2 px-5 py-3 text-xs bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-300 rounded-xl text-gray-200 font-bold tracking-wider uppercase"
            >
              <HelpCircle className="h-4 w-4 text-cyber-cyan" /> Search Memory
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
              <span>💡 Smart Assistant Notification</span>
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed mt-0.5">
              {getFriendlyAlertText(widgets.latest_insight)}
            </p>
            <div className="pt-2 flex gap-3 text-[11px] font-semibold text-cyber-cyan hover:text-white transition-colors cursor-pointer items-center">
              <Link href="/decisions" className="flex items-center gap-1">
                View connected decision lineage <ArrowRight className="h-3 w-3 animate-pulse" />
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
          className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group transition-all duration-300 shadow-md cursor-pointer"
        >
          <div className="absolute top-[-40px] right-[-40px] w-24 h-24 bg-cyber-purple/5 rounded-full blur-2xl group-hover:bg-cyber-purple/10 transition-colors" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-bold font-mono uppercase tracking-wider">Meetings Tracked</span>
            <div className="h-8 w-8 rounded-lg bg-cyber-purple/10 flex items-center justify-center border border-cyber-purple/20 shadow-sm shrink-0">
              <Calendar className="h-4.5 w-4.5 text-cyber-purple" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-4 font-mono leading-none tracking-tight">
            {widgets.total_meetings}
          </p>
          <p className="text-[10px] text-cyber-emerald mt-2 font-mono flex items-center gap-1 font-semibold">
            <TrendingUp className="h-3.5 w-3.5" /> Indexed & searchable
          </p>
        </motion.div>

        {/* Pending Decisions Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, borderColor: "rgba(6, 182, 212, 0.25)", scale: 1.02 }}
          className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group transition-all duration-300 shadow-md cursor-pointer"
        >
          <div className="absolute top-[-40px] right-[-40px] w-24 h-24 bg-cyber-cyan/5 rounded-full blur-2xl group-hover:bg-cyber-cyan/10 transition-colors" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-bold font-mono uppercase tracking-wider">Pending Debates</span>
            <div className="h-8 w-8 rounded-lg bg-cyber-cyan/10 flex items-center justify-center border border-cyber-cyan/20 shadow-sm shrink-0">
              <HelpCircle className="h-4.5 w-4.5 text-cyber-cyan" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-4 font-mono leading-none tracking-tight">
            {widgets.unresolved_discussions}
          </p>
          <p className="text-[10px] text-amber-400 mt-2 font-mono flex items-center gap-1 font-semibold">
            <Info className="h-3.5 w-3.5" /> Awaiting team resolution
          </p>
        </motion.div>

        {/* Active Tasks Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, borderColor: "rgba(16, 185, 129, 0.25)", scale: 1.02 }}
          className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group transition-all duration-300 shadow-md cursor-pointer"
        >
          <div className="absolute top-[-40px] right-[-40px] w-24 h-24 bg-cyber-emerald/5 rounded-full blur-2xl group-hover:bg-cyber-emerald/10 transition-colors" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-bold font-mono uppercase tracking-wider">Assigned Tasks</span>
            <div className="h-8 w-8 rounded-lg bg-cyber-emerald/10 flex items-center justify-center border border-cyber-emerald/20 shadow-sm shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5 text-cyber-emerald" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-4 font-mono leading-none tracking-tight">
            {widgets.active_tasks}
          </p>
          <p className="text-[10px] text-cyber-cyan mt-2 font-mono flex items-center gap-1 font-semibold">
            <Clock className="h-3.5 w-3.5" /> Currently in progress
          </p>
        </motion.div>

        {/* Action Needed Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4, borderColor: "rgba(244, 63, 94, 0.25)", scale: 1.02 }}
          className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group transition-all duration-300 shadow-md cursor-pointer"
        >
          <div className="absolute top-[-40px] right-[-40px] w-24 h-24 bg-cyber-rose/5 rounded-full blur-2xl group-hover:bg-cyber-rose/10 transition-colors" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-bold font-mono uppercase tracking-wider">Action Required</span>
            <div className="h-8 w-8 rounded-lg bg-cyber-rose/10 flex items-center justify-center border border-cyber-rose/20 shadow-sm shrink-0">
              <AlertTriangle className="h-4.5 w-4.5 text-cyber-rose" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-4 font-mono leading-none tracking-tight">
            {widgets.overdue_items}
          </p>
          <p className="text-[10px] text-cyber-rose mt-2 font-mono flex items-center gap-1 font-semibold animate-pulse">
            <ShieldAlert className="h-3.5 w-3.5" /> Action items overdue
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
            className="p-6 border border-white/5 bg-white/[0.01] backdrop-blur-md rounded-3xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <Award className="h-5 w-5 text-cyber-purple" /> Saved Team Decisions
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Timeline of alignments, tech stacks, and direction shifts.</p>
              </div>
              <Link href="/decisions" className="text-xs text-cyber-cyan hover:text-white flex items-center gap-1 transition-colors font-semibold">
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
                        ? "bg-white/[0.01] border-white/5" 
                        : "bg-obsidian-light/20 border-white/5 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div className="space-y-2">
                        <p className={`text-sm leading-relaxed ${isActive ? "text-gray-100 font-semibold" : "text-gray-500 line-through"}`}>
                          {dec.text}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-gray-500 font-mono">
                          <span>{dec.date}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-white/5" />
                          <span className="text-gray-400">{dec.meeting_title}</span>
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
            className="p-6 border border-white/5 bg-white/[0.01] backdrop-blur-md rounded-3xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <Clock className="h-5 w-5 text-cyber-cyan" /> Recent Meeting Feeds
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Click a session to review transcripts, speaker diarization, and notes.</p>
              </div>
              <Link href="/meetings" className="text-xs text-cyber-cyan hover:text-white flex items-center gap-1 transition-colors font-semibold">
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
                    className="block p-5 h-full rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-cyber-purple/20 transition-all duration-300 flex flex-col justify-between gap-4 group shadow-sm"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-white group-hover:text-cyber-cyan transition-colors line-clamp-1">{meet.title}</h4>
                        <span className="text-[9px] text-gray-500 font-mono flex items-center gap-1 shrink-0 bg-white/5 px-2 py-0.5 rounded-lg">
                          <Clock className="h-3 w-3" /> {formatDuration(meet.duration)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {meet.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1 text-[10px] font-mono text-gray-500">
                      <span>{meet.date.split(" ")[0]}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple font-semibold">
                        Productivity: {meet.efficiency_score}%
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
            className="p-6 border border-white/5 bg-white/[0.01] backdrop-blur-md rounded-3xl space-y-6"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyber-emerald" /> Team Alignment Metrics
            </h3>

            {/* Turnaround speed widget */}
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="p-5 rounded-2xl border border-white/5 bg-white/5 text-center relative overflow-hidden group cursor-pointer shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-cyber-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">Average Decision Speed</p>
              <p className="text-4xl font-black text-white mt-2 font-mono tracking-tighter">20.1 hrs</p>
              <p className="text-[10px] text-cyber-emerald font-mono mt-1 font-semibold flex items-center justify-center gap-1">
                ▲ 8% faster alignment than last week
              </p>
            </motion.div>

            {/* Agreement / Productivity Dial gauges */}
            <div className="space-y-5">
              
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Meeting Consistency Rate</span>
                  <span className="font-bold text-cyber-purple font-mono">85.5%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "85.5%" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan rounded-full" 
                  />
                </div>
                <p className="text-[9px] text-gray-500 mt-1 font-mono leading-relaxed">Percentage of new decisions that successfully align with historic logs.</p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Meeting Productivity Score</span>
                  <span className="font-bold text-cyber-cyan font-mono">85.3%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "85.3%" }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-emerald rounded-full" 
                  />
                </div>
                <p className="text-[9px] text-gray-500 mt-1 font-mono leading-relaxed">Average efficiency scored across speaker distribution and resolved items.</p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Discussion Debate Intensity</span>
                  <span className="font-bold text-cyber-rose font-mono">15.7%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "15.7%" }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-cyber-rose to-cyber-purple rounded-full" 
                  />
                </div>
                <p className="text-[9px] text-gray-500 mt-1 font-mono leading-relaxed">Measures conflicting opinions or arguments logged during syncs.</p>
              </div>

            </div>
          </motion.div>

          {/* Premium Search / Memory AI CTA */}
          <motion.div 
            variants={itemVariants}
            className="p-6 rounded-3xl bg-gradient-to-br from-cyber-purple/15 via-cyber-cyan/15 to-transparent border border-cyber-purple/20 relative overflow-hidden group shadow-lg"
          >
            {/* Background floating sparkles */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="h-16 w-16 text-cyber-cyan" />
            </div>
            
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyber-cyan animate-pulse" /> Ask Your Team Memory
            </h3>
            
            <p className="text-xs text-gray-300 mt-2.5 leading-relaxed">
              Have a question about a past sync? Simply query your shared brain. We index every sentence so you can trace alignments instantly.
            </p>
            
            <blockquote className="mt-3.5 p-3 rounded-xl bg-black/35 border border-white/5 text-[11px] text-gray-400 font-mono leading-normal italic">
              "When did we discuss switching to Clerk and what was the main concern?"
            </blockquote>
            
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-4">
              <Link
                href="/search"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white hover:bg-gray-100 transition-all duration-300 rounded-xl text-obsidian-dark text-xs font-black uppercase tracking-wider border border-white/10"
              >
                Open AI Chat <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </motion.div>

        </div>

      </div>

    </motion.div>
  );
}
