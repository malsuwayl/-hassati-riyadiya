import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  CheckCheck,
  GraduationCap,
  Users,
  BarChart3,
  Settings,
  Trophy,
  Activity,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { settings, dailyLogs, selectedDate } = useApp();

  // Quick stat: count how many attended today
  const todayLogs = dailyLogs.filter((l) => l.date === selectedDate);
  const presentCount = todayLogs.filter((l) => l.attendance === 'present').length;

  const formattedDate = new Date(selectedDate).toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-emerald-700 text-white shadow-lg pt-safe">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl shadow-inner">
            ⚽
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none text-white flex items-center gap-1.5">
              حصتي الرياضية
              <span className="inline-block text-[10px] bg-emerald-500/80 px-1.5 py-0.5 rounded-full font-medium text-emerald-950">
                PWA
              </span>
            </h1>
            <p className="text-xs text-emerald-100 font-medium mt-0.5 truncate max-w-[190px]">
              {settings.schoolName || 'مدرسة التربية البدنية'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 bg-emerald-800/80 px-2.5 py-1 rounded-xl border border-emerald-500/30 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="text-emerald-100">{presentCount} محضر</span>
          </div>
          <span className="text-[10px] text-emerald-200 mt-1 font-medium">{formattedDate}</span>
        </div>
      </div>
    </header>
  );
};

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'attendance',
      label: 'التحضير',
      icon: <CheckCheck className="w-5 h-5" />,
    },
    {
      id: 'measurements',
      label: 'القياسات',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      id: 'classes',
      label: 'الفصول',
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      id: 'students',
      label: 'الطلاب',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'reports',
      label: 'التقارير',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="max-w-lg mx-auto px-1 py-1.5 flex items-center justify-between overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all duration-200 min-w-[46px] shrink-0 relative ${
                isActive
                  ? 'text-emerald-700 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-800 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-transparent'
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 leading-none whitespace-nowrap">{item.label}</span>
              {isActive && (
                <span className="absolute -top-1 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
