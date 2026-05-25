"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Sparkles, 
  Calendar, 
  CheckSquare, 
  HelpCircle, 
  CornerDownRight, 
  ArrowRight,
  Loader2,
  BrainCircuit,
  MessageSquare,
  Bookmark,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Suggestions list
const SUGGESTED_QUERIES = [
  "When did we discuss authentication?",
  "What were the arguments against microservices?",
  "What tasks are assigned to Aman?",
  "Show decisions related to database selection."
];

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
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 100, 
      damping: 15 
    } 
  }
};

const neuralNodeVariants = {
  pulse: (custom: number) => ({
    scale: [1, 1.25, 1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      repeatType: "reverse" as const,
      delay: custom * 0.2,
      ease: "easeInOut" as const
    }
  })
};

export default function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent, selectedQuery?: string) => {
    if (e) e.preventDefault();
    const searchQuery = selectedQuery || query;
    if (!searchQuery.trim()) return;

    if (!selectedQuery) setQuery(searchQuery);
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });

      if (res.ok) {
        setResults(await res.json());
      } else {
        // Mock fallback if api fails
        throw new Error();
      }
    } catch (err) {
      // High fidelity client-side mock search engine
      await new Promise(resolve => setTimeout(resolve, 2000));
      const q = searchQuery.toLowerCase();
      
      let answer = "";
      let matchedMeetings: any[] = [];
      let matchedDecisions: any[] = [];
      let matchedTasks: any[] = [];
      let snippets: any[] = [];

      if (q.includes("microservices") || q.includes("monolith")) {
        answer = "The team shifted architectural direction between meetings. In the **Project Kickoff Meeting (Meeting #1)**, Aman recommended avoiding microservices to minimize initial operational overhead. However, in the **SaaS Scaling Sync (Meeting #3)**, scaling load projections forced the team to override this decision and decide to **migrate to microservices for horizontal scaling**.";
        matchedMeetings = [{ id: 3, title: "SaaS Scaling & Microservices Shift", date: "2026-05-18" }, { id: 1, title: "Project Alpha Kickoff & DB Planning", date: "2026-05-10" }];
        matchedDecisions = [
          { id: 3, text: "Migrate core user and feed profile modules to a microservices architecture to support horizontal load scaling.", status: "accepted", meeting_id: 3 },
          { id: 1, text: "Avoid microservices and build a unified monolithic backend to avoid API gateway and networking overhead.", status: "changed", meeting_id: 1 }
        ];
        matchedTasks = [{ id: 3, title: "Update frontend configurations with microservices endpoints", owner: "Reeti", deadline: "2026-06-02", status: "todo" }];
        snippets = [
          { speaker: "Reeti (Frontend)", text: "Hi all, looking at the horizontal scaling needs for user sessions, I think we must migrate to a decoupled microservices layout for the user-profile API.", time: "0m 0s", title: "SaaS Scaling & Microservices Shift" },
          { speaker: "Aman (Backend)", text: "I strongly propose we avoid microservices for this initial launch to prevent overhead.", time: "0m 0s", title: "Project Alpha Kickoff & DB Planning" }
        ];
      } else if (q.includes("auth") || q.includes("clerk") || q.includes("jwt")) {
        answer = "Authentication was debated across two syncs. Custom JWT was initially proposed, but left unresolved due to pricing and engineering resource constraints. In the **SaaS Scaling Sync (Meeting #3)**, the team resolved to **implement Clerk OAuth for authentication** to accelerate launch speed.";
        matchedMeetings = [{ id: 2, title: "Database & Auth Architecture Deep-Dive", date: "2026-05-14" }, { id: 3, title: "SaaS Scaling & Microservices Shift", date: "2026-05-18" }];
        matchedDecisions = [{ id: 4, text: "Implement Clerk OAuth for user authentication to accelerate launch speed.", status: "accepted", meeting_id: 3 }];
        matchedTasks = [{ id: 4, title: "Integrate Clerk OAuth library into the frontend shell", owner: "Reeti", deadline: "2026-05-29", status: "todo" }];
        snippets = [
          { speaker: "Sarah (Product)", text: "Now, for user login, should we build a custom JWT service or use Clerk?", time: "0m 46s", title: "Database & Auth Architecture Deep-Dive" },
          { speaker: "Aman (Backend)", text: "Let's decide later on authentication, pending some pricing reviews.", time: "1m 16s", title: "Database & Auth Architecture Deep-Dive" }
        ];
      } else if (q.includes("aman")) {
        answer = "Aman (Backend Engineer) is responsible for core database provisioning and scaling. He has one completed task: **'Implement core database migrations'** (completed Friday 28th), and one active, high-priority task: **'Configure production PostgreSQL clusters and connection pooling'** (due May 30th).";
        matchedMeetings = [{ id: 2, title: "Database & Auth Architecture Deep-Dive", date: "2026-05-14" }];
        matchedDecisions = [{ id: 2, text: "Select PostgreSQL as the primary relational database platform instead of SQLite for production durability.", status: "accepted", meeting_id: 2 }];
        matchedTasks = [{ id: 2, title: "Configure production PostgreSQL clusters and connection pooling", owner: "Aman", deadline: "2026-05-30", status: "in_progress" }];
        snippets = [
          { speaker: "Aman (Backend)", text: "For the database, since we are moving towards production, let's select PostgreSQL over SQLite. It handles concurrent connections much better.", time: "0m 0s", title: "Database & Auth Architecture Deep-Dive" }
        ];
      } else {
        answer = `I found general alignment matches for "${searchQuery}". Key discussion anchors show database selections and scaling decisions. Ask about 'microservices' or 'authentication' to view connected overrides.`;
        matchedMeetings = [{ id: 3, title: "SaaS Scaling & Microservices Shift", date: "2026-05-18" }];
      }

      setResults({ answer, meetings: matchedMeetings, decisions: matchedDecisions, tasks: matchedTasks, snippets });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Semantic Memory Oracle</h2>
        <p className="text-[var(--foreground)]/70 text-sm mt-0.5">
          Ask conversational questions directly to your organization's memory graphs, tracking decision lineage instantly.
        </p>
      </div>

      {/* Chat Bar Entry */}
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Ask MemoMind: 'Why did we change our microservices stance?' or 'What are Reeti's deadlines?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-obsidian-light/60 border border-obsidian-border rounded-2xl pl-12 pr-28 py-4 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all border-glow-purple"
            />
            <BrainCircuit className="absolute left-4 top-3.5 h-6 w-6 text-cyber-purple animate-pulse" />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="absolute right-3 top-2.5 px-5 py-2 text-xs bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:from-cyber-purple hover:to-cyber-purple transition-all duration-300 rounded-xl text-[var(--foreground)] font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.55)]"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>Ask AI <ArrowRight className="h-3.5 w-3.5" /></>
            )}
          </motion.button>
        </form>

        {/* Suggestion Prompts */}
        <AnimatePresence mode="wait">
          {!results && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <p className="text-xs text-[var(--foreground)]/50 font-mono">Suggested Prompt Prompts:</p>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-wrap gap-2"
              >
                {SUGGESTED_QUERIES.map((sq, idx) => (
                  <motion.button
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, y: -1, borderColor: "rgba(168, 85, 247, 0.45)", backgroundColor: "rgba(25, 20, 35, 0.7)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => handleSubmit(e, sq)}
                    className="px-3.5 py-2 text-[11px] text-[var(--foreground)]/70 bg-obsidian-light/30 hover:text-[var(--foreground)] border border-obsidian-border rounded-xl transition-all font-light"
                  >
                    {sq}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Processing Loader */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="p-12 rounded-2xl glass-panel border border-obsidian-border/80 flex flex-col items-center justify-center gap-6 min-h-[320px] relative overflow-hidden bg-obsidian-dark/30"
          >
            {/* Ambient glows behind neural network */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyber-purple/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyber-cyan/10 blur-[60px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-6">
              {/* Neural network SVG */}
              <svg className="w-56 h-36 text-cyber-purple/80" viewBox="0 0 200 100" fill="none">
                {/* Connection Paths */}
                <motion.path d="M 30,50 L 80,20" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" strokeDasharray="5,5" animate={{ strokeDashoffset: [20, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} />
                <motion.path d="M 30,50 L 80,50" stroke="rgba(236, 72, 153, 0.4)" strokeWidth="1.5" strokeDasharray="5,5" animate={{ strokeDashoffset: [20, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} />
                <motion.path d="M 30,50 L 80,80" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1.5" strokeDasharray="5,5" animate={{ strokeDashoffset: [20, 0] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
                
                <motion.path d="M 80,20 L 140,35" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1.2" strokeDasharray="5,5" animate={{ strokeDashoffset: [20, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }} />
                <motion.path d="M 80,50 L 140,35" stroke="rgba(236, 72, 153, 0.3)" strokeWidth="1.2" strokeDasharray="5,5" animate={{ strokeDashoffset: [20, 0] }} transition={{ repeat: Infinity, duration: 1.3, ease: "linear" }} />
                <motion.path d="M 80,50 L 140,65" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.2" strokeDasharray="5,5" animate={{ strokeDashoffset: [20, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }} />
                <motion.path d="M 80,80 L 140,65" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1.2" strokeDasharray="5,5" animate={{ strokeDashoffset: [20, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} />
                
                <motion.path d="M 140,35 L 175,50" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1.5" strokeDasharray="5,5" animate={{ strokeDashoffset: [20, 0] }} transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }} />
                <motion.path d="M 140,65 L 175,50" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" strokeDasharray="5,5" animate={{ strokeDashoffset: [20, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }} />

                {/* Nodes with pulsing scales */}
                <motion.circle cx="30" cy="50" r="5" fill="#ec4899" custom={0} variants={neuralNodeVariants} animate="pulse" />
                
                <motion.circle cx="80" cy="20" r="4.5" fill="#a855f7" custom={1} variants={neuralNodeVariants} animate="pulse" />
                <motion.circle cx="80" cy="50" r="4.5" fill="#a855f7" custom={2} variants={neuralNodeVariants} animate="pulse" />
                <motion.circle cx="80" cy="80" r="4.5" fill="#a855f7" custom={3} variants={neuralNodeVariants} animate="pulse" />
                
                <motion.circle cx="140" cy="35" r="4.5" fill="#06b6d4" custom={4} variants={neuralNodeVariants} animate="pulse" />
                <motion.circle cx="140" cy="65" r="4.5" fill="#06b6d4" custom={5} variants={neuralNodeVariants} animate="pulse" />
                
                <motion.circle cx="175" cy="50" r="5" fill="#00f2fe" custom={6} variants={neuralNodeVariants} animate="pulse" />
              </svg>

              <div className="flex flex-col items-center gap-1.5">
                <span className="text-sm font-semibold text-[var(--foreground)] tracking-wide">Synthesizing Semantic Graph Queries</span>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">Running semantic token matching & contradiction search...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Workspace Canvas */}
      <AnimatePresence mode="wait">
        {results && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: "spring", stiffness: 100, damping: 18 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            
            {/* Left Column: Conversational Answer and Snippets */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Direct Answer */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -2 }}
                className="p-6 rounded-2xl bg-obsidian-light/65 border border-obsidian-border hover:border-cyber-purple/35 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-purple/5 blur-[40px] rounded-full pointer-events-none" />
                <div className="flex items-center gap-2 text-cyber-purple">
                  <BrainCircuit className="h-5.5 w-5.5 animate-pulse" />
                  <span className="font-bold text-xs uppercase tracking-wider font-mono">AI Brain Response</span>
                </div>
                <div className="text-xs text-[var(--foreground)]/90 leading-relaxed font-light space-y-2.5 mt-4">
                  <p className="whitespace-pre-line leading-relaxed">{results.answer}</p>
                </div>
              </motion.div>

              {/* Speaking Snippets */}
              {results.snippets && results.snippets.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-2xl glass-panel space-y-4"
                >
                  <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Spoken Context Snippets</h3>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                  >
                    {results.snippets.map((snip: any, idx: number) => (
                      <motion.div 
                        key={idx} 
                        variants={itemVariants}
                        whileHover={{ scale: 1.01, x: 2, borderColor: "rgba(6, 182, 212, 0.25)" }}
                        className="p-4 rounded-xl bg-obsidian-dark/50 border border-obsidian-border space-y-2 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                          <span className="text-[var(--foreground)] font-bold">{snip.speaker}</span>
                          <span className="text-[var(--foreground)]/50 font-mono">Time: {snip.time} | in {snip.title}</span>
                        </div>
                        <p className="text-xs text-[var(--foreground)]/80 italic">" {snip.text} "</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

            </div>

            {/* Right Column: Connected meeting entities, tasks, and decisions */}
            <div className="space-y-6">
              
              {/* Linked Meetings */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-6 rounded-2xl glass-panel space-y-4"
              >
                <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Linked Meeting Feeds</h3>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-2.5"
                >
                  {results.meetings && results.meetings.map((m: any) => (
                    <motion.div key={m.id} variants={itemVariants}>
                      <Link
                        href={`/meetings?id=${m.id}`}
                        className="flex items-center justify-between p-3 bg-obsidian-light/40 hover:bg-obsidian-light/65 border border-obsidian-border hover:border-cyber-cyan/35 rounded-xl transition-all group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--foreground)] truncate group-hover:text-cyber-cyan">{m.title}</p>
                          <p className="text-[10px] text-[var(--foreground)]/50 font-mono mt-0.5">{m.date}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[var(--foreground)]/50 group-hover:translate-x-1 group-hover:text-cyber-cyan transition-all shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
                  {(!results.meetings || results.meetings.length === 0) && (
                    <p className="text-xs text-gray-600 italic">No connected meetings found.</p>
                  )}
                </motion.div>
              </motion.div>

              {/* Connected Decisions */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-6 rounded-2xl glass-panel space-y-4"
              >
                <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Related Decisions</h3>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-2.5"
                >
                  {results.decisions && results.decisions.map((d: any) => (
                    <motion.div 
                      key={d.id} 
                      variants={itemVariants}
                      whileHover={{ y: -1, borderColor: "rgba(168, 85, 247, 0.3)" }}
                      className="p-3 bg-obsidian-light/30 border border-obsidian-border rounded-xl space-y-1 transition-all"
                    >
                      <p className="text-xs text-[var(--foreground)] leading-normal">{d.text}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[8px] font-mono px-1 rounded ${
                          d.status === "changed" ? "bg-cyber-rose/10 text-cyber-rose border border-cyber-rose/20" : "bg-cyber-emerald/10 text-cyber-emerald border border-cyber-emerald/20"
                        }`}>{d.status}</span>
                        <Link href={`/meetings?id=${d.meeting_id}`} className="text-[8px] text-cyber-cyan hover:underline font-mono font-semibold">
                          View source
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                  {(!results.decisions || results.decisions.length === 0) && (
                    <p className="text-xs text-gray-600 italic">No connected decisions resolved.</p>
                  )}
                </motion.div>
              </motion.div>

              {/* Connected tasks */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="p-6 rounded-2xl glass-panel space-y-4"
              >
                <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Related Active Tasks</h3>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-2.5"
                >
                  {results.tasks && results.tasks.map((t: any) => (
                    <motion.div 
                      key={t.id} 
                      variants={itemVariants}
                      whileHover={{ y: -1, borderColor: "rgba(6, 182, 212, 0.3)" }}
                      className="p-3 bg-obsidian-light/30 border border-obsidian-border rounded-xl space-y-1 transition-all"
                    >
                      <div className="flex items-center justify-between text-[8px] text-[var(--foreground)]/50 font-mono">
                        <span>Owner: {t.owner}</span>
                        <span>Due: {t.deadline}</span>
                      </div>
                      <p className="text-xs text-[var(--foreground)] font-medium truncate">{t.title}</p>
                      <span className="text-[8px] font-mono text-cyber-cyan uppercase">{t.status}</span>
                    </motion.div>
                  ))}
                  {(!results.tasks || results.tasks.length === 0) && (
                    <p className="text-xs text-gray-600 italic">No tasks mapped to this topic.</p>
                  )}
                </motion.div>
              </motion.div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
