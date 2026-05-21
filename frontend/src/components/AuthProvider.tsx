"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: string;
  color: string;
}

export const SEED_PROFILES: Record<string, UserProfile> = {
  aman: {
    name: "Aman Gupta",
    email: "aman.g@meetgraph.ai",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Aman",
    role: "Backend Architect",
    color: "from-cyber-cyan to-blue-500",
  },
  reeti: {
    name: "Reeti Sharma",
    email: "reeti.s@meetgraph.ai",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Reeti",
    role: "Frontend Engineer",
    color: "from-cyber-purple to-pink-500",
  },
  sarah: {
    name: "Sarah Jenkins",
    email: "sarah.j@meetgraph.ai",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sarah",
    role: "Lead Product Manager",
    color: "from-cyber-emerald to-cyber-cyan",
  },
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (profileKey?: string) => Promise<void>;
  logout: () => void;
  isClerkEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if Clerk env variables are configured
  const isClerkEnabled = 
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "";

  // Load session from localStorage on client-side mount
  useEffect(() => {
    const savedSession = localStorage.getItem("meetgraph_session");
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (err) {
        localStorage.removeItem("meetgraph_session");
      }
    }
    setIsLoading(false);
  }, []);

  // Standard Login (Google OAuth simulator / Sandbox Profile)
  const loginWithGoogle = async (profileKey?: string) => {
    setIsLoading(true);
    
    // Simulate a minor network request or Google OAuth redirect authorization latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    let selectedUser: UserProfile;

    if (profileKey && SEED_PROFILES[profileKey]) {
      selectedUser = SEED_PROFILES[profileKey];
    } else {
      // General Google OAuth sign-in fallback
      selectedUser = {
        name: "Developer Guest",
        email: "guest.developer@meetgraph.ai",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Guest",
        role: "Workspace Administrator",
        color: "from-gray-400 to-slate-600",
      };
    }

    setUser(selectedUser);
    localStorage.setItem("meetgraph_session", JSON.stringify(selectedUser));
    setIsLoading(false);
  };

  // Sign out / clear state
  const logout = () => {
    setUser(null);
    localStorage.removeItem("meetgraph_session");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        logout,
        isClerkEnabled,
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
