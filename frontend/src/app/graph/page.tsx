"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getApiBase } from "@/lib/apiClient";
import { 
  BarChart3, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Info,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Calendar,
  Layers,
  Heart,
  CheckCircle,
  Maximize2,
  Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SPEAKER_COLORS = [
  "text-cyber-purple bg-cyber-purple/10 border-cyber-purple/20 stroke-cyber-purple fill-cyber-purple",
  "text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/20 stroke-cyber-cyan fill-cyber-cyan",
  "text-cyber-emerald bg-cyber-emerald/10 border-cyber-emerald/20 stroke-cyber-emerald fill-cyber-emerald",
  "text-cyber-rose bg-cyber-rose/10 border-cyber-rose/20 stroke-cyber-rose fill-cyber-rose",
  "text-amber-400 bg-amber-400/10 border-amber-400/20 stroke-amber-400 fill-amber-400",
  "text-sky-400 bg-sky-400/10 border-sky-400/20 stroke-sky-400 fill-sky-400"
];

const SPEAKER_COLOR_VALUES = [
  "#eca72c", // Cyber-Purple (mapped to highlight/gold)
  "#ee5622", // Cyber-Cyan (mapped to accent/orange)
  "#10b981", // Cyber-Emerald
  "#f43f5e", // Cyber-Rose
  "#fbbf24", // Amber
  "#38bdf8"  // Sky
];

const pageContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const fadeUpVariants = {
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

export default function MeetingCharts() {
  const { user } = useAuth();
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("none");
  const [meetingData, setMeetingData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "decisions" | "unresolved">("tasks");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedChart, setExpandedChart] = useState<"health" | "speaking" | "timeline" | null>(null);

  // 1. Real-time Database Listener: Poll the list of meetings
  useEffect(() => {
    let active = true;

    async function loadMeetings() {
      try {
        const url = user?.email
          ? `${getApiBase()}/api/meetings?user_email=${encodeURIComponent(user.email)}`
          : `${getApiBase()}/api/meetings`;
        const res = await fetch(url);
        if (res.ok && active) {
          const list = await res.json();
          setMeetingsList(list);
          setIsLoading(false);
          
          // Auto-select first meeting if none is currently selected
          if (list.length > 0 && selectedMeetingId === "none") {
            setSelectedMeetingId(list[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to load meetings list", err);
      }
    }

    loadMeetings();
    const interval = setInterval(loadMeetings, 2500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, selectedMeetingId]);

  // 2. Real-time Database Listener: Poll selected meeting details
  useEffect(() => {
    if (selectedMeetingId === "none" || selectedMeetingId === "all") return;
    let active = true;

    async function loadMeetingDetails() {
      try {
        const res = await fetch(`${getApiBase()}/api/meetings/${selectedMeetingId}`);
        if (res.ok && active) {
          const data = await res.json();
          setMeetingData(data);
        }
      } catch (err) {
        console.error("Failed to load meeting details", err);
      }
    }

    loadMeetingDetails();
    const interval = setInterval(loadMeetingDetails, 2500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedMeetingId]);

  // Handle Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-[50vh] gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-[var(--color-obsidian-border)] border-t-cyber-purple animate-spin" />
        <p className="text-xs font-mono text-[var(--foreground)]/50 uppercase tracking-widest animate-pulse">
          Loading Analytics Dashboard...
        </p>
      </div>
    );
  }

  // Handle Empty State
  if (meetingsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-[50vh] gap-6 p-8 glass-panel border border-[var(--color-obsidian-border)] rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyber-purple/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="h-16 w-16 rounded-2xl bg-[var(--foreground)]/[0.02] border border-[var(--color-obsidian-border)] flex items-center justify-center text-gray-500 shadow-inner">
          <BarChart3 className="h-8 w-8 text-cyber-purple animate-pulse" />
        </div>
        <p className="text-base font-semibold text-[var(--foreground)]/90 max-w-md tracking-wide leading-relaxed">
          No analytics available yet. Analyze a meeting to generate insights.
        </p>
      </div>
    );
  }

  // Safe data access
  const efficiency = meetingData?.efficiency_score || 0;
  const tension = meetingData?.tension_score || 0;
  const speakerStats = meetingData?.speaker_stats || {};
  const segments = meetingData?.segments || [];
  const decisions = meetingData?.decisions || [];
  const tasks = meetingData?.tasks || [];
  const contradictions = meetingData?.contradictions || [];
  const unresolved = meetingData?.unresolved_topics || [];
  const duration = meetingData?.duration || (segments.length > 0 ? segments[segments.length - 1].end_time : 0) || 60;

  // Task KPI calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === "done").length;
  const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Task Priority counts
  const highPriority = tasks.filter((t: any) => t.priority === "high").length;
  const mediumPriority = tasks.filter((t: any) => t.priority === "medium" || t.priority === "default" || !t.priority).length;
  const lowPriority = tasks.filter((t: any) => t.priority === "low").length;

  // Calculate speaking Donut segments
  let accumulatedPercent = 0;
  const speakersList = Object.entries(speakerStats);
  const totalSpeakerPct = speakersList.reduce((sum, [_, val]) => sum + Number(val), 0) || 100;
  
  const donutCircles = speakersList.map(([speaker, percent], idx) => {
    const p = (Number(percent) / totalSpeakerPct) * 100;
    const color = SPEAKER_COLOR_VALUES[idx % SPEAKER_COLOR_VALUES.length];
    const radius = 60;
    const circ = 2 * Math.PI * radius;
    const strokeDashArray = `${(p / 100) * circ} ${circ}`;
    const strokeDashOffset = -((accumulatedPercent / 100) * circ);
    accumulatedPercent += p;
    
    return (
      <circle
        key={speaker}
        cx="100"
        cy="100"
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={strokeDashArray}
        strokeDashoffset={strokeDashOffset}
        transform="rotate(-90 100 100)"
        className="transition-all duration-500 ease-out hover:stroke-[16px] cursor-pointer"
      />
    );
  });

  return (
    <motion.div 
      variants={pageContainerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header controls with meeting selector */}
      <motion.div 
        variants={fadeUpVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-[var(--color-obsidian-border)]"
      >
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Meeting Charts & Analytics</h2>
          <p className="text-[var(--foreground)]/60 text-xs mt-0.5 font-light">
            Real-time, meeting-specific dialogue timeline, speaking distribution, and extracted accountability tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-mono font-bold uppercase text-[var(--foreground)]/60 whitespace-nowrap">Selected Sync:</label>
          <select
            value={selectedMeetingId}
            onChange={(e) => setSelectedMeetingId(e.target.value)}
            className="bg-black/65 border border-[var(--color-obsidian-border)] rounded-xl px-4 py-2.5 text-xs font-bold text-[var(--foreground)] focus:outline-none focus:border-cyber-purple transition-all cursor-pointer min-w-[240px] max-w-[340px]"
          >
            {meetingsList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Main metrics & charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Health Gauges & counters */}
        <motion.div variants={fadeUpVariants} className="space-y-6 lg:col-span-1">
          
          {/* Health gauges panel */}
          <div className="p-6 rounded-2xl glass-panel border border-[var(--color-obsidian-border)] bg-obsidian-dark/20 relative overflow-hidden flex flex-col justify-between h-[360px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyber-purple" /> Sync Health Scores
              </h3>
              <button
                onClick={() => setExpandedChart("health")}
                className="p-1 rounded-lg bg-[var(--foreground)]/[0.03] hover:bg-[var(--foreground)]/[0.08] text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors border border-[var(--color-obsidian-border)] cursor-pointer"
                title="Expand Chart"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Side-by-side circular progress gauges */}
            <div className="flex justify-around items-center py-4 relative z-10 flex-1">
              
              {/* Efficiency Score Gauge */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-28 w-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="46" 
                      stroke="#10b981" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 46}
                      strokeDashoffset={(2 * Math.PI * 46) * (1 - efficiency / 100)}
                      className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-black text-[var(--foreground)] font-mono">{efficiency}%</span>
                    <span className="text-[8px] font-mono text-[var(--foreground)]/50 uppercase tracking-widest">Efficiency</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-cyber-emerald uppercase tracking-wider">Productive</span>
              </div>

              {/* Tension Score Gauge */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-28 w-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="46" 
                      stroke={tension > 45 ? "#f43f5e" : tension > 20 ? "#eca72c" : "#ee5622"} 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 46}
                      strokeDashoffset={(2 * Math.PI * 46) * (1 - tension / 100)}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-black text-[var(--foreground)] font-mono">{tension}%</span>
                    <span className="text-[8px] font-mono text-[var(--foreground)]/50 uppercase tracking-widest">Debate</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  tension > 45 ? "text-cyber-rose animate-pulse" : tension > 20 ? "text-cyber-purple" : "text-cyber-cyan"
                }`}>
                  {tension > 45 ? "Conflict Alert" : tension > 20 ? "High Debate" : "Harmonious"}
                </span>
              </div>

            </div>

            <div className="p-3 bg-obsidian-light/35 border border-[var(--color-obsidian-border)] rounded-xl text-[9px] text-[var(--foreground)]/60 font-mono leading-relaxed relative z-10">
              💡 Scores are extracted using linguistic markers. Tension indicators count disagreement terms.
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="p-5 rounded-2xl glass-panel border border-[var(--color-obsidian-border)] bg-obsidian-dark/20 space-y-4">
            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase font-mono tracking-wider">
              Extracted Counters
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-obsidian-dark/45 border border-[var(--color-obsidian-border)] rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-[var(--foreground)]/50 uppercase tracking-wider">Decisions</span>
                <span className="text-2xl font-black text-cyber-cyan font-mono mt-1">{decisions.length}</span>
              </div>
              <div className="p-3.5 bg-obsidian-dark/45 border border-[var(--color-obsidian-border)] rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-[var(--foreground)]/50 uppercase tracking-wider">Action Items</span>
                <span className="text-2xl font-black text-cyber-emerald font-mono mt-1">{totalTasks}</span>
              </div>
              <div className="p-3.5 bg-obsidian-dark/45 border border-[var(--color-obsidian-border)] rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-[var(--foreground)]/50 uppercase tracking-wider">Pending Topics</span>
                <span className="text-2xl font-black text-cyber-purple font-mono mt-1">{unresolved.length}</span>
              </div>
              <div className="p-3.5 bg-obsidian-dark/45 border border-[var(--color-obsidian-border)] rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-[var(--foreground)]/50 uppercase tracking-wider">Conflicts</span>
                <span className={`text-2xl font-black font-mono mt-1 ${contradictions.length > 0 ? "text-cyber-rose animate-pulse" : "text-[var(--foreground)]/30"}`}>{contradictions.length}</span>
              </div>
            </div>
          </div>

        </motion.div>

        {/* Right Column (Span 2): Donut and Chronological Timeline */}
        <motion.div variants={fadeUpVariants} className="space-y-6 lg:col-span-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Donut Chart speaking times */}
            <div className="p-6 rounded-2xl glass-panel border border-[var(--color-obsidian-border)] bg-obsidian-dark/20 flex flex-col justify-between h-[360px]">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-xs font-bold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyber-cyan" /> Speaking Distribution
                </h3>
                <button
                  onClick={() => setExpandedChart("speaking")}
                  className="p-1 rounded-lg bg-[var(--foreground)]/[0.03] hover:bg-[var(--foreground)]/[0.08] text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors border border-[var(--color-obsidian-border)] cursor-pointer"
                  title="Expand Chart"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {speakersList.length > 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-2">
                  <div className="relative h-40 w-40 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 200 200">
                      {/* Inner border track */}
                      <circle cx="100" cy="100" r="60" stroke="rgba(255,255,255,0.01)" strokeWidth="12" fill="transparent" />
                      {donutCircles}
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xs font-mono text-[var(--foreground)]/50 uppercase tracking-widest">Active</span>
                      <span className="text-sm font-black text-[var(--foreground)]">{speakersList.length} Speaker{speakersList.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 text-xs py-8 gap-1.5">
                  <Info className="h-6 w-6 text-gray-600 animate-pulse" />
                  <span>No speaking distribution data available.</span>
                </div>
              )}
            </div>

            {/* Donut Legend / Speaker List */}
            <div className="p-6 rounded-2xl glass-panel border border-[var(--color-obsidian-border)] bg-obsidian-dark/20 flex flex-col h-[360px] overflow-y-auto">
              <h3 className="text-xs font-bold text-[var(--foreground)] uppercase font-mono tracking-wider mb-4">
                Participants & Speaking Share
              </h3>

              {speakersList.length > 0 ? (
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {speakersList.map(([speaker, percent], idx) => {
                    const p = Math.round((Number(percent) / totalSpeakerPct) * 100);
                    const colorVal = SPEAKER_COLOR_VALUES[idx % SPEAKER_COLOR_VALUES.length];
                    const badgeClass = SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
                    
                    return (
                      <div 
                        key={speaker}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--color-obsidian-border)] bg-obsidian-dark/45 hover:bg-obsidian-light/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span 
                            style={{ backgroundColor: colorVal }} 
                            className="h-3 w-3 rounded-full shrink-0 shadow-sm" 
                          />
                          <span className="text-xs font-bold text-[var(--foreground)] truncate">{speaker}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeClass}`}>
                          {p}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-gray-500 text-xs py-8">
                  No participants detected.
                </div>
              )}
            </div>

          </div>

          {/* Timeline dialogue tracker */}
          <div className="p-6 rounded-2xl glass-panel border border-[var(--color-obsidian-border)] bg-obsidian-dark/20 space-y-4">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xs font-bold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyber-rose" /> Dialogue Timeline Chronology
              </h3>
              <button
                onClick={() => setExpandedChart("timeline")}
                className="p-1 rounded-lg bg-[var(--foreground)]/[0.03] hover:bg-[var(--foreground)]/[0.08] text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors border border-[var(--color-obsidian-border)] cursor-pointer"
                title="Expand Chart"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {segments.length > 0 ? (
              <div className="space-y-4">
                {/* Horizontal chronology track */}
                <div className="relative h-8 w-full bg-obsidian-dark/75 border border-[var(--color-obsidian-border)] rounded-xl overflow-hidden flex shadow-inner">
                  {segments.map((seg: any, idx: number) => {
                    const startPct = (seg.start_time / duration) * 100;
                    const widthPct = ((seg.end_time - seg.start_time) / duration) * 100;
                    const speakerIdx = speakersList.findIndex(([name]) => name === seg.speaker_label);
                    const colorVal = SPEAKER_COLOR_VALUES[speakerIdx !== -1 ? speakerIdx : idx % SPEAKER_COLOR_VALUES.length];
                    
                    return (
                      <div
                        key={idx}
                        style={{
                          width: `${Math.max(widthPct, 0.4)}%`,
                          backgroundColor: colorVal,
                        }}
                        className="h-full border-r border-obsidian-dark/30 relative group transition-all hover:brightness-125 cursor-pointer"
                        title={`${seg.speaker_label} (${Math.round(seg.start_time)}s - ${Math.round(seg.end_time)}s)`}
                      />
                    );
                  })}
                </div>

                {/* Subtitle labels */}
                <div className="flex items-center justify-between text-[8px] font-mono text-[var(--foreground)]/40 px-1 uppercase tracking-widest">
                  <span>Start (0:00)</span>
                  <span>Timeline Flow</span>
                  <span>End ({Math.floor(duration / 60)}m {Math.floor(duration % 60)}s)</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 text-xs border border-dashed border-[var(--color-obsidian-border)] rounded-xl">
                No conversation timeline fragments available.
              </div>
            )}
          </div>

        </motion.div>

      </div>

      {/* Task status board & priority breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task progress metrics */}
        <motion.div variants={fadeUpVariants} className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl glass-panel border border-[var(--color-obsidian-border)] bg-obsidian-dark/20 space-y-5">
            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyber-emerald" /> Action Items Progress
            </h3>

            {totalTasks > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--foreground)]/70">Completion Rate</span>
                  <span className="text-sm font-black text-cyber-emerald font-mono">{taskCompletionPct}%</span>
                </div>
                
                {/* Progress bar wrapper */}
                <div className="h-2.5 w-full bg-obsidian-dark/75 rounded-full overflow-hidden p-[1px] border border-[var(--color-obsidian-border)]">
                  <div 
                    style={{ width: `${taskCompletionPct}%` }}
                    className="h-full bg-gradient-to-r from-cyber-purple to-cyber-emerald rounded-full transition-all duration-1000 ease-out" 
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-[var(--foreground)]/50 pt-1">
                  <span>{completedTasks} Completed</span>
                  <span>{totalTasks - completedTasks} Pending</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-xs border border-dashed border-[var(--color-obsidian-border)] rounded-xl">
                No tasks assigned in this session.
              </div>
            )}
          </div>

          {/* Priority Breakdown Bar Chart */}
          <div className="p-6 rounded-2xl glass-panel border border-[var(--color-obsidian-border)] bg-obsidian-dark/20 space-y-4">
            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase font-mono tracking-wider">
              Priority Breakdown
            </h3>

            {totalTasks > 0 ? (
              <div className="space-y-3.5">
                
                {/* High Priority Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--foreground)]/70">
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-cyber-rose" /> High</span>
                    <span>{highPriority} Task{highPriority !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-2 w-full bg-obsidian-dark/75 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${totalTasks > 0 ? (highPriority / totalTasks) * 100 : 0}%` }} 
                      className="h-full bg-cyber-rose rounded-full transition-all duration-1000" 
                    />
                  </div>
                </div>

                {/* Medium Priority Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--foreground)]/70">
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-cyber-purple" /> Medium</span>
                    <span>{mediumPriority} Task{mediumPriority !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-2 w-full bg-obsidian-dark/75 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${totalTasks > 0 ? (mediumPriority / totalTasks) * 100 : 0}%` }} 
                      className="h-full bg-cyber-purple rounded-full transition-all duration-1000" 
                    />
                  </div>
                </div>

                {/* Low Priority Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--foreground)]/70">
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-cyber-cyan" /> Low</span>
                    <span>{lowPriority} Task{lowPriority !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-2 w-full bg-obsidian-dark/75 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${totalTasks > 0 ? (lowPriority / totalTasks) * 100 : 0}%` }} 
                      className="h-full bg-cyber-cyan rounded-full transition-all duration-1000" 
                    />
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-xs border border-dashed border-[var(--color-obsidian-border)] rounded-xl">
                No items to evaluate.
              </div>
            )}
          </div>
        </motion.div>

        {/* Detailed Tabs lists: Tasks / Decisions / Unresolved */}
        <motion.div variants={fadeUpVariants} className="lg:col-span-2">
          <div className="p-6 rounded-2xl glass-panel border border-[var(--color-obsidian-border)] bg-obsidian-dark/20 h-full flex flex-col justify-between min-h-[380px]">
            
            {/* Header Tabs toggles */}
            <div className="flex items-center justify-between border-b border-[var(--color-obsidian-border)] pb-3 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "tasks" ? "bg-cyber-emerald/15 text-cyber-emerald border border-cyber-emerald/25" : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
                  }`}
                >
                  Action Items ({totalTasks})
                </button>
                <button
                  onClick={() => setActiveTab("decisions")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "decisions" ? "bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/25" : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
                  }`}
                >
                  Decisions ({decisions.length})
                </button>
                <button
                  onClick={() => setActiveTab("unresolved")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "unresolved" ? "bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/25" : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
                  }`}
                >
                  Deferred Topics ({unresolved.length})
                </button>
              </div>

              {contradictions.length > 0 && activeTab === "decisions" && (
                <span className="px-2 py-0.5 rounded bg-cyber-rose/15 border border-cyber-rose/30 text-cyber-rose font-mono text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1 font-bold">
                  <ShieldAlert className="h-3 w-3" /> {contradictions.length} Conflict{contradictions.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Tab content space */}
            <div className="flex-1 overflow-y-auto pt-4 max-h-[260px] pr-1">
              <AnimatePresence mode="wait">
                
                {/* 1. Action Items tab */}
                {activeTab === "tasks" && (
                  <motion.div
                    key="tasks"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {tasks.length > 0 ? (
                      tasks.map((t: any) => (
                        <div 
                          key={t.id} 
                          className="p-3 bg-obsidian-dark/45 border border-[var(--color-obsidian-border)] rounded-xl flex items-center justify-between gap-4 hover:border-obsidian-light/30 transition-colors"
                        >
                          <div className="min-w-0 space-y-1">
                            <h4 className="text-xs font-bold text-[var(--foreground)] truncate leading-tight pr-2">{t.title}</h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-mono text-[var(--foreground)]/50 flex items-center gap-1">
                                <Users className="h-2.5 w-2.5 text-cyber-cyan" /> {t.owner || "Unassigned"}
                              </span>
                              <span className="text-[9px] font-mono text-[var(--foreground)]/50 flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5 text-cyber-purple" /> {t.deadline || "No deadline"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Priority Indicator */}
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold border ${
                              t.priority === "high" ? "bg-cyber-rose/10 border-cyber-rose/25 text-cyber-rose" :
                              t.priority === "low" ? "bg-cyber-cyan/10 border-cyber-cyan/25 text-cyber-cyan" :
                              "bg-cyber-purple/10 border-cyber-purple/25 text-cyber-purple"
                            }`}>
                              {t.priority || "Medium"}
                            </span>

                            {/* Status Indicator */}
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold border flex items-center gap-1 ${
                              t.status === "done" ? "bg-cyber-emerald/10 border-cyber-emerald/25 text-cyber-emerald" :
                              t.status === "progress" ? "bg-amber-400/10 border-amber-400/25 text-amber-400" :
                              "bg-[var(--foreground)]/[0.03] border-[var(--color-obsidian-border)] text-[var(--foreground)]/40"
                            }`}>
                              {t.status === "done" && <CheckCircle className="h-2.5 w-2.5" />}
                              {t.status || "Todo"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-500 text-xs border border-dashed border-[var(--color-obsidian-border)] rounded-xl flex flex-col items-center gap-2">
                        <Info className="h-5 w-5 text-gray-600 animate-pulse" />
                        <span>No action items extracted for this meeting.</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 2. Decisions & Overrides tab */}
                {activeTab === "decisions" && (
                  <motion.div
                    key="decisions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Contradiction alerts at the top of decisions */}
                    {contradictions.length > 0 && (
                      <div className="p-3.5 bg-cyber-rose/5 border border-cyber-rose/20 rounded-xl space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyber-rose flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5 animate-bounce" /> Plan Contradiction Warning
                        </span>
                        <div className="space-y-2">
                          {contradictions.map((c: any) => (
                            <div key={c.id} className="text-[11px] text-[var(--foreground)]/80 leading-relaxed border-l-2 border-cyber-rose/40 pl-3">
                              {c.description} <span className="text-[9px] font-mono text-[var(--foreground)]/40">(Confidence: {c.confidence_score || c.confidence})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {decisions.length > 0 ? (
                      <div className="space-y-2.5">
                        {decisions.map((d: any) => (
                          <div 
                            key={d.id} 
                            className="p-3 bg-obsidian-dark/45 border border-[var(--color-obsidian-border)] rounded-xl hover:border-obsidian-light/30 transition-colors space-y-1.5"
                          >
                            <h4 className="text-xs font-bold text-[var(--foreground)] leading-relaxed">{d.text}</h4>
                            <div className="flex items-center justify-between text-[9px] font-mono">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold border ${
                                d.status === "accepted" ? "bg-cyber-emerald/10 border-cyber-emerald/20 text-cyber-emerald" : "bg-cyber-rose/10 border-cyber-rose/20 text-cyber-rose"
                              }`}>
                                {d.status || "Accepted"}
                              </span>
                              
                              {d.overrides_decision_id && (
                                <span className="text-cyber-rose font-semibold flex items-center gap-0.5 uppercase tracking-wider text-[8px]">
                                  Overrides Past Decision #{d.overrides_decision_id} <ArrowRight className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500 text-xs border border-dashed border-[var(--color-obsidian-border)] rounded-xl flex flex-col items-center gap-2">
                        <Info className="h-5 w-5 text-gray-600" />
                        <span>No decisions extracted for this meeting.</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. Deferred Topics tab */}
                {activeTab === "unresolved" && (
                  <motion.div
                    key="unresolved"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {unresolved.length > 0 ? (
                      unresolved.map((ut: any) => (
                        <div 
                          key={ut.id} 
                          className="p-3 bg-obsidian-dark/45 border border-[var(--color-obsidian-border)] rounded-xl space-y-1 hover:border-obsidian-light/30 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-xs font-bold text-[var(--foreground)] leading-tight">{ut.topic_name || "Unresolved Topic"}</h4>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold border bg-cyber-purple/10 border-cyber-purple/20 text-cyber-purple shrink-0">
                              {ut.status || "Open"}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--foreground)]/70 leading-relaxed font-sans">{ut.context}</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-500 text-xs border border-dashed border-[var(--color-obsidian-border)] rounded-xl flex flex-col items-center gap-2">
                        <Info className="h-5 w-5 text-gray-600" />
                        <span>All topics fully resolved in this session.</span>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
            
            <div className="pt-2 border-t border-[var(--color-obsidian-border)] text-[9px] font-mono text-[var(--foreground)]/50 leading-relaxed shrink-0">
              ⚡ Action items and status boards are synchronized automatically with the database index.
            </div>

          </div>
        </motion.div>

      </div>

      {/* Sliding Dialog Modal for Expanded Charts */}
      <AnimatePresence>
        {expandedChart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedChart(null)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />
            
            {/* Modal Body Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="w-full max-w-4xl bg-obsidian-dark/95 border border-[var(--color-obsidian-border)] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] z-10 glass-panel"
            >
              {/* Decorative radial lighting in modal */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyber-purple/10 blur-[80px] rounded-full pointer-events-none" />
              
              {/* Close Button */}
              <button
                onClick={() => setExpandedChart(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-[var(--foreground)]/[0.05] hover:bg-cyber-rose/10 text-[var(--foreground)]/70 hover:text-cyber-rose border border-[var(--color-obsidian-border)] hover:border-cyber-rose/25 transition-all shadow-md z-20 shrink-0 cursor-pointer"
                title="Collapse Chart"
              >
                <Minimize2 className="h-5 w-5" />
              </button>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto pr-1">
                {expandedChart === "health" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-2">
                        <Activity className="h-5 w-5 text-cyber-purple" /> Sync Health Scores (Expanded View)
                      </h3>
                      <p className="text-xs text-[var(--foreground)]/50 mt-1 font-light">Deep semantic diagnostic analysis of collaboration metrics.</p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-around items-center gap-8 py-8">
                      {/* Efficiency Score Gauge */}
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative h-44 w-44 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="88" cy="88" r="76" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                            <circle 
                              cx="88" 
                              cy="88" 
                              r="76" 
                              stroke="#10b981" 
                              strokeWidth="12" 
                              fill="transparent" 
                              strokeDasharray={2 * Math.PI * 76}
                              strokeDashoffset={(2 * Math.PI * 76) * (1 - efficiency / 100)}
                              className="transition-all duration-1000 ease-out drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-black text-[var(--foreground)] font-mono">{efficiency}%</span>
                            <span className="text-[10px] font-mono text-[var(--foreground)]/50 uppercase tracking-widest mt-1">Efficiency</span>
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <span className="text-xs font-bold text-cyber-emerald uppercase tracking-wider block">Productive</span>
                          <p className="text-[11px] text-[var(--foreground)]/60 max-w-xs leading-relaxed">
                            Computed by checking tasks created relative to unresolved items originating in the meeting.
                          </p>
                        </div>
                      </div>

                      {/* Tension Score Gauge */}
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative h-44 w-44 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="88" cy="88" r="76" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                            <circle 
                              cx="88" 
                              cy="88" 
                              r="76" 
                              stroke={tension > 45 ? "#f43f5e" : tension > 20 ? "#eca72c" : "#ee5622"} 
                              strokeWidth="12" 
                              fill="transparent" 
                              strokeDasharray={2 * Math.PI * 76}
                              strokeDashoffset={(2 * Math.PI * 76) * (1 - tension / 100)}
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-black text-[var(--foreground)] font-mono">{tension}%</span>
                            <span className="text-[10px] font-mono text-[var(--foreground)]/50 uppercase tracking-widest mt-1">Debate Index</span>
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <span className={`text-xs font-bold uppercase tracking-wider block ${
                            tension > 45 ? "text-cyber-rose animate-pulse" : tension > 20 ? "text-cyber-purple" : "text-cyber-cyan"
                          }`}>
                            {tension > 45 ? "Tension Spike" : tension > 20 ? "Intense Debate" : "Harmonious"}
                          </span>
                          <p className="text-[11px] text-[var(--foreground)]/60 max-w-xs leading-relaxed">
                            Aggregated from language tokens reflecting disagreement or circular debate triggers in dialogue.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-obsidian-light/35 border border-[var(--color-obsidian-border)] rounded-2xl">
                      <span className="text-[10px] font-mono font-bold uppercase text-[var(--foreground)]/70 block mb-1">Diagnostic Context</span>
                      <p className="text-xs text-[var(--foreground)]/70 leading-relaxed">
                        This session registered an overall efficiency index of **{efficiency}%** alongside a tension index of **{tension}%**. 
                        {efficiency > 80 
                          ? " The session was fast-paced and successfully extracted actionable tasks." 
                          : " The session had unresolved details or plan overrides which lowered productivity."}
                        {tension > 45 
                          ? " Multiple conflicting statements or overrides were flagged in the decision lineage log. Immediate team review is advised." 
                          : " The conversation maintained strong agreement and followed established roadmap coordinates."}
                      </p>
                    </div>
                  </div>
                )}

                {expandedChart === "speaking" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-2">
                        <Users className="h-5 w-5 text-cyber-cyan" /> Speaking Distribution (Expanded View)
                      </h3>
                      <p className="text-xs text-[var(--foreground)]/50 mt-1 font-light">Detailed participant voice share distribution and estimated speaking times.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-6">
                      {/* Donut Chart */}
                      <div className="flex justify-center">
                        <div className="relative h-56 w-56 flex items-center justify-center">
                          <svg className="w-full h-full">
                            <circle cx="112" cy="112" r="76" stroke="rgba(255,255,255,0.01)" strokeWidth="16" fill="transparent" />
                            {/* Segmented Rings */}
                            {(() => {
                              let acc = 0;
                              return speakersList.map(([speaker, percent], idx) => {
                                const p = (Number(percent) / totalSpeakerPct) * 100;
                                const color = SPEAKER_COLOR_VALUES[idx % SPEAKER_COLOR_VALUES.length];
                                const radius = 76;
                                const circ = 2 * Math.PI * radius;
                                const strokeDashArray = `${(p / 100) * circ} ${circ}`;
                                const strokeDashOffset = -((acc / 100) * circ);
                                acc += p;
                                
                                return (
                                  <circle
                                    key={speaker}
                                    cx="112"
                                    cy="112"
                                    r={radius}
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth="16"
                                    strokeDasharray={strokeDashArray}
                                    strokeDashoffset={strokeDashOffset}
                                    transform="rotate(-90 112 112)"
                                    className="transition-all duration-500 ease-out hover:stroke-[22px] cursor-pointer"
                                  />
                                );
                              });
                            })()}
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-sm font-mono text-[var(--foreground)]/50 uppercase tracking-widest">Active</span>
                            <span className="text-2xl font-black text-[var(--foreground)]">{speakersList.length} Speaker{speakersList.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed list with times */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono font-bold uppercase text-[var(--foreground)]/70 block mb-2">Participant Details</span>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {speakersList.map(([speaker, percent], idx) => {
                            const p = Math.round((Number(percent) / totalSpeakerPct) * 100);
                            const colorVal = SPEAKER_COLOR_VALUES[idx % SPEAKER_COLOR_VALUES.length];
                            const badgeClass = SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
                            const estSecs = Math.round((p / 100) * duration);
                            
                            return (
                              <div key={speaker} className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-obsidian-border)] bg-obsidian-dark/45">
                                <div className="flex items-center gap-3">
                                  <span style={{ backgroundColor: colorVal }} className="h-3 w-3 rounded-full shrink-0 shadow-sm" />
                                  <div>
                                    <span className="text-xs font-bold text-[var(--foreground)] block">{speaker}</span>
                                    <span className="text-[10px] text-[var(--foreground)]/50 font-mono">Estimated Time: {Math.floor(estSecs / 60)}m {estSecs % 60}s</span>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeClass}`}>
                                  {p}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {expandedChart === "timeline" && (
                  <div className="space-y-6 flex flex-col h-[65vh]">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-2">
                        <Clock className="h-5 w-5 text-cyber-rose" /> Dialogue Timeline (Expanded View)
                      </h3>
                      <p className="text-xs text-[var(--foreground)]/50 mt-1 font-light">Interactive chronological turn-taking layout mapping dialogue transcripts and speaker transitions.</p>
                    </div>

                    <div className="space-y-3 shrink-0">
                      <div className="relative h-10 w-full bg-obsidian-dark/75 border border-[var(--color-obsidian-border)] rounded-2xl overflow-hidden flex shadow-inner p-[2px]">
                        {segments.map((seg: any, idx: number) => {
                          const startPct = (seg.start_time / duration) * 100;
                          const widthPct = ((seg.end_time - seg.start_time) / duration) * 100;
                          const speakerIdx = speakersList.findIndex(([name]) => name === seg.speaker_label);
                          const colorVal = SPEAKER_COLOR_VALUES[speakerIdx !== -1 ? speakerIdx : idx % SPEAKER_COLOR_VALUES.length];
                          
                          return (
                            <div
                              key={idx}
                              style={{
                                width: `${Math.max(widthPct, 0.4)}%`,
                                backgroundColor: colorVal,
                              }}
                              className="h-full border-r border-obsidian-dark/30 relative group transition-all hover:brightness-125 cursor-pointer"
                              title={`${seg.speaker_label} (${Math.round(seg.start_time)}s - ${Math.round(seg.end_time)}s)`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-[var(--foreground)]/45 px-1 uppercase tracking-widest">
                        <span>Start (0:00)</span>
                        <span>Meeting Duration: {Math.floor(duration / 60)}m {Math.floor(duration % 60)}s</span>
                        <span>End ({Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')})</span>
                      </div>
                    </div>

                    {/* Scrollable Dialogue List */}
                    <div className="flex-1 overflow-y-auto border border-[var(--color-obsidian-border)] bg-obsidian-dark/45 rounded-2xl p-4 space-y-4">
                      <span className="text-[10px] font-mono font-bold uppercase text-[var(--foreground)]/70 block sticky top-0 bg-obsidian-dark/95 backdrop-blur-sm pb-2">Conversation Log</span>
                      {segments.map((seg: any, idx: number) => {
                        const speakerIdx = speakersList.findIndex(([name]) => name === seg.speaker_label);
                        const colorVal = SPEAKER_COLOR_VALUES[speakerIdx !== -1 ? speakerIdx : idx % SPEAKER_COLOR_VALUES.length];
                        
                        return (
                          <div key={idx} className="flex gap-4 p-3 rounded-xl border border-[var(--color-obsidian-border)] hover:bg-obsidian-light/5 transition-colors">
                            <div className="flex flex-col items-center shrink-0 min-w-[100px] max-w-[120px]">
                              <span style={{ backgroundColor: colorVal }} className="h-2 w-2 rounded-full mb-1 shadow-sm" />
                              <span className="text-[10px] font-bold text-[var(--foreground)] truncate text-center w-full">{seg.speaker_label}</span>
                              <span className="text-[9px] font-mono text-[var(--foreground)]/40 mt-0.5">{Math.floor(seg.start_time / 60)}:{(seg.start_time % 60).toFixed(0).padStart(2, '0')}</span>
                            </div>
                            <p className="text-xs text-[var(--foreground)]/80 leading-relaxed font-light font-sans">{seg.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 border-t border-[var(--color-obsidian-border)] pt-4 text-[9px] font-mono text-[var(--foreground)]/50 leading-relaxed uppercase tracking-wider shrink-0 flex justify-between">
                <span>⚡ Real-time diagnostic viewer</span>
                <span>Press close or backdrop to collapse</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
