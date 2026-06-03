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
  Info,
  X
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
  const [acceptNotification, setAcceptNotification] = useState<string | null>(null);
  const [isProcessingInvite, setIsProcessingInvite] = useState(false);

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

  // Handle invitation URL parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const acceptInvite = params.get("accept_invite");
    const token = params.get("token");

    if (acceptInvite === "true" && token) {
      async function handleAccept() {
        setIsProcessingInvite(true);
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/invitations/accept`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
          });
          if (res.ok) {
            const data = await res.json();
            setAcceptNotification(`Success! You have accepted the invitation and joined the shared workspace team.`);

            // Clean up the URL search params elegantly without a full page refresh
            const newUrl = window.location.pathname;
            window.history.pushState({ path: newUrl }, "", newUrl);

            // Re-fetch dashboard data instantly using the accepted user credentials
            if (user?.email) {
              const emailParam = `?user_email=${encodeURIComponent(user.email)}`;
              const [widgetsRes, meetingsRes, decisionsRes] = await Promise.all([
                fetch(`http://127.0.0.1:8000/api/analytics/widgets${emailParam}`),
                fetch(`http://127.0.0.1:8000/api/meetings${emailParam}`),
                fetch(`http://127.0.0.1:8000/api/decisions${emailParam}`)
              ]);
              if (widgetsRes.ok) setWidgets(await widgetsRes.json());
              if (meetingsRes.ok) setMeetings(await meetingsRes.json());
              if (decisionsRes.ok) setDecisions(await decisionsRes.json());
            }
          }
        } catch (err) {
          console.error("Error accepting invitation:", err);
        } finally {
          setIsProcessingInvite(false);
          // Dismiss banner after 7 seconds
          setTimeout(() => setAcceptNotification(null), 7000);
        }
      }
      handleAccept();
    }
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
    <div className="relative">
      {/* Processing invitation loader */}
      <AnimatePresence>
        {isProcessingInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)]/90 backdrop-blur-md"
          >
            <div className="relative h-16 w-16 flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full border-2 border-white/[0.05] border-t-cyber-purple animate-spin" />
              <Sparkles className="absolute h-5 w-5 text-cyber-cyan animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">Syncing Collaboration Workspace</h3>
            <p className="text-[10px] font-mono text-[var(--foreground)]/50 uppercase tracking-widest mt-1.5 animate-pulse">
              Verifying and adding you to all shared projects...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success banner toast */}
      <AnimatePresence>
        {acceptNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mb-6 p-4 rounded-2xl border border-cyber-emerald/20 bg-cyber-emerald/[0.03] backdrop-blur-xl shadow-[0_12px_40px_rgba(16,185,129,0.12)] flex items-center gap-3 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-cyber-emerald" />
            <div className="h-8 w-8 rounded-lg bg-cyber-emerald/10 border border-cyber-emerald/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5 text-cyber-emerald" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white tracking-wide">Invitation Accepted</h4>
              <p className="text-[11px] text-[var(--foreground)]/70 leading-relaxed mt-0.5">{acceptNotification}</p>
            </div>
            <button
              onClick={() => setAcceptNotification(null)}
              className="p-1 rounded-lg hover:bg-white/5 text-[var(--foreground)]/40 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="space-y-8 pb-12"
      >

        {/* 1. Header Hero Panel */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 saas-card relative overflow-hidden"
        >
          <div className="relative z-10 space-y-2 max-w-2xl">
            <h2 className="text-page-title">
              Team Memory Overview
            </h2>
            <p className="text-body-regular">
              Your team's shared memory bank. We keep track of your agreements, action plans, and key decisions from past syncs so you can find them instantly.
            </p>
          </div>

          <div className="flex flex-row items-center gap-3 shrink-0 relative z-10">
            <Link
              href="/upload"
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Meeting
            </Link>
          </div>
        </motion.div>

        {/* 2. Interactive Friendly AI Smart Alert */}
        <motion.div
          variants={itemVariants}
          className="p-5 bg-[rgba(255,107,107,0.08)] border-l-4 border-[var(--color-danger)] rounded-r-xl rounded-l-sm relative overflow-hidden group flex items-start gap-4"
        >
          <div className="h-10 w-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0 shadow-sm">
            <ShieldAlert className="h-5 w-5 text-[var(--color-danger)]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[var(--color-danger)] flex items-center gap-1.5">
              Plan Conflict Alert
            </h4>
            <p className="text-body-regular text-sm">
              {getFriendlyAlertText(widgets.latest_insight)}
            </p>
            <div className="pt-2 flex gap-3 text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-primary-dark)] transition-colors cursor-pointer items-center">
              <Link href="/decisions" className="flex items-center gap-1">
                See decision details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 3. Sleek Redesigned Widgets Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Meetings Card */}
          <motion.div
            variants={itemVariants}
            className="p-6 saas-card relative overflow-hidden group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-muted)]">Meetings Stored</span>
              <div className="h-10 w-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-[var(--color-accent)]" />
              </div>
            </div>
            <p className="text-card-value mt-4">
              {widgets.total_meetings}
            </p>
            <p className="text-small-regular text-[var(--color-accent)] mt-2 flex items-center gap-1.5 font-medium">
              <TrendingUp className="h-4 w-4" /> Ready to search
            </p>
          </motion.div>

          {/* Pending Decisions Card */}
          <motion.div
            variants={itemVariants}
            className="p-6 saas-card relative overflow-hidden group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-muted)]">Open Questions</span>
              <div className="h-10 w-10 rounded-xl bg-[var(--color-warning)]/10 flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5 text-[var(--color-warning)]" />
              </div>
            </div>
            <p className="text-card-value mt-4">
              {widgets.unresolved_discussions}
            </p>
            <p className="text-small-regular text-[var(--color-warning)] mt-2 flex items-center gap-1.5 font-medium">
              <Info className="h-4 w-4" /> Needs an answer
            </p>
          </motion.div>

          {/* Active Tasks Card */}
          <motion.div
            variants={itemVariants}
            className="p-6 saas-card relative overflow-hidden group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-muted)]">Active Tasks</span>
              <div className="h-10 w-10 rounded-xl bg-[var(--color-primary-dark)]/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-[var(--color-primary-dark)]" />
              </div>
            </div>
            <p className="text-card-value mt-4">
              {widgets.active_tasks}
            </p>
            <p className="text-small-regular text-[var(--color-primary-dark)] mt-2 flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4" /> Currently running
            </p>
          </motion.div>

          {/* Action Needed Card */}
          <motion.div
            variants={itemVariants}
            className="p-6 saas-card relative overflow-hidden group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-muted)]">Items Needing Action</span>
              <div className="h-10 w-10 rounded-xl bg-[var(--color-danger)]/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-[var(--color-danger)]" />
              </div>
            </div>
            <p className="text-card-value mt-4">
              {widgets.overdue_items}
            </p>
            <p className="text-small-regular text-[var(--color-danger)] mt-2 flex items-center gap-1.5 font-medium">
              <ShieldAlert className="h-4 w-4" /> Past deadline
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
              className="p-6 saas-card space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-heading)] flex items-center gap-2.5">
                    <Award className="h-5 w-5 text-[var(--color-accent)]" /> Saved Decisions
                  </h3>
                  <p className="text-sm text-[var(--color-muted)] mt-0.5">A history of what your team agreed on and key updates.</p>
                </div>
                <Link href="/decisions" className="text-sm text-[var(--color-accent)] hover:text-[var(--color-primary-dark)] flex items-center gap-1 transition-colors font-semibold">
                  Explore Decisions <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {decisions.slice(0, 4).map((dec) => {
                  const isActive = dec.status === "accepted";

                  return (
                    <motion.div
                      key={dec.id}
                      variants={itemVariants}
                      className={`p-5 rounded-2xl border transition-all duration-300 ${isActive
                          ? "bg-[var(--color-bg-light)] border-[var(--color-accent)]"
                          : "bg-[var(--color-surface)] border-[var(--color-border)] opacity-70"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div className="space-y-2">
                          <p className={`text-sm leading-relaxed ${isActive ? "text-[var(--color-heading)] font-semibold" : "text-[var(--color-muted)] line-through"}`}>
                            {dec.text}
                          </p>

                          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[var(--color-muted)]">
                            <span>{dec.date}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-border)]" />
                            <span>{dec.meeting_title}</span>
                          </div>
                        </div>

                        {/* State Badges */}
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 shrink-0 ${isActive
                            ? "bg-[var(--color-accent)]/10 text-[var(--color-primary-dark)] border border-[var(--color-accent)]"
                            : "bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-border)]"
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive ? "bg-[var(--color-primary-dark)]" : "bg-[var(--color-muted)]"}`} />
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
              className="p-6 saas-card space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-heading)] flex items-center gap-2.5">
                    <Clock className="h-5 w-5 text-[var(--color-accent)]" /> Recent Meetings
                  </h3>
                  <p className="text-sm text-[var(--color-muted)] mt-0.5">Click any meeting to review what was discussed, read transcripts, and see summaries.</p>
                </div>
                <Link href="/meetings" className="text-sm text-[var(--color-accent)] hover:text-[var(--color-primary-dark)] flex items-center gap-1 transition-colors font-semibold">
                  All Meetings <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetings.map((meet) => (
                  <motion.div
                    key={meet.id}
                    variants={itemVariants}
                    className="rounded-2xl"
                  >
                    <Link
                      href={`/meetings?id=${meet.id}`}
                      className="block p-5 h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm font-bold text-[var(--color-heading)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">{meet.title}</h4>
                          <span className="text-xs text-[var(--color-muted)] flex items-center gap-1 shrink-0 bg-[var(--color-bg-main)] px-2 py-0.5 rounded-lg border border-[var(--color-border)]">
                            <Clock className="h-3 w-3" /> {formatDuration(meet.duration)}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-body)] line-clamp-2 leading-relaxed">
                          {meet.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 mt-1 text-xs text-[var(--color-muted)]">
                        <span>{meet.date.split(" ")[0]}</span>
                        <span className="px-2 py-0.5 rounded-lg bg-[var(--color-bg-light)] border border-[var(--color-accent)] text-[var(--color-primary-dark)] font-semibold">
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
              className="p-6 saas-card space-y-6"
            >
              <h3 className="text-lg font-bold text-[var(--color-heading)] flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[var(--color-accent)]" /> Team Success Stats
              </h3>

              {/* Turnaround speed widget */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-main)] text-center relative overflow-hidden group cursor-pointer shadow-sm"
              >
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold">Average Agreement Speed</p>
                <p className="text-3xl font-bold text-[var(--color-heading)] mt-2">20.1 hrs</p>
                <p className="text-xs text-[var(--color-accent)] mt-2 font-semibold flex items-center justify-center gap-1">
                  ▲ 8% faster agreement than last week
                </p>
              </motion.div>

              {/* Agreement / Productivity Dial gauges */}
              <div className="space-y-6 pt-2">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-[var(--color-body)]">Consistency with Past Decisions</span>
                    <span className="font-bold text-[var(--color-primary-dark)]">85.5%</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "85.5%" }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full bg-[var(--color-primary-dark)] rounded-full"
                    />
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mt-1.5">Percentage of new agreements that fit smoothly with our past logs.</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-[var(--color-body)]">Meeting Smoothness</span>
                    <span className="font-bold text-[var(--color-accent)]">85.3%</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "85.3%" }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                      className="h-full bg-[var(--color-accent)] rounded-full"
                    />
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mt-1.5">Measures speaker distribution and clarity of decisions resolved.</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-[var(--color-body)]">Team Atmosphere (Debate Level)</span>
                    <span className="font-bold text-[var(--color-danger)]">15.7%</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "15.7%" }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-[var(--color-danger)] rounded-full"
                    />
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mt-1.5">Tracks constructive debates or differing views discussed in meetings.</p>
                </div>

              </div>
            </motion.div>

          </div>
        </div>

      </motion.div>
    </div>
  );
}
