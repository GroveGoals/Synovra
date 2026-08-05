"use client";
import { Check, Circle, X, Loader2 } from "lucide-react";

export function PasswordRequirement({ met, label }) {
  return (
    <div className={`pw-req ${met ? "met" : ""}`}>
      {met ? <Check size={13} /> : <Circle size={13} />}
      <span>{label}</span>
    </div>
  );
}

export function UsernameStatus({ status }) {
  if (status === "checking") {
    return (
      <div className="pw-req">
        <Loader2 size={13} className="animate-spin" />
        <span>Checking availability…</span>
      </div>
    );
  }
  if (status === "available") {
    return (
      <div className="pw-req met">
        <Check size={13} />
        <span>Username available</span>
      </div>
    );
  }
  if (status === "taken") {
    return (
      <div className="pw-req taken">
        <X size={13} />
        <span>Username already taken</span>
      </div>
    );
  }
  return null;
}
