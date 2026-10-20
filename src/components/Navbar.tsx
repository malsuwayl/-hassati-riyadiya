import React, { useState } from 'react';
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
  LogIn,
  Menu,
  X,
  ChevronLeft,
  Bell,
} from 'lucide-react';
import { triggerFullPeriodAlert } from '../utils/notificationSound';

export const Header: React.FC = () => {
  const { settings, selectedDate, activeTab, setActiveTab, user, setIsAuthModalOpen, triggerHaptic } = useApp();

  const formattedDate = new Date(selectedDate).toLocaleDateString('ar-SA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const desktopNavItems: { id: ActiveTab; label: string }[] = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'attendance', label: 'التحضير' },
    { id: 'grades', label: 'الدرجات' },
    { id: 'students', label: 'الطلاب' },
    { id: 'measurements', label: 'القياسات' },
    { id: 'incentives', label: 'التحفيز' },
    { id: 'statistics', label: 'التقارير' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 pt-safe pb-3 font-sans shadow-2xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / School Info */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none active:scale-98 transition-transform shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs border border-indigo-500/20">
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

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
          {desktopNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setActiveTab(item.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-black text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-xl hidden lg:inline-block">
            {formattedDate}
          </span>

          {/* Bell Quick Alert */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(40);
              triggerFullPeriodAlert(
                '🔔 جرس الحصة الدراسي',
                'تنبيه جرس الحصة الدراسي',
                'start',
                {
                  enableSound: settings.notifications?.enableSound ?? true,
                  enableTTS: settings.notifications?.enableTTS ?? true,
                  enableBrowser: settings.notifications?.enableBrowserNotifications ?? true,
                }
              );
            }}
            className="w-9 h-9 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="قرع جرس الحصة"
          >
            <Bell className="w-4 h-4 text-indigo-600" />
          </button>

          {/* Cloud Sync Account Button */}
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className={`h-9 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-extrabold text-xs active:scale-95 ${
              user
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 shadow-2xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80'
            }`}
            title={user ? `حساب سحابي: ${user.email}` : 'تسجيل الدخول وحفظ البيانات على حسابك السحابي'}
          >
            {user ? (
              <>
                <CloudCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-black text-emerald-900">سحابي ☁️</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-[11px] font-black text-indigo-900">دخول ☁️</span>
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
            title="الإعدادات وجدول الحصص"
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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // 4 Primary Daily Tabs + 1 "More" Menu
  const primaryNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'attendance',
      label: 'التحضير',
      icon: <CheckCheck className="w-5 h-5" />,
    },
    {
      id: 'grades',
      label: 'الدرجات',
      icon: <Award className="w-5 h-5" />,
    },
    {
      id: 'students',
      label: 'الطلاب',
      icon: <Users className="w-5 h-5" />,
    },
  ];

  // Secondary Tools inside "More" Menu
  const moreItems: { id: ActiveTab; label: string; subtitle: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'measurements',
      label: 'القياسات البدنية (BMI)',
      subtitle: 'حساب كتلة الجسم، الطول والوزن ومستوى اللياقة',
      icon: <Activity className="w-5 h-5 text-sky-600" />,
      color: 'bg-sky-50 border-sky-200 text-sky-950',
    },
    {
      id: 'incentives',
      label: 'بنك التحفيز والسلوك',
      subtitle: 'نجوم التميز والمكافآت السلوكية للطلاب',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-50 border-amber-200 text-amber-950',
    },
    {
      id: 'statistics',
      label: 'التقارير والإحصائيات',
      subtitle: 'كشوفات الحضور، نسب الغياب، والرسوم البيانية',
      icon: <BarChart2 className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200 text-purple-950',
    },
    {
      id: 'settings',
      label: 'الإعدادات وجدول الحصص',
      subtitle: 'تعديل جدول الحصص، التنبيهات، والنسخ الاحتياطي',
      icon: <Settings className="w-5 h-5 text-indigo-600" />,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-950',
    },
  ];

  const isMoreActive =
    activeTab === 'measurements' ||
    activeTab === 'incentives' ||
    activeTab === 'statistics' ||
    activeTab === 'settings';

  const currentMoreItem = moreItems.find((m) => m.id === activeTab);

  return (
    <>
      {/* Mobile Bottom Navigation Bar (5 Comfortably Spaced Tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe font-sans shadow-lg md:hidden">
        <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1.5">
          {primaryNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setIsMoreMenuOpen(false);
                  setActiveTab(item.id);
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? 'text-indigo-700 font-black bg-indigo-50 shadow-2xs border border-indigo-200'
                    : 'text-slate-500 hover:text-slate-900 font-bold'
                }`}
              >
                {item.icon}
                <span className="text-[11px] mt-1 leading-none font-black truncate">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 5th Tab: "المزيد" (More) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(20);
              setIsMoreMenuOpen(!isMoreMenuOpen);
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
              isMoreActive || isMoreMenuOpen
                ? 'text-indigo-700 font-black bg-indigo-50 shadow-2xs border border-indigo-200'
                : 'text-slate-500 hover:text-slate-900 font-bold'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[11px] mt-1 leading-none font-black truncate">
              {currentMoreItem ? currentMoreItem.label.split(' ')[0] : 'المزيد'}
            </span>
          </button>
        </div>
      </nav>

      {/* "More" Drawer / Sheet for Secondary Views */}
      {isMoreMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl border-t border-slate-200 p-5 space-y-3.5 shadow-2xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Sheet Grab Handle & Header */}
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto" />
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900">الأقسام والخدمات الإضافية</h3>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Additional Tools */}
            <div className="space-y-2">
              {moreItems.map((item) => {
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(20);
                      setActiveTab(item.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl border transition-all text-right flex items-center justify-between cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-900 block truncate">
                          {item.label}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 block truncate mt-0.5">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};



