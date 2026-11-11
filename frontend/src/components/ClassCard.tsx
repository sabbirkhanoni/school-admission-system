import React from 'react';
import { Lock, CheckCircle, Sparkles, Send, Armchair } from 'lucide-react';
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

  // Determine how many seat preview nodes to render (max 60 for clean 5-row x 12-col card UI)
  const maxPreviewSeats = Math.min(cls.totalSeats, 60);
  const ratio = cls.totalSeats > 0 ? maxPreviewSeats / cls.totalSeats : 1;

  // Calculate scaled seat indicators for visual matrix
  const previewConfirmed = Math.round(cls.confirmedSeats * ratio);
  const previewHeld = Math.round(cls.heldSeats * ratio);

  const previewSeats = Array.from({ length: maxPreviewSeats }, (_, index) => {
    let type: 'confirmed' | 'held' | 'available' = 'available';
    if (index < previewConfirmed) {
      type = 'confirmed';
    } else if (index < previewConfirmed + previewHeld) {
      type = 'held';
    }
    return {
      seatNumber: index + 1,
      type,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Class Name & Availability Badge */}
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

        {/* 1. Segmented Progress Bar */}
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

        {/* 2. Interactive Mini Seat Grid (Visual Hall / Classroom Preview) */}
        <div className="mb-5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Armchair className="w-3.5 h-3.5 text-indigo-600" />
              <span>Live Seat Matrix</span>
            </div>
            {cls.totalSeats > maxPreviewSeats && (
              <span className="text-[10px] text-slate-400 font-medium">
                Previewing 60 of {cls.totalSeats} seats
              </span>
            )}
          </div>

          {/* Seat Icons Grid (5 rows x 12 cols = 60 seats) */}
          <div className="grid grid-cols-10 sm:grid-cols-12 gap-1.5 justify-center py-1">
            {previewSeats.map((seat) => (
              <div
                key={seat.seatNumber}
                className={`relative group w-4 h-4 rounded-sm flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                  seat.type === 'confirmed'
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-200'
                    : seat.type === 'held'
                    ? 'bg-amber-400 animate-pulse shadow-sm shadow-amber-200'
                    : 'bg-white border border-slate-300 hover:border-indigo-400'
                }`}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-20 pointer-events-none whitespace-nowrap">
                  <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-lg">
                    Seat #{seat.seatNumber}:{' '}
                    <span className="capitalize font-bold">
                      {seat.type === 'confirmed'
                        ? 'Confirmed'
                        : seat.type === 'held'
                        ? 'Held (In Progress)'
                        : 'Available'}
                    </span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-0.5" />
                </div>
              </div>
            ))}
          </div>

          {/* Seat Grid Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2.5 mt-2 border-t border-slate-200/60 text-[11px] font-medium text-slate-600">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-sm" />
              <span>Confirmed ({cls.confirmedSeats})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block animate-pulse shadow-sm" />
              <span>Held ({cls.heldSeats})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-white border border-slate-300 inline-block" />
              <span>Available ({cls.availableSeats})</span>
            </div>
          </div>
        </div>

        {/* 3. Detailed Seat Metrics Card */}
        <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-gray-50 border border-gray-100 mb-6">
          <div>
            <div className="text-[11px] text-gray-500 font-medium">Total</div>
            <div className="text-base font-bold text-gray-800 font-mono mt-0.5">{cls.totalSeats}</div>
          </div>
          <div>
            <div className="text-[11px] text-amber-600 font-medium flex items-center justify-center gap-0.5">
              <Lock className="w-3 h-3" />
              <span>Held</span>
            </div>
            <div className="text-base font-bold text-amber-700 font-mono mt-0.5">{cls.heldSeats}</div>
          </div>
          <div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center justify-center gap-0.5">
              <CheckCircle className="w-3 h-3" />
              <span>Confirmed</span>
            </div>
            <div className="text-base font-bold text-emerald-700 font-mono mt-0.5">{cls.confirmedSeats}</div>
          </div>
          <div>
            <div className="text-[11px] text-indigo-600 font-medium flex items-center justify-center gap-0.5">
              <Sparkles className="w-3 h-3" />
              <span>Available</span>
            </div>
            <div className="text-base font-bold text-indigo-700 font-mono mt-0.5">{cls.availableSeats}</div>
          </div>
        </div>
      </div>

      {/* 4. Apply Button */}
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
