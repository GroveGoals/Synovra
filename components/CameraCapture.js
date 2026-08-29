"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, RefreshCw, Zap, ZapOff, Clock } from "lucide-react";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [facingMode, setFacingMode] = useState("user");
  const [flashOn, setFlashOn] = useState(false);
  const [mode, setMode] = useState("photo"); // "photo" | "video"
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  const startStream = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: mode === "video",
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError("Couldn't access camera. Check your browser's camera permissions.");
    }
  }, [facingMode, mode]);

  useEffect(() => {
    startStream();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startStream]);

  function flipCamera() {
    setFacingMode((f) => (f === "user" ? "environment" : "user"));
  }

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCapture({ mediaUrl: dataUrl, mediaType: "image" });
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const reader = new FileReader();
      reader.onload = () => onCapture({ mediaUrl: reader.result, mediaType: "video" });
      reader.readAsDataURL(blob);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function handleCapturePress() {
    if (mode === "photo") {
      if (countdown > 0) {
        let n = countdown;
        const tick = setInterval(() => {
          n -= 1;
          if (n <= 0) {
            clearInterval(tick);
            takePhoto();
          }
        }, 1000);
      } else {
        takePhoto();
      }
    } else {
      recording ? stopRecording() : startRecording();
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 500, display: "flex", flexDirection: "column" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ flex: 1, width: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {error && (
        <div style={{ position: "absolute", top: "40%", left: 20, right: 20, color: "white", textAlign: "center", fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: 16 }}>
        <button onClick={onClose} aria-label="Close" style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={18} />
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setFlashOn((v) => !v)} aria-label="Toggle flash" style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {flashOn ? <Zap size={16} /> : <ZapOff size={16} />}
          </button>
          <button onClick={() => setCountdown((c) => (c === 0 ? 3 : 0))} aria-label="Toggle timer" style={{ background: countdown ? "var(--accent)" : "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={16} />
          </button>
          <button onClick={flipCamera} aria-label="Flip camera" style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", gap: 24 }}>
          <button
            onClick={() => setMode("photo")}
            style={{ background: "none", border: "none", color: mode === "photo" ? "white" : "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}
          >
            PHOTO
          </button>
          <button
            onClick={() => setMode("video")}
            style={{ background: "none", border: "none", color: mode === "video" ? "white" : "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}
          >
            VIDEO
          </button>
        </div>

        <button
          onClick={handleCapturePress}
          aria-label={mode === "photo" ? "Take photo" : recording ? "Stop recording" : "Start recording"}
          style={{
            width: 72, height: 72, borderRadius: "50%",
            border: "4px solid white", background: recording ? "#ff4d4d" : "white",
            transition: "background 0.2s",
          }}
        />
      </div>
    </div>
  );
}
