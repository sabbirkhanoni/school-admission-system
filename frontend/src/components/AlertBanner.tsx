import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success';
  message: string;
  onClose: () => void;
  autoCloseDuration?: number;
}

export const AlertBanner: React.FC<AlertProps> = ({
  type,
  message,
  onClose,
  autoCloseDuration = 2000,
}) => {
  const isError = type === 'error';

  useEffect(() => {
    if (!autoCloseDuration || autoCloseDuration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDuration);
    return () => clearTimeout(timer);
  }, [onClose, autoCloseDuration, message]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm max-w-md transition-all ${isError
          ? 'bg-red-50 border-red-200 text-red-800'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
      )}
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/5 rounded transition-colors text-gray-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

