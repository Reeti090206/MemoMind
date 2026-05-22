"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Hash, 
  Flame, 
  CheckCircle, 
  Clock, 
  Network,
  Tv,
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

const MEMBERS: TeamMember[] = [
  {
    name: "Aman Gupta",
    role: "Backend Architect",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Aman",
    status: "online",
    activity: "Tuning SQLite vector hash indices",
    color: "border-cyber-cyan text-cyber-cyan"
  },
  {
    name: "Reeti Sharma",
    role: "Frontend Engineer",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Reeti",
    status: "online",
    activity: "Customizing Tailwind v4 components",
    color: "border-cyber-purple text-cyber-purple"
  },
  {
    name: "Sarah Jenkins",
    role: "Lead Product Manager",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sarah",
    status: "online",
    activity: "Writing PRD for live Whisper speech diarization",
    color: "border-cyber-rose text-cyber-rose"
  },
  {
    name: "Riya Verma",
    role: "UI/UX Designer",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Riya",
    status: "idle",
    activity: "Reviewing glassmorphism visual templates",
    color: "border-amber-400 text-amber-400"
  }
];

const CHANNELS = [
  { id: "general", name: "general-sync", desc: "Main discussion channel for Project Alpha" },
  { id: "hackathon", name: "hackathon-prep", desc: "Coordination for next week's code sprint" },
  { id: "dev", name: "dev-chat", desc: "FastAPI endpoints & Next.js integration syncs" },
  { id: "product", name: "product-roadmap", desc: "Feature scopes & milestone planning" }
];

