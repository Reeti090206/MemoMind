"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { 
  Network, 
  Layers, 
  HelpCircle, 
  Calendar, 
  User, 
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Info,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Pre-calculated force coordinates for stable rendering & interactive feeling
// Empty graph initialization
const GRAPH_NODES: any[] = [];
const GRAPH_EDGES: any[] = [];

const pageContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 90, 
      damping: 14 
    } 
  }
};

export default function MemoryGraph() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  
  // Selection filter states
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("all");

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Load list of meetings for selector dropdown
  useEffect(() => {
    async function loadMeetings() {
      try {
        const url = user?.email
          ? `http://127.0.0.1:8000/api/meetings?user_email=${encodeURIComponent(user.email)}`
          : "http://127.0.0.1:8000/api/meetings";
        const res = await fetch(url);
        if (res.ok) {
          const list = await res.json();
          setMeetingsList(list);
        }
      } catch (err) {
        console.error("Failed to load meetings list", err);
      }
    }
    loadMeetings();
  }, [user]);

  // Fetch filtered graph nodes and edges
  useEffect(() => {
    async function loadGraphData() {
      try {
        const baseUrl = selectedMeetingId === "all"
          ? "http://127.0.0.1:8000/api/graph"
          : `http://127.0.0.1:8000/api/graph?meeting_id=${selectedMeetingId}`;
        const url = user?.email
          ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}user_email=${encodeURIComponent(user.email)}`
          : baseUrl;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const mappedNodes = data.nodes.map((n: any, idx: number) => {
            const count = data.nodes.length;
            const angle = (idx / count) * 2 * Math.PI;
            const radius = 150;
            const cx = 360;
            const cy = 230;
            return {
              ...n,
              x: cx + radius * Math.cos(angle),
              y: cy + radius * Math.sin(angle)
            };
          });
          setNodes(mappedNodes);
          setEdges(data.edges);
          setSelectedNode(null); // Reset inspector selection on view switch
        }
      } catch (err) {
        console.error("Failed to load memory graph", err);
      }
    }
    loadGraphData();
  }, [selectedMeetingId, user]);

  // SVG Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "meeting": return "fill-cyber-purple stroke-cyber-purple/40";
      case "decision": return "fill-cyber-cyan stroke-cyber-cyan/40";
      case "task": return "fill-cyber-emerald stroke-cyber-emerald/40";
      case "owner": return "fill-cyber-rose stroke-cyber-rose/40";
      default: return "fill-amber-500 stroke-amber-500/40";
    }
  };

  return (
    <motion.div 
      variants={pageContainerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 h-full flex flex-col justify-between"
    >
      
      {/* Upper header */}
      <motion.div 
        variants={fadeUpVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Organizational Memory Graph</h2>
          <p className="text-[var(--foreground)]/70 text-sm mt-0.5">
            Interactive spatial trace map displaying Meeting → Decision → Task overrides and owner connections.
          </p>
        </div>

        {/* Meeting Filter Dropdown Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono font-bold uppercase text-[var(--foreground)]/70">Trace View:</label>
          <select
            value={selectedMeetingId}
            onChange={(e) => setSelectedMeetingId(e.target.value)}
            className="bg-black/65 border border-[var(--color-obsidian-border)] rounded-xl px-4 py-2.5 text-xs font-bold text-[var(--foreground)] focus:outline-none focus:border-cyber-purple transition-all cursor-pointer min-w-[220px]"
          >
            <option value="all">Global Workspace Overview</option>
            {meetingsList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch flex-1">
        
        {/* SVG Graph visualizer canvas */}
        <motion.div 
          variants={fadeUpVariants}
          className="lg:col-span-3 glass-panel rounded-2xl relative min-h-[500px] overflow-hidden flex flex-col justify-between select-none border border-obsidian-border bg-obsidian-dark/20"
        >
          
          {/* Legend widget */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-4 left-4 p-3 bg-obsidian-dark/95 border border-obsidian-border rounded-xl flex flex-wrap gap-3 z-10 text-[9px] font-mono font-bold uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyber-purple shadow-[0_0_8px_#eca72c]" /> Meetings</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-cyber-cyan shadow-[0_0_8px_#ee5622]" /> Decisions</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyber-emerald shadow-[0_0_8px_#44355b]" /> Tasks</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyber-rose shadow-[0_0_8px_#ee5622]" /> Members</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-obsidian-medium)] shadow-[0_0_8px_#44355b]" /> Pending</div>
          </motion.div>

          {/* Canvas Controller Zoom widget */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-4 left-4 flex gap-1.5 z-10"
          >
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
              className="h-8 w-8 rounded-lg bg-obsidian-dark border border-obsidian-border text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] flex items-center justify-center font-bold text-xs hover:border-cyber-purple transition-all"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="h-8 w-8 rounded-lg bg-obsidian-dark border border-obsidian-border text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] flex items-center justify-center font-bold text-xs hover:border-cyber-purple transition-all"
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
              className="h-8 w-8 rounded-lg bg-obsidian-dark border border-obsidian-border text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] flex items-center justify-center text-[10px] font-mono font-bold hover:border-cyber-purple transition-all"
              title="Reset view"
            >
              RST
            </button>
          </motion.div>

          {/* Interactive Core Canvas */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex-1 w-full h-full cursor-grab active:cursor-grabbing bg-obsidian-dark/40 relative overflow-hidden"
          >
            <svg
              className="w-full h-full min-h-[500px]"
              viewBox="0 0 720 500"
            >
              {/* Define Arrow Marker heads for overrides paths */}
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ee5622" />
                </marker>
                <marker id="arrow-cyan" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#eca72c" />
                </marker>
              </defs>

              <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
                
                {/* 1. RENDER EDGES/CONNECTIONS */}
                {edges.map((edge, idx) => {
                  const srcNode = nodes.find((n) => n.id === edge.source);
                  const tgtNode = nodes.find((n) => n.id === edge.target);

                  if (!srcNode || !tgtNode) return null;

                  return (
                    <g key={idx}>
                      <motion.line
                        x1={srcNode.x}
                        y1={srcNode.y}
                        x2={tgtNode.x}
                        y2={tgtNode.y}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: "easeOut" as const, delay: idx * 0.02 }}
                        className={`stroke-2 ${
                          edge.isOverride
                            ? "stroke-cyber-rose graph-edge-pulse"
                            : "stroke-obsidian-border"
                        }`}
                        markerEnd={edge.isOverride ? "url(#arrow)" : "url(#arrow-cyan)"}
                      />
                      
                      {/* Pulse dynamic marker indicators for override flow */}
                      {edge.pulse && (
                        <circle
                          r="3"
                          fill={edge.isOverride ? "#ee5622" : "#eca72c"}
                          className="graph-edge-pulse animate-pulse"
                        >
                          <animateMotion
                            dur="2.5s"
                            repeatCount="indefinite"
                            path={`M ${srcNode.x} ${srcNode.y} L ${tgtNode.x} ${tgtNode.y}`}
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* 2. RENDER NODES */}
                {nodes.map((node, idx) => {
                  const isSelected = selectedNode?.id === node.id;
                  
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      className="cursor-pointer group"
                    >
                      {/* Outer glow ring on selection */}
                      <circle
                        r={isSelected ? "18" : "14"}
                        className={`fill-none stroke-2 transition-all duration-300 ${
                          isSelected
                            ? "stroke-cyber-purple/60"
                            : "stroke-transparent group-hover:stroke-white/10"
                        }`}
                      />

                      {/* Main Node base */}
                      {node.type === "decision" ? (
                        /* Diamonds for decisions */
                        <motion.rect
                          x="-8"
                          y="-8"
                          width="16"
                          height="16"
                          transform="rotate(45)"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 180, damping: 10, delay: idx * 0.02 }}
                          className={`stroke-2 transition-all duration-300 ${getNodeColor(node.type)} ${
                            isSelected ? "stroke-white shadow-[0_0_12px_#ee5622]" : "group-hover:stroke-cyber-cyan"
                          }`}
                        />
                      ) : (
                        <motion.circle
                          r="9"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 180, damping: 10, delay: idx * 0.02 }}
                          className={`stroke-2 transition-all duration-300 ${getNodeColor(node.type)} ${
                            isSelected ? "stroke-white shadow-[0_0_12px_#eca72c]" : "group-hover:stroke-white/30"
                          }`}
                        />
                      )}

                      {/* Label Text */}
                      <text
                        y="21"
                        textAnchor="middle"
                        fill="#fff"
                        className="text-[8px] font-mono font-bold pointer-events-none drop-shadow-md select-none tracking-tight fill-gray-200 group-hover:fill-white transition-colors"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

        </motion.div>

        {/* Right drawer / properties panel */}
        <motion.div 
          variants={fadeUpVariants}
          className="space-y-6"
        >
          <div className="p-6 rounded-2xl glass-panel h-full flex flex-col justify-between space-y-4 border border-obsidian-border bg-obsidian-dark/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-cyber-purple" /> Node Inspector
              </h3>
              <p className="text-xs text-[var(--foreground)]/70 mt-0.5">Click any graph element to inspect its memory trace details.</p>
            </div>

            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ type: "spring", stiffness: 120, damping: 16 }}
                  className="flex-1 space-y-4 pt-4 border-t border-obsidian-border/50 relative z-10"
                >
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-mono font-bold border ${
                      selectedNode.type === "meeting"
                        ? "bg-cyber-purple/15 text-cyber-purple border-cyber-purple/20"
                        : selectedNode.type === "decision"
                        ? "bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/20"
                        : selectedNode.type === "task"
                        ? "bg-cyber-emerald/15 text-cyber-emerald border-cyber-emerald/20"
                        : "bg-cyber-rose/15 text-cyber-rose border-cyber-rose/20"
                    }`}>
                      {selectedNode.type} Node
                    </span>
                    <h4 className="font-bold text-[var(--foreground)] text-base mt-2 leading-tight">{selectedNode.label}</h4>
                  </div>

                  <div className="p-3 bg-obsidian-dark/70 border border-obsidian-border rounded-xl text-xs font-light text-[var(--foreground)]/80 leading-relaxed">
                    {selectedNode.details || "No metadata trace recorded."}
                  </div>

                  {selectedNode.type === "decision" && (
                    <div className="space-y-1 text-xs">
                      <p className="text-[var(--foreground)]/50 font-mono text-[9px] tracking-wider font-semibold">STATUS STATE</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold inline-block border ${
                        selectedNode.status === "accepted" ? "bg-cyber-emerald/10 border-cyber-emerald/20 text-cyber-emerald" : "bg-cyber-rose/10 border-cyber-rose/20 text-cyber-rose animate-pulse"
                      }`}>
                        {selectedNode.status || "Accepted"}
                      </span>
                    </div>
                  )}

                  {selectedNode.type === "meeting" && (
                    <Link
                      href={`/meetings?id=${selectedNode.id.split("_")[1]}`}
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-gradient-to-r from-cyber-purple to-cyber-cyan rounded-xl text-xs text-[var(--foreground)] font-bold hover:shadow-[0_0_15px_rgba(238,86,34,0.35)] transition-all duration-300"
                    >
                      Open Meeting feed <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center text-gray-600 text-xs py-12 gap-2 relative z-10"
                >
                  <Info className="h-8 w-8 text-gray-700 animate-pulse" />
                  <span>No node selected.<br />Select a node on the canvas to audit its memory path.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-3 bg-cyber-purple/5 border border-cyber-purple/15 rounded-xl text-[9px] text-[var(--foreground)]/70 font-mono leading-relaxed relative z-10">
              Trace paths show Decision lines override past meetings (marked in red dashed arcs). Pulses show open unresolved items.
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}


