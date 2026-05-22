"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

// Robust Fallbacks
const MOCK_MEETINGS_DATA: Record<number, any> = {
  3: {
    id: 3,
    title: "SaaS Scaling & Microservices Shift",
    date: "2026-05-18 11:15",
    duration: 3240,
    summary: "The team aligned on core architectural shifts, resolving that the system needs to migrate to microservices for the new user profile and feed components to support scaling loads. Clerk OAuth was finalized to save engineering time. Reeti will upgrade frontend routers, and Aman will configure pooling.",
    efficiency_score: 86.0,
    tension_score: 15.0,
    speaker_stats: { "Aman (Backend)": 35.0, "Reeti (Frontend)": 45.0, "Sarah (Product)": 20.0 },
    segments: [
      { id: 1, speaker_label: "Reeti (Frontend)", start_time: 0.0, text: "Hi all, looking at the horizontal scaling needs for user sessions, I think we must migrate to a decoupled microservices layout for the user-profile API." },
      { id: 2, speaker_label: "Aman (Backend)", start_time: 41.0, text: "I know I originally recommended avoiding microservices, but with the load forecasts for user feeds, I agree. We decided to migrate to microservices for the new user profile models." },
      { id: 3, speaker_label: "Sarah (Product)", start_time: 81.0, text: "Perfect, let's document that choice. We are migrating to microservices. Also, Clerk oauth is finalized to launch quickly." },
      { id: 4, speaker_label: "Reeti (Frontend)", start_time: 111.0, text: "Excellent. I will start upgrading the frontend routing and dashboard configurations by next Tuesday." }
    ],
    decisions: [
      { id: 3, text: "Migrate core user and feed profile modules to a microservices architecture to support horizontal load scaling.", status: "accepted" },
      { id: 4, text: "Implement Clerk OAuth for user authentication to accelerate launch speed.", status: "accepted" }
    ],
    tasks: [
      { id: 3, title: "Update frontend configurations with microservices endpoints", owner: "Reeti", deadline: "2026-06-02", priority: "medium", status: "todo" },
      { id: 4, title: "Integrate Clerk OAuth library into the frontend shell", owner: "Reeti", deadline: "2026-05-29", priority: "high", status: "todo" }
    ],
    contradictions: [
      { id: 1, description: "Shifted architectural direction: previously decided to 'Avoid microservices' (Meeting #1) to minimize complexity, but recently 'Decided to migrate to microservices' (Meeting #3) for user-profile scaling.", confidence_score: 0.88, old_decision_text: "Avoid microservices and build a unified monolithic backend to avoid API gateway and networking overhead.", new_decision_text: "Migrate core user and feed profile modules to a microservices architecture to support horizontal load scaling." }
    ],
    unresolved_topics: [
      { id: 2, topic_name: "Real-time WebSockets Gateway", context: "Debated between using Node.js Socket.io or FastAPI WebSockets for live notifications. Unresolved, pending throughput load-testing.", status: "open" }
    ]
  },
  2: {
    id: 2,
    title: "Database & Auth Architecture Deep-Dive",
    date: "2026-05-14 14:30",
    duration: 2880,
    summary: "Technical deep-dive on auth setup and database selection. PostgreSQL was chosen. Auth choice deferred due to pricing reviews.",
    efficiency_score: 78.5,
    tension_score: 24.0,
    speaker_stats: { "Aman (Backend)": 50.0, "Reeti (Frontend)": 20.0, "Sarah (Product)": 30.0 },
    segments: [
      { id: 1, speaker_label: "Aman (Backend)", start_time: 0.0, text: "For the database, since we are moving towards production, let's select PostgreSQL over SQLite. It handles concurrent connections much better." },
      { id: 2, speaker_label: "Sarah (Product)", start_time: 46.0, text: "Agreed, we decided on PostgreSQL. Now, for user login, should we build a custom JWT service or use Clerk?" },
      { id: 3, speaker_label: "Aman (Backend)", start_time: 76.0, text: "Building custom JWT takes longer, but using Clerk adds external pricing overhead. We need to analyze this in detail. Let's decide later on authentication, pending some pricing reviews." }
    ],
    decisions: [
      { id: 2, text: "Select PostgreSQL as the primary relational database platform instead of SQLite for production durability.", status: "accepted" }
    ],
    tasks: [
      { id: 2, title: "Configure production PostgreSQL clusters and connection pooling", owner: "Aman", deadline: "2026-05-30", priority: "high", status: "in_progress" }
    ],
    contradictions: [],
    unresolved_topics: [
      { id: 1, topic_name: "Authentication Strategy", context: "Clerk OAuth vs Custom JWT tokens. Aman expressed pricing concerns. Deferred for pricing analysis.", status: "resolved" }
    ]
  },
  1: {
    id: 1,
    title: "Project Alpha Kickoff & DB Planning",
    date: "2026-05-10 10:00",
    duration: 3540,
    summary: "Kickoff sync for Project Alpha. Aman recommended avoiding microservices to keep the architectural footprint light.",
    efficiency_score: 92.0,
    tension_score: 8.0,
    speaker_stats: { "Aman (Backend)": 45.0, "Reeti (Frontend)": 35.0, "Sarah (Product)": 20.0 },
    segments: [
      { id: 1, speaker_label: "Aman (Backend)", start_time: 0.0, text: "Welcome team to the Project Alpha Kickoff. We need to align on structure. I strongly propose we avoid microservices for this initial launch to prevent overhead." },
      { id: 2, speaker_label: "Reeti (Frontend)", start_time: 31.0, text: "Agreed. From the frontend side, drawing endpoints from a single monolithic service makes integrating state and data queries way smoother." },
      { id: 3, speaker_label: "Sarah (Product)", start_time: 56.0, text: "Sounds reasonable. Let's start with a clean monolith. Aman, can you write the database migrations and draft our schemas by this Friday?" },
      { id: 4, speaker_label: "Aman (Backend)", start_time: 76.0, text: "Yes, I will complete the backend SQLite schema and migration setups by Friday." }
    ],
    decisions: [
      { id: 1, text: "Avoid microservices and build a unified monolithic backend to avoid API gateway and networking overhead.", status: "changed" }
    ],
    tasks: [
      { id: 1, title: "Implement core database migrations", owner: "Aman", deadline: "2026-05-28", priority: "high", status: "done" }
    ],
    contradictions: [],
    unresolved_topics: []
  }
};

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
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number>(3);
  const [meetingData, setMeetingData] = useState<any>(MOCK_MEETINGS_DATA[3]);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedText, setHighlightedText] = useState("");

  // Synchronize list and URL params
  useEffect(() => {
    async function loadMeetings() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/meetings");
        if (res.ok) {
          const list = await res.json();
          setMeetingsList(list);
        } else {
          setMeetingsList(Object.values(MOCK_MEETINGS_DATA));
        }
      } catch (err) {
        setMeetingsList(Object.values(MOCK_MEETINGS_DATA));
      }
    }
    loadMeetings();
  }, []);

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
    async function loadSelectedMeeting() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/meetings/${selectedId}`);
        if (res.ok) {
          const data = await res.json();
          setMeetingData(data);
        } else {
          setMeetingData(MOCK_MEETINGS_DATA[selectedId] || MOCK_MEETINGS_DATA[3]);
        }
      } catch (err) {
        setMeetingData(MOCK_MEETINGS_DATA[selectedId] || MOCK_MEETINGS_DATA[3]);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Left Sidebar Catalog Column */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
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
                    ? "border-cyber-purple text-white shadow-lg shadow-cyber-purple/5"
                    : "bg-white/[0.01] hover:bg-white/[0.03] border-white/5 text-gray-400 hover:text-white"
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
                <div className="relative z-10 text-[10px] font-mono mt-1.5 text-gray-500 flex items-center gap-1.5">
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
                    <h2 className="text-xl font-black text-white tracking-tight mt-2.5">{meetingData.title}</h2>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 font-mono">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Calendar className="h-3.5 w-3.5 text-cyber-purple" /> {meetingData.date}
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Clock className="h-3.5 w-3.5 text-cyber-cyan" /> {formatTime(meetingData.duration)} min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="p-3 bg-cyber-purple/10 border border-cyber-purple/20 rounded-xl text-center min-w-[80px]"
                    >
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-mono font-bold">Meeting Value</p>
                      <p className="text-sm font-black text-cyber-purple font-mono mt-0.5">{meetingData.efficiency_score}%</p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="p-3 bg-cyber-rose/10 border border-cyber-rose/20 rounded-xl text-center min-w-[80px]"
                    >
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-mono font-bold">Tension level</p>
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
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="h-4.5 w-4.5 text-cyber-cyan animate-pulse" /> AI Summary
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed font-light">
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
                          <p className="text-gray-300 leading-relaxed font-light">{c.description}</p>
                          <div className="p-4 bg-black/60 border border-cyber-rose/25 rounded-xl space-y-3">
                            <div className="flex items-start gap-2.5">
                              <span className="px-2 py-0.5 rounded bg-gray-800 text-[8px] font-mono shrink-0 font-bold text-gray-400">OLD DECISION</span>
                              <span className="text-gray-400 italic font-light">"{c.old_decision_text}"</span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="px-2 py-0.5 rounded bg-cyber-rose/25 text-cyber-rose text-[8px] font-mono shrink-0 font-bold">NEW DECISION</span>
                              <span className="text-white font-semibold">"{c.new_decision_text}"</span>
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="h-4.5 w-4.5 text-cyber-purple" /> Conversation Transcript
                      </h3>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search dialogue..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-black/45 border border-white/5 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all w-full sm:w-56"
                        />
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                      <AnimatePresence mode="popLayout">
                        {getFilteredSegments().map((seg: any) => {
                          const isSelected = highlightedText === seg.text;
                          
                          // Determine speaker initials and bubble styles
                          const speakerName = seg.speaker_label || "AI Assistant";
                          const initials = speakerName.split(" ")[0].slice(0, 2).toUpperCase();
                          
                          // Determine styling colors based on speaker name
                          let speakerColorClass = "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]";
                          let avatarColorClass = "bg-white/5 text-gray-400 border-white/10";
                          
                          if (speakerName.toLowerCase().includes("aman")) {
                            speakerColorClass = isSelected ? "border-cyber-purple bg-cyber-purple/20" : "border-cyber-purple/20 bg-cyber-purple/5 hover:bg-cyber-purple/10";
                            avatarColorClass = "bg-cyber-purple/15 text-cyber-purple border-cyber-purple/30";
                          } else if (speakerName.toLowerCase().includes("reeti")) {
                            speakerColorClass = isSelected ? "border-cyber-cyan bg-cyber-cyan/20" : "border-cyber-cyan/20 bg-cyber-cyan/5 hover:bg-cyber-cyan/10";
                            avatarColorClass = "bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/30";
                          } else if (speakerName.toLowerCase().includes("sarah")) {
                            speakerColorClass = isSelected ? "border-cyber-rose bg-cyber-rose/20" : "border-cyber-rose/20 bg-cyber-rose/5 hover:bg-cyber-rose/10";
                            avatarColorClass = "bg-cyber-rose/15 text-cyber-rose border-cyber-rose/30";
                          } else {
                            if (isSelected) {
                              speakerColorClass = "border-cyber-purple bg-cyber-purple/20";
                              avatarColorClass = "bg-cyber-purple/15 text-cyber-purple border-cyber-purple/30";
                            }
                          }

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
                                    <span className="text-xs font-bold text-white">
                                      {speakerName}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-mono">{formatTime(seg.start_time)}</span>
                                  </div>
                                  <p className="text-xs font-light leading-relaxed text-gray-200">{seg.text}</p>
                                  
                                  {isSelected && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      transition={{ duration: 0.25 }}
                                      className="mt-3 pt-2.5 border-t border-white/10 flex justify-between items-center gap-3"
                                    >
                                      <span className="text-[9px] text-cyber-cyan font-mono flex items-center gap-1.5">
                                        <Zap className="h-3 w-3 animate-pulse" /> Linked to Memory Node
                                      </span>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(seg.text);
                                        }}
                                        className="px-2.5 py-1 bg-cyber-purple/35 hover:bg-cyber-purple/50 border border-cyber-purple/50 text-[9px] text-white font-mono font-bold rounded-lg transition-all cursor-pointer"
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
                        <p className="text-xs text-gray-500 text-center py-8">No matching dialogues found.</p>
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
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Who Spoke</h3>
                    <div className="space-y-4">
                      {meetingData.speaker_stats && Object.entries(meetingData.speaker_stats).map(([name, pct]: any) => (
                        <div key={name} className="space-y-1.5 font-sans">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-400">{name}</span>
                            <span className="text-white font-semibold">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
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
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Decisions Made</h3>
                    <div className="space-y-3">
                      {meetingData.decisions && meetingData.decisions.map((d: any) => (
                        <motion.div 
                          key={d.id} 
                          whileHover={{ scale: 1.02 }}
                          className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-1.5 hover:border-cyber-cyan/30 transition-colors font-sans"
                        >
                          <p className="text-xs text-gray-200 leading-normal font-light">{d.text}</p>
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
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Tasks & Assignments</h3>
                    <div className="space-y-3">
                      {meetingData.tasks && meetingData.tasks.map((t: any) => (
                        <motion.div 
                          key={t.id} 
                          whileHover={{ scale: 1.02 }}
                          className="p-3.5 bg-white/[0.01] border border-white/5 rounded-xl space-y-2 hover:border-cyber-purple/35 transition-colors font-sans"
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono text-cyber-cyan">
                            <span>Owner: {t.owner}</span>
                            <span className="text-gray-500 font-sans">Due: {t.deadline}</span>
                          </div>
                          <p className="text-xs text-white font-medium leading-relaxed">{t.title}</p>
                          <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                            <span className={`text-[8px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                              t.priority === "high" ? "bg-cyber-rose/15 text-cyber-rose border border-cyber-rose/20" : "bg-white/5 text-gray-400 border border-transparent"
                            }`}>{t.priority} priority</span>
                            <span className="text-[8px] font-mono text-gray-500 font-semibold uppercase">{t.status}</span>
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
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Topics for Later</h3>
                      <div className="space-y-3">
                        {meetingData.unresolved_topics.map((ut: any) => (
                          <motion.div 
                            key={ut.id} 
                            whileHover={{ scale: 1.02 }}
                            className="p-3.5 bg-cyber-rose/5 border border-cyber-rose/15 rounded-xl space-y-1.5 font-sans"
                          >
                            <p className="text-xs text-white font-bold">{ut.topic_name}</p>
                            <p className="text-[10px] text-gray-400 leading-relaxed font-light">"{ut.context}"</p>
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
              className="p-12 bg-white/[0.01] rounded-2xl text-center text-gray-500 font-sans text-xs border border-white/5 flex items-center justify-center min-h-[300px]"
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
      <div className="p-8 bg-white/[0.01] rounded-2xl text-center text-gray-500 font-sans">
        Loading your meeting space...
      </div>
    }>
      <MeetingContent />
    </Suspense>
  );
}
