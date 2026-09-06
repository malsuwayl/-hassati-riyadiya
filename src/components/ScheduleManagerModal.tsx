import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  X,
  Check,
  CheckCircle2,
  Clock,
  Wand2,
  Eraser,
  HelpCircle,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface ScheduleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenImageImport?: () => void;
}

const DAYS = [
  { index: 0, name: 'الأحد' },
  { index: 1, name: 'الإثنين' },
  { index: 2, name: 'الثلاثاء' },
  { index: 3, name: 'الأربعاء' },
  { index: 4, name: 'الخميس' },
];

const PERIOD_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

// Color palette for class tags to make visual recognition instant
const CLASS_COLORS = [
  { bg: 'bg-indigo-50 hover:bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900', pill: 'bg-indigo-600 text-white' },
  { bg: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900', pill: 'bg-emerald-600 text-white' },
  { bg: 'bg-amber-50 hover:bg-amber-100', border: 'border-amber-300', text: 'text-amber-900', pill: 'bg-amber-600 text-white' },
  { bg: 'bg-purple-50 hover:bg-purple-100', border: 'border-purple-300', text: 'text-purple-900', pill: 'bg-purple-600 text-white' },
  { bg: 'bg-sky-50 hover:bg-sky-100', border: 'border-sky-300', text: 'text-sky-900', pill: 'bg-sky-600 text-white' },
  { bg: 'bg-rose-50 hover:bg-rose-100', border: 'border-rose-300', text: 'text-rose-900', pill: 'bg-rose-600 text-white' },
  { bg: 'bg-teal-50 hover:bg-teal-100', border: 'border-teal-300', text: 'text-teal-900', pill: 'bg-teal-600 text-white' },
  { bg: 'bg-cyan-50 hover:bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-900', pill: 'bg-cyan-600 text-white' },
];

export const ScheduleManagerModal: React.FC<ScheduleManagerModalProps> = ({
  isOpen,
  onClose,
  onOpenImageImport,
}) => {
  const {
    classes,
    timetable,
    updateTimetableEntry,
    applyTimetableBatch,
    clearTimetable,
    showToast,
    triggerHaptic,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'grid' | 'form' | 'copy'>('grid');

  // Quick painter mode state: if string, it's a classId; if '__ERASER__', it clears; if null, normal click mode
  const [selectedPainterClassId, setSelectedPainterClassId] = useState<string | null>(null);

  // Quick Single Add Form state
  const [formDay, setFormDay] = useState<number>(0);
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formClassId, setFormClassId] = useState<string>(classes[0]?.id || '');

  // Copy Day state
  const [copySourceDay, setCopySourceDay] = useState<number>(0);
  const [copyTargetDay, setCopyTargetDay] = useState<number>(1);

  if (!isOpen) return null;

  // Helper to get class color
  const getClassColor = (classId: string) => {
    const idx = classes.findIndex((c) => c.id === classId);
    if (idx === -1) return CLASS_COLORS[0];
    return CLASS_COLORS[idx % CLASS_COLORS.length];
  };

  // Cell click handler
  const handleCellClick = (dayOfWeek: number, periodNumber: number) => {
    triggerHaptic(20);

    // If painter mode is active with eraser
    if (selectedPainterClassId === '__ERASER__') {
      updateTimetableEntry(dayOfWeek, periodNumber, '');
      return;
    }

    // If painter mode is active with a class
    if (selectedPainterClassId) {
      updateTimetableEntry(dayOfWeek, periodNumber, selectedPainterClassId);
      return;
    }

    // Normal mode: cycle or open picker
    const currentEntry = timetable.find(
      (t) => t.dayOfWeek === dayOfWeek && t.periodNumber === periodNumber
    );

    if (!currentEntry || !currentEntry.classId) {
      // If empty, assign the first available class
      if (classes.length > 0) {
        updateTimetableEntry(dayOfWeek, periodNumber, classes[0].id);
      }
    } else {
      // Find next class in the list to cycle, or clear if at the end
      const currentIndex = classes.findIndex((c) => c.id === currentEntry.classId);
      if (currentIndex < classes.length - 1) {
        updateTimetableEntry(dayOfWeek, periodNumber, classes[currentIndex + 1].id);
      } else {
        updateTimetableEntry(dayOfWeek, periodNumber, '');
      }
    }
  };

  // Direct manual single period addition
  const handleFormAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassId) {
      showToast('يرجى اختيار الفصل أولاً', 'error');
      return;
    }
    triggerHaptic(30);
    updateTimetableEntry(formDay, formPeriod, formClassId);
    const clsName = classes.find((c) => c.id === formClassId)?.name || 'الفصل';
    const dayName = DAYS.find((d) => d.index === formDay)?.name || '';
    showToast(`✓ تم تثبيت ${clsName} في الحصة ${formPeriod} يوم ${dayName}`, 'success');
  };

  // Copy full day schedule to another day
  const handleCopyDay = () => {
    if (copySourceDay === copyTargetDay) {
      showToast('يرجى اختيار يومين مختلفين للنسخ', 'error');
      return;
    }

    const sourceEntries = timetable.filter(
      (t) => t.dayOfWeek === copySourceDay && t.classId && t.classId.trim() !== ''
    );

    if (sourceEntries.length === 0) {
      const srcName = DAYS.find((d) => d.index === copySourceDay)?.name;
      showToast(`لا توجد أي حصص مسجلة في يوم ${srcName} لنسخها`, 'error');
      return;
    }

    // Remove existing entries on the target day, then add new ones
    const remaining = timetable.filter((t) => t.dayOfWeek !== copyTargetDay);
    const newTargetEntries = sourceEntries.map((e) => ({
      dayOfWeek: copyTargetDay,
      periodNumber: e.periodNumber,
      classId: e.classId,
    }));

    const combined = [
      ...remaining.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        periodNumber: r.periodNumber,
        classId: r.classId,
      })),
      ...newTargetEntries,
    ];

    applyTimetableBatch(combined);
    const srcName = DAYS.find((d) => d.index === copySourceDay)?.name;
    const tgtName = DAYS.find((d) => d.index === copyTargetDay)?.name;
    showToast(`✓ تم نسخ حصص يوم ${srcName} (${sourceEntries.length} حصص) إلى يوم ${tgtName} بنجاح!`, 'success');
  };

  const totalScheduled = timetable.filter((t) => t.classId && t.classId.trim() !== '').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden text-right font-sans">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-200 shadow-inner">
              <Calendar className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  مساعد إضافة وتعديل جدول الحصص 📅
                </h2>
                <span className="bg-indigo-700/80 text-indigo-200 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-indigo-500/40">
                  {totalScheduled} حصة أسبوعياً
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">
                طرق سريعة وسهلة لبناء جدولك الأسبوعي في ثوانٍ معدودة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation & AI Button */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl text-xs font-black">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setActiveTab('grid');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'grid'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>الجدول التفاعلي السريع ⚡</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setActiveTab('form');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'form'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>إضافة حصة مباشرة ➕</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setActiveTab('copy');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'copy'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-purple-600" />
              <span>نسخ يوم لآخر 📋</span>
            </button>
          </div>

          {onOpenImageImport && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(25);
                onClose();
                onOpenImageImport();
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>استيراد صورة الجدول بالذكاء الاصطناعي 📸</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Quick Interactive Grid */}
          {activeTab === 'grid' && (
            <div className="space-y-4">
              {/* Quick Painter Toolbar */}
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1.5 font-black text-indigo-950">
                    <Wand2 className="w-4 h-4 text-indigo-600" />
                    <span>طريقة التعيين السريع بنقرة واحدة:</span>
                  </div>
                  <span className="text-[11px] text-indigo-700 font-medium">
                    اختر فصلاً من الأسفل، ثم انقر على أي حصة في الجدول لتعيينها فوراً!
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 ml-1">اختر الفصل:</span>

                  {classes.map((cls) => {
                    const isSelected = selectedPainterClassId === cls.id;
                    const color = getClassColor(cls.id);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic(20);
                          setSelectedPainterClassId(isSelected ? null : cls.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                          isSelected
                            ? `${color.pill} border-transparent shadow-md ring-2 ring-indigo-500 scale-105`
                            : 'bg-white text-slate-800 border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                        <span>{cls.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}

                  {/* Eraser Tool */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(20);
                      setSelectedPainterClassId(
                        selectedPainterClassId === '__ERASER__' ? null : '__ERASER__'
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      selectedPainterClassId === '__ERASER__'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-400 scale-105'
                        : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                    }`}
                    title="أداة الممحاة لتفريغ الحصص"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>ممحاة (تفريغ)</span>
                  </button>

                  {selectedPainterClassId && (
                    <button
                      type="button"
                      onClick={() => setSelectedPainterClassId(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1 underline cursor-pointer"
                    >
                      إلغاء التحديد ✕
                    </button>
                  )}
                </div>

                {selectedPainterClassId && (
                  <div className="bg-white/80 rounded-xl p-2 border border-indigo-200 text-xs font-black flex items-center justify-between text-indigo-900">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>
                        الوضع النشط:{' '}
                        {selectedPainterClassId === '__ERASER__' ? (
                          <strong className="text-rose-600">الممحاة (اضغط على أي حصة لتفريغها)</strong>
                        ) : (
                          <strong className="text-indigo-700">
                            تعيين (
                            {classes.find((c) => c.id === selectedPainterClassId)?.name}
                            ) بنقرة واحدة
                          </strong>
                        )}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">انقر في الجدول بالأسفل</span>
                  </div>
                )}
              </div>

              {/* Weekly Interactive Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs font-bold border-collapse min-w-[580px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="p-3 text-center border-l border-slate-200 w-24 bg-slate-200/60 font-black">
                          اليوم
                        </th>
                        {PERIOD_NUMBERS.map((p) => (
                          <th key={p} className="p-2.5 text-center border-l border-slate-200 font-black">
                            الحصة {p}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DAYS.map((day) => {
                        const dayCount = timetable.filter(
                          (t) => t.dayOfWeek === day.index && t.classId && t.classId.trim() !== ''
                        ).length;

                        return (
                          <tr key={day.index} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 font-black text-slate-900 border-l border-slate-200 bg-slate-50/90 text-center">
                              <div>{day.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                ({dayCount} حصص)
                              </div>
                            </td>

                            {PERIOD_NUMBERS.map((p) => {
                              const entry = timetable.find(
                                (t) => t.dayOfWeek === day.index && t.periodNumber === p
                              );
                              const assignedClass = entry?.classId
                                ? classes.find((c) => c.id === entry.classId)
                                : null;
                              const color = assignedClass ? getClassColor(assignedClass.id) : null;

                              return (
                                <td key={p} className="p-1.5 border-l border-slate-200 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleCellClick(day.index, p)}
                                    className={`w-full min-h-[44px] rounded-xl p-1.5 transition-all text-xs font-black flex flex-col items-center justify-center cursor-pointer border ${
                                      assignedClass
                                        ? `${color?.bg} ${color?.border} ${color?.text} shadow-2xs hover:scale-102`
                                        : 'bg-slate-50 hover:bg-slate-100 border-dashed border-slate-300 text-slate-400 hover:text-slate-600'
                                    }`}
                                    title={
                                      assignedClass
                                        ? `${assignedClass.name} - انقر لتغيير أو تفريغ الحصة`
                                        : 'فارغ - انقر لإضافة حصة'
                                    }
                                  >
                                    {assignedClass ? (
                                      <>
                                        <span className="truncate max-w-[76px]">
                                          {assignedClass.name}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-normal">
                                          تعديل ✎
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-slate-300 text-sm font-bold flex items-center gap-0.5">
                                        <Plus className="w-3.5 h-3.5" />
                                        <span className="text-[10px]">إضافة</span>
                                      </span>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table Footer Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="text-slate-500 font-medium">
                  💡 <strong>نصيحة:</strong> يمكنك أيضاً النقر مباشرة على أي حصة في الجدول لتبديل فصلها تلقائياً.
                </div>

                {totalScheduled > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من رغبتك في إفراغ جدول الحصص بالكامل؟')) {
                        clearTimetable();
                      }
                    }}
                    className="text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إفراغ الجدول بالكامل</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Quick Single Add Form */}
          {activeTab === 'form' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>إضافة أو تعديل حصة محددة مباشرة:</span>
                </div>

                <form onSubmit={handleFormAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  {/* Day Picker */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">اليوم:</label>
                    <select
                      value={formDay}
                      onChange={(e) => setFormDay(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    >
                      {DAYS.map((d) => (
                        <option key={d.index} value={d.index}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Period Picker */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">رقم الحصة:</label>
                    <select
                      value={formPeriod}
                      onChange={(e) => setFormPeriod(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    >
                      {PERIOD_NUMBERS.map((p) => (
                        <option key={p} value={p}>
                          الحصة {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class Picker */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">الفصل:</label>
                    <select
                      value={formClassId}
                      onChange={(e) => setFormClassId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>تثبيت في الجدول</span>
                  </button>
                </form>
              </div>

              {/* List of currently scheduled periods */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800">
                  الحصص المسجلة حالياً في الجدول ({totalScheduled} حصة):
                </h4>

                {totalScheduled === 0 ? (
                  <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-400 font-bold text-xs">
                    لا توجد أي حصص مضافة حتى الآن
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                    {timetable
                      .filter((t) => t.classId && t.classId.trim() !== '')
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.periodNumber - b.periodNumber)
                      .map((entry) => {
                        const dName = DAYS.find((d) => d.index === entry.dayOfWeek)?.name;
                        const cls = classes.find((c) => c.id === entry.classId);
                        const color = cls ? getClassColor(cls.id) : null;

                        return (
                          <div
                            key={entry.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-black ${
                              color?.bg || 'bg-slate-50'
                            } ${color?.border || 'border-slate-200'}`}
                          >
                            <div>
                              <div className="text-slate-900">{cls?.name || 'فصل غير معروف'}</div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                يوم {dName} • الحصة {entry.periodNumber}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic(20);
                                updateTimetableEntry(entry.dayOfWeek, entry.periodNumber, '');
                              }}
                              className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                              title="حذف هذه الحصة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Copy Day to Day */}
          {activeTab === 'copy' && (
            <div className="space-y-4">
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-purple-950">
                  <Copy className="w-4 h-4 text-purple-700" />
                  <span>نسخ حصص يوم كامل إلى يوم آخر في ثانية واحدة:</span>
                </div>
                <p className="text-xs text-purple-800 font-medium">
                  إذا كان لديك يومان بنفس توزيع الحصص، يمكنك نسخ جميع حصص اليوم بنقرة واحدة دون الحاجة لإعادة إدخالها.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">انسخ من يوم:</label>
                    <select
                      value={copySourceDay}
                      onChange={(e) => setCopySourceDay(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                    >
                      {DAYS.map((d) => {
                        const cnt = timetable.filter(
                          (t) => t.dayOfWeek === d.index && t.classId && t.classId.trim() !== ''
                        ).length;
                        return (
                          <option key={d.index} value={d.index}>
                            {d.name} ({cnt} حصص)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">إلى يوم:</label>
                    <select
                      value={copyTargetDay}
                      onChange={(e) => setCopyTargetDay(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                    >
                      {DAYS.map((d) => {
                        const cnt = timetable.filter(
                          (t) => t.dayOfWeek === d.index && t.classId && t.classId.trim() !== ''
                        ).length;
                        return (
                          <option key={d.index} value={d.index}>
                            {d.name} ({cnt} حصص حالياً)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyDay}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" />
                    <span>نسخ الحصص الآن</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between shrink-0">
          <div className="text-xs font-bold text-slate-500">
            يتم حفظ التعديلات فوراً وتنعكس على الصفحة الرئيسية والتنبيهات
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
          >
            تم / حفظ والعودة
          </button>
        </div>
      </div>
    </div>
  );
};
