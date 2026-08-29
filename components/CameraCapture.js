"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, RefreshCw, Zap, ZapOff, Clock, Image as ImageIcon } from "lucide-react";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const galleryInputRef = useRef(null);

  const [facingMode, setFacingMode] = useState("user");
  const [flashOn, setFlashOn] = useState(false);
  const [mode, setMode] = useState("photo"); // "photo" | "video"
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [lastThumb, setLastThumb] = useState(null);

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
      setError("");
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
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        setError("Camera isn't ready yet — give it a second and try again.");
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setLastThumb(dataUrl);
      onCapture({ mediaUrl: dataUrl, mediaType: "image" });
    } catch {
      setError("Couldn't take the photo. Try again.");
    }
  }

  function startRecording() {
    if (!streamRef.current) {
      setError("Camera isn't ready yet — give it a second and try again.");
      return;
    }
    try {
      chunksRef.current = [];
      const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          setLastThumb(reader.result);
          onCapture({ mediaUrl: reader.result, mediaType: "video" });
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Couldn't start recording. Try again.");
    }
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

  function handleGalleryPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();
    reader.onload = () => {
      setLastThumb(reader.result);
      onCapture({ mediaUrl: reader.result, mediaType: isVideo ? "video" : "image" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 12px" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          height: "100%",
          maxHeight: 760,
          borderRadius: 28,
          overflow: "hidden",
          background: "#111",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ flex: 1, width: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {error && (
          <div style={{ position: "absolute", top: "40%", left: 16, right: 16, color: "white", textAlign: "center", fontSize: 14, background: "rgba(0,0,0,0.6)", padding: 12, borderRadius: 10 }}>
            {error}
          </div>
        )}

        {/* Top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: 16 }}>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} />
          </button>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={() => setFlashOn((v) => !v)} aria-label="Toggle flash" style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {flashOn ? <Zap size={16} /> : <ZapOff size={16} />}
            </button>
            <button type="button" onClick={() => setCountdown((c) => (c === 0 ? 3 : 0))} aria-label="Toggle timer" style={{ background: countdown ? "var(--accent)" : "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={16} />
            </button>
            <button type="button" onClick={flipCamera} aria-label="Flip camera" style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Bottom controls */}
        <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", gap: 24 }}>
            <button
              type="button"
              onClick={() => setMode("photo")}
              style={{ background: "none", border: "none", color: mode === "photo" ? "white" : "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}
            >
              PHOTO
            </button>
            <button
              type="button"
              onClick={() => setMode("video")}
              style={{ background: "none", border: "none", color: mode === "video" ? "white" : "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}
            >
              VIDEO
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", width: "100%", padding: "0 20px", justifyContent: "center", position: "relative" }}>
            {/* Gallery import thumbnail. Note: browsers don't allow reading the device
                photo gallery without an explicit picker each time, so this shows the
                last thing captured/imported THIS session — not a live camera-roll feed. */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              aria-label="Import from gallery"
              style={{
                position: "absolute", left: 16, width: 42, height: 42, borderRadius: 10,
                border: "2px solid rgba(255,255,255,0.6)", overflow: "hidden",
                background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}
            >
              {lastThumb ? (
                <img src={lastThumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ImageIcon size={18} color="white" />
              )}
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleGalleryPick}
              style={{ display: "none" }}
            />

            {/* Capture button — square while recording, circle otherwise */}
            <button
              type="button"
              onClick={handleCapturePress}
              aria-label={mode === "photo" ? "Take photo" : recording ? "Stop recording" : "Start recording"}
              style={{
                width: 72, height: 72, borderRadius: "50%",
                border: "4px solid white", background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
              }}
            >
              <span
                style={{
                  display: "block",
                  width: recording ? 28 : mode === "video" ? 56 : 60,
                  height: recording ? 28 : mode === "video" ? 56 : 60,
                  borderRadius: recording ? 8 : "50%",
                  background: mode === "video" ? "#ff3b3b" : "white",
                  transition: "all 0.18s ease",
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
    }
