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

// Robust Fallbacks
const MOCK_DECISIONS = [
  { id: 4, text: "Implement Clerk OAuth for user authentication to accelerate launch speed.", status: "accepted", meeting_id: 3, meeting_title: "SaaS Scaling & Microservices Shift", date: "2026-05-18", related_options: ["Custom JWT token engine", "Auth0 enterprise"], overrides_decision_id: null },
  { id: 3, text: "Migrate core user and feed profile modules to a microservices architecture to support horizontal load scaling.", status: "accepted", meeting_id: 3, meeting_title: "SaaS Scaling & Microservices Shift", date: "2026-05-18", related_options: ["Monolithic architecture expansion"], overrides_decision_id: 1 },
  { id: 2, text: "Select PostgreSQL as the primary relational database platform instead of SQLite for production durability.", status: "accepted", meeting_id: 2, meeting_title: "Database & Auth Architecture Deep-Dive", date: "2026-05-14", related_options: ["SQLite", "MySQL"], overrides_decision_id: null },
  { id: 1, text: "Avoid microservices and build a unified monolithic backend to avoid API gateway and networking overhead.", status: "changed", meeting_id: 1, meeting_title: "Project Alpha Kickoff & DB Planning", date: "2026-05-10", related_options: ["Microservices cluster", "Serverless micro-routes"], overrides_decision_id: 3 }
];

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
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Decision Lineage Index</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Audit chronological decision matrices, track overriding policy lineages, and examine dismissed alternatives.
        </p>
      </div>

      {/* Control bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search decision details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-obsidian-dark border border-obsidian-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-obsidian-dark border border-obsidian-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyber-purple"
          >
            <option value="all">All States</option>
            <option value="accepted">Accepted</option>
            <option value="changed">Changed / Overridden</option>
          </select>
        </div>
      </div>

      {/* Decisions Timeline layout */}
      <div className="relative border-l border-obsidian-border pl-6 ml-4 space-y-8 py-4">
        {getFilteredDecisions().map((dec) => {
          const isExpanded = expandedId === dec.id;
          
          return (
            <div key={dec.id} className="relative">
              {/* Timeline bubble bullet indicator */}
              <div className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 flex items-center justify-center bg-obsidian-dark ${
                dec.status === "accepted"
                  ? "border-cyber-emerald"
                  : dec.status === "changed"
                  ? "border-cyber-rose animate-pulse"
                  : "border-cyber-cyan"
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${
                  dec.status === "accepted"
                    ? "bg-cyber-emerald"
                    : dec.status === "changed"
                    ? "bg-cyber-rose"
                    : "bg-cyber-cyan"
                }`} />
              </div>

              {/* Card content */}
              <div className="glass-panel hover:border-cyber-purple/20 transition-all p-5 rounded-2xl space-y-4">
                
                {/* Upper line: meeting details & overrides warning */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-400 font-mono">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{dec.date}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-700" />
                    <Link href={`/meetings?id=${dec.meeting_id}`} className="hover:underline flex items-center gap-0.5 text-cyber-cyan">
                      {dec.meeting_title} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold ${
                      dec.status === "accepted"
                        ? "bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald"
                        : dec.status === "changed"
                        ? "bg-cyber-rose/10 border border-cyber-rose/20 text-cyber-rose"
                        : "bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan"
                    }`}>
                      {dec.status}
                    </span>
                  </div>
                </div>

                {/* Main Statement */}
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {dec.text}
                </p>

                {/* Overriding Linage indicator */}
                {dec.overrides_decision_id && (
                  <div className={`p-3 rounded-xl border text-[11px] font-mono leading-relaxed flex items-center gap-2.5 ${
                    dec.status === "changed"
                      ? "bg-cyber-rose/5 border-cyber-rose/15 text-cyber-rose"
                      : "bg-cyber-emerald/5 border-cyber-emerald/15 text-cyber-emerald"
                  }`}>
                    {dec.status === "changed" ? (
                      <>
                        <ArrowLeftRight className="h-4.5 w-4.5 shrink-0" />
                        <span>
                          Overridden: Shuffled in Meeting #3 to Dec decided to migrate to microservices.
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                        <span>
                          Overrides past decision: Shifted from avoiding microservices (Meeting #1).
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Accordion detail drawer: alternative options discussed */}
                <div className="border-t border-obsidian-border/50 pt-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : dec.id)}
                    className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-white"
                  >
                    <span>Examine dismissed options</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-3 bg-obsidian-dark/50 border border-obsidian-border rounded-xl space-y-2">
                      <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Options Debated & Rejected</h4>
                      <div className="space-y-1.5 pl-2 border-l border-obsidian-border">
                        {dec.related_options && dec.related_options.map((opt: string, idx: number) => (
                          <div key={idx} className="text-xs text-gray-400 flex items-center gap-1.5 font-light">
                            <span className="text-cyber-rose">✕</span>
                            <span>{opt}</span>
                          </div>
                        ))}
                        {(!dec.related_options || dec.related_options.length === 0) && (
                          <span className="text-[10px] text-gray-600 italic">No alternative routes indexed.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
        {getFilteredDecisions().length === 0 && (
          <p className="text-xs text-gray-500 text-center py-8">No historical decisions matched your criteria.</p>
        )}
      </div>

    </div>
  );
}
