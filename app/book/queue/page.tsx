"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  loadServicesAsync,
  loadShopSettingsAsync,
  loadQueue,
  saveQueue,
  upsertCustomer,
  persistQueueEntry,
} from "@/lib/settings";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Service, QueueEntry } from "@/lib/types";

const TOTAL_STEPS = 2;


export default function JoinQueuePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const [services, setServices] = useState<Service[]>([]);
  const [shopName, setShopName] = useState("Classic Cuts");

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadServicesAsync().then(setServices);
    loadShopSettingsAsync().then(s => { if (s.shopName) setShopName(s.shopName); });
  }, []);

  function goNext() {
    setDirection("forward");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS + 1));
  }
  function goBack() {
    setDirection("back");
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    if (!selectedService || !name.trim() || !phone.trim()) return;
    setIsSubmitting(true);
    try {
      // Get accurate position from Supabase, fall back to localStorage count
      let position = loadQueue().length + 1;
      if (isSupabaseConfigured()) {
        try {
          const { count } = await supabase
            .from("queue_entries")
            .select("*", { count: "exact", head: true });
          position = (count ?? 0) + 1;
        } catch { /* use localStorage count */ }
      }

      const customer = upsertCustomer(name, phone, email);
      const newEntry: QueueEntry = {
        id: crypto.randomUUID(),
        clientName: name,
        clientPhone: phone,
        clientEmail: email,
        customerId: customer.id,
        serviceId: selectedService.id,
        barberId: "",
        waitMinutes: 0,
        position,
        joinedAt: new Date().toISOString(),
      };
      saveQueue([...loadQueue(), newEntry]);
      if (isSupabaseConfigured()) {
        await persistQueueEntry(newEntry);
      }
      router.push(`/book/status/${newEntry.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const animClass =
    direction === "forward"
      ? "animate-[fadeSlideIn_0.25s_ease-out]"
      : "animate-[fadeSlideBack_0.25s_ease-out]";

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideBack {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div className="w-full max-w-lg mb-6">
        <button
          onClick={() => step === 1 ? router.push("/book") : goBack()}
          className="text-gray-500 hover:text-white text-sm mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-white">{shopName}</h1>
        {step <= TOTAL_STEPS && (
          <div className="flex gap-1.5 mt-3">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < step ? "bg-white" : "bg-gray-800"}`} />
            ))}
          </div>
        )}
        {step <= TOTAL_STEPS && (
          <p className="text-gray-500 text-xs mt-2">Step {step} of {TOTAL_STEPS}</p>
        )}
      </div>

      {/* Steps */}
      <div key={step} className={`w-full max-w-lg ${animClass}`}>

        {/* STEP 1 — Choose Service */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">What do you need?</h2>
            <p className="text-sm text-gray-400 mb-5">Choose your service to get in line.</p>
            <div className="space-y-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedService(s);
                    goNext();
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-150 text-left ${
                    selectedService?.id === s.id
                      ? "border-white bg-gray-800"
                      : "border-gray-800 bg-gray-900 hover:border-gray-600"
                  }`}
                >
                  <div>
                    <span className="text-white font-medium">{s.name}</span>
                    <span className="text-gray-500 text-sm ml-2">{s.durationMinutes} min</span>
                  </div>
                  <span className="text-white font-semibold">${s.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Enter Info */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Your information</h2>
            <p className="text-sm text-gray-400 mb-5">We&apos;ll show you live updates on the next page.</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || !phone.trim() || isSubmitting}
                className="w-full bg-white text-gray-950 rounded-xl py-3 text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? "Joining..." : "Join the queue"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
