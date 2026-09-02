import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import {
  Home,
  CheckCheck,
  Award,
  Activity,
  Users,
  Settings,
  Sparkles,
  BarChart2,
  CloudCheck,
  UserCheck,
  LogIn,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { settings, selectedDate, activeTab, setActiveTab, user, setIsAuthModalOpen } = useApp();

  const formattedDate = new Date(selectedDate).toLocaleDateString('ar-SA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 pt-safe pb-3 font-sans shadow-2xs">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / School Info */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none active:scale-98 transition-transform min-w-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs border border-indigo-500/20">
            بدنية
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">
              {settings.schoolName || 'مدرسة التربية البدنية'}
            </h1>
            <p className="text-[11px] font-bold text-slate-500 truncate">
              {settings.teacherName || 'معلم المادة'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-black text-slate-700 bg-slate-100/80 border border-slate-200/80 px-2.5 py-1.5 rounded-xl hidden md:inline-block">
            {formattedDate}
          </span>

          {/* Cloud Sync Account Button */}
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className={`h-9 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-extrabold text-xs active:scale-95 ${
              user
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 shadow-2xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80'
            }`}
            title={user ? `حساب سحابي: ${user.email}` : 'تسجيل الدخول وحفظ البيانات على حسابك السحابي'}
          >
            {user ? (
              <>
                <CloudCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-black text-emerald-900">حسابي ☁️</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-[11px] font-black text-indigo-900">حفظ سحابي ☁️</span>
              </>
            )}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`h-9 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold text-xs active:scale-95 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/30'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80'
            }`}
            title="الإعدادات والبيانات"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="text-xs font-black hidden sm:inline">الإعدادات</span>
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
      icon: <Home className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      id: 'attendance',
      label: 'التحضير',
      icon: <CheckCheck className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      id: 'grades',
      label: 'الدرجات',
      icon: <Award className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      id: 'measurements',
      label: 'القياسات',
      icon: <Activity className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      id: 'incentives',
      label: 'التحفيز',
      icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />,
    },
    {
      id: 'students',
      label: 'الطلاب',
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      id: 'statistics',
      label: 'التقارير',
      icon: <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe font-sans shadow-lg">
      <div className="max-w-2xl mx-auto grid grid-cols-7 px-1 py-2">
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
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-indigo-700 font-black bg-indigo-50 shadow-xs border-2 border-indigo-300 scale-105'
                  : 'text-slate-500 hover:text-slate-900 font-bold'
              }`}
            >
              {item.icon}
              <span className="text-[10px] sm:text-xs mt-1 leading-none font-black truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};


