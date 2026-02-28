"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { Service } from "./types";

type ServiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onSave: (service: Service) => void;
};

export default function ServiceModal({ isOpen, onClose, service, onSave }: ServiceModalProps) {
  const [local, setLocal] = useState<Service | null>(null);

  useEffect(() => {
    if (isOpen && service) setLocal({ ...service });
    if (!isOpen) setLocal(null);
  }, [isOpen, service]);

  if (!service || !local) return null;

  const update = (patch: Partial<Service>) =>
    setLocal((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={local.id ? "Edit service" : "Add service"} size="sm">
      <div className="space-y-4">
        <Input
          label="Name"
          value={local.name}
          onChange={(e) => update({ name: e.target.value })}
          className="rounded-xl"
        />
        <Input
          label="Duration (minutes)"
          type="number"
          min={1}
          value={local.durationMinutes}
          onChange={(e) => update({ durationMinutes: Number(e.target.value) || 0 })}
          className="rounded-xl"
        />
        <Input
          label="Price"
          type="number"
          min={0}
          step={0.01}
          value={local.price}
          onChange={(e) => update({ price: Number(e.target.value) || 0 })}
          className="rounded-xl"
        />
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
