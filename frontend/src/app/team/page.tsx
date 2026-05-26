"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Send, 
  Sparkles, 
  Hash, 
  ArrowRight,
  Code
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
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Load speakers and active tasks from the backend
  useEffect(() => {
    async function loadWorkspaceData() {
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
        color: "border-cyber-cyan text-cyber-cyan"
      });
    } else {
      list.push({
        name: "Developer Guest",
        role: "Workspace Administrator",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Guest",
        status: "online",
        activity: "Collaborating Live",
        color: "border-cyber-cyan text-cyber-cyan"
      });
    }

    // Add detected speakers from meetings
    speakers.forEach(spk => {
      if (user && spk.toLowerCase() === user.name.toLowerCase()) return;
      if (spk.toLowerCase() === "developer guest") return;

      list.push({
        name: spk,
        role: "Sync Participant",
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(spk)}`,
        status: "online",
        activity: "Inactive",
        color: "border-gray-500 text-gray-500"
      });
    });

    return list;
  }, [user, speakers]);

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
              {activeMembers.map(mb => (
                <div key={mb.name} className="flex items-start gap-3 p-1.5 rounded-xl hover:bg-[var(--foreground)]/[0.02] transition-colors group">
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
                </div>
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
    </div>
  );
}
