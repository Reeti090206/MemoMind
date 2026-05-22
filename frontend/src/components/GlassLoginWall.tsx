"use client";

import React, { useState, useEffect } from "react";
import { useAuth, SEED_PROFILES, UserProfile } from "./AuthProvider";
import { 
  Network, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  UserPlus, 
  LogIn, 
  KeyRound, 
  CheckCircle2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlassLoginWall() {
  const { loginWithGoogle, loginWithCredentials, signUpWithCredentials } = useAuth();
  
  // Navigation Flow: initial -> login | signup
  const [flowStep, setFlowStep] = useState<"initial" | "login" | "signup" | "forgot_password">("initial");
  
  // Google Native Chooser States
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleChooserStep, setGoogleChooserStep] = useState<"choose" | "enter_email" | "enter_password">("choose");
  const [googleNameInput, setGoogleNameInput] = useState("");
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googlePasswordInput, setGooglePasswordInput] = useState("");
  const [googleError, setGoogleError] = useState("");
  
  // OAuth process indicators
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [selectedOAuthUser, setSelectedOAuthUser] = useState<UserProfile | null>(null);

  // Custom Registered Accounts list for chooser
  const [customRegisteredAccounts, setCustomRegisteredAccounts] = useState<UserProfile[]>([]);

  // Login credentials state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Signup credentials state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [forgotError, setForgotError] = useState("");

  // Load custom accounts from localStorage for suggestion
  useEffect(() => {
    try {
      const registeredStr = localStorage.getItem("meetgraph_registered_users");
      if (registeredStr) {
        const parsed = JSON.parse(registeredStr);
        const accountsList = Object.values(parsed) as UserProfile[];
        setCustomRegisteredAccounts(accountsList);
      }
    } catch (e) {
      console.error("Failed to load registered users", e);
    }
  }, [flowStep, showGoogleChooser]);

  // Google SSO simulated choice flow
  const handleGoogleChooserSelect = async (profileKey?: string, customUser?: UserProfile) => {
    setShowGoogleChooser(false);
    setIsAuthorizing(true);
    
    let targetProfile: UserProfile | null = null;
    if (profileKey && SEED_PROFILES[profileKey]) {
      targetProfile = SEED_PROFILES[profileKey];
    } else if (customUser) {
      targetProfile = customUser;
    } else {
      targetProfile = {
        name: "Developer Guest",
        email: "guest.developer@meetgraph.ai",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Guest",
        role: "Workspace Administrator",
        color: "from-gray-400 to-slate-600",
      };
    }
    
    setSelectedOAuthUser(targetProfile);
    
    // Simulate token exchange delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await loginWithGoogle(profileKey, targetProfile || undefined);
    setIsAuthorizing(false);
  };

  // Google Custom "Use another account" email submission
  const handleGoogleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError("");
    if (!googleNameInput.trim()) {
      setGoogleError("Enter your name");
      return;
    }
    if (!googleEmailInput) {
      setGoogleError("Enter an email or phone number");
      return;
    }
    if (!googleEmailInput.includes("@")) {
      setGoogleError("Enter a valid email address");
      return;
    }
    setGoogleChooserStep("enter_password");
  };

  // Google Custom password submission
  const handleGooglePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError("");
    if (!googlePasswordInput) {
      setGoogleError("Enter a password");
      return;
    }

    setIsAuthorizing(true);
    setShowGoogleChooser(false);

    // Dynamic provision/load user
    const emailKey = googleEmailInput.toLowerCase().trim();
    const namePart = googleEmailInput.split("@")[0];
    const targetName = googleNameInput.trim() || (namePart.charAt(0).toUpperCase() + namePart.slice(1));

    const targetProfile: UserProfile = {
      name: targetName,
      email: emailKey,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(targetName)}`,
      role: "Workspace Contributor",
      color: "from-cyber-cyan to-cyber-purple",
    };

    setSelectedOAuthUser(targetProfile);

    // Save as registered custom user in database so it shows up in future suggests!
    try {
      const registeredStr = localStorage.getItem("meetgraph_registered_users");
      let registeredUsers = registeredStr ? JSON.parse(registeredStr) : {};
      
      // Only register if doesn't exist
      if (!registeredUsers[emailKey] && !["aman.g@meetgraph.ai", "reeti.s@meetgraph.ai", "sarah.j@meetgraph.ai"].includes(emailKey)) {
        registeredUsers[emailKey] = {
          ...targetProfile,
          password: googlePasswordInput
        };
        localStorage.setItem("meetgraph_registered_users", JSON.stringify(registeredUsers));
      }
    } catch (err) {
      console.error(err);
    }

    // Auth Delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Perform standard login simulation with custom profile
    await loginWithGoogle(undefined, targetProfile);
    
    setIsAuthorizing(false);
  };

  // Custom Form Login
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter both your email address and password.");
      return;
    }

    setIsLoggingIn(true);
    const result = await loginWithCredentials(loginEmail, loginPassword);
    setIsLoggingIn(false);

    if (!result.success) {
      setLoginError(result.error || "Authentication failed.");
    }
  };

  // Custom Form Signup
  const handleCredentialsSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      setSignupError("Please fill out all input fields.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match. Please double check.");
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters long.");
      return;
    }

    setIsSigningUp(true);
    const result = await signUpWithCredentials(signupName, signupEmail, signupPassword);
    setIsSigningUp(false);

    if (!result.success) {
      setSignupError(result.error || "Failed to create account.");
    }
  };

  // Forgot password flow
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotEmail) {
      setForgotError("Please enter your email address to continue.");
      return;
    }

    setForgotStatus("sending");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setForgotStatus("sent");
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-transparent text-white flex items-center justify-center overflow-hidden z-50">
      {/* Subtle background ambient overlay to boost readability */}
      <div className="absolute inset-0 bg-[#020204]/40 backdrop-blur-[2px]" />

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
            Memory Intelligence
          </p>

          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            We capture your meetings, track decisions, and organize task lists automatically, so your team stays perfectly in sync without extra typing.
          </p>

          {/* SVG Rotating Memory Graph Graphic */}
          <div className="relative h-60 w-full border border-white/5 bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden flex items-center justify-center group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#020204]/80 via-transparent to-transparent z-10" />
            
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
                <span className="h-1.5 w-1.5 rounded-full bg-cyber-emerald opacity-75" />
                Live Index Sync
              </span>
            </div>
          </div>
        </div>

        {/* Right Hand Visual: Premium Glassmorphic Card Container */}
        <div className="col-span-1 md:col-span-7 flex flex-col justify-center">
          <div className="border border-white/5 bg-white/[0.02] backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[500px] flex flex-col justify-between">
            {/* Top accent glow line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Render different cards dynamically based on flowStep */}
            <AnimatePresence mode="wait">
              
              {/* STEP 1: INITIAL QUESTION WORKSPACE QUESTION */}
              {flowStep === "initial" && (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col justify-between h-full flex-grow"
                >
                  <div>
                    <div className="mb-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple mb-3">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        Workspace Setup
                      </span>
                      <h3 className="text-2xl font-bold text-white tracking-tight">Do you already have an account?</h3>
                      <p className="text-gray-400 text-sm mt-1">Please select an option below to guide your experience.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      {/* OPTION A: Already Registered */}
                      <button
                        onClick={() => setFlowStep("login")}
                        className="group flex flex-col text-left p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-cyber-purple/30 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-cyber-purple/10 to-cyber-cyan/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
                        <div className="h-9 w-9 rounded-xl bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <LogIn className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-white block">Yes, I have an account</span>
                        <span className="text-xs text-gray-400 mt-2 leading-relaxed">Sign in with Google SSO, sandbox seeds, or your personal credentials.</span>
                        <div className="mt-4 flex items-center gap-1.5 text-xs text-cyber-purple font-semibold group-hover:translate-x-1 transition-transform">
                          Access Workspace <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </button>

                      {/* OPTION B: New User Registration */}
                      <button
                        onClick={() => setFlowStep("signup")}
                        className="group flex flex-col text-left p-5 rounded-2xl border border-white/5 bg-cyber-cyan/5 hover:bg-white/10 hover:border-cyber-cyan/30 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-cyber-cyan/10 to-cyber-purple/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
                        <div className="h-9 w-9 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <UserPlus className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-white block">No, I am new here</span>
                        <span className="text-xs text-gray-400 mt-2 leading-relaxed">Create a brand new profile and configure your local team assistant nodes.</span>
                        <div className="mt-4 flex items-center gap-1.5 text-xs text-cyber-cyan font-semibold group-hover:translate-x-1 transition-transform">
                          Register Account <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Seed Sandbox bypass indicator (maintained for rapid developer entry) */}
                  <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="font-mono">Local Host Safe Environment</span>
                    <button 
                      onClick={() => setFlowStep("login")}
                      className="text-cyber-purple hover:underline font-semibold"
                    >
                      Quick Developer Bypass &rarr;
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: DYNAMIC LOGIN WORKSPACE CARD */}
              {flowStep === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col h-full flex-grow"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <button 
                      onClick={() => setFlowStep("initial")}
                      className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-400 font-mono">Back to choices</span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Access Workspace</h3>
                    <p className="text-gray-400 text-xs mt-1">Sign in with Google SSO or custom credentials.</p>
                  </div>

                  {/* Standardized Form + Google login */}
                  <form onSubmit={handleCredentialsLogin} className="space-y-4">
                    {loginError && (
                      <div className="p-3 rounded-xl bg-cyber-rose/5 border border-cyber-rose/15 text-xs text-cyber-rose flex items-start gap-2.5">
                        <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                        <input
                          type="email"
                          placeholder="e.g. reeti.s@meetgraph.ai"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full bg-black/45 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-purple font-sans"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block">Password</label>
                        <button
                          type="button"
                          onClick={() => setFlowStep("forgot_password")}
                          className="text-[10px] text-cyber-purple hover:underline font-mono"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-black/45 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-purple font-sans"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:brightness-110 active:scale-[0.98] text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyber-purple/20"
                    >
                      {isLoggingIn ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                          <span>Checking Identity...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="h-4.5 w-4.5" />
                          <span>Yes, Sign In</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Or divider */}
                  <div className="relative flex py-4 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-gray-600 text-[9px] font-mono uppercase tracking-widest">or sign in with</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  {/* Simulated Google Button */}
                  <button
                    onClick={() => {
                      setGoogleChooserStep("choose");
                      setGoogleError("");
                      setGoogleEmailInput("");
                      setGooglePasswordInput("");
                      setShowGoogleChooser(true);
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white text-xs font-semibold transition-all duration-300 shadow-md group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/5 to-cyber-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <svg className="h-4.5 w-4.5 group-hover:scale-110 transition-transform duration-300 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Login with Google Account SSO</span>
                  </button>
                </motion.div>
              )}

              {/* STEP 3: DYNAMIC SIGNUP REGISTRATION CARD */}
              {flowStep === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col h-full flex-grow"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <button 
                      onClick={() => setFlowStep("initial")}
                      className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-400 font-mono">Back to choices</span>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Create Account</h3>
                    <p className="text-gray-400 text-xs mt-1">Register a new profile to configure your workspace node.</p>
                  </div>

                  <form onSubmit={handleCredentialsSignup} className="space-y-3">
                    {signupError && (
                      <div className="p-2.5 rounded-xl bg-cyber-rose/5 border border-cyber-rose/15 text-xs text-cyber-rose flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{signupError}</span>
                      </div>
                    )}

                    {/* Name Input */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-gray-500 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="e.g. Elena Rostova"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className="w-full bg-black/45 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-cyber-cyan font-sans"
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-gray-500 block">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <input
                          type="email"
                          placeholder="e.g. elena.r@meetgraph.ai"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full bg-black/45 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-cyber-cyan font-sans"
                        />
                      </div>
                    </div>

                    {/* Password Fields in a row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-gray-500 block">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <input
                            type="password"
                            placeholder="••••••"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="w-full bg-black/45 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-cyber-cyan font-sans"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-gray-500 block">Confirm</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <input
                            type="password"
                            placeholder="••••••"
                            value={signupConfirmPassword}
                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                            className="w-full bg-black/45 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-cyber-cyan font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Register Button */}
                    <button
                      type="submit"
                      disabled={isSigningUp}
                      className="w-full bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:brightness-110 active:scale-[0.98] text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyber-cyan/20 mt-4"
                    >
                      {isSigningUp ? (
                        <>
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                          <span>Provisioning Profile...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          <span>Register New Profile</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 4: DYNAMIC FORGOT PASSWORD RECOVERY CARD */}
              {flowStep === "forgot_password" && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col h-full flex-grow"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <button 
                      onClick={() => setFlowStep("login")}
                      className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-400 font-mono">Back to Sign In</span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Recover Password</h3>
                    <p className="text-gray-400 text-xs mt-1">We will send a secure bypass token to restore your session.</p>
                  </div>

                  {forgotStatus === "sent" ? (
                    <div className="p-6 rounded-2xl bg-cyber-emerald/5 border border-cyber-emerald/15 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="h-12 w-12 rounded-full bg-cyber-emerald/10 border border-cyber-emerald/20 flex items-center justify-center text-cyber-emerald animate-bounce">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Recovery Token Dispatched</h4>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                          A local session override link was sent to <strong className="text-cyber-cyan">{forgotEmail}</strong>. Select the link to automatically log back in.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setForgotStatus("idle");
                          setFlowStep("login");
                        }}
                        className="mt-2 text-xs text-cyber-purple font-semibold hover:underline"
                      >
                        Return to login form &rarr;
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      {forgotError && (
                        <div className="p-3 rounded-xl bg-cyber-rose/5 border border-cyber-rose/15 text-xs text-cyber-rose flex items-start gap-2.5">
                          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                          <span>{forgotError}</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block">Registered Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                          <input
                            type="email"
                            placeholder="e.g. reeti.s@meetgraph.ai"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full bg-black/45 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-650 focus:outline-none focus:border-cyber-purple font-sans"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotStatus === "sending"}
                        className="w-full bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:brightness-110 active:scale-[0.98] text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyber-purple/20"
                      >
                        {forgotStatus === "sending" ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                            <span>Locating account records...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="h-4.5 w-4.5" />
                            <span>Request Recovery Link</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

            {/* Systems compliance footer */}
            <div className="mt-8 flex items-center justify-between text-[9px] font-mono text-gray-500 border-t border-white/5 pt-4">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-cyber-emerald" />
                TLS 1.3 Encryption Secured
              </span>
              <span>v1.2.6-stable</span>
            </div>
          </div>
        </div>

      </div>

      {/* DYNAMIC HIGH-FIDELITY NATIVE GOOGLE ACCOUNT CHOOSER WINDOW */}
      <AnimatePresence>
        {showGoogleChooser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020204]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="max-w-[440px] w-full bg-[#1e1e1e] rounded-lg border border-white/10 px-8 py-10 shadow-2xl relative flex flex-col justify-between min-h-[500px]"
            >
              {/* Google Brand Logo */}
              <div className="flex flex-col items-center text-center">
                <svg className="h-8 w-8 mb-4 shrink-0" viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>

                {/* Subheadings dynamically changed based on OAuth choose step */}
                <AnimatePresence mode="wait">
                  
                  {googleChooserStep === "choose" && (
                    <motion.div
                      key="choose-head"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="w-full"
                    >
                      <h4 className="text-xl text-white font-medium tracking-tight">Choose an account</h4>
                      <p className="text-gray-300 text-sm mt-1 mb-6">to continue to <span className="text-cyber-cyan font-bold">MeetGraph AI</span></p>
                      
                      {/* Chooser account listings */}
                      <div className="space-y-0.5 border-y border-white/10 py-1.5 w-full text-left max-h-[220px] overflow-y-auto pr-1">
                        
                        {/* SEEDS */}
                        {Object.entries(SEED_PROFILES).map(([key, profile]) => (
                          <button
                            key={key}
                            onClick={() => handleGoogleChooserSelect(key)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 active:bg-white/10 rounded-md transition-colors"
                          >
                            <img
                              src={profile.avatar}
                              alt={profile.name}
                              className="h-8 w-8 rounded-full bg-slate-900 border border-white/10 p-0.5 shrink-0"
                            />
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-white block leading-tight">{profile.name}</span>
                              <span className="text-[11px] text-gray-400 block truncate mt-0.5">{profile.email}</span>
                            </div>
                          </button>
                        ))}

                        {/* CUSTOM REGISTERED */}
                        {customRegisteredAccounts.map((acc, idx) => (
                          <button
                            key={`custom-${idx}`}
                            onClick={() => handleGoogleChooserSelect(undefined, acc)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 active:bg-white/10 rounded-md transition-colors"
                          >
                            <img
                              src={acc.avatar}
                              alt={acc.name}
                              className="h-8 w-8 rounded-full bg-slate-900 border border-white/10 p-0.5 shrink-0"
                            />
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-white block leading-tight">{acc.name}</span>
                              <span className="text-[11px] text-gray-400 block truncate mt-0.5">{acc.email}</span>
                            </div>
                          </button>
                        ))}

                        {/* USE ANOTHER ACCOUNT BUTTON */}
                        <button
                          onClick={() => {
                            setGoogleError("");
                            setGoogleEmailInput("");
                            setGoogleChooserStep("enter_email");
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 active:bg-white/10 rounded-md transition-colors border-t border-white/5 mt-1"
                        >
                          <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-350 shrink-0">
                            <User className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-250 block">Use another account</span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {googleChooserStep === "enter_email" && (
                    <motion.div
                      key="email-head"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="w-full text-left mt-2"
                    >
                      <h4 className="text-xl text-white font-medium text-center">Sign in</h4>
                      <p className="text-gray-300 text-xs text-center mt-1 mb-8">with your Google Account to continue to MeetGraph</p>

                      <form onSubmit={handleGoogleEmailSubmit} className="space-y-6">
                        {googleError && (
                          <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{googleError}</span>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="Full name"
                              value={googleNameInput}
                              onChange={(e) => setGoogleNameInput(e.target.value)}
                              className="w-full bg-[#121212] border border-white/15 rounded-md px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-sans"
                              autoFocus
                            />
                          </div>

                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="Email or phone number"
                              value={googleEmailInput}
                              onChange={(e) => setGoogleEmailInput(e.target.value)}
                              className="w-full bg-[#121212] border border-white/15 rounded-md px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-sans"
                            />
                            <button 
                              type="button"
                              className="text-xs text-blue-400 hover:text-blue-300 font-semibold mt-2 block"
                            >
                              Forgot email?
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Not your computer? Use Guest mode to sign in privately. <span className="text-blue-400 hover:underline cursor-pointer">Learn more</span>
                        </p>

                        <div className="flex justify-between items-center pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setGoogleError("");
                              setGoogleChooserStep("choose");
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 font-bold px-3 py-1.5 rounded"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            className="text-xs bg-[#1a73e8] hover:bg-blue-600 active:bg-blue-700 text-white font-bold px-6 py-2.5 rounded transition-colors shadow"
                          >
                            Next
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {googleChooserStep === "enter_password" && (
                    <motion.div
                      key="pass-head"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="w-full text-left mt-2"
                    >
                      <h4 className="text-xl text-white font-medium text-center">Welcome</h4>
                      <div className="flex items-center justify-center gap-1.5 mt-2.5 mb-8">
                        <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span>{googleEmailInput}</span>
                        </div>
                      </div>

                      <form onSubmit={handleGooglePasswordSubmit} className="space-y-6">
                        {googleError && (
                          <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{googleError}</span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <input
                            type="password"
                            placeholder="Enter your password"
                            value={googlePasswordInput}
                            onChange={(e) => setGooglePasswordInput(e.target.value)}
                            className="w-full bg-[#121212] border border-white/15 rounded-md px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-sans"
                            autoFocus
                          />
                          <button 
                            type="button"
                            className="text-xs text-blue-400 hover:text-blue-300 font-semibold mt-2 block"
                          >
                            Forgot password?
                          </button>
                        </div>

                        <div className="flex justify-between items-center pt-8">
                          <button
                            type="button"
                            onClick={() => {
                              setGoogleError("");
                              setGoogleChooserStep("enter_email");
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 font-bold px-3 py-1.5 rounded"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            className="text-xs bg-[#1a73e8] hover:bg-blue-600 active:bg-blue-700 text-white font-bold px-6 py-2.5 rounded transition-colors shadow"
                          >
                            Next
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Chooser standard footer */}
              {googleChooserStep === "choose" && (
                <div className="text-center text-[10px] text-gray-500 leading-relaxed border-t border-white/10 pt-4 mt-6">
                  To continue, Google will share your name, email address, profile picture, and choice of theme preferences with MeetGraph.
                </div>
              )}

              {/* Sub-footer compliance links */}
              <div className="flex justify-between text-[11px] text-gray-500 mt-6 pt-4 border-t border-white/5">
                <span className="cursor-pointer hover:text-gray-400">English (United States)</span>
                <div className="flex gap-3">
                  <span className="cursor-pointer hover:text-gray-400">Help</span>
                  <span className="cursor-pointer hover:text-gray-400">Privacy</span>
                  <span className="cursor-pointer hover:text-gray-400">Terms</span>
                </div>
              </div>

              {/* Native window cancel trigger */}
              <button
                onClick={() => setShowGoogleChooser(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 5: AUTHENTIC GOOGLE AUTHORIZATION LOADER MODAL */}
      <AnimatePresence>
        {isAuthorizing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020204]/90 backdrop-blur-xl z-50 flex items-center justify-center flex-col p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-md w-full border border-white/5 bg-[#08080c] p-6 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
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
                
                {selectedOAuthUser && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/5 mb-2">
                    <img 
                      src={selectedOAuthUser.avatar} 
                      alt={selectedOAuthUser.name} 
                      className="h-5 w-5 rounded-full bg-slate-900 border border-white/10"
                    />
                    <span className="text-xs text-white font-medium">{selectedOAuthUser.name}</span>
                  </div>
                )}

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
