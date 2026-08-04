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

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 pb-20 font-sans">
      <Header />

      <main className="max-w-4xl mx-auto px-2 pt-2">
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
