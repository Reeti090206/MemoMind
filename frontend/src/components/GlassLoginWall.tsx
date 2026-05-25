"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth, SEED_PROFILES, UserProfile } from "./AuthProvider";
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
  KeyRound, 
  CheckCircle2,
  Eye,
  EyeOff,
  Phone,
  ArrowRightLeft,
  MailCheck,
  FileText,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlassLoginWall() {
  const { 
    loginWithGoogle, 
    loginWithOAuth, 
    loginWithPhone, 
    sendOtp,
    loginWithCredentials, 
    signUpWithCredentials,
    welcomeEmail,
    clearWelcomeEmail
  } = useAuth();
  
  // Navigation Flow: signup | login | phone | forgot_password
  const [flowStep, setFlowStep] = useState<"signup" | "login" | "phone" | "forgot_password">("signup");
  
  // Password Visibility toggles
  const [showPassword, setShowPassword] = useState(false);

  // Error & loading states
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Form inputs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Phone Login inputs
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sentMethod, setSentMethod] = useState<string | null>(null);
  const [sentCode, setSentCode] = useState<string | null>(null);

  // Modern Phone OTP inputs
  const COUNTRIES = [
    { code: "+1", name: "United States", flag: "🇺🇸" },
    { code: "+91", name: "India", flag: "🇮🇳" },
    { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
    { code: "+1", name: "Canada", flag: "🇨🇦" },
    { code: "+61", name: "Australia", flag: "🇦🇺" },
    { code: "+49", name: "Germany", flag: "🇩🇪" },
    { code: "+33", name: "France", flag: "🇫🇷" },
    { code: "+81", name: "Japan", flag: "🇯🇵" },
    { code: "+86", name: "China", flag: "🇨🇳" },
    { code: "+7", name: "Russia", flag: "🇷🇺" },
    { code: "+55", name: "Brazil", flag: "🇧🇷" },
    { code: "+27", name: "South Africa", flag: "🇿🇦" },
    { code: "+34", name: "Spain", flag: "🇪🇸" },
    { code: "+39", name: "Italy", flag: "🇮🇹" },
    { code: "+65", name: "Singapore", flag: "🇸🇬" },
    { code: "+971", name: "UAE", flag: "🇦🇪" }
  ];
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phoneRaw, setPhoneRaw] = useState("");
  const [otpCodeArray, setOtpCodeArray] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  
  const otpInputRefs = useRef<HTMLInputElement[]>([]);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Close country dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-detect country code from IP
  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          const userCallingCode = data.country_calling_code;
          if (userCallingCode) {
            const matched = COUNTRIES.find(c => c.code === userCallingCode);
            if (matched) {
              setSelectedCountry(matched);
            } else {
              const customCountry = {
                code: userCallingCode,
                name: data.country_name || "Detected",
                flag: data.country_code ? getFlagEmoji(data.country_code) : "🌐"
              };
              setSelectedCountry(customCountry);
            }
          }
        }
      } catch (err) {
        console.warn("Unable to auto-detect country calling code:", err);
      }
    };
    fetchUserCountry();
  }, []);

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

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

  // Forgot password inputs
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sending" | "sent">("idle");

  // Reset errors on flow step change
  useEffect(() => {
    setErrorMsg("");
    setForgotStatus("idle");
    setCodeSent(false);
  }, [flowStep]);

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

  // Load custom accounts from localStorage for suggestion
  useEffect(() => {
    try {
      const registeredStr = localStorage.getItem("MemoMind_registered_users");
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
        email: "guest.developer@MemoMind.ai",
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
      const registeredStr = localStorage.getItem("MemoMind_registered_users");
      let registeredUsers = registeredStr ? JSON.parse(registeredStr) : {};
      
      // Only register if doesn't exist
      if (!registeredUsers[emailKey] && !["aman.g@MemoMind.ai", "reeti.s@MemoMind.ai", "sarah.j@MemoMind.ai"].includes(emailKey)) {
        registeredUsers[emailKey] = {
          ...targetProfile,
          password: googlePasswordInput
        };
        localStorage.setItem("MemoMind_registered_users", JSON.stringify(registeredUsers));
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

  // Social Login handler (Google & GitHub)
  const handleSocialLogin = async (provider: "google" | "github") => {
    setErrorMsg("");
    if (provider === "google") {
      setGoogleChooserStep("choose");
      setGoogleError("");
      setGoogleEmailInput("");
      setGooglePasswordInput("");
      setShowGoogleChooser(true);
      return;
    }
    if (provider === "github") {
      setLoading(true);
      try {
        await loginWithOAuth("github");
      } catch (err: any) {
        setErrorMsg(err.message || "GitHub Authentication failed");
      }
      setLoading(false);
    }
  };

  // Email / Password Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName || !lastName || !email || !password) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    if (!agreeTerms) {
      setErrorMsg("You must agree to the Terms & Conditions.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const fullName = `${firstName} ${lastName}`;
    const result = await signUpWithCredentials(fullName, email, password);
    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || "Failed to create account.");
    }
  };

  // Email / Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const result = await loginWithCredentials(email, password);
    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || "Authentication failed.");
    }
  };

  // Setup invisible Recaptcha Verifier
  const setupRecaptcha = () => {
    if (hasFirebaseConfig && auth && !(window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          }
        });
      } catch (err: any) {
        console.error("Failed to initialize reCAPTCHA verifier:", err);
      }
    }
  };

  // Phone Login Code Send
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!phoneRaw) {
      setErrorMsg("Please enter your phone number.");
      return;
    }

    const cleanedRaw = phoneRaw.replace(/\D/g, "");
    if (cleanedRaw.length < 7) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }

    const fullPhone = `${selectedCountry.code}${cleanedRaw}`;
    setPhoneNumber(fullPhone);
    setLoading(true);

    let appVerifier = null;
    if (hasFirebaseConfig && auth) {
      setupRecaptcha();
      appVerifier = (window as any).recaptchaVerifier;
    }

    const res = await sendOtp(fullPhone, appVerifier);
    setLoading(false);

    if (!res.success) {
      if (res.error && res.error.includes("billing-not-enabled")) {
        setErrorMsg("Firebase Billing Not Enabled. SMS requires a pay-as-you-go plan. Switching to Sandbox Demo Mode...");
        setTimeout(async () => {
          setErrorMsg("");
          setLoading(true);
          // Force simulated local mock OTP flow
          const sandboxRes = await sendOtp(fullPhone);
          setLoading(false);
          if (sandboxRes.success) {
            setCodeSent(true);
            setTimer(60);
            setCanResend(false);
            setOtpCodeArray(Array(6).fill(""));
            setSentMethod(sandboxRes.method || null);
            if (sandboxRes.code) setSentCode(sandboxRes.code);
          }
        }, 3000);
      } else {
        setErrorMsg(res.error || "Failed to send verification code.");
      }
      return;
    }

    setCodeSent(true);
    setTimer(60);
    setCanResend(false);
    setOtpCodeArray(Array(6).fill(""));
    setSentMethod(res.method || null);
    if (res.code) setSentCode(res.code);
  };

  // Phone Login Code Verify
  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const code = otpCodeArray.join("");
    if (code.length < 6) {
      setErrorMsg("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    const fullPhone = `${selectedCountry.code}${phoneRaw.replace(/\D/g, "")}`;
    const result = await loginWithPhone(fullPhone, code);
    setLoading(false);

    if (result.success) {
      setShowSuccessCheck(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // AuthProvider triggers layout shift or welcome email modal
    } else {
      setErrorMsg(result.error || "Verification failed. Please try again.");
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setErrorMsg("");
    setTimer(60);
    setCanResend(false);
    setOtpCodeArray(Array(6).fill(""));

    let appVerifier = null;
    if (hasFirebaseConfig && auth) {
      setupRecaptcha();
      appVerifier = (window as any).recaptchaVerifier;
    }

    const fullPhone = `${selectedCountry.code}${phoneRaw.replace(/\D/g, "")}`;
    setLoading(true);
    const res = await sendOtp(fullPhone, appVerifier);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || "Failed to resend code.");
      setCanResend(true);
    } else {
      setCodeSent(true);
      setSentMethod(res.method || null);
      if (res.code) setSentCode(res.code);
    }
  };

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

    // Auto-focus next field
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

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtpCodeArray(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Forgot Password submit
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!forgotEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setForgotStatus("sending");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setForgotStatus("sent");
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center overflow-y-auto z-50 px-4 py-8 select-none font-sans">
      
      {/* Subtle ambient lighting overlays to match premium MemoMind palette */}
      <div className="absolute inset-0 bg-[var(--background)]/95 z-0" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ee5622]/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#44355b]/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Login Page Main Container */}
      <AnimatePresence mode="wait">
        {!welcomeEmail ? (
          <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10 items-center justify-center">
            
            {/* Left Hand Visual: Interactive rotating nodes memory graph preview */}
            <div className="hidden md:flex md:col-span-5 flex-col justify-center pr-6">
              <div className="relative mb-6">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#eca72c] to-[#44355b] flex items-center justify-center border border-[#eca72c]/30 shadow-[0_0_20px_rgba(236,167,44,0.3)]">
                  <Network className="h-6 w-6 text-[var(--foreground)] animate-pulse" />
                </div>
              </div>
              
              <h2 className="text-3xl font-black tracking-tight text-[var(--foreground)] leading-tight">
                MemoMind
              </h2>
              
              <p className="text-[var(--foreground)]/70 font-mono text-[10px] uppercase tracking-widest mt-1.5 mb-6">
                Memory Intelligence
              </p>

              <p className="text-[var(--foreground)]/70 text-sm leading-relaxed mb-8">
                We capture your meetings, track decisions, and organize task lists automatically, so your team stays perfectly in sync without extra typing.
              </p>

              {/* SVG Rotating Memory Graph Graphic */}
              <div className="relative h-60 w-full border border-white/[0.05] bg-[var(--foreground)]/[0.02] backdrop-blur-md rounded-3xl overflow-hidden flex items-center justify-center group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/90 via-transparent to-transparent z-10" />
                
                {/* Pulsing Core */}
                <motion.div 
                  animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="absolute h-40 w-40 bg-[#ee5622]/10 rounded-full blur-2xl animate-pulse" 
                />
                <svg width="240" height="200" viewBox="0 0 240 200" className="relative z-20">
                  <motion.g
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "120px 100px" }}
                  >
                    {/* Connections */}
                    <line x1="120" y1="100" x2="60" y2="60" stroke="rgba(238,86,34,0.24)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="120" y1="100" x2="180" y2="70" stroke="rgba(236,167,44,0.28)" strokeWidth="1.5" />
                    <line x1="120" y1="100" x2="130" y2="160" stroke="rgba(238,86,34,0.3)" strokeWidth="1.5" />
                    <line x1="60" y1="60" x2="180" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="180" y1="70" x2="130" y2="160" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="130" y1="160" x2="60" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                    {/* Nodes */}
                    <circle cx="120" cy="100" r="10" fill="url(#coreGradient)" className="filter drop-shadow-[0_0_8px_rgba(238,86,34,0.5)]" />
                    <circle cx="60" cy="60" r="6" fill="#44355b" />
                    <circle cx="180" cy="70" r="7" fill="#eca72c" />
                    <circle cx="130" cy="160" r="5" fill="#ee5622" />
                  </motion.g>
                  
                  <defs>
                    <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#eca72c" />
                      <stop offset="100%" stopColor="#44355b" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-center text-[10px] font-mono text-[var(--foreground)]/50">
                  <span>Nodes: 34 Active</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#44355b] opacity-75 animate-ping" />
                    Live Index Sync
                  </span>
                </div>
              </div>
            </div>

            {/* Right Hand Visual: Redesigned Premium Glassmorphic Card */}
            <div className="col-span-1 md:col-span-7 flex justify-center w-full">
              <motion.div 
                key="auth-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[420px] bg-[var(--color-obsidian-dark)]/85 border border-white/[0.06] rounded-3xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative z-10 flex flex-col justify-between overflow-hidden"
              >
            {/* Upper Edge Glowing Accent */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#eca72c]/40 to-transparent" />

            <div>
              {/* Header Titles */}
              <div className="mb-8 text-left">
                <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mb-2 font-sans">
                  {flowStep === "signup" && "Create an account"}
                  {flowStep === "login" && "Log in to account"}
                  {flowStep === "phone" && "Sign in with Phone"}
                  {flowStep === "forgot_password" && "Reset password"}
                </h2>
                
                <p className="text-xs text-[var(--foreground)]/70">
                  {flowStep === "signup" && (
                    <>
                      Already have an account?{" "}
                      <button 
                        onClick={() => setFlowStep("login")}
                        className="text-[#eca72c] hover:text-[#f4c56e] font-medium underline underline-offset-4 transition-colors"
                      >
                        Log in
                      </button>
                    </>
                  )}
                  {flowStep === "login" && (
                    <>
                      Don't have an account?{" "}
                      <button 
                        onClick={() => setFlowStep("signup")}
                        className="text-[#eca72c] hover:text-[#f4c56e] font-medium underline underline-offset-4 transition-colors"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                  {flowStep === "phone" && (
                    <>
                      Prefer credentials?{" "}
                      <button 
                        onClick={() => setFlowStep("login")}
                        className="text-[#eca72c] hover:text-[#f4c56e] font-medium underline underline-offset-4 transition-colors"
                      >
                        Email Login
                      </button>
                    </>
                  )}
                  {flowStep === "forgot_password" && "Enter your email to receive a recovery link"}
                </p>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-xs text-red-400 flex items-start gap-2.5"
                >
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {/* FORM AREA */}
              <AnimatePresence mode="wait">
                {/* SIGN UP FORM */}
                {flowStep === "signup" && (
                  <motion.form
                    key="signup-form"
                    onSubmit={handleSignup}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* First & Last name row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Fletcher"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full bg-[var(--color-obsidian-medium)]/70 border border-[var(--color-obsidian-border)] focus:border-[#eca72c]/50 rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none transition-all focus:ring-1 focus:ring-[#eca72c]/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full bg-[var(--color-obsidian-medium)]/70 border border-[var(--color-obsidian-border)] focus:border-[#eca72c]/50 rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none transition-all focus:ring-1 focus:ring-[#eca72c]/30"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[var(--color-obsidian-medium)]/70 border border-[var(--color-obsidian-border)] focus:border-[#eca72c]/50 rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none transition-all focus:ring-1 focus:ring-[#eca72c]/30"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1 relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[var(--color-obsidian-medium)]/70 border border-[var(--color-obsidian-border)] focus:border-[#eca72c]/50 rounded-xl pl-4 pr-11 py-3 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none transition-all focus:ring-1 focus:ring-[#eca72c]/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-[var(--foreground)]/70 hover:text-[var(--foreground)] transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-center gap-3 pt-1">
                      <label className="relative flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 bg-[var(--color-obsidian-medium)]/70 border border-white/[0.06] rounded-md peer-checked:bg-[#ee5622] peer-checked:border-[#eca72c] flex items-center justify-center transition-all">
                          {agreeTerms && (
                            <svg className="w-3 h-3 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </label>
                      <span className="text-xs text-[var(--foreground)]/70">
                        I agree to the <span className="text-[#eca72c] font-medium hover:underline cursor-pointer">Terms & Conditions</span>
                      </span>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#ee5622] hover:bg-[#d7491f] text-[var(--foreground)] font-medium py-3 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-[#ee5622]/20"
                    >
                      {loading ? (
                        <div className="h-4 w-4 rounded-full border-2 border-[var(--color-obsidian-border)] border-t-white animate-spin" />
                      ) : (
                        "Create account"
                      )}
                    </button>
                  </motion.form>
                )}

                {/* LOGIN FORM */}
                {flowStep === "login" && (
                  <motion.form
                    key="login-form"
                    onSubmit={handleLogin}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Email */}
                    <div className="space-y-1">
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[var(--color-obsidian-medium)]/70 border border-[var(--color-obsidian-border)] focus:border-[#eca72c]/50 rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none transition-all focus:ring-1 focus:ring-[#eca72c]/30"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1 relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[var(--color-obsidian-medium)]/70 border border-[var(--color-obsidian-border)] focus:border-[#eca72c]/50 rounded-xl pl-4 pr-11 py-3 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none transition-all focus:ring-1 focus:ring-[#eca72c]/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-[var(--foreground)]/70 hover:text-[var(--foreground)] transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>

                    {/* Forgot password bypass */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setFlowStep("forgot_password")}
                        className="text-xs text-[#eca72c] hover:text-[#f4c56e] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#ee5622] hover:bg-[#d7491f] text-[var(--foreground)] font-medium py-3 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-[#ee5622]/20"
                    >
                      {loading ? (
                        <div className="h-4 w-4 rounded-full border-2 border-[var(--color-obsidian-border)] border-t-white animate-spin" />
                      ) : (
                        "Log in"
                      )}
                    </button>
                  </motion.form>
                )}

                {/* PHONE LOGIN FORM */}
                {flowStep === "phone" && (
                  <motion.form
                    key="phone-form"
                    onSubmit={codeSent ? handleVerifyPhone : handleSendCode}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* reCAPTCHA anchor container */}
                    <div id="recaptcha-container" className="hidden"></div>

                    {showSuccessCheck ? (
                      /* SUCCESS STATE CHECKMARK ANIMATION */
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-10 flex flex-col items-center justify-center space-y-4"
                      >
                        <div className="h-16 w-16 rounded-full bg-cyber-emerald/10 border border-cyber-emerald/30 flex items-center justify-center text-cyber-emerald shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                          <motion.svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                            stroke="currentColor"
                            className="w-8 h-8"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </motion.svg>
                        </div>
                        <div className="text-center">
                          <h4 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Security Code Verified</h4>
                          <p className="text-xs text-[var(--foreground)]/70 mt-1 font-mono">Restoring encrypted memory layers...</p>
                        </div>
                      </motion.div>
                    ) : !codeSent ? (
                      /* STEP 1: PHONE NUMBER INPUT */
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-[var(--foreground)]/70 font-mono uppercase tracking-wider">Mobile Number</label>
                          <div className="flex gap-2.5 relative">
                            {/* Country dropdown trigger */}
                            <div className="relative" ref={countryDropdownRef}>
                              <button
                                type="button"
                                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                className="flex items-center gap-1.5 h-full bg-[var(--color-obsidian-medium)]/70 border border-[var(--color-obsidian-border)] focus:border-[#eca72c]/50 rounded-xl px-3 text-sm text-[var(--foreground)] focus:outline-none transition-all active:scale-[0.98]"
                              >
                                <span className="text-base select-none">{selectedCountry.flag}</span>
                                <span className="font-mono text-xs text-[var(--foreground)]/80">{selectedCountry.code}</span>
                                <ChevronDown className="h-3 w-3 text-[var(--foreground)]/70 shrink-0" />
                              </button>

                              {/* Country list dropdown */}
                              <AnimatePresence>
                                {showCountryDropdown && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute left-0 mt-2 w-56 max-h-60 overflow-y-auto bg-[#1e1929] border border-white/[0.08] rounded-xl shadow-2xl z-50 p-1.5 scrollbar-thin scrollbar-thumb-white/10"
                                  >
                                    {COUNTRIES.map((country, idx) => (
                                      <button
                                        key={`${country.code}-${idx}`}
                                        type="button"
                                        onClick={() => {
                                          setSelectedCountry(country);
                                          setShowCountryDropdown(false);
                                        }}
                                        className="w-full flex items-center justify-between p-2.5 hover:bg-[var(--foreground)]/[0.05] active:bg-[var(--foreground)]/[0.10] rounded-lg text-left transition-colors text-xs text-[var(--foreground)]"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <span>{country.flag}</span>
                                          <span className="truncate">{country.name}</span>
                                        </div>
                                        <span className="font-mono text-[var(--foreground)]/70 shrink-0">{country.code}</span>
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Phone number input */}
                            <input
                              type="tel"
                              placeholder="(555) 000-0000"
                              value={phoneRaw}
                              onChange={(e) => setPhoneRaw(e.target.value)}
                              className="flex-1 bg-[var(--color-obsidian-medium)]/70 border border-[var(--color-obsidian-border)] focus:border-[#eca72c]/50 rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none transition-all focus:ring-1 focus:ring-[#eca72c]/30 font-mono"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Send SMS Button */}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-[#ee5622] hover:bg-[#d7491f] text-[var(--foreground)] font-medium py-3.5 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-[#ee5622]/20"
                        >
                          {loading ? (
                            <div className="h-4 w-4 rounded-full border-2 border-[var(--color-obsidian-border)] border-t-white animate-spin" />
                          ) : (
                            <>
                              <span>Verify Phone Number</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* STEP 2: OTP DIGITS INPUT */
                      <div className="space-y-6">
                        <div className="space-y-2 text-center md:text-left">
                          <label className="text-xs text-[var(--foreground)]/70 font-mono uppercase tracking-wider block">Enter Security Code</label>
                          <p className="text-[11px] text-[var(--foreground)]/50 leading-normal">
                            A verification code has been dispatched to <strong className="text-[var(--foreground)] font-mono">{selectedCountry.code} {phoneRaw.replace(/\D/g, "")}</strong>
                          </p>
                        </div>

                        {/* Interactive OTP fields grid */}
                        <div className="flex justify-between gap-2.5 py-1">
                          {otpCodeArray.map((digit, idx) => (
                            <input
                              key={idx}
                              type="text"
                              maxLength={1}
                              pattern="\d*"
                              value={digit}
                              ref={(el) => { if (el) otpInputRefs.current[idx] = el; }}
                              onChange={(e) => handleOtpChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              onPaste={idx === 0 ? handleOtpPaste : undefined}
                              className="w-12 h-14 text-center bg-[var(--color-obsidian-medium)]/70 border border-[var(--color-obsidian-border)] focus:border-[#eca72c]/60 focus:bg-[var(--color-obsidian-medium)]/90 rounded-xl text-lg font-bold text-[var(--foreground)] focus:outline-none transition-all focus:ring-1 focus:ring-[#eca72c]/30 font-mono"
                              autoFocus={idx === 0}
                            />
                          ))}
                        </div>

                        {/* Timer / Resend section */}
                        <div className="flex justify-between items-center text-[11px] text-[var(--foreground)]/70">
                          {canResend ? (
                            <button
                              type="button"
                              onClick={handleResendCode}
                              disabled={loading}
                              className="text-[#eca72c] hover:text-[#f4c56e] font-bold flex items-center gap-1 active:scale-[0.98]"
                            >
                              <RefreshCw className="h-3 w-3 shrink-0" />
                              <span>Resend SMS Code</span>
                            </button>
                          ) : (
                            <span className="font-mono text-[var(--foreground)]/50">
                              Resend code in <strong className="text-[var(--foreground)]/80">0:{timer.toString().padStart(2, "0")}</strong>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => { setCodeSent(false); setOtpCodeArray(Array(6).fill("")); setErrorMsg(""); }}
                            className="text-[var(--foreground)]/70 hover:text-[var(--foreground)] font-medium hover:underline flex items-center gap-1"
                          >
                            <ArrowLeft className="h-3 w-3" />
                            Change Number
                          </button>
                        </div>

                        {/* Simulated Code display for Sandbox Mock mode */}
                        {sentMethod === "console" && sentCode && (
                          <div className="p-3 bg-[#eca72c]/5 border border-[#eca72c]/10 rounded-xl text-center">
                            <span className="text-[11px] text-[#f4c56e] font-mono">
                              [Sandbox Mock Code]: <strong className="text-[var(--foreground)] text-xs select-all">{sentCode}</strong>
                            </span>
                          </div>
                        )}

                        {/* Verify Button */}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-[#ee5622] hover:bg-[#d7491f] text-[var(--foreground)] font-medium py-3.5 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-[#ee5622]/20"
                        >
                          {loading ? (
                            <div className="h-4 w-4 rounded-full border-2 border-[var(--color-obsidian-border)] border-t-white animate-spin" />
                          ) : (
                            <>
                              <span>Verify Security Code</span>
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
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {forgotStatus === "sent" ? (
                      <div className="p-4 rounded-xl bg-[#44355b]/5 border border-[#44355b]/15 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="h-10 w-10 rounded-full bg-[#44355b]/10 flex items-center justify-center text-[#44355b] shrink-0">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-[var(--foreground)]">Recovery Email Dispatched</h4>
                          <p className="text-[11px] text-[var(--foreground)]/70 mt-1 leading-relaxed">
                            A password reset link was sent to <strong className="text-[#eca72c]">{forgotEmail}</strong>.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFlowStep("login");
                          }}
                          className="mt-1 text-xs text-[#eca72c] font-semibold hover:underline"
                        >
                          Return to login form &rarr;
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <input
                            type="email"
                            placeholder="Registered Email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full bg-[var(--color-obsidian-medium)]/70 border border-[var(--color-obsidian-border)] focus:border-[#eca72c]/50 rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none transition-all focus:ring-1 focus:ring-[#eca72c]/30"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={forgotStatus === "sending"}
                          className="w-full bg-[#ee5622] hover:bg-[#d7491f] text-[var(--foreground)] font-medium py-3 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                          {forgotStatus === "sending" ? (
                            <div className="h-4 w-4 rounded-full border-2 border-[var(--color-obsidian-border)] border-t-white animate-spin" />
                          ) : (
                            "Request Recovery Link"
                          )}
                        </button>
                      </>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Separator Line */}
              <div className="relative flex py-6 items-center">
                <div className="flex-grow border-t border-[var(--color-obsidian-border)]"></div>
                <span className="flex-shrink mx-4 text-[var(--foreground)]/50 text-[10px] font-mono uppercase tracking-wider">
                  {flowStep === "signup" ? "Or register with" : "Or sign in with"}
                </span>
                <div className="flex-grow border-t border-[var(--color-obsidian-border)]"></div>
              </div>

              {/* SOCIAL LOGINS GRID */}
              <div className="grid grid-cols-2 gap-3">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  className="col-span-1 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[var(--color-obsidian-border)] bg-[var(--color-obsidian-medium)]/40 hover:bg-[var(--color-obsidian-medium)]/70 text-[var(--foreground)] text-xs font-medium transition-all duration-200 active:scale-[0.98]"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Google</span>
                </button>

                {/* GitHub Button */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin("github")}
                  className="col-span-1 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[var(--color-obsidian-border)] bg-[var(--color-obsidian-medium)]/40 hover:bg-[var(--color-obsidian-medium)]/70 text-[var(--foreground)] text-xs font-medium transition-all duration-200 active:scale-[0.98]"
                >
                  <svg className="h-4 w-4 shrink-0 fill-current text-[var(--foreground)]" viewBox="0 0 24 24" width="24" height="24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub</span>
                </button>

                {/* Phone Login Toggle Button */}
                {flowStep !== "phone" && (
                  <button
                    type="button"
                    onClick={() => setFlowStep("phone")}
                    className="col-span-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[var(--color-obsidian-border)] bg-[var(--color-obsidian-medium)]/40 hover:bg-[var(--color-obsidian-medium)]/70 text-[var(--foreground)] text-xs font-medium transition-all duration-200 active:scale-[0.98] mt-1.5"
                  >
                    <Phone className="h-4 w-4 text-[#eca72c] shrink-0" />
                    <span>Login using Phone Number</span>
                  </button>
                )}
              </div>
            </div>

            {/* Compliance Footer */}
            <div className="mt-8 flex items-center justify-between text-[9px] font-mono text-[var(--foreground)]/50 border-t border-[var(--color-obsidian-border)] pt-4">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#44355b]" />
                TLS 1.3 Encryption Secured
              </span>
              <span>v1.2.6-stable</span>
            </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* STEP 5: WELCOME EMAIL DISPATCH INTERSTITIAL MODAL */
          <motion.div
            key="email-dispatch-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[850px] bg-[#120f1b]/95 border border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative z-10 flex flex-col justify-between overflow-hidden"
          >
            {/* Top glowing line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#44355b]/40 via-[#eca72c]/40 to-[#ee5622]/40" />

            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-[var(--color-obsidian-border)] pb-5">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-[#44355b]/10 border border-[#44355b]/20 flex items-center justify-center text-[#44355b] shadow-inner">
                  <MailCheck className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-1.5">
                    Welcome Email Dispatched! <Sparkles className="h-4.5 w-4.5 text-[#eca72c] animate-pulse" />
                  </h3>
                  <p className="text-xs text-[var(--foreground)]/70">An onboard email was processed successfully and logged to disk.</p>
                </div>
              </div>
              
              <button
                onClick={clearWelcomeEmail}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs bg-[#ee5622] hover:bg-[#d7491f] transition-all rounded-xl text-[var(--foreground)] font-bold tracking-wider uppercase active:scale-[0.98] shadow-md shadow-[#ee5622]/30"
              >
                Enter Workspace <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Email Client Mock Frame */}
            <div className="flex-1 flex flex-col bg-[#0b0b10] border border-[var(--color-obsidian-border)] rounded-2xl overflow-hidden shadow-inner mb-5">
              
              {/* Email details bar */}
              <div className="bg-[#181523] px-5 py-4 border-b border-[var(--color-obsidian-border)] text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--foreground)]/50 font-mono w-16 text-right font-bold uppercase tracking-wider text-[10px]">Subject:</span>
                  <span className="text-[var(--foreground)] font-medium">Welcome to MemoMind AI!</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--foreground)]/50 font-mono w-16 text-right font-bold uppercase tracking-wider text-[10px]">From:</span>
                  <span className="text-[var(--foreground)]/80">system@MemoMind.ai &lt;MemoMind AI Onboarding&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--foreground)]/50 font-mono w-16 text-right font-bold uppercase tracking-wider text-[10px]">To:</span>
                  <span className="text-[#eca72c] font-medium">{welcomeEmail.filePath.split("welcome_")[1]?.split("_at_")[0] + "@" + welcomeEmail.filePath.split("_at_")[1]?.split("_")[0]}</span>
                </div>
              </div>

              {/* HTML Email viewport */}
              <div className="p-4 md:p-6 overflow-y-auto max-h-[380px] bg-[#0b0b10] flex justify-center">
                <div 
                  className="w-full text-left"
                  dangerouslySetInnerHTML={{ __html: welcomeEmail.html }} 
                />
              </div>
            </div>

            {/* Log path location reference */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-[var(--foreground)]/50 border-t border-[var(--color-obsidian-border)] pt-4 gap-2">
              <span className="flex items-center gap-1.5 text-[var(--foreground)]/70">
                <FileText className="h-3.5 w-3.5 text-[#eca72c]" />
                Logged Location: <span className="text-[#f4c56e] select-all truncate max-w-sm sm:max-w-md md:max-w-lg">{welcomeEmail.filePath}</span>
              </span>
              <span>TLS 1.3 Secured</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DYNAMIC HIGH-FIDELITY NATIVE GOOGLE ACCOUNT CHOOSER WINDOW */}
      <AnimatePresence>
        {showGoogleChooser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--background)]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-left"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="max-w-[440px] w-full bg-[#1e1e1e] rounded-lg border border-[var(--color-obsidian-border)] px-8 py-10 shadow-2xl relative flex flex-col justify-between min-h-[500px]"
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
                      className="w-full text-left"
                    >
                      <h4 className="text-xl text-[var(--foreground)] font-medium tracking-tight text-center">Choose an account</h4>
                      <p className="text-[var(--foreground)]/80 text-sm mt-1 mb-6 text-center">to continue to <span className="text-[#eca72c] font-bold">MemoMind AI</span></p>
                      
                      {/* Chooser account listings */}
                      <div className="space-y-0.5 border-y border-[var(--color-obsidian-border)] py-1.5 w-full text-left max-h-[220px] overflow-y-auto pr-1">
                        
                        {/* SEEDS */}
                        {Object.entries(SEED_PROFILES).map(([key, profile]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleGoogleChooserSelect(key)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-[var(--foreground)]/[0.05] active:bg-[var(--foreground)]/[0.10] rounded-md transition-colors text-left"
                          >
                            <img
                              src={profile.avatar}
                              alt={profile.name}
                              className="h-8 w-8 rounded-full bg-slate-900 border border-[var(--color-obsidian-border)] p-0.5 shrink-0"
                            />
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-[var(--foreground)] block leading-tight">{profile.name}</span>
                              <span className="text-[11px] text-[var(--foreground)]/70 block truncate mt-0.5">{profile.email}</span>
                            </div>
                          </button>
                        ))}

                        {/* CUSTOM REGISTERED */}
                        {customRegisteredAccounts.map((acc, idx) => (
                          <button
                            key={`custom-${idx}`}
                            type="button"
                            onClick={() => handleGoogleChooserSelect(undefined, acc)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-[var(--foreground)]/[0.05] active:bg-[var(--foreground)]/[0.10] rounded-md transition-colors text-left"
                          >
                            <img
                              src={acc.avatar}
                              alt={acc.name}
                              className="h-8 w-8 rounded-full bg-slate-900 border border-[var(--color-obsidian-border)] p-0.5 shrink-0"
                            />
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-[var(--foreground)] block leading-tight">{acc.name}</span>
                              <span className="text-[11px] text-[var(--foreground)]/70 block truncate mt-0.5">{acc.email}</span>
                            </div>
                          </button>
                        ))}

                        {/* USE ANOTHER ACCOUNT BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            setGoogleError("");
                            setGoogleEmailInput("");
                            setGoogleChooserStep("enter_email");
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[var(--foreground)]/[0.05] active:bg-[var(--foreground)]/[0.10] rounded-md transition-colors border-t border-[var(--color-obsidian-border)] mt-1 text-left"
                        >
                          <div className="h-8 w-8 rounded-full bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] flex items-center justify-center text-[var(--foreground)]/80 shrink-0">
                            <User className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[var(--foreground)]/90 block">Use another account</span>
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
                      <h4 className="text-xl text-[var(--foreground)] font-medium text-center">Sign in</h4>
                      <p className="text-[var(--foreground)]/80 text-xs text-center mt-1 mb-8">with your Google Account to continue to MemoMind</p>

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
                              className="w-full bg-[var(--color-obsidian-dark)] border border-white/15 rounded-md px-4 py-3 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-blue-500 font-sans"
                              autoFocus
                            />
                          </div>

                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="Email or phone number"
                              value={googleEmailInput}
                              onChange={(e) => setGoogleEmailInput(e.target.value)}
                              className="w-full bg-[var(--color-obsidian-dark)] border border-white/15 rounded-md px-4 py-3 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-blue-500 font-sans"
                            />
                            <button 
                              type="button"
                              className="text-xs text-blue-400 hover:text-blue-300 font-semibold mt-2 block"
                            >
                              Forgot email?
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-[var(--foreground)]/70 leading-relaxed">
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
                            className="text-xs bg-[#1a73e8] hover:bg-blue-600 active:bg-blue-700 text-[var(--foreground)] font-bold px-6 py-2.5 rounded transition-colors shadow"
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
                      <h4 className="text-xl text-[var(--foreground)] font-medium text-center">Welcome</h4>
                      <div className="flex items-center justify-center gap-1.5 mt-2.5 mb-8">
                        <div className="px-2.5 py-1 rounded-full bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] text-xs text-[var(--foreground)]/80 flex items-center gap-1">
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
                            className="w-full bg-[var(--color-obsidian-dark)] border border-white/15 rounded-md px-4 py-3 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-blue-500 font-sans"
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
                            className="text-xs bg-[#1a73e8] hover:bg-blue-600 active:bg-blue-700 text-[var(--foreground)] font-bold px-6 py-2.5 rounded transition-colors shadow"
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
                <div className="text-center text-[10px] text-[var(--foreground)]/50 leading-relaxed border-t border-[var(--color-obsidian-border)] pt-4 mt-6">
                  To continue, Google will share your name, email address, profile picture, and choice of theme preferences with MemoMind.
                </div>
              )}

              {/* Sub-footer compliance links */}
              <div className="flex justify-between text-[11px] text-[var(--foreground)]/50 mt-6 pt-4 border-t border-[var(--color-obsidian-border)] w-full">
                <span className="cursor-pointer hover:text-[var(--foreground)]/70">English (United States)</span>
                <div className="flex gap-3">
                  <span className="cursor-pointer hover:text-[var(--foreground)]/70">Help</span>
                  <span className="cursor-pointer hover:text-[var(--foreground)]/70">Privacy</span>
                  <span className="cursor-pointer hover:text-[var(--foreground)]/70">Terms</span>
                </div>
              </div>

              {/* Native window cancel trigger */}
              <button
                type="button"
                onClick={() => setShowGoogleChooser(false)}
                className="absolute top-4 right-4 text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors"
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
            className="fixed inset-0 bg-[var(--background)]/90 backdrop-blur-xl z-50 flex items-center justify-center flex-col p-4 text-left"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-md w-full border border-[var(--color-obsidian-border)] bg-[var(--color-obsidian-dark)] p-6 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-[#eca72c] via-[#44355b] to-[#ee5622] animate-pulse" />
              
              <div className="flex items-center gap-3 border-b border-[var(--color-obsidian-border)] pb-4 mb-4">
                <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center border border-[var(--color-obsidian-border)] shrink-0 shadow-sm">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--foreground)]">Google Accounts Sign-In</h4>
                  <p className="text-[10px] text-[var(--foreground)]/50 font-mono">accounts.google.com/oauth/signin</p>
                </div>
              </div>

              <div className="space-y-4 py-3 flex flex-col items-center justify-center">
                {/* Dynamic Loader */}
                <div className="relative h-12 w-12 flex items-center justify-center mb-1">
                  <div className="h-10 w-10 rounded-full border-2 border-[var(--color-obsidian-border)] border-t-[#eca72c] animate-spin" />
                  <div className="absolute h-4 w-4 bg-[#44355b] rounded-full animate-ping" />
                </div>
                {selectedOAuthUser && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-obsidian-border)] bg-[var(--foreground)]/[0.05] mb-2">
                    <img 
                      src={selectedOAuthUser.avatar} 
                      alt={selectedOAuthUser.name} 
                      className="h-5 w-5 rounded-full bg-slate-900 border border-[var(--color-obsidian-border)]"
                    />
                    <span className="text-xs text-[var(--foreground)] font-medium">{selectedOAuthUser.name}</span>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--foreground)]">Connecting Secure Google Session...</p>
                  <p className="text-xs text-[var(--foreground)]/70 mt-1">Authorizing MemoMind memory graph scopes.</p>
                </div>
              </div>

              <div className="border-t border-[var(--color-obsidian-border)] pt-3.5 mt-4 flex justify-between text-[9px] font-mono text-[var(--foreground)]/50">
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



