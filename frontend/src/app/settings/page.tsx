"use client";

import React, { useState } from "react";
import { 
  Settings, 
  Layers, 
  Key, 
  ShieldCheck, 
  Bell, 
  Check, 
  Sparkles, 
  Tv, 
  Video, 
  MessageSquare,
  Lock,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


export default function SettingsHub() {
  // Integration States
  const [integrations, setIntegrations] = useState({
    gmeet: true,
    zoom: false,
    teams: false,
    discord: true
  });

  // API Config states
  const [openaiKey, setOpenaiKey] = useState("sk-proj-••••••••••••••••••••");
  const [postgresUrl, setPostgresUrl] = useState("postgresql://reeti:••••••••@ep-MemoMind-db.us-east.aws.neon.tech/MemoMind");
  const [vectorDb, setVectorDb] = useState("Pinecone Remote Cloud");

  // Compliance toggles
  const [tlsSecure, setTlsSecure] = useState(true);
  const [recordIndicator, setRecordIndicator] = useState(true);
  const [autoPurge, setAutoPurge] = useState(false);

  // Notification checkboxes
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    inapp: true,
    contradictions: true
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const toggleIntegration = (key: keyof typeof integrations) => {
    setIntegrations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-cyber-cyan" /> Settings
          </h2>
          <p className="text-gray-400 text-sm mt-0.5 font-sans">
            Manage your video meeting integrations, configure AI details, and set privacy preferences.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left & Middle Column: Configuration Blocks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Integrations */}
          <div className="p-6 border border-white/5 bg-transparent glass-card rounded-2xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-cyber-purple animate-pulse" /> Integrations
            </h3>
            
            <p className="text-xs text-gray-400">
              Authorize the assistant to observe meetings on these platforms.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Google Meet */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyber-cyan/20 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center shrink-0">
                    <Video className="h-5 w-5 text-cyber-cyan" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-sans">Google Meet</h4>
                    <p className="text-[10px] text-gray-500 font-sans">Active Listener</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleIntegration("gmeet")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer ${
                    integrations.gmeet ? "bg-cyber-cyan" : "bg-white/10"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white shadow-md block transition-transform ${
                    integrations.gmeet ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Zoom Meetings */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyber-purple/20 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center shrink-0">
                    <Video className="h-5 w-5 text-cyber-purple" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-sans">Zoom</h4>
                    <p className="text-[10px] text-gray-500 font-sans">Official API Connector</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleIntegration("zoom")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer ${
                    integrations.zoom ? "bg-cyber-purple" : "bg-white/10"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white shadow-md block transition-transform ${
                    integrations.zoom ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Discord App */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyber-rose/20 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyber-rose/10 border border-cyber-rose/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-cyber-rose" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-sans">Discord</h4>
                    <p className="text-[10px] text-gray-500 font-sans">Voice Bot Connector</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleIntegration("discord")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer ${
                    integrations.discord ? "bg-cyber-rose" : "bg-white/10"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white shadow-md block transition-transform ${
                    integrations.discord ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* MS Teams */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Tv className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-sans">Microsoft Teams</h4>
                    <p className="text-[10px] text-gray-500 font-sans">Official Media Stream</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleIntegration("teams")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer ${
                    integrations.teams ? "bg-blue-500" : "bg-white/10"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white shadow-md block transition-transform ${
                    integrations.teams ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

            </div>
          </div>

          {/* Section 2: AI & Database Keys */}
          <div className="p-6 border border-white/5 bg-transparent glass-card rounded-2xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-cyber-cyan" /> AI Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">AI Provider Key</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full bg-black/45 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Database Connection String</label>
                <input
                  type="text"
                  value={postgresUrl}
                  onChange={(e) => setPostgresUrl(e.target.value)}
                  className="w-full bg-black/45 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Search Engine Model</label>
                <select
                  value={vectorDb}
                  onChange={(e) => setVectorDb(e.target.value)}
                  className="w-full bg-black/45 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyber-purple transition-all cursor-pointer"
                >
                  <option value="Pinecone Remote Cloud">Cloud Search Database</option>
                  <option value="Local ChromaDB Cluster">Local Search Database</option>
                  <option value="PGVector PostgreSQL">Integrated Database Search</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Security, Notifications & CTA */}
        <div className="space-y-6 col-span-1">
          
          {/* Security & Isolation */}
          <div className="p-6 border border-white/5 bg-transparent glass-card rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-cyber-rose animate-pulse" /> Security & Privacy
            </h3>

            <div className="space-y-3.5 pt-2">
              {/* TLS toggle */}
              <label className="flex items-start justify-between cursor-pointer group">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-white group-hover:text-cyber-cyan transition-colors font-sans">Enforce Secure Connection</span>
                  <p className="text-[9px] text-gray-500 font-sans leading-relaxed">Encrypts your meeting records in transit.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTlsSecure(!tlsSecure)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 focus:outline-none p-0.5 cursor-pointer ${
                    tlsSecure ? "bg-cyber-cyan" : "bg-white/10"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white shadow-md block transition-transform ${
                    tlsSecure ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </label>

              {/* Record Indicator */}
              <label className="flex items-start justify-between cursor-pointer group">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-white group-hover:text-cyber-cyan transition-colors font-sans">Show Recording Alert</span>
                  <p className="text-[9px] text-gray-500 font-sans leading-relaxed">Notify participants that the meeting assistant is active.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRecordIndicator(!recordIndicator)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 focus:outline-none p-0.5 cursor-pointer ${
                    recordIndicator ? "bg-cyber-cyan" : "bg-white/10"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white shadow-md block transition-transform ${
                    recordIndicator ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </label>

              {/* Auto purge */}
              <label className="flex items-start justify-between cursor-pointer group">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-white group-hover:text-cyber-cyan transition-colors font-sans">Auto-Delete Audio Files</span>
                  <p className="text-[9px] text-gray-500 font-sans leading-relaxed">Remove raw audio recordings once the transcript is processed.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoPurge(!autoPurge)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 focus:outline-none p-0.5 cursor-pointer ${
                    autoPurge ? "bg-cyber-cyan" : "bg-white/10"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white shadow-md block transition-transform ${
                    autoPurge ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </label>
            </div>
          </div>

          {/* Notifications config */}
          <div className="p-6 border border-white/5 bg-transparent glass-card rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-amber-400" /> Notification Preferences
            </h3>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                  className="rounded bg-black/45 border-white/10 text-cyber-purple focus:ring-cyber-purple/20 shrink-0 h-4.5 w-4.5 cursor-pointer"
                />
                <span className="text-xs text-gray-300 group-hover:text-white transition-colors">Email me before a task is due</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                  className="rounded bg-black/45 border-white/10 text-cyber-purple focus:ring-cyber-purple/20 shrink-0 h-4.5 w-4.5 cursor-pointer"
                />
                <span className="text-xs text-gray-300 group-hover:text-white transition-colors">Browser alerts</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notifications.inapp}
                  onChange={() => setNotifications(prev => ({ ...prev, inapp: !prev.inapp }))}
                  className="rounded bg-black/45 border-white/10 text-cyber-purple focus:ring-cyber-purple/20 shrink-0 h-4.5 w-4.5 cursor-pointer"
                />
                <span className="text-xs text-gray-300 group-hover:text-white transition-colors">Alerts in workspace app</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notifications.contradictions}
                  onChange={() => setNotifications(prev => ({ ...prev, contradictions: !prev.contradictions }))}
                  className="rounded bg-black/45 border-white/10 text-cyber-purple focus:ring-cyber-purple/20 shrink-0 h-4.5 w-4.5 cursor-pointer"
                />
                <span className="text-xs text-gray-300 group-hover:text-white transition-colors">Alert me if new decisions conflict with past plans</span>
              </label>
            </div>
          </div>

          {/* Save Configuration Button */}
          <div className="space-y-3.5">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 relative overflow-hidden cursor-pointer"
            >
              <span>Save Settings</span>
            </button>

            <AnimatePresence>
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-3 bg-cyber-emerald/10 border border-cyber-emerald/20 rounded-xl flex items-center justify-center gap-2 text-xs text-cyber-emerald font-semibold"
                >
                  <Check className="h-4.5 w-4.5" /> Settings saved successfully!
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </form>
    </div>
  );
}
