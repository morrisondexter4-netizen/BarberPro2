"use client";

import { QueueEntry, Barber } from "@/lib/types";
import QueueCard from "./QueueCard";

type Props = {
  queue: QueueEntry[];
  barbers: Barber[];
  onMarkDone: (id: string) => void;
  onMarkNoShow: (id: string) => void;
};

export default function QueuePanel({
  queue,
  barbers,
  onMarkDone,
  onMarkNoShow,
}: Props) {
  const sorted = [...queue].sort((a, b) => a.position - b.position);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-gray-900">Live Queue</h2>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {queue.length} waiting
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sorted.map((entry) => (
          <QueueCard
            key={entry.id}
            entry={entry}
            barber={barbers.find((b) => b.id === entry.barberId)}
            isDraggable={entry.position === 1}
            onMarkDone={() => onMarkDone(entry.id)}
            onMarkNoShow={() => onMarkNoShow(entry.id)}
          />
        ))}

        {queue.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p className="text-sm">Queue is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
