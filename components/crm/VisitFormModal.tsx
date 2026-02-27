"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select, { type SelectOption } from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import type { Service, VisitOutcome, VisitSource } from "@/lib/crm/types";

const SERVICE_OPTIONS: SelectOption[] = [
  { value: "Haircut", label: "Haircut" },
  { value: "Fade", label: "Fade" },
  { value: "Beard Trim", label: "Beard Trim" },
  { value: "Haircut + Beard", label: "Haircut + Beard" },
];

const SOURCE_OPTIONS: SelectOption[] = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "BOOKED", label: "Booked" },
];

const OUTCOME_OPTIONS: SelectOption[] = [
  { value: "DONE", label: "Done" },
  { value: "NO_SHOW", label: "Missed" },
];

function todayISO(): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

type VisitFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSubmit: (payload: {
    customerId: string;
    date: string;
    barberName: string;
    service: Service;
    durationMinutes: number;
    source: VisitSource;
    outcome: VisitOutcome;
    price?: number;
    tip?: number;
    notes?: string;
  }) => void;
};

const defaultValues = {
  date: todayISO().slice(0, 16),
  barberName: "Marcus",
  service: "Haircut" as Service,
  durationMinutes: 45,
  source: "BOOKED" as VisitSource,
  outcome: "DONE" as VisitOutcome,
  price: "",
  tip: "",
  notes: "",
};

export default function VisitFormModal({
  isOpen,
  onClose,
  customerId,
  onSubmit,
}: VisitFormModalProps) {
  const [values, setValues] = useState(defaultValues);

  useEffect(() => {
    if (isOpen) {
      setValues({
        ...defaultValues,
        date: todayISO().slice(0, 16),
      });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const date = new Date(values.date).toISOString();
    onSubmit({
      customerId,
      date,
      barberName: values.barberName,
      service: values.service,
      durationMinutes: values.durationMinutes,
      source: values.source,
      outcome: values.outcome,
      price: values.price === "" ? undefined : Number(values.price),
      tip: values.tip === "" ? undefined : Number(values.tip),
      notes: values.notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record visit" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Date & time"
          type="datetime-local"
          value={values.date}
          onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
        />
        <Input
          label="Barber"
          value={values.barberName}
          onChange={(e) => setValues((v) => ({ ...v, barberName: e.target.value }))}
          placeholder="Barber name"
        />
        <Select
          label="Service"
          options={SERVICE_OPTIONS}
          value={values.service}
          onChange={(e) => setValues((v) => ({ ...v, service: e.target.value as Service }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Source"
            options={SOURCE_OPTIONS}
            value={values.source}
            onChange={(e) => setValues((v) => ({ ...v, source: e.target.value as VisitSource }))}
          />
          <Select
            label="Outcome"
            options={OUTCOME_OPTIONS}
            value={values.outcome}
            onChange={(e) => setValues((v) => ({ ...v, outcome: e.target.value as VisitOutcome }))}
          />
        </div>
        <Input
          label="Duration (minutes)"
          type="number"
          min={15}
          max={120}
          value={values.durationMinutes}
          onChange={(e) => setValues((v) => ({ ...v, durationMinutes: Number(e.target.value) || 45 }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Price ($)"
            type="number"
            min={0}
            step={0.01}
            value={values.price}
            onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
            placeholder="Optional"
          />
          <Input
            label="Tip ($)"
            type="number"
            min={0}
            step={0.01}
            value={values.tip}
            onChange={(e) => setValues((v) => ({ ...v, tip: e.target.value }))}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={values.notes}
            onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-y"
            placeholder="Visit notes..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Record visit</Button>
        </div>
      </form>
    </Modal>
  );
}
