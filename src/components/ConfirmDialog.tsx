'use client';

import { AlertTriangle, Info } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
}: ConfirmDialogProps) {
  const isDanger = confirmVariant === 'danger';

  const icon = isDanger ? (
    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
      <AlertTriangle size={20} className="text-red-500" />
    </div>
  ) : (
    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
      <Info size={20} className="text-indigo-500" />
    </div>
  );

  const confirmButtonClass = isDanger
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/50'
    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500/50';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-border"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors focus:outline-none focus:ring-2 ${confirmButtonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        {icon}
        <p className="text-sm text-muted leading-relaxed pt-2">{message}</p>
      </div>
    </Modal>
  );
}
