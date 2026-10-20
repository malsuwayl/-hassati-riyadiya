import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab, PeriodTimeConfig, TimetableEntry } from '../types';
import { DEFAULT_PERIOD_TIMES } from '../data/initialData';
import {
  Calendar,
  Clock,
  ArrowLeft,
  CalendarDays,
  Settings,
  Bell,
  ShieldCheck,
  LogIn,
  CloudCheck,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  ListFilter,
  Table as TableIcon,
  CheckCircle,
} from 'lucide-react';
import { triggerFullPeriodAlert } from '../utils/notificationSound';
import { ImportTimetableModal } from './ImportTimetableModal';
import { ScheduleManagerModal } from './ScheduleManagerModal';

const DAYS_OF_WEEK = [
  { index: 0, name: 'الأحد', shortName: 'أحد' },
  { index: 1, name: 'الإثنين', shortName: 'إثنين' },
  { index: 2, name: 'الثلاثاء', shortName: 'ثلاثاء' },
  { index: 3, name: 'الأربعاء', shortName: 'أربعاء' },
  { index: 4, name: 'الخميس', shortName: 'خميس' },
];

function findCurrentOrNextPeriodIndex(
  entries: TimetableEntry[],
  periodTimes: PeriodTimeConfig[]
): number {
  if (!entries || entries.length === 0) return -1;
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // 1. Is there an active ongoing period right now?
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const pConfig = periodTimes.find((p) => p.periodNumber === entry.periodNumber);
    if (pConfig && pConfig.startTime && pConfig.endTime) {
      const [sh, sm] = pConfig.startTime.split(':').map((v) => parseInt(v, 10) || 0);
      const [eh, em] = pConfig.endTime.split(':').map((v) => parseInt(v, 10) || 0);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      if (currentMin >= startMin && currentMin <= endMin) {
        return i;
      }
    }
  }

  // 2. Otherwise find next upcoming period today
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const pConfig = periodTimes.find((p) => p.periodNumber === entry.periodNumber);
    if (pConfig && pConfig.startTime) {
      const [sh, sm] = pConfig.startTime.split(':').map((v) => parseInt(v, 10) || 0);
      const startMin = sh * 60 + sm;
      if (currentMin < startMin) {
        return i;
      }
    }
  }

  // 3. Otherwise default to first scheduled period
  return 0;
}

