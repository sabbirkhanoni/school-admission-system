import React from 'react';
import { X, History, Inbox } from 'lucide-react';
import { StudentHold } from '../types';
import { HoldCard } from './HoldCard';

interface MyApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  holds: StudentHold[];
  onConfirm: (holdId: string) => Promise<void>;
  onCancel: (holdId: string) => Promise<void>;
}

export const MyApplicationsModal: React.FC<MyApplicationsModalProps> = ({
  isOpen,
  onClose,
  holds,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5 text-gray-900 font-bold">
            <History className="w-5 h-5 text-indigo-600" />
            <span>My Admission Applications</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 font-bold">
              {holds.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {holds.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Inbox className="w-12 h-12 mx-auto mb-3 stroke-[1.5] text-gray-300" />
              <p className="text-base font-semibold text-gray-700">No applications found</p>
              <p className="text-sm text-gray-500 mt-1">
                You have not applied for any class yet. Choose a class from the list to apply.
              </p>
            </div>
          ) : (
            holds.map((hold) => (
              <HoldCard
                key={hold.holdId}
                hold={hold}
                onConfirm={onConfirm}
                onCancel={onCancel}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
};

