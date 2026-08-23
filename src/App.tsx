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
import { LoginScreen } from './components/LoginScreen';
import { usePeriodNotifier } from './hooks/usePeriodNotifier';
import { School } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    user,
    authLoading,
    activeTab,
    isAuthModalOpen,
    setIsAuthModalOpen,
    timetable,
    classes,
    settings,
    showToast,
  } = useApp();

  // Run periodic class bell and notification checker
  usePeriodNotifier(timetable, classes, settings, showToast);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/30 animate-pulse">
          <School className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span>جاري التحقق من الحساب عبر Firebase...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    );
  }

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
