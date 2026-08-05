import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Custom dropdown with full control over contrast/styling — replaces the
 * native <select>, whose popup list renders using the OS's own colors
 * (often low-contrast gray-on-white, as seen in browser screenshots) and
 * can't be restyled with CSS.
 */
export default function LanguageDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.code === value) || options[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-lg border border-[#D7E3F4] px-3 py-2.5 text-sm bg-white text-[#14213D]"
      >
        <span>{selected.label}</span>
        <ChevronDown size={16} className={`text-[#6B7280] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto rounded-lg border border-[#D7E3F4] bg-white shadow-lg"
        >
          {options.map((o) => (
            <button
              key={o.code}
              type="button"
              onClick={() => {
                onChange(o.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between text-left px-3 py-2.5 text-sm hover:bg-[#E8F2FF] ${
                o.code === value ? "bg-[#E8F2FF] text-[#2563EB] font-medium" : "text-[#14213D]"
              }`}
            >
              <span>
                {o.label}
                {!o.supported && <span className="text-[#9CA3AF] text-xs"> · limited voice support</span>}
              </span>
              {o.code === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
