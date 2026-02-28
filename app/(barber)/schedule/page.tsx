"use client";

import { useState } from "react";
import { BARBERS, SERVICES, INITIAL_APPOINTMENTS } from "@/lib/mock-data";
import { Appointment } from "@/lib/types";
import { BARBER_COLOR_MAP } from "@/lib/barber-colors";
import ScheduleGrid from "@/components/schedule/ScheduleGrid";
import ScheduleAppointmentPopup from "@/components/schedule/ScheduleAppointmentPopup";

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  });
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const allAppointments = INITIAL_APPOINTMENTS;

  const getWeekDates = (offset: number): string[] => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(
      now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7
    );
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  };

  const weekDates = getWeekDates(weekOffset);
  const selectedDate = weekDates[selectedDayIndex];
  const dayAppointments = allAppointments.filter(
    (a) => a.date === selectedDate
  );

  const formatWeekRange = (): string => {
    const first = new Date(weekDates[0] + "T12:00:00");
    const last = new Date(weekDates[6] + "T12:00:00");
    const fMonth = first.toLocaleDateString("en-US", { month: "short" });
    const lMonth = last.toLocaleDateString("en-US", { month: "short" });
    const fDay = first.getDate();
    const lDay = last.getDate();
    const year = last.getFullYear();
    if (fMonth === lMonth) {
      return `${fMonth} ${fDay} – ${lDay}, ${year}`;
    }
    return `${fMonth} ${fDay} – ${lMonth} ${lDay}, ${year}`;
  };

  const weekRangeLabel = formatWeekRange();

  const todayIndex = (() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  })();

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Week navigation header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            ←
          </button>
          <span className="font-semibold text-gray-900 text-sm">
            {weekRangeLabel}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            →
          </button>
        </div>
        {weekOffset !== 0 && (
          <button
            onClick={() => {
              setWeekOffset(0);
              setSelectedDayIndex(todayIndex);
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Today
          </button>
        )}
      </div>

      {/* Day tab bar */}
      <div className="flex gap-1 px-4 py-2 bg-white border-b border-gray-100 shrink-0">
        {weekDates.map((date, i) => {
          const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          const dayNum = new Date(date + "T12:00:00").getDate();
          const isToday =
            date === new Date().toISOString().split("T")[0];
          const isSelected = i === selectedDayIndex;
          return (
            <button
              key={date}
              onClick={() => setSelectedDayIndex(i)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl text-xs font-medium transition-colors relative ${
                isSelected
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{dayNames[i]}</span>
              <span
                className={`text-sm font-bold ${isSelected ? "text-white" : "text-gray-900"}`}
              >
                {dayNum}
              </span>
              {isToday && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Barber columns */}
      <ScheduleGrid
        date={selectedDate}
        barbers={BARBERS}
        appointments={dayAppointments}
        services={SERVICES}
        onAppointmentClick={setSelectedAppointment}
      />

      {selectedAppointment && (
        <ScheduleAppointmentPopup
          appointment={selectedAppointment}
          barber={
            BARBERS.find((b) => b.id === selectedAppointment.barberId)!
          }
          service={SERVICES.find(
            (s) => s.id === selectedAppointment.serviceId
          )}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}
