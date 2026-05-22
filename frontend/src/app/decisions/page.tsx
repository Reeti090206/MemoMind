"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, 
  HelpCircle, 
  History, 
  ArrowLeftRight, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  TrendingDown,
  ExternalLink,
  ShieldCheck,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Robust Fallbacks
const MOCK_DECISIONS = [
  { id: 4, text: "Implement Clerk OAuth for user authentication to accelerate launch speed.", status: "accepted", meeting_id: 3, meeting_title: "SaaS Scaling & Microservices Shift", date: "2026-05-18", related_options: ["Custom JWT token engine", "Auth0 enterprise"], overrides_decision_id: null },
  { id: 3, text: "Migrate core user and feed profile modules to a microservices architecture to support horizontal load scaling.", status: "accepted", meeting_id: 3, meeting_title: "SaaS Scaling & Microservices Shift", date: "2026-05-18", related_options: ["Monolithic architecture expansion"], overrides_decision_id: 1 },
  { id: 2, text: "Select PostgreSQL as the primary relational database platform instead of SQLite for production durability.", status: "accepted", meeting_id: 2, meeting_title: "Database & Auth Architecture Deep-Dive", date: "2026-05-14", related_options: ["SQLite", "MySQL"], overrides_decision_id: null },
  { id: 1, text: "Avoid microservices and build a unified monolithic backend to avoid API gateway and networking overhead.", status: "changed", meeting_id: 1, meeting_title: "Project Alpha Kickoff & DB Planning", date: "2026-05-10", related_options: ["Microservices cluster", "Serverless micro-routes"], overrides_decision_id: 3 }
];

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

const decisionItemVariants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 90, damping: 14 } }
};

export default function DecisionTimeline() {
  const [decisions, setDecisions] = useState<any[]>(MOCK_DECISIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    async function loadDecisions() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/decisions");
        if (res.ok) {
          setDecisions(await res.ok ? await res.json() : MOCK_DECISIONS);
        }
      } catch (err) {
        console.log("Using mockup fallback for Decisions");
      }
    }
    loadDecisions();
  }, []);

  const getFilteredDecisions = () => {
    return decisions.filter((d) => {
      const matchQuery = d.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         d.meeting_title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === "all" || d.status === filterStatus;
      return matchQuery && matchStatus;
    });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Decisions</h2>
        <p className="text-gray-400 text-sm mt-0.5 font-sans">
          Review past decisions, search options considered, and see when plans have changed.
        </p>
      </div>

      {/* Control bar */}
      <div className="p-4 rounded-2xl glass-card flex flex-wrap items-center justify-between gap-4 bg-transparent border-white/5">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/45 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all font-sans"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-sans">Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-black/45 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyber-purple cursor-pointer font-sans"
          >
            <option value="all">All Decisions</option>
            <option value="accepted">Active</option>
            <option value="changed">Superseded</option>
          </select>
        </div>
      </div>

      {/* Decisions Timeline layout */}
      <motion.div 
        variants={listContainerVariants}
        initial="hidden"
        animate="show"
        className="relative border-l border-white/10 pl-6 ml-4 space-y-8 py-4"
      >
        <AnimatePresence mode="popLayout">
          {getFilteredDecisions().map((dec) => {
            const isExpanded = expandedId === dec.id;
            
            return (
              <motion.div 
                key={dec.id} 
                variants={decisionItemVariants}
                className="relative"
              >
                {/* Timeline bubble bullet indicator */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 150, damping: 10, delay: 0.1 }}
                  className={`absolute -left-[31px] top-2 h-4 w-4 rounded-full border-2 flex items-center justify-center bg-black z-10 ${
                    dec.status === "accepted"
                      ? "border-cyber-emerald"
                      : dec.status === "changed"
                      ? "border-cyber-rose"
                      : "border-cyber-cyan"
                  }`}
                >
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    dec.status === "accepted"
                      ? "bg-cyber-emerald"
                      : dec.status === "changed"
                      ? "bg-cyber-rose animate-pulse"
                      : "bg-cyber-cyan"
                  }`} />
                </motion.div>

                {/* Card content */}
                <motion.div 
                  whileHover={{ y: -3 }}
                  className="glass-card border border-white/5 hover:border-cyber-purple/35 transition-all duration-300 p-5 rounded-2xl space-y-4 bg-transparent shadow-lg"
                >
                  
                  {/* Upper line: meeting details & overrides warning */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
                    <div className="flex items-center gap-2 text-gray-400 font-sans">
                      <Calendar className="h-3.5 w-3.5 text-cyber-purple" />
                      <span className="font-mono">{dec.date}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                      <Link href={`/meetings?id=${dec.meeting_id}`} className="hover:underline flex items-center gap-1 text-cyber-cyan font-semibold">
                        {dec.meeting_title} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold border ${
                        dec.status === "accepted"
                          ? "bg-cyber-emerald/10 border-cyber-emerald/25 text-cyber-emerald"
                          : dec.status === "changed"
                          ? "bg-cyber-rose/10 border-cyber-rose/25 text-cyber-rose animate-pulse"
                          : "bg-cyber-cyan/10 border-cyber-cyan/25 text-cyber-cyan"
                      }`}>
                        {dec.status === "accepted" ? "Active" : "Superseded"}
                      </span>
                    </div>
                  </div>

                  {/* Main Statement */}
                  <p className="text-sm font-semibold text-white leading-relaxed font-sans">
                    {dec.text}
                  </p>

                  {/* Overriding Linage indicator */}
                  {dec.overrides_decision_id && (
                    <div className={`p-3 rounded-xl border text-[11px] font-sans leading-relaxed flex items-center gap-2.5 ${
                      dec.status === "changed"
                        ? "bg-cyber-rose/5 border-cyber-rose/15 text-cyber-rose"
                        : "bg-cyber-emerald/5 border-cyber-emerald/15 text-cyber-emerald"
                    }`}>
                      {dec.status === "changed" ? (
                        <>
                          <ArrowLeftRight className="h-4.5 w-4.5 shrink-0 animate-pulse" />
                          <span>
                            Superseded in Meeting #3 by the plan to migrate to microservices.
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                          <span>
                            This replaces the past decision to avoid microservices (Meeting #1).
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Accordion detail drawer: alternative options discussed */}
                  <div className="border-t border-white/5 pt-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : dec.id)}
                      className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-white transition-colors cursor-pointer font-sans"
                    >
                      <span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5 text-cyber-cyan" /> View other options considered</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180 text-white" : ""}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" as const }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3.5 p-4 bg-black/45 border border-white/5 rounded-xl space-y-2.5">
                            <h4 className="text-[9px] uppercase font-bold text-gray-500 tracking-widest font-mono">Options Discussed & Rejected</h4>
                            <div className="space-y-2 pl-2 border-l border-cyber-rose/30">
                              {dec.related_options && dec.related_options.map((opt: string, idx: number) => (
                                <motion.div 
                                  key={idx} 
                                  initial={{ x: -5, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="text-xs text-gray-400 flex items-center gap-2 font-light font-sans"
                                >
                                  <span className="text-cyber-rose font-bold">✕</span>
                                  <span>{opt}</span>
                                </motion.div>
                              ))}
                              {(!dec.related_options || dec.related_options.length === 0) && (
                                <span className="text-[10px] text-gray-600 italic font-sans">No alternative routes considered.</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {getFilteredDecisions().length === 0 && (
          <p className="text-xs text-gray-500 text-center py-10 border border-dashed border-white/10 rounded-2xl font-sans">No decisions match your search yet.</p>
        )}
      </motion.div>

    </div>
  );
}
