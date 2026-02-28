"use client";

import { Barber, Appointment, Service } from "@/lib/types";
import { BARBER_COLOR_MAP } from "@/lib/barber-colors";

interface ScheduleGridProps {
  date: string;
  barbers: Barber[];
  appointments: Appointment[];
  services: Service[];
  onAppointmentClick: (apt: Appointment) => void;
}

export default function ScheduleGrid({
  barbers,
  appointments,
  services,
  onAppointmentClick,
}: ScheduleGridProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Sticky barber header */}
      <div className="flex shrink-0 border-b border-gray-100 bg-white">
        <div className="w-14 shrink-0" />
        {barbers.map((barber) => (
          <div
            key={barber.id}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-l border-gray-100"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${BARBER_COLOR_MAP[barber.color].bg}`}
            />
            <span className="text-sm font-semibold text-gray-900">
              {barber.name}
            </span>
          </div>
        ))}
      </div>

      {/* Scrollable body */}
      <div className="flex flex-1 overflow-y-auto">
        {/* Time gutter */}
        <div className="w-14 shrink-0 relative bg-white" style={{ height: 704 }}>
          {Array.from({ length: 11 }, (_, i) => {
            const hour = i + 8;
            const label = hour <= 12 ? `${hour} AM` : `${hour - 12} PM`;
            return (
              <div
                key={hour}
                className="absolute right-2 text-xs text-gray-400"
                style={{ top: i * 64 - 8 }}
              >
                {label === "12 AM" ? "12 PM" : label}
              </div>
            );
          })}
        </div>

        {/* Barber columns */}
        {barbers.map((barber, idx) => {
          const barberApts = appointments.filter(
            (a) => a.barberId === barber.id
          );
          const colors = BARBER_COLOR_MAP[barber.color];
          return (
            <div
              key={barber.id}
              className={`flex-1 relative border-l border-gray-100 ${
                idx === barbers.length - 1 ? "" : "border-r border-gray-100"
              }`}
              style={{ height: 704 }}
            >
              {/* Hour lines */}
              {Array.from({ length: 11 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: i * 64 }}
                />
              ))}
              {/* 15-min lines */}
              {Array.from({ length: 11 }, (_, i) =>
                [16, 32, 48].map((offset) => (
                  <div
                    key={`${i}-${offset}`}
                    className="absolute w-full border-t border-dashed border-gray-50"
                    style={{ top: i * 64 + offset }}
                  />
                ))
              )}
              {/* Lunch break */}
              {barber.lunchBreak &&
                (() => {
                  const [sh, sm] = barber.lunchBreak.startTime
                    .split(":")
                    .map(Number);
                  const [eh, em] = barber.lunchBreak.endTime
                    .split(":")
                    .map(Number);
                  const top = (sh - 8) * 64 + (sm / 60) * 64;
                  const height =
                    ((eh * 60 + em - (sh * 60 + sm)) / 60) * 64;
                  return (
                    <div
                      className="absolute left-0 right-0 bg-gray-100 border-l-4 border-gray-300 flex items-center px-2"
                      style={{ top, height }}
                    >
                      <span className="text-xs text-gray-400">Lunch</span>
                    </div>
                  );
                })()}
              {/* Appointments */}
              {barberApts.map((apt) => {
                const service = services.find((s) => s.id === apt.serviceId);
                const [sh, sm] = apt.startTime.split(":").map(Number);
                const [eh, em] = apt.endTime.split(":").map(Number);
                const top = (sh - 8) * 64 + (sm / 60) * 64;
                const height = Math.max(
                  28,
                  ((eh * 60 + em - (sh * 60 + sm)) / 60) * 64
                );
                return (
                  <div
                    key={apt.id}
                    className="absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer overflow-hidden transition-all hover:brightness-95"
                    style={{
                      top,
                      height,
                      backgroundColor: colors.hex + "20",
                      borderLeft: `3px solid ${colors.hex}`,
                    }}
                    onClick={() => onAppointmentClick(apt)}
                  >
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {apt.clientName}
                    </p>
                    {height >= 40 && (
                      <p className="text-xs text-gray-500 truncate">
                        {service?.name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
