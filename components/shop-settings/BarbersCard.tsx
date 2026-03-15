"use client";

import Button from "@/components/ui/Button";
import { type Barber, type Service, BarberColor } from "./types";
import BarberModal from "./BarberModal";
import ConfirmDialog from "./ConfirmDialog";

const COLOR_MAP: Record<BarberColor, string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

const cardClass = "rounded-2xl border border-gray-100 bg-white shadow-sm";
const headerClass = "text-lg font-bold text-gray-900";

type BarbersCardProps = {
  barbers: Barber[];
  services: Service[];
  editingBarber: Barber | null;
  removeTarget: Barber | null;
  onAdd: () => void;
  onEdit: (barber: Barber) => void;
  onSaveBarber: (barber: Barber) => void;
  onCloseModal: () => void;
  onRemoveRequest: (barber: Barber) => void;
  onConfirmRemove: () => void;
  onCloseConfirm: () => void;
  onBarberLunchChange: (barberId: string, lunchBreak: { start: string; end: string } | null) => void;
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function BarbersCard({
  barbers,
  services,
  editingBarber,
  removeTarget,
  onAdd,
  onEdit,
  onSaveBarber,
  onCloseModal,
  onRemoveRequest,
  onConfirmRemove,
  onCloseConfirm,
  onBarberLunchChange,
}: BarbersCardProps) {
  const invalidLunch = barbers.some(
    (b) =>
      b.lunchEnabled &&
      timeToMinutes(b.lunchEnd) <= timeToMinutes(b.lunchStart)
  );
  const canSave = !invalidLunch;

  return (
    <div className={cardClass}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className={headerClass}>Barbers</h2>
        <Button variant="primary" size="sm" onClick={onAdd} className="rounded-xl">
          Add barber
        </Button>
      </div>
      <div className="px-4 py-4">
        <ul className="space-y-4">
          {barbers.map((b) => {
            const lunchInvalid =
              b.lunchEnabled &&
              timeToMinutes(b.lunchEnd) <= timeToMinutes(b.lunchStart);
            return (
              <li
                key={b.id}
                className="py-2 border-b border-gray-50 last:border-0 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${COLOR_MAP[b.color]}`} />
                  <span className="text-sm text-gray-900 flex-1 truncate">{b.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(b)} className="rounded-xl">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onRemoveRequest(b)} className="rounded-xl text-red-600 hover:bg-red-50">
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pl-6">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={!b.lunchEnabled}
                      onChange={(e) =>
                        onBarberLunchChange(b.id, e.target.checked ? null : { start: b.lunchStart, end: b.lunchEnd })
                      }
                      className="rounded border-gray-300 text-black focus:ring-gray-400"
                    />
                    <span className="text-sm text-gray-600">No lunch break</span>
                  </label>
                  {b.lunchEnabled && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Lunch start</span>
                        <input
                          type="time"
                          value={b.lunchStart}
                          onChange={(e) =>
                            onBarberLunchChange(b.id, {
                              start: e.target.value,
                              end: b.lunchEnd,
                            })
                          }
                          className="rounded-xl border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Lunch end</span>
                        <input
                          type="time"
                          value={b.lunchEnd}
                          onChange={(e) =>
                            onBarberLunchChange(b.id, {
                              start: b.lunchStart,
                              end: e.target.value,
                            })
                          }
                          className="rounded-xl border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                        />
                      </div>
                      {lunchInvalid && (
                        <span className="text-xs text-red-600">End must be after start</span>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {invalidLunch && (
          <p className="text-xs text-red-600 mt-2">Fix invalid lunch times to save.</p>
        )}
        {barbers.length > 0 && (
          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              className="rounded-xl"
              disabled={!canSave}
              onClick={() => {}}
            >
              Save
            </Button>
          </div>
        )}
        {barbers.length === 0 && (
          <p className="text-sm text-gray-500 py-4">No barbers yet. Add one to get started.</p>
        )}
      </div>
      <BarberModal
        isOpen={editingBarber !== null}
        onClose={onCloseModal}
        barber={editingBarber}
        onSave={onSaveBarber}
        services={services}
      />
      <ConfirmDialog
        isOpen={removeTarget !== null}
        onClose={onCloseConfirm}
        onConfirm={onConfirmRemove}
        title="Remove barber"
        message={removeTarget ? `Remove ${removeTarget.name}? This cannot be undone.` : ""}
        confirmLabel="Remove"
      />
    </div>
  );
}
