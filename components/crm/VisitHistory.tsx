"use client";

import type { Visit } from "@/lib/crm/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatMoney(n?: number): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function VisitHistory({ visits }: { visits: Visit[] }) {
  return (
    <Card>
      <CardHeader>Visit history</CardHeader>
      <CardBody className="p-0">
        {visits.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">No visits recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visits.map((v) => (
              <li key={v.id} className="px-4 py-3 hover:bg-gray-50/50">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-gray-900">{formatDate(v.date)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${v.outcome === "NO_SHOW" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"}`}>
                    {v.outcome}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {v.barberName} · {v.service} · {v.durationMinutes} min · {v.source.replace("_", " ")}
                </div>
                {(v.price != null || v.tip != null) && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatMoney(v.price)} {v.tip != null && `· Tip ${formatMoney(v.tip)}`}
                  </div>
                )}
                {v.notes && <p className="text-xs text-gray-500 mt-1 italic">{v.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
