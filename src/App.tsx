import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header, BottomNav } from './components/Navbar';
import { Toast } from './components/Toast';
import { HomeView } from './components/HomeView';
import { AttendanceView } from './components/AttendanceView';
import { GradesView } from './components/GradesView';
import { MeasurementsView } from './components/MeasurementsView';
import { IncentivesView } from './components/IncentivesView';
import { StatisticsView } from './components/StatisticsView';
import { StudentsView } from './components/StudentsView';
import { SettingsView } from './components/SettingsView';
import { StudentProfileModal } from './components/StudentProfileModal';
import { AuthModal } from './components/AuthModal';
import { FingerprintModal } from './components/FingerprintModal';
import { usePeriodNotifier } from './hooks/usePeriodNotifier';

const MainContent: React.FC = () => {
  const { activeTab, isAuthModalOpen, setIsAuthModalOpen, timetable, classes, settings, showToast } = useApp();

  // Run periodic class bell and notification checker
  usePeriodNotifier(timetable, classes, settings, showToast);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 sm:pb-24 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header />

      <main className="max-w-4xl mx-auto px-3 pt-3">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'attendance' && <AttendanceView />}
        {activeTab === 'grades' && <GradesView />}
        {activeTab === 'measurements' && <MeasurementsView />}
        {activeTab === 'incentives' && <IncentivesView />}
        {activeTab === 'statistics' && <StatisticsView />}
        {activeTab === 'students' && <StudentsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      <StudentProfileModal />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <FingerprintModal />
      <BottomNav />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
