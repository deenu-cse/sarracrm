import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function RejectionModal({ isOpen, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (reason.length < 20) {
      setError('Please provide a detailed reason (minimum 20 characters)');
      return;
    }
    setError('');
    onConfirm(reason);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject DPR Form" maxWidth="max-w-lg">
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Reason for Rejection <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500 mb-3">
          This reason will be visible to the PIA officer so they can make necessary corrections.
        </p>
        <textarea
          rows={5}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:outline-none ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-slate-300 focus:ring-navy-light focus:border-navy'}`}
          placeholder="Please explain what needs to be changed or corrected..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (e.target.value.length >= 20) setError('');
          }}
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-red-500">{error}</p>
          <p className={`text-xs ${reason.length < 20 ? 'text-slate-400' : 'text-green-600'}`}>
            {reason.length} / 500 characters
          </p>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="danger" onClick={handleSubmit} loading={loading}>Confirm Reject</Button>
      </div>
    </Modal>
  );
}
