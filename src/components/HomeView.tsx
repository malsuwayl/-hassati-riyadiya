import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';

export const HomeView: React.FC = () => {
  const {
    settings,
    selectedDate,
    classes,
    timetable,
    setSelectedClassId,
    setActiveTab,
    triggerHaptic,
  } = useApp();

  const todayDateObj = new Date(selectedDate);
  const dayIndex = todayDateObj.getDay();

  const formattedHijri = todayDateObj.toLocaleDateString('ar-SA-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedGregorian = todayDateObj.toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Today's timetable entries
  const todayEntries = timetable
    .filter((t) => t.dayOfWeek === dayIndex)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  const currentEntry = todayEntries.length > 0 ? todayEntries[0] : null;
  const currentClass = currentEntry
    ? classes.find((c) => c.id === currentEntry.classId)
    : classes[0];

  const currentLessonName = currentEntry
    ? `الحصة ${currentEntry.periodNumber}`
    : 'الحصة الأولى';

  const currentClassName = currentClass ? currentClass.name : 'لم يحدد الفصل';

  const handleStartAttendance = () => {
    triggerHaptic(50);
    if (currentClass) {
      setSelectedClassId(currentClass.id);
    }
    setActiveTab('attendance');
  };

  const navRows: {
    tab: ActiveTab;
    title: string;
    badge: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }[] = [
    {
      tab: 'attendance',
      title: 'التحضير اليومي والغياب',
      badge: '📋',
      bgColor: 'bg-emerald-50/80 hover:bg-emerald-100/90',
      textColor: 'text-emerald-950',
      borderColor: 'border-emerald-200/80',
    },
    {
      tab: 'grades',
      title: 'رصد الدرجات والاختبارات',
      badge: '📝',
      bgColor: 'bg-amber-50/80 hover:bg-amber-100/90',
      textColor: 'text-amber-950',
      borderColor: 'border-amber-200/80',
    },
    {
      tab: 'measurements',
      title: 'القياسات والبدنية (BMI)',
      badge: '🏃‍♂️',
      bgColor: 'bg-sky-50/80 hover:bg-sky-100/90',
      textColor: 'text-sky-950',
      borderColor: 'border-sky-200/80',
    },
    {
      tab: 'incentives',
      title: 'بنك التحفيز والمخالفات',
      badge: '⭐',
      bgColor: 'bg-indigo-50/80 hover:bg-indigo-100/90',
      textColor: 'text-indigo-950',
      borderColor: 'border-indigo-200/80',
    },
    {
      tab: 'students',
      title: 'الفصول وقائمة الطلاب',
      badge: '👥',
      bgColor: 'bg-purple-50/80 hover:bg-purple-100/90',
      textColor: 'text-purple-950',
      borderColor: 'border-purple-200/80',
    },
    {
      tab: 'settings',
      title: 'التقارير الشاملة والإعدادات',
      badge: '⚙️',
      bgColor: 'bg-slate-100/80 hover:bg-slate-200/80',
      textColor: 'text-slate-950',
      borderColor: 'border-slate-300/80',
    },
  ];

  return (
    <div className="max-w-md mx-auto px-2 py-4 font-sans space-y-4">
      {/* Top Header Information Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs text-right space-y-3">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {settings.schoolName || 'مدرسة التربية البدنية'}
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              {settings.teacherName || 'معلم المادة'}
            </p>
          </div>
          <div className="text-left">
            <span className="text-xs font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100 block">
              {formattedHijri}
            </span>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
              {formattedGregorian}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1 text-right">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-extrabold text-slate-400 block">الحصة الحالية</span>
            <span className="text-sm font-black text-slate-900">{currentLessonName}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-extrabold text-slate-400 block">الفصل المستهدف</span>
            <span className="text-sm font-black text-indigo-700">{currentClassName}</span>
          </div>
        </div>

        {/* Large Primary Action Button */}
        <button
          type="button"
          onClick={handleStartAttendance}
          className="w-full mt-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
        >
          <span>ابدأ تحضير الحصة الآن ⏱️</span>
        </button>
      </div>

      {/* Main Navigation Rows */}
      <div className="space-y-2.5">
        {navRows.map((row) => (
          <button
            key={row.tab}
            type="button"
            onClick={() => {
              triggerHaptic(20);
              setActiveTab(row.tab);
            }}
            className={`w-full p-4 rounded-xl border ${row.borderColor} ${row.bgColor} flex items-center justify-between text-right transition-all shadow-2xs active:scale-[0.98] cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{row.badge}</span>
              <span className={`text-sm sm:text-base font-black ${row.textColor}`}>{row.title}</span>
            </div>
            <span className="text-xs font-black text-slate-600 bg-white/90 border border-slate-200/80 px-3 py-1 rounded-lg shadow-2xs">
              فتح
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};


