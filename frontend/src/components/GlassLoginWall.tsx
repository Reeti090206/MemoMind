"use client";

import React, { useState } from "react";
import { useAuth, SEED_PROFILES } from "./AuthProvider";
import { Network, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlassLoginWall() {
  const { loginWithGoogle } = useAuth();
  const [isSimulatingOAuth, setIsSimulatingOAuth] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  const handleSimulatedGoogleLogin = async (profileKey?: string) => {
    setIsSimulatingOAuth(true);
    // Latency for Google popup simulation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await loginWithGoogle(profileKey);
    setIsSimulatingOAuth(false);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#07070a] text-white flex items-center justify-center overflow-hidden z-50">
      {/* Dynamic Background Neon Light Fields */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyber-purple/15 rounded-full blur-[160px] animate-pulse duration-4000 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyber-cyan/15 rounded-full blur-[160px] animate-pulse duration-3000 pointer-events-none" />
      <div className="absolute top-[40%] left-[35%] w-[30%] h-[30%] bg-cyber-rose/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Futuristic Background grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="max-w-5xl w-full mx-4 grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Hand Visual: Interactive memory graph preview */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-center pr-6">
          <div className="relative mb-6">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyber-purple to-cyber-cyan flex items-center justify-center border-glow-purple shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <Network className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
            Meet<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-rose">Graph</span>
          </h2>
          
          <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest mt-1.5 mb-6">
            Organizational Memory Intelligence
          </p>

          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Connect meetings, track overrides, map unresolved debates, and unlock semantic memory search in a modern dashboard designed for high-performance teams.
          </p>

          {/* SVG Rotating Memory Graph Graphic */}
          <div className="relative h-60 w-full border border-white/5 bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden flex items-center justify-center group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070a]/80 via-transparent to-transparent z-10" />
            
            {/* Pulsing Core */}
            <motion.div 
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute h-40 w-40 bg-cyber-purple/10 rounded-full blur-2xl" 
            />

            {/* SVG Interactive Lines & Nodes */}
            <svg width="240" height="200" viewBox="0 0 240 200" className="relative z-20">
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "120px 100px" }}
              >
                {/* Connections */}
                <line x1="120" y1="100" x2="60" y2="60" stroke="rgba(6,182,212,0.3)" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="120" y1="100" x2="180" y2="70" stroke="rgba(168,85,247,0.3)" strokeWidth="1.5" />
                <line x1="120" y1="100" x2="130" y2="160" stroke="rgba(244,63,94,0.3)" strokeWidth="1.5" />
                <line x1="60" y1="60" x2="180" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="180" y1="70" x2="130" y2="160" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="130" y1="160" x2="60" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Nodes */}
                <circle cx="120" cy="100" r="10" fill="url(#coreGradient)" className="filter drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                <circle cx="60" cy="60" r="6" fill="#06b6d4" />
                <circle cx="180" cy="70" r="7" fill="#a855f7" />
                <circle cx="130" cy="160" r="5" fill="#f43f5e" />
              </motion.g>
              
              <defs>
                <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-center text-[10px] font-mono text-gray-500">
              <span>Nodes: 34 Active</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyber-emerald animate-ping" />
                Live Index Sync
              </span>
            </div>
          </div>
        </div>

        {/* Right Hand Visual: Premium Glassmorphic Login Card */}
        <div className="col-span-1 md:col-span-7 flex flex-col justify-center">
          <div className="border border-white/10 bg-white/5 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Top accent glow line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                Enterprise Sandbox Version
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">Access Workspace</h3>
              <p className="text-gray-400 text-sm mt-1">Authenticate using Google Secure SSO or select a developer bypass role below.</p>
            </div>

            {/* Simulated Google Button */}
            <div className="space-y-4">
              <button
                onClick={() => handleSimulatedGoogleLogin()}
                disabled={isSimulatingOAuth}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white font-medium transition-all duration-300 shadow-md group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/10 to-cyber-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <svg className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Sign in with Google SSO</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-xs font-mono uppercase tracking-widest">or developer bypass</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              {/* Seed Profiles Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(SEED_PROFILES).map(([key, profile]) => (
                  <button
                    key={key}
                    onClick={() => handleSimulatedGoogleLogin(key)}
                    disabled={isSimulatingOAuth}
                    className="flex flex-col items-center p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/15 transition-all duration-300 text-center group relative overflow-hidden"
                  >
                    {/* Glowing highlight indicator */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber-purple/10 to-cyber-cyan/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
                    
                    <img 
                      src={profile.avatar} 
                      alt={profile.name}
                      className="h-10 w-10 rounded-xl mb-2 bg-slate-900 border border-white/10 p-0.5" 
                    />
                    <span className="text-xs font-semibold text-white block">{profile.name.split(" ")[0]}</span>
                    <span className="text-[9px] text-gray-500 font-mono mt-0.5 tracking-tighter leading-none">{profile.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Sandbox Guide alert */}
            <div className="mt-8 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-200/80 flex gap-2.5 items-start">
              <AlertCircle className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">FastAPI & SQLite Integrations Active</p>
                <p className="mt-0.5 leading-relaxed text-gray-400">Selecting a bypass role automatically mirrors real database structures and binds decision, task, and contradictions logic directly to that persona.</p>
              </div>
            </div>

            {/* Systems compliance footer */}
            <div className="mt-6 flex items-center justify-between text-[10px] font-mono text-gray-500 border-t border-white/5 pt-4">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-cyber-emerald" />
                TLS 1.3 Encryption Secured
              </span>
              <span>v1.2.6-stable</span>
            </div>
          </div>
        </div>

      </div>

      {/* Authentic Full Screen Loading / Popup Simulation Modal */}
      <AnimatePresence>
        {isSimulatingOAuth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#07070a]/90 backdrop-blur-xl z-50 flex items-center justify-center flex-col p-4"
          >
            {/* Spinning Chrome Sign-in Prompt */}
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-md w-full border border-white/15 bg-[#0f0f15] p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-rose animate-pulse" />
              
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center border border-white/10 shrink-0 shadow-sm">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Google Accounts Sign-In</h4>
                  <p className="text-[10px] text-gray-500 font-mono">accounts.google.com/oauth/signin</p>
                </div>
              </div>

              <div className="space-y-4 py-3 flex flex-col items-center justify-center">
                {/* Dynamic Loader */}
                <div className="relative h-12 w-12 flex items-center justify-center mb-1">
                  <div className="h-10 w-10 rounded-full border-2 border-white/5 border-t-cyber-purple animate-spin" />
                  <div className="absolute h-4 w-4 bg-cyber-cyan rounded-full animate-ping" />
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Connecting Secure Google Session...</p>
                  <p className="text-xs text-gray-400 mt-1">Authorizing MeetGraph memory graph scopes.</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3.5 mt-4 flex justify-between text-[9px] font-mono text-gray-500">
                <span>OAuth Token Exchange</span>
                <span>IP: 127.0.0.1</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
