import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import {
  Home,
  CheckCheck,
  Award,
  Activity,
  BarChart2,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { settings, selectedDate, activeTab, setActiveTab } = useApp();

  const formattedDate = new Date(selectedDate).toLocaleDateString('ar-SA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-4 pt-6 sm:pt-4 pb-3 font-sans shadow-xs">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none active:opacity-70 transition-opacity min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
            بدنية
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-black text-zinc-900 leading-tight truncate">
              {settings.schoolName || 'المدرسة'}
            </h1>
            <p className="text-[11px] font-bold text-zinc-500 truncate">{settings.teacherName || 'معلم التربية البدنية'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] sm:text-[11px] font-black text-zinc-700 bg-zinc-100 border border-zinc-200/80 px-3 py-1.5 rounded-xl">
            {formattedDate}
          </span>

          <button
            type="button"
            onClick={() => setActiveTab('incentives')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'incentives'
                ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400/50'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
            title="بنك التحفيز والمخالفات"
          >
            <Sparkles className="w-4.5 h-4.5 text-amber-600" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500/40'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
            title="إدارة الفصول والطلاب"
          >
            <Users className="w-4.5 h-4.5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-zinc-800 text-white'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
            title="الإعدادات والتقارير"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, triggerHaptic } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: <Home className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'attendance',
      label: 'التحضير',
      icon: <CheckCheck className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'grades',
      label: 'الدرجات',
      icon: <Award className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'measurements',
      label: 'القياسات',
      icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'incentives',
      label: 'التحفيز',
      icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />,
    },
    {
      id: 'students',
      label: 'الطلاب',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'statistics',
      label: 'الإحصائيات',
      icon: <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 pb-safe font-sans">
      <div className="max-w-xl mx-auto grid grid-cols-7 px-1 py-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setActiveTab(item.id);
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-emerald-700 font-black bg-emerald-50'
                  : 'text-zinc-500 hover:text-zinc-800 font-bold'
              }`}
            >
              {item.icon}
              <span className="text-[9px] sm:text-[10px] mt-0.5 leading-tight truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

