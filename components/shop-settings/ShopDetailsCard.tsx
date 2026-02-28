"use client";

import { ShopDetailsState, DAYS, type DayKey } from "./types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const cardClass = "rounded-2xl border border-gray-100 bg-white shadow-sm";
const headerClass = "text-lg font-bold text-gray-900";
const labelClass = "text-sm text-gray-700";
const metaClass = "text-xs text-gray-500";

type ShopDetailsCardProps = {
  details: ShopDetailsState;
  onChange: (next: ShopDetailsState) => void;
  onSave: () => void;
  saveMessage?: string | null;
};

export default function ShopDetailsCard({ details, onChange, onSave, saveMessage }: ShopDetailsCardProps) {
  const update = (patch: Partial<ShopDetailsState>) => onChange({ ...details, ...patch });
  const updateHours = (day: DayKey, patch: Partial<ShopDetailsState["hours"][DayKey]>) => {
    onChange({
      ...details,
      hours: { ...details.hours, [day]: { ...details.hours[day], ...patch } },
    });
  };

  return (
    <div className={cardClass}>
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className={headerClass}>Shop Details</h2>
      </div>
      <div className="px-4 py-4 space-y-4">
        <Input
          label="Shop name"
          value={details.shopName}
          onChange={(e) => update({ shopName: e.target.value })}
          className="rounded-xl"
        />
        <Input
          label="Address"
          value={details.address}
          onChange={(e) => update({ address: e.target.value })}
          className="rounded-xl"
        />
        <Input
          label="Phone number"
          type="tel"
          value={details.phone}
          onChange={(e) => update({ phone: e.target.value })}
          className="rounded-xl"
        />
        <div>
          <p className={`${labelClass} mb-2`}>Hours of operation</p>
          <p className={`${metaClass} mb-3`}>Set open/close times for each day.</p>
          <div className="space-y-3">
            {DAYS.map((day) => {
              const h = details.hours[day];
              return (
                <div key={day} className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="w-10 text-sm text-gray-700">{day}</span>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={h.open}
                      onChange={(e) => updateHours(day, { open: e.target.checked })}
                      className="rounded border-gray-300 text-black focus:ring-gray-400"
                    />
                    <span className="text-sm text-gray-700">Open</span>
                  </label>
                  {h.open ? (
                    <>
                      <input
                        type="time"
                        value={h.openTime}
                        onChange={(e) => updateHours(day, { openTime: e.target.value })}
                        className="rounded-xl border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                      />
                      <span className="text-gray-500">–</span>
                      <input
                        type="time"
                        value={h.closeTime}
                        onChange={(e) => updateHours(day, { closeTime: e.target.value })}
                        className="rounded-xl border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                      />
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {saveMessage && (
          <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">{saveMessage}</p>
        )}
        <Button onClick={onSave} className="rounded-xl" variant="primary">
          Save changes
        </Button>
      </div>
    </div>
  );
}
