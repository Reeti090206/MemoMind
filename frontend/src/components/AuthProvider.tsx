"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, hasFirebaseConfig } from "@/lib/firebase";
import { 
  signInWithPhoneNumber, 
  signOut, 
  onAuthStateChanged,
  ConfirmationResult
} from "firebase/auth";

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: string;
  color: string;
}

export const SEED_PROFILES: Record<string, UserProfile> = {};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (profileKey?: string, customUser?: UserProfile) => Promise<void>;
  loginWithOAuth: (provider: string, profileKey?: string, customUser?: UserProfile) => Promise<void>;
  loginWithPhone: (phoneNumber: string, verificationCode: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (phoneNumber: string, appVerifier?: any) => Promise<{ success: boolean; error?: string; method?: string; code?: string }>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithCredentials: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isClerkEnabled: boolean;
  welcomeEmail: { html: string; filePath: string } | null;
  clearWelcomeEmail: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [welcomeEmail, setWelcomeEmail] = useState<{ html: string; filePath: string } | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Check if Clerk env variables are configured
  const isClerkEnabled =
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "";

  // Firebase auth state listener + Mock session restoration
  useEffect(() => {
    if (hasFirebaseConfig && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setIsLoading(true);
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken(true);
            const phone = firebaseUser.phoneNumber || "";

            const res = await fetch("http://127.0.0.1:8000/api/auth/firebase-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_token: idToken, phone }),
            });

            if (res.ok) {
              const data = await res.json();
              setUser(data.user);
              if (data.is_new) {
                await triggerWelcomeEmail(data.user.email, data.user.name);
              }
            } else {
              console.error("Backend failed to verify Firebase session");
              setUser(null);
            }
          } catch (err) {
            console.error("Failed to sync Firebase session:", err);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local Sandbox Mock Session Loader
      try {
        const stored = localStorage.getItem("MemoMind_session");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (err) {
        console.warn("Failed to load local sandbox session:", err);
      }
      setIsLoading(false);
    }
  }, []);

  const triggerWelcomeEmail = async (email: string, name: string) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/welcome-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }),
      });
      if (res.ok) {
        const data = await res.json();
        setWelcomeEmail({ html: data.html_content, filePath: data.file_path });
        console.log("Welcome email triggered successfully.");
      } else {
        console.warn("Failed to trigger welcome email via API.");
      }
    } catch (err) {
      console.warn("Failed to trigger welcome email via API:", err);
    }
  };

  // Send OTP
  const sendOtp = async (phoneNumber: string, appVerifier?: any) => {
    try {
      if (hasFirebaseConfig && auth && appVerifier) {
        // Real Firebase Phone Auth code dispatch
        const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(result);
        return { success: true, method: "firebase" };
      } else {
        // Local Mock Mode fallback
        const res = await fetch("http://127.0.0.1:8000/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneNumber }),
        });
        if (res.ok) {
          const j = await res.json().catch(() => ({}));
          return { success: true, method: j.method || "console", code: j.code };
        }
        return { success: true, method: "console", code: "123456" };
      }
    } catch (err: any) {
      console.warn("sendOtp error, falling back to local simulation:", err);
      return { success: false, error: err.message || "Failed to send verification code." };
    }
  };

  // Phone Login verification
  const loginWithPhone = async (phoneNumber: string, verificationCode: string) => {
    try {
      if (hasFirebaseConfig && auth && confirmationResult) {
        // Real Firebase Phone Auth OTP verification
        const credential = await confirmationResult.confirm(verificationCode);
        const idToken = await credential.user.getIdToken();

        const res = await fetch("http://127.0.0.1:8000/api/auth/firebase-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken, phone: phoneNumber }),
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.is_new) {
            await triggerWelcomeEmail(data.user.email, data.user.name);
          }
          return { success: true };
        } else {
          const errorData = await res.json().catch(() => ({}));
          return { success: false, error: errorData.detail || "Server sync failed." };
        }
      } else {
        // Mock Mode verification
        const res = await fetch("http://127.0.0.1:8000/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneNumber, code: verificationCode }),
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem("MemoMind_session", JSON.stringify(data.user));
          if (data.is_new) {
            await triggerWelcomeEmail(data.user.email, data.user.name);
          }
          return { success: true };
        } else {
          const errorData = await res.json().catch(() => ({}));
          return { success: false, error: errorData.detail || "Incorrect code. Try again." };
        }
      }
    } catch (err: any) {
      console.warn("loginWithPhone error:", err);
      return { success: false, error: err.message || "Invalid verification code." };
    }
  };

  const clearWelcomeEmail = () => {
    setWelcomeEmail(null);
  };

  // Standard Login (Google OAuth simulator / Sandbox Profile)
  const loginWithGoogle = async (profileKey?: string, customUser?: UserProfile) => {
    let selectedUser: UserProfile;

    if (profileKey && SEED_PROFILES[profileKey]) {
      selectedUser = SEED_PROFILES[profileKey];
    } else if (customUser) {
      selectedUser = customUser;
    } else {
      selectedUser = {
        name: "Developer Guest",
        email: "guest.developer@MemoMind.ai",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Guest",
        role: "Workspace Administrator",
        color: "from-gray-400 to-slate-600",
      };
    }

    // Persist Mock session
    if (!hasFirebaseConfig) {
      localStorage.setItem("MemoMind_session", JSON.stringify(selectedUser));
    }

    triggerWelcomeEmail(selectedUser.email, selectedUser.name);
    setUser(selectedUser);
  };

  // Generic OAuth Login (Google, Apple, GitHub, Hugging Face)
  const loginWithOAuth = async (provider: string, profileKey?: string, customUser?: UserProfile) => {
    try {
      if (hasFirebaseConfig && auth && (provider === "google" || provider === "github")) {
        const { GithubAuthProvider, GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
        let firebaseProvider;
        if (provider === "github") {
          firebaseProvider = new GithubAuthProvider();
        } else {
          firebaseProvider = new GoogleAuthProvider();
        }
        
        setIsLoading(true);
        const result = await signInWithPopup(auth, firebaseProvider);
        const idToken = await result.user.getIdToken();
        const email = result.user.email || "";
        const name = result.user.displayName || "OAuth User";
        const phone = result.user.phoneNumber || "";

        const res = await fetch("http://127.0.0.1:8000/api/auth/firebase-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken, phone, email, name }),
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.is_new) {
            await triggerWelcomeEmail(data.user.email, data.user.name);
          }
        } else {
          console.error("Backend OAuth verification failed");
        }
        setIsLoading(false);
        return;
      }
    } catch (err) {
      setIsLoading(false);
      console.warn("Firebase OAuth failed, falling back to local simulation:", err);
    }

    // Local Mock Mode simulation
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    let selectedUser: UserProfile;

    if (profileKey && SEED_PROFILES[profileKey]) {
      selectedUser = SEED_PROFILES[profileKey];
    } else if (customUser) {
      selectedUser = customUser;
    } else {
      let name = "OAuth User";
      let email = `oauth.user@MemoMind.ai`;
      let avatarSeed = "oauth";
      let role = "Collaborator";
      let color = "from-gray-400 to-slate-600";

      if (provider === "apple") {
        name = "Apple Developer";
        email = "apple.dev@MemoMind.ai";
        avatarSeed = "Apple";
        role = "iOS Integration Specialist";
        color = "from-zinc-200 to-zinc-600";
      } else if (provider === "github") {
        name = "GitHub Contributor";
        email = "github.dev@MemoMind.ai";
        avatarSeed = "Github";
        role = "DevOps Engineer";
        color = "from-[#44355b] to-[#221e22]";
      } else if (provider === "huggingface") {
        name = "HuggingFace Researcher";
        email = "hf.research@MemoMind.ai";
        avatarSeed = "HuggingFace";
        role = "AI/ML Engineer";
        color = "from-amber-400 to-amber-600";
      }

      selectedUser = {
        name,
        email,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`,
        role,
        color,
      };
    }

    // Persist Mock session
    if (!hasFirebaseConfig) {
      localStorage.setItem("MemoMind_session", JSON.stringify(selectedUser));
    }

    triggerWelcomeEmail(selectedUser.email, selectedUser.name);
    setUser(selectedUser);
    setIsLoading(false);
  };

  // Credentials Login
  const loginWithCredentials = async (email: string, password: string) => {
    const registeredUsersStr = localStorage.getItem("MemoMind_registered_users");
    let registeredUsers = registeredUsersStr ? JSON.parse(registeredUsersStr) : {};

    const allUsers = {
      ...registeredUsers,
    };

    const targetUser = allUsers[email.toLowerCase().trim()];
    if (!targetUser) {
      return { success: false, error: "No account found with this email." };
    }

    if (targetUser.password !== password) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    const { password: _, ...userProfile } = targetUser;
    
    // Persist Mock session
    if (!hasFirebaseConfig) {
      localStorage.setItem("MemoMind_session", JSON.stringify(userProfile));
    }

    triggerWelcomeEmail(userProfile.email, userProfile.name);
    setUser(userProfile);
    return { success: true };
  };

  // Credentials Sign Up
  const signUpWithCredentials = async (name: string, email: string, password: string) => {
    const emailKey = email.toLowerCase().trim();

    const registeredUsersStr = localStorage.getItem("MemoMind_registered_users");
    let registeredUsers = registeredUsersStr ? JSON.parse(registeredUsersStr) : {};

    if (registeredUsers[emailKey]) {
      return { success: false, error: "An account with this email already exists." };
    }

    const randomAvatarSeed = name.replace(/\s+/g, "");
    const newUser = {
      name,
      email: emailKey,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${randomAvatarSeed}`,
      role: "Workspace Contributor",
      color: "from-cyber-purple to-cyber-cyan",
      password,
    };

    registeredUsers[emailKey] = newUser;
    localStorage.setItem("MemoMind_registered_users", JSON.stringify(registeredUsers));

    const { password: _, ...userProfile } = newUser;
    
    // Persist Mock session
    if (!hasFirebaseConfig) {
      localStorage.setItem("MemoMind_session", JSON.stringify(userProfile));
    }

    triggerWelcomeEmail(userProfile.email, userProfile.name);
    setUser(userProfile);
    return { success: true };
  };

  // Sign out / clear state
  const logout = async () => {
    setIsLoading(true);
    try {
      if (hasFirebaseConfig && auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn("Firebase sign out failed:", err);
    }
    setUser(null);
    localStorage.removeItem("MemoMind_session");
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithOAuth,
        loginWithPhone,
        sendOtp,
        loginWithCredentials,
        signUpWithCredentials,
        logout,
        isClerkEnabled,
        welcomeEmail,
        clearWelcomeEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
