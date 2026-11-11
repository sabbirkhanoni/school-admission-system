import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, CreditCard, Trash2 } from 'lucide-react';
import { StudentHold } from '../types';

interface HoldCardProps {
  hold: StudentHold;
  onConfirm: (holdId: string) => Promise<void>;
  onCancel: (holdId: string) => Promise<void>;
}

export const HoldCard: React.FC<HoldCardProps> = ({ hold, onConfirm, onCancel }) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const diff = Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Live real-time countdown timer without page reload
  useEffect(() => {
    if (hold.status !== 'HELD') return;

    const timer = setInterval(() => {
      const diff = Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsLeft(0);
        clearInterval(timer);
      } else {
        setSecondsLeft(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hold.expiresAt, hold.status]);

  // Determine effective status: If HELD but countdown reaches 0, display as EXPIRED immediately
  const isExpired = hold.status === 'EXPIRED' || (hold.status === 'HELD' && secondsLeft <= 0);
  const effectiveStatus = isExpired ? 'EXPIRED' : hold.status;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm(hold.holdId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsProcessing(true);
      await onCancel(hold.holdId);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">#{hold.holdId}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                effectiveStatus === 'CONFIRMED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : effectiveStatus === 'HELD'
                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                  : effectiveStatus === 'EXPIRED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {effectiveStatus}
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900 mt-1">{hold.className}</h3>
        </div>

        {/* Live Countdown Badge */}
        {effectiveStatus === 'HELD' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-mono text-sm font-bold">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span>Time Left: {formatTime(secondsLeft)}</span>
          </div>
        )}

        {effectiveStatus === 'CONFIRMED' && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5" />
            <span>Admission Confirmed</span>
          </div>
        )}

        {effectiveStatus === 'EXPIRED' && (
          <div className="flex items-center gap-1.5 text-rose-600 text-sm font-medium">
            <AlertTriangle className="w-5 h-5" />
            <span>Hold Expired</span>
          </div>
        )}

        {effectiveStatus === 'CANCELLED' && (
          <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
            <XCircle className="w-5 h-5" />
            <span>Cancelled</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {effectiveStatus === 'HELD' && (
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleConfirm}
            disabled={isExpired || isProcessing}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>{isProcessing ? 'Processing...' : 'Pay Admission Fee'}</span>
          </button>

          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      )}
    </div>
  );
};

