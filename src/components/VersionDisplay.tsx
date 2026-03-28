"use client";

import React from "react";

interface VersionDisplayProps {
  version: string | null;
  className?: string;
}

/**
 * VersionDisplay component that parses version strings and extracts build numbers.
 * Established pattern from the mobile application (v2.0.0+20260328 -> v2.0.0 (Build 20260328)).
 */
const VersionDisplay: React.FC<VersionDisplayProps> = ({ version, className }) => {
  if (!version) return null;

  // Handle formats like "2.0.0+20260328"
  if (version.includes("+")) {
    const [baseVersion, buildNumber] = version.split("+");
    return (
      <div className={`flex flex-col items-center gap-1 ${className || ""}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
        <span className="badge">v{baseVersion}</span>

        <span 
          style={{
            padding: "2px 8px",
            background: "rgba(59, 130, 246, 0.08)",
            borderRadius: "6px",
            fontSize: "0.6rem",
            fontWeight: 700,
            color: "var(--accent-blue)",
            border: "1px solid rgba(59, 130, 246, 0.15)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontFamily: "var(--font-inter), sans-serif",
            opacity: 0.9
          }}
        >
          Build {buildNumber}
        </span>
      </div>
    );

  }

  // Fallback for simple versions
  return (
    <div className={className}>
      <span className="badge">v{version}</span>
    </div>
  );
};

export default VersionDisplay;
