"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { 
  Plus, 
  User, 
  Calendar, 
  Tag, 
  CheckSquare, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Robust Fallbacks
// Empty initialization
const MOCK_TASKS: any[] = [];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const columnVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 85, damping: 14 } }
};

export default function TaskBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>(MOCK_TASKS);
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  
  // Drawer / editor states
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  useEffect(() => {
    async function loadTasks() {
      try {
        const url = user?.email
          ? `http://127.0.0.1:8000/api/tasks?user_email=${encodeURIComponent(user.email)}`
          : "http://127.0.0.1:8000/api/tasks";
        const res = await fetch(url);
        if (res.ok) {
          const list = await res.json();
          // Map database structures or add mockup title details
          const fullTasks = list.map((t: any) => ({
            ...t,
            meeting_title: t.meeting_id === 1 
              ? "Project Alpha Kickoff & DB Planning" 
              : t.meeting_id === 2 
              ? "Database & Auth Architecture Deep-Dive" 
              : "SaaS Scaling & Microservices Shift"
          }));
          setTasks(fullTasks);
        }
      } catch (err) {
        console.log("Using mockup fallback for Tasks Board");
      }
    }
    loadTasks();
  }, [user]);

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    // Optimistic UI updates
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.log("Offline state saved locally!");
    }
  };

  const saveTaskDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    // Save locally
    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTask.id ? selectedTask : t))
    );

    try {
      await fetch(`http://127.0.0.1:8000/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: selectedTask.owner,
          deadline: selectedTask.deadline,
          priority: selectedTask.priority
        })
      });
    } catch (err) {
      console.log("Details saved locally offline!");
    }
    setSelectedTask(null);
  };

  // Filter criteria
  const filteredTasks = tasks.filter((t) => {
    const ownerMatch = filterOwner === "all" || t.owner.toLowerCase() === filterOwner.toLowerCase();
    const priorityMatch = filterPriority === "all" || t.priority.toLowerCase() === filterPriority.toLowerCase();
    return ownerMatch && priorityMatch;
  });

  const columns = [
    { name: "To Do", id: "todo", color: "text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/20" },
    { name: "In Progress", id: "in_progress", color: "text-cyber-purple bg-cyber-purple/10 border-cyber-purple/20" },
    { name: "Done", id: "done", color: "text-cyber-emerald bg-cyber-emerald/10 border-cyber-emerald/20" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Tasks</h2>
          <p className="text-[var(--foreground)]/70 text-sm mt-0.5">
            Action items automatically captured from your meetings and decisions.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 rounded-2xl glass-card flex flex-wrap items-center justify-between gap-4 bg-transparent border-[var(--color-obsidian-border)]">
        <div className="flex flex-wrap items-center gap-4 text-xs font-sans">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--foreground)]/50" />
            <span className="text-[var(--foreground)]/70 font-medium">Filter:</span>
          </div>

          {/* Owner Filter */}
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-cyber-purple transition-all cursor-pointer"
          >
            <option value="all">Everyone</option>
            {Array.from(new Set(tasks.map((t) => t.owner).filter(Boolean))).map((owner: any) => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-cyber-purple transition-all cursor-pointer"
          >
            <option value="all">Any Priority</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
          </select>
        </div>

        <div className="text-[10px] text-[var(--foreground)]/50 font-mono">
          {filteredTasks.length} tasks found
        </div>
      </div>

      {/* Kanban Columns */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          
          return (
            <motion.div 
              key={col.id} 
              variants={columnVariants}
              className="space-y-4 flex flex-col"
            >
              {/* Column Header */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${col.color}`}>
                <span className="text-xs font-bold uppercase tracking-wider font-mono">{col.name}</span>
                <span className="px-2 py-0.5 rounded bg-black/30 text-[10px] font-mono font-bold">{colTasks.length}</span>
              </div>

              {/* Tasks List Container - Floating Translucent glass column */}
              <div className="space-y-3 min-h-[480px] bg-[var(--foreground)]/[0.01] border border-[var(--color-obsidian-border)] rounded-2xl p-3 flex flex-col shadow-lg backdrop-blur-md">
                <AnimatePresence mode="popLayout">
                  {colTasks.map((task) => (
                    <motion.div
                      layout
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ 
                        scale: 1.025, 
                        y: -3, 
                        borderColor: "rgba(139, 92, 246, 0.4)",
                        boxShadow: "0 12px 24px -10px rgba(139, 92, 246, 0.15)"
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 350, damping: 20 }}
                      onClick={() => setSelectedTask(task)}
                      className="p-4 rounded-xl glass-card border border-[var(--color-obsidian-border)] cursor-pointer space-y-3 transition-colors duration-300 relative overflow-hidden bg-transparent"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-mono font-bold ${
                          task.priority === "high"
                            ? "bg-cyber-rose/10 border border-cyber-rose/25 text-cyber-rose"
                            : "bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] text-[var(--foreground)]/70"
                        }`}>
                          {task.priority}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--foreground)]/70 font-mono">
                          <User className="h-3 w-3 text-cyber-cyan" /> {task.owner}
                        </div>
                      </div>

                      <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed font-sans">
                        {task.title}
                      </p>

                      <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-obsidian-border)] text-[10px] text-[var(--foreground)]/50 font-mono">
                        <span className="flex items-center gap-1 text-[9px]"><Calendar className="h-3 w-3 text-cyber-purple" /> {task.deadline}</span>
                        
                        {/* Quick Movers */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {col.id !== "todo" && (
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.8 }}
                              onClick={() => updateTaskStatus(task.id, col.id === "done" ? "in_progress" : "todo")}
                              className="p-1 hover:bg-[var(--foreground)]/[0.10] rounded text-[var(--foreground)]/70 hover:text-[var(--foreground)] cursor-pointer"
                              title="Move Left"
                            >
                              ◀
                            </motion.button>
                          )}
                          {col.id !== "done" && (
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.8 }}
                              onClick={() => updateTaskStatus(task.id, col.id === "todo" ? "in_progress" : "done")}
                              className="p-1 hover:bg-[var(--foreground)]/[0.10] rounded text-[var(--foreground)]/70 hover:text-[var(--foreground)] cursor-pointer"
                              title="Move Right"
                            >
                              ▶
                            </motion.button>
                          )}
                        </div>
                      </div>

                      {/* Lineage retro link */}
                      <div className="pt-2 text-[9px] text-cyber-cyan flex items-center justify-between border-t border-dashed border-[var(--color-obsidian-border)] font-sans">
                        <Link href={`/meetings?id=${task.meeting_id}`} className="hover:underline flex items-center gap-0.5">
                          From: {task.meeting_title.split("&")[0]} <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {colTasks.length === 0 && (
                  <div className="text-center py-16 text-gray-600 text-xs font-sans my-auto">
                    No tasks here yet!
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Elastic Task Editor Drawer panel */}
      <AnimatePresence>
        {selectedTask && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />
            
            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", damping: 22, stiffness: 150 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-black/90 border-l border-[var(--color-obsidian-border)] backdrop-blur-xl z-50 p-6 flex flex-col justify-between shadow-2xl font-sans"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-obsidian-border)]">
                  <span className="px-2.5 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/20 text-[9px] uppercase font-mono tracking-wider font-bold">
                    Task Info
                  </span>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="h-8 w-8 rounded-full hover:bg-[var(--foreground)]/[0.05] flex items-center justify-center text-[var(--foreground)]/70 hover:text-[var(--foreground)] transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-black text-[var(--foreground)] text-lg leading-snug">{selectedTask.title}</h3>
                  <p className="text-[10px] text-cyber-cyan font-mono flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 animate-pulse" /> Created in: {selectedTask.meeting_title}
                  </p>
                </div>
                
                <form onSubmit={saveTaskDetails} className="space-y-5 pt-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-[var(--foreground)]/70">Assignee</label>
                    <input
                      type="text"
                      value={selectedTask.owner}
                      onChange={(e) => setSelectedTask({ ...selectedTask, owner: e.target.value })}
                      className="w-full bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-cyber-purple transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-[var(--foreground)]/70">Deadline Date</label>
                    <input
                      type="text"
                      value={selectedTask.deadline}
                      onChange={(e) => setSelectedTask({ ...selectedTask, deadline: e.target.value })}
                      className="w-full bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-cyber-purple transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-[var(--foreground)]/70">Priority</label>
                    <select
                      value={selectedTask.priority}
                      onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
                      className="w-full bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-cyber-purple transition-all cursor-pointer"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-3">
                    <Link
                      href={`/meetings?id=${selectedTask.meeting_id}`}
                      onClick={() => setSelectedTask(null)}
                      className="px-4 py-2.5 border border-[var(--color-obsidian-border)] hover:bg-[var(--foreground)]/[0.05] hover:border-cyber-cyan/30 rounded-xl text-xs text-[var(--foreground)]/80 font-bold flex items-center gap-1.5 transition-all"
                    >
                      Go to Meeting <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:from-cyber-purple hover:to-cyber-purple rounded-xl text-xs text-[var(--foreground)] font-bold shadow-lg shadow-cyber-purple/10 transition-all cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="p-4 bg-cyber-purple/5 border border-cyber-purple/10 rounded-xl text-[10px] text-[var(--foreground)]/70 leading-relaxed mt-auto">
                Any changes you make here will be updated in your team's workspace and linked to the original meeting decision automatically.
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
 
    </div>
  );
}
