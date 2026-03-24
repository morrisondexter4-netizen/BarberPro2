"use client";

import { useMemo, useState } from "react";
import { QueueEntry, Barber, Service } from "@/lib/types";
import { formatWaitTime } from "@/lib/queue-utils";

type Props = {
  queue: QueueEntry[];
  barber: Barber;
  services: Service[];
  totalWaiting: number;
  onCardMouseDown: (e: React.MouseEvent, entryId: string) => void;
  onRetractOffer?: (id: string) => void;
  onRemove?: (id: string) => void;
};

function QueueCard({
  entry,
  serviceName,
  isNext,
  onMouseDown,
  onRetract,
  onRemove,
}: {
  entry: QueueEntry;
  serviceName: string;
  isNext: boolean;
  onMouseDown: (e: React.MouseEvent, entryId: string) => void;
  onRetract?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const isOffered = entry.status === "offered";

  function formatTime12(time: string): string {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  }

  if (isOffered) {
    return (
      <div
        data-queue-card
        className="bg-amber-50 rounded-xl border border-amber-200 border-l-4 border-l-amber-400 p-3 mb-2 cursor-default"
      >
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <span className="block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse mt-1" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{entry.clientName}</p>
            <span className="inline-block bg-amber-100 rounded-full px-2 py-0.5 text-xs text-amber-700 mt-1">
              {serviceName}
            </span>
            {entry.offeredTime && (
              <p className="text-xs text-amber-700 font-medium mt-1">
                Offered: {formatTime12(entry.offeredTime)}
              </p>
            )}
            <p className="text-xs text-amber-600 mt-1 font-medium">Awaiting confirmation...</p>
            <div className="flex gap-3 mt-2">
              {onRetract && (
                <button
                  onClick={() => onRetract(entry.id)}
                  className="text-xs text-amber-700 hover:text-red-600 font-medium transition-colors"
                >
                  Retract offer
                </button>
              )}
              {onRemove && !confirmRemove && (
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            {confirmRemove && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => onRemove && onRemove(entry.id)}
                  className="flex-1 text-xs bg-red-500 text-white rounded-lg py-1.5 font-semibold hover:bg-red-600 transition-colors"
                >
                  Yes, remove
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="flex-1 text-xs bg-gray-100 text-gray-600 rounded-lg py-1.5 font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-queue-card
      className={`bg-white rounded-xl border p-3 mb-2 transition-all duration-150 select-none ${
        isNext
          ? "border-l-4 border-l-amber-400 border-gray-200 shadow-md"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-2">
        {/* drag handle — only triggers drag */}
        <div
          data-queue-id={entry.id}
          onMouseDown={(e) => onMouseDown(e, entry.id)}
          className="flex-shrink-0 text-gray-300 mt-0.5 cursor-grab active:cursor-grabbing"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="2" r="1.5" />
            <circle cx="11" cy="2" r="1.5" />
            <circle cx="5" cy="7" r="1.5" />
            <circle cx="11" cy="7" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="11" cy="12" r="1.5" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{entry.clientName}</p>
          <span className="inline-block bg-gray-100 rounded-full px-2 py-0.5 text-xs text-gray-700 mt-1">
            {serviceName}
          </span>
          <p className={`text-xs mt-1 font-medium ${entry.waitMinutes <= 0 ? "text-green-600" : "text-gray-500"}`}>
            ⏱ {formatWaitTime(entry.waitMinutes)}
          </p>
          <p className="text-xs text-gray-400 mt-1.5">Drag to schedule →</p>

          {onRemove && !confirmRemove && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setConfirmRemove(true)}
              className="mt-2 text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
            >
              Remove from queue
            </button>
          )}
          {confirmRemove && (
            <div className="mt-2 flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
              <button
                onClick={() => onRemove?.(entry.id)}
                className="flex-1 text-xs bg-red-500 text-white rounded-lg py-1.5 font-semibold hover:bg-red-600 transition-colors"
              >
                Yes, remove
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="flex-1 text-xs bg-gray-100 text-gray-600 rounded-lg py-1.5 font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QueuePanel({
  queue,
  services,
  totalWaiting,
  onCardMouseDown,
  onRetractOffer,
  onRemove,
}: Props) {
  const serviceMap = useMemo(() => {
    const m: Record<string, string> = {};
    services.forEach((s) => { m[s.id] = s.name; });
    return m;
  }, [services]);

  const waitingCount = queue.filter((e) => e.status !== "offered").length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Queue</h2>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${
            totalWaiting > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {totalWaiting > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
          {waitingCount} waiting
        </span>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto p-3">
        {queue.map((entry) => (
          <QueueCard
            key={entry.id}
            entry={entry}
            serviceName={serviceMap[entry.serviceId] ?? "Unknown"}
            isNext={entry.position === 1 && entry.status !== "offered"}
            onMouseDown={onCardMouseDown}
            onRetract={onRetractOffer}
            onRemove={onRemove}
          />
        ))}

        {queue.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-gray-300">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-sm">No one waiting</p>
          </div>
        )}
      </div>
    </div>
  );
}
