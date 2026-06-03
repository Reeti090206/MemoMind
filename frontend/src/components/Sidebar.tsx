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
  LogOut,
  Users,
  Settings,
  X,
  PieChart
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { motion } from "framer-motion";

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobile, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const [contradictionCount, setContradictionCount] = useState(0);
  const { user, logout } = useAuth();

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
        setContradictionCount(1);
      }
    }
    fetchStats();
    const timer = setInterval(fetchStats, 30000);
    return () => clearInterval(timer);
  }, [user]);

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutGrid },
    { name: "Add Meeting", href: "/upload", icon: Upload },
    { name: "Read Meetings", href: "/meetings", icon: FileText },
    { name: "Task List", href: "/tasks", icon: CheckSquare },
    { name: "Decisions", href: "/decisions", icon: History },
    { name: "Help & Guide", href: "/help", icon: HelpCircle },
    { name: "Success Stats", href: "/analytics", icon: BarChart3 },
    { name: "Meeting Charts", href: "/graph", icon: PieChart },
    { name: "Team", href: "/team", icon: Users },
    { name: "Setup & API", href: "/settings", icon: Settings },
  ];

  return (
    <aside className={
      mobile
        ? "w-full h-full flex flex-col justify-between p-4 bg-[var(--color-primary-dark)] text-[var(--color-bg-light)]"
        : "hidden lg:flex w-64 my-4 ml-4 rounded-[20px] shadow-sm h-[calc(100vh-2rem)] sticky top-4 flex-col justify-between p-4 z-40 bg-[var(--color-primary-dark)] text-[var(--color-bg-light)] shrink-0"
    }>
      <div>
        {/* Logo / Branding */}
        <div className="flex items-center justify-between px-2 py-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[var(--color-accent)] flex items-center justify-center shadow-sm">
              <Network className="h-5 w-5 text-[var(--color-primary-dark)]" />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-wider flex items-center gap-1.5">
                MemoMind
              </h1>
            </div>
          </div>
          {mobile && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-bg-light)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  style={{
                    backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
                    color: isActive ? 'var(--color-primary-dark)' : 'var(--color-bg-light)'
                  }}
                  className={`relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group overflow-hidden ${
                    !isActive ? "hover:bg-[rgba(78,205,196,0.15)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <Icon className="h-4.5 w-4.5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>

                  {item.name === "Decisions" && contradictionCount > 0 && (
                    <span 
                      style={{ 
                        backgroundColor: isActive ? 'rgba(255,107,107,0.2)' : 'var(--color-danger)',
                        color: isActive ? 'var(--color-danger)' : 'var(--color-primary-dark)'
                      }}
                      className="relative z-10 px-2 py-0.5 text-[10px] rounded-full font-semibold"
                    >
                      {contradictionCount}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-3 bg-[rgba(247,255,247,0.05)] rounded-2xl flex flex-col gap-3.5 mb-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-xl border border-[rgba(247,255,247,0.1)] p-0.5 object-cover"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate max-w-[120px]">{user.name}</p>
                <p className="text-[10px] opacity-70 truncate max-w-[120px]">{user.role}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-[rgba(255,107,107,0.15)] hover:text-[var(--color-danger)] transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
