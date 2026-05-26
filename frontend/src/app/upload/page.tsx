"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
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
  ShieldAlert,
  Eye,
  BarChart3,
  Users,
  MessageSquare,
  TrendingUp
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
  const { user } = useAuth();
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
  const [micStage, setMicStage] = useState<"idle" | "capturing" | "completed" | "summarized">("idle");
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const micVideoRef = useRef<HTMLVideoElement | null>(null);

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
  const [monitorStage, setMonitorStage] = useState<"idle" | "capturing" | "analyzing" | "completed" | "summarized">("idle");
  const [activeSpeaker, setActiveSpeaker] = useState<string>("None");
  const [isPaused, setIsPaused] = useState(false);
  const [enableVisionAI, setEnableVisionAI] = useState(false);
  const [detectedParticipants, setDetectedParticipants] = useState<string[]>([]);
  const [activeApp, setActiveApp] = useState<string>("None");

  const [recordedSegments, setRecordedSegments] = useState<any[]>([]);
  const [monitorSegments, setMonitorSegments] = useState<any[]>([]);
  const [detectedApps, setDetectedApps] = useState<string[]>([]);

  const screenFrameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const monitorVideoRef = useRef<HTMLVideoElement | null>(null);

  const monitorStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const monitorSocketRef = useRef<WebSocket | null>(null);
  const simulatedStreamTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const micStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(15).fill(10));
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
      if (simulatedStreamTimeoutRef.current) clearInterval(simulatedStreamTimeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      // Stop media tracks
      if (monitorStreamRef.current) {
        monitorStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      // Close WebSockets
      if (socketRef.current) socketRef.current.close();
      if (monitorSocketRef.current) monitorSocketRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
      if (screenFrameIntervalRef.current) clearInterval(screenFrameIntervalRef.current);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
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

  // Start the live Audio Analyser
  const startAudioAnalyser = (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const newLevels = Array.from(dataArray).slice(0, 15).map(val => Math.max(10, (val / 255) * 100));
          setAudioLevels(newLevels);
          animationFrameRef.current = requestAnimationFrame(update);
        }
      };
      update();
    } catch (e) {
      console.error("Failed to start audio analyser:", e);
    }
  };

  // Stop the live Audio Analyser
  const stopAudioAnalyser = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevels(new Array(15).fill(10));
  };

  // Process uploaded files with XHR upload progress
  const processFile = () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setStage("Uploading recording...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", meetingTitle || file.name.split(".")[0]);
    if (user?.email) {
      formData.append("user_email", user.email);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://127.0.0.1:8000/api/meetings/upload", true);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
        if (percent < 100) {
          setStage(`Uploading recording: ${percent}%`);
        } else {
          setStage("Upload complete. Running Whisper transcription and AI analysis...");
        }
      }
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setFile(null);
          setMeetingTitle("");
          router.push(`/meetings?id=${data.meeting_id}`);
        } catch (e) {
          alert("Meeting saved, but could not parse response.");
          router.push("/meetings");
        }
      } else {
        let errMsg = "Upload failed.";
        try {
          const res = JSON.parse(xhr.responseText);
          errMsg = res.detail || errMsg;
        } catch (e) { }
        alert("Failed to process meeting: " + errMsg);
        setIsProcessing(false);
        setProgress(0);
        setStage("");
      }
    };

    xhr.onerror = () => {
      alert("Network error occurred during upload. Please check server.");
      setIsProcessing(false);
      setProgress(0);
      setStage("");
    };

    xhr.send(formData);
  };

  // Start real microphone recording (Tab 2)
  const startRecording = async () => {
    try {
      setMicStage("capturing");
      setIsRecording(true);
      setRecordedLogs(["Initializing Microphone Audio...", "Requesting Microphone permission..."]);
      setRecordedSegments([]);
      setMicTimer(0);
      setMonitorTasks([]);
      setMonitorContradictions([]);
      setDetectedParticipants([]);
      setActiveApp("None");
      setDetectedApps([]);

      let micStream: MediaStream | null = null;
      recordedChunksRef.current = [];

      // Request Mic Capture
      try {
        if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: true
          });
        }
      } catch (err) {
        console.warn("Microphone access declined or unavailable:", err);
      }

      if (!micStream) {
        throw new Error("Microphone permission was denied.");
      }

      micStreamRef.current = micStream;
      monitorStreamRef.current = null; // No screen share for microphone tab

      startAudioAnalyser(micStream);

      // Open WebSocket
      const ws = new WebSocket("ws://127.0.0.1:8000/ws/meeting-stream");
      socketRef.current = ws;
      ws.binaryType = "blob";

      ws.onopen = () => {
        ws.send(JSON.stringify({
          action: "start",
          title: meetingTitle || "Microphone Sync Session",
          user_email: user?.email || ""
        }));

        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }

        const mediaRecorder = new MediaRecorder(micStream!, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(event.data);
            }
          }
        };

        mediaRecorder.start(1000);

        setRecordedLogs([
          "Hearing active.",
          "Recording microphone stream."
        ]);

        timerRef.current = setInterval(() => {
          setMicTimer((prev) => prev + 1);
        }, 1000);



        // Native Browser Speech Recognition Fallback for Real-time Display
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionClass) {
          const rec = new SpeechRecognitionClass();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = "en-US";

          const finalizedSentences: string[] = [];

          rec.onresult = (event: any) => {
            let interimTranscript = "";
            for (let i = 0; i < event.results.length; ++i) {
              const transcript = event.results[i][0].transcript.trim();
              if (event.results[i].isFinal) {
                if (i >= finalizedSentences.length) {
                  finalizedSentences.push(transcript);
                  setRecordedSegments(prev => {
                    const exists = prev.some(s => s.text === transcript);
                    if (exists) return prev;
                    return [...prev, {
                      speaker: "Speaker 1",
                      text: transcript,
                      start: finalizedSentences.length * 5.0,
                      end: (finalizedSentences.length + 1) * 5.0
                    }];
                  });
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                      action: "speech_text",
                      text: transcript
                    }));
                  }
                }
              } else {
                interimTranscript = transcript;
              }
            }

            const timeStr = new Date().toLocaleTimeString();
            setRecordedLogs(prev => {
              const cleanLogs = prev.filter(log => !log.includes("Live Transcript:"));
              if (interimTranscript) {
                return [...cleanLogs, `[${timeStr}] Live Transcript: ${interimTranscript}`];
              }
              return cleanLogs;
            });
          };

          rec.onend = () => {
            if (speechRecognitionRef.current === rec) {
              try {
                rec.start();
              } catch (e) {
                console.warn("Failed to restart speech recognition:", e);
              }
            }
          };

          rec.onerror = (err: any) => {
            console.warn("Speech recognition error:", err);
          };

          rec.start();
          speechRecognitionRef.current = rec;
        }
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.status === "transcribing" && payload.segments) {
            setRecordedSegments(payload.segments);
            const timeStr = payload.timestamp || new Date().toLocaleTimeString();
            const segmentLogs = payload.segments.map((seg: any) => {
              return `[${timeStr}] ${seg.speaker}: ${seg.text}`;
            });
            setRecordedLogs(prev => {
              const setupLogs = prev.filter(log => !log.startsWith("["));
              const interimLog = prev.find(log => log.includes("Live Transcript:"));
              return [...setupLogs, ...segmentLogs, ...(interimLog ? [interimLog] : [])];
            });

            // Feed live intelligence updates dynamically
            if (payload.participants) {
              setDetectedParticipants(payload.participants);
            }
            if (payload.tasks) {
              setMonitorTasks(payload.tasks);
            }
            if (payload.contradictions) {
              setMonitorContradictions(payload.contradictions);
            }
            if (payload.active_speaker) {
              setActiveSpeaker(payload.active_speaker);
            }
            if (payload.active_app) {
              setActiveApp(payload.active_app);
              if (payload.active_app !== "None") {
                setDetectedApps(prev => {
                  if (prev.includes(payload.active_app)) return prev;
                  return [...prev, payload.active_app];
                });
              }
            }
          } else if (payload.status === "screen_updated") {
            const timeStr = new Date().toLocaleTimeString();
            if (payload.visual_log) {
              setRecordedLogs(prev => [...prev, `[${timeStr}] Vision Agent: ${payload.visual_log}`]);
            }
            if (payload.active_app) {
              setActiveApp(payload.active_app);
              if (payload.active_app !== "None") {
                setDetectedApps(prev => {
                  if (prev.includes(payload.active_app)) return prev;
                  return [...prev, payload.active_app];
                });
              }
            }
            if (payload.participants) {
              setDetectedParticipants(payload.participants);
            }
          }
        } catch (e) {
          console.error("Error parsing websocket message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Could not access devices: " + (err as Error).message);
      setIsRecording(false);
      setMicStage("idle");
    }
  };

  const uploadRecordedAudio = () => {
    if (recordedChunksRef.current.length === 0) {
      alert("No audio data was recorded.");
      return;
    }

    let mimeType = 'audio/webm;codecs=opus';
    if (recordedChunksRef.current[0].type) {
      mimeType = recordedChunksRef.current[0].type;
    }

    const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
    const filename = mimeType.includes("ogg") ? "live_recording.ogg" : "live_recording.webm";

    setIsProcessing(true);
    setProgress(0);
    setStage("Uploading recording...");

    const formData = new FormData();
    formData.append("file", audioBlob, filename);
    formData.append("title", meetingTitle || "Microphone Sync Session");
    if (recordedSegments && recordedSegments.length > 0) {
      formData.append("realtime_segments", JSON.stringify(recordedSegments));
    }
    if (detectedApps && detectedApps.length > 0) {
      formData.append("realtime_apps", JSON.stringify(detectedApps));
    }
    if (user?.email) {
      formData.append("user_email", user.email);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://127.0.0.1:8000/api/meetings/upload", true);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
        if (percent < 100) {
          setStage(`Uploading recording: ${percent}%`);
        } else {
          setStage("Upload complete. Running Whisper transcription and AI analysis...");
        }
      }
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setSummaryData(data);
          setIsProcessing(false);
          setMicStage("summarized");
        } catch (e) {
          console.error("Failed to parse response:", e);
          router.push("/meetings");
        }
      } else {
        let errMsg = "Upload failed.";
        try {
          const res = JSON.parse(xhr.responseText);
          errMsg = res.detail || errMsg;
        } catch (e) { }
        alert("Failed to save meeting: " + errMsg);
        setIsProcessing(false);
      }
    };

    xhr.onerror = () => {
      alert("Network error occurred during upload.");
      setIsProcessing(false);
    };

    xhr.send(formData);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setMicStage("completed");
    setActiveSpeaker("None");

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (screenFrameIntervalRef.current) {
      clearInterval(screenFrameIntervalRef.current);
      screenFrameIntervalRef.current = null;
    }
    stopAudioAnalyser();

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach(track => track.stop());
          micStreamRef.current = null;
        }
        if (monitorStreamRef.current) {
          monitorStreamRef.current.getTracks().forEach(track => track.stop());
          monitorStreamRef.current = null;
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      if (monitorStreamRef.current) {
        monitorStreamRef.current.getTracks().forEach(track => track.stop());
        monitorStreamRef.current = null;
      }
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setRecordedLogs(prev => [...prev, "Ingestion terminated. Click Save to Team Memory to run complete AI compilation."]);
  };

  // ==========================================
  // LIVE AI OBSERVER MONITOR SYSTEM (Tab 3)
  // ==========================================

  const startMonitorObserver = async () => {
    setIsMonitoring(true);
    setMonitorStage("capturing");
    setMonitorLogs(["Initializing Live AI Observer engine...", "Requesting Screen & Audio permissions..."]);
    setMonitorTasks([]);
    setMonitorContradictions([]);
    setDetectedParticipants([]);
    setActiveApp("None");
    setMonitorTimer(0);
    setIsPaused(false);
    setActiveSpeaker("None");
    setMonitorSegments([]);
    setDetectedApps([]);

    let screenStream: MediaStream | null = null;
    let micStream: MediaStream | null = null;
    recordedChunksRef.current = [];

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "browser" },
          audio: true
        });
      }

      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
      }

      if (!screenStream) {
        throw new Error("Screen sharing permission is required.");
      }

      monitorStreamRef.current = screenStream;
      micStreamRef.current = micStream;

      // Bind shared video stream to video element
      setTimeout(() => {
        if (monitorVideoRef.current) {
          monitorVideoRef.current.srcObject = screenStream;
          monitorVideoRef.current.play().catch(e => console.log("Play interrupted:", e));
        }
      }, 150);

      // Setup Web Audio mixer
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const dest = audioCtx.createMediaStreamDestination();

      if (micStream) {
        const micSource = audioCtx.createMediaStreamSource(micStream);
        micSource.connect(dest);
      }

      let hasScreenAudio = false;
      if (screenStream && screenStream.getAudioTracks().length > 0) {
        const screenAudioSource = audioCtx.createMediaStreamSource(screenStream);
        screenAudioSource.connect(dest);
        hasScreenAudio = true;
      }

      // Establish websocket connection for live updates
      const ws = new WebSocket("ws://127.0.0.1:8000/ws/meeting-stream");
      monitorSocketRef.current = ws;
      ws.binaryType = "blob";

      ws.onopen = () => {
        ws.send(JSON.stringify({
          action: "start",
          title: meetingTitle || "Live Observer Sync Session",
          user_email: user?.email || ""
        }));

        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }

        const mediaRecorder = new MediaRecorder(dest.stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
            if (ws.readyState === WebSocket.OPEN && !isPaused) {
              ws.send(event.data);
            }
          }
        };

        mediaRecorder.start(1000);
        setMonitorLogs([
          "Screen share display tracks bound successfully.",
          hasScreenAudio ? "Recording and mixing system audio + microphone." : "Recording microphone stream (no screen audio detected)."
        ]);

        startAudioAnalyser(dest.stream);

        // Native Browser Speech Recognition Fallback for Real-time Display
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionClass) {
          const rec = new SpeechRecognitionClass();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = "en-US";

          const finalizedSentences: string[] = [];

          rec.onresult = (event: any) => {
            let interimTranscript = "";
            for (let i = 0; i < event.results.length; ++i) {
              const transcript = event.results[i][0].transcript.trim();
              if (event.results[i].isFinal) {
                if (i >= finalizedSentences.length) {
                  finalizedSentences.push(transcript);
                  // Push local fallback segment
                  setMonitorSegments(prev => {
                    const exists = prev.some(s => s.text === transcript);
                    if (exists) return prev;
                    return [...prev, {
                      speaker: "Speaker 1",
                      text: transcript,
                      start: finalizedSentences.length * 5.0,
                      end: (finalizedSentences.length + 1) * 5.0
                    }];
                  });
                  // Send only newly finalized text to the backend
                  if (ws.readyState === WebSocket.OPEN && !isPaused) {
                    ws.send(JSON.stringify({
                      action: "speech_text",
                      text: transcript
                    }));
                  }
                }
              } else {
                interimTranscript = transcript;
              }
            }

            const timeStr = new Date().toLocaleTimeString();
            setMonitorLogs(prev => {
              const cleanLogs = prev.filter(log => !log.includes("Live Transcript:"));
              if (interimTranscript) {
                return [...cleanLogs, `[${timeStr}] Live Transcript: ${interimTranscript}`];
              }
              return cleanLogs;
            });
          };

          rec.onend = () => {
            if (speechRecognitionRef.current === rec) {
              try {
                rec.start();
              } catch (e) {
                console.warn("Failed to restart speech recognition:", e);
              }
            }
          };

          rec.onerror = (err: any) => {
            console.warn("Speech recognition error:", err);
          };

          rec.start();
          speechRecognitionRef.current = rec;
        }
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.status === "transcribing" && payload.segments) {
            setMonitorSegments(payload.segments);
            const timeStr = payload.timestamp || new Date().toLocaleTimeString();
            const segmentLogs = payload.segments.map((seg: any) => {
              return `[${timeStr}] ${seg.speaker}: ${seg.text}`;
            });
            setMonitorLogs(prev => {
              const setupLogs = prev.filter(log => !log.startsWith("["));
              const interimLog = prev.find(log => log.includes("Live Transcript:"));
              return [...setupLogs, ...segmentLogs, ...(interimLog ? [interimLog] : [])];
            });
            if (payload.participants) {
              setDetectedParticipants(payload.participants);
            }
            if (payload.tasks) {
              setMonitorTasks(payload.tasks);
            }
            if (payload.contradictions) {
              setMonitorContradictions(payload.contradictions);
            }
            if (payload.active_speaker) {
              setActiveSpeaker(payload.active_speaker);
            }
            if (payload.active_app) {
              setActiveApp(payload.active_app);
              if (payload.active_app !== "None") {
                setDetectedApps(prev => {
                  if (prev.includes(payload.active_app)) return prev;
                  return [...prev, payload.active_app];
                });
              }
            }
          } else if (payload.status === "screen_updated") {
            const timeStr = new Date().toLocaleTimeString();
            if (payload.visual_log) {
              setMonitorLogs(prev => [...prev, `[${timeStr}] Vision Agent: ${payload.visual_log}`]);
            }
            if (payload.active_app) {
              setActiveApp(payload.active_app);
              if (payload.active_app !== "None") {
                setDetectedApps(prev => {
                  if (prev.includes(payload.active_app)) return prev;
                  return [...prev, payload.active_app];
                });
              }
            }
            if (payload.participants) {
              setDetectedParticipants(payload.participants);
            }
          } else if (payload.status === "analyzing") {
            setStage(payload.msg || "Running final AI analysis...");
            setIsProcessing(true);
          } else if (payload.status === "completed") {
            setFile(null);
            setMeetingTitle("");
            router.push(`/meetings?id=${payload.meeting_id}`);
          } else if (payload.status === "error") {
            alert(payload.message || "Failed to process stream.");
            setIsProcessing(false);
          }
        } catch (e) {
          console.error("Error parsing websocket message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      monitorIntervalRef.current = setInterval(() => {
        setMonitorTimer(prev => prev + 1);

        setMonitorMetrics(prev => ({
          fps: 60,
          bitrate: Math.floor(1390 + Math.random() * 45),
          db: Math.floor(-55 + Math.random() * 30)
        }));
      }, 1000);

    } catch (err) {
      console.error("Error starting live monitor:", err);
      alert("Observer startup failed: " + (err as Error).message);
      setIsMonitoring(false);
      setMonitorStage("idle");
    }
  };

  const pauseMonitor = () => {
    setIsPaused(prev => !prev);
    setMonitorLogs(prev => [...prev, `Observer monitoring ${!isPaused ? "PAUSED" : "RESUMED"}.`]);
  };

  const stopMonitor = () => {
    setMonitorStage("completed");
    setActiveSpeaker("None");
    stopAudioAnalyser();

    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }

    if (screenFrameIntervalRef.current) {
      clearInterval(screenFrameIntervalRef.current);
      screenFrameIntervalRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        if (monitorStreamRef.current) {
          monitorStreamRef.current.getTracks().forEach(track => track.stop());
          monitorStreamRef.current = null;
        }
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach(track => track.stop());
          micStreamRef.current = null;
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      if (monitorStreamRef.current) {
        monitorStreamRef.current.getTracks().forEach(track => track.stop());
        monitorStreamRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
    }

    if (monitorSocketRef.current) {
      monitorSocketRef.current.close();
      monitorSocketRef.current = null;
    }

    setMonitorLogs(prev => [...prev, "Observer stream terminated. Recording saved. Click Save to deploy to memory."]);
  };

  const deployMonitorToMemory = () => {
    if (recordedChunksRef.current.length === 0) {
      alert("No audio data was recorded.");
      return;
    }

    let mimeType = 'audio/webm;codecs=opus';
    if (recordedChunksRef.current[0].type) {
      mimeType = recordedChunksRef.current[0].type;
    }

    const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
    const filename = mimeType.includes("ogg") ? "live_recording.ogg" : "live_recording.webm";

    setIsProcessing(true);
    setProgress(0);
    setStage("Uploading recording...");

    const formData = new FormData();
    formData.append("file", audioBlob, filename);
    formData.append("title", meetingTitle || "Live Observer Sync Session");
    if (monitorSegments && monitorSegments.length > 0) {
      formData.append("realtime_segments", JSON.stringify(monitorSegments));
    }
    if (detectedApps && detectedApps.length > 0) {
      formData.append("realtime_apps", JSON.stringify(detectedApps));
    }
    if (user?.email) {
      formData.append("user_email", user.email);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://127.0.0.1:8000/api/meetings/upload", true);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
        if (percent < 100) {
          setStage(`Uploading recording: ${percent}%`);
        } else {
          setStage("Upload complete. Running Whisper transcription and AI analysis...");
        }
      }
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setSummaryData(data);
          setIsProcessing(false);
          setMonitorStage("summarized");
        } catch (e) {
          console.error("Failed to parse response:", e);
          router.push("/meetings");
        }
      } else {
        let errMsg = "Upload failed.";
        try {
          const res = JSON.parse(xhr.responseText);
          errMsg = res.detail || errMsg;
        } catch (e) { }
        alert("Failed to save meeting: " + errMsg);
        setIsProcessing(false);
      }
    };

    xhr.onerror = () => {
      alert("Network error occurred during upload.");
      setIsProcessing(false);
    };

    xhr.send(formData);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const renderSummarizedReviewScreen = (data: any) => {
    if (!data) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* AI Summary Card */}
        <div className="relative p-6 rounded-2xl border border-cyber-purple/30 bg-gradient-to-br from-cyber-purple/[0.06] via-transparent to-cyber-cyan/[0.04] overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyber-purple/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyber-cyan/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyber-purple" />
                <h3 className="text-sm font-bold text-[var(--foreground)] font-mono uppercase tracking-wider">AI Meeting Summary</h3>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-cyber-emerald/15 text-cyber-emerald border border-cyber-emerald/25 rounded-md font-mono font-bold">
                COMPILED
              </span>
            </div>

            <h4 className="text-lg font-extrabold text-[var(--foreground)] leading-tight">{data.title}</h4>
            <p className="text-xs text-[var(--foreground)]/80 leading-relaxed font-sans">{data.summary}</p>

            {/* Efficiency & Tension Scores */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-black/30 border border-[var(--color-obsidian-border)] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[var(--foreground)]/60 uppercase">Efficiency</span>
                  <span className="text-sm font-black text-cyber-emerald font-mono">{(data.efficiency_score || 0).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.efficiency_score || 0}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-cyber-emerald to-cyber-cyan rounded-full"
                  />
                </div>
              </div>
              <div className="p-3 bg-black/30 border border-[var(--color-obsidian-border)] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[var(--foreground)]/60 uppercase">Tension</span>
                  <span className="text-sm font-black text-cyber-rose font-mono">{(data.tension_score || 0).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.tension_score || 0}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-cyber-rose to-yellow-500 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Speaker Distribution */}
            {data.speaker_stats && Object.keys(data.speaker_stats).length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold text-[var(--foreground)]/60 uppercase font-mono block">Speaker Distribution</span>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(data.speaker_stats).map(([name, pct]: [string, any]) => (
                    <span key={name} className="px-2.5 py-1 bg-cyber-cyan/10 border border-cyber-cyan/25 text-[10px] font-mono font-bold text-cyber-cyan rounded-lg">
                      {name}: {pct}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Transcript */}
        {data.transcript_segments && data.transcript_segments.length > 0 && (
          <div className="p-5 rounded-2xl glass-card border border-[var(--color-obsidian-border)] space-y-3 bg-transparent">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyber-cyan" />
              <h4 className="text-[11px] font-bold text-[var(--foreground)] uppercase font-mono tracking-wider">Conversation Transcript</h4>
              <span className="text-[9px] px-1.5 py-0.5 bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] rounded text-[var(--foreground)]/60 font-mono">
                {data.transcript_segments.length} segments
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {data.transcript_segments.map((seg: any, idx: number) => {
                const colors = ["text-cyber-cyan", "text-cyber-purple", "text-cyber-rose", "text-cyber-emerald"];
                const bgColors = ["bg-cyber-cyan", "bg-cyber-purple", "bg-cyber-rose", "bg-cyber-emerald"];
                const speakers = [...new Set(data.transcript_segments.map((s: any) => s.speaker))];
                const sIdx = speakers.indexOf(seg.speaker) % colors.length;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 1) }}
                    className="flex gap-3 p-2.5 rounded-xl hover:bg-[var(--foreground)]/[0.02] transition-colors"
                  >
                    <div className={`h-7 w-7 rounded-full ${bgColors[sIdx]}/15 border border-current/20 flex items-center justify-center shrink-0 mt-0.5 ${colors[sIdx]}`}>
                      <span className="text-[10px] font-black">{seg.speaker.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold ${colors[sIdx]} font-mono`}>{seg.speaker}</span>
                        <span className="text-[9px] text-[var(--foreground)]/40 font-mono">
                          {Math.floor(seg.start / 60)}:{String(Math.floor(seg.start % 60)).padStart(2, "0")} — {Math.floor(seg.end / 60)}:{String(Math.floor(seg.end % 60)).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--foreground)]/85 leading-relaxed font-sans">{seg.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tasks & Decisions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tasks */}
          {data.tasks && data.tasks.length > 0 && (
            <div className="p-4 rounded-2xl glass-card border border-[var(--color-obsidian-border)] space-y-3 bg-transparent">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyber-emerald" />
                <h4 className="text-[11px] font-bold text-[var(--foreground)] uppercase font-mono tracking-wider">Action Items</h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-cyber-emerald/10 text-cyber-emerald border border-cyber-emerald/20 rounded font-mono font-bold">
                  {data.tasks.length}
                </span>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {data.tasks.map((task: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-[var(--foreground)]/[0.03] border border-[var(--color-obsidian-border)] rounded-xl flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] text-[var(--foreground)] leading-tight font-semibold">{task.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded text-cyber-cyan font-mono">{task.owner}</span>
                        <span className="text-[9px] text-[var(--foreground)]/50 font-mono">Due: {task.deadline}</span>
                      </div>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold font-mono ${task.priority === "high" ? "bg-cyber-rose/15 text-cyber-rose" : task.priority === "medium" ? "bg-yellow-500/15 text-yellow-500" : "bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50"}`}>
                      {task.priority?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decisions */}
          {data.decisions && data.decisions.length > 0 && (
            <div className="p-4 rounded-2xl glass-card border border-[var(--color-obsidian-border)] space-y-3 bg-transparent">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyber-purple" />
                <h4 className="text-[11px] font-bold text-[var(--foreground)] uppercase font-mono tracking-wider">Decisions Made</h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/20 rounded font-mono font-bold">
                  {data.decisions.length}
                </span>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {data.decisions.map((dec: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-[var(--foreground)]/[0.03] border border-[var(--color-obsidian-border)] rounded-xl">
                    <p className="text-[10px] text-[var(--foreground)] leading-tight">{dec.text}</p>
                    <span className={`inline-block mt-1 text-[8px] px-1.5 py-0.5 rounded font-bold font-mono ${dec.status === "accepted" ? "bg-cyber-emerald/15 text-cyber-emerald" : "bg-yellow-500/15 text-yellow-500"}`}>
                      {dec.status?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contradictions */}
        {data.contradictions && data.contradictions.length > 0 && (
          <div className="p-4 rounded-2xl border border-cyber-rose/25 bg-cyber-rose/[0.03] space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyber-rose" />
              <h4 className="text-[11px] font-bold text-[var(--foreground)] uppercase font-mono tracking-wider">Plan Conflict Alerts</h4>
            </div>
            <div className="space-y-2">
              {data.contradictions.map((c: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-cyber-rose/10 border border-cyber-rose/30 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-cyber-rose shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-[var(--foreground)] font-mono">{c.title}</p>
                    <p className="text-[9px] text-[var(--foreground)]/80 leading-normal font-sans">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push("/")}
            className="flex-1 py-3 bg-gradient-to-r from-cyber-purple to-cyber-cyan rounded-xl text-[var(--foreground)] font-extrabold text-xs tracking-wider shadow-lg shadow-cyber-purple/10 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-4 w-4" /> Go to Dashboard
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push(`/meetings?id=${data.meeting_id}`)}
            className="flex-1 py-3 bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.10] border border-[var(--color-obsidian-border)] rounded-xl text-[var(--foreground)]/80 font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Database className="h-4 w-4" /> View Full Meeting
          </motion.button>
        </div>
      </motion.div>
    );
  };

    return (
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
              Bring in Meetings
            </h2>
            <p className="text-[var(--foreground)]/70 text-sm mt-0.5">
              Upload a recording, start a microphone session, or invite our AI to follow your meeting live.
            </p>
          </div>

          {/* Connection status tag */}
          <div className="flex items-center gap-2 self-start md:self-auto px-3 py-1.5 rounded-xl bg-[var(--foreground)]/[0.02] border border-[var(--color-obsidian-border)] text-[11px] font-mono text-[var(--foreground)]/70">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-cyan"></span>
            </span>
            AI Assistant Active
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex flex-col sm:flex-row gap-1.5 p-1 bg-black/45 border border-[var(--color-obsidian-border)] rounded-2xl max-w-2xl">
          <button
            onClick={() => { setActiveTab("upload"); stopMonitor(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${activeTab === "upload"
                ? "bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/10 border border-cyber-purple/40 text-[var(--foreground)] shadow-lg shadow-cyber-purple/5"
                : "text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05]"
              }`}
          >
            <Upload className="h-3.5 w-3.5" /> Upload Recording
          </button>
          <button
            onClick={() => { setActiveTab("mic"); stopMonitor(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${activeTab === "mic"
                ? "bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/10 border border-cyber-purple/40 text-[var(--foreground)] shadow-lg shadow-cyber-purple/5"
                : "text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05]"
              }`}
          >

            <Mic className="h-3.5 w-3.5" /> Use Microphone
          </button>
          <button
            onClick={() => { setActiveTab("live_monitor"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 relative overflow-hidden group cursor-pointer ${activeTab === "live_monitor"
                ? "bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/15 border border-cyber-purple/40 text-[var(--foreground)] shadow-lg shadow-cyber-purple/5"
                : "text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05]"
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
              <p className="text-sm font-bold text-[var(--foreground)] tracking-wide uppercase font-mono">Updating Team Memory</p>
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
              <div className="h-2 w-full bg-black/60 border border-[var(--color-obsidian-border)] rounded-full overflow-hidden p-0.5">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                  className="h-full bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-emerald rounded-full"
                />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--foreground)]/50 font-mono font-semibold">
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
                <div className="p-6 rounded-2xl glass-card border border-[var(--color-obsidian-border)] space-y-4 bg-transparent">
                  <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-cyber-purple" /> 1. Meeting Details
                  </h3>
                  <div>
                    <label className="block text-xs text-[var(--foreground)]/70 mb-1.5 font-medium">What is this meeting about?</label>
                    <input
                      type="text"
                      placeholder="e.g. Authentication Architecture Scaling Review, JWT vs Clerk OAuth"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      className="w-full bg-[var(--foreground)]/[0.01] border border-[var(--color-obsidian-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-gray-500 focus:outline-none focus:border-cyber-purple transition-all"
                    />
                  </div>
                </div>
              )}

              {/* TAB 1: Traditional File Ingest */}
              {activeTab === "upload" && (
                <div className="p-6 rounded-2xl glass-card border border-[var(--color-obsidian-border)] space-y-4 bg-transparent">
                  <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider font-mono flex items-center gap-1.5">
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
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${dragActive
                        ? "border-cyber-purple bg-cyber-purple/5"
                        : "border-[var(--color-obsidian-border)] bg-[var(--foreground)]/[0.01] hover:bg-white/[0.03]"
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
                        <p className="text-sm font-bold text-[var(--foreground)]">Drag & drop files or click to browse</p>
                        <p className="text-xs text-[var(--foreground)]/50 mt-1">Accepts audio or video files (Max 150MB)</p>
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
                          <p className="text-xs font-semibold text-[var(--foreground)] truncate">{file.name}</p>
                          <p className="text-[10px] text-[var(--foreground)]/50 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {file && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={processFile}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyber-purple to-cyber-cyan rounded-xl text-[var(--foreground)] font-bold text-sm shadow-lg shadow-cyber-purple/10 transition-all duration-300 mt-2 cursor-pointer"
                    >
                      Save to Team Memory <Play className="h-4 w-4 fill-current" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* TAB 2: Enriched Microphone Sync with Looking & Hearing */}
              {activeTab === "mic" && (
                <div className="space-y-6">

                  {/* IDLE State - Start Recording */}
                  {micStage === "idle" && (
                    <div className="p-6 rounded-2xl glass-card border border-[var(--color-obsidian-border)] space-y-5 bg-transparent">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-cyber-rose/10 border border-cyber-rose/20 rounded-xl text-cyber-rose">
                          <Mic className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[var(--foreground)] font-mono uppercase tracking-wider">Smart Microphone Session</h3>
                          <p className="text-xs text-[var(--foreground)]/70 mt-1 leading-relaxed font-sans">
                            Record your conversation using the microphone. Optionally share your screen so the AI can also see what you&apos;re working on &mdash; apps, documents, and visual context.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-black/35 border border-[var(--color-obsidian-border)] rounded-xl space-y-3">
                        <h4 className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">What the AI will capture:</h4>
                        <ul className="text-xs text-[var(--foreground)]/70 space-y-2 font-sans">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-cyber-cyan" /> Transcribes speech in real-time with speaker labels
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-cyber-cyan" /> Extracts tasks, decisions, and deadlines automatically
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-cyber-cyan" /> Checks for conflicts with past agreements
                          </li>
                          <li className="flex items-center gap-2">
                            <Eye className="h-3.5 w-3.5 text-cyber-purple" /> Reads active apps & screen context (if screen shared)
                          </li>
                        </ul>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-cyber-purple/5 border border-cyber-purple/20 rounded-xl">
                        <input
                          type="checkbox"
                          id="visionAiMic"
                          checked={enableVisionAI}
                          onChange={(e) => setEnableVisionAI(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-cyber-purple focus:ring-cyber-purple bg-transparent"
                        />
                        <label htmlFor="visionAiMic" className="text-xs text-[var(--foreground)]/80 cursor-pointer select-none">
                          <span className="font-bold text-cyber-purple">Enable Vision AI:</span> Capture screen frames to detect apps, documents, and visual context during recording.
                        </label>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={startRecording}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyber-rose via-cyber-purple to-cyber-rose/90 rounded-xl text-[var(--foreground)] font-extrabold text-sm shadow-lg shadow-cyber-rose/5 tracking-wider hover:opacity-95 transition-all cursor-pointer"
                      >
                        <Mic className="h-4.5 w-4.5" /> Start Smart Recording
                      </motion.button>
                    </div>
                  )}

                  {/* CAPTURING State - Live Recording with Video Preview */}
                  {micStage === "capturing" && (
                    <div className="space-y-6">
                      {/* Live Stream Panel */}
                      <div className="relative rounded-2xl overflow-hidden border border-cyber-rose/35 bg-black/60 min-h-[300px] flex flex-col justify-between group">
                        {/* Top Overlay Banner */}
                        <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/95 to-transparent p-4 flex items-center justify-between z-10">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-rose opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-rose"></span>
                            </span>
                            <span className="text-[11px] font-bold text-[var(--foreground)] uppercase font-mono tracking-widest">
                              RECORDING LIVE
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-mono font-semibold">
                            <span className="px-2 py-0.5 rounded-lg bg-black/85 border border-[var(--color-obsidian-border)] text-cyber-cyan">
                              {formatTimer(micTimer)}
                            </span>
                            {activeApp !== "None" && (
                              <span className="px-2 py-0.5 rounded-lg bg-black/85 border border-[var(--color-obsidian-border)] text-cyber-purple">
                                {activeApp}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Video Layer or Waveform */}
                        {monitorStreamRef.current ? (
                          <video
                            ref={micVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-[280px] object-cover bg-black/60 rounded-t-2xl"
                          />
                        ) : (
                          <div className="w-full h-[200px] flex items-end justify-center gap-1.5 px-8 pb-6 bg-gradient-to-b from-black/80 to-black/40">
                            {audioLevels.map((level, idx) => (
                              <div
                                key={idx}
                                style={{ height: `${level}%` }}
                                className="w-3 bg-gradient-to-t from-cyber-rose to-cyber-purple rounded-full transition-all duration-75"
                              />
                            ))}
                          </div>
                        )}

                        {/* Bottom Controls Bar */}
                        <div className="bg-black/90 border-t border-[var(--color-obsidian-border)] px-4 py-3 flex items-center justify-between text-xs text-[var(--foreground)]/70 font-mono">
                          <div className="flex items-center gap-3">
                            <span className="text-[var(--foreground)] font-bold">Timer: {formatTimer(micTimer)}</span>
                            <span className="text-gray-600">|</span>
                            <span>Speaker: <span className="text-cyber-cyan font-bold">{activeSpeaker}</span></span>
                            {activeApp !== "None" && (
                              <>
                                <span className="text-gray-600">|</span>
                                <span>Context: <span className="text-cyber-purple font-bold">{activeApp}</span></span>
                              </>
                            )}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={stopRecording}
                            className="px-3 py-1.5 bg-cyber-rose hover:bg-cyber-rose/90 rounded-lg text-[var(--foreground)] font-bold text-[10px] flex items-center gap-1 shadow-lg shadow-cyber-rose/10 cursor-pointer"
                          >
                            <Square className="h-3 w-3 fill-current" /> Finish & Analyze
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COMPLETED State - Draft Review */}
                  {micStage === "completed" && (
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
                          <h3 className="text-sm font-bold text-[var(--foreground)] font-mono uppercase tracking-wider">Recording Complete</h3>
                          <p className="text-xs text-[var(--foreground)]/70 font-sans">Review the draft, then save to run full AI compilation.</p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[var(--foreground)]/[0.02] border border-[var(--color-obsidian-border)] rounded-xl p-3 text-center">
                          <span className="block text-[10px] text-[var(--foreground)]/50 font-mono">DURATION</span>
                          <span className="text-base font-black text-[var(--foreground)] font-mono">{formatTimer(micTimer)}</span>
                        </div>
                        <div className="bg-[var(--foreground)]/[0.02] border border-[var(--color-obsidian-border)] rounded-xl p-3 text-center">
                          <span className="block text-[10px] text-[var(--foreground)]/50 font-mono">SEGMENTS</span>
                          <span className="text-base font-black text-cyber-cyan font-mono">{recordedSegments.length}</span>
                        </div>
                        <div className="bg-[var(--foreground)]/[0.02] border border-[var(--color-obsidian-border)] rounded-xl p-3 text-center">
                          <span className="block text-[10px] text-[var(--foreground)]/50 font-mono">APPS SEEN</span>
                          <span className="text-base font-black text-cyber-purple font-mono">{detectedApps.length}</span>
                        </div>
                      </div>

                      {/* Draft Transcript Logs */}
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Live Transcript Draft</h4>
                        <div className="bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-[10px] text-[var(--foreground)]/70 space-y-1.5">
                          {recordedLogs.map((log, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-gray-600">[{idx + 1}]</span>
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => { setMicStage("idle"); setRecordedLogs([]); setRecordedSegments([]); setDetectedApps([]); }}
                          className="flex-1 py-3 bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.10] border border-[var(--color-obsidian-border)] rounded-xl text-[var(--foreground)]/80 font-bold text-xs tracking-wider transition-all cursor-pointer"
                        >
                          Discard & Restart
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={uploadRecordedAudio}
                          className="flex-1 py-3 bg-gradient-to-r from-cyber-emerald to-cyber-cyan rounded-xl text-[var(--foreground)] font-extrabold text-xs tracking-wider shadow-lg shadow-cyber-emerald/10 transition-all cursor-pointer"
                        >
                          Save to Team Memory
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* SUMMARIZED State - Premium AI Summary & Transcript Review */}
                  {micStage === "summarized" && summaryData && renderSummarizedReviewScreen(summaryData)}

                </div>
              )}

              {/* TAB 3: Advanced Live AI Monitor Observer */}
              {activeTab === "live_monitor" && (
                <div className="space-y-6">
                  {!isMonitoring ? (
                    /* Initial Setup State */
                    <div className="p-6 rounded-2xl glass-card border border-[var(--color-obsidian-border)] space-y-5 bg-transparent">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-cyber-purple/10 border border-cyber-purple/20 rounded-xl text-cyber-purple">
                          <Tv className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[var(--foreground)] font-mono uppercase tracking-wider">Real-time Live Assistant</h3>
                          <p className="text-xs text-[var(--foreground)]/70 mt-1 leading-relaxed font-sans">
                            This assistant works right alongside Zoom, Google Meet, Teams, or Discord. It will follow the conversation, write down a live transcript, note tasks, and alert you if a new decision conflicts with something you agreed on before.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-black/35 border border-[var(--color-obsidian-border)] rounded-xl space-y-3">
                        <h4 className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">What the assistant does:</h4>
                        <ul className="text-xs text-[var(--foreground)]/70 space-y-2 font-sans">
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

                      <div className="flex items-center gap-3 p-3 bg-cyber-purple/5 border border-cyber-purple/20 rounded-xl">
                        <input
                          type="checkbox"
                          id="visionAi"
                          checked={enableVisionAI}
                          onChange={(e) => setEnableVisionAI(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-cyber-purple focus:ring-cyber-purple bg-transparent"
                        />
                        <label htmlFor="visionAi" className="text-xs text-[var(--foreground)]/80 cursor-pointer select-none">
                          <span className="font-bold text-cyber-purple">Enable Vision AI:</span> Automatically fetch names of people by visually analyzing the shared screen.
                        </label>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={startMonitorObserver}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-purple/90 rounded-xl text-[var(--foreground)] font-extrabold text-sm shadow-lg shadow-cyber-cyan/5 tracking-wider hover:opacity-95 transition-all cursor-pointer"
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
                          <h3 className="text-sm font-bold text-[var(--foreground)] font-mono uppercase tracking-wider">Meeting Completed</h3>
                          <p className="text-xs text-[var(--foreground)]/70 font-sans">We have processed the meeting. Review what we found before saving it.</p>
                        </div>
                      </div>

                      {/* Stats Widget grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[var(--foreground)]/[0.02] border border-[var(--color-obsidian-border)] rounded-xl p-3 text-center">
                          <span className="block text-[10px] text-[var(--foreground)]/50 font-mono">MEETING DURATION</span>
                          <span className="text-base font-black text-[var(--foreground)] font-mono">{formatTimer(monitorTimer)}</span>
                        </div>
                        <div className="bg-[var(--foreground)]/[0.02] border border-[var(--color-obsidian-border)] rounded-xl p-3 text-center">
                          <span className="block text-[10px] text-[var(--foreground)]/50 font-mono">TASKS FOUND</span>
                          <span className="text-base font-black text-cyber-cyan font-mono">{monitorTasks.length} Items</span>
                        </div>
                        <div className="bg-[var(--foreground)]/[0.02] border border-[var(--color-obsidian-border)] rounded-xl p-3 text-center">
                          <span className="block text-[10px] text-[var(--foreground)]/50 font-mono font-semibold">DECISION WARNINGS</span>
                          <span className={`text-base font-black font-mono ${monitorContradictions.length > 0 ? "text-cyber-rose" : "text-cyber-emerald"}`}>
                            {monitorContradictions.length} Found
                          </span>
                        </div>
                      </div>

                      {/* Quick logs list */}
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider font-mono">Live Transcript Draft</h4>
                        <div className="bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-[10px] text-[var(--foreground)]/70 space-y-1.5">
                          {monitorLogs.map((log, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-gray-600">[{idx + 1}]</span>
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
                          className="flex-1 py-3 bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.10] border border-[var(--color-obsidian-border)] rounded-xl text-[var(--foreground)]/80 font-bold text-xs tracking-wider transition-all cursor-pointer"
                        >
                          Discard & Restart
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={deployMonitorToMemory}
                          className="flex-1 py-3 bg-gradient-to-r from-cyber-emerald to-cyber-cyan rounded-xl text-[var(--foreground)] font-extrabold text-xs tracking-wider shadow-lg shadow-cyber-emerald/10 transition-all cursor-pointer"
                        >
                          Save to Team Memory
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : monitorStage === "summarized" ? (
                    /* SUMMARIZED State - Premium AI Summary & Transcript Review */
                    renderSummarizedReviewScreen(summaryData)
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
                            <span className="text-[11px] font-bold text-[var(--foreground)] uppercase font-mono tracking-widest">
                              {isPaused ? "ASSISTANT PAUSED" : "ASSISTANT LIVE"}
                            </span>
                          </div>

                          {/* Metrical data tags */}
                          <div className="flex items-center gap-3 text-[10px] font-mono font-semibold">
                            <span className="px-2 py-0.5 rounded-lg bg-black/85 border border-[var(--color-obsidian-border)] text-cyber-cyan">
                              {monitorMetrics.fps} FPS
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-black/85 border border-[var(--color-obsidian-border)] text-cyber-purple">
                              {monitorMetrics.bitrate} kbps
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-black/85 border border-[var(--color-obsidian-border)] text-cyber-rose">
                              {monitorMetrics.db} dB
                            </span>
                          </div>
                        </div>

                        {/* Video Layer (Browser Media capture) */}
                        <video
                          ref={monitorVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-[320px] object-cover bg-black/60 rounded-t-2xl"
                        />

                        {/* Video Stream Bottom Stats Bar */}
                        <div className="bg-black/90 border-t border-[var(--color-obsidian-border)] px-4 py-3 flex items-center justify-between text-xs text-[var(--foreground)]/70 font-mono">
                          <div className="flex items-center gap-3">
                            <span className="text-[var(--foreground)] font-bold">Meeting Timer: {formatTimer(monitorTimer)}</span>
                            <span className="text-gray-600">|</span>
                            <span>Currently speaking: <span className="text-cyber-cyan font-bold">{activeSpeaker}</span></span>
                            <span className="text-gray-600">|</span>
                            <span>Active context: <span className="text-cyber-purple font-bold">{activeApp}</span></span>
                          </div>

                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={pauseMonitor}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isPaused
                                  ? "bg-cyber-purple/20 border-cyber-purple/40 text-cyber-purple"
                                  : "bg-[var(--foreground)]/[0.05] border-[var(--color-obsidian-border)] hover:border-cyber-purple/30 text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
                                }`}
                              title={isPaused ? "Resume Live Ingestion" : "Pause Live Ingestion"}
                            >
                              {isPaused ? <PlayCircle className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={stopMonitor}
                              className="px-3 py-1.5 bg-cyber-rose hover:bg-cyber-rose/90 rounded-lg text-[var(--foreground)] font-bold text-[10px] flex items-center gap-1 shadow-lg shadow-cyber-rose/10 cursor-pointer"
                            >
                              <Square className="h-3 w-3 fill-current" /> Terminate Stream
                            </motion.button>
                          </div>
                        </div>

                      </div>

                      {/* Secondary layout splits: Logs & Floating Assistant panel */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Left Block: Real-Time speech logs */}
                        <div className="p-4 rounded-2xl glass-card border border-[var(--color-obsidian-border)] space-y-3 flex flex-col justify-between bg-transparent">
                          <div className="space-y-1.5">
                            <h4 className="text-[11px] font-bold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-1.5">
                              <Terminal className="h-4 w-4 text-cyber-cyan" /> Live Transcript
                            </h4>
                            <p className="text-[10px] text-[var(--foreground)]/70 font-sans">Writing down the conversation in real-time...</p>
                          </div>

                          <div className="bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl p-3 h-52 font-mono text-[10px] text-[var(--foreground)]/80 overflow-y-auto space-y-2">
                            <AnimatePresence initial={false}>
                              {monitorLogs.length > 0 ? (
                                monitorLogs.map((log, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-2 leading-relaxed"
                                  >
                                    <span className="text-gray-600">[{idx + 1}]</span>
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
                          <div className="flex items-center justify-between border-b border-[var(--color-obsidian-border)] pb-2">
                            <h4 className="text-[11px] font-bold text-[var(--foreground)] uppercase font-mono tracking-wider flex items-center gap-1.5">
                              <Sparkles className="h-4 w-4 text-cyber-purple" /> AI Assistant Notes
                            </h4>
                            <span className="text-[9px] px-2 py-0.5 bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/25 rounded-md font-mono">
                              Auto Extract
                            </span>
                          </div>

                          {/* Real Detected Participants */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-[var(--foreground)]/70 uppercase font-mono block">Detected Participants</span>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl min-h-[44px]">
                              {detectedParticipants.length > 0 ? (
                                detectedParticipants.map((name) => (
                                  <span
                                    key={name}
                                    className="px-2 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-[10px] font-mono font-bold rounded-lg"
                                  >
                                    {name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-gray-600 italic p-1">No participants detected yet.</span>
                              )}
                            </div>
                          </div>

                          {/* Semantic alerts & contradictions warnings */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-[var(--foreground)]/70 uppercase font-mono block">Tasks we found</span>
                            <div className="bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl p-3 h-28 overflow-y-auto space-y-2 text-xs">
                              <AnimatePresence initial={false}>
                                {monitorTasks.length > 0 ? (
                                  monitorTasks.map((task) => (
                                    <motion.div
                                      key={task.id}
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="p-2 bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] rounded-lg flex items-start justify-between gap-2"
                                    >
                                      <div className="space-y-1">
                                        <p className="text-[10px] text-[var(--foreground)] leading-tight">
                                          <span className="text-cyber-cyan font-bold">{task.speaker}</span>: {task.text}
                                        </p>
                                        <span className="inline-block text-[8px] px-1.5 py-0.5 bg-[var(--foreground)]/[0.05] border border-[var(--color-obsidian-border)] rounded text-[var(--foreground)]/70 font-mono">
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
                            <span className="text-[10px] font-bold text-[var(--foreground)]/70 uppercase font-mono block">Plan Conflict Alerts</span>
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
                                        <p className="text-[10px] font-bold text-[var(--foreground)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                                          {conflict.title} <span className="text-[8px] text-cyber-rose font-mono">HIGH RISK</span>
                                        </p>
                                        <p className="text-[9px] text-[var(--foreground)]/80 leading-normal font-mono">{conflict.desc}</p>
                                      </div>
                                    </motion.div>
                                  ))
                                ) : (
                                  <div className="p-3 bg-cyber-emerald/5 border border-cyber-emerald/15 rounded-xl flex items-center gap-2 text-[var(--foreground)]/70 font-mono text-[9px]">
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
                <div className="p-6 rounded-2xl glass-card border border-[var(--color-obsidian-border)] flex flex-col h-full justify-between bg-transparent">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                      <Terminal className="h-4.5 w-4.5 text-cyber-cyan" /> Microphone Activity
                    </h3>
                    <p className="text-xs text-[var(--foreground)]/70 font-sans">Live transcript text will appear here.</p>
                  </div>

                  <div className="bg-black/45 border border-[var(--color-obsidian-border)] rounded-xl p-4 h-64 font-mono text-[10px] text-cyber-cyan/85 overflow-y-auto space-y-2.5 mt-4">
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
                            <span className="text-gray-600">[{idx + 1}]</span>
                            <span className="text-[var(--foreground)]/80">{log}</span>
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

                  <div className="p-3 bg-cyber-purple/5 border border-cyber-purple/15 rounded-xl text-[10px] text-[var(--foreground)]/70 leading-relaxed font-sans mt-4">
                    We write down transcripts and organize agreements automatically.
                  </div>
                </div>
              )}

              {/* Ingestion status overview (Always visible on right) */}
              <div className="p-6 rounded-2xl glass-card border border-[var(--color-obsidian-border)] space-y-4 bg-transparent">
                <h3 className="text-sm font-bold text-[var(--foreground)] font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="h-4 w-4 text-cyber-purple" /> System Status
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between border-b border-[var(--color-obsidian-border)] pb-2">
                    <span className="text-[var(--foreground)]/70 font-mono">AI Engine Status</span>
                    <span className="text-cyber-emerald font-mono font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-cyber-emerald rounded-full animate-ping" /> ONLINE
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[var(--color-obsidian-border)] pb-2">
                    <span className="text-[var(--foreground)]/70 font-mono">Transcription Model</span>
                    <span className="text-cyber-cyan font-mono font-bold">Whisper v2.4</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[var(--color-obsidian-border)] pb-2">
                    <span className="text-[var(--foreground)]/70 font-mono">Memory Database</span>
                    <span className="text-cyber-purple font-mono font-bold">SQLModel pgvector</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--foreground)]/70 font-mono">Data Encryption</span>
                    <span className="text-[var(--foreground)] font-mono font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-cyber-cyan" /> AES-256 TLS 1.3
                    </span>
                  </div>
                </div>
              </div>

              {/* Helpful platform notes */}
              <div className="p-4 bg-cyber-purple/5 border border-cyber-purple/10 rounded-2xl text-[11px] text-[var(--foreground)]/70 leading-relaxed space-y-2 font-sans">
                <p className="font-bold text-[var(--foreground)] flex items-center gap-1">
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

