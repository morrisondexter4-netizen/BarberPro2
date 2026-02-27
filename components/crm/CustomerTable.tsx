"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Customer } from "@/lib/crm/types";

export default function CustomerTable({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">Phone</th>
              <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">Visits</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/customers/${c.id}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/customers/${c.id}`)}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="py-3 px-3">
                  <span className="font-medium text-gray-900">
                    {c.firstName} {c.lastName}
                  </span>
                </td>
                <td className="py-3 px-3 text-sm text-gray-600">{c.phone}</td>
                <td className="py-3 px-3 text-sm text-gray-600">{c.email}</td>
                <td className="py-3 px-3 text-sm text-gray-600">{c.visitCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="block p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">
              {c.firstName} {c.lastName}
            </div>
            <div className="text-sm text-gray-600 mt-0.5">{c.phone}</div>
            <div className="text-sm text-gray-600 mt-0.5">{c.email}</div>
            <div className="text-xs text-gray-500 mt-2">{c.visitCount} visits</div>
          </Link>
        ))}
      </div>
    </>
  );
}
