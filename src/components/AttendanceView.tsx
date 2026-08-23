import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus } from '../types';
import { Search, CheckCheck, RotateCcw, Plus, Trash2, ListChecks, FileText, StickyNote, X, Edit3 } from 'lucide-react';
import { generateAttendancePDFReport } from '../utils/pdfExport';

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
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [editingNoteStudentId, setEditingNoteStudentId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

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
      {/* Top Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs text-right space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 block mb-1">الفصل المحدد</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/90 text-slate-900 font-black text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
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
              className="w-full bg-slate-50 border border-slate-200/90 text-slate-900 font-black text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
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
              placeholder="بحث بالاسم..."
              className="w-full pl-2 pr-8 py-2 bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={() => markAllPresent(selectedClassId, selectedDate)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs active:scale-95"
          >
            <CheckCheck className="w-4 h-4" />
            <span>حاضر للكل</span>
          </button>

          <button
            type="button"
            onClick={handleExportAttendancePDF}
            disabled={isExportingPDF}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50 shadow-2xs active:scale-95"
            title="تصدير كشف التحضير والزي كملف PDF"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>{isExportingPDF ? 'جاري...' : 'كشف PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManageModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 px-2.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer whitespace-nowrap active:scale-95"
            title="إدارة بنود التحضير والزي والمتابعة"
          >
            <ListChecks className="w-4 h-4 text-indigo-600" />
            <span>البنود ({attendanceCheckItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => clearAttendance(selectedClassId, selectedDate)}
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
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-black">
            <span className="text-slate-600 font-extrabold">العدد الإجمالي: {totalClassStudents}</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                حاضر: {presentCount}
              </span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                متأخر: {lateCount}
              </span>
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                غائب: {absentCount}
              </span>
              {excusedCount > 0 && (
                <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                  غياب بعذر: {excusedCount}
                </span>
              )}
              {activityCount > 0 && (
                <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                  نشاط/رحلة: {activityCount}
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Check Items Tally */}
          {attendanceCheckItems.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 text-[11px] font-black scrollbar-none">
              <span className="text-slate-400 shrink-0 text-[10px]">إحصاء البنود:</span>
              {attendanceCheckItems.map((item) => {
                const count = checkItemCounts[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="bg-indigo-50/70 border border-indigo-200/70 text-indigo-900 px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 text-[10px]"
                  >
                    <span>{item.name}:</span>
                    <span className="text-indigo-700 font-extrabold">{count}</span>
                    <span className="text-indigo-400">/ {totalClassStudents}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Student Rows List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs">
        {classStudents.length === 0 ? (
          <div className="p-6 text-center text-slate-400 font-bold text-xs">
            لا يوجد طلاب في هذا الفصل
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
                className="p-3 space-y-2 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                  {/* Name & Badges */}
                  <div className="flex items-center gap-2 min-w-[150px]">
                    <span className="text-xs font-black text-slate-400 w-4 text-center">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentId(student.id)}
                      className="text-xs font-extrabold text-slate-900 hover:text-indigo-700 text-right truncate cursor-pointer"
                    >
                      {student.name}
                    </button>
                    {student.medicalNotes && (
                      <span
                        className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded cursor-help"
                        title={student.medicalNotes}
                      >
                        ⚠️
                      </span>
                    )}

                    {/* Note pill indicator if set */}
                    {studentNote && !isNoteOpen && (
                      <button
                        type="button"
                        onClick={() => handleOpenNoteModal(student.id, studentNote)}
                        className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer hover:bg-purple-100 transition-colors"
                        title="تعديل الملاحظة"
                      >
                        <StickyNote className="w-3 h-3 text-purple-600" />
                        <span className="max-w-[110px] truncate">{studentNote}</span>
                      </button>
                    )}
                  </div>

                  {/* Dynamic Check Items & Attendance Status */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
                    {/* Checkbox Items */}
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
                          className={`px-2 py-1 rounded-lg text-[11px] font-black border transition-all cursor-pointer select-none flex items-center gap-1 ${
                            isChecked
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300/80 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                          title={`تبديل حالة ${item.name}`}
                        >
                          <span>{isChecked ? '☑' : '☐'}</span>
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
                      className={`p-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        studentNote
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                      title="إضافة/تعديل ملاحظة (بعذر/رحلة/سبب)"
                    >
                      <StickyNote className="w-3.5 h-3.5" />
                    </button>

                    {/* Attendance State Direct Buttons */}
                    <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
                      {/* Large Main Button: حاضر */}
                      <button
                        type="button"
                        onClick={() => setStatus(student.id, 'present')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                          status === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                            : 'bg-white text-emerald-800 border border-emerald-200/80 hover:bg-emerald-50'
                        }`}
                      >
                        <span className="text-sm">✓</span>
                        <span>حاضر</span>
                      </button>

                      {/* Large Main Button: غائب */}
                      <button
                        type="button"
                        onClick={() => setStatus(student.id, 'absent')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                          status === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/30'
                            : 'bg-white text-rose-800 border border-rose-200/80 hover:bg-rose-50'
                        }`}
                      >
                        <span className="text-sm">✕</span>
                        <span>غائب</span>
                      </button>

                      {/* Separator */}
                      <div className="w-px h-5 bg-slate-300/60 mx-0.5" />

                      {/* Secondary Compact Statuses */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'late')}
                          className={`px-1.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            status === 'late'
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                          title="متأخر"
                        >
                          متأخر
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'excused')}
                          className={`px-1.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            status === 'excused'
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                          title="غياب بعذر"
                        >
                          غياب بعذر
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'activity')}
                          className={`px-1.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            status === 'activity'
                              ? 'bg-sky-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                          title="نشاط / رحلة"
                        >
                          نشاط
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline Note Box Editor */}
                {isNoteOpen && (
                  <div className="bg-slate-50 border border-indigo-200/80 rounded-xl p-2.5 text-right space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                      <span>إضافة ملاحظة أو عذر للطالب: {student.name}</span>
                      <button
                        type="button"
                        onClick={() => setEditingNoteStudentId(null)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">خيارات سريعة:</span>
                      {NOTE_PRESETS.map((p) => (
                        <button
                          key={p.text}
                          type="button"
                          onClick={() => handleQuickPresetNote(student.id, p.text)}
                          className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-800 hover:text-indigo-900 text-[10px] font-extrabold px-2 py-1 rounded-lg transition-colors cursor-pointer"
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
                        placeholder="أكتب الملاحظة أو السبب..."
                        className="flex-1 bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold rounded-lg outline-none focus:border-indigo-500"
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
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer whitespace-nowrap"
                      >
                        حفظ
                      </button>
                      {studentNote && (
                        <button
                          type="button"
                          onClick={() => handleSaveNote(student.id, '')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap"
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

      {/* MANAGE ATTENDANCE ITEMS MODAL */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-4 max-w-md w-full space-y-4 text-right shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
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
                className="flex-1 bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold rounded-xl outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة بند</span>
              </button>
            </form>

            {/* Existing Items List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <label className="text-[11px] font-black text-slate-500 block">البنود الحالية:</label>
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
                      className="text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="إلغاء / حذف هذا البند"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إلغاء البند</span>
                    </button>
                    <span className="text-xs font-extrabold text-slate-800">{item.name}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-left border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black px-4 py-1.5 rounded-xl cursor-pointer"
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



