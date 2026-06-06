"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";
import Sidebar from "./Sidebar";
import GlassLoginWall from "./GlassLoginWall";
import { Network, Bell, BellRing, X, Sparkles, Clock, AlertTriangle, ArrowRight, ShieldAlert, HelpCircle, ShieldCheck, CheckCircle2, ChevronRight, Activity, BookOpen, Layers, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, welcomeEmail } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !welcomeEmail && pathname === "/login") {
      router.push("/");
    }
  }, [isAuthenticated, welcomeEmail, pathname, router]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const welcomeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserEmailRef = useRef<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user && user.email !== lastUserEmailRef.current) {
      setShowWelcome(true);
      lastUserEmailRef.current = user.email;

      if (welcomeTimerRef.current) {
        clearTimeout(welcomeTimerRef.current);
      }

      welcomeTimerRef.current = setTimeout(() => {
        setShowWelcome(false);
      }, 3500);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    return () => {
      if (welcomeTimerRef.current) {
        clearTimeout(welcomeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      const stored = localStorage.getItem("MemoMind_settings");
      let enforceSecure = false; // default to secure connection
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.tlsSecure !== undefined) {
            enforceSecure = parsed.tlsSecure;
          }
        } catch (e) { }
      }

      // If the frontend itself is running on HTTP (e.g. localhost), do not upgrade local API calls to HTTPS
      if (typeof window !== "undefined" && window.location.protocol === "http:") {
        enforceSecure = false;
      }

      console.warn("[LayoutClient fetch]", {
        url: input,
        method: init?.method || "GET",
        enforceSecure
      });

      let modifiedInput = input;
      let urlStr = "";
      if (typeof input === "string") {
        urlStr = input;
      } else if (input instanceof URL) {
        urlStr = input.toString();
      } else if (input && typeof (input as any).url === "string") {
        urlStr = (input as any).url;
      }

      if (urlStr) {
        const isLocalHost = urlStr.includes("127.0.0.1:8000") || urlStr.includes("localhost:8000");

        let newUrlStr = urlStr;
        if (isLocalHost) {
          let targetBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
          if (targetBase.includes("127.0.0.1:8000") || targetBase.includes("localhost:8000")) {
            if (enforceSecure && targetBase.startsWith("http://")) {
              targetBase = targetBase.replace("http://", "https://");
            } else if (!enforceSecure && targetBase.startsWith("https://")) {
              targetBase = targetBase.replace("https://", "http://");
            }
          }
          if (urlStr.includes("127.0.0.1:8000")) {
            newUrlStr = urlStr.replace(/https?:\/\/127\.0\.0\.1:8000/, targetBase);
          } else if (urlStr.includes("localhost:8000")) {
            newUrlStr = urlStr.replace(/https?:\/\/localhost:8000/, targetBase);
          }
        }

        if (newUrlStr !== urlStr) {
          if (typeof input === "string") {
            modifiedInput = newUrlStr;
          } else if (input instanceof URL) {
            modifiedInput = new URL(newUrlStr);
          } else {
            modifiedInput = new Request(newUrlStr, input as any);
          }
        }
      }

      return originalFetch(modifiedInput, init);
    };

    const OriginalWebSocket = window.WebSocket;
    const CustomWebSocket = function (url: string, protocols?: string | string[]) {
      const stored = localStorage.getItem("MemoMind_settings");
      let enforceSecure = false;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.tlsSecure !== undefined) {
            enforceSecure = parsed.tlsSecure;
          }
        } catch (e) { }
      }

      if (typeof window !== "undefined" && window.location.protocol === "http:") {
        enforceSecure = false;
      }

      let wsBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      if (wsBase.startsWith("https://")) {
        wsBase = wsBase.replace("https://", "wss://");
      } else if (wsBase.startsWith("http://")) {
        wsBase = wsBase.replace("http://", "ws://");
      }

      if (url.includes("127.0.0.1:8000") || url.includes("localhost:8000")) {
        let wsTargetBase = wsBase;
        if (wsTargetBase.includes("127.0.0.1:8000") || wsTargetBase.includes("localhost:8000")) {
          if (enforceSecure && wsTargetBase.startsWith("ws://")) {
            wsTargetBase = wsTargetBase.replace("ws://", "wss://");
          } else if (!enforceSecure && wsTargetBase.startsWith("wss://")) {
            wsTargetBase = wsTargetBase.replace("wss://", "ws://");
          }
        }

        if (url.includes("127.0.0.1:8000")) {
          url = url.replace(/wss?:\/\/127\.0\.0\.1:8000/, wsTargetBase);
        } else if (url.includes("localhost:8000")) {
          url = url.replace(/wss?:\/\/localhost:8000/, wsTargetBase);
        }
      }
      return new OriginalWebSocket(url, protocols);
    };
    CustomWebSocket.prototype = OriginalWebSocket.prototype;
    Object.assign(CustomWebSocket, OriginalWebSocket);
    (window as any).WebSocket = CustomWebSocket as any;

    return () => {
      window.fetch = originalFetch;
      (window as any).WebSocket = OriginalWebSocket;
    };
  }, []);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "contradiction",
      title: "Decision Shift Alert",
      desc: "Decision to migrate to microservices (SaaS Scaling) contradicts plan to avoid microservices (Kickoff sync).",
      time: "2m ago",
      icon: ShieldAlert,
      color: "text-cyber-rose bg-cyber-rose/10 border-cyber-rose/20"
    },
    {
      id: 2,
      type: "overdue",
      title: "Overdue Item",
      desc: "Task 'Implement core database migrations' has passed its deadline line-item review.",
      time: "1h ago",
      icon: AlertTriangle,
      color: "text-amber-400 bg-amber-400/10 border-amber-400/20"
    },
    {
      id: 3,
      type: "assignment",
      title: "Task Assigned",
      desc: "Sarah Jenkins assigned you to 'Update UI components with new design system'.",
      time: "3h ago",
      icon: Sparkles,
      color: "text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/20"
    }
  ]);

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/": return "At a Glance";
      case "/upload": return "Bring in Meetings";
      case "/meetings": return "Read Meetings";
      case "/tasks": return "Active Task Board";
      case "/decisions": return "Decision History";
      case "/help": return "Help & Guide Center";
      case "/analytics": return "Team Success Stats";
      case "/graph": return "Meeting Charts & Insights";
      case "/team": return "Team Workspace";
      case "/settings": return "Setup & API";
      default: return "MemoMind Workspace";
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[var(--color-bg-main)] flex flex-col items-center justify-center text-[var(--color-heading)] z-50">
        <div className="relative h-14 w-14 flex items-center justify-center mb-4">
          <div className="h-10 w-10 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
          <Network className="absolute h-5 w-5 text-[var(--color-primary-dark)] animate-pulse" />
        </div>
        <p className="text-small-regular animate-pulse">
          Retrieving Workspace...
        </p>
      </div>
    );
  }

  if (showWelcome && user) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[var(--color-bg-main)] z-50 flex flex-col items-center justify-center text-[var(--color-heading)] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-xl text-center space-y-6 flex flex-col items-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center relative">
            <Network className="h-8 w-8 text-[var(--color-primary-dark)] animate-pulse" />
          </div>

          <div className="space-y-2">
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-[var(--color-heading)]"
            >
              Welcome back, {user.name.split(" ")[0]}!
            </motion.h2>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-[var(--color-muted)]"
            >
              {user.role}
            </motion.p>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border border-[var(--color-border)] rounded-xl w-full">
            <img src={user.avatar} className="h-10 w-10 rounded-full border border-[var(--color-border)] object-cover shrink-0" />
            <div className="text-left overflow-hidden">
              <span className="text-sm font-semibold text-[var(--color-heading)] block leading-tight">{user.name}</span>
              <span className="text-xs text-[var(--color-muted)] block truncate mt-0.5">{user.email}</span>
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3.2, ease: "easeInOut" }}
                className="h-full bg-[var(--color-accent)] rounded-full"
              />
            </div>
            <span className="text-xs text-[var(--color-muted)] block">
              Loading workspace data...
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated || welcomeEmail) {
    return <GlassLoginWall />;
  }

  return (
    <div className="flex w-full h-full overflow-hidden bg-[var(--color-bg-main)]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Mobile Sidebar Drawer Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 overflow-hidden flex lg:hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />

            {/* Sidebar Container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-64 bg-[var(--color-primary-dark)] h-full relative z-10 shadow-2xl flex flex-col"
            >
              <Sidebar mobile onClose={() => setShowMobileSidebar(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Page Content Workspace */}
      <main className="flex-1 overflow-y-auto flex flex-col relative h-full bg-transparent">


        {/* Top Global Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[var(--color-bg-main)]/90 backdrop-blur-md border-b border-[var(--color-border)] shrink-0 transition-all w-full">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu (Mobile Only) */}
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h2 className="text-section-title text-[var(--color-heading)] truncate max-w-[150px] sm:max-w-none">
              {getPageTitle(pathname)}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Help & Info Center Trigger */}
            <button
              onClick={() => setShowHelpDrawer(true)}
              className="relative p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:border-[var(--color-muted)] transition-all"
              title="Platform Help & Quick Guide"
            >
              <HelpCircle className="h-4.5 w-4.5" />
            </button>

            {/* Notification trigger bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:border-[var(--color-muted)] transition-all"
            >
              <Bell className="h-4.5 w-4.5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-[var(--color-danger)] rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-sm">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Micro User display indicator */}
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] font-semibold shadow-sm">
                <img src={user.avatar} className="h-5 w-5 rounded-md object-cover shrink-0" />
                <span>{user.name.split(" ")[0]}</span>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Container Wrapper */}
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-16 overflow-x-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Sliding Notification Center Drawer Overlay */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop opacity layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />

            {/* Drawer Container Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border)] h-full relative z-10 shadow-2xl flex flex-col p-6 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[var(--color-border)] mb-5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8.5 w-8.5 rounded-xl bg-[var(--color-border)] flex items-center justify-center shadow-sm shrink-0">
                    <Bell className="h-4.5 w-4.5 text-[var(--color-heading)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-heading)] tracking-tight">Notification Center</h3>
                    <p className="text-xs text-[var(--color-muted)]">Real-time SaaS action items</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] border border-[var(--color-border)] transition-all shadow-sm shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Reminders Feed List */}
              <div className="flex-1 space-y-4">
                {notifications.length > 0 ? (
                  notifications.map(nt => {
                    const NtIcon = nt.icon;
                    return (
                      <motion.div
                        key={nt.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:shadow-md transition-all duration-300 relative group flex gap-3.5"
                      >
                        {/* Icon */}
                        <div className={`h-8.5 w-8.5 rounded-xl border flex items-center justify-center shadow-sm shrink-0 ${nt.color.replace('cyber-rose', '[var(--color-danger)]').replace('amber-400', '[var(--color-warning)]').replace('cyber-cyan', '[var(--color-accent)]')}`}>
                          <NtIcon className="h-4 w-4" />
                        </div>

                        {/* Text Content */}
                        <div className="space-y-1.5 flex-1 pr-6 overflow-hidden">
                          <div className="flex items-center gap-2 justify-between">
                            <h4 className="text-sm font-semibold text-[var(--color-heading)] truncate leading-tight">{nt.title}</h4>
                            <span className="text-xs text-[var(--color-muted)] flex items-center gap-1 shrink-0">
                              <Clock className="h-3 w-3" /> {nt.time}
                            </span>
                          </div>

                          <p className="text-sm text-[var(--color-body)] leading-relaxed">{nt.desc}</p>

                          {/* Special dynamic CTA bindings */}
                          {nt.type === "contradiction" && (
                            <a href="/decisions" onClick={() => setShowNotifications(false)} className="text-xs font-semibold text-[var(--color-danger)] flex items-center gap-0.5 mt-2.5 cursor-pointer">
                              Explore Overrides <ArrowRight className="h-3 w-3" />
                            </a>
                          )}
                          {nt.type === "overdue" && (
                            <a href="/tasks" onClick={() => setShowNotifications(false)} className="text-xs font-semibold text-[var(--color-warning)] flex items-center gap-0.5 mt-2.5 cursor-pointer">
                              Go to Tasks <ArrowRight className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {/* Dismiss trigger */}
                        <button
                          onClick={() => dismissNotification(nt.id)}
                          title="Dismiss Reminder"
                          className="absolute top-3 right-3 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-4 opacity-50 select-none">
                    <Bell className="h-10 w-10 text-[var(--color-muted)]" />
                    <p className="text-sm text-[var(--color-muted)] font-semibold">All Reminders Cleared</p>
                  </div>
                )}
              </div>

              {/* Compliance note */}
              <div className="mt-auto border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-muted)] text-center">
                Real-time notifications active
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Sliding Help Center Drawer Overlay */}
      <AnimatePresence>
        {showHelpDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop opacity layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelpDrawer(false)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />

            {/* Drawer Container Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border)] h-full relative z-10 shadow-2xl flex flex-col p-6 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[var(--color-border)] mb-5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8.5 w-8.5 rounded-xl bg-[var(--color-border)] flex items-center justify-center shadow-sm shrink-0">
                    <HelpCircle className="h-4.5 w-4.5 text-[var(--color-heading)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-heading)] tracking-tight">Help & Info Center</h3>
                    <p className="text-xs text-[var(--color-muted)]">MemoMind Capabilities & Quick Guide</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowHelpDrawer(false)}
                  className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] border border-[var(--color-border)] transition-all shadow-sm shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Guide Contents */}
              <div className="flex-1 space-y-6 text-[var(--color-body)] leading-relaxed overflow-y-auto pr-1">
                <div className="p-4 bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-2xl space-y-2">
                  <h4 className="font-semibold text-[var(--color-heading)] flex items-center gap-1.5 text-sm">
                    <Activity className="h-4 w-4 text-[var(--color-accent)]" /> What is MemoMind?
                  </h4>
                  <p className="text-sm text-[var(--color-muted)]">
                    MemoMind acts as your team's autonomous organization memory brain, linking audio syncs, screen sharing details, dynamic decision logs, and team responsibilities seamlessly into interactive network connections.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-[var(--color-heading)] text-sm border-b border-[var(--color-border)] pb-2">
                    Platform Mechanics & Functionality
                  </h4>

                  {/* Item 1 */}
                  <div className="space-y-1">
                    <span className="font-semibold text-[var(--color-heading)] text-sm block">🎙️ Real-Time Live Assistant</span>
                    <p className="text-sm text-[var(--color-muted)]">
                      Streams microphone recordings and captures active Chrome browser windows frame-by-frame, writing real-time dialogues, discovering key assignees, and warning about scheduling conflicts instantly.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="space-y-1">
                    <span className="font-semibold text-[var(--color-heading)] text-sm block">📁 Audio Meeting Uploads</span>
                    <p className="text-sm text-[var(--color-muted)]">
                      Supports uploading recorded meeting clips in `.mp3`, `.wav`, or `.m4a` format to run full structural Whisper transcribe briefings and multi-agent decision Extractions.
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="space-y-1">
                    <span className="font-semibold text-[var(--color-heading)] text-sm block">🔗 Plan Contradiction Engine</span>
                    <p className="text-sm text-[var(--color-muted)]">
                      Automatically reviews decisions resolved in fresh syncs against past logged directions in the SQLite memory table, flagging risks if direction contradictions emerge.
                    </p>
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <a
                    href="/help"
                    onClick={() => setShowHelpDrawer(false)}
                    className="btn-primary w-full"
                  >
                    <BookOpen className="h-4 w-4 mr-2" /> Go to Full Help Guide
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-muted)] text-center">
                MemoMind Memory Hub v1.2.6-stable
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
