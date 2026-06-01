"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Send, 
  Sparkles, 
  Hash, 
  ArrowRight,
  Code,
  X,
  Clock,
  CheckCircle,
  Calendar,
  TrendingUp,
  Edit2,
  Save,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../components/AuthProvider";

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  status: "online" | "offline" | "idle";
  activity: string;
  color: string;
  email?: string;
}

const CHANNELS = [
  { id: "general", name: "general-sync", desc: "Main discussion channel for Project Alpha" },
  { id: "hackathon", name: "hackathon-prep", desc: "Coordination for next week's code sprint" },
  { id: "dev", name: "dev-chat", desc: "FastAPI endpoints & Next.js integration syncs" },
  { id: "product", name: "product-roadmap", desc: "Feature scopes & milestone planning" }
];

export default function TeamWorkspace() {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState("general");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // User progress dashboard states
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberProgress, setMemberProgress] = useState<any | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [newRoleValue, setNewRoleValue] = useState("");

  const handleMemberClick = async (member: TeamMember) => {
    setSelectedMember(member);
    setLoadingProgress(true);
    setEditingRole(false);
    try {
      const identifier = member.email || member.name;
      const res = await fetch(`http://127.0.0.1:8000/api/users/${encodeURIComponent(identifier)}/progress`);
      if (res.ok) {
        const data = await res.json();
        setMemberProgress(data);
        setNewRoleValue(data.role || member.role);
      }
    } catch (err) {
      console.error("Failed to load user progress:", err);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember || !memberProgress?.user_id) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/users/${memberProgress.user_id}/update-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRoleValue })
      });
      if (res.ok) {
        const data = await res.json();
        setMemberProgress((prev: any) => ({ ...prev, role: data.user.role }));
        setEditingRole(false);
      }
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  // Load speakers and active tasks from the backend
  useEffect(() => {
    async function loadWorkspaceData() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/users");
        if (res.ok) {
          const data = await res.json();
          setDbUsers(data);
        }
      } catch (err) {
        console.warn("Failed to load users from DB:", err);
      }

      try {
        const url = user?.email
          ? `http://127.0.0.1:8000/api/analytics?user_email=${encodeURIComponent(user.email)}`
          : "http://127.0.0.1:8000/api/analytics";
        const analyticsRes = await fetch(url);
        if (analyticsRes.ok) {
          const analytics = await analyticsRes.json();
          const list = Object.keys(analytics.speaking_distribution || {});
          setSpeakers(list);
        }
      } catch (err) {
        console.warn("Failed to load speakers:", err);
      }

      try {
        const url = user?.email
          ? `http://127.0.0.1:8000/api/tasks?user_email=${encodeURIComponent(user.email)}`
          : "http://127.0.0.1:8000/api/tasks";
        const tasksRes = await fetch(url);
        if (tasksRes.ok) {
          const allTasks = await tasksRes.json();
          const active = allTasks.filter((t: any) => t.status !== "done");
          setTasksList(active);
        }
      } catch (err) {
        console.warn("Failed to load tasks:", err);
      }
    }
    loadWorkspaceData();
  }, [user]);

  // Load chat messages on mount / channel change
  useEffect(() => {
    const chatKey = `MemoMind_chat_history_${activeChannel}`;
    const stored = localStorage.getItem(chatKey);
    if (stored) {
      try {
        setChatMessages(JSON.parse(stored));
      } catch (err) {
        setChatMessages([]);
      }
    } else {
      setChatMessages([
        {
          sender: "MemoMind AI",
          avatar: "",
          text: `🤖 Welcome to #${CHANNELS.find(ch => ch.id === activeChannel)?.name}! This channel is live and dynamic. Ask me any question about your team memory (mention "AI" or "assistant"), or upload meetings to build our workspace knowledge.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true
        }
      ]);
    }
  }, [activeChannel]);

  // Helper to save messages
  const saveMessages = (msgs: any[]) => {
    const chatKey = `MemoMind_chat_history_${activeChannel}`;
    localStorage.setItem(chatKey, JSON.stringify(msgs));
  };

  // Dynamically include active custom user and detected speakers in members list
  const activeMembers = React.useMemo(() => {
    const list: TeamMember[] = [];
    
    // Add current user
    if (user) {
      list.push({
        name: user.name,
        role: user.role || "Workspace Contributor",
        avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`,
        status: "online",
        activity: "Collaborating Live",
        color: "border-cyber-cyan text-cyber-cyan",
        email: user.email
      });
    } else {
      list.push({
        name: "Developer Guest",
        role: "Workspace Administrator",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Guest",
        status: "online",
        activity: "Collaborating Live",
        color: "border-cyber-cyan text-cyber-cyan",
        email: "developer@company.com"
      });
    }

    // Add other users from the DB
    dbUsers.forEach((dbUser: any) => {
      // Avoid duplicating the current user
      if (user && dbUser.email?.toLowerCase() === user.email?.toLowerCase()) return;
      if (dbUser.email?.toLowerCase() === "developer@company.com") return;

      // Avoid duplicate names on the active list
      const existsByName = list.some(m => m.name.toLowerCase() === dbUser.name.toLowerCase());
      if (existsByName) return;

      list.push({
        name: dbUser.name,
        role: dbUser.role || "Workspace Contributor",
        avatar: dbUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(dbUser.name)}`,
        status: "online", // Mock online
        activity: "Collaborating in Workspace",
        color: "border-cyber-purple text-cyber-purple",
        email: dbUser.email
      });
    });

    // Add detected speakers from meetings
    speakers.forEach(spk => {
      if (user && spk.toLowerCase() === user.name.toLowerCase()) return;
      if (spk.toLowerCase() === "developer guest") return;
      
      const exists = list.some(m => m.name.toLowerCase() === spk.toLowerCase());
      if (exists) return;

      let email = spk;
      if (spk.toLowerCase().includes("sarah")) email = "sarah@company.com";
      else if (spk.toLowerCase().includes("aman")) email = "aman@company.com";
      else if (spk.toLowerCase().includes("reeti")) email = "reeti@company.com";
      else if (spk.toLowerCase().includes("fletcher")) email = "fletcher@company.com";

      list.push({
        name: spk,
        role: "Sync Participant",
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(spk)}`,
        status: "online",
        activity: "Inactive",
        color: "border-gray-500 text-gray-500",
        email: email
      });
    });

    return list;
  }, [user, dbUsers, speakers]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const senderName = user ? user.name : "Developer Guest";
    const senderAvatar = user ? user.avatar : "https://api.dicebear.com/7.x/bottts/svg?seed=Guest";

    const userMsg = {
      sender: senderName,
      avatar: senderAvatar,
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAi: false
    };

    const updatedMsgs = [...chatMessages, userMsg];
    setChatMessages(updatedMsgs);
    saveMessages(updatedMsgs);
    setInputMessage("");

    // Call dynamic AI responding if mentioned
    if (inputMessage.toLowerCase().includes("ai") || inputMessage.toLowerCase().includes("assistant")) {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: inputMessage })
        });
        
        if (res.ok) {
          const searchRes = await res.json();
          const aiMsg = {
            sender: "MemoMind AI",
            avatar: "",
            text: searchRes.answer || "I couldn't find any relevant details in our meeting memory.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAi: true
          };
          const newMsgs = [...updatedMsgs, aiMsg];
          setChatMessages(newMsgs);
          saveMessages(newMsgs);
        } else {
          throw new Error("Search failed");
        }
      } catch (err) {
        const errorMsg = {
          sender: "MemoMind AI",
          avatar: "",
          text: "🤖 Connection error. I am currently offline and cannot search meeting memory. Make sure the backend server is running.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true
        };
        const newMsgs = [...updatedMsgs, errorMsg];
        setChatMessages(newMsgs);
        saveMessages(newMsgs);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2.5">
          <Users className="h-6 w-6 text-cyber-purple animate-pulse" /> Team Workspace
        </h2>
        <p className="text-[var(--foreground)]/70 text-sm mt-0.5 font-sans">
          Chat with your team, collaborate on channels, and view real-time highlights from the meeting assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left pane: channels & active members (3 cols) */}
        <div className="xl:col-span-3 space-y-6 flex flex-col justify-between">
          
          {/* Channels list */}
          <div className="p-5 border border-[var(--color-obsidian-border)] bg-transparent glass-card rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Channels</h3>
            
            <div className="space-y-1">
              {CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left group cursor-pointer ${
                    activeChannel === ch.id 
                      ? "bg-cyber-purple/15 text-[var(--foreground)] font-semibold border border-cyber-purple/20" 
                      : "text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Hash className={`h-4 w-4 ${activeChannel === ch.id ? "text-cyber-cyan" : "text-[var(--foreground)]/50 group-hover:text-cyber-purple"}`} />
                    {ch.name}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyber-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Active Members list */}
          <div className="p-5 border border-[var(--color-obsidian-border)] bg-transparent glass-card rounded-2xl space-y-4 flex-1 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Who's Online</h3>
              <span className="text-[9px] font-mono bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyber-emerald animate-ping" /> {activeMembers.length} Online
              </span>
            </div>

            <div className="space-y-3.5 font-sans">
              {activeMembers.map((mb, idx) => (
                <button
                  key={`${mb.email || mb.name}-${idx}`}
                  onClick={() => handleMemberClick(mb)}
                  className="w-full flex items-start gap-3 p-1.5 rounded-xl hover:bg-[var(--foreground)]/[0.02] transition-colors group cursor-pointer text-left focus:outline-none"
                >
                  <div className="relative shrink-0">
                    <img 
                      src={mb.avatar} 
                      alt={mb.name} 
                      className={`h-9 w-9 rounded-xl border p-0.5 bg-black ${
                        mb.status === "online" ? "border-cyber-emerald" : "border-[var(--color-obsidian-border)]"
                      }`}
                    />
                    <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-black ${
                      mb.status === "online" 
                        ? "bg-cyber-emerald" 
                        : mb.status === "idle" 
                        ? "bg-amber-400 animate-pulse" 
                        : "bg-gray-500"
                    }`} />
                  </div>
                  
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-[var(--foreground)] truncate">{mb.name}</p>
                    <p className="text-[10px] text-[var(--foreground)]/50 truncate leading-tight font-sans">{mb.role}</p>
                    <p className="text-[9px] text-cyber-cyan truncate mt-1 animate-fadeIn leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity font-sans">
                      Working on: {mb.activity}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
        </div>

        {/* Middle pane: Workspace collaborative chat (6 cols) */}
        <div className="xl:col-span-6 flex flex-col border border-[var(--color-obsidian-border)] bg-transparent glass-card rounded-2xl overflow-hidden min-h-[550px]">
          {/* Header Bar */}
          <div className="p-4 bg-[var(--foreground)]/[0.02] border-b border-[var(--color-obsidian-border)] flex items-center justify-between font-sans">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Hash className="h-4.5 w-4.5 text-cyber-cyan animate-pulse" />
                {CHANNELS.find(ch => ch.id === activeChannel)?.name || "general-sync"}
              </h3>
              <p className="text-[10px] text-[var(--foreground)]/50 mt-0.5 font-sans">
                {CHANNELS.find(ch => ch.id === activeChannel)?.desc}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyber-emerald animate-pulse" />
              <span className="text-[9px] text-[var(--foreground)]/50 font-mono uppercase tracking-wider">Live</span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[400px]">
            {chatMessages.map((msg, idx) => {
              if (msg.isAi) {
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-cyber-purple/10 to-cyber-cyan/5 border border-cyber-purple/15 text-xs text-[var(--foreground)]/90 space-y-1.5 font-sans"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-cyber-cyan font-bold uppercase tracking-wider text-[10px]">
                        <Sparkles className="h-3.5 w-3.5 animate-spin" /> {msg.sender}
                      </span>
                      <span className="text-[9px] text-[var(--foreground)]/50 font-mono">{msg.time}</span>
                    </div>
                    <p className="leading-relaxed font-sans">{msg.text}</p>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3.5 group font-sans"
                >
                  <img 
                    src={msg.avatar} 
                    alt={msg.sender} 
                    className="h-8.5 w-8.5 rounded-xl bg-slate-900 border border-[var(--color-obsidian-border)] shrink-0 p-0.5"
                  />
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--foreground)]">{msg.sender}</span>
                      <span className="text-[8px] text-[var(--foreground)]/50 font-mono">{msg.time}</span>
                    </div>
                    <p className="text-xs text-[var(--foreground)]/80 leading-relaxed font-sans">{msg.text}</p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input Chat Box */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[var(--foreground)]/[0.01] border-t border-[var(--color-obsidian-border)] flex gap-3">
            <input
              type="text"
              placeholder={`Send a message to #${CHANNELS.find(ch => ch.id === activeChannel)?.name || "general-sync"} (mention 'AI' to query assistant)...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all font-sans"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-cyber-purple hover:bg-cyber-purple/90 border border-[var(--color-obsidian-border)] text-[var(--foreground)] transition-all shadow-md shrink-0 flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>

        {/* Right pane: Active Action Items list (3 cols) */}
        <div className="xl:col-span-3 space-y-6 flex flex-col">
          
          {/* Active sprint actions */}
          <div className="p-5 border border-[var(--color-obsidian-border)] bg-transparent glass-card rounded-2xl space-y-4 flex-1">
            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Workspace Tasks</h3>
            
            <div className="space-y-3 font-sans">
              {tasksList.slice(0, 3).map((task) => (
                <div key={task.id} className="p-3 bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] rounded-xl space-y-2 group hover:border-cyber-cyan/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-cyber-cyan font-bold uppercase tracking-wider flex items-center gap-1">
                      <Code className="h-3 w-3" /> {task.priority || "normal"}
                    </span>
                    <span className="text-[var(--foreground)]/50">{task.deadline || "No deadline"}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[var(--foreground)] group-hover:text-cyber-cyan transition-colors leading-tight">{task.title}</h4>
                  <div className="flex items-center gap-1.5 text-[9px] text-[var(--foreground)]/70">
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(task.owner)}`} className="h-4.5 w-4.5 rounded-md border border-[var(--color-obsidian-border)] shrink-0" />
                    <span>Owned by {task.owner}</span>
                  </div>
                </div>
              ))}
              {tasksList.length === 0 && (
                <p className="text-[11px] text-[var(--foreground)]/50 italic text-center py-4">No active tasks in this workspace.</p>
              )}
            </div>
            
            <div className="pt-2 flex gap-1 items-center text-[10px] text-cyber-cyan font-semibold cursor-pointer">
              <a href="/tasks" className="flex items-center gap-1">
                Go to Tasks Kanban <ArrowRight className="h-3 w-3 animate-pulse" />
              </a>
            </div>
          </div>

          {/* Quick SaaS integration info panel */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-cyber-purple/15 via-cyber-cyan/15 to-transparent border border-cyber-purple/20 relative overflow-hidden group shadow-lg">
            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyber-cyan animate-pulse" /> Smart Assistant
            </h3>
            <p className="text-[11px] text-[var(--foreground)]/80 mt-2.5 leading-relaxed font-sans">
              Every message and decision in this workspace is understood by the AI automatically, creating a seamless memory of your team's work.
            </p>
          </div>
          
        </div>

      </div>

      {/* Dialog Modal: Member Progress Dashboard */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-[var(--color-obsidian-border)] bg-black/85 p-6 md:p-8 text-[var(--foreground)] shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedMember(null);
                  setMemberProgress(null);
                }}
                className="absolute top-6 right-6 p-1.5 rounded-xl border border-[var(--color-obsidian-border)] bg-black/45 text-[var(--foreground)]/70 hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {loadingProgress ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <span className="h-10 w-10 border-4 border-cyber-purple border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-[var(--foreground)]/60 font-mono">Compiling User Intelligence...</p>
                </div>
              ) : memberProgress ? (
                <div className="space-y-6 text-left">
                  {/* Overview Header */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-[var(--color-obsidian-border)]">
                    <div className="relative">
                      <img
                        src={selectedMember.avatar}
                        alt={selectedMember.name}
                        className="h-16 w-16 rounded-2xl border border-cyber-purple bg-black p-1 shrink-0"
                      />
                      <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border border-black bg-cyber-emerald" />
                    </div>

                    <div className="text-center sm:text-left flex-1 space-y-1">
                      <h3 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                        {memberProgress.name}
                      </h3>
                      <p className="text-xs text-[var(--foreground)]/50 font-mono">
                        {memberProgress.email}
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1.5">
                        {editingRole ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newRoleValue}
                              onChange={(e) => setNewRoleValue(e.target.value)}
                              className="bg-black/60 border border-cyber-purple/50 rounded-lg px-2.5 py-1 text-xs text-[var(--foreground)] focus:outline-none"
                            />
                            <button
                              onClick={handleUpdateRole}
                              className="p-1 rounded bg-cyber-emerald/20 border border-cyber-emerald/40 text-cyber-emerald cursor-pointer hover:scale-105"
                              title="Save Role"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingRole(false)}
                              className="p-1 rounded bg-cyber-rose/20 border border-cyber-rose/40 text-cyber-rose cursor-pointer hover:scale-105"
                              title="Cancel"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-cyber-purple/10 border border-cyber-purple/35 text-cyber-purple font-mono font-bold tracking-wider">
                              {memberProgress.role}
                            </span>
                            {/* Role edit option for admins */}
                            {(user?.role?.toLowerCase().includes("admin") || user?.role?.toLowerCase().includes("owner") || user?.name === "Developer Guest") && (
                              <button
                                onClick={() => setEditingRole(true)}
                                className="p-1 rounded-lg border border-[var(--color-obsidian-border)] bg-black/40 text-[var(--foreground)]/55 hover:text-cyber-cyan hover:border-cyber-cyan/40 transition-colors cursor-pointer"
                                title="Edit Role"
                              >
                                <Edit2 className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        )}
                        <span className="text-[10px] text-[var(--foreground)]/40 font-mono">
                          Joined: {memberProgress.created_at}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Meeting Stats */}
                    <div className="p-5 border border-[var(--color-obsidian-border)] bg-white/[0.01] rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold font-mono text-[var(--foreground)]/60 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-cyber-purple" /> Sync Attendance
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-black/35 rounded-xl border border-[var(--color-obsidian-border)]">
                          <p className="text-[9px] text-[var(--foreground)]/50 font-mono font-bold">Attended</p>
                          <p className="text-lg font-black text-cyber-cyan font-mono mt-0.5">{memberProgress.meetings_attended}</p>
                        </div>
                        <div className="p-2 bg-black/35 rounded-xl border border-[var(--color-obsidian-border)]">
                          <p className="text-[9px] text-[var(--foreground)]/50 font-mono font-bold">Missed</p>
                          <p className="text-lg font-black text-cyber-rose font-mono mt-0.5">{memberProgress.meetings_missed}</p>
                        </div>
                        <div className="p-2 bg-cyber-purple/10 rounded-xl border border-cyber-purple/20">
                          <p className="text-[9px] text-cyber-purple font-mono font-bold">Rate</p>
                          <p className="text-lg font-black text-cyber-purple font-mono mt-0.5">{memberProgress.attendance_rate}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Task Stats */}
                    <div className="p-5 border border-[var(--color-obsidian-border)] bg-white/[0.01] rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold font-mono text-[var(--foreground)]/60 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-cyber-emerald" /> Task Deliverables
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-black/35 rounded-xl border border-[var(--color-obsidian-border)]">
                          <p className="text-[9px] text-[var(--foreground)]/50 font-mono font-bold">Done</p>
                          <p className="text-lg font-black text-cyber-emerald font-mono mt-0.5">{memberProgress.completed_tasks}</p>
                        </div>
                        <div className="p-2 bg-black/35 rounded-xl border border-[var(--color-obsidian-border)]">
                          <p className="text-[9px] text-[var(--foreground)]/50 font-mono font-bold">Pending</p>
                          <p className="text-lg font-black text-amber-500 font-mono mt-0.5">{memberProgress.pending_tasks}</p>
                        </div>
                        <div className="p-2 bg-cyber-cyan/10 rounded-xl border border-cyber-cyan/20">
                          <p className="text-[9px] text-cyber-cyan font-mono font-bold">Rate</p>
                          <p className="text-lg font-black text-cyber-cyan font-mono mt-0.5">{memberProgress.task_completion_rate}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights & Decisions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Insights card */}
                    <div className="md:col-span-2 p-5 border border-[var(--color-obsidian-border)] bg-white/[0.01] rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold font-mono text-[var(--foreground)]/60 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-cyber-cyan animate-pulse" /> AI Behavioral Insights
                      </h4>
                      <div className="space-y-2">
                        {memberProgress.ai_insights.map((ins: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2.5 p-2 bg-cyber-cyan/[0.02] border border-cyber-cyan/10 rounded-xl text-xs leading-relaxed text-[var(--foreground)]/80">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyber-cyan mt-1.5 shrink-0" />
                            <p>{ins}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Decision Contributions */}
                    <div className="p-5 border border-[var(--color-obsidian-border)] bg-gradient-to-tr from-cyber-purple/10 to-transparent rounded-2xl flex flex-col justify-between">
                      <h4 className="text-xs font-bold font-mono text-[var(--foreground)]/60 uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-cyber-purple" /> Decisions
                      </h4>
                      <div className="py-4 text-center">
                        <p className="text-3xl font-black text-cyber-purple font-mono">{memberProgress.decision_contributions}</p>
                        <p className="text-[10px] text-[var(--foreground)]/50 font-sans mt-1">Negotiations participated in</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Timeline */}
                  <div className="p-5 border border-[var(--color-obsidian-border)] bg-white/[0.01] rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold font-mono text-[var(--foreground)]/60 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-cyber-cyan" /> Recent Activity Timeline
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      {/* Recent meetings */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono text-[var(--foreground)]/50 uppercase tracking-widest font-bold">Meetings Attended</p>
                        {memberProgress.recent_activity?.meetings?.length > 0 ? (
                          memberProgress.recent_activity.meetings.map((meet: any) => (
                            <div key={meet.id} className="p-2.5 bg-black/40 border border-[var(--color-obsidian-border)] rounded-xl text-xs flex justify-between items-center font-sans">
                              <span className="font-semibold text-[var(--foreground)]/90 truncate mr-2">{meet.title}</span>
                              <span className="text-[9px] text-[var(--foreground)]/40 font-mono shrink-0">{meet.date.split(" ")[0]}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-[var(--foreground)]/45 italic font-sans">No recent meeting records.</p>
                        )}
                      </div>
                      
                      {/* Recent tasks */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono text-[var(--foreground)]/50 uppercase tracking-widest font-bold">Assigned Tasks</p>
                        {memberProgress.recent_activity?.tasks?.length > 0 ? (
                          memberProgress.recent_activity.tasks.map((tsk: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-black/40 border border-[var(--color-obsidian-border)] rounded-xl text-xs flex justify-between items-center font-sans">
                              <span className="font-semibold text-[var(--foreground)]/90 truncate mr-2">{tsk.title}</span>
                              <span className={`text-[9px] font-mono shrink-0 px-2 py-0.5 rounded font-bold ${
                                tsk.status === "done" ? "bg-cyber-emerald/10 text-cyber-emerald" : "bg-cyber-purple/10 text-cyber-purple animate-pulse"
                              }`}>{tsk.status}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-[var(--foreground)]/45 italic font-sans">No recent tasks assigned.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-[var(--foreground)]/50 font-sans text-xs">
                  Failed to fetch progress details.
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
