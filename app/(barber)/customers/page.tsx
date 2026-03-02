"use client";

import { useState, useMemo, useEffect } from "react";
import { useCrmStore } from "@/lib/crm/store";
import { searchCustomers } from "@/lib/crm/selectors";
import { loadCustomers } from "@/lib/settings";
import type { Customer as BookingCustomer } from "@/lib/types";
import PageContainer from "@/components/ui/PageContainer";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import CustomerTable from "@/components/crm/CustomerTable";
import CustomerFormModal from "@/components/crm/CustomerFormModal";

export default function CustomersPage() {
  const { state, actions } = useCrmStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bookingCustomers, setBookingCustomers] = useState<BookingCustomer[]>([]);

  useEffect(() => {
    try {
      const loaded = loadCustomers();
      if (Array.isArray(loaded)) {
        setBookingCustomers(loaded);
      }
    } catch {
      // ignore storage issues
    }
  }, []);

  const customers = useMemo(() => {
    const base = searchCustomers(state, searchQuery);

    const visitNoShows: Record<string, number> = {};
    state.visits.forEach((v) => {
      if (v.outcome === "NO_SHOW") {
        visitNoShows[v.customerId] = (visitNoShows[v.customerId] ?? 0) + 1;
      }
    });

    const bookingNoShowsByContact: Record<string, number> = {};
    bookingCustomers.forEach((bc) => {
      const count =
        (bc as BookingCustomer & { noShowCount?: number }).noShowCount ??
        (bc as any).noShows ??
        0;
      if (count <= 0) return;
      const key = bc.phone || bc.email || bc.name;
      if (!key) return;
      bookingNoShowsByContact[key] =
        (bookingNoShowsByContact[key] ?? 0) + count;
    });

    return base.map((c) => {
      const fromVisits = visitNoShows[c.id] ?? 0;
      const contactKey =
        c.phone || c.email || `${c.firstName} ${c.lastName}`.trim();
      const fromBookings = contactKey
        ? bookingNoShowsByContact[contactKey] ?? 0
        : 0;

      return {
        ...c,
        noShowCount: fromVisits + fromBookings,
      };
    });
  }, [state, searchQuery, bookingCustomers]);

  const handleAddCustomer = (payload: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
  }) => {
    try {
      actions.addCustomer(payload);
      setAddModalOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add customer";
      alert(msg);
    }
  };

  return (
    <PageContainer title="Customers">
      <p className="text-gray-500 text-sm mb-6">Search and track client history.</p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <input
            type="search"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          />
        </div>
        <Button className="shrink-0" onClick={() => setAddModalOpen(true)}>
          Add customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          title={state.customers.length === 0 ? "No customers yet" : "No customers match your search"}
          description={state.customers.length === 0 ? "Add your first customer to get started." : "Try a different search."}
        >
          {state.customers.length === 0 && (
            <Button onClick={() => setAddModalOpen(true)}>Add customer</Button>
          )}
        </EmptyState>
      ) : (
        <CustomerTable customers={customers} />
      )}

      <CustomerFormModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddCustomer}
      />
    </PageContainer>
  );
}
