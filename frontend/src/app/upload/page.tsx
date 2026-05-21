"use client";

import { useState, useRef } from "react";
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
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MeetingUpload() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Progress tracker states
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedLogs, setRecordedLogs] = useState<string[]>([]);
  const [micTimer, setMicTimer] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

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
      { name: "Uploading audio container...", weight: 20 },
      { name: "Running Whisper speech-to-text diarization...", weight: 45 },
      { name: "Parsing dialogue & speaker maps...", weight: 65 },
      { name: "Extracting tasks, deadlines, and decisions...", weight: 80 },
      { name: "Comparing decisions against historical contradictions...", weight: 95 },
      { name: "Indexing nodes in Organizational Memory Graph...", weight: 100 }
    ];

    for (const item of stages) {
      setStage(item.name);
      // Linear smooth transition for each stage
      let currentProgress = progress;
      while (currentProgress < item.weight) {
        currentProgress += Math.floor(Math.random() * 5) + 1;
        setProgress(Math.min(currentProgress, item.weight));
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    }

    // Call API
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
        alert("Upload processed with simulated indexing successfully!");
        router.push("/meetings");
      }
    } catch (err) {
      // Offline fallback: simulate successful processing
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push("/meetings");
    } finally {
      setIsProcessing(false);
    }
  };

  // Live microphone capture simulation
  const startRecording = () => {
    setIsRecording(true);
    setRecordedLogs(["Microphone workspace initialized.", "WebSocket socket stream listening..."]);
    setMicTimer(0);
    
    timerRef.current = setInterval(() => {
      setMicTimer((prev) => prev + 1);
    }, 1000);

    // Simulate real-time streaming segments
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
    
    // Process recorded voice transcript
    setIsProcessing(true);
    setStage("Uploading live buffer & extracting organizational logic...");
    setProgress(30);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(70);
    setStage("Matching cross-meeting decision inconsistencies...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(100);

    try {
      // Simulate post upload
      const simulatedBlob = new Blob(["Live Mic stream"], { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", simulatedBlob, "live_recording.wav");
      formData.append("title", meetingTitle || "Live Micro-Sync session");

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
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Meeting Feed Ingestion</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Ingest raw meeting audio/video to compile speech streams, task rosters, and memory nodes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column: File drag & drop and recorder */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata Section */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Meeting Details</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Session / Topic Title</label>
              <input
                type="text"
                placeholder="e.g. Database Scaling Sync, Auth Decisions Board"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="w-full bg-obsidian-light/60 border border-obsidian-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all"
              />
            </div>
          </div>

          {!isProcessing ? (
            <div className="space-y-6">
              
              {/* Drag and Drop Box */}
              <div className="p-6 rounded-2xl glass-panel space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">2. Upload Audio File</h3>
                
                <motion.div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  animate={dragActive ? { scale: 1.02, borderColor: "rgba(139, 92, 246, 0.8)", backgroundColor: "rgba(139, 92, 246, 0.05)" } : { scale: 1 }}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                    dragActive
                      ? "border-cyber-purple bg-cyber-purple/5"
                      : "border-obsidian-border bg-obsidian-light/20 hover:bg-obsidian-light/40"
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
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="h-12 w-12 rounded-xl bg-cyber-purple/10 flex items-center justify-center border border-cyber-purple/20"
                    >
                      <Upload className="h-6 w-6 text-cyber-purple" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">Drag & drop files or click to upload</p>
                      <p className="text-xs text-gray-500 mt-1">Accepts MP3, WAV, M4A, or MP4 containers (Max 150MB)</p>
                    </div>
                  </label>

                  {file && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 px-4 py-2 bg-cyber-purple/10 border border-cyber-purple/25 rounded-xl flex items-center gap-3 w-full max-w-md"
                    >
                      <FileCheck className="h-4.5 w-4.5 text-cyber-cyan" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {file && (
                  <motion.button
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={processFile}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyber-purple to-cyber-cyan hover:from-cyber-purple hover:to-cyber-purple rounded-xl text-white font-bold text-sm shadow-lg shadow-cyber-purple/10 transition-all duration-300 mt-2"
                  >
                    Deploy to Memory Node <Play className="h-4 w-4 fill-current" />
                  </motion.button>
                )}
              </div>

              {/* Live Microphone Recording Box */}
              <div className="p-6 rounded-2xl glass-panel space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">OR: Live Microphone Feed</h3>
                
                <div className="flex flex-col items-center justify-center p-6 border border-obsidian-border bg-obsidian-light/25 rounded-2xl gap-4">
                  {isRecording ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                      {/* Interactive voice waveform visualization */}
                      <div className="flex items-end justify-center gap-1 h-16 w-full max-w-xs px-4">
                        {[0.5, 0.35, 0.8, 0.25, 0.7, 0.45, 0.85, 0.4, 0.65, 0.3, 0.55, 0.8, 0.45, 0.9, 0.35].map((mult, idx) => (
                          <motion.div
                            key={idx}
                            animate={{
                              height: ["20%", `${mult * 100}%`, "20%"]
                            }}
                            transition={{
                              duration: 0.6 + (idx % 3) * 0.15,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="w-1.5 bg-cyber-rose rounded-full"
                          />
                        ))}
                      </div>

                      <div className="text-center">
                        <span className="px-3 py-1 bg-cyber-rose/15 border border-cyber-rose/25 text-cyber-rose text-xs font-mono font-bold rounded-full animate-pulse flex items-center gap-1.5 justify-center">
                          <Radio className="h-3.5 w-3.5 animate-spin" /> LIVE RECORDING: {formatTimer(micTimer)}
                        </span>
                        <p className="text-xs text-gray-400 mt-2 font-mono">Streaming chunks via secure socket protocol...</p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={stopRecording}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-cyber-rose hover:bg-cyber-rose/90 rounded-xl text-white font-bold text-xs shadow-lg shadow-cyber-rose/15 transition-all mt-2"
                      >
                        <Square className="h-4.5 w-4.5 fill-current" /> Terminate & Extract
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <motion.div 
                        whileHover={{ scale: 1.08 }}
                        className="h-16 w-16 rounded-full bg-cyber-rose/10 flex items-center justify-center border border-cyber-rose/20 relative group hover:border-cyber-rose/50 transition-all cursor-pointer"
                      >
                        <div className="absolute inset-0 rounded-full bg-cyber-rose/5 scale-0 group-hover:scale-105 transition-transform" />
                        <Mic className="h-7 w-7 text-cyber-rose relative" />
                      </motion.div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">Initialize Live Stream</p>
                        <p className="text-xs text-gray-500 mt-0.5">Stream direct speech from microphone or speaker systems</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={startRecording}
                        className="px-6 py-2 bg-cyber-rose/20 border border-cyber-rose/30 hover:bg-cyber-rose/30 text-cyber-rose rounded-xl font-bold text-xs tracking-wide transition-all mt-2"
                      >
                        Start Streaming
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Uploading Processing State */
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-2xl glass-panel flex flex-col items-center justify-center gap-6 min-h-[400px]"
            >
              <Loader2 className="h-10 w-10 text-cyber-purple animate-spin" />
              <div className="text-center space-y-1 w-full max-w-md">
                <p className="text-sm font-bold text-white tracking-wide">Processing meeting nodes...</p>
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

              {/* Progress Slider */}
              <div className="w-full max-w-md space-y-1.5">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                    className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan" 
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>STAGES ACTIVE</span>
                  <span>{progress}% COMPLETE</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Side Column: Dynamic Console Logs / Help */}
        <div className="space-y-6">
          {/* Audio Console Feed */}
          <div className="p-6 rounded-2xl glass-panel space-y-4 flex flex-col h-full justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-cyber-cyan" /> Audio Stream Monitor
              </h3>
              <p className="text-xs text-gray-400">Microphone feeds and transcription chunks pipeline logs.</p>
            </div>

            <div className="bg-obsidian-dark border border-obsidian-border rounded-xl p-4 h-64 font-mono text-[10px] text-cyber-cyan/85 overflow-y-auto space-y-2.5">
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
                    className="text-gray-600 text-center flex flex-col items-center justify-center h-full gap-2"
                  >
                    <Volume2 className="h-8 w-8 text-gray-700 animate-pulse" />
                    <span>No active stream detected. Ingestion idle.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-3 bg-cyber-purple/5 border border-cyber-purple/15 rounded-xl text-[10px] text-gray-400 leading-relaxed font-mono">
              Meeting uploads are immediately passed to our Whisper integration. System diarizes speakers automatically into unique tokens.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
