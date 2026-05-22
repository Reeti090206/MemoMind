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
  loginWithGoogle: (profileKey?: string, customUser?: UserProfile) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithCredentials: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
  const loginWithGoogle = async (profileKey?: string, customUser?: UserProfile) => {
    setIsLoading(true);
    
    // Simulate a minor network request or Google OAuth redirect authorization latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    let selectedUser: UserProfile;

    if (profileKey && SEED_PROFILES[profileKey]) {
      selectedUser = SEED_PROFILES[profileKey];
    } else if (customUser) {
      selectedUser = customUser;
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

  // Credentials Login
  const loginWithCredentials = async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const registeredUsersStr = localStorage.getItem("meetgraph_registered_users");
    let registeredUsers = registeredUsersStr ? JSON.parse(registeredUsersStr) : {};

    const allUsers = {
      "aman.g@meetgraph.ai": { ...SEED_PROFILES.aman, password: "password" },
      "reeti.s@meetgraph.ai": { ...SEED_PROFILES.reeti, password: "password" },
      "sarah.j@meetgraph.ai": { ...SEED_PROFILES.sarah, password: "password" },
      ...registeredUsers
    };

    const targetUser = allUsers[email.toLowerCase().trim()];
    if (!targetUser) {
      setIsLoading(false);
      return { success: false, error: "No account found with this email." };
    }

    if (targetUser.password !== password) {
      setIsLoading(false);
      return { success: false, error: "Incorrect password. Please try again." };
    }

    const { password: _, ...userProfile } = targetUser;
    setUser(userProfile);
    localStorage.setItem("meetgraph_session", JSON.stringify(userProfile));
    setIsLoading(false);
    return { success: true };
  };

  // Credentials Sign Up
  const signUpWithCredentials = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const emailKey = email.toLowerCase().trim();

    const registeredUsersStr = localStorage.getItem("meetgraph_registered_users");
    let registeredUsers = registeredUsersStr ? JSON.parse(registeredUsersStr) : {};

    if (registeredUsers[emailKey] || ["aman.g@meetgraph.ai", "reeti.s@meetgraph.ai", "sarah.j@meetgraph.ai"].includes(emailKey)) {
      setIsLoading(false);
      return { success: false, error: "An account with this email already exists." };
    }

    const randomAvatarSeed = name.replace(/\s+/g, "");
    const newUser = {
      name,
      email: emailKey,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${randomAvatarSeed}`,
      role: "Workspace Contributor",
      color: "from-cyber-purple to-cyber-cyan",
      password
    };

    registeredUsers[emailKey] = newUser;
    localStorage.setItem("meetgraph_registered_users", JSON.stringify(registeredUsers));

    const { password: _, ...userProfile } = newUser;
    setUser(userProfile);
    localStorage.setItem("meetgraph_session", JSON.stringify(userProfile));
    setIsLoading(false);
    return { success: true };
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
        loginWithCredentials,
        signUpWithCredentials,
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
