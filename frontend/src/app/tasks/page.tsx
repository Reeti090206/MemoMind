"use client";

import { useState, useEffect } from "react";
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

// Robust Fallbacks
const MOCK_TASKS = [
  { id: 4, title: "Integrate Clerk OAuth library into the frontend shell", owner: "Reeti", deadline: "2026-05-29", priority: "high", status: "todo", meeting_id: 3, meeting_title: "SaaS Scaling & Microservices Shift" },
  { id: 3, title: "Update frontend configurations with microservices endpoints", owner: "Reeti", deadline: "2026-06-02", priority: "medium", status: "todo", meeting_id: 3, meeting_title: "SaaS Scaling & Microservices Shift" },
  { id: 2, title: "Configure production PostgreSQL clusters and connection pooling", owner: "Aman", deadline: "2026-05-30", priority: "high", status: "in_progress", meeting_id: 2, meeting_title: "Database & Auth Architecture Deep-Dive" },
  { id: 1, title: "Implement core database migrations", owner: "Aman", deadline: "2026-05-28", priority: "high", status: "done", meeting_id: 1, meeting_title: "Project Alpha Kickoff & DB Planning" }
];

export default function TaskBoard() {
  const [tasks, setTasks] = useState<any[]>(MOCK_TASKS);
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  
  // Drawer / editor states
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/tasks");
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
  }, []);

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
          <h2 className="text-2xl font-bold text-white tracking-tight">Accountability Task Board</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Track tasks mapped directly to decisions resolved in organizational sync sessions.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-gray-400 font-medium">Filter by:</span>
          </div>

          {/* Owner Filter */}
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="bg-obsidian-dark border border-obsidian-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyber-purple transition-all"
          >
            <option value="all">All Assignees</option>
            <option value="Aman">Aman (Backend)</option>
            <option value="Reeti">Reeti (Frontend)</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-obsidian-dark border border-obsidian-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyber-purple transition-all"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
          </select>
        </div>

        <div className="text-[10px] text-gray-500 font-mono">
          Showing {filteredTasks.length} active action items
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          
          return (
            <div key={col.id} className="space-y-4">
              {/* Header */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${col.color}`}>
                <span className="text-xs font-bold uppercase tracking-wider font-mono">{col.name}</span>
                <span className="px-2 py-0.5 rounded bg-black/30 text-[10px] font-mono font-bold">{colTasks.length}</span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 min-h-[450px] bg-obsidian-light/10 border border-obsidian-border/40 rounded-2xl p-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-4 rounded-xl glass-card border border-obsidian-border/70 hover:border-cyber-purple/30 cursor-pointer space-y-3 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-mono font-bold ${
                        task.priority === "high"
                          ? "bg-cyber-rose/10 border border-cyber-rose/25 text-cyber-rose"
                          : "bg-white/5 border border-white/10 text-gray-400"
                      }`}>
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                        <User className="h-3 w-3 text-cyber-cyan" /> {task.owner}
                      </div>
                    </div>

                    <p className="text-xs text-white font-medium leading-relaxed">
                      {task.title}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-obsidian-border/50 text-[10px] text-gray-500 font-mono">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {task.deadline}</span>
                      
                      {/* Simple Quick Movers */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {col.id !== "todo" && (
                          <button
                            onClick={() => updateTaskStatus(task.id, col.id === "done" ? "in_progress" : "todo")}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                            title="Move Left"
                          >
                            ◀
                          </button>
                        )}
                        {col.id !== "done" && (
                          <button
                            onClick={() => updateTaskStatus(task.id, col.id === "todo" ? "in_progress" : "done")}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                            title="Move Right"
                          >
                            ▶
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Deep Lineage Retro Link */}
                    <div className="pt-2 text-[9px] text-cyber-cyan flex items-center justify-between">
                      <Link href={`/meetings?id=${task.meeting_id}`} className="hover:underline flex items-center gap-0.5">
                        Assigned in {task.meeting_title.split("&")[0]} <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
                
                {colTasks.length === 0 && (
                  <div className="text-center py-12 text-gray-600 text-xs font-mono">
                    Empty column
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Task Editor Drawer Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel space-y-4 border border-cyber-purple/20">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/20 text-[9px] uppercase font-mono tracking-wider">
                  Lineage Node #{selectedTask.id}
                </span>
                <h3 className="font-bold text-white text-base mt-2">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveTaskDetails} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Assignee</label>
                <select
                  value={selectedTask.owner}
                  onChange={(e) => setSelectedTask({ ...selectedTask, owner: e.target.value })}
                  className="w-full bg-obsidian-dark border border-obsidian-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Aman">Aman (Backend)</option>
                  <option value="Reeti">Reeti (Frontend)</option>
                  <option value="Sarah">Sarah (Product)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Deadline Date</label>
                <input
                  type="text"
                  value={selectedTask.deadline}
                  onChange={(e) => setSelectedTask({ ...selectedTask, deadline: e.target.value })}
                  className="w-full bg-obsidian-dark border border-obsidian-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Priority</label>
                <select
                  value={selectedTask.priority}
                  onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
                  className="w-full bg-obsidian-dark border border-obsidian-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <Link
                  href={`/meetings?id=${selectedTask.meeting_id}`}
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 border border-obsidian-border hover:bg-white/5 rounded-xl text-xs text-gray-300 font-bold flex items-center gap-1"
                >
                  Open Meeting <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyber-purple to-cyber-cyan rounded-xl text-xs text-white font-bold"
                >
                  Commit Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
