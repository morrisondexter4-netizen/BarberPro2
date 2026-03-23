"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  loadBarbersAsync,
  loadServicesAsync,
  loadShopSettingsAsync,
  loadAppointmentsAsync,
  getServiceDuration,
  persistAppointment,
  upsertCustomer,
  localDateString,
} from "@/lib/settings";
import type { Appointment, Barber, Service } from "@/lib/types";

const BARBER_DOT: Record<string, string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

type AppointmentSlot = { barberId: string; date: string; startTime: string; endTime: string; status: string };

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(m: number) {
  return `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;
}
function formatTime12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}
function formatDateNice(d: string) {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getEffectiveBounds(
  barberStartMin: number,
  barberEndMin: number,
  shopOpenMin: number | null,
  shopCloseMin: number | null,
): { effectiveStart: number; effectiveEnd: number } {
  return {
    effectiveStart: shopOpenMin !== null ? Math.max(barberStartMin, shopOpenMin) : barberStartMin,
    effectiveEnd: shopCloseMin !== null ? Math.min(barberEndMin, shopCloseMin) : barberEndMin,
  };
}

const TOTAL_STEPS = 5;

export default function BookAppointmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [shopName, setShopName] = useState("Classic Cuts");
  const [shopHours, setShopHours] = useState<Record<string, { open: boolean; openTime: string; closeTime: string }>>({});
  const [existingApts, setExistingApts] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [b, s, settings, apts] = await Promise.all([
          loadBarbersAsync(),
          loadServicesAsync(),
          loadShopSettingsAsync(),
          loadAppointmentsAsync(),
        ]);
        setBarbers(b);
        setServices(s);
        if (settings.shopName) setShopName(settings.shopName);
        if (settings.hours) setShopHours(settings.hours);
        setExistingApts(apts.map(({ barberId, date, startTime, endTime, status }) => ({
          barberId, date, startTime, endTime, status,
        })));
      } catch (err) {
        console.error("Failed to load booking data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function goNext() {
    setDirection("forward");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS + 1));
  }
  function goBack() {
    setDirection("back");
    setStep((s) => Math.max(s - 1, 1));
  }

  const availableDates = useMemo(() => {
    if (!selectedBarber) return [];
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      if (!selectedBarber.workDays.includes(dow)) continue;
      if (shopHours[DAY_KEYS[dow]] && !shopHours[DAY_KEYS[dow]].open) continue;
      dates.push(localDateString(d));
    }
    return dates;
  }, [selectedBarber, shopHours]);

  const availableSlots = useMemo(() => {
    if (!selectedBarber || !selectedDate) return [];
    const dow = new Date(selectedDate + "T12:00:00").getDay();
    const shopDay = shopHours[DAY_KEYS[dow]];
    const shopOpenMin = shopDay?.open && shopDay.openTime ? timeToMinutes(shopDay.openTime) : null;
    const shopCloseMin = shopDay?.open && shopDay.closeTime ? timeToMinutes(shopDay.closeTime) : null;
    const barberStart = timeToMinutes(selectedBarber.startTime);
    const barberEnd = timeToMinutes(selectedBarber.endTime);
    const { effectiveStart: start, effectiveEnd: end } = getEffectiveBounds(barberStart, barberEnd, shopOpenMin, shopCloseMin);
    const lunchStart = selectedBarber.lunchBreak ? timeToMinutes(selectedBarber.lunchBreak.start) : null;
    const lunchEnd = selectedBarber.lunchBreak ? timeToMinutes(selectedBarber.lunchBreak.end) : null;

    const dayApts = existingApts.filter(
      (a) => a.barberId === selectedBarber.id && a.date === selectedDate && a.status !== "cancelled"
    );

    const slots: string[] = [];
    for (let t = start; t + 15 <= end; t += 15) {
      const slotEnd = t + 15;
      if (lunchStart !== null && lunchEnd !== null && t < lunchEnd && slotEnd > lunchStart) continue;
      const overlaps = dayApts.some((a) => {
        const aStart = timeToMinutes(a.startTime);
        const aEnd = timeToMinutes(a.endTime);
        return t < aEnd && slotEnd > aStart;
      });
      if (overlaps) continue;
      slots.push(minutesToTime(t));
    }
    return slots;
  }, [selectedBarber, selectedDate, existingApts]);

  async function handleSubmit() {
    if (!selectedBarber || !selectedDate || !selectedTime || !selectedService || !name.trim() || !phone.trim()) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const startMin = timeToMinutes(selectedTime);
      const duration = getServiceDuration(selectedService, selectedBarber);
      const endMin = startMin + duration;
      const endTime = minutesToTime(endMin);

      const dow = new Date(selectedDate + "T12:00:00").getDay();
      const shopDay = shopHours[DAY_KEYS[dow]];
      const shopOpenMin = shopDay?.open && shopDay.openTime ? timeToMinutes(shopDay.openTime) : null;
      const shopCloseMin = shopDay?.open && shopDay.closeTime ? timeToMinutes(shopDay.closeTime) : null;
      const { effectiveEnd } = getEffectiveBounds(
        timeToMinutes(selectedBarber.startTime),
        timeToMinutes(selectedBarber.endTime),
        shopOpenMin,
        shopCloseMin,
      );
      if (endMin > effectiveEnd) {
        setSubmitError("This service won't fit before closing time. Please choose an earlier slot.");
        setSubmitting(false);
        return;
      }
      if (selectedBarber.lunchBreak) {
        const lStart = timeToMinutes(selectedBarber.lunchBreak.start);
        const lEnd = timeToMinutes(selectedBarber.lunchBreak.end);
        if (startMin < lEnd && endMin > lStart) {
          setSubmitError("This time overlaps with the barber's lunch break. Please choose a different slot.");
          setSubmitting(false);
          return;
        }
      }

      const customer = upsertCustomer(name.trim(), phone.trim(), email.trim());

      const appt: Appointment = {
        id: crypto.randomUUID(),
        clientName: name.trim(),
        clientPhone: phone.trim(),
        clientEmail: email.trim(),
        customerId: customer.id,
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
        startTime: selectedTime,
        endTime,
        date: selectedDate,
        status: "scheduled",
        fromQueue: false,
      };

      await persistAppointment(appt);
      setSubmitted(true);
      goNext();
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const animClass =
    direction === "forward"
      ? "animate-[fadeSlideIn_0.25s_ease-out]"
      : "animate-[fadeSlideBack_0.25s_ease-out]";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

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

        {/* STEP 1 — Choose Barber */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Choose your barber</h2>
            <p className="text-sm text-gray-400 mb-5">Select who you&apos;d like to see.</p>
            <div className="space-y-2">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBarber(b); setSelectedDate(null); setSelectedTime(null); goNext(); }}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-150 text-left ${
                    selectedBarber?.id === b.id ? "border-white bg-gray-800" : "border-gray-800 bg-gray-900 hover:border-gray-600"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${BARBER_DOT[b.color] ?? "bg-gray-500"}`} />
                  <span className="text-white font-medium">{b.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Choose Date */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Pick a date</h2>
            <p className="text-sm text-gray-400 mb-5">Showing available days for {selectedBarber?.name}.</p>
            {availableDates.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">No available dates in the next 30 days.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableDates.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setSelectedDate(d); setSelectedTime(null); goNext(); }}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all duration-150 ${
                      selectedDate === d ? "border-white bg-gray-800 text-white" : "border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    {formatDateNice(d)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Choose Time */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Pick a time</h2>
            <p className="text-sm text-gray-400 mb-5">
              {selectedDate && formatDateNice(selectedDate)} with {selectedBarber?.name}
            </p>
            {availableSlots.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">No available times on this date. Try another day.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setSelectedTime(t); goNext(); }}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all duration-150 ${
                      selectedTime === t ? "border-white bg-gray-800 text-white" : "border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    {formatTime12(t)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4 — Choose Service */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Choose a service</h2>
            <p className="text-sm text-gray-400 mb-5">What are you coming in for?</p>
            <div className="space-y-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); goNext(); }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-150 text-left ${
                    selectedService?.id === s.id ? "border-white bg-gray-800" : "border-gray-800 bg-gray-900 hover:border-gray-600"
                  }`}
                >
                  <div>
                    <span className="text-white font-medium">{s.name}</span>
                    <span className="text-gray-500 text-sm ml-2">{getServiceDuration(s, selectedBarber ?? undefined)} min</span>
                  </div>
                  <span className="text-white font-semibold">${s.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5 — Enter Info */}
        {step === 5 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Your information</h2>
            <p className="text-sm text-gray-400 mb-5">So we can reach you about your appointment.</p>
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
                <label className="text-sm text-gray-400 block mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
                />
              </div>
              {submitError && (
                <p className="text-sm text-red-400 text-center">{submitError}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || !phone.trim() || submitting}
                className="w-full bg-white text-gray-950 rounded-xl py-3 text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                {submitting ? "Booking..." : "Confirm booking"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 6 — Confirmation */}
        {step === TOTAL_STEPS + 1 && submitted && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h2>
            <p className="text-gray-400 mb-6">Your appointment has been booked.</p>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-left space-y-2 mb-8">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Barber</span>
                <span className="text-white text-sm font-medium">{selectedBarber?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Date</span>
                <span className="text-white text-sm font-medium">{selectedDate && formatDateNice(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Time</span>
                <span className="text-white text-sm font-medium">{selectedTime && formatTime12(selectedTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Service</span>
                <span className="text-white text-sm font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Price</span>
                <span className="text-white text-sm font-medium">${selectedService?.price}</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/book")}
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              ← Back to home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
