"use client";

import React from "react";
import { useAuth } from "./AuthProvider";
import Sidebar from "./Sidebar";
import GlassLoginWall from "./GlassLoginWall";
import { Network } from "lucide-react";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#07070a] flex flex-col items-center justify-center text-white z-50">
        <div className="relative h-14 w-14 flex items-center justify-center mb-4">
          <div className="h-10 w-10 rounded-full border-2 border-white/5 border-t-cyber-purple animate-spin" />
          <Network className="absolute h-5 w-5 text-cyber-cyan animate-pulse" />
        </div>
        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest animate-pulse">
          Retrieving MeetGraph Memory Index...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <GlassLoginWall />;
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Page Content Workspace */}
      <main className="flex-1 overflow-y-auto flex flex-col relative h-full">
        {/* Subtle Neon Radial Glow Lighting */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyber-purple/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-4000" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyber-cyan/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-3000" />
        
        {/* Scrollable Container Wrapper */}
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
