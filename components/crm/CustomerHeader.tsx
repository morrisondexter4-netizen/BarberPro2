"use client";

import type { Customer } from "@/lib/crm/types";
import Button from "@/components/ui/Button";

type CustomerHeaderProps = {
  customer: Customer;
  onEdit: () => void;
  onRecordVisit: () => void;
};

export default function CustomerHeader({ customer, onEdit, onRecordVisit }: CustomerHeaderProps) {
  const name = `${customer.firstName} ${customer.lastName}`;
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        <p className="text-gray-600 mt-0.5">{customer.phone}</p>
        <p className="text-sm text-gray-600 mt-0.5">{customer.email}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button variant="secondary" size="md" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="primary" size="md" onClick={onRecordVisit}>
          Record Visit
        </Button>
      </div>
    </div>
  );
}
