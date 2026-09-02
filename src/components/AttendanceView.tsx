import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus } from '../types';
import { Search, CheckCheck, RotateCcw, Plus, Trash2, ListChecks, FileText, StickyNote, X, Edit3, Sparkles, HelpCircle, Check, ArrowRight, Save, CheckCircle2 } from 'lucide-react';
import { generateAttendancePDFReport } from '../utils/pdfExport';
import { QuickCardMode } from './QuickCardMode';
import { cleanImportedString } from '../utils/fileImportExport';

export const AttendanceView: React.FC = () => {
  const {
    classes,
    students,
    selectedClassId,
    setSelectedClassId,
    selectedDate,
    setSelectedDate,
    attendanceCheckItems,
    addAttendanceCheckItem,
    deleteAttendanceCheckItem,
    toggleStudentCheckItem,
    setStudentAttendance,
    setStudentDailyLogNote,
    markAllPresent,
    clearAttendance,
    getStudentRecordForDate,
    dailyLogs,
    settings,
    showToast,
    triggerHaptic,
    setSelectedStudentId,
    forceSaveAll,
    saveStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [editingNoteStudentId, setEditingNoteStudentId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [isCardModeOpen, setIsCardModeOpen] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleExportAttendancePDF = async () => {
    if (!activeClass) return;
    setIsExportingPDF(true);
    showToast('جاري إنشاء تقرير الحضور والزي PDF...', 'info');
    try {
      const classSts = students.filter((s) => s.classId === activeClass.id);
      await generateAttendancePDFReport(
        activeClass,
        classSts,
        dailyLogs,
        attendanceCheckItems,
        settings
      );
      showToast('تم تحميل تقرير الحضور والزي PDF بنجاح 📄', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء إنشاء الملف', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const allClassStudents = students.filter((s) => s.classId === selectedClassId);
  const classStudents = allClassStudents.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const totalClassStudents = allClassStudents.length;

  // Attendance Status Tally
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let activityCount = 0;

  // Tally for each custom check item
  const checkItemCounts: Record<string, number> = {};
  attendanceCheckItems.forEach((item) => {
    checkItemCounts[item.id] = 0;
  });

  allClassStudents.forEach((st) => {
    const rec = getStudentRecordForDate(st.id, selectedDate);
    if (rec) {
      if (rec.attendance === 'present') presentCount++;
      else if (rec.attendance === 'absent') absentCount++;
      else if (rec.attendance === 'late') lateCount++;
      else if (rec.attendance === 'excused') excusedCount++;
      else if (rec.attendance === 'activity') activityCount++;

      // Check item tallies
      attendanceCheckItems.forEach((item) => {
        const isUniform = item.id === 'uniform';
        const isChecked = isUniform
          ? rec.uniform !== false
          : rec.customChecks?.[item.id] === true;
        if (isChecked) {
          checkItemCounts[item.id] = (checkItemCounts[item.id] || 0) + 1;
        }
      });
    } else {
      // Default: if no record yet, present with uniform is default
      if (checkItemCounts['uniform'] !== undefined) {
        checkItemCounts['uniform'] = (checkItemCounts['uniform'] || 0) + 1;
      }
    }
  });

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    triggerHaptic(20);
    setStudentAttendance(studentId, selectedClassId, selectedDate, status);
  };

  const handleOpenNoteModal = (studentId: string, currentNote?: string) => {
    triggerHaptic(15);
    setEditingNoteStudentId(studentId);
    setTempNoteText(currentNote || '');
  };

  const handleSaveNote = (studentId: string, noteText: string) => {
    triggerHaptic(20);
    setStudentDailyLogNote(studentId, selectedClassId, selectedDate, noteText.trim());
    setEditingNoteStudentId(null);
    if (noteText.trim()) {
      showToast('تم حفظ الملاحظة بنجاح 📝', 'success');
    }
  };

  const handleQuickPresetNote = (studentId: string, preset: string) => {
    setTempNoteText(preset);
    handleSaveNote(studentId, preset);
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    triggerHaptic(30);
    addAttendanceCheckItem(newItemName.trim());
    setNewItemName('');
  };

  const handleDeleteItem = (id: string) => {
    triggerHaptic(30);
    deleteAttendanceCheckItem(id);
  };

  const NOTE_PRESETS = [
    { label: 'غياب بعذر 📄', text: 'غياب بعذر طبي / رسمي' },
    { label: 'رحلة / نشاط 🚌', text: 'مشارك في نشاط / رحلة مدرسية' },
    { label: 'مستأذن 🚪', text: 'مستأذن من الإدارة' },
    { label: 'إصابة 🩹', text: 'مصاب / معفى من الحصة' },
    { label: 'تأخر بالحافلة 🚌', text: 'تأخر بسب الحافلة المدرسية' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 font-sans space-y-4">
      {/* Quick Card Mode Overlay if active */}
      {isCardModeOpen && (
        <QuickCardMode onClose={() => setIsCardModeOpen(false)} />
      )}

      {/* Main Container if Card Mode is closed */}
      {!isCardModeOpen && (
        <>
          {/* Friendly Guidance Bar for Low-Tech Users */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-4 shadow-md text-right flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-white text-[11px] font-black px-2 py-0.5 rounded-md animate-pulse">
                  طريقة سهلة وسريعة ⚡
                </span>
                <h2 className="text-sm font-black">تحضير {activeClass?.name || 'الفصل'}</h2>
              </div>
              <p className="text-xs text-indigo-200 mt-1 font-medium leading-relaxed">
                اضغط <strong className="text-emerald-300 font-black">"حاضر للكل"</strong> ثم غيّر الغائبين بنقرة واحدة، أو استخدم <strong className="text-yellow-300 font-black">"وضع البطاقات السريع"</strong> لتمرير الطلاب بسهولة.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(30);
                  setIsCardModeOpen(true);
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-emerald-100" />
                <span>التحضير كبطاقات سريعة 📱</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHelpGuide(!showHelpGuide)}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer"
                title="شرح مبسط لكيفية التحضير"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Easy Help Guide */}
          {showHelpGuide && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-right space-y-2 text-xs font-bold text-amber-950 animate-in fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-amber-200">
                <span className="font-black text-amber-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>دليل التحضير السريع في 3 خطوات بسيطة:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowHelpGuide(false)}
                  className="text-amber-700 hover:text-amber-900 cursor-pointer text-xs"
                >
                  ✕ إغلاق الدليل
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                  <span className="font-black text-slate-900 block">اختر الفصل والتاريخ</span>
                  <p className="text-slate-500 font-medium">اختر الفصل الذي تريد تحضيره من القائمة بالأعلى.</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                  <span className="font-black text-slate-900 block">اضغط "حاضر للكل"</span>
                  <p className="text-slate-500 font-medium">سيتم تحضير جميع طلاب الفصل بحركة واحدة لتوفير وقتك.</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
                  <span className="font-black text-slate-900 block">عدّل الطالب الغائب فقط</span>
                  <p className="text-slate-500 font-medium">اضغط زر "غائب ✕" أمام اسم الطالب غير الموجود فقط.</p>
                </div>
              </div>
            </div>
          )}

          {/* Top Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs text-right space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-600 block mb-1">الفصل المحدد</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 text-slate-900 font-black text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-600 block mb-1">تاريخ التحضير</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 text-slate-900 font-black text-xs sm:text-sm rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                />
              </div>
            </div>

            {/* Quick actions & Search */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث سريع باسم الطالب..."
                  className="w-full pl-2 pr-8 py-2 bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              {/* Master Button: Mark All Present */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(40);
                  markAllPresent(selectedClassId, selectedDate);
                  showToast('✓ تم تسجيل جميع طلاب الفصل حاضرين', 'success');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm active:scale-95 transition-all"
                title="تحضير جميع طلاب الفصل بلمسة واحدة"
              >
                <CheckCheck className="w-4 h-4" />
                <span>حاضر للكل (تحضير كامل)</span>
              </button>

              {/* Force Save Attendance Button */}
              <button
                type="button"
                onClick={forceSaveAll}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 border ${
                  saveStatus === 'saving'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
                }`}
                title="حفظ فوري لبيانات التحضير"
              >
                <Save className="w-3.5 h-3.5 text-emerald-600" />
                <span>{saveStatus === 'saving' ? 'جاري الحفظ...' : 'حفظ التحضير 💾'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportAttendancePDF}
                disabled={isExportingPDF}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50 shadow-2xs active:scale-95"
                title="تصدير كشف التحضير والزي كملف PDF"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>{isExportingPDF ? 'جاري...' : 'طباعة PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManageModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 px-2.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer whitespace-nowrap active:scale-95"
                title="إدارة بنود التحضير والزي والمتابعة"
              >
                <ListChecks className="w-4 h-4 text-indigo-600" />
                <span>بنود الزي ({attendanceCheckItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('هل تريد مسح تحضير هذا الفصل لهذا اليوم وإعادة الضبط؟')) {
                    clearAttendance(selectedClassId, selectedDate);
                    showToast('تمت إعادة ضبط التحضير', 'info');
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl text-xs font-bold cursor-pointer active:scale-95"
                title="إعادة ضبط التحضير"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Detailed Stats & Progress Bar */}
            <div className="pt-2.5 border-t border-slate-100 space-y-2">
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-black text-slate-700">
                  <span>نسبة الحضور اليومي:</span>
                  <span className="text-emerald-700 font-extrabold">
                    {totalClassStudents > 0
                      ? Math.round((presentCount / totalClassStudents) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        totalClassStudents > 0
                          ? Math.min(100, Math.round((presentCount / totalClassStudents) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Main Attendance Status Tally */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black">
                <span className="text-slate-700 font-extrabold">
                  العدد الكلي: {totalClassStudents} طالب
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">
                    حاضر: {presentCount}
                  </span>
                  <span className="text-rose-800 bg-rose-100/90 px-2.5 py-1 rounded-lg border border-rose-300">
                    غائب: {absentCount}
                  </span>
                  {lateCount > 0 && (
                    <span className="text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300">
                      متأخر: {lateCount}
                    </span>
                  )}
                  {excusedCount > 0 && (
                    <span className="text-purple-800 bg-purple-100/90 px-2.5 py-1 rounded-lg border border-purple-300">
                      عذر: {excusedCount}
                    </span>
                  )}
                  {activityCount > 0 && (
                    <span className="text-sky-800 bg-sky-100/90 px-2.5 py-1 rounded-lg border border-sky-300">
                      نشاط: {activityCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Student Rows List */}
          <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {classStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold text-xs space-y-2">
                <p>لا يوجد طلاب في هذا الفصل أو لم يتم مطابقة البحث</p>
              </div>
            ) : (
              classStudents.map((student, idx) => {
                const log = getStudentRecordForDate(student.id, selectedDate);
                const status = log?.attendance || null;
                const studentNote = log?.notes || '';
                const isNoteOpen = editingNoteStudentId === student.id;

                return (
                  <div
                    key={student.id}
                    className={`p-3 sm:p-3.5 space-y-2 transition-colors ${
                      status === 'absent'
                        ? 'bg-rose-50/40 border-r-4 border-rose-500'
                        : status === 'present'
                        ? 'bg-white hover:bg-slate-50/60 border-r-4 border-emerald-500'
                        : 'bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                      {/* Name & Badges */}
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <span className="text-xs font-black text-slate-400 w-5 text-center">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentId(student.id)}
                          className="text-xs sm:text-sm font-black text-slate-900 hover:text-indigo-700 text-right truncate cursor-pointer"
                        >
                          {student.name}
                        </button>
                        {cleanImportedString(student.medicalNotes) && (
                          <span
                            className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded cursor-help"
                            title={cleanImportedString(student.medicalNotes)}
                          >
                            ⚠️ حالة صحية
                          </span>
                        )}

                        {/* Note pill indicator if set */}
                        {cleanImportedString(studentNote) && !isNoteOpen && (
                          <button
                            type="button"
                            onClick={() => handleOpenNoteModal(student.id, studentNote)}
                            className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer hover:bg-purple-100 transition-colors"
                            title="تعديل الملاحظة"
                          >
                            <StickyNote className="w-3 h-3 text-purple-600" />
                            <span className="max-w-[110px] truncate">{cleanImportedString(studentNote)}</span>
                          </button>
                        )}
                      </div>

                      {/* Dynamic Check Items & Attendance Status */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Checkbox Items (Uniform, etc.) */}
                        {attendanceCheckItems.map((item) => {
                          const isUniform = item.id === 'uniform';
                          const isChecked = isUniform
                            ? log?.uniform !== false
                            : log?.customChecks?.[item.id] === true;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                triggerHaptic(25);
                                toggleStudentCheckItem(student.id, selectedClassId, selectedDate, item.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer select-none flex items-center gap-1.5 active:scale-95 ${
                                isChecked
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                              title={`تبديل حالة ${item.name}`}
                            >
                              <span className="text-xs">{isChecked ? '☑' : '☐'}</span>
                              <span>{item.name}</span>
                            </button>
                          );
                        })}

                        {/* Note Toggle Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isNoteOpen) {
                              setEditingNoteStudentId(null);
                            } else {
                              handleOpenNoteModal(student.id, studentNote);
                            }
                          }}
                          className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            studentNote
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                          title="إضافة/تعديل عذر أو ملاحظة"
                        >
                          <StickyNote className="w-4 h-4" />
                        </button>

                        {/* Direct Attendance Large Buttons */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                          {/* Large Main Button: حاضر */}
                          <button
                            type="button"
                            onClick={() => setStatus(student.id, 'present')}
                            className={`min-w-[76px] sm:min-w-[88px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                              status === 'present'
                                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500'
                                : 'bg-white text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-50'
                            }`}
                          >
                            <span className="text-base sm:text-lg">✓</span>
                            <span>حاضر</span>
                          </button>

                          {/* Large Main Button: غائب */}
                          <button
                            type="button"
                            onClick={() => setStatus(student.id, 'absent')}
                            className={`min-w-[76px] sm:min-w-[88px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                              status === 'absent'
                                ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-500'
                                : 'bg-white text-rose-800 border-2 border-rose-300 hover:bg-rose-50'
                            }`}
                          >
                            <span className="text-base sm:text-lg">✕</span>
                            <span>غائب</span>
                          </button>

                          {/* Separator */}
                          <div className="w-px h-8 bg-slate-300 mx-0.5" />

                          {/* Secondary Compact Statuses */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setStatus(student.id, 'late')}
                              className={`px-2.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                                status === 'late'
                                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400'
                                  : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
                              }`}
                              title="متأخر"
                            >
                              <span>⏱️</span>
                              <span>متأخر</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setStatus(student.id, 'excused')}
                              className={`px-2.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                                status === 'excused'
                                  ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400'
                                  : 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-50'
                              }`}
                              title="غياب بعذر"
                            >
                              <span>📄</span>
                              <span>بعذر</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setStatus(student.id, 'activity')}
                              className={`px-2.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                                status === 'activity'
                                  ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-400'
                                  : 'bg-white text-sky-900 border border-sky-200 hover:bg-sky-50'
                              }`}
                              title="نشاط / رحلة"
                            >
                              <span>🚌</span>
                              <span>نشاط</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Inline Note Box Editor */}
                    {isNoteOpen && (
                      <div className="bg-slate-50 border border-indigo-200/80 rounded-2xl p-3 text-right space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-xs font-black text-slate-700">
                          <span>إضافة ملاحظة أو عذر للطالب: {student.name}</span>
                          <button
                            type="button"
                            onClick={() => setEditingNoteStudentId(null)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-400">خيارات سريعة:</span>
                          {NOTE_PRESETS.map((p) => (
                            <button
                              key={p.text}
                              type="button"
                              onClick={() => handleQuickPresetNote(student.id, p.text)}
                              className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-800 hover:text-indigo-900 text-[11px] font-extrabold px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>

                        {/* Manual Text Input & Actions */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempNoteText}
                            onChange={(e) => setTempNoteText(e.target.value)}
                            placeholder="أكتب الملاحظة أو السبب هنا..."
                            className="flex-1 bg-white border border-slate-200 px-3 py-2 text-xs font-bold rounded-xl outline-none focus:border-indigo-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveNote(student.id, tempNoteText);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveNote(student.id, tempNoteText)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer whitespace-nowrap"
                          >
                            حفظ الملاحظة
                          </button>
                          {studentNote && (
                            <button
                              type="button"
                              onClick={() => handleSaveNote(student.id, '')}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
                              title="مسح الملاحظة"
                            >
                              مسح
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* MANAGE ATTENDANCE ITEMS MODAL */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-4 text-right shadow-xl border border-slate-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-indigo-600" />
                <span>إدارة بنود التحضير والزي والمتابعة</span>
              </h3>
            </div>

            {/* Add New Item */}
            <form onSubmit={handleAddNewItem} className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="اسم البند الجديد (مثلاً: حذاء رياضي، كراسة...)"
                className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-bold rounded-xl outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة بند</span>
              </button>
            </form>

            {/* Existing Items List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <label className="text-xs font-black text-slate-500 block">البنود الحالية:</label>
              {attendanceCheckItems.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold py-3 text-center bg-slate-50 rounded-xl">
                  لا توجد بنود تحضير مضافة (تم إلغاء/حذف الجميع)
                </p>
              ) : (
                attendanceCheckItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-rose-600 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="إلغاء / حذف هذا البند"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>إلغاء</span>
                    </button>
                    <span className="text-xs font-black text-slate-800">{item.name}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-left border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black px-5 py-2 rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



