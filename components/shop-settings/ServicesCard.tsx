"use client";

import Button from "@/components/ui/Button";
import type { Service } from "./types";
import ServiceModal from "./ServiceModal";
import ConfirmDialog from "./ConfirmDialog";

const cardClass = "rounded-2xl border border-gray-100 bg-white shadow-sm";
const headerClass = "text-lg font-bold text-gray-900";

type ServicesCardProps = {
  services: Service[];
  editingService: Service | null;
  removeTarget: Service | null;
  onAdd: () => void;
  onEdit: (service: Service) => void;
  onSaveService: (service: Service) => void;
  onCloseModal: () => void;
  onRemoveRequest: (service: Service) => void;
  onConfirmRemove: () => void;
  onCloseConfirm: () => void;
};

export default function ServicesCard({
  services,
  editingService,
  removeTarget,
  onAdd,
  onEdit,
  onSaveService,
  onCloseModal,
  onRemoveRequest,
  onConfirmRemove,
  onCloseConfirm,
}: ServicesCardProps) {
  return (
    <div className={cardClass}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className={headerClass}>Services</h2>
        <Button variant="primary" size="sm" onClick={onAdd} className="rounded-xl">
          Add service
        </Button>
      </div>
      <div className="px-4 py-4">
        <ul className="space-y-2">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-900">{s.name}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {s.durationMinutes} min · ${s.price.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => onEdit(s)} className="rounded-xl">
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onRemoveRequest(s)} className="rounded-xl text-red-600 hover:bg-red-50">
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {services.length === 0 && (
          <p className="text-sm text-gray-500 py-4">No services yet. Add one to get started.</p>
        )}
      </div>
      <ServiceModal
        isOpen={editingService !== null}
        onClose={onCloseModal}
        service={editingService}
        onSave={onSaveService}
      />
      <ConfirmDialog
        isOpen={removeTarget !== null}
        onClose={onCloseConfirm}
        onConfirm={onConfirmRemove}
        title="Remove service"
        message={removeTarget ? `Remove "${removeTarget.name}"? This cannot be undone.` : ""}
        confirmLabel="Remove"
      />
    </div>
  );
}
