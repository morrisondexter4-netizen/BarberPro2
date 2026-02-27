"use client";

import { useDraggable } from "@dnd-kit/core";
import { QueueEntry, Barber } from "@/lib/types";

type Props = {
  entry: QueueEntry;
  barber: Barber | undefined;
  isDraggable: boolean;
  onMarkDone: () => void;
  onMarkNoShow: () => void;
};

export default function QueueCard({
  entry,
  barber,
  isDraggable,
  onMarkDone,
  onMarkNoShow,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: entry.id,
      disabled: !isDraggable,
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border shadow-sm p-4 transition-all duration-150 ${
        isDraggable
          ? "cursor-grab border-l-4 border-l-amber-400 border-gray-200 shadow-md active:cursor-grabbing"
          : "border-gray-200"
      } ${isDragging ? "opacity-50 shadow-lg z-50 relative" : ""}`}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
    >
      <div className="flex items-start gap-3">
        {isDraggable && (
          <div className="flex-shrink-0 text-gray-300 mt-0.5 select-none">
            <svg
              width="16"
              height="16"
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
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">
              {entry.name}
            </span>
            {barber && (
              <>
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 ${barber.color}`}
                />
                <span className="text-sm text-gray-500 truncate">
                  {barber.name}
                </span>
              </>
            )}
          </div>

          <div className="mt-1.5">
            <span className="inline-block bg-gray-100 text-xs font-medium text-gray-700 rounded-full px-2.5 py-0.5">
              {entry.service}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2.5">
            <span className="text-xs text-gray-500">
              ⏱ {entry.waitMinutes} min
            </span>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkDone();
                }}
                className="text-xs text-green-600 hover:bg-green-50 rounded px-2 py-1 transition-all duration-150"
              >
                Done ✓
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkNoShow();
                }}
                className="text-xs text-red-600 hover:bg-red-50 rounded px-2 py-1 transition-all duration-150"
              >
                No Show ✗
              </button>
            </div>
          </div>

          {isDraggable && (
            <p className="text-xs text-gray-400 mt-1.5">
              Drag to schedule →
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
