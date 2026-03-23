"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadShopSettings } from "@/lib/settings";

export default function BookingLandingPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("Classic Cuts");

  useEffect(() => {
    const s = loadShopSettings();
    if (s.shopName) setShopName(s.shopName);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.5 8.5l-1 1a4.95 4.95 0 0 0 7 7l1-1" />
            <path d="M18.5 15.5l1-1a4.95 4.95 0 0 0-7-7l-1 1" />
            <line x1="9" y1="15" x2="4.5" y2="19.5" />
            <line x1="15" y1="9" x2="19.5" y2="4.5" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{shopName}</h1>
        <p className="text-gray-400 mt-2 text-base">How would you like to get seen today?</p>
      </div>

      <div className="w-full max-w-lg grid grid-cols-1 gap-4">
        {/* Join Queue Card — primary flow */}
        <button
          onClick={() => router.push("/book/queue")}
          className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left hover:border-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/15 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Join the Queue</h2>
          <p className="text-sm text-gray-400 leading-relaxed">Walk in and get in line. We&apos;ll text you when your barber is ready.</p>
          <div className="mt-5 w-full bg-white text-gray-950 rounded-xl py-2.5 text-sm font-semibold text-center group-hover:bg-gray-100 transition-colors">
            Join queue
          </div>
        </button>

        {/* Book Appointment Card — disabled until server-side booking is built */}
        <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left opacity-50 cursor-not-allowed">
          <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Coming soon</span>
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Book Appointment</h2>
          <p className="text-sm text-gray-400 leading-relaxed">Choose your barber, pick a date & time, and lock in your spot.</p>
          <div className="mt-5 w-full bg-white/10 text-gray-500 border border-gray-800 rounded-xl py-2.5 text-sm font-semibold text-center">
            Book now
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-xs mt-8">Powered by BarberPro</p>
    </div>
  );
}
