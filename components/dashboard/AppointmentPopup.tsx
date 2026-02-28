"use client";

import { useEffect, useState } from "react";
import { Appointment, Barber, Service } from "@/lib/types";
import { BARBER_COLOR_MAP } from "@/lib/barber-colors";
import CustomerProfilePopup from "@/components/customers/CustomerProfilePopup";

type Props = {
  appointment: Appointment;
  barber: Barber;
  service: Service | undefined;
  onStatusChange: (id: string, status: Appointment["status"]) => void;
  onClose: () => void;
};

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-gray-100 text-gray-700",
  "checked-in": "bg-green-100 text-green-700",
  paid: "bg-green-100 text-green-700",
  "no-show": "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  "checked-in": "Checked In",
  paid: "$ Paid",
  "no-show": "No Show",
};

export default function AppointmentPopup({
  appointment,
  barber,
  service,
  onStatusChange,
  onClose,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const colors = BARBER_COLOR_MAP[barber.color] ?? BARBER_COLOR_MAP.blue;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleStatus(status: Appointment["status"]) {
    if (appointment.status === status) {
      onStatusChange(appointment.id, "scheduled");
    } else {
      onStatusChange(appointment.id, status);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transition-all duration-200 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 4L12 12M12 4L4 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pr-8">
          <h3
            className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-2"
            onClick={() => setShowCustomerProfile(true)}
          >
            {appointment.clientName}
            <span className="text-sm font-normal text-blue-500">View profile →</span>
          </h3>
          <span className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
          <span className="text-sm text-gray-500">{barber.name}</span>
        </div>

        {/* Info */}
        <p className="text-sm text-gray-600">
          {service?.name ?? "Unknown"}
          {service?.durationMinutes ? ` · ${service.durationMinutes} min` : ""}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {formatTime12(appointment.startTime)} –{" "}
          {formatTime12(appointment.endTime)}
        </p>

        {/* Status badge */}
        <div className="mt-3">
          <span
            className={`inline-block text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_STYLES[appointment.status]}`}
          >
            {STATUS_LABELS[appointment.status]}
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-5 space-y-2">
          <button
            onClick={() => handleStatus("checked-in")}
            className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${
              appointment.status === "checked-in"
                ? "bg-green-600 text-white ring-2 ring-green-300"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            ✓ Check In
          </button>
          <button
            onClick={() => handleStatus("paid")}
            className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${
              appointment.status === "paid"
                ? "bg-emerald-700 text-white ring-2 ring-emerald-300"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            $ Paid
          </button>
          <button
            onClick={() => handleStatus("no-show")}
            className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${
              appointment.status === "no-show"
                ? "bg-red-600 text-white ring-2 ring-red-300"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            ✗ No Show
          </button>
        </div>
      </div>

      {showCustomerProfile && (
        <CustomerProfilePopup
          clientName={appointment.clientName}
          onClose={() => setShowCustomerProfile(false)}
        />
      )}
    </div>
  );
}
