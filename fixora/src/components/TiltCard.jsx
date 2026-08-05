import React, { useRef, useState } from "react";

/**
 * Wraps children in a perspective container and tilts them in 3D based on
 * cursor position, with a soft specular highlight that follows the mouse —
 * the classic "3D card" effect, done with plain transforms (no libraries).
 */
export default function TiltCard({ children, className = "", intensity = 10, glare = true }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({ opacity: 0 });

  function handleMouseMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 → 1
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * intensity * 2;
    const rotateX = (0.5 - y) * intensity * 2;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`,
      transition: "transform 0.05s linear",
    });
    setGlareStyle({
      opacity: 0.18,
      background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.9), transparent 60%)`,
    });
  }

  function handleMouseLeave() {
    setStyle({ transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)", transition: "transform 0.4s ease" });
    setGlareStyle({ opacity: 0 });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ ...style, willChange: "transform" }}
    >
      <div style={{ position: "relative" }}>
        {children}
        {glare && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ ...glareStyle, transition: "opacity 0.2s ease" }}
          />
        )}
      </div>
    </div>
  );
}
