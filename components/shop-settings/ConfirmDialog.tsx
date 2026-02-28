"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "secondary" | "ghost" | "danger";
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-700 mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} className="rounded-xl">
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={handleConfirm} className="rounded-xl">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
