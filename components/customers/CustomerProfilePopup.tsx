"use client";

import { useState, useEffect } from "react";
import { useCrmStore } from "@/lib/crm/store";
import type { Customer, Visit } from "@/lib/crm/types";

type Props = {
  clientName: string;
  onClose: () => void;
};

const OUTCOME_BADGE: Record<string, string> = {
  DONE: "bg-gray-100 text-gray-600",
  NO_SHOW: "bg-red-100 text-red-600",
};

const OUTCOME_LABEL: Record<string, string> = {
  DONE: "DONE",
  NO_SHOW: "NO SHOW",
};

function formatVisitDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) +
    ", " +
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
}

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default function CustomerProfilePopup({ clientName, onClose }: Props) {
  const { state } = useCrmStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const customer: Customer | undefined = state.customers.find(
    (c) => `${c.firstName} ${c.lastName}` === clientName
  );

  if (!customer) {
    return (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center"
        >
          <p className="text-gray-600 mb-4">
            No profile found for <span className="font-semibold">{clientName}</span>
          </p>
          <button
            onClick={onClose}
            className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const visits: Visit[] = state.visits
    .filter((v) => v.customerId === customer.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const visitCount = visits.length;
  const noShowCount = visits.filter((v) => v.outcome === "NO_SHOW").length;
  const noShowRate = visitCount > 0 ? Math.round((noShowCount / visitCount) * 100) : 0;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col transition-all duration-200 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Header */}
        <div className="relative shrink-0 p-6 pb-4 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 4L12 12M12 4L4 12" />
            </svg>
          </button>

          <div className="flex items-start justify-between pr-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {customer.firstName} {customer.lastName}
              </h2>
              {customer.phone && (
                <p className="text-sm text-gray-500 mt-0.5">{customer.phone}</p>
              )}
              {customer.email && (
                <p className="text-sm text-gray-500">{customer.email}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {}}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {}}
                className="bg-gray-900 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Record Visit
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left column */}
            <div className="w-full md:w-64 shrink-0">
              {/* Notes */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Notes</h3>
                  <button
                    onClick={() => {}}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Edit
                  </button>
                </div>
                <p className={`text-sm ${customer.notes ? "text-gray-700" : "text-gray-400"}`}>
                  {customer.notes || "No notes yet"}
                </p>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Stats</h3>
                <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-600">Visits</span>
                  <span className="font-medium text-gray-900">{visitCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-600">No Shows</span>
                  <span className="font-medium text-gray-900">{noShowCount}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">No Show Rate</span>
                  <span className={`font-medium ${noShowRate > 20 ? "text-red-500" : "text-gray-900"}`}>
                    {noShowRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Visit history</h3>
              {visits.length === 0 ? (
                <p className="text-sm text-gray-400">No visits recorded yet.</p>
              ) : (
                <div>
                  {visits.map((visit, idx) => (
                    <div
                      key={visit.id}
                      className={`pb-4 mb-4 ${idx < visits.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            {formatVisitDate(visit.date)}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {visit.barberName} · {visit.service} · {visit.durationMinutes} min · {visit.source}
                          </p>
                          {(visit.price != null || visit.tip != null) && (
                            <p className="text-sm text-gray-400 mt-0.5">
                              {visit.price != null && formatPrice(visit.price)}
                              {visit.tip != null && ` · Tip ${formatPrice(visit.tip)}`}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium uppercase ${
                            OUTCOME_BADGE[visit.outcome] ?? "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {OUTCOME_LABEL[visit.outcome] ?? visit.outcome}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
