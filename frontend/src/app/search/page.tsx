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

// Suggestions list
const SUGGESTED_QUERIES = [
  "When did we discuss authentication?",
  "What were the arguments against microservices?",
  "What tasks are assigned to Aman?",
  "Show decisions related to database selection."
];

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
      await new Promise(resolve => setTimeout(resolve, 1500));
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
        <h2 className="text-2xl font-bold text-white tracking-tight">Semantic Memory Oracle</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Ask conversational questions directly to your organization's memory graphs, tracking decision lineage instantly.
        </p>
      </div>

      {/* Chat Bar Entry */}
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Ask MeetGraph: 'Why did we change our microservices stance?' or 'What are Reeti's deadlines?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-obsidian-light/60 border border-obsidian-border rounded-2xl pl-12 pr-28 py-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all border-glow-purple"
            />
            <BrainCircuit className="absolute left-4 top-3.5 h-6 w-6 text-cyber-purple" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-2.5 px-5 py-2 text-xs bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:from-cyber-purple hover:to-cyber-purple transition-all duration-300 rounded-xl text-white font-bold disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>Ask AI <ArrowRight className="h-3.5 w-3.5" /></>
            )}
          </button>
        </form>

        {/* Suggestion Prompts */}
        {!results && !loading && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-mono">Suggested Prompt Prompts:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleSubmit(e, sq)}
                  className="px-3.5 py-2 text-[11px] text-gray-400 bg-obsidian-light/30 hover:bg-obsidian-light/70 hover:text-white border border-obsidian-border rounded-xl transition-all font-light"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Processing Loader */}
      {loading && (
        <div className="p-12 rounded-2xl glass-panel flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <Loader2 className="h-10 w-10 text-cyber-cyan animate-spin" />
          <p className="text-xs font-mono text-cyber-cyan animate-pulse">Running semantic token matching & contradiction search...</p>
        </div>
      )}

      {/* Results Workspace Canvas */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Left Column: Conversational Answer and Snippets */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Direct Answer */}
            <div className="p-6 rounded-2xl bg-obsidian-light/65 border border-obsidian-border space-y-4">
              <div className="flex items-center gap-2 text-cyber-purple">
                <BrainCircuit className="h-5.5 w-5.5 animate-pulse" />
                <span className="font-bold text-xs uppercase tracking-wider font-mono">AI Brain Response</span>
              </div>
              <div className="text-xs text-gray-200 leading-relaxed font-light space-y-2.5">
                <p>{results.answer}</p>
              </div>
            </div>

            {/* Speaking Snippets */}
            {results.snippets && results.snippets.length > 0 && (
              <div className="p-6 rounded-2xl glass-panel space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Spoken Context Snippets</h3>
                <div className="space-y-3">
                  {results.snippets.map((snip: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-obsidian-dark/50 border border-obsidian-border space-y-2">
                      <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                        <span className="text-white font-bold">{snip.speaker}</span>
                        <span className="text-gray-500">Time: {snip.time} | in {snip.title}</span>
                      </div>
                      <p className="text-xs text-gray-300 italic">" {snip.text} "</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Connected meeting entities, tasks, and decisions */}
          <div className="space-y-6">
            
            {/* Linked Meetings */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Linked Meeting Feeds</h3>
              <div className="space-y-2.5">
                {results.meetings && results.meetings.map((m: any) => (
                  <Link
                    key={m.id}
                    href={`/meetings?id=${m.id}`}
                    className="flex items-center justify-between p-3 bg-obsidian-light/40 hover:bg-obsidian-light/65 border border-obsidian-border rounded-xl transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-cyber-cyan">{m.title}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{m.date}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-500 group-hover:translate-x-1 transition-transform shrink-0" />
                  </Link>
                ))}
                {(!results.meetings || results.meetings.length === 0) && (
                  <p className="text-xs text-gray-600 italic">No connected meetings found.</p>
                )}
              </div>
            </div>

            {/* Connected Decisions */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Related Decisions</h3>
              <div className="space-y-2.5">
                {results.decisions && results.decisions.map((d: any) => (
                  <div key={d.id} className="p-3 bg-obsidian-light/30 border border-obsidian-border rounded-xl space-y-1">
                    <p className="text-xs text-white leading-normal">{d.text}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[8px] font-mono px-1 rounded ${
                        d.status === "changed" ? "bg-cyber-rose/10 text-cyber-rose" : "bg-cyber-emerald/10 text-cyber-emerald"
                      }`}>{d.status}</span>
                      <Link href={`/meetings?id=${d.meeting_id}`} className="text-[8px] text-cyber-cyan hover:underline font-mono">
                        View source
                      </Link>
                    </div>
                  </div>
                ))}
                {(!results.decisions || results.decisions.length === 0) && (
                  <p className="text-xs text-gray-600 italic">No connected decisions resolved.</p>
                )}
              </div>
            </div>

            {/* Connected tasks */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Related Active Tasks</h3>
              <div className="space-y-2.5">
                {results.tasks && results.tasks.map((t: any) => (
                  <div key={t.id} className="p-3 bg-obsidian-light/30 border border-obsidian-border rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[8px] text-gray-500 font-mono">
                      <span>Owner: {t.owner}</span>
                      <span>Due: {t.deadline}</span>
                    </div>
                    <p className="text-xs text-white font-medium truncate">{t.title}</p>
                    <span className="text-[8px] font-mono text-cyber-cyan uppercase">{t.status}</span>
                  </div>
                ))}
                {(!results.tasks || results.tasks.length === 0) && (
                  <p className="text-xs text-gray-600 italic">No tasks mapped to this topic.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
