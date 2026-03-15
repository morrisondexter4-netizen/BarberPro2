"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { DAYS, type Barber, type BarberColor, type DayKey, type Service } from "./types";

const COLOR_PILLS: { value: BarberColor; label: string; bg: string }[] = [
  { value: "blue", label: "Blue", bg: "bg-blue-500" },
  { value: "emerald", label: "Emerald", bg: "bg-emerald-500" },
  { value: "violet", label: "Violet", bg: "bg-violet-500" },
  { value: "amber", label: "Amber", bg: "bg-amber-500" },
  { value: "rose", label: "Rose", bg: "bg-rose-500" },
];

const labelClass = "text-sm text-gray-700";
const metaClass = "text-xs text-gray-500";

type BarberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  barber: Barber | null;
  onSave: (barber: Barber) => void;
  services: Service[];
};

export default function BarberModal({ isOpen, onClose, barber, onSave, services }: BarberModalProps) {
  const [local, setLocal] = useState<Barber | null>(null);

  useEffect(() => {
    if (isOpen && barber) setLocal({ ...barber });
    if (!isOpen) setLocal(null);
  }, [isOpen, barber]);

  if (!barber || !local) return null;

  const update = (patch: Partial<Barber>) => setLocal((prev) => (prev ? { ...prev, ...patch } : prev));
  const toggleDay = (day: DayKey) => {
    const next = local.workingDays.includes(day)
      ? local.workingDays.filter((d) => d !== day)
      : [...local.workingDays, day];
    update({ workingDays: next });
  };

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={local.id ? "Edit barber" : "Add barber"} size="md">
      <div className="space-y-4">
        <Input
          label="Name"
          value={local.name}
          onChange={(e) => update({ name: e.target.value })}
          className="rounded-xl"
        />
        <div>
          <p className={`${labelClass} mb-2`}>Color</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_PILLS.map(({ value, label, bg }) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ color: value })}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium border-2 transition-colors ${
                  local.color === value
                    ? "border-gray-900 bg-gray-100"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${bg} mr-1.5 align-middle`} />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={`${labelClass} mb-2`}>Working days</p>
          <div className="flex flex-wrap gap-3">
            {DAYS.map((day) => (
              <label key={day} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={local.workingDays.includes(day)}
                  onChange={() => toggleDay(day)}
                  className="rounded border-gray-300 text-black focus:ring-gray-400"
                />
                <span className="text-sm text-gray-700">{day}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block ${labelClass} mb-1`}>Start time</label>
            <input
              type="time"
              value={local.startTime}
              onChange={(e) => update({ startTime: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className={`block ${labelClass} mb-1`}>End time</label>
            <input
              type="time"
              value={local.endTime}
              onChange={(e) => update({ endTime: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={local.lunchEnabled}
              onChange={(e) => update({ lunchEnabled: e.target.checked })}
              className="rounded border-gray-300 text-black focus:ring-gray-400"
            />
            <span className={labelClass}>Lunch break</span>
          </label>
          {local.lunchEnabled && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <div>
                <label className={`block ${metaClass} mb-1`}>Lunch start</label>
                <input
                  type="time"
                  value={local.lunchStart}
                  onChange={(e) => update({ lunchStart: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className={`block ${metaClass} mb-1`}>Lunch end</label>
                <input
                  type="time"
                  value={local.lunchEnd}
                  onChange={(e) => update({ lunchEnd: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>
            </div>
          )}
        </div>
        {services.length > 0 && (
          <div>
            <p className={`${labelClass} mb-2`}>Service durations</p>
            <p className={`${metaClass} mb-3`}>Override the global duration for this barber. Leave blank to use the default.</p>
            <div className="space-y-2">
              {services.map((svc) => {
                const override = local.serviceDurations?.[svc.id];
                return (
                  <div key={svc.id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 flex-1 truncate">{svc.name}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        step={5}
                        value={override ?? ""}
                        placeholder={String(svc.durationMinutes)}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = { ...(local.serviceDurations ?? {}) };
                          if (val === "" || Number(val) <= 0) {
                            delete next[svc.id];
                          } else {
                            next[svc.id] = Number(val);
                          }
                          update({ serviceDurations: Object.keys(next).length > 0 ? next : undefined });
                        }}
                        className="w-20 rounded-xl border border-gray-300 px-2 py-1.5 text-sm text-gray-900 text-right"
                      />
                      <span className={metaClass}>min</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} className="rounded-xl">
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
