"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth, hasFirebaseConfig } from "@/lib/firebase";
import { 
  signInWithPhoneNumber, 
  signOut, 
  onAuthStateChanged,
  ConfirmationResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup
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
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (profileDetails: { name: string; email: string; role: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
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
  const isInitialCheck = useRef(true);

  useEffect(() => {
    if (hasFirebaseConfig && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setIsLoading(true);
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken(true);
            const phone = firebaseUser.phoneNumber || "";
            const email = firebaseUser.email || firebaseUser.providerData?.[0]?.email || "";
            const name = firebaseUser.displayName || firebaseUser.providerData?.[0]?.displayName || "";

            // 60 second timeout — Render free tier can take up to 60s to cold start
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            let res: Response | null = null;
            try {
              res = await fetch("http://127.0.0.1:8000/api/auth/firebase-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_token: idToken, phone, email, name }),
                signal: controller.signal,
              });
            } finally {
              clearTimeout(timeoutId);
            }

            if (res && res.ok) {
              const data = await res.json();
              setUser(data.user);
              if (!isInitialCheck.current) {
                await triggerWelcomeEmail(data.user.email, data.user.name);
              }
            } else {
              console.error("Backend failed to verify Firebase session");
              setUser(null);
            }
          } catch (err: any) {
            if (err?.name === "AbortError") {
              console.error("Backend session request timed out (60s). Server may be cold-starting.");
            } else {
              console.error("Failed to sync Firebase session:", err);
            }
            setUser(null);
          } finally {
            isInitialCheck.current = false;
          }
        } else {
          setUser(null);
          isInitialCheck.current = false;
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

  // Send OTP — always falls back to mock mode if Firebase phone auth isn't available or fails
  const sendOtp = async (phoneNumber: string, appVerifier?: any) => {
    // Helper: call mock backend OTP endpoint
    const sendMockOtp = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneNumber }),
        });
        if (res.ok) {
          const j = await res.json().catch(() => ({}));
          return { success: true, method: j.method || "console", code: j.code };
        }
      } catch (e) {
        console.warn("Mock OTP backend unreachable, using hardcoded fallback.");
      }
      return { success: true, method: "console", code: "123456" };
    };

    try {
      if (hasFirebaseConfig && auth && appVerifier) {
        // Attempt real Firebase Phone Auth
        const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(result);
        return { success: true, method: "firebase" };
      } else {
        // No Firebase or no verifier — go straight to mock
        return await sendMockOtp();
      }
    } catch (err: any) {
      // Firebase phone auth failed (e.g. billing-not-enabled) — fall back to mock mode silently
      console.warn("Firebase phone auth failed, falling back to mock OTP:", err.message);
      return await sendMockOtp();
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
          await triggerWelcomeEmail(data.user.email, data.user.name);
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

  // Google OAuth Login — delegates to Firebase when configured
  const loginWithGoogle = async (_profileKey?: string, _customUser?: UserProfile) => {
    // Always go through Firebase OAuth when configured
    if (hasFirebaseConfig && auth) {
      return loginWithOAuth("google");
    }
    // Dev-only fallback: block access without credentials in local sandbox
    throw new Error("Firebase is not configured. Please set up Firebase credentials to enable Google login.");
  };

  // Generic OAuth Login (Google, GitHub)
  const loginWithOAuth = async (provider: string, profileKey?: string, customUser?: UserProfile) => {
    try {
      if (hasFirebaseConfig && auth && (provider === "google" || provider === "github")) {
        const { GithubAuthProvider, GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
        let firebaseProvider;
        if (provider === "github") {
          firebaseProvider = new GithubAuthProvider();
          firebaseProvider.addScope("user:email");
          firebaseProvider.setCustomParameters({ prompt: "consent" });
        } else {
          firebaseProvider = new GoogleAuthProvider();
          firebaseProvider.addScope("email");
          firebaseProvider.addScope("profile");
          firebaseProvider.setCustomParameters({ prompt: "select_account" });
        }

        // Just trigger the popup — onAuthStateChanged handles backend session sync
        await signInWithPopup(auth, firebaseProvider);
        // isLoading will be set by onAuthStateChanged listener automatically
        return;
      }
    } catch (err: any) {
      setIsLoading(false);
      console.warn("Firebase OAuth failed:", err);
      if (hasFirebaseConfig) {
        throw err;
      }
    }

    if (hasFirebaseConfig) {
      return;
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
    if (hasFirebaseConfig && auth) {
      try {
        setIsLoading(true);
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken();
        const res = await fetch("http://127.0.0.1:8000/api/auth/firebase-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken, email, name: credential.user.displayName || "Email User" }),
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setIsLoading(false);
          return { success: true };
        } else {
          setIsLoading(false);
          const errorData = await res.json().catch(() => ({}));
          return { success: false, error: errorData.detail || "Server synchronization failed." };
        }
      } catch (err: any) {
        setIsLoading(false);
        let errorMsg = err.message || "Authentication failed.";
        if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential" || err.code === "auth/invalid-email") {
          errorMsg = "Incorrect password. Please try again.";
        } else if (err.code === "auth/user-not-found") {
          errorMsg = "No account found with this email.";
        }
        return { success: false, error: errorMsg };
      }
    } else {
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
    }
  };

  // Credentials Sign Up
  const signUpWithCredentials = async (name: string, email: string, password: string) => {
    if (hasFirebaseConfig && auth) {
      try {
        setIsLoading(true);
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        const idToken = await credential.user.getIdToken(true);
        const res = await fetch("http://127.0.0.1:8000/api/auth/firebase-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken, email, name }),
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setIsLoading(false);
          return { success: true };
        } else {
          setIsLoading(false);
          const errorData = await res.json().catch(() => ({}));
          return { success: false, error: errorData.detail || "Server synchronization failed." };
        }
      } catch (err: any) {
        setIsLoading(false);
        let errorMsg = err.message || "Failed to create account.";
        if (err.code === "auth/email-already-in-use") {
          errorMsg = "An account with this email already exists.";
        } else if (err.code === "auth/weak-password") {
          errorMsg = "Password must be at least 6 characters long.";
        } else if (err.code === "auth/invalid-email") {
          errorMsg = "Please enter a valid email address.";
        }
        return { success: false, error: errorMsg };
      }
    } else {
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
    }
  };

  // Forgot Password using Firebase
  const forgotPassword = async (email: string) => {
    if (hasFirebaseConfig && auth) {
      try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
      } catch (err: any) {
        let errorMsg = err.message || "Failed to send reset link.";
        if (err.code === "auth/user-not-found") {
          errorMsg = "No account found with this email address.";
        } else if (err.code === "auth/invalid-email") {
          errorMsg = "Please enter a valid email address.";
        }
        return { success: false, error: errorMsg };
      }
    } else {
      return { success: true };
    }
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

  const updateUserProfile = async (profileDetails: { name: string; email: string; role: string; avatar?: string }) => {
    if (!user) return { success: false, error: "No user is currently logged in." };
    
    try {
      const res = await fetch("http://127.0.0.1:8000/api/users/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_email: user.email,
          name: profileDetails.name,
          email: profileDetails.email,
          role: profileDetails.role,
          avatar: profileDetails.avatar || user.avatar
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = data.user;
        
        localStorage.setItem("MemoMind_session", JSON.stringify(updatedUser));
        
        try {
          const registeredUsersStr = localStorage.getItem("MemoMind_registered_users");
          if (registeredUsersStr) {
            let registeredUsers = JSON.parse(registeredUsersStr);
            const oldEmailKey = user.email.toLowerCase().trim();
            const newEmailKey = profileDetails.email.toLowerCase().trim();
            
            if (registeredUsers[oldEmailKey]) {
              const oldUserData = registeredUsers[oldEmailKey];
              const updatedRegisteredUser = {
                ...oldUserData,
                name: profileDetails.name,
                email: newEmailKey,
                role: profileDetails.role,
                avatar: profileDetails.avatar || oldUserData.avatar
              };
              
              if (oldEmailKey !== newEmailKey) {
                delete registeredUsers[oldEmailKey];
              }
              registeredUsers[newEmailKey] = updatedRegisteredUser;
              localStorage.setItem("MemoMind_registered_users", JSON.stringify(registeredUsers));
            }
          }
        } catch (e) {
          console.warn("Failed to update registered users store:", e);
        }

        setUser(updatedUser);
        return { success: true };
      } else {
        // Backend returned an error (e.g. 404 when route not yet loaded) — apply local-only update
        console.warn("Backend profile update returned", res.status, "— applying local-only update");
        const updatedUser: UserProfile = {
          ...user,
          name: profileDetails.name,
          email: profileDetails.email,
          role: profileDetails.role,
          avatar: profileDetails.avatar || user.avatar
        };
        localStorage.setItem("MemoMind_session", JSON.stringify(updatedUser));
        try {
          const registeredUsersStr = localStorage.getItem("MemoMind_registered_users");
          if (registeredUsersStr) {
            let registeredUsers = JSON.parse(registeredUsersStr);
            const oldEmailKey = user.email.toLowerCase().trim();
            const newEmailKey = profileDetails.email.toLowerCase().trim();
            if (registeredUsers[oldEmailKey]) {
              const oldUserData = registeredUsers[oldEmailKey];
              const updatedRegisteredUser = {
                ...oldUserData,
                name: profileDetails.name,
                email: newEmailKey,
                role: profileDetails.role,
                avatar: profileDetails.avatar || oldUserData.avatar
              };
              if (oldEmailKey !== newEmailKey) delete registeredUsers[oldEmailKey];
              registeredUsers[newEmailKey] = updatedRegisteredUser;
              localStorage.setItem("MemoMind_registered_users", JSON.stringify(registeredUsers));
            }
          }
        } catch (e) {}
        setUser(updatedUser);
        return { success: true };
      }
    } catch (err: any) {
      console.warn("Backend update failed, falling back to local-only update:", err);
      const updatedUser = {
        ...user,
        name: profileDetails.name,
        email: profileDetails.email,
        role: profileDetails.role,
        avatar: profileDetails.avatar || user.avatar
      };
      
      localStorage.setItem("MemoMind_session", JSON.stringify(updatedUser));
      
      try {
        const registeredUsersStr = localStorage.getItem("MemoMind_registered_users");
        if (registeredUsersStr) {
          let registeredUsers = JSON.parse(registeredUsersStr);
          const oldEmailKey = user.email.toLowerCase().trim();
          const newEmailKey = profileDetails.email.toLowerCase().trim();
          if (registeredUsers[oldEmailKey]) {
            const oldUserData = registeredUsers[oldEmailKey];
            const updatedRegisteredUser = {
              ...oldUserData,
              name: profileDetails.name,
              email: newEmailKey,
              role: profileDetails.role,
              avatar: profileDetails.avatar || oldUserData.avatar
            };
            if (oldEmailKey !== newEmailKey) {
              delete registeredUsers[oldEmailKey];
            }
            registeredUsers[newEmailKey] = updatedRegisteredUser;
            localStorage.setItem("MemoMind_registered_users", JSON.stringify(registeredUsers));
          }
        }
      } catch (e) {}

      setUser(updatedUser);
      return { success: true };
    }
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
        forgotPassword,
        logout,
        updateUserProfile,
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
