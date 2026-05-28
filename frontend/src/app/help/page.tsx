"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  BookOpen, 
  Radio, 
  UploadCloud, 
  Sparkles, 
  Shield, 
  Lock, 
  LifeBuoy, 
  ChevronDown, 
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: React.ReactNode;
}

const FAQ_CATEGORIES = [
  { id: "all", label: "All Topics", icon: HelpCircle, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  { id: "getting-started", label: "Getting Started", icon: BookOpen, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  { id: "live-assistant", label: "Live Assistant", icon: Radio, color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  { id: "upload-meetings", label: "Upload Meetings", icon: UploadCloud, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  { id: "ai-features", label: "AI Features", icon: Sparkles, color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
  { id: "authentication", label: "Authentication", icon: Shield, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { id: "privacy-security", label: "Privacy & Security", icon: Lock, color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
  { id: "troubleshooting", label: "Troubleshooting", icon: LifeBuoy, color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
];

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "started-1",
    category: "getting-started",
    question: "What is MemoMind and how do I get started?",
    answer: (
      <div className="space-y-2">
        <p>
          MemoMind acts as an autonomous organizational memory intelligence engine. It is designed to capture meetings, extract key decisions, assign task tracking lists, and monitor plan contradictions automatically, so your team doesn't lose context.
        </p>
        <p className="font-semibold text-cyan-400 flex items-center gap-1.5 mt-2">
          To get started:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[var(--foreground)]/70 pl-2">
          <li>Sign in using your corporate account (Email, Google, GitHub, or Phone).</li>
          <li>Head to the <strong>Add Meeting</strong> tab to start a Live Stream or upload an audio file.</li>
          <li>Review compiled intelligence reports on the <strong>Read Meetings</strong> or <strong>Decisions</strong> panels.</li>
        </ol>
      </div>
    )
  },
  {
    id: "live-1",
    category: "live-assistant",
    question: "How does the Live Assistant work?",
    answer: (
      <div className="space-y-2">
        <p>
          The Live Assistant streams live microphone audio and aggregates visual frames from shared browser tabs or applications to build real-time transcript logs.
        </p>
        <p>
          As the conversation flows, a background multi-agent orchestrator continuously processes the dialogue to isolate commitments, flag plan conflicts, and identify detected speakers. When you stop the session, these components formulate an exhaustive executive briefing.
        </p>
      </div>
    )
  },
  {
    id: "live-2",
    category: "live-assistant",
    question: "How does screen sharing work?",
    answer: (
      <div className="space-y-2">
        <p>
          By clicking <strong>Share Screen</strong>, the app prompts you to select a Chrome tab, window, or entire screen. 
        </p>
        <p>
          MemoMind takes periodic visual snapshots of the shared display to extract textual context (e.g. mockups, codes, slides) using visual AI. This context is integrated with the spoken dialogue to give the AI assistant a deep understanding of your work.
        </p>
      </div>
    )
  },
  {
    id: "live-3",
    category: "live-assistant",
    question: "How does the Google Meet-style snap popup behavior work?",
    answer: (
      <div className="space-y-2">
        <p>
          When you start screen sharing, a floating control capsule appears at the bottom of the screen.
        </p>
        <p>
          Just like Google Meet, this capsule displays presenting stats, mic triggers, and timers. You can drag it anywhere in the window; if you release it near a corner, it automatically snaps smoothly. It also automatically fades out to reduce screen clutter when your cursor leaves the capsule, and reappears on hover.
        </p>
      </div>
    )
  },
  {
    id: "live-4",
    category: "live-assistant",
    question: "How does meeting recording and audio packet streaming work?",
    answer: (
      <div className="space-y-2">
        <p>
          MemoMind uses the browser's <code>MediaRecorder</code> API to capture high-fidelity audio chunks.
        </p>
        <p>
          These chunks are encoded and piped through a secure WebSocket connection to our FastAPI backend. The server streams these packets to our real-time Whisper transcription model, ensuring minimal latency and extremely high transcription accuracy.
        </p>
      </div>
    )
  },
  {
    id: "upload-1",
    category: "upload-meetings",
    question: "How do I upload past meeting recordings?",
    answer: (
      <div className="space-y-2">
        <p>
          Simply navigate to the <strong>Add Meeting</strong> page, select the <strong>Upload Audio File</strong> tab, drag your recording file into the drop zone, and type a session title.
        </p>
        <p>
          Our backend will process the complete recording, execute speaker diarization to segregate who spoke when, and index the entire session in your workspace database.
        </p>
      </div>
    )
  },
  {
    id: "upload-2",
    category: "upload-meetings",
    question: "What file formats are supported for meeting uploads?",
    answer: (
      <div className="space-y-2">
        <p>
          MemoMind supports a variety of modern audio formats:
        </p>
        <div className="flex flex-wrap gap-2 py-1.5">
          <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 font-mono text-[10px]">.MP3 (Standard Audio)</span>
          <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 font-mono text-[10px]">.WAV (Lossless Audio)</span>
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 font-mono text-[10px]">.M4A (Apple Audio)</span>
          <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 font-mono text-[10px]">.MP4 (MPEG-4 Video/Audio Extraction)</span>
        </div>
        <p className="text-[11px] text-[var(--foreground)]/50 font-sans italic">
          Max file upload size is set to 100MB by default, which accommodates roughly 2.5 hours of compressed audio.
        </p>
      </div>
    )
  },
  {
    id: "ai-1",
    category: "ai-features",
    question: "How do AI summaries and briefings work?",
    answer: (
      <div className="space-y-2">
        <p>
          After a meeting, MemoMind triggers our Multi-Agent Compiler, dividing the task among specialized agents:
        </p>
        <ul className="list-disc list-inside space-y-1 text-[var(--foreground)]/70 pl-2">
          <li><span className="text-cyan-400 font-semibold">Summarizer Agent</span>: Constructs the executive brief and maps meeting timeline components.</li>
          <li><span className="text-purple-400 font-semibold">Diarizer Agent</span>: Evaluates voice footprints to outline speaker percentages.</li>
          <li><span className="text-rose-400 font-semibold">Conflict Agent</span>: Cross-checks decisions against the historical SQLite memory graph.</li>
        </ul>
      </div>
    )
  },
  {
    id: "ai-2",
    category: "ai-features",
    question: "How are tasks and deadlines detected?",
    answer: (
      <div className="space-y-2">
        <p>
          Our Semantic Extraction Agent parses transcripts for actionable dialogue structures (e.g. <em>"Fletcher will deploy the login screens by next Tuesday"</em> or <em>"Let's finalize database selection by Friday"</em>).
        </p>
        <p>
          The model extracts:
        </p>
        <ul className="list-disc list-inside space-y-1 text-[var(--foreground)]/70 pl-2">
          <li><strong>Task Title</strong>: The actionable scope of the task.</li>
          <li><strong>Assignee/Owner</strong>: The specific team member responsible.</li>
          <li><strong>Deadline</strong>: Extracted dates mapped dynamically to calendar timelines.</li>
        </ul>
      </div>
    )
  },
  {
    id: "ai-3",
    category: "ai-features",
    question: "How does the plan contradiction engine work?",
    answer: (
      <div className="space-y-2">
        <p>
          Every time a new decision is resolved, the backend embeds the decision text and runs a semantic comparison search against all decisions stored in your SQLite database.
        </p>
        <p>
          If it detects a high-confidence mismatch (e.g., agreeing to build in-house on Monday but deciding to outsource on Thursday), it raises a <strong>Plan Conflict Alert</strong>. This helps teams address shifting goals before waste occurs.
        </p>
      </div>
    )
  },
  {
    id: "auth-1",
    category: "authentication",
    question: "What are the supported authentication methods?",
    answer: (
      <div className="space-y-2">
        <p>
          MemoMind features a complete redesigned Firebase Authentication core that supports four primary entry methods:
        </p>
        <div className="grid grid-cols-2 gap-3 py-1 text-[11px]">
          <div className="p-2.5 bg-[var(--foreground)]/[0.03] border border-white/[0.05] rounded-xl flex items-center gap-2">
            <span className="text-base">📧</span>
            <div>
              <span className="font-bold block">Email/Password</span>
              <span className="text-[10px] text-[var(--foreground)]/50">Secure Firebase register</span>
            </div>
          </div>
          <div className="p-2.5 bg-[var(--foreground)]/[0.03] border border-white/[0.05] rounded-xl flex items-center gap-2">
            <span className="text-base">🌐</span>
            <div>
              <span className="font-bold block">Google SSO</span>
              <span className="text-[10px] text-[var(--foreground)]/50">One-click secure OAuth</span>
            </div>
          </div>
          <div className="p-2.5 bg-[var(--foreground)]/[0.03] border border-white/[0.05] rounded-xl flex items-center gap-2">
            <span className="text-base">🐙</span>
            <div>
              <span className="font-bold block">GitHub SSO</span>
              <span className="text-[10px] text-[var(--foreground)]/50">OAuth token validation</span>
            </div>
          </div>
          <div className="p-2.5 bg-[var(--foreground)]/[0.03] border border-white/[0.05] rounded-xl flex items-center gap-2">
            <span className="text-base">📱</span>
            <div>
              <span className="font-bold block">Phone OTP</span>
              <span className="text-[10px] text-[var(--foreground)]/50">6-digit SMS verification</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "auth-2",
    category: "authentication",
    question: "Why is my login failing and what do error codes mean?",
    answer: (
      <div className="space-y-2">
        <p>
          If your login fails, MemoMind catches real-time error parameters returned by Firebase Auth SDK:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-[var(--foreground)]/70 pl-2">
          <li><strong className="text-rose-400 font-mono">Incorrect password</strong>: Captured from <code>auth/wrong-password</code>. Verify your characters.</li>
          <li><strong className="text-rose-400 font-mono">Invalid email</strong>: Captured from <code>auth/invalid-email</code>. Ensure proper format pattern.</li>
          <li><strong className="text-rose-400 font-mono">Account not found</strong>: Captured from <code>auth/user-not-found</code>. Register a new profile first.</li>
          <li><strong className="text-rose-400 font-mono">Weak password</strong>: Captured from <code>auth/weak-password</code>. Password must be 6+ characters.</li>
          <li><strong className="text-rose-400 font-mono">Network error</strong>: Indicates a connectivity failure to Firebase or your FastAPI local server.</li>
        </ul>
      </div>
    )
  },
  {
    id: "priv-1",
    category: "privacy-security",
    question: "Is my meeting data private and secure?",
    answer: (
      <div className="space-y-2">
        <p>
          <strong>Yes. Absolutely.</strong>
        </p>
        <p>
          MemoMind does not upload your audio recordings or textual summaries to public database servers. All databases are hosted inside your local workspace. All communications use TLS 1.3 encryption, and data transmission uses AES-256 standard encoding. Your meeting records are never used for external AI training.
        </p>
      </div>
    )
  },
  {
    id: "priv-2",
    category: "privacy-security",
    question: "Where is my data stored?",
    answer: (
      <div className="space-y-2">
        <p>
          Transcripts, decisions, and task entities are logged directly into an local **SQLite Database** managed via SQLModel at the backend layer.
        </p>
        <p>
          Audio clips are safely placed inside the local <code>uploads/</code> directory on your host machine. You maintain 100% data residency and ownership.
        </p>
      </div>
    )
  },
  {
    id: "trouble-1",
    category: "troubleshooting",
    question: "My microphone is not capturing audio. How do I fix this?",
    answer: (
      <div className="space-y-2">
        <p>
          If the Live Assistant cannot ingest your voice, check these troubleshooting steps:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[var(--foreground)]/70 pl-2">
          <li>Ensure you have granted microphone access to the browser when prompted. Check browser preferences: <em>Settings &gt; Privacy & Security &gt; Site Settings &gt; Microphone</em>.</li>
          <li>Verify that your recording device is not muted at the operating system level.</li>
          <li>If you are using external virtual soundcards or headphones, ensure the correct primary input device is set.</li>
        </ol>
      </div>
    )
  },
  {
    id: "trouble-2",
    category: "troubleshooting",
    question: "What should I do if I get a WebSocket connection error?",
    answer: (
      <div className="space-y-2">
        <p>
          A WebSocket connection error generally implies that the FastAPI backend server is not running or accessible.
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[var(--foreground)]/70 pl-2">
          <li>Verify your Python environment is running: <code>.venv\Scripts\python run.py</code> in the terminal.</li>
          <li>Ensure your firewall is not blocking port <code>8000</code>.</li>
          <li>Verify that <code>NEXT_PUBLIC_API_URL</code> is properly set to <code>http://127.0.0.1:8000</code> inside your <code>frontend/.env.local</code>.</li>
        </ol>
      </div>
    )
  },
  {
    id: "trouble-3",
    category: "troubleshooting",
    question: "How do I resolve a Firebase Session timeout error?",
    answer: (
      <div className="space-y-2">
        <p>
          If your session expires, it usually indicates that your local JWT tokens could not sync with Firebase Admin.
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[var(--foreground)]/70 pl-2">
          <li>Check that your computer's date and time are synchronized automatically. Misaligned local clocks will invalidate Firebase tokens.</li>
          <li>Log out and log back in to refresh all active token chains.</li>
          <li>Check the backend logs to confirm that the SQLite database engine is not locked or unresponsive.</li>
        </ol>
      </div>
    )
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openFAQId, setOpenFAQId] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    if (openFAQId === id) {
      setOpenFAQId(null);
    } else {
      setOpenFAQId(id);
    }
  };

  const filteredFAQs = FAQ_ITEMS.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12 font-sans"
    >
      
      {/* Hero Header */}
      <div className="p-6 md:p-8 bg-[var(--foreground)]/[0.01] border border-[var(--color-obsidian-border)] rounded-3xl backdrop-blur-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyber-purple/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 space-y-2.5 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple tracking-widest uppercase flex items-center gap-1.5 shadow-sm w-fit">
            <HelpCircle className="h-3.5 w-3.5" /> MemoMind Help Center
          </span>
          <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight leading-none text-glow-cyber">
            How can we help you today?
          </h2>
          <p className="text-[var(--foreground)]/70 text-sm leading-relaxed">
            Search our user guide and FAQ repository below, or filter by category to understand Live Assistant streaming, screen sharing popup snapping, Whisper audio pipelines, and credentials auth verification.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search FAQs by keywords: 'microphone', 'screen share', 'deadlines', 'contradicton'..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--foreground)]/[0.02] border border-[var(--color-obsidian-border)] focus:border-cyber-purple/50 rounded-2xl pl-12 pr-6 py-4 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none transition-all"
        />
        <Search className="absolute left-4 top-4.5 h-5 w-5 text-[var(--foreground)]/45" />
      </div>

      {/* Category Pills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {FAQ_CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2.5 cursor-pointer text-center relative overflow-hidden group ${
                isActive 
                  ? "bg-gradient-to-tr from-cyber-purple/20 to-cyber-cyan/10 border-cyber-purple/50 text-[var(--foreground)] shadow-lg shadow-cyber-purple/5" 
                  : "bg-[var(--foreground)]/[0.01] border-[var(--color-obsidian-border)] hover:border-cyber-purple/20 text-[var(--foreground)]/65 hover:text-[var(--foreground)]"
              }`}
            >
              <div className={`h-8 w-8 rounded-xl border flex items-center justify-center shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                isActive ? "bg-cyber-purple/15 text-cyber-purple border-cyber-purple/20" : cat.color
              }`}>
                <CatIcon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold tracking-tight font-sans leading-none">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* FAQs Accordion List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono border-b border-[var(--color-obsidian-border)] pb-2 flex items-center justify-between">
          <span>FAQ Items ({filteredFAQs.length})</span>
          {activeCategory !== "all" && (
            <button 
              onClick={() => setActiveCategory("all")}
              className="text-[10px] text-cyber-cyan hover:underline cursor-pointer lowercase"
            >
              Clear filter
            </button>
          )}
        </h3>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => {
                const isOpen = openFAQId === faq.id;
                const catInfo = FAQ_CATEGORIES.find(c => c.id === faq.category);
                
                return (
                  <motion.div
                    key={faq.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 rounded-2xl border border-[var(--color-obsidian-border)] bg-[var(--foreground)]/[0.01] hover:bg-white/[0.005] hover:border-cyber-purple/25 transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] px-2 py-0.5 rounded bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] text-[var(--foreground)]/50 font-mono">
                            {catInfo?.label}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[var(--foreground)] group-hover:text-cyber-cyan transition-colors truncate">
                          {faq.question}
                        </h4>
                      </div>
                      
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        className="h-7 w-7 rounded-lg bg-[var(--foreground)]/[0.03] border border-[var(--color-obsidian-border)] flex items-center justify-center text-[var(--foreground)]/60"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="overflow-hidden border-t border-[var(--color-obsidian-border)] pt-4 text-xs text-[var(--foreground)]/80 leading-relaxed font-sans"
                        >
                          {faq.answer}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center bg-[var(--foreground)]/[0.01] border border-[var(--color-obsidian-border)] rounded-2xl text-[var(--foreground)]/50 font-mono text-xs flex flex-col items-center gap-3"
              >
                <AlertCircle className="h-8 w-8 text-gray-700 animate-bounce" />
                <span>No FAQs matched your query parameters. Try using simpler keywords.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </motion.div>
  );
}
