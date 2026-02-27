"use client";

import { useState, useRef, useEffect } from "react";
import { Barber } from "@/lib/types";
import { BARBER_COLOR_MAP } from "@/lib/barber-colors";

type Props = {
  barbers: Barber[];
  selectedId: string;
  onChange: (id: string) => void;
};

export default function BarberSwitcher({ barbers, selectedId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = barbers.find((b) => b.id === selectedId);
  const colors = selected ? BARBER_COLOR_MAP[selected.color] : null;

  return (
    <div ref={ref} className="relative min-w-[160px]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition-all"
      >
        {colors && (
          <span className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
        )}
        <span className="text-sm font-medium text-gray-900 flex-1 text-left">
          {selected?.name ?? "Select barber"}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1 overflow-hidden">
          {barbers.map((barber) => {
            const c = BARBER_COLOR_MAP[barber.color];
            const isSelected = barber.id === selectedId;
            return (
              <button
                key={barber.id}
                onClick={() => {
                  onChange(barber.id);
                  setOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                  isSelected ? "bg-gray-50 font-medium" : "hover:bg-gray-50"
                }`}
              >
                {c && (
                  <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                )}
                <span className="flex-1 text-left text-gray-900">
                  {barber.name}
                </span>
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-900"
                  >
                    <path d="M3 7L6 10L11 4" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
