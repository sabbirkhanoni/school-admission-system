import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ClassCard } from './components/ClassCard';
import { ClassCardSkeleton } from './components/ClassCardSkeleton';
import { HoldCard } from './components/HoldCard';
import { CreateClassModal } from './components/CreateClassModal';
import { MyApplicationsModal } from './components/MyApplicationsModal';
import { AlertBanner } from './components/AlertBanner';
import { api } from './api';
import { SchoolClass, StudentHold } from './types';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [studentId, setStudentId] = useState<string>(() => {
    return localStorage.getItem('school_student_id') || '20152691234567890';
  });

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [myHolds, setMyHolds] = useState<StudentHold[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const [isCreateClassOpen, setIsCreateClassOpen] = useState<boolean>(false);
  const [isMyAppsOpen, setIsMyAppsOpen] = useState<boolean>(false);

  const isValidStudentId = studentId.length === 17 && /^\d+$/.test(studentId);

  // Sync Student ID to LocalStorage
  const handleStudentIdChange = (newId: string) => {
    setStudentId(newId);
    localStorage.setItem('school_student_id', newId);
  };

  const showAlert = (message: string, type: 'error' | 'success' = 'error') => {
    setAlert({ message, type });
  };

  // Fetch classes list
  const fetchClasses = useCallback(async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (err: any) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch student holds
  const fetchMyHolds = useCallback(async () => {
    if (!isValidStudentId) {
      setMyHolds([]);
      return;
    }
    try {
      const data = await api.getMyHolds(studentId);
      setMyHolds(data);
    } catch (err: any) {
      console.error('Failed to fetch student holds:', err);
    }
  }, [studentId, isValidStudentId]);

  // Initial load
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchMyHolds();
  }, [fetchMyHolds]);

  // Periodic polling for real-time seat counts every 3 seconds without page reload
  useEffect(() => {
    const interval = setInterval(() => {
      fetchClasses();
      fetchMyHolds();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchClasses, fetchMyHolds]);

  // Handle Seat Hold Application
  const handleApply = async (classId: string) => {
    if (!isValidStudentId) {
      showAlert('Please enter a valid 17-digit Student Birth Registration Number.');
      return;
    }

    try {
      setIsApplying(true);
      await api.createHold(classId, studentId);
      showAlert('Seat held successfully! Please pay the admission fee before time expires.', 'success');
      await Promise.all([fetchClasses(), fetchMyHolds()]);
    } catch (err: any) {
      showAlert(err.message || 'Failed to apply for seat.');
    } finally {
      setIsApplying(false);
    }
  };

  // Handle Payment Confirmation
  const handleConfirm = async (holdId: string) => {
    try {
      await api.confirmHold(holdId, studentId);
      showAlert('Admission fee payment successful! Admission confirmed.', 'success');
      await Promise.all([fetchClasses(), fetchMyHolds()]);
    } catch (err: any) {
      showAlert(err.message || 'Payment confirmation failed.');
    }
  };

  // Handle Hold Cancellation
  const handleCancel = async (holdId: string) => {
    try {
      await api.cancelHold(holdId, studentId);
      showAlert('Application cancelled successfully.', 'success');
      await Promise.all([fetchClasses(), fetchMyHolds()]);
    } catch (err: any) {
      showAlert(err.message || 'Failed to cancel hold.');
    }
  };

  // Handle Admin Class Creation
  const handleCreateClass = async (name: string, totalSeats: number) => {
    await api.createClass(name, totalSeats);
    showAlert(`Class "${name}" created with ${totalSeats} seats.`, 'success');
    await fetchClasses();
  };

  // Find most recent active hold for top highlight banner
  const activeHold = myHolds.find((h) => h.status === 'HELD');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Global Navigation Header */}
      <Header
        studentId={studentId}
        onStudentIdChange={handleStudentIdChange}
        onOpenCreateClass={() => setIsCreateClassOpen(true)}
        onOpenMyApplications={() => setIsMyAppsOpen(true)}
        myHoldsCount={myHolds.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Active Application Live Banner */}
        {activeHold && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold mb-3">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>You have an active seat hold in progress</span>
            </div>
            <HoldCard
              hold={activeHold}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Student ID Warning if not valid */}
        {!isValidStudentId && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3 text-indigo-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-indigo-600" />
            <span>
              Please enter a <strong>17-digit Birth Registration Number</strong> in the box above to apply for available seats.
            </span>
          </div>
        )}

        {/* Classes Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Available Classes & Shifts</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Live seat availability updates automatically every few seconds.
            </p>
          </div>

          <button
            onClick={() => {
              fetchClasses();
              fetchMyHolds();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold shadow-2xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Now</span>
          </button>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <ClassCardSkeleton key={index} />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <p className="text-base font-semibold text-gray-800">No classes found</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Get started by clicking the "Create Class" button above.
            </p>
            <button
              onClick={() => setIsCreateClassOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700"
            >
              Create First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => {
              const hasActiveHold = myHolds.some(
                (h) => h.classId === cls.id && (h.status === 'HELD' || h.status === 'CONFIRMED')
              );

              return (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  hasActiveHoldInThisClass={hasActiveHold}
                  isValidStudentId={isValidStudentId}
                  onApply={handleApply}
                  isApplying={isApplying}
                />
              );
            })}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        School Admission System
      </footer>

      {/* Modals */}
      <CreateClassModal
        isOpen={isCreateClassOpen}
        onClose={() => setIsCreateClassOpen(false)}
        onSubmit={handleCreateClass}
      />

      <MyApplicationsModal
        isOpen={isMyAppsOpen}
        onClose={() => setIsMyAppsOpen(false)}
        holds={myHolds}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

