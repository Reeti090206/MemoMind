"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { auth, hasFirebaseConfig } from "@/lib/firebase";
import { RecaptchaVerifier } from "firebase/auth";
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
  Phone,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlassLoginWall() {
  const {
    loginWithOAuth,
    loginWithPhone,
    sendOtp,
    loginWithCredentials,
    signUpWithCredentials,
    forgotPassword,
    welcomeEmail,
    clearWelcomeEmail
  } = useAuth();

  // Navigation Flow: login | signup | phone | forgot_password
  const [flowStep, setFlowStep] = useState<"login" | "signup" | "phone" | "forgot_password">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Errors & Loading States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Form Inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot Password Input
  const [forgotEmail, setForgotEmail] = useState("");

  // Phone Login Inputs
  const [phoneRaw, setPhoneRaw] = useState("");
  const [otpCodeArray, setOtpCodeArray] = useState<string[]>(Array(6).fill(""));
  const [codeSent, setCodeSent] = useState(false);
  const [sentMethod, setSentMethod] = useState<string | null>(null);
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const COUNTRIES = [
    { code: "+1", name: "United States", flag: "🇺🇸" },
    { code: "+91", name: "India", flag: "🇮🇳" },
    { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
    { code: "+1", name: "Canada", flag: "🇨🇦" },
    { code: "+61", name: "Australia", flag: "🇦🇺" },
    { code: "+49", name: "Germany", flag: "🇩🇪" },
    { code: "+33", name: "France", flag: "🇫🇷" },
    { code: "+81", name: "Japan", flag: "🇯🇵" }
  ];
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const otpInputRefs = useRef<HTMLInputElement[]>([]);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Load email from localStorage if Remember Me was checked previously
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("MemoMind_remembered_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (e) {
      console.warn("Failed to load remembered email", e);
    }
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    let intervalId: any;
    if (codeSent && timer > 0) {
      intervalId = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(intervalId);
  }, [codeSent, timer]);

  // Click outside to close country selector
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset errors and notifications on step switch
  useEffect(() => {
    setErrorMsg("");
    setSuccessMsg("");
  }, [flowStep]);

  // Validate Email in Frontend
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Setup invisible Recaptcha Verifier safely and handle unmounting/recreation
  const setupRecaptcha = () => {
    if (hasFirebaseConfig && auth) {
      try {
        // Clear any existing verifier instance to prevent stale DOM element references
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) {
            // Ignore error during clear
          }
          (window as any).recaptchaVerifier = null;
        }

        const container = document.getElementById('recaptcha-container');
        if (!container) {
          console.warn("reCAPTCHA container element not found in DOM.");
          return;
        }

        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => { }
        });
      } catch (err: any) {
        console.error("Failed to initialize reCAPTCHA verifier:", err);
      }
    }
  };

  // Standard Credentials Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both your email and password.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithCredentials(email.toLowerCase().trim(), password);
      if (result.success) {
        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem("MemoMind_remembered_email", email.trim());
        } else {
          localStorage.removeItem("MemoMind_remembered_email");
        }
        setSuccessMsg("Authentication verified successfully! Entering workspace...");
      } else {
        setErrorMsg(result.error || "Login failed. Incorrect credentials.");
      }
    } catch (err: any) {
      // Map exact validation errors
      let errMsg = "Authentication error. Please check your network.";
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        errMsg = "Incorrect password. Please try again.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Please enter a valid email address.";
      } else if (err.code === "auth/user-not-found") {
        errMsg = "No account found with this email.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Credentials Registration / Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg("Please complete all input fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (!agreeTerms) {
      setErrorMsg("You must accept the Terms and Conditions to proceed.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithCredentials(fullName.trim(), email.toLowerCase().trim(), password);
      if (result.success) {
        setSuccessMsg("Registration successful! Launching workspace setup...");
      } else {
        setErrorMsg(result.error || "Failed to create account.");
      }
    } catch (err: any) {
      let errMsg = "Failed to register account.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Weak password. Password must be 6+ characters.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Please enter a valid email address.";
      }
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // OAuth Providers Trigger (Google / GitHub)
  const handleOAuthLogin = async (provider: "google" | "github") => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await loginWithOAuth(provider);
      setSuccessMsg(`Redirecting secure ${provider} SSO session...`);
    } catch (err: any) {
      // User simply closed the popup — not an error, just silently reset
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        setLoading(false);
        return;
      }

      console.error(err);
      let errMsg = `${provider} authentication was cancelled or failed.`;
      if (err.code === "auth/account-exists-with-different-credential") {
        errMsg = "An account already exists with this email using a different sign-in method (e.g. Password or Google). Please sign in using that original method.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Submit
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!forgotEmail.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    if (!isValidEmail(forgotEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(forgotEmail.toLowerCase().trim());
      if (res.success) {
        setSuccessMsg("A password recovery link has been dispatched to your inbox.");
        setForgotEmail("");
      } else {
        setErrorMsg(res.error || "Failed to send reset link.");
      }
    } catch (err: any) {
      let errMsg = "Failed to dispatch password recovery link.";
      if (err.code === "auth/user-not-found") {
        errMsg = "No account found with this email address.";
      }
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP Code dispatch
  const handleSendOtpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleaned = phoneRaw.replace(/\D/g, "");
    if (!cleaned) {
      setErrorMsg("Please type in your phone number.");
      return;
    }

    if (cleaned.length < 7) {
      setErrorMsg("Type in a valid mobile number.");
      return;
    }

    setLoading(true);
    const fullPhone = `${selectedCountry.code}${cleaned}`;

    let appVerifier = null;
    if (hasFirebaseConfig && auth) {
      setupRecaptcha();
      appVerifier = (window as any).recaptchaVerifier;
    }

    try {
      const res = await sendOtp(fullPhone, appVerifier);
      if (res.success) {
        setCodeSent(true);
        setTimer(60);
        setCanResend(false);
        setOtpCodeArray(Array(6).fill(""));
        setSentMethod(res.method || null);
        if (res.code) setSentCode(res.code);
        setSuccessMsg("6-digit verification code dispatched via SMS.");
      } else {
        setErrorMsg(res.error || "Could not dispatch SMS.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process SMS OTP dispatch.");
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP Code verification
  const handleVerifyOtpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const code = otpCodeArray.join("");
    if (code.length < 6) {
      setErrorMsg("Please type in the full 6-digit security code.");
      return;
    }

    setLoading(true);
    const fullPhone = `${selectedCountry.code}${phoneRaw.replace(/\D/g, "")}`;
    try {
      const result = await loginWithPhone(fullPhone, code);
      if (result.success) {
        setSuccessMsg("SMS security code verified. Synchronizing profile...");
      } else {
        setErrorMsg(result.error || "Invalid security code. Please check and retry.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-focus OTP inputs
  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const newArr = [...otpCodeArray];
      newArr[index] = "";
      setOtpCodeArray(newArr);
      return;
    }
    const digit = cleaned[cleaned.length - 1];
    const newArr = [...otpCodeArray];
    newArr[index] = digit;
    setOtpCodeArray(newArr);
    if (index < 5 && digit) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpCodeArray[index] && index > 0) {
        const newArr = [...otpCodeArray];
        newArr[index - 1] = "";
        setOtpCodeArray(newArr);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        const newArr = [...otpCodeArray];
        newArr[index] = "";
        setOtpCodeArray(newArr);
      }
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center overflow-y-auto z-50 px-4 py-8 select-none font-sans">

      {/* Hidden anchor for ReCAPTCHA - positioned globally inside wrapper to prevent unmount errors */}
      <div id="recaptcha-container" className="hidden"></div>

      {/* Background Radial Glow Blobs */}
      <div className="absolute inset-0 bg-[var(--background)]/90 z-0" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--mm-accent)]/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--mm-highlight)]/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <AnimatePresence mode="wait">
        {!welcomeEmail ? (
          <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10 items-center justify-center">

            {/* Left Column: Platform Branding and Graphics */}
            <div className="hidden md:flex md:col-span-5 flex-col justify-center pr-6">
              <div className="relative mb-6">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg">
                  <Network className="h-6 w-6 text-white animate-pulse" />
                </div>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
                MemoMind
              </h2>
              <p className="text-cyber-cyan font-mono text-[10px] uppercase tracking-widest mt-1.5 mb-6">
                Organizational Memory Intelligence
              </p>

              <p className="text-[var(--foreground)]/70 text-sm leading-relaxed mb-8">
                MemoMind acts as your team's autonomous shared memory hub, recording conversations, mapping decisions in real-time, and detecting goal contradictions automatically.
              </p>

              {/* Rotating Memory Graphic */}
              <div className="relative h-60 w-full border border-[var(--color-obsidian-border)] bg-[var(--glass-card-bg)] backdrop-blur-md rounded-3xl overflow-hidden flex items-center justify-center shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent z-10" />

                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="absolute h-40 w-40 bg-[var(--mm-accent)]/10 rounded-full blur-2xl animate-pulse"
                />

                <svg width="240" height="200" viewBox="0 0 240 200" className="relative z-20">
                  <motion.g
                    animate={{ rotate: 360 }}
                    transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "120px 100px" }}
                  >
                    <line x1="120" y1="100" x2="60" y2="60" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="120" y1="100" x2="180" y2="70" stroke="rgba(6,182,212,0.2)" strokeWidth="1.5" />
                    <line x1="120" y1="100" x2="130" y2="160" stroke="rgba(244,63,94,0.2)" strokeWidth="1.5" />

                    <circle cx="120" cy="100" r="10" fill="url(#graphicGrad)" className="filter drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                    <circle cx="60" cy="60" r="6" fill="#a855f7" />
                    <circle cx="180" cy="70" r="7" fill="#06b6d4" />
                    <circle cx="130" cy="160" r="5" fill="#f43f5e" />
                  </motion.g>

                  <defs>
                    <linearGradient id="graphicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-center text-[9px] font-mono text-[var(--foreground)]/50">
                  <span>SQLite Memory Engine Active</span>
                  <span className="flex items-center gap-1 font-semibold text-cyber-emerald">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyber-emerald opacity-75 animate-ping" />
                    Sync Online
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Premium Form */}
            <div className="col-span-1 md:col-span-7 flex justify-center w-full">
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-[440px] bg-[var(--glass-card-bg)] border border-[var(--color-obsidian-border)] rounded-3xl p-8 shadow-xl backdrop-blur-xl relative z-10 flex flex-col justify-between overflow-hidden"
              >
                {/* Glowing Top Lip */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--mm-accent)]/40 to-transparent" />

                <div>
                  {/* Header Title */}
                  <div className="mb-6 text-left">
                    <h2 className="text-2xl font-black text-white mb-1.5">
                      {flowStep === "login" && "Secure Sign In"}
                      {flowStep === "signup" && "Create Workspace Profile"}
                      {flowStep === "phone" && "Mobile OTP Login"}
                      {flowStep === "forgot_password" && "Reset Password Link"}
                    </h2>

                    <p className="text-xs text-[var(--foreground)]/60">
                      {flowStep === "login" && (
                        <>
                          Need an account?{" "}
                          <button
                            onClick={() => setFlowStep("signup")}
                            className="text-cyber-purple hover:underline font-semibold"
                          >
                            Register
                          </button>
                        </>
                      )}
                      {flowStep === "signup" && (
                        <>
                          Already registered?{" "}
                          <button
                            onClick={() => setFlowStep("login")}
                            className="text-cyber-purple hover:underline font-semibold"
                          >
                            Sign In
                          </button>
                        </>
                      )}
                      {(flowStep === "phone" || flowStep === "forgot_password") && (
                        <button
                          onClick={() => setFlowStep("login")}
                          className="text-cyber-cyan hover:underline font-semibold flex items-center gap-1 mt-1"
                        >
                          <ArrowLeft className="h-3 w-3" /> Back to Email Login
                        </button>
                      )}
                    </p>
                  </div>

                  {/* Feedback Notification Banners */}
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2.5"
                    >
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2.5"
                    >
                      <ShieldCheck className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}

                  {/* Dynamic Form Content */}
                  <AnimatePresence mode="wait">

                    {/* CREDENTIALS LOGIN FORM */}
                    {flowStep === "login" && (
                      <motion.form
                        key="login-form"
                        onSubmit={handleLogin}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1 relative">
                          <input
                            type="email"
                            placeholder="Corporate Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/10 focus:border-cyber-purple/50 rounded-xl pl-11 pr-4 py-3 text-sm placeholder-gray-500 focus:outline-none transition-all"
                            required
                          />
                          <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[var(--foreground)]/40" />
                        </div>

                        <div className="space-y-1 relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/10 focus:border-cyber-purple/50 rounded-xl pl-11 pr-11 py-3 text-sm placeholder-gray-500 focus:outline-none transition-all"
                            required
                          />
                          <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[var(--foreground)]/40" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>

                        {/* Remember Me & Forgot Password Grid */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="accent-cyber-purple cursor-pointer h-4 w-4 rounded bg-transparent border-white/10"
                            />
                            <span className="text-[var(--foreground)]/70">Remember email</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setFlowStep("forgot_password")}
                            className="text-cyber-purple hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] text-white font-bold py-3.5 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {loading ? (
                            <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                          ) : (
                            <>
                              <span>Enter Workspace</span>
                              <LogIn className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </motion.form>
                    )}

                    {/* REGISTER / SIGNUP FORM */}
                    {flowStep === "signup" && (
                      <motion.form
                        key="signup-form"
                        onSubmit={handleSignup}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1 relative">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/10 focus:border-cyber-purple/50 rounded-xl pl-11 pr-4 py-3 text-sm placeholder-gray-500 focus:outline-none transition-all"
                            required
                          />
                          <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[var(--foreground)]/40" />
                        </div>

                        <div className="space-y-1 relative">
                          <input
                            type="email"
                            placeholder="Work Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/10 focus:border-cyber-purple/50 rounded-xl pl-11 pr-4 py-3 text-sm placeholder-gray-500 focus:outline-none transition-all"
                            required
                          />
                          <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[var(--foreground)]/40" />
                        </div>

                        <div className="space-y-1 relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Choose Secure Password (6+ chars)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/10 focus:border-cyber-purple/50 rounded-xl pl-11 pr-11 py-3 text-sm placeholder-gray-500 focus:outline-none transition-all"
                            required
                          />
                          <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[var(--foreground)]/40" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>

                        {/* Terms & Conditions Checkbox */}
                        <div className="flex items-center gap-2.5 pt-1 text-xs">
                          <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="accent-cyber-purple cursor-pointer h-4 w-4"
                            required
                          />
                          <span className="text-[var(--foreground)]/70">
                            I accept the corporate privacy policy and terms.
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] text-white font-bold py-3.5 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {loading ? (
                            <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                          ) : (
                            <>
                              <span>Register Account</span>
                              <UserPlus className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </motion.form>
                    )}

                    {/* PHONE OTP LOGIN FORM */}
                    {flowStep === "phone" && (
                      <motion.form
                        key="phone-form"
                        onSubmit={codeSent ? handleVerifyOtpCode : handleSendOtpCode}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {!codeSent ? (
                          <div className="space-y-4">
                            <div className="space-y-1.5 relative">
                              <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--foreground)]/50">Mobile Contact Number</label>
                              <div className="flex gap-2">
                                <div className="relative" ref={countryDropdownRef}>
                                  <button
                                    type="button"
                                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                    className="h-full bg-white/[0.02] border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <span>{selectedCountry.flag}</span>
                                    <span className="font-mono">{selectedCountry.code}</span>
                                    <ChevronDown className="h-3 w-3 opacity-60" />
                                  </button>

                                  <AnimatePresence>
                                    {showCountryDropdown && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="absolute left-0 mt-1.5 w-48 max-h-48 overflow-y-auto bg-[#1b1a23] border border-white/10 rounded-xl z-50 p-1"
                                      >
                                        {COUNTRIES.map((c) => (
                                          <button
                                            key={c.code + c.name}
                                            type="button"
                                            onClick={() => {
                                              setSelectedCountry(c);
                                              setShowCountryDropdown(false);
                                            }}
                                            className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-[11px] flex items-center justify-between text-[var(--foreground)]/80 cursor-pointer"
                                          >
                                            <span className="truncate">{c.flag} {c.name}</span>
                                            <span className="font-mono text-cyan-400 shrink-0">{c.code}</span>
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                <input
                                  type="tel"
                                  placeholder="555 0199"
                                  value={phoneRaw}
                                  onChange={(e) => setPhoneRaw(e.target.value)}
                                  className="flex-1 bg-white/[0.02] border border-white/10 focus:border-cyber-purple/50 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-mono"
                                  required
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] text-white font-bold py-3.5 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {loading ? (
                                <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                              ) : (
                                <>
                                  <span>Send OTP SMS</span>
                                  <ArrowRight className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            <div className="text-center md:text-left space-y-1">
                              <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--foreground)]/50 block">Enter Security Digit OTP</label>
                              <p className="text-[11px] text-[var(--foreground)]/65">
                                Sent to <span className="text-cyber-purple font-mono font-bold">{selectedCountry.code} {phoneRaw}</span>
                              </p>
                            </div>

                            <div className="flex justify-between gap-2.5 py-1">
                              {otpCodeArray.map((digit, idx) => (
                                <input
                                  key={idx}
                                  type="text"
                                  maxLength={1}
                                  value={digit}
                                  ref={(el) => { if (el) otpInputRefs.current[idx] = el; }}
                                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                  className="w-12 h-14 text-center bg-white/[0.02] border border-white/10 focus:border-cyber-purple/50 rounded-xl text-lg font-mono font-bold text-white focus:outline-none transition-all"
                                  autoFocus={idx === 0}
                                />
                              ))}
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-mono text-[var(--foreground)]/60">
                              {canResend ? (
                                <button
                                  type="button"
                                  onClick={handleSendOtpCode}
                                  className="text-cyber-purple font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw className="h-3 w-3" /> Resend Code
                                </button>
                              ) : (
                                <span>Resend in 0:{timer.toString().padStart(2, "0")}</span>
                              )}

                              <button
                                type="button"
                                onClick={() => { setCodeSent(false); setOtpCodeArray(Array(6).fill("")); }}
                                className="text-cyber-cyan hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                Change Number
                              </button>
                            </div>

                            {/* Simulated code display if running console OTP backend fallback */}
                            {sentMethod === "console" && sentCode && (
                              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-center font-mono text-[10px] text-cyan-400">
                                Sandbox Bypass OTP Code: <strong className="text-white select-all text-xs font-bold">{sentCode}</strong>
                              </div>
                            )}

                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] text-white font-bold py-3.5 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {loading ? (
                                <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                              ) : (
                                <>
                                  <span>Verify Code</span>
                                  <LogIn className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </motion.form>
                    )}

                    {/* FORGOT PASSWORD FORM */}
                    {flowStep === "forgot_password" && (
                      <motion.form
                        key="forgot-form"
                        onSubmit={handleForgotPassword}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1 relative">
                          <input
                            type="email"
                            placeholder="Registered Account Email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/10 focus:border-cyber-purple/50 rounded-xl pl-11 pr-4 py-3 text-sm placeholder-gray-500 focus:outline-none transition-all"
                            required
                          />
                          <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[var(--foreground)]/40" />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] text-white font-bold py-3.5 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {loading ? (
                            <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                          ) : (
                            "Request Recovery Link"
                          )}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Horizontal Line Split */}
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-white/[0.06]" />
                    <span className="flex-shrink mx-4 text-white/30 text-[9px] font-mono uppercase tracking-widest">
                      Or continue with
                    </span>
                    <div className="flex-grow border-t border-white/[0.06]" />
                  </div>

                  {/* Social Single Sign-Ons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin("google")}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] text-white text-xs font-semibold transition-all cursor-pointer active:scale-95"
                    >
                      <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOAuthLogin("github")}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] text-white text-xs font-semibold transition-all cursor-pointer active:scale-95"
                    >
                      <svg className="h-4.5 w-4.5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                      </svg>
                      <span>GitHub</span>
                    </button>

                    {flowStep !== "phone" && (
                      <button
                        type="button"
                        onClick={() => setFlowStep("phone")}
                        className="col-span-2 w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] text-cyber-cyan text-xs font-semibold transition-all cursor-pointer active:scale-95 mt-1.5"
                      >
                        <Phone className="h-4 w-4" />
                        <span>Sign In with Phone Number</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Security Compliance Indicator */}
                <div className="mt-8 flex items-center justify-between text-[8px] font-mono text-[var(--foreground)]/40 border-t border-white/[0.05] pt-4">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> E2E TLS 1.3 Secure
                  </span>
                  <span>MemoMind v1.2.6</span>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Email Dispatch Preview Modal Frame */
          <motion.div
            key="email-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl bg-[#120f1b]/95 border border-white/[0.06] rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-rose" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/[0.06] pb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center text-cyber-purple shadow-inner">
                  <Mail className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Onboard Welcome Dispatched!</h3>
                  <p className="text-xs text-[var(--foreground)]/50">Your corporate secure profile has been synced with database nodes.</p>
                </div>
              </div>

              <button
                onClick={clearWelcomeEmail}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:shadow-[0_0_15px_rgba(139,92,246,0.35)] transition-all rounded-xl text-white font-bold tracking-wider uppercase cursor-pointer"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col bg-black/45 border border-white/[0.05] rounded-2xl overflow-hidden mb-4 shadow-inner">
              <div className="bg-white/[0.01] px-5 py-3 border-b border-white/[0.05] text-[10px] font-mono text-[var(--foreground)]/60 space-y-1">
                <div>Subject: Welcome to your MemoMind Workspace!</div>
                <div>From: onboarding@MemoMind.ai &lt;MemoMind Core Service&gt;</div>
                <div className="text-cyan-400">To: {email || "authenticated_user@MemoMind.ai"}</div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[300px] bg-black/30 flex justify-center">
                <div
                  className="w-full text-left"
                  dangerouslySetInnerHTML={{ __html: welcomeEmail.html }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-[9px] font-mono text-[var(--foreground)]/45 border-t border-white/[0.05] pt-4 gap-2">
              <span className="truncate max-w-sm sm:max-w-md md:max-w-lg">
                HTML welcome email saved to disk: <strong>{welcomeEmail.filePath}</strong>
              </span>
              <span>AES-256 TLS 1.3</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
