"use client";

import { useDroppable } from "@dnd-kit/core";
import { Appointment, Barber } from "@/lib/types";

const COLOR_VARIANTS: Record<string, { cardBg: string; borderL: string }> = {
  "bg-blue-500": { cardBg: "bg-blue-500/20", borderL: "border-l-blue-500" },
  "bg-emerald-500": {
    cardBg: "bg-emerald-500/20",
    borderL: "border-l-emerald-500",
  },
  "bg-violet-500": {
    cardBg: "bg-violet-500/20",
    borderL: "border-l-violet-500",
  },
};

type Props = {
  appointment: Appointment;
  barber: Barber | undefined;
  isDropTarget: boolean;
  onDrop: (queueEntryId: string) => void;
};

export default function AppointmentSlot({
  appointment,
  barber,
}: Props) {
  const isOpen = appointment.name === "Open Slot";

  const { setNodeRef, isOver } = useDroppable({
    id: appointment.id,
    disabled: !isOpen,
  });

  if (isOpen) {
    return (
      <div
        ref={setNodeRef}
        className={`h-full w-full rounded-lg border-2 border-dashed transition-all duration-150 flex items-center justify-center ${
          isOver
            ? "bg-blue-50 ring-2 ring-blue-400 border-blue-300"
            : "bg-gray-50 border-gray-300 hover:border-gray-400"
        }`}
      >
        <span className="text-sm text-gray-400 select-none">
          Open — drag to fill
        </span>
      </div>
    );
  }

  const colors = barber ? COLOR_VARIANTS[barber.color] : null;

  return (
    <div
      className={`h-full w-full rounded-lg border-l-4 px-2.5 py-1.5 overflow-hidden transition-all duration-150 ${
        colors?.cardBg ?? "bg-gray-100"
      } ${colors?.borderL ?? "border-l-gray-400"}`}
    >
      <p className="font-medium text-gray-900 text-sm truncate">
        {appointment.name}
      </p>
      <p className="text-xs text-gray-600 truncate">{appointment.service}</p>
      {barber && <p className="text-xs text-gray-500">{barber.name}</p>}
      {appointment.fromQueue && (
        <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 inline-block mt-0.5">
          From Queue
        </span>
      )}
    </div>
  );
}
