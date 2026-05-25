"use client";

import React, { useState } from "react";
import { useAuth } from "./AuthProvider";
import Sidebar from "./Sidebar";
import GlassLoginWall from "./GlassLoginWall";
import { Network, Bell, BellRing, X, Sparkles, Clock, AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, welcomeEmail } = useAuth();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
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
      case "/search": return "Ask the AI Assistant";
      case "/analytics": return "Team Success Stats";
      case "/graph": return "Visual Meeting Connections Map";
      case "/team": return "Team Workspace";
      case "/settings": return "Setup & API";
      default: return "MemoMind Workspace";
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[var(--background)] flex flex-col items-center justify-center text-[var(--foreground)] z-50">
        <div className="relative h-14 w-14 flex items-center justify-center mb-4">
          <div className="h-10 w-10 rounded-full border-2 border-[var(--color-obsidian-border)] border-t-cyber-purple animate-spin" />
          <Network className="absolute h-5 w-5 text-cyber-cyan animate-pulse" />
        </div>
        <p className="text-xs font-mono text-[var(--foreground)]/50 uppercase tracking-widest animate-pulse">
          Retrieving MemoMind Memory Index...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || welcomeEmail) {
    return <GlassLoginWall />;
  }

  return (
    <div className="flex w-full h-full overflow-hidden text-[var(--foreground)] bg-transparent">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Page Content Workspace */}
      <main className="flex-1 overflow-y-auto flex flex-col relative h-full bg-transparent">
        {/* Subtle Neon Radial Glow Lighting */}
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-cyber-purple/3 rounded-full blur-[120px] pointer-events-none -z-10" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyber-cyan/3 rounded-full blur-[120px] pointer-events-none -z-10" 
        />
        
        {/* Top Global Header Bar as a floating glass capsule */}
        <header className="sticky top-4 mx-4 md:mx-6 mt-4 z-30 flex items-center justify-between px-6 py-3.5 rounded-2xl glass-panel border border-[var(--color-obsidian-border)] shadow-2xl shrink-0">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-cyber-cyan animate-pulse" />
            <h2 className="text-xs font-bold font-mono text-[var(--foreground)]/80 uppercase tracking-widest text-glow-cyber">
              {getPageTitle(pathname)}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {/* Notification trigger bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl bg-obsidian-light/15 hover:bg-obsidian-light/30 active:bg-obsidian-light/45 transition-all border border-obsidian-border group shadow-md"
            >
              {notifications.length > 0 ? (
                <BellRing className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
              ) : (
                <Bell className="h-4.5 w-4.5 text-[var(--foreground)]/70 group-hover:text-[var(--foreground)]" />
              )}
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-cyber-rose rounded-full text-[8px] font-mono font-bold flex items-center justify-center border border-obsidian-dark shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Micro User display indicator */}
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[var(--color-obsidian-border)] bg-[var(--foreground)]/[0.05] font-mono text-[10px] text-[var(--foreground)]/70 font-semibold shadow-sm">
                <img src={user.avatar} className="h-4.5 w-4.5 rounded-md border border-[var(--color-obsidian-border)] shrink-0" />
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
              className="w-full max-w-md bg-[var(--background)] border-l border-obsidian-border h-full relative z-10 shadow-2xl flex flex-col p-6 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[var(--color-obsidian-border)] mb-5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8.5 w-8.5 rounded-xl bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center shadow-sm shrink-0">
                    <Bell className="h-4.5 w-4.5 text-cyber-purple animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">Notification Center</h3>
                    <p className="text-[10px] text-[var(--foreground)]/50 font-mono">Real-time SaaS action items</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1.5 rounded-lg bg-[var(--foreground)]/[0.05] hover:bg-cyber-rose/10 text-[var(--foreground)]/70 hover:text-cyber-rose border border-[var(--color-obsidian-border)] hover:border-cyber-rose/25 transition-all shadow-md shrink-0"
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
                        className="p-4 rounded-xl border border-[var(--color-obsidian-border)] bg-[var(--foreground)]/[0.01] hover:bg-[var(--foreground)]/[0.02] hover:border-[var(--color-obsidian-border)] transition-all duration-300 relative group flex gap-3.5"
                      >
                        {/* Icon */}
                        <div className={`h-8.5 w-8.5 rounded-xl border flex items-center justify-center shadow-sm shrink-0 ${nt.color}`}>
                          <NtIcon className="h-4 w-4" />
                        </div>
                        
                        {/* Text Content */}
                        <div className="space-y-1.5 flex-1 pr-6 overflow-hidden">
                          <div className="flex items-center gap-2 justify-between">
                            <h4 className="text-xs font-bold text-[var(--foreground)] truncate leading-tight">{nt.title}</h4>
                            <span className="text-[8px] text-[var(--foreground)]/50 font-mono flex items-center gap-1 shrink-0">
                              <Clock className="h-2.5 w-2.5" /> {nt.time}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-[var(--foreground)]/70 leading-relaxed font-sans">{nt.desc}</p>
                          
                          {/* Special dynamic CTA bindings */}
                          {nt.type === "contradiction" && (
                            <a href="/decisions" onClick={() => setShowNotifications(false)} className="text-[9px] font-semibold text-cyber-cyan flex items-center gap-0.5 mt-2.5 cursor-pointer">
                              Explore Overrides <ArrowRight className="h-2.5 w-2.5 animate-pulse" />
                            </a>
                          )}
                          {nt.type === "overdue" && (
                            <a href="/tasks" onClick={() => setShowNotifications(false)} className="text-[9px] font-semibold text-amber-400 flex items-center gap-0.5 mt-2.5 cursor-pointer">
                              Go to Tasks <ArrowRight className="h-2.5 w-2.5 animate-pulse" />
                            </a>
                          )}
                        </div>

                        {/* Dismiss trigger */}
                        <button
                          onClick={() => dismissNotification(nt.id)}
                          title="Dismiss Reminder"
                          className="absolute top-3.5 right-3.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--foreground)]/[0.05] hover:bg-cyber-rose/10 text-[var(--foreground)]/50 hover:text-cyber-rose border border-[var(--color-obsidian-border)] hover:border-cyber-rose/25"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-4 opacity-50 select-none">
                    <Bell className="h-10 w-10 text-gray-700 animate-bounce" />
                    <p className="text-xs font-mono text-gray-600 uppercase tracking-wider">All Reminders Cleared</p>
                  </div>
                )}
              </div>

              {/* Compliance note */}
              <div className="mt-auto border-t border-[var(--color-obsidian-border)] pt-4 text-[9px] font-mono text-[var(--foreground)]/50 leading-relaxed uppercase tracking-wider">
                💡 Real-time notifications active
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
