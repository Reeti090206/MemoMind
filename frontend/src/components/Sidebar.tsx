"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, 
  Upload, 
  FileText, 
  CheckSquare, 
  History, 
  HelpCircle, 
  BarChart3, 
  Network, 
  Cpu, 
  Flame,
  LogOut,
  Users,
  Settings
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { motion } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();
  const [contradictionCount, setContradictionCount] = useState(0);
  const { user, logout } = useAuth();

  // Fetch contradiction count dynamically to update sidebar indicator
  useEffect(() => {
    async function fetchStats() {
      try {
        const url = user?.email
          ? `http://127.0.0.1:8000/api/analytics/widgets?user_email=${encodeURIComponent(user.email)}`
          : "http://127.0.0.1:8000/api/analytics/widgets";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setContradictionCount(data.contradictions_count || 0);
        }
      } catch (err) {
        // Fallback for initial render / network delays
        setContradictionCount(1);
      }
    }
    fetchStats();
    // Poll every 30s
    const timer = setInterval(fetchStats, 30000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutGrid },
    { name: "Add Meeting", href: "/upload", icon: Upload },
    { name: "Read Meetings", href: "/meetings", icon: FileText },
    { name: "Task List", href: "/tasks", icon: CheckSquare },
    { name: "Decisions", href: "/decisions", icon: History },
    { name: "Help & Guide", href: "/help", icon: HelpCircle },
    { name: "Success Stats", href: "/analytics", icon: BarChart3 },
    { name: "Connection Map", href: "/graph", icon: Network },
    { name: "Team", href: "/team", icon: Users },
    { name: "Setup & API", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 my-4 ml-4 rounded-2xl glass-panel shadow-2xl h-[calc(100vh-2rem)] sticky top-4 flex flex-col justify-between p-4 z-40 bg-transparent shrink-0">
      <div>
        {/* Logo / Branding */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyber-purple to-cyber-cyan flex items-center justify-center border-glow-purple">
            <Network className="h-5 w-5 text-[var(--foreground)]" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-[var(--foreground)] tracking-wider flex items-center gap-1.5">
              MemoMind
            </h1>
            <p className="text-[10px] text-[var(--foreground)]/50 uppercase tracking-widest font-mono">
              Memory Intelligence
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <motion.nav 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.04 }
            }
          }}
          initial="hidden"
          animate="show"
          className="space-y-1.5"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            
            return (
              <motion.div
                key={item.name}
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  show: { opacity: 1, x: 0 }
                }}
              >
                <Link
                  href={item.href}
                  className="relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavBg"
                      className="absolute inset-0 bg-gradient-to-r from-cyber-purple/25 to-cyber-cyan/15 border-l-2 border-cyber-purple -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-3 relative z-10">
                    <Icon className={`h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? "text-cyber-cyan" : "text-[var(--foreground)]/50 group-hover:text-cyber-purple"
                    }`} />
                    <span className={`text-sm ${isActive ? "text-[var(--foreground)] font-medium animate-fadeIn" : "text-[var(--foreground)]/50 group-hover:text-[var(--foreground)]"}`}>{item.name}</span>
                  </div>
                  
                  {/* Special Notification Badge for Decision overrides */}
                  {item.name === "Decisions" && contradictionCount > 0 && (
                    <span className="relative z-10 px-2 py-0.5 text-[10px] rounded-full bg-cyber-rose/20 border border-cyber-rose/30 text-cyber-rose font-mono animate-pulse">
                      {contradictionCount} Conflict{contradictionCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
      </div>

      {/* Dynamic User Profile Card & Logout */}
      {user && (
        <div className="p-3 bg-obsidian-light/35 border border-obsidian-border rounded-2xl flex flex-col gap-3.5 mb-2.5">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-xl bg-slate-900 border border-[var(--color-obsidian-border)] p-0.5"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[var(--foreground)] truncate max-w-[120px]">{user.name}</p>
                <p className="text-[9px] text-[var(--foreground)]/50 font-mono truncate max-w-[120px]">{user.role}</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg bg-[var(--foreground)]/[0.05] hover:bg-cyber-rose/10 text-[var(--foreground)]/70 hover:text-cyber-rose transition-all duration-300 border border-[var(--color-obsidian-border)] hover:border-cyber-rose/20"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          
          {/* Small inline connection pulse status */}
          <div className="flex items-center justify-between text-[8px] font-mono text-[var(--foreground)]/50 border-t border-[var(--color-obsidian-border)] pt-2">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-emerald opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyber-emerald"></span>
              </span>
              Session Secure
            </span>
            <span>ID: {user.name.split(" ")[0].toLowerCase()}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