export const HomeView: React.FC = () => {
  const {
    settings,
    selectedDate,
    classes,
    students,
    timetable,
    setSelectedClassId,
    setActiveTab,
    triggerHaptic,
    user,
    setIsAuthModalOpen,
    clearTimetable,
    showToast,
  } = useApp();

  const [timetableTab, setTimetableTab] = useState<'day' | 'week'>('day');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const currentDay = new Date().getDay();
    // Default to today if it's Sun-Thu, otherwise default to Sunday (0)
    return currentDay >= 0 && currentDay <= 4 ? currentDay : 0;
  });
  const [isImportTimetableModalOpen, setIsImportTimetableModalOpen] = useState(false);
  const [isScheduleManagerOpen, setIsScheduleManagerOpen] = useState(false);

  const todayDateObj = new Date(selectedDate);
  const actualTodayDayIndex = todayDateObj.getDay();

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

  const periodTimes: PeriodTimeConfig[] =
    settings.periodTimes && settings.periodTimes.length > 0
      ? settings.periodTimes
      : DEFAULT_PERIOD_TIMES;

  // Helper to reliably resolve a class from an entry
  const resolveClassForEntry = (entry: TimetableEntry | null) => {
    if (!entry || !entry.classId) return null;
    const byId = classes.find((c) => c.id === entry.classId);
    if (byId) return byId;
    const byName = classes.find(
      (c) => c.name.trim().toLowerCase() === entry.classId.trim().toLowerCase()
    );
    if (byName) return byName;
    return { id: entry.classId, name: entry.classId };
  };

  // Selected Day timetable entries (strictly actual scheduled periods with a class)
  const dayEntries = timetable
    .filter((t) => t.dayOfWeek === selectedDayIndex && t.classId && t.classId.trim() !== '')
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // Check if a period entry is currently ongoing right now (only if selected day is actual today)
  const isPeriodOngoing = (periodNumber: number) => {
    if (selectedDayIndex !== actualTodayDayIndex) return false;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const pConfig = periodTimes.find((p) => p.periodNumber === periodNumber);
    if (!pConfig?.startTime || !pConfig?.endTime) return false;
    const [sh, sm] = pConfig.startTime.split(':').map((v) => parseInt(v, 10) || 0);
    const [eh, em] = pConfig.endTime.split(':').map((v) => parseInt(v, 10) || 0);
    return currentMin >= sh * 60 + sm && currentMin <= eh * 60 + em;
  };

  const handleStartAttendanceForClass = (classId: string) => {
    triggerHaptic(50);
    setSelectedClassId(classId);
    setActiveTab('attendance');
  };

  const selectedDayInfo = DAYS_OF_WEEK.find((d) => d.index === selectedDayIndex) || DAYS_OF_WEEK[0];

  const totalPeriodsInWeek = timetable.filter((t) => t.classId && t.classId.trim() !== '').length;

  // Today's scheduled entries to determine ongoing/next period
  const todayScheduledEntries = timetable
    .filter((t) => t.dayOfWeek === actualTodayDayIndex && t.classId && t.classId.trim() !== '')
    .sort((a, b) => a.periodNumber - b.periodNumber);

  const ongoingOrNextIdx = findCurrentOrNextPeriodIndex(todayScheduledEntries, periodTimes);
  const activePeriodEntry = ongoingOrNextIdx >= 0 ? todayScheduledEntries[ongoingOrNextIdx] : null;
  const activePeriodClass = activePeriodEntry ? resolveClassForEntry(activePeriodEntry) : null;
  const isCurrentPeriodOngoing = activePeriodEntry ? isPeriodOngoing(activePeriodEntry.periodNumber) : false;
  const activePeriodConfig = activePeriodEntry
    ? periodTimes.find((p) => p.periodNumber === activePeriodEntry.periodNumber)
    : null;

  return (
    <div className="space-y-4 font-sans pb-6">
      {/* 1. Welcome & Instant Ongoing Class Hero Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
        {/* Top Greeting & Date Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-slate-900">
                مرحباً، {settings.teacherName || 'أستاذ المادة'} 👋
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              {settings.schoolName || 'مدرسة التربية البدنية'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-indigo-50 text-indigo-900 border border-indigo-100 px-3 py-1.5 rounded-xl font-black">
              {formattedHijri}
            </span>
            <span className="text-slate-400 font-bold hidden sm:inline">
              ({formattedGregorian})
            </span>
          </div>
        </div>

        {/* Highlight: Ongoing or Next Class Hero */}
        {activePeriodEntry && activePeriodClass ? (
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isCurrentPeriodOngoing
                ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-emerald-300 shadow-xs'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-xs ${
                  isCurrentPeriodOngoing
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {activePeriodEntry.periodNumber}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-500">
                    {isCurrentPeriodOngoing ? 'الحصة الجارية الآن 🟢' : 'الحصة القادمة اليوم ⏳'}
                  </span>
                  {activePeriodConfig?.startTime && activePeriodConfig?.endTime && (
                    <span className="text-[11px] font-bold text-slate-400" dir="ltr">
                      {activePeriodConfig.startTime} - {activePeriodConfig.endTime}
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                  {activePeriodClass.name}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleStartAttendanceForClass(activePeriodClass.id)}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>تحضير {activePeriodClass.name} الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>لا توجد حصص متبقية اليوم في جدولك الدراسي.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsScheduleManagerOpen(true)}
              className="text-indigo-600 hover:underline font-black cursor-pointer text-xs"
            >
              عرض الجدول 📅
            </button>
          </div>
        )}
      </div>

      {/* 2. Quick Actions 4-Grid (الوصول السريع) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Quick Action 1: Attendance */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(20);
            setActiveTab('attendance');
          }}
          className="bg-white hover:bg-emerald-50/40 p-4 rounded-2xl border border-slate-200/90 text-right transition-all cursor-pointer shadow-2xs hover:border-emerald-300 hover:shadow-xs active:scale-98 group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              📋
            </div>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
              يومي
            </span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-900">
              التحضير والغياب
            </h4>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              تحضير سريع وكشف الزي
            </p>
          </div>
        </button>

        {/* Quick Action 2: Grades */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(20);
            setActiveTab('grades');
          }}
          className="bg-white hover:bg-amber-50/40 p-4 rounded-2xl border border-slate-200/90 text-right transition-all cursor-pointer shadow-2xs hover:border-amber-300 hover:shadow-xs active:scale-98 group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              📝
            </div>
            <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
              تقييم
            </span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-amber-900">
              رصد الدرجات
            </h4>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              مهارات واختبارات دورية
            </p>
          </div>
        </button>

        {/* Quick Action 3: Students */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(20);
            setActiveTab('students');
          }}
          className="bg-white hover:bg-purple-50/40 p-4 rounded-2xl border border-slate-200/90 text-right transition-all cursor-pointer shadow-2xs hover:border-purple-300 hover:shadow-xs active:scale-98 group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              👥
            </div>
            <span className="text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg">
              {students.length} طالب
            </span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-purple-900">
              الطلاب والفصول
            </h4>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              السجلات والحالات الصحية
            </p>
          </div>
        </button>

        {/* Quick Action 4: Reports */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(20);
            setActiveTab('settings');
          }}
          className="bg-white hover:bg-indigo-50/40 p-4 rounded-2xl border border-slate-200/90 text-right transition-all cursor-pointer shadow-2xs hover:border-indigo-300 hover:shadow-xs active:scale-98 group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              📊
            </div>
            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
              طباعة PDF
            </span>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-900">
              التقارير والكشوفات
            </h4>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              تصدير رسمي وكشف الغياب
            </p>
          </div>
        </button>
      </div>

      {/* 3. Schedule & Timetable Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                جدول الحصص الأسبوعي ({totalPeriodsInWeek} حصة)
              </h3>
              <p className="text-[11px] font-bold text-slate-400">
                مواعيد وتوزيع الحصص على مدار الأسبوع
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Timetable View Switch */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-black">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setTimetableTab('day');
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  timetableTab === 'day'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setTimetableTab('week');
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  timetableTab === 'week'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                الأسبوع
              </button>
            </div>

            {/* Quick Schedule Manager Trigger */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setIsScheduleManagerOpen(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
              title="إضافة وتعديل جدول الحصص بسهولة"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تعديل الجدول 📅</span>
            </button>
          </div>
        </div>

        {/* Day View Mode */}
        {timetableTab === 'day' ? (
          <div className="space-y-3">
            {/* Days Tabs Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {DAYS_OF_WEEK.map((d) => {
                const countForDay = timetable.filter(
                  (t) => t.dayOfWeek === d.index && t.classId && t.classId.trim() !== ''
                ).length;
                const isSelected = selectedDayIndex === d.index;
                const isActualToday = actualTodayDayIndex === d.index;

                return (
                  <button
                    key={d.index}
                    type="button"
                    onClick={() => {
                      triggerHaptic(20);
                      setSelectedDayIndex(d.index);
                    }}
                    className={`shrink-0 px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{d.name}</span>
                    {isActualToday && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                          isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        اليوم
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold ${
                        isSelected ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      ({countForDay})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Day Period List */}
            {dayEntries.length > 0 ? (
              <div className="space-y-2">
                {dayEntries.map((entry) => {
                  const entryClass = resolveClassForEntry(entry);
                  const pConfig = periodTimes.find((p) => p.periodNumber === entry.periodNumber);
                  const isOngoing = isPeriodOngoing(entry.periodNumber);
                  const stCount = entryClass
                    ? students.filter((s) => s.classId === entryClass.id).length
                    : 0;

                  return (
                    <div
                      key={entry.id}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isOngoing
                          ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                          : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200/90'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                            isOngoing
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {entry.periodNumber}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs sm:text-sm text-slate-900 truncate">
                              {entryClass ? entryClass.name : `الحصة ${entry.periodNumber}`}
                            </span>
                            {isOngoing && (
                              <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                جارية الآن
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold mt-0.5">
                            {pConfig?.startTime && pConfig?.endTime && (
                              <span className="text-indigo-900 font-black" dir="ltr">
                                {pConfig.startTime} - {pConfig.endTime}
                              </span>
                            )}
                            <span>•</span>
                            <span>{stCount} طالب</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (entryClass) handleStartAttendanceForClass(entryClass.id);
                        }}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 ${
                          isOngoing
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <span>تحضير</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-200/60 flex items-center justify-center mx-auto text-slate-400">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">
                    لا توجد حصص مجدولة ليوم {selectedDayInfo.name}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    جدولك خالٍ في هذا اليوم. يمكنك إضافة الحصص بسهولة.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsScheduleManagerOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة حصص 📅</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsImportTimetableModalOpen(true)}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border border-emerald-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>استيراد صورة الجدول 📸</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Week Matrix View */
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {DAYS_OF_WEEK.map((day) => {
                const dayItems = timetable
                  .filter((t) => t.dayOfWeek === day.index && t.classId && t.classId.trim() !== '')
                  .sort((a, b) => a.periodNumber - b.periodNumber);
                const isToday = actualTodayDayIndex === day.index;

                return (
                  <div
                    key={day.index}
                    className={`p-3 rounded-xl border text-xs text-right space-y-2 ${
                      isToday
                        ? 'bg-indigo-50/70 border-indigo-200'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-1.5">
                      <div className="flex items-center gap-1.5 font-black text-slate-800">
                        <span>{day.name}</span>
                        {isToday && (
                          <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
                            اليوم
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayItems.length === 0 ? 'لا توجد حصص' : `${dayItems.length} حصص`}
                      </span>
                    </div>

                    {dayItems.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {dayItems.map((entry) => {
                          const entryClass = resolveClassForEntry(entry);
                          return (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => {
                                if (entryClass) handleStartAttendanceForClass(entryClass.id);
                              }}
                              className="bg-white hover:bg-indigo-50 text-slate-800 hover:text-indigo-900 border border-slate-200 px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="انقر لبدء التحضير"
                            >
                              <span className="bg-indigo-600 text-white text-[9px] w-4 h-4 rounded flex items-center justify-center font-black">
                                {entry.periodNumber}
                              </span>
                              <span>{entryClass ? entryClass.name : `الحصة ${entry.periodNumber}`}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic block py-1">يوم خالٍ من الحصص</span>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPeriodsInWeek > 0 && (
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل تريد مسح وتفريغ جدول الحصص بالكامل؟')) {
                      clearTimetable();
                      showToast('تم إفراغ جدول الحصص بنجاح', 'info');
                    }
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إفراغ الجدول بالكامل</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Modals */}
      <ScheduleManagerModal
        isOpen={isScheduleManagerOpen}
        onClose={() => setIsScheduleManagerOpen(false)}
        onOpenImageImport={() => setIsImportTimetableModalOpen(true)}
      />

      <ImportTimetableModal
        isOpen={isImportTimetableModalOpen}
        onClose={() => setIsImportTimetableModalOpen(false)}
      />
    </div>
  );
};
