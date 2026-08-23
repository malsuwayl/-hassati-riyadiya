import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CheckCircle2,
  CalendarDays,
  Settings,
  Bell,
  Volume2,
  Fingerprint,
  ShieldCheck,
  LogIn,
  CloudCheck,
} from 'lucide-react';
import { triggerFullPeriodAlert } from '../utils/notificationSound';

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
    setIsFingerprintModalOpen,
    fingerprintDevices,
    user,
    setIsAuthModalOpen,
  } = useApp();

  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);

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

  // Today's timetable entries (sorted by period number)
  const todayEntries = timetable
    .filter((t) => t.dayOfWeek === dayIndex)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // Active selected entry based on teacher click or default to first
  const activeEntry = todayEntries.length > 0
    ? (todayEntries[selectedEntryIndex] || todayEntries[0])
    : null;

  const activeClass = activeEntry
    ? classes.find((c) => c.id === activeEntry.classId)
    : classes[0];

  const currentLessonName = activeEntry
    ? `الحصة ${activeEntry.periodNumber}`
    : 'الحصة الأولى';

  const currentClassName = activeClass ? activeClass.name : 'لم يحدد الفصل';
  const activeClassStudentCount = activeClass
    ? students.filter((s) => s.classId === activeClass.id).length
    : 0;

  const handleStartAttendanceForClass = (classId?: string) => {
    triggerHaptic(50);
    if (classId) {
      setSelectedClassId(classId);
    } else if (activeClass) {
      setSelectedClassId(activeClass.id);
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
                    `تنبيه جرس الحصة: ${currentLessonName} - ${currentClassName}`,
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

        {/* Current Session Header with Today's Schedule Toggle Arrow */}
        <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>حصص اليوم ({todayEntries.length})</span>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setIsScheduleExpanded(!isScheduleExpanded);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200/80 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isScheduleExpanded ? 'إخفاء جدول اليوم' : 'عرض جدول اليوم'}</span>
              {isScheduleExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Today's Classes Horizontal Quick Chips with Arrow Indicator */}
          {todayEntries.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {todayEntries.map((entry, idx) => {
                  const entryClass = classes.find((c) => c.id === entry.classId);
                  const isSelected = idx === selectedEntryIndex;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(30);
                        setSelectedEntryIndex(idx);
                        if (entryClass) {
                          setSelectedClassId(entryClass.id);
                        }
                      }}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>الحصة {entry.periodNumber}</span>
                      <span className={isSelected ? 'text-indigo-200 font-normal' : 'text-slate-400 font-normal'}>•</span>
                      <span>{entryClass ? entryClass.name : 'فصل غير محدد'}</span>
                      {isSelected && <ArrowLeft className="w-3 h-3 text-white animate-pulse" />}
                    </button>
                  );
                })}
              </div>

              {/* Active Current Class Box */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-right">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 block">الحصة المحددة</span>
                  <span className="text-sm font-black text-slate-900">{currentLessonName}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 block">الفصل المستهدف</span>
                  <span className="text-sm font-black text-indigo-700 truncate block">
                    {currentClassName} ({activeClassStudentCount} طالب)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-3 rounded-xl border border-amber-200/80 text-right space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900">لا توجد حصص مسجلة بالجدول اليوم</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="text-[11px] font-black text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>ضبط الجدول</span>
                </button>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">
                يمكنك اختيار الفصل يدوياً لبدء التحضير فوراً:
              </p>
              <select
                value={activeClass ? activeClass.id : ''}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-extrabold rounded-xl p-2 outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Detailed Timetable Drawer (Expanded view when clicking arrow) */}
          {isScheduleExpanded && todayEntries.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] font-black text-slate-500 pb-1">
                <span>قائمة حصص اليوم الكاملة ({formattedGregorian})</span>
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {todayEntries.map((entry, idx) => {
                  const entryClass = classes.find((c) => c.id === entry.classId);
                  const isSelected = idx === selectedEntryIndex;
                  const stCount = entryClass
                    ? students.filter((s) => s.classId === entryClass.id).length
                    : 0;

                  return (
                    <div
                      key={entry.id}
                      onClick={() => {
                        triggerHaptic(20);
                        setSelectedEntryIndex(idx);
                        if (entryClass) setSelectedClassId(entryClass.id);
                      }}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 border-indigo-300 font-extrabold text-indigo-950 shadow-2xs'
                          : 'bg-white border-slate-200/80 font-bold text-slate-700 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
                          {entry.periodNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black">{entryClass ? entryClass.name : 'غير محدد'}</span>
                            {isSelected && (
                              <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                                الحصة الحالية
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            عدد الطلاب: {stCount}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (entryClass) handleStartAttendanceForClass(entryClass.id);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>تحضير</span>
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Large Primary Action Button */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <button
            type="button"
            onClick={() => handleStartAttendanceForClass()}
            className="sm:col-span-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <span>ابدأ تحضير {currentClassName} الآن ⏱️</span>
          </button>

          <button
            id="btn-home-open-fingerprint"
            type="button"
            onClick={() => {
              triggerHaptic(20);
              setIsFingerprintModalOpen(true);
            }}
            className="py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
            title="استيراد وتفريغ جهاز البصمة"
          >
            <Fingerprint className="w-5 h-5 text-emerald-200" />
            <span>جهاز البصمة 🖲️</span>
          </button>
        </div>
      </div>

      {/* Private Workspace & Cloud Isolation Status Banner */}
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
            سجّل دخولك ببريدك الإلكتروني لإنشاء مساحة عملك الخاصة المعزولة 100%، حيث لا يستطيع أي معلم آخر رؤية أو تعديل بيانات طلابك وفصولك ودرجاتك.
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



