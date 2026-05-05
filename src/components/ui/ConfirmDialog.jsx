import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'danger', loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4 mb-6">
        <div className={`p-3 rounded-full ${confirmVariant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </div>
    </Modal>
  );
}
