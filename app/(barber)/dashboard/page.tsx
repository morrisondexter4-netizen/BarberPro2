"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Barber, Appointment, Service } from "@/lib/types";
import type { Customer as CrmCustomer } from "@/lib/crm/types";
import { MOCK_CUSTOMERS } from "@/lib/crm/mock";
import { useBarberPro } from "@/lib/barberpro-context";
import { localDateString } from "@/lib/settings";
import { calculateQueueWaitTimes, buildWaitTimeUpdateSms } from "@/lib/queue-utils";
import BarberSwitcher from "@/components/dashboard/BarberSwitcher";
import CalendarPanel from "@/components/dashboard/CalendarPanel";
import QueuePanel from "@/components/dashboard/QueuePanel";
import AppointmentPopup from "@/components/dashboard/AppointmentPopup";
import DragConfirmPopup from "@/components/dashboard/DragConfirmPopup";

const CUSTOMERS_STORAGE_KEY = "barberpro.customers.v1";

type StoredCustomer = CrmCustomer & { noShowCount: number };

function normalizeName(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function loadStoredCustomers(): StoredCustomer[] {
  if (typeof window === "undefined") {
    return MOCK_CUSTOMERS.map((c) => ({ ...c, noShowCount: 0 }));
  }

  try {
    const raw = window.localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (!raw) {
      const seeded = MOCK_CUSTOMERS.map((c) => ({ ...c, noShowCount: 0 }));
      window.localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((c: any) => ({
      ...c,
      noShowCount: typeof c.noShowCount === "number" ? c.noShowCount : 0,
    }));
  } catch {
    return [];
  }
}

function findCustomerIndexForAppointment(
  customers: StoredCustomer[],
  appointment: Appointment,
): number {
  const phone = appointment.clientPhone?.trim();
  if (phone) {
    const byPhone = customers.findIndex(
      (c) => c.phone.trim() === phone,
    );
    if (byPhone !== -1) return byPhone;
  }

  if (appointment.customerId) {
    const byId = customers.findIndex((c) => c.id === appointment.customerId);
    if (byId !== -1) return byId;
  }

  const name = appointment.clientName?.trim();
  if (name) {
    const target = normalizeName(name);
    const byName = customers.findIndex(
      (c) => normalizeName(`${c.firstName} ${c.lastName}`) === target,
    );
    if (byName !== -1) return byName;
  }

  const email = appointment.clientEmail?.trim();
  if (email) {
    const targetEmail = email.toLowerCase();
    const byEmail = customers.findIndex(
      (c) => c.email.trim().toLowerCase() === targetEmail,
    );
    if (byEmail !== -1) return byEmail;
  }

  return -1;
}

function incrementNoShowForCustomer(appointment: Appointment): void {
  if (typeof window === "undefined") return;

  try {
    const customers = loadStoredCustomers();

    const index = findCustomerIndexForAppointment(customers, appointment);
    const clientName = appointment.clientName?.trim() || "Unknown";
    const phone = appointment.clientPhone?.trim() ?? "";
    const email = appointment.clientEmail?.trim() ?? "";

    let next: StoredCustomer[];

    if (index === -1) {
      const parts = clientName.split(/\s+/);
      const firstName = parts[0] ?? "Unknown";
      const lastName = parts.slice(1).join(" ");
      const now = new Date().toISOString();

      const newCustomer: StoredCustomer = {
        id: appointment.customerId || `cust-${Date.now()}`,
        firstName,
        lastName,
        phone,
        email,
        createdAt: now,
        notes: "",
        visitCount: 0,
        noShowCount: 1,
      };

      next = [...customers, newCustomer];
    } else {
      const customer = customers[index];
      const updated: StoredCustomer = {
        ...customer,
        noShowCount: customer.noShowCount + 1,
      };
      next = [...customers];
      next[index] = updated;
    }

    window.localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("barberpro:customers-updated"));
  } catch {
    // ignore storage errors
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getEffectiveBounds(
  barberStartMin: number,
  barberEndMin: number,
  shopOpenMin: number | null,
  shopCloseMin: number | null,
): { effectiveStart: number; effectiveEnd: number } {
  return {
    effectiveStart: shopOpenMin !== null ? Math.max(barberStartMin, shopOpenMin) : barberStartMin,
    effectiveEnd: shopCloseMin !== null ? Math.min(barberEndMin, shopCloseMin) : barberEndMin,
  };
}

export default function DashboardPage() {
  const today = localDateString();

  const {
    appointments,
    queue,
    setQueue,
    barbers,
    services,
    shopHours,
    updateAppointmentStatus,
    moveAppointment,
    addAppointment,
    removeFromQueue,
    offerQueueSlot,
    retractOffer,
    deleteAppointment,
  } = useBarberPro();

  const { todayShopHours, shopOpenMin, shopCloseMin } = useMemo(() => {
    const todayShopHours = shopHours[DAY_KEYS[new Date().getDay()]] ?? null;
    const shopOpenMin = todayShopHours?.open && todayShopHours.openTime
      ? timeToMinutes(todayShopHours.openTime) : null;
    const shopCloseMin = todayShopHours?.open && todayShopHours.closeTime
      ? timeToMinutes(todayShopHours.closeTime) : null;
    return { todayShopHours, shopOpenMin, shopCloseMin };
  }, [shopHours]);


  const [smsNotice, setSmsNotice] = useState<string | null>(null);



  // Recalculate wait times whenever queue, appointments, barbers, or services change
  const todayAppointments = appointments.filter(
    a => a.date === today && a.status !== "cancelled"
  );
  useEffect(() => {
    if (queue.length === 0) return;
    const updated = calculateQueueWaitTimes(queue, todayAppointments, barbers, services);
    const changed = updated.some((e, i) => e.waitMinutes !== queue[i]?.waitMinutes);
    if (changed) setQueue(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, barbers, services]);

  const [selectedBarberId, setSelectedBarberId] = useState<string>("");

  // Set to first available barber once loaded (replaces hardcoded "b1" mock ID)
  useEffect(() => {
    if (barbers.length > 0 && !barbers.find(b => b.id === selectedBarberId)) {
      setSelectedBarberId(barbers[0].id);
    }
  }, [barbers]);

  const [activeAppointmentId, setActiveAppointmentId] =
    useState<string | null>(null);
  const [pendingAppointment, setPendingAppointment] = useState<{
    appointment: Appointment;
    queueEntryId: string;
    replaceAptId?: string;
  } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );
  const [dropReject, setDropReject] = useState<{
    time: string;
    durationMinutes: number;
  } | null>(null);
  const dragTimeRef = useRef<string | null>(null);

  // Custom queue drag (pure mouse — no native HTML5 drag API)
  const [customQueueDragId, setCustomQueueDragId] = useState<string | null>(null);
  const [hoveredNoShowId, setHoveredNoShowId] = useState<string | null>(null);
  const customDragCloneRef = useRef<HTMLDivElement | null>(null);
  const customDragOffsetRef = useRef({ x: 0, y: 0 });
  // Refs for fresh values inside mouse event handlers
  const queueRef = useRef(queue);
  const appointmentsRef = useRef(appointments);
  const barbersRef = useRef(barbers);
  const servicesRef = useRef(services);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { appointmentsRef.current = appointments; }, [appointments]);
  useEffect(() => { barbersRef.current = barbers; }, [barbers]);
  useEffect(() => { servicesRef.current = services; }, [services]);

  const handleDragTimeChange = useCallback((time: string | null) => {
    dragTimeRef.current = time;
  }, []);

  useEffect(() => {
    if (!customQueueDragId) return;
    const entryId = customQueueDragId;

    function handleMouseMove(e: MouseEvent) {
      const clone = customDragCloneRef.current;
      if (clone) {
        clone.style.left = `${e.clientX - customDragOffsetRef.current.x}px`;
        clone.style.top = `${e.clientY - customDragOffsetRef.current.y}px`;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const noShowSlot = el?.closest("[data-no-show-apt-id]");
      setHoveredNoShowId(noShowSlot?.getAttribute("data-no-show-apt-id") ?? null);
    }

    function handleMouseUp(e: MouseEvent) {
      if (customDragCloneRef.current) {
        document.body.removeChild(customDragCloneRef.current);
        customDragCloneRef.current = null;
      }
      setCustomQueueDragId(null);
      setActiveDragId(null);
      setHoveredNoShowId(null);

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const noShowSlotEl = el?.closest("[data-no-show-apt-id]");
      const timelineEl = el?.closest("[data-timeline-barber-id]");

      if (noShowSlotEl) {
        const noShowAptId = noShowSlotEl.getAttribute("data-no-show-apt-id");
        if (!noShowAptId) return;
        const apt = appointmentsRef.current.find((a) => a.id === noShowAptId);
        const entry = queueRef.current.find((q) => q.id === entryId);
        if (!apt || !entry) return;
        const svc = servicesRef.current.find((s) => s.id === entry.serviceId);
        const endTime = svc
          ? minutesToTime(timeToMinutes(apt.startTime) + svc.durationMinutes)
          : apt.endTime;
        const newApt: Appointment = {
          id: `apt-${Date.now()}`,
          clientName: entry.clientName,
          clientPhone: entry.clientPhone ?? "",
          clientEmail: entry.clientEmail ?? "",
          serviceId: entry.serviceId,
          barberId: apt.barberId,
          startTime: apt.startTime,
          endTime,
          date: apt.date,
          status: "scheduled",
          fromQueue: true,
        };
        setPendingAppointment({ appointment: newApt, queueEntryId: entryId, replaceAptId: noShowAptId });
      } else if (timelineEl) {
        const barberId = timelineEl.getAttribute("data-timeline-barber-id");
        if (!barberId) return;
        const dropTime = dragTimeRef.current;
        if (!dropTime) return;
        const entry = queueRef.current.find((q) => q.id === entryId);
        if (!entry) return;
        const svc = servicesRef.current.find((s) => s.id === entry.serviceId);
        if (!svc) return;
        const newStartMin = timeToMinutes(dropTime);
        const newEndMin = newStartMin + svc.durationMinutes;
        const targetBarber = barbersRef.current.find((b) => b.id === barberId);
        const barberStartMin = timeToMinutes(targetBarber?.startTime ?? "09:00");
        const barberEndMin = timeToMinutes(targetBarber?.endTime ?? "18:00");
        const { effectiveStart: effectiveStartMin, effectiveEnd: effectiveEndMin } = getEffectiveBounds(barberStartMin, barberEndMin, shopOpenMin, shopCloseMin);
        if (newStartMin < effectiveStartMin || newEndMin > effectiveEndMin) {
          setDropReject({ time: dropTime, durationMinutes: svc.durationMinutes });
          setTimeout(() => setDropReject(null), 600);
          return;
        }
        const today = localDateString();
        const barberApts = appointmentsRef.current.filter(
          (a) =>
            a.barberId === barberId &&
            a.date === today &&
            a.clientName !== "Open Slot" &&
            a.status !== "cancelled",
        );
        let hasOverlap = barberApts.some((a) => {
          const aStart = timeToMinutes(a.startTime);
          const aEnd = timeToMinutes(a.endTime);
          return newStartMin < aEnd && newEndMin > aStart;
        });
        if (!hasOverlap && targetBarber?.lunchBreak) {
          const lStart = timeToMinutes(targetBarber.lunchBreak.start);
          const lEnd = timeToMinutes(targetBarber.lunchBreak.end);
          if (newStartMin < lEnd && newEndMin > lStart) hasOverlap = true;
        }
        if (hasOverlap) {
          setDropReject({ time: dropTime, durationMinutes: svc.durationMinutes });
          setTimeout(() => setDropReject(null), 600);
          return;
        }
        const newApt: Appointment = {
          id: `apt-${Date.now()}`,
          clientName: entry.clientName,
          clientPhone: entry.clientPhone ?? "",
          clientEmail: entry.clientEmail ?? "",
          serviceId: entry.serviceId,
          barberId,
          startTime: dropTime,
          endTime: minutesToTime(newEndMin),
          date: today,
          status: "scheduled",
          fromQueue: true,
        };
        setPendingAppointment({ appointment: newApt, queueEntryId: entryId });
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [customQueueDragId]);

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId) ?? barbers[0];
  if (!selectedBarber) return null; // barbers still loading

  // Include 'waiting' and 'offered' entries — offered entries show "Awaiting confirmation"
  const barberQueue = queue
    .filter((e) => !e.barberId || e.barberId === selectedBarberId || e.offeredBarberId === selectedBarberId)
    .sort((a, b) => a.position - b.position);

  const barberAppointments = (() => {
    const base = appointments.filter(
      (a) =>
        a.barberId === selectedBarberId &&
        a.date === today &&
        a.status !== "cancelled",
    );
    if (
      pendingAppointment &&
      pendingAppointment.appointment.barberId === selectedBarberId
    ) {
      return [...base, pendingAppointment.appointment];
    }
    return base;
  })();

  const activeAppointment = activeAppointmentId
    ? barberAppointments.find((a) => a.id === activeAppointmentId) ?? null
    : null;

  const isRescheduleDragging =
    activeDragId !== null && activeDragId.startsWith("reschedule-");
  const isQueueDragging =
    activeDragId !== null && !isRescheduleDragging;
  const isTimelineDragging = isQueueDragging || isRescheduleDragging;
  const draggedEntry = isQueueDragging
    ? queue.find((q) => q.id === activeDragId)
    : null;
  const draggedServiceId = (() => {
    if (isQueueDragging && draggedEntry) return draggedEntry.serviceId;
    if (isRescheduleDragging && activeDragId) {
      const aptId = activeDragId.replace("reschedule-", "");
      const apt = appointments.find((a) => a.id === aptId);
      return apt?.serviceId ?? null;
    }
    return null;
  })();

  function handleQueueMouseDown(e: React.MouseEvent, entryId: string) {
    e.preventDefault();
    const entry = queueRef.current.find((q) => q.id === entryId);
    if (!entry) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    customDragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const service = servicesRef.current.find((s) => s.id === entry.serviceId);
    const clone = document.createElement("div");
    clone.style.cssText = [
      "position:fixed",
      `left:${e.clientX - customDragOffsetRef.current.x}px`,
      `top:${e.clientY - customDragOffsetRef.current.y}px`,
      `width:${rect.width}px`,
      "pointer-events:none",
      "z-index:9999",
      "background:white",
      "border:1px solid #e5e7eb",
      "border-radius:12px",
      "padding:12px",
      "box-shadow:0 20px 40px rgba(0,0,0,0.15)",
      "opacity:0.95",
    ].join(";");
    const nameEl = document.createElement("p");
    nameEl.style.cssText = "font-weight:600;font-size:14px;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0 0 4px";
    nameEl.textContent = entry.clientName;

    const serviceEl = document.createElement("span");
    serviceEl.style.cssText = "display:inline-block;background:#f3f4f6;border-radius:9999px;padding:2px 8px;font-size:12px;color:#374151";
    serviceEl.textContent = service?.name ?? "";

    const hintEl = document.createElement("p");
    hintEl.style.cssText = "font-size:12px;color:#9ca3af;margin:6px 0 0";
    hintEl.textContent = "Drag to schedule →";

    clone.append(nameEl, serviceEl, hintEl);
    document.body.appendChild(clone);
    customDragCloneRef.current = clone;

    setCustomQueueDragId(entryId);
    setActiveDragId(entryId);
    setDropReject(null);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
    setDropReject(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = active.id as string;
    setActiveDragId(null);

    if (!over) return;
    const overId = over.id as string;

    // Queue client dropped onto a no-show appointment slot
    if (overId.startsWith("no-show-slot-") && !activeId.startsWith("reschedule-")) {
      const noShowAptId = overId.replace("no-show-slot-", "");
      const noShowApt = appointments.find((a) => a.id === noShowAptId);
      const entry = queue.find((q) => q.id === activeId);
      if (!noShowApt || !entry) return;

      const service = services.find((s) => s.id === entry.serviceId);
      const endTime = service
        ? minutesToTime(timeToMinutes(noShowApt.startTime) + service.durationMinutes)
        : noShowApt.endTime;

      const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        clientName: entry.clientName,
        clientPhone: entry.clientPhone ?? "",
        clientEmail: entry.clientEmail ?? "",
        serviceId: entry.serviceId,
        barberId: noShowApt.barberId,
        startTime: noShowApt.startTime,
        endTime,
        date: noShowApt.date,
        status: "scheduled",
        fromQueue: true,
      };
      setPendingAppointment({ appointment: newApt, queueEntryId: activeId, replaceAptId: noShowAptId });
      return;
    }

    if (!overId.startsWith("timeline-")) return;

    const barberId = overId.replace("timeline-", "");
    const dropTime = dragTimeRef.current;
    if (!dropTime) return;

    if (activeId.startsWith("reschedule-")) {
      const appointmentId = activeId.replace("reschedule-", "");
      const apt = appointments.find((a) => a.id === appointmentId);
      if (!apt) return;

      const service = services.find((s) => s.id === apt.serviceId);
      if (!service) return;

      const newStartMin = timeToMinutes(dropTime);
      const newEndMin = newStartMin + service.durationMinutes;

      const targetBarber = barbers.find((b) => b.id === barberId);
      const reschedBarberStartMin = timeToMinutes(targetBarber?.startTime ?? "09:00");
      const reschedBarberEndMin = timeToMinutes(targetBarber?.endTime ?? "18:00");
      const { effectiveStart: reschedEffectiveStart, effectiveEnd: reschedEffectiveEnd } = getEffectiveBounds(reschedBarberStartMin, reschedBarberEndMin, shopOpenMin, shopCloseMin);

      if (newStartMin < reschedEffectiveStart || newEndMin > reschedEffectiveEnd) {
        setDropReject({
          time: dropTime,
          durationMinutes: service.durationMinutes,
        });
        setTimeout(() => setDropReject(null), 600);
        return;
      }

      const barberApts = appointments.filter(
        (a) =>
          a.barberId === barberId &&
          a.date === today &&
          a.clientName !== "Open Slot" &&
          a.id !== appointmentId &&
          a.status !== "cancelled",
      );
      let hasOverlap = barberApts.some((a) => {
        const aStart = timeToMinutes(a.startTime);
        const aEnd = timeToMinutes(a.endTime);
        return newStartMin < aEnd && newEndMin > aStart;
      });
      if (!hasOverlap && targetBarber?.lunchBreak) {
        const lStart = timeToMinutes(targetBarber.lunchBreak.start);
        const lEnd = timeToMinutes(targetBarber.lunchBreak.end);
        if (newStartMin < lEnd && newEndMin > lStart) {
          hasOverlap = true;
        }
      }

      if (hasOverlap) {
        setDropReject({
          time: dropTime,
          durationMinutes: service.durationMinutes,
        });
        setTimeout(() => setDropReject(null), 600);
        return;
      }

      moveAppointment(appointmentId, dropTime, minutesToTime(newEndMin));
      return;
    }

    const entry = queue.find((q) => q.id === activeId);
    if (!entry) return;

    const service = services.find((s) => s.id === entry.serviceId);
    if (!service) return;

    const newStartMin = timeToMinutes(dropTime);
    const newEndMin = newStartMin + service.durationMinutes;

    const targetBarber = barbers.find((b) => b.id === barberId);
    const queueBarberStartMin = timeToMinutes(targetBarber?.startTime ?? "09:00");
    const queueBarberEndMin = timeToMinutes(targetBarber?.endTime ?? "18:00");
    const { effectiveStart: queueEffectiveStart, effectiveEnd: queueEffectiveEnd } = getEffectiveBounds(queueBarberStartMin, queueBarberEndMin, shopOpenMin, shopCloseMin);

    if (newStartMin < queueEffectiveStart || newEndMin > queueEffectiveEnd) {
      setDropReject({
        time: dropTime,
        durationMinutes: service.durationMinutes,
      });
      setTimeout(() => setDropReject(null), 600);
      return;
    }

    const barberApts = appointments.filter(
      (a) =>
        a.barberId === barberId &&
        a.date === today &&
        a.clientName !== "Open Slot" &&
        a.status !== "cancelled",
    );
    let hasOverlap = barberApts.some((a) => {
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      return newStartMin < aEnd && newEndMin > aStart;
    });
    if (!hasOverlap && targetBarber?.lunchBreak) {
      const lStart = timeToMinutes(targetBarber.lunchBreak.start);
      const lEnd = timeToMinutes(targetBarber.lunchBreak.end);
      if (newStartMin < lEnd && newEndMin > lStart) {
        hasOverlap = true;
      }
    }

    if (hasOverlap) {
      setDropReject({
        time: dropTime,
        durationMinutes: service.durationMinutes,
      });
      setTimeout(() => setDropReject(null), 600);
      return;
    }

    const newApt: Appointment = {
      id: crypto.randomUUID(),
      clientName: entry.clientName,
      clientPhone: entry.clientPhone ?? "",
      clientEmail: entry.clientEmail ?? "",
      serviceId: entry.serviceId,
      barberId,
      startTime: dropTime,
      endTime: minutesToTime(newEndMin),
      date: today,
      status: "scheduled",
      fromQueue: true,
    };
    setPendingAppointment({ appointment: newApt, queueEntryId: activeId });
  }

  function handleStatusChange(
    appointmentId: string,
    status: Appointment["status"],
    paymentMethod?: "cash" | "card",
  ) {
    const apt = appointments.find((a) => a.id === appointmentId);
    updateAppointmentStatus(appointmentId, status, paymentMethod);
    setActiveAppointmentId(null);

    if (!apt) return;
    if (status === "no-show" && apt.status !== "no-show") {
      incrementNoShowForCustomer(apt);
    }
  }

  function handleDeleteAppointment(appointmentId: string) {
    deleteAppointment(appointmentId);
    setActiveAppointmentId(null);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {smsNotice && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm shadow-lg">
            {smsNotice}
          </div>
        )}
        {/* Barber Switcher Bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <span className="text-sm font-medium text-gray-500">Viewing:</span>
          <BarberSwitcher
            barbers={barbers}
            selectedId={selectedBarberId}
            onChange={setSelectedBarberId}
          />
          <span className="ml-auto text-sm text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Main content */}
        <div className="flex flex-1 gap-4 p-4 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CalendarPanel
              appointments={barberAppointments}
              barber={selectedBarber}
              services={services}
              onAppointmentClick={(apt) => setActiveAppointmentId(apt.id)}
              isDragging={isTimelineDragging}
              hoveredNoShowId={hoveredNoShowId}
              draggedServiceId={draggedServiceId}
              onDragTimeChange={handleDragTimeChange}
              dropReject={dropReject}
              shopHoursToday={todayShopHours}
            />
          </div>
          <div className="w-72 overflow-hidden">
            <QueuePanel
              queue={barberQueue}
              barber={selectedBarber}
              services={services}
              totalWaiting={barberQueue.length}
              onCardMouseDown={handleQueueMouseDown}
              onRetractOffer={retractOffer}
            />
          </div>
        </div>

        {/* Appointment popup */}
        {activeAppointment && (
          <AppointmentPopup
            appointment={activeAppointment}
            barber={selectedBarber}
            service={services.find(
              (s) => s.id === activeAppointment.serviceId,
            )}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteAppointment}
            onClose={() => setActiveAppointmentId(null)}
          />
        )}

        {/* Drag confirm / undo popup */}
        {pendingAppointment && (
          <DragConfirmPopup
            appointment={pendingAppointment.appointment}
            barber={
              barbers.find(
                (b) => b.id === pendingAppointment.appointment.barberId,
              ) ?? selectedBarber
            }
            service={services.find(
              (s) => s.id === pendingAppointment.appointment.serviceId,
            )}
            onConfirm={() => {
              // Offer the slot to the customer instead of immediately creating the appointment.
              // The customer's status page will show Accept/Decline — appointment is created only on Accept.
              offerQueueSlot(
                pendingAppointment.queueEntryId,
                pendingAppointment.appointment.startTime,
                pendingAppointment.appointment.date,
                pendingAppointment.appointment.barberId,
              );
              setPendingAppointment(null);
              setSmsNotice("Slot offered — waiting for customer confirmation");
              setTimeout(() => setSmsNotice(null), 4000);
            }}
            onUndo={() => {
              setPendingAppointment(null);
            }}
          />
        )}
      </div>

    </DndContext>
  );
}
