"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useCrmStore } from "@/lib/crm/store";
import { getCustomerById, getVisitsForCustomer } from "@/lib/crm/selectors";
import CustomerHeader from "@/components/crm/CustomerHeader";
import NotesCard from "@/components/crm/NotesCard";
import VisitHistory from "@/components/crm/VisitHistory";
import CustomerFormModal from "@/components/crm/CustomerFormModal";
import VisitFormModal from "@/components/crm/VisitFormModal";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { state, actions } = useCrmStore();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);

  const customer = getCustomerById(state, id);
  const visits = customer ? getVisitsForCustomer(state, id) : [];

  const handleSaveNotes = (notes: string) => {
    if (customer) actions.updateCustomer(customer.id, { notes });
  };

  const handleEditSubmit = (payload: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
  }) => {
    if (!customer) return;
    try {
      actions.updateCustomer(customer.id, payload);
      setEditModalOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update customer";
      alert(msg);
    }
  };

  const handleVisitSubmit = (payload: {
    customerId: string;
    date: string;
    barberName: string;
    service: "Haircut" | "Fade" | "Beard Trim" | "Haircut + Beard";
    durationMinutes: number;
    source: "WALK_IN" | "BOOKED";
    outcome: "DONE" | "NO_SHOW";
    price?: number;
    tip?: number;
    notes?: string;
  }) => {
    actions.addVisit(payload);
    setVisitModalOpen(false);
  };

  if (!customer) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Customer</h1>
        <EmptyState
          title="Customer not found"
          description="This customer may have been removed or the link is invalid."
          actionLabel="Back to customers"
          actionHref="/customers"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CustomerHeader
        customer={customer}
        onEdit={() => setEditModalOpen(true)}
        onRecordVisit={() => setVisitModalOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <NotesCard notes={customer.notes} onSave={handleSaveNotes} />
          <Card>
            <CardHeader>Stats</CardHeader>
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Visits</span>
                <span className="font-medium text-gray-900">{customer.visitCount}</span>
              </div>
            </CardBody>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <VisitHistory visits={visits} />
        </div>
      </div>

      <CustomerFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialCustomer={customer}
      />
      <VisitFormModal
        isOpen={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
        customerId={customer.id}
        onSubmit={handleVisitSubmit}
      />
    </div>
  );
}
