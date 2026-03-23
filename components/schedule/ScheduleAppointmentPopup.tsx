"use client";

import { useState, useEffect } from "react";
import { Appointment, Barber, Service } from "@/lib/types";
import { BARBER_COLOR_MAP } from "@/lib/barber-colors";
import CustomerProfilePopup from "@/components/customers/CustomerProfilePopup";

interface ScheduleAppointmentPopupProps {
  appointment: Appointment;
  barber: Barber;
  service: Service | undefined;
  onStatusChange: (id: string, status: Appointment["status"], paymentMethod?: "cash" | "card") => void;
  onDelete: (id: string) => void;
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
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
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
  onDelete,
  onClose,
}: ScheduleAppointmentPopupProps) {
  const [visible, setVisible] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  function handleStatus(status: Appointment["status"]) {
    if (status === "paid") {
      if (appointment.status === "paid") {
        onStatusChange(appointment.id, "scheduled");
        setShowPaymentChoice(false);
      } else {
        setShowPaymentChoice(true);
      }
      return;
    }
    setShowPaymentChoice(false);
    if (appointment.status === status) {
      onStatusChange(appointment.id, "scheduled");
    } else {
      onStatusChange(appointment.id, status);
    }
  }

  function handlePaymentMethod(method: "cash" | "card") {
    onStatusChange(appointment.id, "paid", method);
    setShowPaymentChoice(false);
  }

  const isCancelled = appointment.status === "cancelled";

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
          <span className={`w-2.5 h-2.5 rounded-full ${BARBER_COLOR_MAP[barber.color].bg}`} />
          <span className="text-sm text-gray-500">{barber.name}</span>
        </div>

        {/* Client name */}
        <h2
          className="text-2xl font-bold text-gray-900 mb-4 cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-2"
          onClick={() => setShowCustomerProfile(true)}
        >
          {appointment.clientName}
          <span className="text-sm font-normal text-blue-500">View profile →</span>
        </h2>

        {/* Service pill */}
        {service && (
          <span className="bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700">
            {service.name} · {service.durationMinutes} min · ${service.price}
          </span>
        )}

        {/* Date + time */}
        <p className="text-sm text-gray-600 mt-3">
          {formatDate(appointment.date)} · {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
        </p>

        {/* Status badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[appointment.status] ?? "bg-gray-100 text-gray-600"}`}>
            {STATUS_LABELS[appointment.status] ?? appointment.status}
          </span>
          {appointment.paymentMethod && appointment.status === "paid" && (
            <span className="text-xs text-gray-400 capitalize">{appointment.paymentMethod}</span>
          )}
        </div>

        {/* Status action buttons (only when not cancelled) */}
        {!isCancelled && (
          <div className="mt-5 space-y-2">
            <button
              onClick={() => handleStatus("checked-in")}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                appointment.status === "checked-in"
                  ? "bg-green-600 text-white ring-2 ring-green-300"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              ✓ Check In
            </button>

            {showPaymentChoice ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-semibold text-emerald-700 mb-2 text-center">Payment method?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePaymentMethod("cash")}
                    className="flex-1 rounded-lg py-2.5 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    💵 Cash
                  </button>
                  <button
                    onClick={() => handlePaymentMethod("card")}
                    className="flex-1 rounded-lg py-2.5 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    💳 Card
                  </button>
                </div>
                <button
                  onClick={() => setShowPaymentChoice(false)}
                  className="w-full mt-2 text-xs text-emerald-600 hover:text-emerald-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStatus("paid")}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  appointment.status === "paid"
                    ? "bg-emerald-700 text-white ring-2 ring-emerald-300"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                $ Paid
              </button>
            )}

            <button
              onClick={() => handleStatus("no-show")}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                appointment.status === "no-show"
                  ? "bg-red-600 text-white ring-2 ring-red-300"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              ✗ No Show
            </button>

            <button
              onClick={() => {
                onStatusChange(appointment.id, "cancelled");
                handleClose();
              }}
              className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl py-2.5 text-sm font-semibold transition-all"
            >
              Cancel Appointment
            </button>
          </div>
        )}

        {/* Delete button */}
        <div className="mt-3">
          {confirmDelete ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-700 mb-2 text-center">Delete this appointment permanently?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onDelete(appointment.id)}
                  className="flex-1 rounded-lg py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-lg py-2 text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
            >
              Delete appointment
            </button>
          )}
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
