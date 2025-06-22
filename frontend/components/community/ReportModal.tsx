import React, { useState } from 'react';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ open, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(reason);
    setReason('');
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded p-6 w-full max-w-sm shadow-lg">
        <h2 className="font-bold mb-2">Report Content</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[60px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="Describe the issue..."
          />
          <div className="flex gap-2 justify-end">
            <button type="button" className="px-3 py-1 rounded bg-muted" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="px-3 py-1 rounded bg-destructive text-white" disabled={loading}>
              {loading ? 'Reporting...' : 'Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 