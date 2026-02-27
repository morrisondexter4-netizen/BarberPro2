"use client";

import { Appointment, Barber } from "@/lib/types";
import DayView from "./DayView";
import WeekView from "./WeekView";

type Props = {
  appointments: Appointment[];
  barbers: Barber[];
  view: "day" | "week";
  onViewChange: (v: "day" | "week") => void;
  onDropIntoSlot: (queueEntryId: string, slotId: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const prefix = isToday ? "Today, " : `${WEEKDAYS[date.getDay()]}, `;
  return `${prefix}${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export default function CalendarPanel({
  appointments,
  barbers,
  view,
  onViewChange,
  onDropIntoSlot,
  selectedDate,
  onDateChange,
}: Props) {
  const filteredAppointments =
    view === "day"
      ? appointments.filter((a) => a.date === selectedDate)
      : appointments;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDateChange(addDays(selectedDate, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-all duration-150"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 12L6 8l4-4" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[10rem]">
            {formatDisplayDate(selectedDate)}
          </h2>
          <button
            onClick={() => onDateChange(addDays(selectedDate, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-all duration-150"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => onViewChange("day")}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
              view === "day"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Day
          </button>
          <button
            onClick={() => onViewChange("week")}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
              view === "week"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Week
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === "day" ? (
          <DayView
            appointments={filteredAppointments}
            barbers={barbers}
            onDropIntoSlot={onDropIntoSlot}
          />
        ) : (
          <WeekView
            appointments={appointments}
            barbers={barbers}
            selectedDate={selectedDate}
            onDropIntoSlot={onDropIntoSlot}
          />
        )}
      </div>
    </div>
  );
}
