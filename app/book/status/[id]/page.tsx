"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  loadQueue,
  loadServicesAsync,
  loadShopSettings,
} from "@/lib/settings";
import { rowToQueueEntry } from "@/lib/db/queue";
import type { QueueEntry, Service } from "@/lib/types";

type PageState = "loading" | "waiting" | "offered" | "confirmed" | "called" | "not_found";

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function QueueStatusPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [entry, setEntry] = useState<QueueEntry | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [shopName, setShopName] = useState("Classic Cuts");
  const [position, setPosition] = useState(0);
  const [estWait, setEstWait] = useState(0);
  const [offeredTime, setOfferedTime] = useState<string>("");
  const [offeredDate, setOfferedDate] = useState<string>("");
  const [confirmedTime, setConfirmedTime] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  const wasInQueueRef = useRef(false);

  function computeStatus(currentQueue: QueueEntry[], serviceList: Service[]) {
    const sorted = [...currentQueue].sort((a, b) => a.position - b.position);
    const found = sorted.find((e) => e.id === id);

    if (!found) {
      if (wasInQueueRef.current) {
        setPageState("called");
      } else {
        setPageState("not_found");
      }
      return;
    }

    wasInQueueRef.current = true;
    setEntry(found);

    // Check for offered state
    if (found.status === "offered" && found.offeredTime) {
      setOfferedTime(found.offeredTime);
      setOfferedDate(found.offeredDate ?? "");
      setPageState("offered");
      return;
    }

    const idx = sorted.indexOf(found);
    const pos = idx + 1;
    setPosition(pos);

    // Sum durations of all entries ahead of this one
    const ahead = sorted.slice(0, idx);
    let waitTotal = 0;
    for (const e of ahead) {
      const svc = serviceList.find((s) => s.id === e.serviceId);
      waitTotal += svc?.durationMinutes ?? 0;
    }
    setEstWait(waitTotal);
    setPageState("waiting");
  }

  async function fetchData() {
    const serviceList = await loadServicesAsync();
    setServices(serviceList);

    let currentQueue: QueueEntry[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("queue_entries")
          .select("*")
          .order("position", { ascending: true });
        if (!error && data) {
          currentQueue = data.map(rowToQueueEntry);
          // If our entry isn't in Supabase yet (e.g. insert race), merge localStorage
          if (!currentQueue.find((e) => e.id === id)) {
            const local = loadQueue().filter((e) => e.id === id);
            currentQueue = [...local, ...currentQueue];
          }
        } else {
          currentQueue = loadQueue();
        }
      } catch {
        currentQueue = loadQueue();
      }
    } else {
      currentQueue = loadQueue();
    }

    computeStatus(currentQueue, serviceList);
  }

  useEffect(() => {
    const s = loadShopSettings();
    if (s.shopName) setShopName(s.shopName);

    fetchData();

    // Polling fallback — every 10s
    const pollInterval = setInterval(fetchData, 10_000);

    // Supabase Realtime subscription
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (isSupabaseConfigured()) {
      channel = supabase.channel(`queue-status-${id}`).on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "queue_entries" },
        () => {
          fetchData();
        }
      );
      channel.subscribe();
    }

    return () => {
      clearInterval(pollInterval);
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAccept() {
    if (!entry || !offeredTime || !offeredDate) return;
    setActionLoading(true);

    try {
      const serviceList = services.length > 0 ? services : await loadServicesAsync();
      const svc = serviceList.find((s) => s.id === entry.serviceId);
      const durationMinutes = svc?.durationMinutes ?? 30;

      // Calculate end time
      const [h, m] = offeredTime.split(":").map(Number);
      const startMinutes = h * 60 + m;
      const endTime = minutesToTime(startMinutes + durationMinutes);

      const appointmentId = crypto.randomUUID();
      const aptRow = {
        id: appointmentId,
        barber_id: entry.offeredBarberId ?? entry.barberId ?? null,
        customer_name: entry.clientName,
        customer_phone: entry.clientPhone,
        customer_email: entry.clientEmail,
        customer_id: entry.customerId ?? null,
        service_id: entry.serviceId,
        start_time: offeredTime,
        end_time: endTime,
        date: offeredDate,
        status: "scheduled",
        from_queue: true,
      };

      // Insert appointment (anon insert policy required — see migration 005)
      const { error: insertError } = await supabase
        .from("appointments")
        .insert(aptRow);
      if (insertError) throw insertError;

      // Delete queue entry
      const { error: deleteError } = await supabase
        .from("queue_entries")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;

      setConfirmedTime(offeredTime);
      setPageState("confirmed");
    } catch (err) {
      console.error("Accept failed:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDecline() {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("queue_entries")
        .update({
          status: "waiting",
          offered_time: null,
          offered_date: null,
          offered_barber_id: null,
        })
        .eq("id", id);
      if (error) throw error;

      // Reset local state and refetch
      setOfferedTime("");
      setOfferedDate("");
      await fetchData();
    } catch (err) {
      console.error("Decline failed:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  const service = services.find((s) => s.id === entry?.serviceId);
  const waitDisplay = estWait === 0 ? "< 1 min" : `${estWait} min`;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Checking your place in line...</p>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (pageState === "not_found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-white font-semibold mb-2">Queue entry not found</p>
        <p className="text-gray-500 text-sm mb-6">
          This link may have expired or the entry was removed.
        </p>
        <button
          onClick={() => router.push("/book")}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back to booking
        </button>
      </div>
    );
  }

  // ── Offered ──────────────────────────────────────────────────────────────
  if (pageState === "offered") {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">{shopName}</h1>
          </div>

          {/* Offer card */}
          <div className="bg-white rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-base">
                  Your barber has offered you a slot
                </p>
                <p className="text-gray-500 text-sm">Accept or decline below</p>
              </div>
            </div>

            {/* Time display */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                Offered time
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {offeredTime ? formatTime12(offeredTime) : "—"}
              </p>
              {offeredDate && (
                <p className="text-gray-500 text-sm mt-1">
                  {new Date(offeredDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            {/* Service info */}
            {entry && service && (
              <div className="space-y-2 mb-5">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Service</span>
                  <span className="text-gray-900 text-sm font-medium">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Duration</span>
                  <span className="text-gray-900 text-sm font-medium">{service.durationMinutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Price</span>
                  <span className="text-gray-900 text-sm font-medium">${service.price}</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                disabled={actionLoading}
                className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-3.5 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                ✕ Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="flex-1 bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-950 hover:text-white rounded-xl py-3.5 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? "..." : "✓ Accept"}
              </button>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center justify-center gap-2 py-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-gray-400 text-sm">Live · updates automatically</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirmed ────────────────────────────────────────────────────────────
  if (pageState === "confirmed") {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Appointment confirmed!
            </h2>
            <p className="text-gray-400 mb-2">
              See you at{" "}
              <span className="text-white font-semibold">
                {confirmedTime ? formatTime12(confirmedTime) : "your slot"}
              </span>
              .
            </p>
            {offeredDate && (
              <p className="text-gray-500 text-sm mb-6">
                {new Date(offeredDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}

            {entry && service && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-8 text-left">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Service</span>
                    <span className="text-white text-sm font-medium">{service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Price</span>
                    <span className="text-white text-sm font-medium">${service.price}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push("/book")}
              className="w-full bg-white text-gray-950 rounded-xl py-3 text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Called (removed from queue by barber directly) ───────────────────────
  if (pageState === "called") {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Your barber is ready!
            </h2>
            <p className="text-gray-400 mb-6">
              Head to the chair — you&apos;re up next.
            </p>

            {entry && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-8 text-left">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Service</span>
                    <span className="text-white text-sm font-medium">
                      {service?.name ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Price</span>
                    <span className="text-white text-sm font-medium">
                      {service ? `$${service.price}` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push("/book")}
              className="w-full bg-white text-gray-950 rounded-xl py-3 text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-lg mb-6">
        <button
          onClick={() => router.push("/book")}
          className="text-gray-500 hover:text-white text-sm mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-white">{shopName}</h1>
      </div>

      {/* Main card */}
      <div className="w-full max-w-lg">
        <h2 className="text-lg font-semibold text-white mb-1">
          You&apos;re in line
        </h2>
        <p className="text-4xl font-bold text-white mt-4 mb-6">
          #{position} in line
        </p>

        {/* Stats row */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                Position
              </p>
              <p className="text-3xl font-bold text-white">#{position}</p>
            </div>
            <div className="w-px h-12 bg-gray-800" />
            <div className="text-center">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                Est. wait
              </p>
              <p className="text-3xl font-bold text-white">{waitDisplay}</p>
            </div>
          </div>

          {/* Service info */}
          {entry && (
            <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Service</span>
                <span className="text-white text-sm font-medium">
                  {service?.name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Price</span>
                <span className="text-white text-sm font-medium">
                  {service ? `$${service.price}` : "—"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Live indicator */}
        <div className="flex items-center justify-center gap-2 py-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-400 text-sm">Live · updates automatically</span>
        </div>

        <p className="text-center text-gray-600 text-xs mt-2">
          Keep this page open to track your spot
        </p>
      </div>
    </div>
  );
}
