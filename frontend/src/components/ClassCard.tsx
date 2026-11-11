import React from 'react';
import { Lock, CheckCircle, Sparkles, Send } from 'lucide-react';
import { SchoolClass } from '../types';

interface ClassCardProps {
  cls: SchoolClass;
  hasActiveHoldInThisClass: boolean;
  isValidStudentId: boolean;
  onApply: (classId: string) => Promise<void>;
  isApplying: boolean;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  cls,
  hasActiveHoldInThisClass,
  isValidStudentId,
  onApply,
  isApplying,
}) => {
  const isSeatFull = cls.availableSeats <= 0;
  const percentConfirmed = Math.round((cls.confirmedSeats / cls.totalSeats) * 100);
  const percentHeld = Math.round((cls.heldSeats / cls.totalSeats) * 100);
  const percentAvailable = Math.max(0, 100 - (percentConfirmed + percentHeld));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Class Name & Availability Pill */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-snug">
              {cls.name}
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {cls.id}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-sm ${
              isSeatFull
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : cls.availableSeats < 10
                ? 'bg-amber-100 text-amber-800 animate-pulse border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {cls.availableSeats} Available
          </span>
        </div>

        {/* 1. Segmented Capacity Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs font-semibold mb-1.5 text-gray-600">
            <span>Seat Allocation</span>
            <span className="font-mono">{cls.confirmedSeats + cls.heldSeats} / {cls.totalSeats} ({percentConfirmed + percentHeld}%)</span>
          </div>

          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${percentConfirmed}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Confirmed: ${cls.confirmedSeats} (${percentConfirmed}%)`}
            />
            <div
              style={{ width: `${percentHeld}%` }}
              className="bg-amber-400 h-full transition-all duration-500 animate-pulse"
              title={`Held: ${cls.heldSeats} (${percentHeld}%)`}
            />
            <div
              style={{ width: `${percentAvailable}%` }}
              className="bg-slate-200 h-full transition-all duration-500"
              title={`Available: ${cls.availableSeats} (${percentAvailable}%)`}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1 font-medium">
            <span>0</span>
            <span>{cls.totalSeats} Total Capacity</span>
          </div>
        </div>

        {/* Seat Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-gray-50 border border-gray-100 mb-6">
          <div>
            <div className="text-xs text-gray-500 font-medium">Total</div>
            <div className="text-base font-bold text-gray-800 font-mono mt-0.5">{cls.totalSeats}</div>
          </div>
          <div>
            <div className="text-xs text-amber-600 font-medium flex items-center justify-center gap-0.5">
              <Lock className="w-3 h-3" />
              <span>Held</span>
            </div>
            <div className="text-base font-bold text-amber-700 font-mono mt-0.5">{cls.heldSeats}</div>
          </div>
          <div>
            <div className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-0.5">
              <CheckCircle className="w-3 h-3" />
              <span>Confirmed</span>
            </div>
            <div className="text-base font-bold text-emerald-700 font-mono mt-0.5">{cls.confirmedSeats}</div>
          </div>
          <div>
            <div className="text-xs text-indigo-600 font-medium flex items-center justify-center gap-0.5">
              <Sparkles className="w-3 h-3" />
              <span>Available</span>
            </div>
            <div className="text-base font-bold text-indigo-700 font-mono mt-0.5">{cls.availableSeats}</div>
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <div>
        <button
          onClick={() => onApply(cls.id)}
          disabled={isSeatFull || hasActiveHoldInThisClass || !isValidStudentId || isApplying}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
            hasActiveHoldInThisClass
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
              : isSeatFull
              ? 'bg-rose-50 text-rose-400 cursor-not-allowed border border-rose-100'
              : !isValidStudentId
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300'
          }`}
        >
          {isApplying ? (
            <span>Applying...</span>
          ) : hasActiveHoldInThisClass ? (
            <span>Already Applied</span>
          ) : isSeatFull ? (
            <span>No Seats Available</span>
          ) : !isValidStudentId ? (
            <span>Enter 17-digit ID to Apply</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Apply for Seat</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
