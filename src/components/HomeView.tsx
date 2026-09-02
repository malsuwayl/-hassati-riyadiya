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

  const navRows: {
    tab: ActiveTab;
    title: string;
    description: string;
    badge: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }[] = [
    {
      tab: 'attendance',
      title: 'التحضير والغياب اليومي',
      description: 'تحضير الطلاب بنقرة واحدة وتصدير الكشوفات',
      badge: '📋',
      bgColor: 'bg-emerald-50/90 hover:bg-emerald-100',
      textColor: 'text-emerald-950',
      borderColor: 'border-emerald-300',
    },
    {
      tab: 'grades',
      title: 'رصد الدرجات والاختبارات',
      description: 'التقييم المستمر والاختبارات المهارية والنظرية',
      badge: '📝',
      bgColor: 'bg-amber-50/90 hover:bg-amber-100',
      textColor: 'text-amber-950',
      borderColor: 'border-amber-300',
    },
    {
      tab: 'measurements',
      title: 'القياسات البدنية (BMI)',
      description: 'كتلة الجسم واللياقة البدنية والنبض',
      badge: '🏃‍♂️',
      bgColor: 'bg-sky-50/90 hover:bg-sky-100',
      textColor: 'text-sky-950',
      borderColor: 'border-sky-300',
    },
    {
      tab: 'incentives',
      title: 'بنك التحفيز والسلوك',
      description: 'نجوم التميز والمكافآت وضبط السلوك',
      badge: '⭐',
      bgColor: 'bg-indigo-50/90 hover:bg-indigo-100',
      textColor: 'text-indigo-950',
      borderColor: 'border-indigo-300',
    },
    {
      tab: 'students',
      title: 'الطلاب والفصول',
      description: 'استيراد الأسماء، الحالات الصحية، والتعديل',
      badge: '👥',
      bgColor: 'bg-purple-50/90 hover:bg-purple-100',
      textColor: 'text-purple-950',
      borderColor: 'border-purple-300',
    },
    {
      tab: 'settings',
      title: 'التقارير الشاملة والإعدادات',
      description: 'طباعة PDF، جدول الحصص، ومواعيد الأجراس',
      badge: '⚙️',
      bgColor: 'bg-slate-100/90 hover:bg-slate-200',
      textColor: 'text-slate-950',
      borderColor: 'border-slate-300',
    },
  ];

  return (
    <div className="max-w-md mx-auto px-2 py-4 font-sans space-y-4">
      {/* Top Header Information Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs text-right space-y-3.5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {settings.schoolName || 'مدرسة التربية البدنية'}
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              {settings.teacherName || 'معلم المادة'}
            </p>
          </div>
          <div className="text-left flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(50);
                  triggerFullPeriodAlert(
                    '🔔 جرس الحصة الدراسي',
                    `تنبيه جرس الحصة الدراسي`,
                    'start',
                    {
                      enableSound: settings.notifications?.enableSound ?? true,
                      enableTTS: settings.notifications?.enableTTS ?? true,
                      enableBrowser: settings.notifications?.enableBrowserNotifications ?? true,
                    }
                  );
                }}
                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200/80 transition-all cursor-pointer"
                title="قرع جرس الحصة الآن"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100 block">
                {formattedHijri}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 block">
              {formattedGregorian}
            </span>
          </div>
        </div>

        {/* SCHEDULE SECTION: Prominent, clear schedule */}
        <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/90 space-y-3">
          {/* Header & Mode Switch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900">
                جدولي الدراسي ({totalPeriodsInWeek} حصة أسبوعياً)
              </h3>
            </div>

            <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs text-[11px] font-black">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setTimetableTab('day');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timetableTab === 'day'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setTimetableTab('week');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timetableTab === 'week'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الأسبوع الكامل
              </button>
            </div>
          </div>

          {/* Day View */}
          {timetableTab === 'day' ? (
            <div className="space-y-3">
              {/* Day Selector Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
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
                        triggerHaptic(25);
                        setSelectedDayIndex(d.index);
                      }}
                      className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{d.name}</span>
                      {isActualToday && (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded-sm font-bold ${
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
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-0.5">
                    <span>
                      حصص يوم {selectedDayInfo.name} ({dayEntries.length} حصة مجدولة)
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="text-indigo-600 hover:underline text-[10px] font-black cursor-pointer"
                    >
                      تعديل الجدول ✏️
                    </button>
                  </div>

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
                          className={`p-3 rounded-2xl border transition-all ${
                            isOngoing
                              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 shadow-xs'
                              : 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
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
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-xs text-slate-900 truncate">
                                    {entryClass ? entryClass.name : `الحصة ${entry.periodNumber}`}
                                  </span>
                                  {isOngoing && (
                                    <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                                      جارية الآن 🟢
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold mt-0.5">
                                  {pConfig?.startTime && pConfig?.endTime && (
                                    <span className="text-indigo-900 font-extrabold" dir="ltr">
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
                              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 ${
                                isOngoing
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              <span>تحضير</span>
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Empty state when NO classes are scheduled for the selected day */
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">
                      لا توجد حصص مجدولة ليوم {selectedDayInfo.name}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                      جدولك الدراسي خالٍ تماماً في هذا اليوم. يمكنك إضافة حصصك الأسبوعية في ثوانٍ.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsImportTimetableModalOpen(true)}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer hover:opacity-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>إضافة جدول من صورة 📸</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black rounded-xl border border-slate-200 cursor-pointer"
                    >
                      تعديل الجدول ✏️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Weekly Timetable Matrix View */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>توزيع الحصص على مدار الأسبوع</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportTimetableModalOpen(true)}
                    className="text-emerald-700 font-black flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>استيراد صورة 📸</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="text-indigo-600 font-black hover:underline cursor-pointer"
                  >
                    تعديل الجدول ✏️
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                {DAYS_OF_WEEK.map((day) => {
                  const dayItems = timetable
                    .filter((t) => t.dayOfWeek === day.index && t.classId && t.classId.trim() !== '')
                    .sort((a, b) => a.periodNumber - b.periodNumber);
                  const isToday = actualTodayDayIndex === day.index;

                  return (
                    <div
                      key={day.index}
                      className={`p-2.5 rounded-xl border text-xs text-right transition-all ${
                        isToday
                          ? 'bg-indigo-50/80 border-indigo-200'
                          : 'bg-white border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
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
                                className="bg-slate-100 hover:bg-indigo-100 text-slate-800 hover:text-indigo-900 border border-slate-200/80 px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                                title="انقر لبدء التحضير"
                              >
                                <span className="bg-indigo-600 text-white text-[9px] w-4 h-4 rounded flex items-center justify-center">
                                  {entry.periodNumber}
                                </span>
                                <span>{entryClass ? entryClass.name : `الحصة ${entry.periodNumber}`}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">يوم خالٍ من الحصص</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPeriodsInWeek > 0 && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل تريد مسح وتفريغ جدول الحصص بالكامل؟')) {
                        clearTimetable();
                        showToast('تم إفراغ جدول الحصص بنجاح', 'info');
                      }
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>إفراغ الجدول بالكامل</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cloud Account Banner */}
      {user ? (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-300/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-right">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-emerald-950">مساحة عمل خاصة ومعزولة 🔒</span>
                <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                  سحابي
                </span>
              </div>
              <p className="text-[11px] font-bold text-emerald-800 truncate" dir="ltr">
                {user.email || 'حساب مستقل'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="text-[11px] font-black text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-2xs shrink-0 cursor-pointer transition-all"
          >
            إدارة الحساب
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-2 text-right">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <CloudCheck className="w-5 h-5 text-indigo-300 shrink-0" />
              <h3 className="text-xs font-black text-white">نظام المعلم المستقل (عزل تام للبيانات 🔒)</h3>
            </div>
            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-black px-2 py-0.5 rounded-full">
              موصى به
            </span>
          </div>
          <p className="text-[11px] text-indigo-100 font-semibold leading-relaxed">
            سجّل دخولك ببريدك الإلكتروني لإنشاء مساحة عملك الخاصة المعزولة 100%، حيث لا يستطيع أي معلم آخر رؤية أو تعديل بيانات طلابك وفصولك وجدولك.
          </p>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full mt-1 bg-white hover:bg-indigo-50 text-indigo-950 text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <LogIn className="w-4 h-4 text-indigo-600" />
            <span>تسجيل الدخول / إنشاء حسابك المستقل</span>
          </button>
        </div>
      )}

      {/* Main Navigation Modules */}
      <div className="space-y-3">
        {navRows.map((row) => (
          <button
            key={row.tab}
            type="button"
            onClick={() => {
              triggerHaptic(20);
              setActiveTab(row.tab);
            }}
            className={`w-full p-4 rounded-2xl border-2 ${row.borderColor} ${row.bgColor} flex items-center justify-between text-right transition-all shadow-xs hover:shadow-md active:scale-[0.98] cursor-pointer`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/90 border border-slate-200/80 flex items-center justify-center text-2xl shadow-2xs shrink-0">
                {row.badge}
              </div>
              <div>
                <span className={`text-sm sm:text-base font-black ${row.textColor} block`}>
                  {row.title}
                </span>
                <span className="text-[11px] font-bold text-slate-600 block mt-0.5">
                  {row.description}
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-slate-800 bg-white border border-slate-300 px-3.5 py-1.5 rounded-xl shadow-2xs shrink-0">
              دخول ❯
            </span>
          </button>
        ))}
      </div>

      {/* Import Timetable Modal */}
      <ImportTimetableModal
        isOpen={isImportTimetableModalOpen}
        onClose={() => setIsImportTimetableModalOpen(false)}
      />
    </div>
  );
};
