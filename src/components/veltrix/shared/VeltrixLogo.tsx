"use client";

import Image from "next/image";

export function VeltrixLogo({
  className = "",
  size = 32,
  withWordmark = true,
}: {
  className?: string;
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/veltrix-logo.svg"
        alt="VELTRIX logo"
        width={size * 3}
        height={size}
        priority
        className="h-auto w-auto"
        style={{ height: size, width: "auto" }}
      />
    </div>
  );
}

/** Just the V mark for tight spaces (favicon, avatars, etc.) */
export function VeltrixMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl veltrix-bg-gradient veltrix-glow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width={size * 0.7} height={size * 0.7} fill="none">
        <path d="M14 16 L26 16 L34 46 L42 16 L54 16 L40 56 L26 56 Z" fill="white" />
        <path d="M30 22 L36 22 L38 28 L33 30 Z" fill="rgba(255,255,255,0.6)" />
      </svg>
    </div>
  );
}
