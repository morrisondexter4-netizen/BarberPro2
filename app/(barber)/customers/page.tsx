"use client";

import { useState, useMemo, useEffect } from "react";
import { useCrmStore } from "@/lib/crm/store";
import { searchCustomers } from "@/lib/crm/selectors";
import type { Customer as CrmCustomer } from "@/lib/crm/types";
import { MOCK_CUSTOMERS } from "@/lib/crm/mock";
import PageContainer from "@/components/ui/PageContainer";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import CustomerTable from "@/components/crm/CustomerTable";
import CustomerFormModal from "@/components/crm/CustomerFormModal";

const CUSTOMERS_STORAGE_KEY = "barberpro.customers.v1";

type StorageCustomer = CrmCustomer & { noShowCount: number };

export default function CustomersPage() {
  const { state, actions } = useCrmStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [storageCustomers, setStorageCustomers] = useState<StorageCustomer[]>([]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") {
        setStorageCustomers(MOCK_CUSTOMERS.map((c) => ({ ...c, noShowCount: 0 })));
        return;
      }

      const raw = window.localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      let customers: StorageCustomer[];

      if (!raw) {
        customers = MOCK_CUSTOMERS.map((c) => ({ ...c, noShowCount: 0 }));
        window.localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
      } else {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          customers = parsed.map((c: any) => ({
            ...c,
            noShowCount: typeof c.noShowCount === "number" ? c.noShowCount : 0,
          }));
        } else {
          customers = [];
        }
      }

      setStorageCustomers(customers);
    } catch {
      // ignore storage issues
    }
  }, []);

  useEffect(() => {
    if (state.customers.length === 0) return;

    setStorageCustomers((prev) => {
      const byId = new Map(prev.map((c) => [c.id, c]));
      let changed = false;

      const next: StorageCustomer[] = state.customers.map((c) => {
        const existing = byId.get(c.id);
        const merged: StorageCustomer = {
          ...c,
          noShowCount: existing?.noShowCount ?? 0,
        };

        if (
          !existing ||
          existing.firstName !== merged.firstName ||
          existing.lastName !== merged.lastName ||
          existing.phone !== merged.phone ||
          existing.email !== merged.email ||
          existing.notes !== merged.notes ||
          existing.createdAt !== merged.createdAt ||
          existing.visitCount !== merged.visitCount
        ) {
          changed = true;
        }

        return merged;
      });

      // Preserve any customers that exist only in storage (e.g. created from dashboard)
      prev.forEach((c) => {
        if (!next.some((n) => n.id === c.id)) {
          next.push(c);
          changed = true;
        }
      });

      if (changed) {
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      }

      return prev;
    });
  }, [state.customers]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUpdated = () => {
      try {
        const raw = window.localStorage.getItem(CUSTOMERS_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        const customers: StorageCustomer[] = parsed.map((c: any) => ({
          ...c,
          noShowCount: typeof c.noShowCount === "number" ? c.noShowCount : 0,
        }));

        setStorageCustomers(customers);
      } catch {
        // ignore
      }
    };

    window.addEventListener("barberpro:customers-updated", handleUpdated);
    return () => {
      window.removeEventListener("barberpro:customers-updated", handleUpdated);
    };
  }, []);

  const customers = useMemo(() => {
    const base = searchCustomers(state, searchQuery);

    const normalizeName = (value: string) =>
      value.toLowerCase().trim().replace(/\s+/g, " ");

    const byPhone = new Map<string, StorageCustomer>();
    const byEmail = new Map<string, StorageCustomer>();
    const byId = new Map<string, StorageCustomer>();
    const byName = new Map<string, StorageCustomer>();

    storageCustomers.forEach((c) => {
      if (c.phone) byPhone.set(c.phone.trim(), c);
      if (c.email) byEmail.set(c.email.toLowerCase().trim(), c);
      if (c.id) byId.set(c.id, c);
      const fullName = `${c.firstName} ${c.lastName}`.trim();
      if (fullName) byName.set(normalizeName(fullName), c);
    });

    return base.map((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.trim();
      let match: StorageCustomer | undefined;

      if (c.phone) {
        match = byPhone.get(c.phone.trim());
      }
      if (!match && c.email) {
        match = byEmail.get(c.email.toLowerCase().trim());
      }
      if (!match) {
        match = byId.get(c.id);
      }
      if (!match && fullName) {
        match = byName.get(normalizeName(fullName));
      }

      return {
        ...c,
        noShowCount: match?.noShowCount ?? 0,
      };
    });
  }, [state, searchQuery, storageCustomers]);

  const handleAddCustomer = (payload: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
  }) => {
    try {
      const customer = actions.addCustomer(payload);

      setStorageCustomers((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === customer.id);
        const next: StorageCustomer[] = [...prev];
        const merged: StorageCustomer = {
          ...customer,
          noShowCount: existingIdx !== -1 ? next[existingIdx].noShowCount : 0,
        };

        if (existingIdx === -1) {
          next.push(merged);
        } else {
          next[existingIdx] = merged;
        }

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
        }

        return next;
      });

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
