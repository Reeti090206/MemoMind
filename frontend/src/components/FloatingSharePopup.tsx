import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Pause, Play, RotateCw } from "lucide-react";
import Draggable from "react-draggable";

interface FloatingSharePopupProps {
  isRecording: boolean;
  isPaused: boolean;
  timer: number;
  activeApp: string;
  onStop: () => void;
  onPauseAI: () => void;
  onMuteMic: () => void;
  onResumeRecording: () => void;
}

export default function FloatingSharePopup({
  isRecording,
  isPaused,
  timer,
  activeApp,
  onStop,
  onPauseAI,
  onMuteMic,
  onResumeRecording,
}: FloatingSharePopupProps) {
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const resetHideTimer = () => setVisible(true);

  useEffect(() => {
    if (!isRecording) return;
    const timeout = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timeout);
  }, [isRecording, timer, activeApp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleDragStop = (_e: any, data: any) => {
    const { innerWidth, innerHeight } = window;
    const popupWidth = 256;
    const popupHeight = 200;
    const corners = [
      { x: 0, y: 0 },
      { x: innerWidth - popupWidth, y: 0 },
      { x: 0, y: innerHeight - popupHeight },
      { x: innerWidth - popupWidth, y: innerHeight - popupHeight },
    ];
    const distances = corners.map(c => Math.hypot(data.x - c.x, data.y - c.y));
    const nearest = corners[distances.indexOf(Math.min(...distances))];
    setPosition(nearest);
  };

  if (!isRecording) return null;

  return (
    <AnimatePresence>
      {visible && (
        <Draggable
          nodeRef={nodeRef}
          position={position}
          onStop={handleDragStop}
          bounds="parent"
        >
          <div ref={nodeRef} onMouseEnter={resetHideTimer} onMouseLeave={resetHideTimer}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="fixed bottom-4 right-4 w-64 p-4 bg-[rgba(20,20,20,0.85)] backdrop-blur-md border border-[#3a3a3a] rounded-xl shadow-xl text-[var(--foreground)] z-50 cursor-move"
              style={{
                background: "rgba(30,30,30,0.9)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">You are presenting</span>
                <button onClick={onStop} className="text-red-400 hover:text-red-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs mb-2 truncate" title={activeApp}>
                {activeApp !== "None" ? activeApp : "No active window"}
              </div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span>⏱ {formatTime(timer)}</span>
                <button
                  onClick={isPaused ? onResumeRecording : onPauseAI}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                >
                  {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  {isPaused ? "Resume AI" : "Pause AI"}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={onMuteMic}
                  className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300"
                >
                  <Mic className="h-3 w-3" />
                  Mute Mic
                </button>
                <button
                  onClick={onResumeRecording}
                  className="flex items-center gap-1 text-green-400 hover:text-green-300"
                >
                  <RotateCw className="h-3 w-3" />
                  Resume Rec
                </button>
              </div>
            </motion.div>
          </div>
        </Draggable>
      )}
    </AnimatePresence>
  );
}
