"use client";

import { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { BARBERS, INITIAL_QUEUE, INITIAL_APPOINTMENTS } from "@/lib/mock-data";
import { QueueEntry, Appointment } from "@/lib/types";
import CalendarPanel from "@/components/dashboard/CalendarPanel";
import QueuePanel from "@/components/dashboard/QueuePanel";

export default function DashboardPage() {
  const [queue, setQueue] = useState<QueueEntry[]>(INITIAL_QUEUE);
  const [appointments, setAppointments] =
    useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const queueEntryId = active.id as string;
    const slotId = over.id as string;

    const entry = queue.find((q) => q.id === queueEntryId);
    const slotIdx = appointments.findIndex((a) => a.id === slotId);

    if (!entry || slotIdx === -1) return;
    if (appointments[slotIdx].name !== "Open Slot") return;

    const newAppointments = [...appointments];
    newAppointments[slotIdx] = {
      ...newAppointments[slotIdx],
      name: entry.name,
      service: entry.service,
      barberId: entry.barberId,
      fromQueue: true,
    };

    const newQueue = queue
      .filter((q) => q.id !== queueEntryId)
      .map((q, i) => ({ ...q, position: i + 1 }));

    setAppointments(newAppointments);
    setQueue(newQueue);
  }

  function handleMarkDone(id: string) {
    setQueue((prev) =>
      prev
        .filter((q) => q.id !== id)
        .map((q, i) => ({ ...q, position: i + 1 }))
    );
  }

  function handleMarkNoShow(id: string) {
    setQueue((prev) =>
      prev
        .filter((q) => q.id !== id)
        .map((q, i) => ({ ...q, position: i + 1 }))
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-[calc(100vh-7rem)] p-4">
        <div className="flex-1 overflow-hidden">
          <CalendarPanel
            appointments={appointments}
            barbers={BARBERS}
            view={view}
            onViewChange={setView}
            onDropIntoSlot={() => {}}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>
        <div className="w-80 overflow-hidden">
          <QueuePanel
            queue={queue}
            barbers={BARBERS}
            onMarkDone={handleMarkDone}
            onMarkNoShow={handleMarkNoShow}
          />
        </div>
      </div>
    </DndContext>
  );
}
