"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { Customer } from "@/lib/crm/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CustomerFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
  }) => void;
  initialCustomer?: Customer | null;
};

const defaultValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  notes: "",
};

export default function CustomerFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialCustomer,
}: CustomerFormModalProps) {
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!initialCustomer;

  useEffect(() => {
    if (isOpen) {
      if (initialCustomer) {
        setValues({
          firstName: initialCustomer.firstName,
          lastName: initialCustomer.lastName,
          phone: initialCustomer.phone,
          email: initialCustomer.email,
          notes: initialCustomer.notes ?? "",
        });
      } else {
        setValues(defaultValues);
      }
      setErrors({});
    }
  }, [isOpen, initialCustomer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!values.firstName.trim()) err.firstName = "First name is required";
    if (!values.lastName.trim()) err.lastName = "Last name is required";
    if (!values.phone.trim()) err.phone = "Phone is required";
    if (!values.email.trim()) err.email = "Email is required";
    else if (!EMAIL_REGEX.test(values.email.trim())) err.email = "Enter a valid email address";
    setErrors(err);
    if (Object.keys(err).length > 0) return;
    onSubmit({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      notes: values.notes.trim(),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit customer" : "Add customer"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            value={values.firstName}
            onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
            error={errors.firstName}
            required
          />
          <Input
            label="Last name"
            value={values.lastName}
            onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
            error={errors.lastName}
            required
          />
        </div>
        <Input
          label="Phone"
          type="tel"
          value={values.phone}
          onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
          error={errors.phone}
          required
          placeholder="+1 555-201-1000"
        />
        <Input
          label="Email"
          type="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          error={errors.email}
          required
          placeholder="email@example.com"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={values.notes}
            onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-y"
            placeholder="Notes about this customer..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{isEdit ? "Save" : "Add customer"}</Button>
        </div>
      </form>
    </Modal>
  );
}
