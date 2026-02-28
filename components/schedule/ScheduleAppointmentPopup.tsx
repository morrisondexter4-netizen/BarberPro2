"use client";

import { useState, useEffect } from "react";
import { Appointment, Barber, Service } from "@/lib/types";
import { BARBER_COLOR_MAP } from "@/lib/barber-colors";

interface ScheduleAppointmentPopupProps {
  appointment: Appointment;
  barber: Barber;
  service: Service | undefined;
  onStatusChange: (id: string, status: Appointment["status"]) => void;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-gray-100 text-gray-600",
  "checked-in": "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
  "no-show": "bg-red-100 text-red-600",
  cancelled: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  "checked-in": "Checked In",
  paid: "Paid",
  "no-show": "No Show",
  cancelled: "Cancelled",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export default function ScheduleAppointmentPopup({
  appointment,
  barber,
  service,
  onStatusChange,
  onClose,
}: ScheduleAppointmentPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const formattedDate = formatDate(appointment.date);
  const timeRange = `${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}`;

  return (
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 relative transition-all duration-200 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>

        {/* Barber */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`w-2.5 h-2.5 rounded-full ${BARBER_COLOR_MAP[barber.color].bg}`}
          />
          <span className="text-sm text-gray-500">{barber.name}</span>
        </div>

        {/* Client name */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {appointment.clientName}
        </h2>

        {/* Service pill */}
        {service && (
          <span className="bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700">
            {service.name} · {service.durationMinutes} min
          </span>
        )}

        {/* Date + time */}
        <p className="text-sm text-gray-600 mt-3">
          {formattedDate} · {timeRange}
        </p>

        {/* Status badge */}
        <div className="mt-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              STATUS_STYLES[appointment.status] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {STATUS_LABELS[appointment.status] ?? appointment.status}
          </span>
        </div>

        {/* Cancel button */}
        {appointment.status !== "cancelled" && (
          <button
            onClick={() => {
              onStatusChange(appointment.id, "cancelled");
              handleClose();
            }}
            className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl py-3 text-sm font-semibold transition-all mt-4"
          >
            Cancel Appointment
          </button>
        )}
      </div>
    </div>
  );
}
