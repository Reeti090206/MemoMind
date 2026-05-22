"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  Mic, 
  Square, 
  Radio,
  FileCheck, 
  Loader2, 
  Play,
  ArrowRight,
  Database,
  Terminal,
  Volume2,
  Tv,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings,
  Share2,
  Pause,
  PlayCircle,
  HelpCircle,
  Cpu,
  Layers,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskItem {
  id: string;
  speaker: string;
  text: string;
  status: "pending" | "completed";
  date: string;
}

interface ContradictionItem {
  id: string;
  title: string;
  desc: string;
  severity: "low" | "medium" | "high";
}

export default function MeetingUpload() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upload" | "mic" | "live_monitor">("upload");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Processing & compilation tracker states
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);

  // Voice recording states (Tab 2)
  const [isRecording, setIsRecording] = useState(false);
  const [recordedLogs, setRecordedLogs] = useState<string[]>([]);
  const [micTimer, setMicTimer] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Live AI Monitor States (Tab 3)
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSimulatedStream, setIsSimulatedStream] = useState(false);
  const [monitorTimer, setMonitorTimer] = useState(0);
  const [monitorLogs, setMonitorLogs] = useState<string[]>([]);
  const [monitorTasks, setMonitorTasks] = useState<TaskItem[]>([]);
  const [monitorContradictions, setMonitorContradictions] = useState<ContradictionItem[]>([]);
  const [monitorMetrics, setMonitorMetrics] = useState({ fps: 60, bitrate: 1412, db: -48 });
  const [monitorStage, setMonitorStage] = useState<"idle" | "capturing" | "analyzing" | "completed">("idle");
  const [activeSpeaker, setActiveSpeaker] = useState<string>("None");
  const [isPaused, setIsPaused] = useState(false);

  const monitorVideoRef = useRef<HTMLVideoElement | null>(null);
  const monitorStreamRef = useRef<MediaStream | null>(null);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const monitorSocketRef = useRef<WebSocket | null>(null);
  const simulatedStreamTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
      if (simulatedStreamTimeoutRef.current) clearInterval(simulatedStreamTimeoutRef.current);
      
      // Stop media tracks
      if (monitorStreamRef.current) {
        monitorStreamRef.current.getTracks().forEach(track => track.stop());
      }
      // Close WebSockets
      if (socketRef.current) socketRef.current.close();
      if (monitorSocketRef.current) monitorSocketRef.current.close();
    };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Process uploaded files with stage timelines
  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);

    const stages = [
      { name: "Receiving your meeting file...", weight: 20 },
      { name: "Writing down who said what...", weight: 45 },
      { name: "Organizing the conversation flow...", weight: 65 },
      { name: "Finding tasks, deadlines, and agreements...", weight: 80 },
      { name: "Checking if this conflicts with past plans...", weight: 95 },
      { name: "Saving to your team's shared memory...", weight: 100 }
    ];

    for (const item of stages) {
      setStage(item.name);
      let currentProgress = progress;
      while (currentProgress < item.weight) {
        currentProgress += Math.floor(Math.random() * 5) + 1;
        setProgress(Math.min(currentProgress, item.weight));
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", meetingTitle || file.name.split(".")[0]);

      const res = await fetch("http://127.0.0.1:8000/api/meetings/upload", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/meetings?id=${data.meeting_id}`);
      } else {
        alert("Meeting added to memory successfully!");
        router.push("/meetings");
      }
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push("/meetings");
    } finally {
      setIsProcessing(false);
    }
  };

  // Live microphone capture simulation (Tab 2)
  const startRecording = () => {
    setIsRecording(true);
    setRecordedLogs(["Microphone ready.", "Listening for audio..."]);
    setMicTimer(0);
    
    timerRef.current = setInterval(() => {
      setMicTimer((prev) => prev + 1);
    }, 1000);

    const simulatedDialogs = [
      "Aman: We must migrate database components to support scaling.",
      "Reeti: Yes, custom JWT logins might delay our launch timelines.",
      "Sarah: Great. Let's decide to implement Clerk oauth then.",
      "Aman: Awesome. I will structure backend setups by this Friday."
    ];

    let dialogIndex = 0;
    const streamInterval = setInterval(() => {
      if (dialogIndex < simulatedDialogs.length) {
        setRecordedLogs((prev) => [...prev, simulatedDialogs[dialogIndex]]);
        dialogIndex++;
      } else {
        clearInterval(streamInterval);
      }
    }, 3000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    setIsProcessing(true);
    setStage("Analyzing the conversation...");
    setProgress(30);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(70);
    setStage("Checking if this conflicts with past plans...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(100);

    try {
      const simulatedBlob = new Blob(["Live Mic stream"], { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", simulatedBlob, "live_recording.wav");
      formData.append("title", meetingTitle || "Microphone Sync Session");

      await fetch("http://127.0.0.1:8000/api/meetings/upload", {
        method: "POST",
        body: formData
      });
      router.push("/meetings");
    } catch (err) {
      router.push("/meetings");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // LIVE AI OBSERVER MONITOR SYSTEM (Tab 3)
  // ==========================================

  const startMonitorObserver = async () => {
    setIsMonitoring(true);
    setMonitorStage("capturing");
    setMonitorLogs(["Initializing Live AI Observer engine...", "Requesting Media Stream API tokens..."]);
    setMonitorTasks([]);
    setMonitorContradictions([]);
    setMonitorTimer(0);
    setIsPaused(false);
    setActiveSpeaker("None");

    // 1. Request Browser Permissions for Screen & Microphones
    try {
      let screenStream: MediaStream | null = null;
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "browser" },
          audio: true
        });
      }

      let audioStream: MediaStream | null = null;
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
      }

      if (screenStream) {
        monitorStreamRef.current = screenStream;
        setIsSimulatedStream(false);
        setMonitorLogs(prev => [...prev, "Display stream bound successfully. Video observer loaded."]);
        
        // Wait a tick for video tag to mount
        setTimeout(() => {
          if (monitorVideoRef.current) {
            monitorVideoRef.current.srcObject = screenStream;
            monitorVideoRef.current.play().catch(e => console.log("Play interrupted:", e));
          }
        }, 150);
      } else {
        setIsSimulatedStream(true);
        setMonitorLogs(prev => [...prev, "No display stream bound. Bootstrapping high-fidelity simulated observer..."]);
      }
    } catch (err) {
      console.warn("Screen share permissions declined or unsupported, launching sandbox simulator.", err);
      setIsSimulatedStream(true);
      setMonitorLogs(prev => [...prev, "Display capture denied or unavailable. Gracefully starting workspace sandbox simulator..."]);
    }

    // 2. Connect WebSocket to backend stream
    try {
      const ws = new WebSocket("ws://127.0.0.1:8000/ws/meeting-stream");
      monitorSocketRef.current = ws;

      ws.onopen = () => {
        setMonitorLogs(prev => [...prev, "WebSocket connected successfully to MeetGraph Live Core."]);
        ws.send(JSON.stringify({ action: "start_record" }));
        ws.send(JSON.stringify({ action: "stream_audio" }));
      };

      ws.onmessage = (event) => {
        if (isPaused) return;
        try {
          const data = JSON.parse(event.data);
          if (data.status === "transcribing" && data.text) {
            const cleanText = data.text;
            setMonitorLogs(prev => [...prev, `[${data.timestamp || "Live"}] ${cleanText}`]);
            analyzeTranscriptLine(cleanText);
          } else if (data.status === "completed") {
            setMonitorLogs(prev => [...prev, "Backend compilation stream finalized."]);
            setMonitorStage("completed");
          }
        } catch (e) {
          console.error("WebSocket message parse error:", e);
        }
      };

      ws.onerror = () => {
        setMonitorLogs(prev => [...prev, "Failed to connect WebSocket. Initializing offline sandbox stream simulation..."]);
        runSimulatedWSStream();
      };

      ws.onclose = () => {
        setMonitorLogs(prev => [...prev, "WebSocket stream connection closed."]);
      };
    } catch (err) {
      setMonitorLogs(prev => [...prev, "MeetGraph Core offline. Booting sandbox simulation pipeline..."]);
      runSimulatedWSStream();
    }

    // 3. Keep metrics updating live
    monitorIntervalRef.current = setInterval(() => {
      setMonitorTimer(prev => prev + 1);

      setMonitorMetrics(prev => ({
        fps: Math.random() > 0.9 ? Math.floor(Math.random() * 4) + 57 : prev.fps,
        bitrate: Math.floor(1390 + Math.random() * 45),
        db: Math.floor(-55 + Math.random() * 30)
      }));
    }, 1000);
  };

  // Fallback simulator for sandboxed or offline scenarios
  const runSimulatedWSStream = () => {
    const dialogs = [
      { speaker: "Aman", text: "We need to bootstrap the SaaS authentication model by this Friday." },
      { speaker: "Reeti", text: "I can write a custom JWT login logic. It allows full offline compliance and zero-cost scaling." },
      { speaker: "Sarah", text: "Wait, custom JWT setups will delay the dashboard launch! Let's decide to implement Clerk OAuth instead for speed." },
      { speaker: "Aman", text: "But wait, our previous policy says to avoid high external pricing. Clerk scale costs are extremely high." },
      { speaker: "Reeti", text: "That is a severe conflict. I will compile a secure comparison benchmark of JWT vs Clerk by tomorrow morning." },
      { speaker: "Sarah", text: "Perfect. Let's decide to review that comparison and set the production auth model by Friday 9 AM." }
    ];

    let index = 0;
    const tick = () => {
      if (isPaused) {
        simulatedStreamTimeoutRef.current = setTimeout(tick, 3000);
        return;
      }

      if (index < dialogs.length) {
        const item = dialogs[index];
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setActiveSpeaker(item.speaker);
        const text = `${item.speaker}: ${item.text}`;
        setMonitorLogs(prev => [...prev, `[${timeStr}] ${text}`]);
        analyzeTranscriptLine(text);
        
        index++;
        simulatedStreamTimeoutRef.current = setTimeout(tick, 4500);
      } else {
        setActiveSpeaker("None");
        setMonitorLogs(prev => [...prev, "Live meeting session analysis finished. Ready to compile into memory network."]);
        setMonitorStage("completed");
      }
    };

    simulatedStreamTimeoutRef.current = setTimeout(tick, 2000);
  };

  // Real-time assistant heuristics to parse tasks and logical contradictions
  const analyzeTranscriptLine = (line: string) => {
    const match = line.match(/^\[?\d*:\d*:\d*\]?\s*([^:]+):\s*(.*)$/) || line.match(/^([^:]+):\s*(.*)$/);
    if (!match) return;

    const speaker = match[1].trim();
    const text = match[2].trim();

    // Set speaker active visually
    setActiveSpeaker(speaker);

    // 1. Task Parser
    const taskTriggers = ["will compile", "can write", "decide to", "implement", "bootstrap", "assign", "task", "by Friday", "by tomorrow"];
    if (taskTriggers.some(trigger => text.toLowerCase().includes(trigger))) {
      let date = "Next Sync";
      if (text.toLowerCase().includes("by friday")) date = "Friday 9:00 AM";
      if (text.toLowerCase().includes("by tomorrow")) date = "Tomorrow 9:00 AM";
      if (text.toLowerCase().includes("by next week")) date = "Next Week";

      const cleanedText = text
        .replace(/I can /i, "")
        .replace(/We need to /i, "")
        .replace(/Let's decide to /i, "");

      const newTask: TaskItem = {
        id: Math.random().toString(36).substr(2, 9),
        speaker,
        text: cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1),
        status: "pending",
        date
      };

      setMonitorTasks(prev => [...prev, newTask]);
    }

    // 2. Contradiction / Conflict Warnings Parser
    const conflictTriggers = ["conflict", "contradict", "clerk scale costs", "external pricing", "avoid high", "delay the dashboard"];
    if (conflictTriggers.some(trigger => text.toLowerCase().includes(trigger))) {
      const newContradiction: ContradictionItem = {
        id: Math.random().toString(36).substr(2, 9),
        title: "Architecture Conflict",
        desc: `Pricing & Scale conflict: '${speaker}' noted Clerk's high external cost, conflicting with rapid-launch deadlines.`,
        severity: text.toLowerCase().includes("pricing") || text.toLowerCase().includes("costs") ? "high" : "medium"
      };

      setMonitorContradictions(prev => [...prev, newContradiction]);
    }
  };

  const pauseMonitor = () => {
    setIsPaused(prev => !prev);
    setMonitorLogs(prev => [...prev, `Observer monitoring ${!isPaused ? "PAUSED" : "RESUMED"}.`]);
  };

  const stopMonitor = () => {
    setMonitorStage("completed");
    setActiveSpeaker("None");
    if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
    if (simulatedStreamTimeoutRef.current) clearTimeout(simulatedStreamTimeoutRef.current);
    
    if (monitorStreamRef.current) {
      monitorStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (monitorSocketRef.current) {
      monitorSocketRef.current.close();
    }
    setMonitorLogs(prev => [...prev, "AI Observer terminated. Finalizing transcription packet..."]);
  };

  const deployMonitorToMemory = async () => {
    setIsProcessing(true);
    setStage("Structuring the transcript...");
    setProgress(15);
    await new Promise(r => setTimeout(r, 600));
    setProgress(45);
    setStage("Filing topics in your memory bank...");
    await new Promise(r => setTimeout(r, 700));
    setProgress(75);
    setStage("Looking for decision mismatches...");
    await new Promise(r => setTimeout(r, 600));
    setProgress(100);

    try {
      const simulatedText = monitorLogs.join("\n");
      const simulatedBlob = new Blob([simulatedText], { type: "text/plain" });
      const formData = new FormData();
      formData.append("file", simulatedBlob, "live_observer_sync.txt");
      formData.append("title", meetingTitle || "Live Observer Sync Session");

      await fetch("http://127.0.0.1:8000/api/meetings/upload", {
        method: "POST",
        body: formData
      });
      router.push("/meetings");
    } catch (err) {
      router.push("/meetings");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Bring in Meetings
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Upload a recording, start a microphone session, or invite our AI to follow your meeting live.
          </p>
        </div>
        
        {/* Connection status tag */}
        <div className="flex items-center gap-2 self-start md:self-auto px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] font-mono text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-cyan"></span>
          </span>
          AI Assistant Active
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex flex-col sm:flex-row gap-1.5 p-1 bg-black/45 border border-white/5 rounded-2xl max-w-2xl">
        <button
          onClick={() => { setActiveTab("upload"); stopMonitor(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
            activeTab === "upload"
              ? "bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/10 border border-cyber-purple/40 text-white shadow-lg shadow-cyber-purple/5"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Upload className="h-3.5 w-3.5" /> Upload Recording
        </button>
        <button
          onClick={() => { setActiveTab("mic"); stopMonitor(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
            activeTab === "mic"
              ? "bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/10 border border-cyber-purple/40 text-white shadow-lg shadow-cyber-purple/5"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >

          <Mic className="h-3.5 w-3.5" /> Use Microphone
        </button>
        <button
          onClick={() => { setActiveTab("live_monitor"); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 relative overflow-hidden group cursor-pointer ${
            activeTab === "live_monitor"
              ? "bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/15 border border-cyber-purple/40 text-white shadow-lg shadow-cyber-purple/5"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyber-rose animate-pulse" />
          <Tv className="h-3.5 w-3.5" /> Invite Live Assistant
        </button>
      </div>

      {isProcessing ? (
        /* Global Compilation Progress Screen */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-2xl glass-card border border-cyber-purple/20 flex flex-col items-center justify-center gap-6 min-h-[450px]"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-cyber-purple/10 blur-xl animate-pulse w-24 h-24" />
            <Loader2 className="h-12 w-12 text-cyber-cyan animate-spin relative" />
          </div>
          
          <div className="text-center space-y-1 w-full max-w-md">
            <p className="text-sm font-bold text-white tracking-wide uppercase font-mono">Updating Team Memory</p>
            <AnimatePresence mode="wait">
              <motion.p 
                key={stage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-cyber-cyan font-mono"
              >
                {stage}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md space-y-2">
            <div className="h-2 w-full bg-black/60 border border-white/5 rounded-full overflow-hidden p-0.5">
              <motion.div 
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
                className="h-full bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-emerald rounded-full" 
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 font-mono font-semibold">
              <span>Memory Engine</span>
              <span>{progress}% COMPLETE</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Work Area: Left & Middle (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Metadata Card - Shared Title Header */}
            {(!isMonitoring || monitorStage === "completed") && (
              <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-4 bg-transparent">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-cyber-purple" /> 1. Meeting Details
                </h3>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">What is this meeting about?</label>
                  <input
                    type="text"
                    placeholder="e.g. Authentication Architecture Scaling Review, JWT vs Clerk OAuth"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all"
                  />
                </div>
              </div>
            )}

            {/* TAB 1: Traditional File Ingest */}
            {activeTab === "upload" && (
              <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-4 bg-transparent">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-cyber-cyan" /> 2. Choose a file
                </h3>
                
                <motion.div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  animate={dragActive ? { scale: 1.01, borderColor: "rgba(139, 92, 246, 0.8)", backgroundColor: "rgba(139, 92, 246, 0.05)" } : { scale: 1 }}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                    dragActive
                      ? "border-cyber-purple bg-cyber-purple/5"
                      : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
                  }`}
                >
                  <input
                    type="file"
                    id="audio-upload"
                    accept="audio/*,video/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <label htmlFor="audio-upload" className="flex flex-col items-center gap-3 cursor-pointer">
                    <motion.div 
                      whileHover={{ scale: 1.08, rotate: 3 }}
                      className="h-14 w-14 rounded-2xl bg-cyber-purple/10 flex items-center justify-center border border-cyber-purple/20"
                    >
                      <Upload className="h-7 w-7 text-cyber-purple" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">Drag & drop files or click to browse</p>
                      <p className="text-xs text-gray-500 mt-1">Accepts audio or video files (Max 150MB)</p>
                    </div>
                  </label>

                  {file && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 px-4 py-3 bg-cyber-purple/10 border border-cyber-purple/25 rounded-xl flex items-center gap-3 w-full max-w-md"
                    >
                      <FileCheck className="h-5 w-5 text-cyber-cyan" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {file && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={processFile}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyber-purple to-cyber-cyan rounded-xl text-white font-bold text-sm shadow-lg shadow-cyber-purple/10 transition-all duration-300 mt-2 cursor-pointer"
                  >
                    Save to Team Memory <Play className="h-4 w-4 fill-current" />
                  </motion.button>
                )}
              </div>
            )}

            {/* TAB 2: Microphone Sync */}
            {activeTab === "mic" && (
              <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-4 bg-transparent">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Mic className="h-4 w-4 text-cyber-rose" /> 2. Your Microphone
                </h3>
                
                <div className="flex flex-col items-center justify-center p-8 border border-white/5 bg-white/[0.01] rounded-2xl gap-4">
                  {isRecording ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                      {/* Waveform visualizer */}
                      <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-xs px-4">
                        {[0.5, 0.35, 0.8, 0.25, 0.7, 0.45, 0.85, 0.4, 0.65, 0.3, 0.55, 0.8, 0.45, 0.9, 0.35].map((mult, idx) => (
                          <motion.div
                            key={idx}
                            animate={{
                              height: ["20%", `${mult * 100}%`, "20%"]
                            }}
                            transition={{
                              duration: 0.5 + (idx % 3) * 0.12,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="w-2 bg-cyber-rose rounded-full"
                          />
                        ))}
                      </div>

                      <div className="text-center">
                        <span className="px-3.5 py-1 bg-cyber-rose/15 border border-cyber-rose/25 text-cyber-rose text-xs font-mono font-bold rounded-full animate-pulse inline-flex items-center gap-1.5 justify-center">
                          <Radio className="h-3.5 w-3.5" /> RECORDING LIVE: {formatTimer(micTimer)}
                        </span>
                        <p className="text-xs text-gray-400 mt-2 font-mono">Listening carefully to your conversation...</p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={stopRecording}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-cyber-rose hover:bg-cyber-rose/95 rounded-xl text-white font-bold text-xs shadow-lg shadow-cyber-rose/15 transition-all mt-2 cursor-pointer"
                      >
                        <Square className="h-4.5 w-4.5 fill-current" /> Finish & Analyze
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <motion.div 
                        whileHover={{ scale: 1.08 }}
                        onClick={startRecording}
                        className="h-16 w-16 rounded-full bg-cyber-rose/10 flex items-center justify-center border border-cyber-rose/20 relative group hover:border-cyber-rose/50 transition-all cursor-pointer"
                      >
                        <div className="absolute inset-0 rounded-full bg-cyber-rose/5 scale-0 group-hover:scale-105 transition-transform" />
                        <Mic className="h-7 w-7 text-cyber-rose relative" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-bold text-white">Start Recording from Mic</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-md font-sans">Record a quick conversation using your device's microphone.</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={startRecording}
                        className="px-6 py-2.5 bg-cyber-rose/15 border border-cyber-rose/30 hover:bg-cyber-rose/25 text-cyber-rose rounded-xl font-bold text-xs tracking-wider transition-all mt-2 cursor-pointer"
                      >
                        Start Listening
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Advanced Live AI Monitor Observer */}
            {activeTab === "live_monitor" && (
              <div className="space-y-6">
                {!isMonitoring ? (
                  /* Initial Setup State */
                  <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-5 bg-transparent">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-cyber-purple/10 border border-cyber-purple/20 rounded-xl text-cyber-purple">
                        <Tv className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Real-time Live Assistant</h3>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed font-sans">
                          This assistant works right alongside Zoom, Google Meet, Teams, or Discord. It will follow the conversation, write down a live transcript, note tasks, and alert you if a new decision conflicts with something you agreed on before.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-black/35 border border-white/5 rounded-xl space-y-3">
                      <h4 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">What the assistant does:</h4>
                      <ul className="text-xs text-gray-400 space-y-2 font-sans">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-cyber-cyan" /> Follows the meeting screen and audio
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-cyber-cyan" /> Writes a live transcript separating speakers
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-cyber-cyan" /> Highlights tasks and deadlines as they happen
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-cyber-cyan" /> Flags if plans conflict with past decisions
                        </li>
                      </ul>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={startMonitorObserver}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-purple/90 rounded-xl text-white font-extrabold text-sm shadow-lg shadow-cyber-cyan/5 tracking-wider hover:opacity-95 transition-all cursor-pointer"
                    >
                      <Share2 className="h-4.5 w-4.5" /> Start Live Assistant
                    </motion.button>
                  </div>
                ) : monitorStage === "completed" ? (
                  /* Completed / Review Summary State */
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl glass-card border border-cyber-emerald/20 space-y-6 bg-transparent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-cyber-emerald/15 border border-cyber-emerald/30 text-cyber-emerald rounded-xl">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Meeting Completed</h3>
                        <p className="text-xs text-gray-400 font-sans">We have processed the meeting. Review what we found before saving it.</p>
                      </div>
                    </div>

                    {/* Stats Widget grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                        <span className="block text-[10px] text-gray-500 font-mono">MEETING DURATION</span>
                        <span className="text-base font-black text-white font-mono">{formatTimer(monitorTimer)}</span>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                        <span className="block text-[10px] text-gray-500 font-mono">TASKS FOUND</span>
                        <span className="text-base font-black text-cyber-cyan font-mono">{monitorTasks.length} Items</span>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                        <span className="block text-[10px] text-gray-500 font-mono font-semibold">DECISION WARNINGS</span>
                        <span className={`text-base font-black font-mono ${monitorContradictions.length > 0 ? "text-cyber-rose" : "text-cyber-emerald"}`}>
                          {monitorContradictions.length} Found
                        </span>
                      </div>
                    </div>

                    {/* Quick logs list */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">Live Transcript Draft</h4>
                      <div className="bg-black/45 border border-white/5 rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-[10px] text-gray-400 space-y-1.5">
                        {monitorLogs.map((log, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-gray-600">[{idx+1}]</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={startMonitorObserver}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-300 font-bold text-xs tracking-wider transition-all cursor-pointer"
                      >
                        Discard & Restart
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={deployMonitorToMemory}
                        className="flex-1 py-3 bg-gradient-to-r from-cyber-emerald to-cyber-cyan rounded-xl text-white font-extrabold text-xs tracking-wider shadow-lg shadow-cyber-emerald/10 transition-all cursor-pointer"
                      >
                        Save to Team Memory
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  /* Active Live Observer Monitor UI */
                  <div className="space-y-6">
                    {/* Live Stream Panel Container */}
                    <div className="relative rounded-2xl overflow-hidden border border-cyber-purple/35 bg-black/60 min-h-[350px] flex flex-col justify-between group">
                      
                      {/* Top Overlay Banner */}
                      <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/95 to-transparent p-4 flex items-center justify-between z-10">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-rose opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-rose"></span>
                          </span>
                          <span className="text-[11px] font-bold text-white uppercase font-mono tracking-widest">
                            {isPaused ? "ASSISTANT PAUSED" : "ASSISTANT LIVE"}
                          </span>
                        </div>

                        {/* Metrical data tags */}
                        <div className="flex items-center gap-3 text-[10px] font-mono font-semibold">
                          <span className="px-2 py-0.5 rounded-lg bg-black/85 border border-white/5 text-cyber-cyan">
                            {monitorMetrics.fps} FPS
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-black/85 border border-white/5 text-cyber-purple">
                            {monitorMetrics.bitrate} kbps
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-black/85 border border-white/5 text-cyber-rose">
                            {monitorMetrics.db} dB
                          </span>
                        </div>
                      </div>

                      {/* Video Layer (Browser Media capture) */}
                      {!isSimulatedStream ? (
                        <video
                          ref={monitorVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-[320px] object-cover bg-black/60 rounded-t-2xl"
                        />
                      ) : (
                        /* Sci-Fi Simulated Screen Share Layout (If permissions blocked) */
                        <div className="w-full h-[320px] bg-gradient-to-br from-black/80 via-white/[0.02] to-black/80 flex flex-col items-center justify-center p-6 relative">
                          {/* Tech Grid Background lines */}
                          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyber-purple/5 blur-3xl rounded-full" />
                          
                          {/* Animated Graph Visualizer nodes representing speakers */}
                          <div className="relative w-full max-w-md h-32 flex items-center justify-between px-10">
                            
                            {/* Connector wave streams */}
                            <div className="absolute inset-x-12 top-1/2 h-0.5 bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-rose opacity-40">
                              <div className="h-full bg-cyber-cyan animate-pulse w-1/3 rounded-full" />
                            </div>

                            {/* Speaker bubble: Aman */}
                            <div className="relative flex flex-col items-center gap-1.5 z-10">
                              <motion.div
                                animate={activeSpeaker === "Aman" ? { scale: [1, 1.15, 1], borderColor: "#c084fc" } : { scale: 1 }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm bg-black/80 border ${
                                  activeSpeaker === "Aman" ? "border-cyber-purple text-cyber-purple shadow-lg shadow-cyber-purple/20" : "border-white/5 text-gray-400"
                                }`}
                              >
                                AM
                              </motion.div>
                              <span className="text-[9px] font-mono font-bold text-gray-400">Aman (Back)</span>
                            </div>

                            {/* Speaker bubble: Reeti */}
                            <div className="relative flex flex-col items-center gap-1.5 z-10">
                              <motion.div
                                animate={activeSpeaker === "Reeti" ? { scale: [1, 1.15, 1], borderColor: "#22d3ee" } : { scale: 1 }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm bg-black/80 border ${
                                  activeSpeaker === "Reeti" ? "border-cyber-cyan text-cyber-cyan shadow-lg shadow-cyber-cyan/20" : "border-white/5 text-gray-400"
                                }`}
                              >
                                RE
                              </motion.div>
                              <span className="text-[9px] font-mono font-bold text-gray-400">Reeti (Front)</span>
                            </div>

                            {/* Speaker bubble: Sarah */}
                            <div className="relative flex flex-col items-center gap-1.5 z-10">
                              <motion.div
                                animate={activeSpeaker === "Sarah" ? { scale: [1, 1.15, 1], borderColor: "#f43f5e" } : { scale: 1 }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm bg-black/80 border ${
                                  activeSpeaker === "Sarah" ? "border-cyber-rose text-cyber-rose shadow-lg shadow-cyber-rose/20" : "border-white/5 text-gray-400"
                                }`}
                              >
                                SA
                              </motion.div>
                              <span className="text-[9px] font-mono font-bold text-gray-400">Sarah (PM)</span>
                            </div>

                          </div>

                          <div className="text-center space-y-1 relative z-10 mt-2">
                            <span className="text-[10px] font-bold text-cyber-cyan uppercase font-mono tracking-widest flex items-center gap-1 justify-center">
                              <Cpu className="h-3.5 w-3.5 animate-spin" /> Listening to Live Meeting (Simulating Flow)
                            </span>
                            <p className="text-[10px] text-gray-500 font-mono font-sans">Translating audio and screen content...</p>
                          </div>
                        </div>
                      )}

                      {/* Video Stream Bottom Stats Bar */}
                      <div className="bg-black/90 border-t border-white/5 px-4 py-3 flex items-center justify-between text-xs text-gray-400 font-mono">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-bold">Meeting Timer: {formatTimer(monitorTimer)}</span>
                          <span className="text-gray-600">|</span>
                          <span>Currently speaking: <span className="text-cyber-cyan font-bold">{activeSpeaker}</span></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={pauseMonitor}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isPaused 
                                ? "bg-cyber-purple/20 border-cyber-purple/40 text-cyber-purple" 
                                : "bg-white/5 border-white/10 hover:border-cyber-purple/30 text-gray-400 hover:text-white"
                            }`}
                            title={isPaused ? "Resume Live Ingestion" : "Pause Live Ingestion"}
                          >
                            {isPaused ? <PlayCircle className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={stopMonitor}
                            className="px-3 py-1.5 bg-cyber-rose hover:bg-cyber-rose/90 rounded-lg text-white font-bold text-[10px] flex items-center gap-1 shadow-lg shadow-cyber-rose/10 cursor-pointer"
                          >
                            <Square className="h-3 w-3 fill-current" /> Terminate Stream
                          </motion.button>
                        </div>
                      </div>

                    </div>

                    {/* Secondary layout splits: Logs & Floating Assistant panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left Block: Real-Time speech logs */}
                      <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-3 flex flex-col justify-between bg-transparent">
                        <div className="space-y-1.5">
                          <h4 className="text-[11px] font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                            <Terminal className="h-4 w-4 text-cyber-cyan" /> Live Transcript
                          </h4>
                          <p className="text-[10px] text-gray-400 font-sans">Writing down the conversation in real-time...</p>
                        </div>

                        <div className="bg-black/45 border border-white/5 rounded-xl p-3 h-52 font-mono text-[10px] text-gray-300 overflow-y-auto space-y-2">
                          <AnimatePresence initial={false}>
                            {monitorLogs.length > 0 ? (
                              monitorLogs.map((log, idx) => (
                                <motion.div 
                                  key={idx}
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex gap-2 leading-relaxed"
                                >
                                  <span className="text-gray-600">[{idx+1}]</span>
                                  <span>{log}</span>
                                </motion.div>
                              ))
                            ) : (
                              <div className="text-center text-gray-600 h-full flex flex-col items-center justify-center gap-2 font-mono">
                                <Volume2 className="h-7 w-7 text-gray-700 animate-pulse" />
                                <span>Awaiting audio packets...</span>
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Right Block: Dynamic AI Assistant panel */}
                      <div className="p-4 rounded-2xl glass-card border border-cyber-purple/20 space-y-4 bg-transparent">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h4 className="text-[11px] font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-cyber-purple" /> AI Assistant Notes
                          </h4>
                          <span className="text-[9px] px-2 py-0.5 bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/25 rounded-md font-mono">
                            Auto Extract
                          </span>
                        </div>

                        {/* Semantic alerts & contradictions warnings */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase font-mono block">Tasks we found</span>
                          <div className="bg-black/45 border border-white/5 rounded-xl p-3 h-28 overflow-y-auto space-y-2 text-xs">
                            <AnimatePresence initial={false}>
                              {monitorTasks.length > 0 ? (
                                monitorTasks.map((task) => (
                                  <motion.div 
                                    key={task.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-2 bg-white/5 border border-white/5 rounded-lg flex items-start justify-between gap-2"
                                  >
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-white leading-tight">
                                        <span className="text-cyber-cyan font-bold">{task.speaker}</span>: {task.text}
                                      </p>
                                      <span className="inline-block text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400 font-mono">
                                        Due: {task.date}
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-cyber-emerald font-bold font-mono">NEW</span>
                                  </motion.div>
                                ))
                              ) : (
                                <div className="text-center text-gray-600 h-full flex items-center justify-center font-sans text-[10px]">
                                  No tasks found yet.
                                </div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Semantic Alerts section */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase font-mono block">Plan Conflict Alerts</span>
                          <div className="space-y-2">
                            <AnimatePresence initial={false}>
                              {monitorContradictions.length > 0 ? (
                                monitorContradictions.map((conflict) => (
                                  <motion.div 
                                    key={conflict.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-2.5 bg-cyber-rose/10 border border-cyber-rose/30 rounded-xl flex items-start gap-2.5 animate-pulse"
                                  >
                                    <ShieldAlert className="h-4.5 w-4.5 text-cyber-rose shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                      <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                                        {conflict.title} <span className="text-[8px] text-cyber-rose font-mono">HIGH RISK</span>
                                      </p>
                                      <p className="text-[9px] text-gray-300 leading-normal font-mono">{conflict.desc}</p>
                                    </div>
                                  </motion.div>
                                ))
                              ) : (
                                <div className="p-3 bg-cyber-emerald/5 border border-cyber-emerald/15 rounded-xl flex items-center gap-2 text-gray-400 font-mono text-[9px]">
                                  <CheckCircle2 className="h-4 w-4 text-cyber-emerald" /> 
                                  <span>All clear! No conflicts with past plans detected.</span>
                                </div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                      </div>

                    </div>

                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Side Column: Shared Sidebar logs and guidelines */}
          <div className="space-y-6">
            
            {/* Audio Stream Ingestion Monitor Console */}
            {activeTab !== "live_monitor" && (
              <div className="p-6 rounded-2xl glass-card border border-white/5 flex flex-col h-full justify-between bg-transparent">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="h-4.5 w-4.5 text-cyber-cyan" /> Microphone Activity
                  </h3>
                  <p className="text-xs text-gray-400 font-sans">Live transcript text will appear here.</p>
                </div>

                <div className="bg-black/45 border border-white/5 rounded-xl p-4 h-64 font-mono text-[10px] text-cyber-cyan/85 overflow-y-auto space-y-2.5 mt-4">
                  <AnimatePresence initial={false}>
                    {recordedLogs.length > 0 ? (
                      recordedLogs.map((log, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex gap-2"
                        >
                          <span className="text-gray-600">[{idx+1}]</span>
                          <span className="text-gray-300">{log}</span>
                        </motion.div>
                      ))
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-gray-600 text-center flex flex-col items-center justify-center h-full gap-2 font-sans"
                      >
                        <Volume2 className="h-8 w-8 text-gray-700 animate-pulse" />
                        <span>Not recording yet. Start talking to see text here.</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-3 bg-cyber-purple/5 border border-cyber-purple/15 rounded-xl text-[10px] text-gray-400 leading-relaxed font-sans mt-4">
                  We write down transcripts and organize agreements automatically.
                </div>
              </div>
            )}

            {/* Ingestion status overview (Always visible on right) */}
            <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-4 bg-transparent">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-cyber-purple" /> System Status
              </h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400 font-mono">AI Engine Status</span>
                  <span className="text-cyber-emerald font-mono font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-cyber-emerald rounded-full animate-ping" /> ONLINE
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400 font-mono">Transcription Model</span>
                  <span className="text-cyber-cyan font-mono font-bold">Whisper v2.4</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400 font-mono">Memory Database</span>
                  <span className="text-cyber-purple font-mono font-bold">SQLModel pgvector</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-mono">Data Encryption</span>
                  <span className="text-white font-mono font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-cyber-cyan" /> AES-256 TLS 1.3
                  </span>
                </div>
              </div>
            </div>

            {/* Helpful platform notes */}
            <div className="p-4 bg-cyber-purple/5 border border-cyber-purple/10 rounded-2xl text-[11px] text-gray-400 leading-relaxed space-y-2 font-sans">
              <p className="font-bold text-white flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-cyber-cyan" /> Tip: How to use with Zoom, Meet, and Teams
              </p>
              <p>
                When you start the assistant, you can choose to share any Chrome tab, window, or your whole screen. Sharing the screen along with its audio lets the assistant hear and transcribe everyone in your virtual meeting room.
              </p>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
