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
      title: 'التحضير',
      badge: '🟩',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100/80',
      textColor: 'text-emerald-950',
      borderColor: 'border-emerald-200',
    },
    {
      tab: 'grades',
      title: 'الدرجات',
      badge: '🟨',
      bgColor: 'bg-amber-50 hover:bg-amber-100/80',
      textColor: 'text-amber-950',
      borderColor: 'border-amber-200',
    },
    {
      tab: 'measurements',
      title: 'القياسات',
      badge: '🟦',
      bgColor: 'bg-sky-50 hover:bg-sky-100/80',
      textColor: 'text-sky-950',
      borderColor: 'border-sky-200',
    },
    {
      tab: 'students',
      title: 'الفصول والطلاب',
      badge: '👥',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100/80',
      textColor: 'text-indigo-950',
      borderColor: 'border-indigo-200',
    },
    {
      tab: 'statistics',
      title: 'الإحصائيات',
      badge: '📊',
      bgColor: 'bg-zinc-50 hover:bg-zinc-100',
      textColor: 'text-zinc-950',
      borderColor: 'border-zinc-200',
    },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-5 font-sans space-y-5">
      {/* Top Header Information Card */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-200 text-right space-y-3">
        <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-zinc-900">
              {settings.schoolName || 'مدرسة التربية البدنية'}
            </h2>
            <p className="text-xs font-bold text-zinc-500 mt-0.5">
              {settings.teacherName || 'معلم المادة'}
            </p>
          </div>
          <div className="text-left">
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 block">
              {formattedHijri}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 block mt-0.5">
              {formattedGregorian}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 text-right">
          <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
            <span className="text-[10px] font-extrabold text-zinc-400 block">الحصة الحالية</span>
            <span className="text-sm font-black text-zinc-900">{currentLessonName}</span>
          </div>
          <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
            <span className="text-[10px] font-extrabold text-zinc-400 block">الفصل المستهدف</span>
            <span className="text-sm font-black text-emerald-700">{currentClassName}</span>
          </div>
        </div>

        {/* Large Primary Action Button */}
        <button
          type="button"
          onClick={handleStartAttendance}
          className="w-full mt-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
        >
          <span>ابدأ التحضير</span>
        </button>
      </div>

      {/* 4 Main Navigation Rows */}
      <div className="space-y-2.5">
        {navRows.map((row) => (
          <button
            key={row.tab}
            type="button"
            onClick={() => {
              triggerHaptic(20);
              setActiveTab(row.tab);
            }}
            className={`w-full p-4 rounded-xl border ${row.borderColor} ${row.bgColor} flex items-center justify-between text-right transition-transform active:scale-[0.98] cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{row.badge}</span>
              <span className={`text-base font-black ${row.textColor}`}>{row.title}</span>
            </div>
            <span className="text-xs font-black text-zinc-500 bg-white/80 border border-zinc-200 px-3 py-1 rounded-lg">
              فتح
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

