import React from 'react';
import { School, User, PlusCircle, History, Check } from 'lucide-react';

interface HeaderProps {
  studentId: string;
  onStudentIdChange: (val: string) => void;
  onOpenCreateClass: () => void;
  onOpenMyApplications: () => void;
  myHoldsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  studentId,
  onStudentIdChange,
  onOpenCreateClass,
  onOpenMyApplications,
  myHoldsCount,
}) => {
  const isValidLength = studentId.length === 17 && /^\d+$/.test(studentId);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-indigo-100 shadow-md">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                School Admission System
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Online Seat Allocation • First-Come First-Served
              </p>
            </div>
          </div>

          {/* Student ID & Action Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Student ID Input Box */}
            <div className="relative flex-1 sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={studentId}
                onChange={(e) => onStudentIdChange(e.target.value)}
                placeholder="Student ID (17-digit Birth Reg No)"
                maxLength={17}
                className={`w-full pl-9 pr-8 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all font-mono ${
                  isValidLength
                    ? 'border-emerald-300 focus:ring-emerald-200 bg-emerald-50/20 text-gray-900'
                    : 'border-gray-300 focus:ring-indigo-100 focus:border-indigo-500'
                }`}
              />
              {isValidLength && (
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-emerald-600">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* My Applications Button */}
            <button
              onClick={onOpenMyApplications}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <History className="w-4 h-4 text-gray-500" />
              <span>My Applications</span>
              {myHoldsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-indigo-600 text-white">
                  {myHoldsCount}
                </span>
              )}
            </button>

            {/* Add Class Button (Admin) */}
            <button
              onClick={onOpenCreateClass}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Class</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

