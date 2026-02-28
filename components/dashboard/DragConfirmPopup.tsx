"use client";

import { useEffect, useState } from "react";
import { Appointment, Barber, Service } from "@/lib/types";
import { BARBER_COLOR_MAP } from "@/lib/barber-colors";

type Props = {
  appointment: Appointment;
  barber: Barber;
  service: Service | undefined;
  onConfirm: () => void;
  onUndo: () => void;
};

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function DragConfirmPopup({
  appointment,
  barber,
  service,
  onConfirm,
  onUndo,
}: Props) {
  const [visible, setVisible] = useState(false);
  const colors = BARBER_COLOR_MAP[barber.color] ?? BARBER_COLOR_MAP.blue;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div
        className={`bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 transition-all duration-200 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h3 className="font-bold text-xl text-gray-900">
          Confirm Appointment
        </h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Add this person to the schedule?
        </p>

        {/* Info card */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
            <span className="text-sm text-gray-500">{barber.name}</span>
          </div>

          <p className="text-lg font-bold text-gray-900 mt-1">
            {appointment.clientName}
          </p>

          {service && (
            <span className="inline-block bg-white border border-gray-200 rounded-full px-3 py-1 text-sm font-medium text-gray-700 mt-2">
              {service.name} · {service.durationMinutes} min
            </span>
          )}

          <p className="text-sm text-gray-500 mt-1">
            {formatTime12(appointment.startTime)} –{" "}
            {formatTime12(appointment.endTime)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onUndo}
            className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-3 text-sm font-semibold transition-all"
          >
            ✕ Undo
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-black text-white hover:bg-gray-800 rounded-xl py-3 text-sm font-semibold transition-all"
          >
            ✓ Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
