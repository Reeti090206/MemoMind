"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  User, 
  HelpCircle, 
  AlertTriangle, 
  Search, 
  CheckCircle,
  TrendingUp, 
  Users,
  CornerDownRight,
  ShieldAlert,
  ArrowLeftRight,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
const sidebarContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const sidebarItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 120, damping: 15 } }
};

const rightColumnVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
      staggerChildren: 0.1
    }
  }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
};

function MeetingContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [meetingData, setMeetingData] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedText, setHighlightedText] = useState("");

  // Synchronize list and URL params
  useEffect(() => {
    async function loadMeetings() {
      try {
        const url = user?.email
          ? `http://127.0.0.1:8000/api/meetings?user_email=${encodeURIComponent(user.email)}`
          : "http://127.0.0.1:8000/api/meetings";
        const res = await fetch(url);
        if (res.ok) {
          const list = await res.json();
          setMeetingsList(list);
          if (list.length > 0) {
            const idParam = searchParams.get("id");
            if (idParam) {
              const parsed = parseInt(idParam);
              if (!isNaN(parsed) && list.some((m: any) => m.id === parsed)) {
                setSelectedId(parsed);
                return;
              }
            }
            setSelectedId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch meetings from API", err);
      }
    }
    loadMeetings();
  }, [searchParams, user]);

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      const parsed = parseInt(idParam);
      if (!isNaN(parsed)) {
        setSelectedId(parsed);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedId === null) return;
    async function loadSelectedMeeting() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/meetings/${selectedId}`);
        if (res.ok) {
          const data = await res.json();
          setMeetingData(data);
        }
      } catch (err) {
        console.error("Failed to load selected meeting details", err);
      }
    }
    loadSelectedMeeting();
  }, [selectedId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getFilteredSegments = () => {
    if (!meetingData || !meetingData.segments) return [];
    if (!searchQuery) return meetingData.segments;
    return meetingData.segments.filter((s: any) =>
      s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.speaker_label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (meetingsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-[var(--color-obsidian-border)] rounded-3xl bg-[var(--foreground)]/[0.01] backdrop-blur-md min-h-[400px]">
        <Calendar className="h-12 w-12 text-cyber-cyan animate-pulse mb-4" />
        <h3 className="text-lg font-bold text-[var(--foreground)]">No Meetings Stored</h3>
        <p className="text-xs text-[var(--foreground)]/70 max-w-sm mt-2 leading-relaxed">
          MemoMind acts as your team's autonomous memory intelligence engine. Start recording or upload a file to populate your workspace.
        </p>
        <Link href="/upload" className="mt-6 px-5 py-3 text-xs bg-gradient-to-tr from-cyber-purple to-cyber-cyan rounded-xl text-[var(--foreground)] font-bold tracking-wider uppercase">
          Record or Upload Meeting
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Left Sidebar Catalog Column */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono flex items-center gap-2">
          <Calendar className="h-4 w-4 text-cyber-cyan" /> Meeting History
        </h3>
        
        <motion.div 
          variants={sidebarContainerVariants}
          initial="hidden"
          animate="show"
          className="space-y-2.5"
        >
          {meetingsList.map((m) => {
            const isSelected = m.id === selectedId;
            return (
              <motion.button
                key={m.id}
                variants={sidebarItemVariants}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left p-4 rounded-xl relative border transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "border-cyber-purple text-[var(--foreground)] shadow-lg shadow-cyber-purple/5"
                    : "bg-[var(--foreground)]/[0.01] hover:bg-white/[0.03] border-[var(--color-obsidian-border)] text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeMeetingBg"
                    className="absolute inset-0 bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/15 rounded-xl border border-cyber-purple/40 z-0 pointer-events-none"
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  />
                )}
                
                <div className="relative z-10 font-semibold text-sm truncate">{m.title}</div>
                <div className="relative z-10 text-[10px] font-mono mt-1.5 text-[var(--foreground)]/50 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-gray-600" />
                  {m.date}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Right Canvas Column */}
      <div className="lg:col-span-3">
        <AnimatePresence mode="wait">
          {meetingData ? (
            <motion.div
              key={selectedId}
              variants={rightColumnVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -15, transition: { duration: 0.2 } }}
              className="space-y-6"
            >
              
              {/* Header Panel */}
              <motion.div 
                variants={cardItemVariants}
                className="p-6 rounded-2xl glass-card relative overflow-hidden group hover:border-cyber-purple/35 transition-all duration-300 bg-transparent"
              >
                {/* Visual Glow Layer */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div>
                    <span className="px-2.5 py-0.5 text-[9px] rounded-full bg-cyber-cyan/15 border border-cyber-cyan/25 text-cyber-cyan font-mono font-bold tracking-wider uppercase">
                      SPEECH TO TEXT
                    </span>
                    <h2 className="text-xl font-black text-[var(--foreground)] tracking-tight mt-2.5">{meetingData.title}</h2>
                    <div className="flex items-center gap-4 text-xs text-[var(--foreground)]/70 mt-2 font-mono">
                      <span className="flex items-center gap-1.5 text-[var(--foreground)]/70">
                        <Calendar className="h-3.5 w-3.5 text-cyber-purple" /> {meetingData.date}
                      </span>
                      <span className="flex items-center gap-1.5 text-[var(--foreground)]/70">
                        <Clock className="h-3.5 w-3.5 text-cyber-cyan" /> {formatTime(meetingData.duration)} min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="p-3 bg-cyber-purple/10 border border-cyber-purple/20 rounded-xl text-center min-w-[80px]"
                    >
                      <p className="text-[9px] text-[var(--foreground)]/70 uppercase tracking-widest font-mono font-bold">Meeting Value</p>
                      <p className="text-sm font-black text-cyber-purple font-mono mt-0.5">{meetingData.efficiency_score}%</p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="p-3 bg-cyber-rose/10 border border-cyber-rose/20 rounded-xl text-center min-w-[80px]"
                    >
                      <p className="text-[9px] text-[var(--foreground)]/70 uppercase tracking-widest font-mono font-bold">Tension level</p>
                      <p className="text-sm font-black text-cyber-rose font-mono mt-0.5">{meetingData.tension_score}%</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Core Analytics Blocks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Cols: Executive Summary & Decisions */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Executive Summary */}
                  <motion.div 
                    variants={cardItemVariants}
                    className="p-6 rounded-2xl glass-card space-y-3 relative overflow-hidden group hover:border-cyber-cyan/35 transition-all duration-300 bg-transparent"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/[0.02] to-transparent pointer-events-none" />
                    <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                      <Zap className="h-4.5 w-4.5 text-cyber-cyan animate-pulse" /> AI Summary
                    </h3>
                    <p className="text-xs text-[var(--foreground)]/80 leading-relaxed font-light">
                      {meetingData.summary}
                    </p>
                  </motion.div>

                  {/* Inconsistency/Contradiction Alert banner */}
                  {meetingData.contradictions && meetingData.contradictions.length > 0 && (
                    <motion.div 
                      variants={cardItemVariants}
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      className="p-5 rounded-2xl bg-cyber-rose/10 border border-cyber-rose/30 space-y-3 shadow-lg shadow-cyber-rose/5"
                    >
                      <div className="flex items-center gap-2.5 text-cyber-rose">
                        <ShieldAlert className="h-5 w-5 animate-pulse" />
                        <span className="font-bold text-xs uppercase tracking-wider font-mono">Plan Conflict Alerts</span>
                      </div>
                      {meetingData.contradictions.map((c: any) => (
                        <div key={c.id} className="space-y-2.5 text-xs">
                          <p className="text-[var(--foreground)]/80 leading-relaxed font-light">{c.description}</p>
                          <div className="p-4 bg-black/60 border border-cyber-rose/25 rounded-xl space-y-3">
                            <div className="flex items-start gap-2.5">
                              <span className="px-2 py-0.5 rounded bg-gray-800 text-[8px] font-mono shrink-0 font-bold text-[var(--foreground)]/70">OLD DECISION</span>
                              <span className="text-[var(--foreground)]/70 italic font-light">"{c.old_decision_text}"</span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="px-2 py-0.5 rounded bg-cyber-rose/25 text-cyber-rose text-[8px] font-mono shrink-0 font-bold">NEW DECISION</span>
                              <span className="text-[var(--foreground)] font-semibold">"{c.new_decision_text}"</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Clickable Transcripts Viewer */}
                  <motion.div 
                    variants={cardItemVariants}
                    className="p-6 rounded-2xl glass-card space-y-4 bg-transparent"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-obsidian-border)]">
                      <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                        <Users className="h-4.5 w-4.5 text-cyber-purple" /> Conversation Transcript
                      </h3>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search dialogue..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all w-full sm:w-56"
                        />
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--foreground)]/50" />
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                      <AnimatePresence mode="popLayout">
                        {getFilteredSegments().map((seg: any) => {
                          const isSelected = highlightedText === seg.text;
                          
                          // Determine speaker initials and bubble styles
                          const speakerName = seg.speaker_label || "AI Assistant";
                          const initials = speakerName.split(" ")[0].slice(0, 2).toUpperCase();
                          
                          // Determine styling colors based on speaker name dynamically using hashing
                          const getSpeakerColors = (name: string, isSel: boolean) => {
                            let hash = 0;
                            for (let i = 0; i < name.length; i++) {
                              hash = name.charCodeAt(i) + ((hash << 5) - hash);
                            }
                            const index = Math.abs(hash) % 3;
                            if (index === 0) {
                              return {
                                speaker: isSel ? "border-cyber-cyan bg-cyber-cyan/20" : "border-cyber-cyan/20 bg-cyber-cyan/5 hover:bg-cyber-cyan/10",
                                avatar: "bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/30"
                              };
                            } else if (index === 1) {
                              return {
                                speaker: isSel ? "border-cyber-purple bg-cyber-purple/20" : "border-cyber-purple/20 bg-cyber-purple/5 hover:bg-cyber-purple/10",
                                avatar: "bg-cyber-purple/15 text-cyber-purple border-cyber-purple/30"
                              };
                            } else {
                              return {
                                speaker: isSel ? "border-cyber-rose bg-cyber-rose/20" : "border-cyber-rose/20 bg-cyber-rose/5 hover:bg-cyber-rose/10",
                                avatar: "bg-cyber-rose/15 text-cyber-rose border-cyber-rose/30"
                              };
                            }
                          };

                          const colors = getSpeakerColors(speakerName, isSelected);
                          let speakerColorClass = colors.speaker;
                          let avatarColorClass = colors.avatar;

                          return (
                            <motion.div
                              layout
                              key={seg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              whileHover={{ scale: 1.005 }}
                              whileTap={{ scale: 0.995 }}
                              onClick={() => setHighlightedText(seg.text)}
                              className="flex items-start gap-3 cursor-pointer"
                            >
                              {/* Speaker Bubble Avatar */}
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border shrink-0 ${avatarColorClass}`}>
                                {initials}
                              </div>

                              {/* Speech Bubble Container */}
                              <div className={`flex-1 p-3.5 rounded-2xl rounded-tl-none border transition-all duration-300 relative overflow-hidden ${speakerColorClass}`}>
                                {isSelected && (
                                  <motion.div
                                    layoutId="selectedSegmentGlow"
                                    className="absolute inset-0 bg-cyber-purple/[0.02] z-0 pointer-events-none"
                                  />
                                )}
                                <div className="relative z-10">
                                  <div className="flex items-center justify-between gap-3 mb-1">
                                    <span className="text-xs font-bold text-[var(--foreground)]">
                                      {speakerName}
                                    </span>
                                    <span className="text-[10px] text-[var(--foreground)]/50 font-mono">{formatTime(seg.start_time)}</span>
                                  </div>
                                  <p className="text-xs font-light leading-relaxed text-[var(--foreground)]/90">{seg.text}</p>
                                  
                                  {isSelected && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      transition={{ duration: 0.25 }}
                                      className="mt-3 pt-2.5 border-t border-[var(--color-obsidian-border)] flex justify-between items-center gap-3"
                                    >
                                      <span className="text-[9px] text-cyber-cyan font-mono flex items-center gap-1.5">
                                        <Zap className="h-3 w-3 animate-pulse" /> Linked to Memory Node
                                      </span>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(seg.text);
                                        }}
                                        className="px-2.5 py-1 bg-cyber-purple/35 hover:bg-cyber-purple/50 border border-cyber-purple/50 text-[9px] text-[var(--foreground)] font-mono font-bold rounded-lg transition-all cursor-pointer"
                                      >
                                        Copy Snippet
                                      </button>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      {getFilteredSegments().length === 0 && (
                        <p className="text-xs text-[var(--foreground)]/50 text-center py-8">No matching dialogues found.</p>
                      )}
                    </div>
                  </motion.div>

                </div>

                {/* Right 1 Col: Speaker Breakdown, Decisions & Actions */}
                <div className="space-y-6">
                  
                  {/* Speaker Breakdown Ring/Widget */}
                  <motion.div 
                    variants={cardItemVariants}
                    className="p-6 rounded-2xl glass-card space-y-4 bg-transparent"
                  >
                    <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Who Spoke</h3>
                    <div className="space-y-4">
                      {meetingData.speaker_stats && Object.entries(meetingData.speaker_stats).map(([name, pct]: any) => (
                        <div key={name} className="space-y-1.5 font-sans">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-[var(--foreground)]/70">{name}</span>
                            <span className="text-[var(--foreground)] font-semibold">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--foreground)]/[0.05] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Decided Line items */}
                  <motion.div 
                    variants={cardItemVariants}
                    className="p-6 rounded-2xl glass-card space-y-4 bg-transparent"
                  >
                    <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Decisions Made</h3>
                    <div className="space-y-3">
                      {meetingData.decisions && meetingData.decisions.map((d: any) => (
                        <motion.div 
                          key={d.id} 
                          whileHover={{ scale: 1.02 }}
                          className="p-3 bg-[var(--foreground)]/[0.01] border border-[var(--color-obsidian-border)] rounded-xl space-y-1.5 hover:border-cyber-cyan/30 transition-colors font-sans"
                        >
                          <p className="text-xs text-[var(--foreground)]/90 leading-normal font-light">{d.text}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald text-[8px] uppercase font-mono font-bold">
                              {d.status || "accepted"}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Tasks Assignee */}
                  <motion.div 
                    variants={cardItemVariants}
                    className="p-6 rounded-2xl glass-card space-y-4 bg-transparent"
                  >
                    <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Tasks & Assignments</h3>
                    <div className="space-y-3">
                      {meetingData.tasks && meetingData.tasks.map((t: any) => (
                        <motion.div 
                          key={t.id} 
                          whileHover={{ scale: 1.02 }}
                          className="p-3.5 bg-[var(--foreground)]/[0.01] border border-[var(--color-obsidian-border)] rounded-xl space-y-2 hover:border-cyber-purple/35 transition-colors font-sans"
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono text-cyber-cyan">
                            <span>Owner: {t.owner}</span>
                            <span className="text-[var(--foreground)]/50 font-sans">Due: {t.deadline}</span>
                          </div>
                          <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">{t.title}</p>
                          <div className="flex items-center justify-between pt-1.5 border-t border-[var(--color-obsidian-border)]">
                            <span className={`text-[8px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                              t.priority === "high" ? "bg-cyber-rose/15 text-cyber-rose border border-cyber-rose/20" : "bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/70 border border-transparent"
                            }`}>{t.priority} priority</span>
                            <span className="text-[8px] font-mono text-[var(--foreground)]/50 font-semibold uppercase">{t.status}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Unresolved topics originating */}
                  {meetingData.unresolved_topics && meetingData.unresolved_topics.length > 0 && (
                    <motion.div 
                      variants={cardItemVariants}
                      className="p-6 rounded-2xl glass-card space-y-4 bg-transparent"
                    >
                      <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Topics for Later</h3>
                      <div className="space-y-3">
                        {meetingData.unresolved_topics.map((ut: any) => (
                          <motion.div 
                            key={ut.id} 
                            whileHover={{ scale: 1.02 }}
                            className="p-3.5 bg-cyber-rose/5 border border-cyber-rose/15 rounded-xl space-y-1.5 font-sans"
                          >
                            <p className="text-xs text-[var(--foreground)] font-bold">{ut.topic_name}</p>
                            <p className="text-[10px] text-[var(--foreground)]/70 leading-relaxed font-light">"{ut.context}"</p>
                            <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border inline-block mt-1 font-semibold ${
                              ut.status === "resolved"
                                ? "bg-cyber-emerald/15 border-cyber-emerald/20 text-cyber-emerald"
                                : "bg-cyber-rose/15 border-cyber-rose/25 text-cyber-rose animate-pulse"
                            }`}>
                              {ut.status}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                </div>
              </div>

            </motion.div>
          ) : (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 bg-[var(--foreground)]/[0.01] rounded-2xl text-center text-[var(--foreground)]/50 font-sans text-xs border border-[var(--color-obsidian-border)] flex items-center justify-center min-h-[300px]"
            >
              Loading meeting details...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 bg-[var(--foreground)]/[0.01] rounded-2xl text-center text-[var(--foreground)]/50 font-sans">
        Loading your meeting space...
      </div>
    }>
      <MeetingContent />
    </Suspense>
  );
}
