"use client";

import { useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { QueueEntry, Barber, Service } from "@/lib/types";

type Props = {
  queue: QueueEntry[];
  barber: Barber;
  services: Service[];
  totalWaiting: number;
};

function QueueCard({
  entry,
  serviceName,
  isNext,
}: {
  entry: QueueEntry;
  serviceName: string;
  isNext: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: entry.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border p-3 mb-2 transition-all duration-150 cursor-grab active:cursor-grabbing ${
        isNext
          ? "border-l-4 border-l-amber-400 border-gray-200 shadow-md"
          : "border-gray-200"
      } ${isDragging ? "opacity-50 shadow-lg z-50 relative" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 text-gray-300 mt-0.5 select-none">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <circle cx="5" cy="2" r="1.5" />
            <circle cx="11" cy="2" r="1.5" />
            <circle cx="5" cy="7" r="1.5" />
            <circle cx="11" cy="7" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="11" cy="12" r="1.5" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">
            {entry.clientName}
          </p>
          <span className="inline-block bg-gray-100 rounded-full px-2 py-0.5 text-xs text-gray-700 mt-1">
            {serviceName}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            ⏱ {entry.waitMinutes} min
          </p>
          <p className="text-xs text-gray-400 mt-1.5">
            Drag to schedule →
          </p>
        </div>
      </div>
    </div>
  );
}

export default function QueuePanel({
  queue,
  services,
  totalWaiting,
}: Props) {
  const serviceMap = useMemo(() => {
    const m: Record<string, string> = {};
    services.forEach((s) => {
      m[s.id] = s.name;
    });
    return m;
  }, [services]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Queue</h2>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${
            totalWaiting > 0
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {totalWaiting > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          )}
          {totalWaiting} waiting
        </span>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto p-3">
        {queue.map((entry) => (
          <QueueCard
            key={entry.id}
            entry={entry}
            serviceName={serviceMap[entry.serviceId] ?? "Unknown"}
            isNext={entry.position === 1}
          />
        ))}

        {queue.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-2 text-gray-300"
            >
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
