import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header, BottomNav } from './components/Navbar';
import { Toast } from './components/Toast';
import { DashboardView } from './components/DashboardView';
import { ClassesView } from './components/ClassesView';
import { StudentsView } from './components/StudentsView';
import { AttendanceView } from './components/AttendanceView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PhysicalMeasurementsView } from './components/PhysicalMeasurementsView';
import { OnboardingModal } from './components/OnboardingModal';
import { FloatingActionButton } from './components/FloatingActionButton';

const MainContent: React.FC = () => {
  const { activeTab, onboardingCompleted } = useApp();

  return (
    <div className="min-h-screen bg-emerald-900/5 text-zinc-900">
      {!onboardingCompleted && <OnboardingModal />}
      
      <Header />

      <main className="max-w-md mx-auto px-3 pt-4">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'attendance' && <AttendanceView />}
        {activeTab === 'measurements' && <PhysicalMeasurementsView />}
        {activeTab === 'classes' && <ClassesView />}
        {activeTab === 'students' && <StudentsView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      <FloatingActionButton />
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
