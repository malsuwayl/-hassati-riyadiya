import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus } from '../types';
import { Search, CheckCheck, RotateCcw, Plus, Trash2, ListChecks, FileText } from 'lucide-react';
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

  const classStudents = students
    .filter((s) => s.classId === selectedClassId)
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  const totalClassStudents = students.filter((s) => s.classId === selectedClassId).length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  students
    .filter((s) => s.classId === selectedClassId)
    .forEach((st) => {
      const rec = getStudentRecordForDate(st.id, selectedDate);
      if (rec) {
        if (rec.attendance === 'present') presentCount++;
        else if (rec.attendance === 'absent') absentCount++;
        else if (rec.attendance === 'late') lateCount++;
      }
    });

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    triggerHaptic(20);
    setStudentAttendance(studentId, selectedClassId, selectedDate, status);
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

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 font-sans space-y-3">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl p-3 border border-zinc-200 text-right space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-black text-zinc-500 block mb-1">الفصل</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 font-extrabold text-xs rounded-lg px-2.5 py-2 outline-none"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-zinc-500 block mb-1">التاريخ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 font-extrabold text-xs rounded-lg px-2.5 py-1.5 outline-none"
            />
          </div>
        </div>

        {/* Quick actions & Search */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full pl-2 pr-8 py-1.5 bg-zinc-50 border border-zinc-200 text-xs font-bold rounded-lg outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleExportAttendancePDF}
            disabled={isExportingPDF}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer whitespace-nowrap disabled:opacity-50"
            title="تصدير كشف التحضير والزي كملف PDF"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isExportingPDF ? 'جاري...' : 'تصدير PDF 📄'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManageModal(true)}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer whitespace-nowrap"
            title="إدارة بنود التحضير والزي والمتابعة"
          >
            <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
            <span>بنود التحضير ({attendanceCheckItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => markAllPresent(selectedClassId, selectedDate)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>حاضر للكل</span>
          </button>

          <button
            type="button"
            onClick={() => clearAttendance(selectedClassId, selectedDate)}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-2 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
            title="إعادة ضبط"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between text-[11px] font-black pt-1 border-t border-zinc-100">
          <span className="text-zinc-500">العدد: {totalClassStudents}</span>
          <div className="flex items-center gap-2">
            <span className="text-emerald-700">حاضر: {presentCount}</span>
            <span className="text-amber-600">متأخر: {lateCount}</span>
            <span className="text-rose-600">غائب: {absentCount}</span>
          </div>
        </div>
      </div>

      {/* Student Rows List */}
      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
        {classStudents.length === 0 ? (
          <div className="p-6 text-center text-zinc-400 font-bold text-xs">
            لا يوجد طلاب في هذا الفصل
          </div>
        ) : (
          classStudents.map((student, idx) => {
            const log = getStudentRecordForDate(student.id, selectedDate);
            const status = log?.attendance || null;

            return (
              <div
                key={student.id}
                className="p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 hover:bg-zinc-50 transition-colors"
              >
                {/* Name */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="text-xs font-black text-zinc-400 w-4 text-center">
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentId(student.id)}
                    className="text-xs font-extrabold text-zinc-900 hover:text-emerald-700 text-right truncate cursor-pointer"
                  >
                    {student.name}
                  </button>
                  {student.medicalNotes && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1 rounded">
                      ⚠️
                    </span>
                  )}
                </div>

                {/* Dynamic Check Items & Attendance Status */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
                  {/* Dynamic Attendance Check Items (e.g. Uniform, Shoes, Notebook, etc.) */}
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
                        className={`px-2 py-1 rounded-lg text-[11px] font-black border transition-colors cursor-pointer select-none flex items-center gap-1 ${
                          isChecked
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-400 border-zinc-200'
                        }`}
                        title={`تبديل ${item.name}`}
                      >
                        <span>{isChecked ? '☑' : '☐'}</span>
                        <span>{item.name}</span>
                      </button>
                    );
                  })}

                  {/* Attendance State Direct Buttons */}
                  <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setStatus(student.id, 'present')}
                      className={`px-2.5 py-1 rounded-md text-xs font-black transition-colors cursor-pointer ${
                        status === 'present'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      حاضر
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus(student.id, 'late')}
                      className={`px-2.5 py-1 rounded-md text-xs font-black transition-colors cursor-pointer ${
                        status === 'late'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      متأخر
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus(student.id, 'absent')}
                      className={`px-2.5 py-1 rounded-md text-xs font-black transition-colors cursor-pointer ${
                        status === 'absent'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      غائب
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MANAGE ATTENDANCE ITEMS MODAL */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-4 max-w-md w-full space-y-4 text-right shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-emerald-600" />
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
                className="flex-1 bg-zinc-50 border border-zinc-200 px-3 py-1.5 text-xs font-bold rounded-lg outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة بند</span>
              </button>
            </form>

            {/* Existing Items List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <label className="text-[11px] font-black text-zinc-500 block">البنود الحالية:</label>
              {attendanceCheckItems.length === 0 ? (
                <p className="text-xs text-zinc-400 font-bold py-3 text-center bg-zinc-50 rounded-xl">
                  لا توجد بنود تحضير مضافة (تم إلغاء/حذف الجميع)
                </p>
              ) : (
                attendanceCheckItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-200"
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
                    <span className="text-xs font-extrabold text-zinc-800">{item.name}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-left border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-black px-4 py-1.5 rounded-lg cursor-pointer"
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


