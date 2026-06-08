"use client";

import React, { useState, useEffect } from "react";
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
  Globe,
  Loader2,
  Clock,
  AlertTriangle,
  User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../components/AuthProvider";
import { getApiBase } from "@/lib/apiClient";

interface AuditLog {
  id?: number;
  user_email?: string;
  action?: string;
  details?: string;
  setting_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by?: string;
  timestamp: string;
}

export default function SettingsHub() {
  const { user, logout, updateUserProfile } = useAuth();

  // Profile states
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateStatus, setProfileUpdateStatus] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [showProfileConfirm, setShowProfileConfirm] = useState(false);

  const [activeTab, setActiveTab] = useState<"general" | "integrations" | "api" | "compliance" | "notifications" | "security">("general");

  // Sync profile state when user object loads/changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
      setProfileRole(user.role || "");
    }
  }, [user]);

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
  const [vectorDb, setVectorDb] = useState("Cloud Search Database");

  // Compliance toggles
  const [tlsSecure, setTlsSecure] = useState(false);
  const [recordIndicator, setRecordIndicator] = useState(true);
  const [autoPurge, setAutoPurge] = useState(false);
  const [purgeAfterDays, setPurgeAfterDays] = useState("Never");

  // Notification checkboxes
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    inapp: true,
    contradictions: true
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings History Audit Logs
  const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);

  // Testing states
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ status: "success" | "error"; message: string } | null>(null);

  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ status: "success" | "error"; message: string } | null>(null);

  // Dynamic URL secure connection mapping
  const getApiUrl = (path: string) => {
    let base = getApiBase();
    const isLocal = base.includes("127.0.0.1:8000") || base.includes("localhost:8000");
    if (isLocal) {
      base = tlsSecure ? base.replace("http://", "https://") : base.replace("https://", "http://");
    }
    return `${base}${path}`;
  };

  // Load settings and history from backend
  const fetchSettings = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(getApiUrl(`/api/users/${encodeURIComponent(user.email)}/settings`));
      if (res.ok) {
        const data = await res.json();
        setIntegrations({
          gmeet: data.gmeet,
          zoom: data.zoom,
          teams: data.teams,
          discord: data.discord
        });
        setOpenaiKey(data.openai_key);
        setPostgresUrl(data.postgres_url);
        setVectorDb(data.vector_db);
        setTlsSecure(data.tls_secure);
        setRecordIndicator(data.record_indicator);
        setAutoPurge(data.auto_purge);
        setPurgeAfterDays(data.purge_after_days);
        setNotifications({
          email: data.notification_email,
          push: data.notification_push,
          inapp: data.notification_inapp,
          contradictions: data.notification_contradictions
        });
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  };

  const fetchHistory = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(getApiUrl(`/api/users/${encodeURIComponent(user.email)}/settings/history`));
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data);
      }
    } catch (e) {
      console.error("Failed to load settings history:", e);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchSettings();
      fetchHistory();
    }
  }, [user?.email, tlsSecure]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      const payload = {
        gmeet: integrations.gmeet,
        zoom: integrations.zoom,
        teams: integrations.teams,
        discord: integrations.discord,
        tls_secure: tlsSecure,
        record_indicator: recordIndicator,
        auto_purge: autoPurge,
        purge_after_days: purgeAfterDays,
        notification_email: notifications.email,
        notification_push: notifications.push,
        notification_inapp: notifications.inapp,
        notification_contradictions: notifications.contradictions,
        openai_key: openaiKey,
        postgres_url: postgresUrl,
        vector_db: vectorDb,
        changed_by: user.name
      };

      const res = await fetch(getApiUrl(`/api/users/${encodeURIComponent(user.email)}/settings`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        fetchSettings();
        fetchHistory();
      } else {
        alert("Failed to save settings.");
      }
    } catch (e) {
      console.error("Error saving settings:", e);
      alert("Error saving settings.");
    }
  };

  const testOpenAiKey = async () => {
    if (!user?.email) return;
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await fetch(getApiUrl(`/api/users/${encodeURIComponent(user.email)}/settings/test-ai`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openai_key: openaiKey })
      });
      const data = await res.json();
      setAiTestResult({
        status: data.status,
        message: data.message
      });
    } catch (e) {
      setAiTestResult({
        status: "error",
        message: "Failed to connect to backend validator."
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  const testDbConnection = async () => {
    if (!user?.email) return;
    setIsTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await fetch(getApiUrl(`/api/users/${encodeURIComponent(user.email)}/settings/test-db`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postgres_url: postgresUrl })
      });
      const data = await res.json();
      setDbTestResult({
        status: data.status,
        message: data.message
      });
    } catch (e) {
      setDbTestResult({
        status: "error",
        message: "Failed to connect to backend validator."
      });
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!user?.email) return;
    if (!confirm("Are you sure you want to restore defaults? All custom settings will be reset.")) return;

    try {
      const res = await fetch(getApiUrl(`/api/users/${encodeURIComponent(user.email)}/settings/reset`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changed_by: user.name })
      });
      if (res.ok) {
        fetchSettings();
        fetchHistory();
        alert("Settings restored to defaults!");
      }
    } catch (e) {
      console.error("Failed to restore defaults:", e);
    }
  };

  const handleExport = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(getApiUrl(`/api/users/${encodeURIComponent(user.email)}/settings/export`));
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `memomind_settings_${user.email.replace("@", "_at_")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Failed to export settings:", e);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.email || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedConfig = JSON.parse(event.target?.result as string);
        const res = await fetch(getApiUrl(`/api/users/${encodeURIComponent(user.email)}/settings/import`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings: importedConfig,
            changed_by: user.name
          })
        });
        if (res.ok) {
          fetchSettings();
          fetchHistory();
          alert("Settings imported successfully!");
        } else {
          alert("Failed to import settings.");
        }
      } catch (err) {
        alert("Invalid settings JSON format.");
      }
    };
    reader.readAsText(file);
  };

  const handleProfileUpdate = async () => {
    setShowProfileConfirm(false);
    setIsUpdatingProfile(true);
    setProfileUpdateStatus(null);
    const emailChanged = profileEmail.toLowerCase() !== (user?.email || "").toLowerCase();
    const result = await updateUserProfile({
      name: profileName,
      email: profileEmail,
      role: profileRole
    });
    setIsUpdatingProfile(false);
    if (result.success) {
      const msg = emailChanged
        ? `✓ Profile updated! Invitation emails will now be sent from ${profileEmail}.`
        : "✓ Profile updated successfully!";
      setProfileUpdateStatus({ status: "success", message: msg });
      setTimeout(() => setProfileUpdateStatus(null), 6000);
    } else {
      setProfileUpdateStatus({ status: "error", message: result.error || "Failed to update profile." });
    }
  };

  const toggleIntegration = (key: keyof typeof integrations) => {
    setIntegrations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-cyber-cyan" /> Settings
          </h2>
          <p className="text-[var(--foreground)]/70 text-sm mt-0.5 font-sans">
            Manage your video meeting integrations, configure AI details, and set privacy preferences.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left & Middle Column: Configuration Blocks */}
        <div className="lg:col-span-2 space-y-6">

          {/* User Profile Details Section */}
          <div className="p-6 border border-[var(--color-obsidian-border)] bg-transparent glass-card rounded-2xl space-y-5">
            <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider font-mono flex items-center gap-2">
              <UserIcon className="h-4.5 w-4.5 text-cyber-cyan animate-pulse" /> User Profile Details
            </h3>
            
            <p className="text-xs text-[var(--foreground)]/70 font-sans">
              Update your workspace user profile details. These changes will reflect across the entire platform.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--foreground)]/70 mb-1.5 font-medium">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--foreground)]/70 mb-1.5 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all font-sans"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--foreground)]/70 mb-1.5 font-medium">Workspace Role</label>
                <input
                  type="text"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className="w-full bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all font-sans"
                  required
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!profileName || !profileEmail || !profileRole) {
                        setProfileUpdateStatus({ status: "error", message: "All fields are required." });
                        return;
                      }
                      setProfileUpdateStatus(null);
                      setShowProfileConfirm(true);
                    }}
                    disabled={isUpdatingProfile}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isUpdatingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Update Profile
                  </button>
                </div>

                {/* Animated status message */}
                <AnimatePresence>
                  {profileUpdateStatus && (
                    <motion.p
                      key="profile-status"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className={`text-xs font-semibold leading-relaxed ${
                        profileUpdateStatus.status === "success" ? "text-cyber-emerald" : "text-cyber-rose"
                      }`}
                    >
                      {profileUpdateStatus.message}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Confirmation Panel */}
                <AnimatePresence>
                  {showProfileConfirm && (
                    <motion.div
                      key="profile-confirm"
                      initial={{ opacity: 0, scale: 0.97, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="p-4 rounded-xl bg-amber-500/[0.07] border border-amber-500/25 space-y-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-amber-400">Confirm Profile Update</p>
                          <p className="text-[10px] text-[var(--foreground)]/60 mt-0.5">
                            These changes will be applied across the entire workspace:
                          </p>
                          <ul className="text-[10px] text-[var(--foreground)]/75 mt-2 space-y-1.5">
                            {profileName !== user?.name && (
                              <li>• Name → <span className="text-cyber-cyan font-mono">{profileName}</span></li>
                            )}
                            {profileEmail.toLowerCase() !== (user?.email || "").toLowerCase() && (
                              <li className="space-y-0.5">
                                <div>• Email → <span className="text-cyber-cyan font-mono">{profileEmail}</span></div>
                                <p className="pl-3 text-[9px] text-amber-400">✉ Invitation emails will be sent from this new address</p>
                              </li>
                            )}
                            {profileRole !== user?.role && (
                              <li>• Role → <span className="text-cyber-cyan font-mono">{profileRole}</span></li>
                            )}
                            {profileName === user?.name &&
                              profileEmail.toLowerCase() === (user?.email || "").toLowerCase() &&
                              profileRole === user?.role && (
                              <li className="text-[var(--foreground)]/40 italic">No changes detected.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowProfileConfirm(false)}
                          className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg border border-[var(--color-obsidian-border)] text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleProfileUpdate}
                          disabled={isUpdatingProfile}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] rounded-lg text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isUpdatingProfile && <Loader2 className="h-3 w-3 animate-spin" />}
                          Yes, Update Profile
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Section 1: Integrations */}
          <div className="p-6 border border-[var(--color-obsidian-border)] bg-transparent glass-card rounded-2xl space-y-5">
            <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-cyber-purple animate-pulse" /> Integrations
            </h3>
            
            <p className="text-xs text-[var(--foreground)]/70">
              Authorize the assistant to observe meetings on these platforms.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Google Meet */}
              <div className="p-4 rounded-xl bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] hover:border-cyber-cyan/20 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center shrink-0">
                    <Video className="h-5 w-5 text-cyber-cyan" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--foreground)] font-sans">Google Meet</h4>
                    <p className="text-[10px] text-[var(--foreground)]/50 font-sans">Active Listener</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleIntegration("gmeet")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer ${
                    integrations.gmeet ? "bg-cyber-cyan" : "bg-[var(--foreground)]/[0.10]"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white shadow-md block transition-transform ${
                    integrations.gmeet ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Zoom Meetings */}
              <div className="p-4 rounded-xl bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] hover:border-cyber-purple/20 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center shrink-0">
                    <Video className="h-5 w-5 text-cyber-purple" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--foreground)] font-sans">Zoom</h4>
                    <p className="text-[10px] text-[var(--foreground)]/50 font-sans">Official API Connector</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleIntegration("zoom")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer ${
                    integrations.zoom ? "bg-cyber-purple" : "bg-[var(--foreground)]/[0.10]"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white shadow-md block transition-transform ${
                    integrations.zoom ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Discord App */}
              <div className="p-4 rounded-xl bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] hover:border-cyber-rose/20 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyber-rose/10 border border-cyber-rose/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-cyber-rose" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--foreground)] font-sans">Discord</h4>
                    <p className="text-[10px] text-[var(--foreground)]/50 font-sans">Voice Bot Connector</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleIntegration("discord")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer ${
                    integrations.discord ? "bg-cyber-rose" : "bg-[var(--foreground)]/[0.10]"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white shadow-md block transition-transform ${
                    integrations.discord ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* MS Teams */}
              <div className="p-4 rounded-xl bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] hover:border-blue-500/20 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Tv className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--foreground)] font-sans">Microsoft Teams</h4>
                    <p className="text-[10px] text-[var(--foreground)]/50 font-sans">Official Media Stream</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleIntegration("teams")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer ${
                    integrations.teams ? "bg-blue-500" : "bg-[var(--foreground)]/[0.10]"
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
          <div className="p-6 border border-[var(--color-obsidian-border)] bg-transparent glass-card rounded-2xl space-y-5">
            <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider font-mono flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-cyber-cyan" /> AI Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--foreground)]/70 mb-1.5 font-medium">AI Provider Key</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="flex-1 bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={testOpenAiKey}
                    disabled={isTestingAi}
                    className="px-4 py-2.5 bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] hover:border-cyber-cyan/50 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    {isTestingAi && <Loader2 className="h-3 w-3 animate-spin" />}
                    Test Key
                  </button>
                </div>
                {aiTestResult && (
                  <p className={`text-[10px] mt-1.5 font-semibold ${aiTestResult.status === "success" ? "text-cyber-emerald" : "text-cyber-rose"}`}>
                    {aiTestResult.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-[var(--foreground)]/70 mb-1.5 font-medium">Database Connection String</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={postgresUrl}
                    onChange={(e) => setPostgresUrl(e.target.value)}
                    className="flex-1 bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={testDbConnection}
                    disabled={isTestingDb}
                    className="px-4 py-2.5 bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] hover:border-cyber-cyan/50 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    {isTestingDb && <Loader2 className="h-3 w-3 animate-spin" />}
                    Test Connection
                  </button>
                </div>
                {dbTestResult && (
                  <p className={`text-[10px] mt-1.5 font-semibold ${dbTestResult.status === "success" ? "text-cyber-emerald" : "text-cyber-rose"}`}>
                    {dbTestResult.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-[var(--foreground)]/70 mb-1.5 font-medium">Search Engine Model</label>
                <select
                  value={vectorDb}
                  onChange={(e) => setVectorDb(e.target.value)}
                  className="w-full bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-cyber-purple transition-all cursor-pointer font-sans"
                >
                  <option value="Cloud Search Database">Cloud Search Database</option>
                  <option value="Vector Search">Vector Search</option>
                  <option value="Hybrid Search">Hybrid Search</option>
                  <option value="Semantic Search">Semantic Search</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Security, Notifications & CTA */}
        <div className="space-y-6 col-span-1">
          
          {/* Security & Isolation */}
          <div className="p-6 border border-[var(--color-obsidian-border)] bg-transparent glass-card rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-cyber-rose animate-pulse" /> Security & Privacy
            </h3>

            <div className="space-y-3.5 pt-2">
              {/* TLS toggle */}
              <label className="flex items-start justify-between cursor-pointer group">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-cyber-cyan transition-colors font-sans">Enforce Secure Connection</span>
                  <p className="text-[9px] text-[var(--foreground)]/50 font-sans leading-relaxed">Encrypts your meeting records in transit.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTlsSecure(!tlsSecure)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 focus:outline-none p-0.5 cursor-pointer ${
                    tlsSecure ? "bg-cyber-cyan" : "bg-[var(--foreground)]/[0.10]"
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
                  <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-cyber-cyan transition-colors font-sans">Show Recording Alert</span>
                  <p className="text-[9px] text-[var(--foreground)]/50 font-sans leading-relaxed">Notify participants that the meeting assistant is active.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRecordIndicator(!recordIndicator)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 focus:outline-none p-0.5 cursor-pointer ${
                    recordIndicator ? "bg-cyber-cyan" : "bg-[var(--foreground)]/[0.10]"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white shadow-md block transition-transform ${
                    recordIndicator ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </label>

              {/* Auto purge */}
              <div className="space-y-3">
                <label className="flex items-start justify-between cursor-pointer group">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-cyber-cyan transition-colors font-sans">Auto-Delete Audio Files</span>
                    <p className="text-[9px] text-[var(--foreground)]/50 font-sans leading-relaxed">Remove raw audio recordings once the transcript is processed.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoPurge(!autoPurge)}
                    className={`w-9 h-5 rounded-full transition-colors relative shrink-0 focus:outline-none p-0.5 cursor-pointer ${
                      autoPurge ? "bg-cyber-cyan" : "bg-[var(--foreground)]/[0.10]"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white shadow-md block transition-transform ${
                      autoPurge ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </label>

                {autoPurge && (
                  <div className="pl-2 space-y-1.5 animate-fadeIn">
                    <label className="block text-[10px] text-[var(--foreground)]/70 font-medium font-sans">Delete after</label>
                    <select
                      value={purgeAfterDays}
                      onChange={(e) => setPurgeAfterDays(e.target.value)}
                      className="w-full bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-cyber-purple transition-all cursor-pointer font-sans"
                    >
                      <option value="1">1 day</option>
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="Never">Never</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notifications config */}
          <div className="p-6 border border-[var(--color-obsidian-border)] bg-transparent glass-card rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider font-mono flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-amber-400" /> Notification Preferences
            </h3>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                  className="rounded bg-black/45 border-[var(--color-obsidian-border)] text-cyber-purple focus:ring-cyber-purple/20 shrink-0 h-4.5 w-4.5 cursor-pointer"
                />
                <span className="text-xs text-[var(--foreground)]/80 group-hover:text-[var(--foreground)] transition-colors">Email me before a task is due</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                  className="rounded bg-black/45 border-[var(--color-obsidian-border)] text-cyber-purple focus:ring-cyber-purple/20 shrink-0 h-4.5 w-4.5 cursor-pointer"
                />
                <span className="text-xs text-[var(--foreground)]/80 group-hover:text-[var(--foreground)] transition-colors">Browser alerts</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notifications.inapp}
                  onChange={() => setNotifications(prev => ({ ...prev, inapp: !prev.inapp }))}
                  className="rounded bg-black/45 border-[var(--color-obsidian-border)] text-cyber-purple focus:ring-cyber-purple/20 shrink-0 h-4.5 w-4.5 cursor-pointer"
                />
                <span className="text-xs text-[var(--foreground)]/80 group-hover:text-[var(--foreground)] transition-colors">Alerts in workspace app</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notifications.contradictions}
                  onChange={() => setNotifications(prev => ({ ...prev, contradictions: !prev.contradictions }))}
                  className="rounded bg-black/45 border-[var(--color-obsidian-border)] text-cyber-purple focus:ring-cyber-purple/20 shrink-0 h-4.5 w-4.5 cursor-pointer"
                />
                <span className="text-xs text-[var(--foreground)]/80 group-hover:text-[var(--foreground)] transition-colors">Alert me if new decisions conflict with past plans</span>
              </label>
            </div>
          </div>

          {/* Save Configuration Button */}
          <div className="space-y-3.5">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] rounded-xl text-[var(--foreground)] font-bold text-xs uppercase tracking-wider transition-all duration-300 relative overflow-hidden cursor-pointer"
            >
              <span>Save Settings</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="py-2 bg-black/30 border border-[var(--color-obsidian-border)] hover:border-cyber-rose/35 text-[9px] font-bold font-mono text-[var(--foreground)]/70 hover:text-cyber-rose rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="py-2 bg-black/30 border border-[var(--color-obsidian-border)] hover:border-cyber-cyan/35 text-[9px] font-bold font-mono text-[var(--foreground)]/70 hover:text-cyber-cyan rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider"
              >
                Export
              </button>
              <label
                className="py-2 bg-black/30 border border-[var(--color-obsidian-border)] hover:border-cyber-purple/35 text-[9px] font-bold font-mono text-[var(--foreground)]/70 hover:text-cyber-purple rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider"
              >
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

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

      {/* Settings History Audit Log */}
      <div className="p-6 border border-[var(--color-obsidian-border)] bg-transparent glass-card rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider font-mono flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-cyber-cyan animate-pulse" /> Settings Activity & Audit Log
        </h3>
        
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {historyLogs.length > 0 ? (
            historyLogs.map((log) => (
              <div key={log.id} className="p-3 bg-black/25 border border-[var(--color-obsidian-border)] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-[var(--foreground)] font-mono uppercase text-[9px] px-1.5 py-0.5 bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/20 rounded mr-2">
                    {log.setting_name}
                  </span>
                  <span className="text-[var(--foreground)]/80">
                    Changed: <span className="font-mono text-cyber-rose line-through">{log.old_value || "None"}</span> → <span className="font-mono text-cyber-emerald">{log.new_value || "None"}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--foreground)]/50 font-mono self-end md:self-auto">
                  <span>Modified by: {log.changed_by}</span>
                  <span>•</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[var(--foreground)]/50 font-mono text-center py-4">No settings modifications recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
