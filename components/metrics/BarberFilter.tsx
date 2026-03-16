"use client";
import { useBarberPro } from "@/lib/barberpro-context";

type BarberFilterProps = {
  value: string;
  onChange: (barberId: string) => void;
};

export default function BarberFilter({ value, onChange }: BarberFilterProps) {
  const { barbers } = useBarberPro();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
    >
      <option value="all">All Barbers</option>
      {barbers.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}
