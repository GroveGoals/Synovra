"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { RotateCw, ZoomIn, Check, X } from "lucide-react";

const PREVIEW_SIZE = 260; // on-screen circular preview, px
const OUTPUT_SIZE = 480; // final exported image, px

export default function AvatarCropper({ imageSrc, onCancel, onSave }) {
  const imgRef = useRef(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [angle, setAngle] = useState(0); // degrees, any value
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageSrc;
  }, [imageSrc]);

  const baseScale = naturalSize
    ? Math.max(PREVIEW_SIZE / naturalSize.w, PREVIEW_SIZE / naturalSize.h)
    : 1;
  const effectiveScale = baseScale * zoom;

  function handlePointerDown(e) {
    dragState.current = { startX: e.clientX, startY: e.clientY, origin: { ...offset } };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset({ x: dragState.current.origin.x + dx, y: dragState.current.origin.y + dy });
  }
  function handlePointerUp() {
    dragState.current = null;
  }

  const handleSave = useCallback(() => {
    if (!naturalSize) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    const outputScaleFactor = OUTPUT_SIZE / PREVIEW_SIZE;

    ctx.save();
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.translate(
      OUTPUT_SIZE / 2 + offset.x * outputScaleFactor,
      OUTPUT_SIZE / 2 + offset.y * outputScaleFactor
    );
    ctx.rotate((angle * Math.PI) / 180);
    ctx.scale(effectiveScale * outputScaleFactor, effectiveScale * outputScaleFactor);
    ctx.drawImage(imgRef.current, -naturalSize.w / 2, -naturalSize.h / 2);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onSave(dataUrl);
  }, [naturalSize, offset, angle, effectiveScale, onSave]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 340, padding: 22 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Adjust photo
          </h2>
          <button onClick={onCancel} style={{ color: "var(--text-muted)" }} aria-label="Cancel">
            <X size={18} />
          </button>
        </div>

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            width: PREVIEW_SIZE, height: PREVIEW_SIZE, borderRadius: "50%",
            overflow: "hidden", margin: "0 auto 20px", position: "relative",
            background: "var(--surface-2)", border: "1px solid var(--border)",
            cursor: "grab", touchAction: "none",
          }}
        >
          {naturalSize && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              style={{
                position: "absolute", left: "50%", top: "50%",
                width: naturalSize.w, height: naturalSize.h,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${angle}deg) scale(${effectiveScale})`,
                transformOrigin: "center center",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
            <ZoomIn size={13} /> Zoom
          </label>
          <input
            type="range" min="1" max="3" step="0.01" value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div className="mb-5">
          <label className="flex items-center gap-2 text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
            <RotateCw size={13} /> Rotate
          </label>
          <input
            type="range" min="-180" max="180" step="1" value={angle}
            onChange={(e) => setAngle(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-primary" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            <Check size={15} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
