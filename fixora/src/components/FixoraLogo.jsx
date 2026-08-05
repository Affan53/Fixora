import React from "react";

/**
 * The real Fixora logo mark, as uploaded — a white gear+wrench icon with the
 * background keyed to transparent, sitting on our brand orange badge.
 */
export default function FixoraLogo({ size = 32, background = "#2563EB" }) {
  return (
    <div
      className="rounded-md flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background }}
    >
      <img src="/images/logo-mark.png" alt="Fixora" style={{ width: size * 0.62, height: size * 0.62 }} />
    </div>
  );
}