export default function TeamWorkspace() {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState("general");
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "Aman Gupta",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Aman",
      text: "Hey everyone, I just successfully updated our local vector indices. The similarity search is matching decisions perfectly!",
      time: "2:10 PM",
      isAi: false
    },
    {
      sender: "Reeti Sharma",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Reeti",
      text: "Awesome! I am wrapping up the force-directed memory graph canvas. It visualizes the overrides and decisions beautifully.",
      time: "2:12 PM",
      isAi: false
    },
    {
      sender: "MeetGraph AI",
      avatar: "",
      text: "⚡ SYSTEM UPDATE: Automatic contradiction detection identified a shift. Shifting from avoiding microservices (Kickoff sync) to migrating to microservices (SaaS scaling sync) has been indexed at 88% confidence.",
      time: "2:13 PM",
      isAi: true
    },
    {
      sender: "Sarah Jenkins",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sarah",
      text: "This is perfect. It means we don't have to keep digging through recordings to remember why we changed our tech stack! Great work team.",
      time: "2:15 PM",
      isAi: false
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Dynamically include active custom user in online members list
  const activeMembers = React.useMemo(() => {
    if (!user) return MEMBERS;

    // Check if user is already one of the static members to prevent duplication
    const exists = MEMBERS.some(
      m => m.name.toLowerCase() === user.name.toLowerCase() ||
           user.name.toLowerCase() === "developer guest"
    );
    if (exists) return MEMBERS;

    const customMember: TeamMember = {
      name: user.name,
      role: user.role || "Workspace Contributor",
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`,
      status: "online",
      activity: "Collaborating Live",
      color: "border-cyber-cyan text-cyber-cyan"
    };

    return [customMember, ...MEMBERS];
  }, [user]);

  // Welcome message useEffect triggered once per session
  useEffect(() => {
    if (user) {
      const sessionKey = `meetgraph_welcome_dispatched_${user.email}`;
      const alreadyDispatched = sessionStorage.getItem(sessionKey);
      
      if (!alreadyDispatched) {
        const welcomeMsg = {
          sender: "MeetGraph AI",
          avatar: "",
          text: `🤖 Welcome to MemoMind AI, ${user.name}! We've successfully established a secure workspace connection for your account (${user.email}). I will be monitoring this channel to capture team updates, track critical project decisions, and draft follow-up tasks in real-time. Let me know if you need any assistance!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true
        };

        const timer = setTimeout(() => {
          setChatMessages(prev => [...prev, welcomeMsg]);
          sessionStorage.setItem(sessionKey, "true");
        }, 1200);

        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;

    const newMsg = {
      sender: user.name,
      avatar: user.avatar,
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAi: false
    };

    setChatMessages(prev => [...prev, newMsg]);
    setInputMessage("");

    // Simulate AI responding
    if (inputMessage.toLowerCase().includes("ai") || inputMessage.toLowerCase().includes("assistant")) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          sender: "MeetGraph AI",
          avatar: "",
          text: "🤖 Hello! I am observing this collaborative workspace. You can ask me questions about your team memory directly, or start a 'Live Monitor' session to have me log tasks automatically.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true
        }]);
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Users className="h-6 w-6 text-cyber-purple animate-pulse" /> Team Workspace
        </h2>
        <p className="text-gray-400 text-sm mt-0.5 font-sans">
          Chat with your team, collaborate on channels, and view real-time highlights from the meeting assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left pane: channels & active members (3 cols) */}
        <div className="xl:col-span-3 space-y-6 flex flex-col justify-between">
          
          {/* Channels list */}
          <div className="p-5 border border-white/5 bg-transparent glass-card rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Channels</h3>
            
            <div className="space-y-1">
              {CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left group cursor-pointer ${
                    activeChannel === ch.id 
                      ? "bg-cyber-purple/15 text-white font-semibold border border-cyber-purple/20" 
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Hash className={`h-4 w-4 ${activeChannel === ch.id ? "text-cyber-cyan" : "text-gray-500 group-hover:text-cyber-purple"}`} />
                    {ch.name}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyber-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Active Members list */}
          <div className="p-5 border border-white/5 bg-transparent glass-card rounded-2xl space-y-4 flex-1 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Who's Online</h3>
              <span className="text-[9px] font-mono bg-cyber-emerald/10 border border-cyber-emerald/20 text-cyber-emerald px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyber-emerald animate-ping" /> {activeMembers.length} Online
              </span>
            </div>

            <div className="space-y-3.5 font-sans">
              {activeMembers.map(mb => (
                <div key={mb.name} className="flex items-start gap-3 p-1.5 rounded-xl hover:bg-white/[0.02] transition-colors group">
                  <div className="relative shrink-0">
                    <img 
                      src={mb.avatar} 
                      alt={mb.name} 
                      className={`h-9 w-9 rounded-xl border p-0.5 bg-black ${
                        mb.status === "online" ? "border-cyber-emerald" : "border-white/5"
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
                    <p className="text-xs font-bold text-white truncate">{mb.name}</p>
                    <p className="text-[10px] text-gray-500 truncate leading-tight font-sans">{mb.role}</p>
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
        <div className="xl:col-span-6 flex flex-col border border-white/5 bg-transparent glass-card rounded-2xl overflow-hidden min-h-[550px]">
          {/* Header Bar */}
          <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between font-sans">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Hash className="h-4.5 w-4.5 text-cyber-cyan animate-pulse" />
                {CHANNELS.find(ch => ch.id === activeChannel)?.name || "general-sync"}
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5 font-sans">
                {CHANNELS.find(ch => ch.id === activeChannel)?.desc}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyber-emerald animate-pulse" />
              <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Live</span>
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
                    className="p-4 rounded-xl bg-gradient-to-r from-cyber-purple/10 to-cyber-cyan/5 border border-cyber-purple/15 text-xs text-gray-200 space-y-1.5 font-sans"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-cyber-cyan font-bold uppercase tracking-wider text-[10px]">
                        <Sparkles className="h-3.5 w-3.5 animate-spin" /> {msg.sender}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono">{msg.time}</span>
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
                    className="h-8.5 w-8.5 rounded-xl bg-slate-900 border border-white/10 shrink-0 p-0.5"
                  />
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{msg.sender}</span>
                      <span className="text-[8px] text-gray-500 font-mono">{msg.time}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">{msg.text}</p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input Chat Box */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white/[0.01] border-t border-white/5 flex gap-3">
            <input
              type="text"
              placeholder={`Send a message to #${CHANNELS.find(ch => ch.id === activeChannel)?.name || "general-sync"} (mention 'AI' to query assistant)...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-black/45 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all font-sans"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-cyber-purple hover:bg-cyber-purple/90 border border-white/10 text-white transition-all shadow-md shrink-0 flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>

        {/* Right pane: Active Action Items list (3 cols) */}
        <div className="xl:col-span-3 space-y-6 flex flex-col">
          
          {/* Active sprint actions */}
          <div className="p-5 border border-white/5 bg-transparent glass-card rounded-2xl space-y-4 flex-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Workspace Tasks</h3>
            
            <div className="space-y-3 font-sans">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2 group hover:border-cyber-cyan/30 transition-all cursor-pointer">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-cyber-cyan font-bold uppercase tracking-wider flex items-center gap-1">
                    <Code className="h-3 w-3" /> Engineering
                  </span>
                  <span className="text-gray-500">Friday</span>
                </div>
                <h4 className="text-xs font-semibold text-white group-hover:text-cyber-cyan transition-colors leading-tight">Implement core database migrations</h4>
                <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Aman" className="h-4.5 w-4.5 rounded-md border border-white/10 shrink-0" />
                  <span>Owned by Aman G.</span>
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2 group hover:border-cyber-purple/30 transition-all cursor-pointer">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-cyber-purple font-bold uppercase tracking-wider flex items-center gap-1">
                    <Tv className="h-3 w-3" /> Design
                  </span>
                  <span className="text-gray-500">Monday</span>
                </div>
                <h4 className="text-xs font-semibold text-white group-hover:text-cyber-purple transition-colors leading-tight">Update UI components with new design system</h4>
                <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Reeti" className="h-4.5 w-4.5 rounded-md border border-white/10 shrink-0" />
                  <span>Owned by Reeti S.</span>
                </div>
              </div>
            </div>
            
            <div className="pt-2 flex gap-1 items-center text-[10px] text-cyber-cyan font-semibold cursor-pointer">
              <a href="/tasks" className="flex items-center gap-1">
                Go to Tasks Kanban <ArrowRight className="h-3 w-3 animate-pulse" />
              </a>
            </div>
          </div>

          {/* Quick SaaS integration info panel */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-cyber-purple/15 via-cyber-cyan/15 to-transparent border border-cyber-purple/20 relative overflow-hidden group shadow-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyber-cyan animate-pulse" /> Smart Assistant
            </h3>
            <p className="text-[11px] text-gray-300 mt-2.5 leading-relaxed font-sans">
              Every message and decision in this workspace is understood by the AI automatically, creating a seamless memory of your team's work.
            </p>
          </div>
          
        </div>

      </div>
    </div>
  );
}
