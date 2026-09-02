import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus } from '../types';
import {
  CheckCheck,
  XCircle,
  Clock,
  FileQuestion,
  ChevronRight,
  ChevronLeft,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Award,
  AlertTriangle,
  StickyNote,
} from 'lucide-react';

interface QuickCardModeProps {
  onClose: () => void;
}

export const QuickCardMode: React.FC<QuickCardModeProps> = ({ onClose }) => {
  const {
    selectedClassId,
    classes,
    students,
    selectedDate,
    getStudentRecordForDate,
    setStudentAttendance,
    toggleStudentCheckItem,
    attendanceCheckItems,
    setStudentDailyLogNote,
    triggerHaptic,
    showToast,
  } = useApp();

  const classStudents = students.filter((s) => s.classId === selectedClassId);
  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const currentStudent = classStudents[currentIndex];
  const currentRecord = currentStudent
    ? getStudentRecordForDate(currentStudent.id, selectedDate)
    : undefined;
  const currentStatus = currentRecord?.attendance || null;

  useEffect(() => {
    if (currentRecord?.notes) {
      setNoteText(currentRecord.notes);
    } else {
      setNoteText('');
    }
    setNoteOpen(false);
  }, [currentIndex, currentStudent?.id]);

  if (!currentStudent || classStudents.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center space-y-4 border border-slate-200">
        <p className="text-sm font-bold text-slate-500">لا يوجد طلاب مسجلين في هذا الفصل للتحضير السريع</p>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black cursor-pointer"
        >
          العودة للقائمة العادية
        </button>
      </div>
    );
  }

  const handleApplyStatus = (status: AttendanceStatus) => {
    triggerHaptic(30);
    setStudentAttendance(currentStudent.id, selectedClassId, selectedDate, status);

    // Auto advance if not at the end
    if (currentIndex < classStudents.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      showToast('🎉 اكتمل تحضير جميع طلاب الفصل!', 'success');
    }
  };

  const handleSaveNote = () => {
    if (!currentStudent) return;
    setStudentDailyLogNote(currentStudent.id, selectedClassId, selectedDate, noteText.trim());
    setNoteOpen(false);
    if (noteText.trim()) {
      showToast('تم حفظ الملاحظة للطالب', 'success');
    }
  };

  const progressPercent = Math.round(((currentIndex + 1) / classStudents.length) * 100);

  // Count done
  const doneCount = classStudents.filter((s) => {
    const r = getStudentRecordForDate(s.id, selectedDate);
    return r && r.attendance;
  }).length;

  return (
    <div className="bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 border-2 border-indigo-200/80 rounded-3xl p-4 sm:p-6 shadow-xl space-y-5 text-right font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs"
        >
          ✕ إغلاق وضع البطاقات
        </button>

        <div className="text-left">
          <div className="text-xs font-black text-indigo-900 flex items-center gap-1.5 justify-end">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>التحضير السريع بلمسة واحدة</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            فصل: {activeClass?.name} ({doneCount}/{classStudents.length} تم تحضيرهم)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-black text-slate-600">
          <span>طالب {currentIndex + 1} من {classStudents.length}</span>
          <span className="text-indigo-600">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Student Highlight Card */}
      <div className="bg-white rounded-3xl p-6 border-2 border-indigo-100 shadow-md text-center space-y-4 relative">
        <span className="absolute top-4 right-4 w-7 h-7 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-xs font-black">
          #{currentIndex + 1}
        </span>

        {/* Current status badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-2xs">
          {currentStatus === 'present' && (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full">
              ✓ تم التحضير: حاضر
            </span>
          )}
          {currentStatus === 'absent' && (
            <span className="bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 rounded-full">
              ✕ تم التحضير: غائب
            </span>
          )}
          {currentStatus === 'late' && (
            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full">
              ⏱️ تم التحضير: متأخر
            </span>
          )}
          {currentStatus === 'excused' && (
            <span className="bg-purple-100 text-purple-800 border border-purple-300 px-3 py-1 rounded-full">
              📄 تم التحضير: غياب بعذر
            </span>
          )}
          {!currentStatus && (
            <span className="bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 rounded-full">
              لم يتم التحضير بعد
            </span>
          )}
        </div>

        {/* Big Student Name */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {currentStudent.name}
        </h3>

        {currentStudent.medicalNotes && (
          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1 rounded-xl text-xs font-black">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>حالة صحية: {currentStudent.medicalNotes}</span>
          </div>
        )}

        {/* Uniform & Extra Check items */}
        {attendanceCheckItems.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 flex-wrap">
            {attendanceCheckItems.map((item) => {
              const isUniform = item.id === 'uniform';
              const isChecked = isUniform
                ? currentRecord?.uniform !== false
                : currentRecord?.customChecks?.[item.id] === true;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic(20);
                    toggleStudentCheckItem(currentStudent.id, selectedClassId, selectedDate, item.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isChecked
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className="text-sm">{isChecked ? '☑' : '☐'}</span>
                  <span>{item.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setNoteOpen(!noteOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentRecord?.notes
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>{currentRecord?.notes ? 'تعديل الملاحظة' : 'ملاحظة'}</span>
            </button>
          </div>
        )}

        {/* Inline Note form */}
        {noteOpen && (
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl text-right space-y-2 animate-in fade-in">
            <div className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="أكتب ملاحظة أو سبب الغياب/النشاط..."
                className="flex-1 bg-white border border-purple-200 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                حفظ
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['غياب بعذر 📄', 'مستأذن 🚪', 'نشاط مدرسي 🚌', 'مصاب / معفى 🩹'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setNoteText(preset);
                  }}
                  className="bg-white border border-purple-200 text-[10px] font-bold text-purple-900 px-2 py-1 rounded-lg shrink-0"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Large Giant Touch Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Giant Green Present Button */}
        <button
          type="button"
          onClick={() => handleApplyStatus('present')}
          className="h-20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-lg flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform cursor-pointer border-2 border-emerald-400"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">✓</span>
            <span>حـاضـر</span>
          </div>
          <span className="text-[11px] text-emerald-100 font-bold">بلمسة واحدة + التالي ➔</span>
        </button>

        {/* Giant Red Absent Button */}
        <button
          type="button"
          onClick={() => handleApplyStatus('absent')}
          className="h-20 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-2xl font-black text-lg flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-600/20 active:scale-95 transition-transform cursor-pointer border-2 border-rose-400"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">✕</span>
            <span>غـائـب</span>
          </div>
          <span className="text-[11px] text-rose-100 font-bold">تسجيل غياب + التالي ➔</span>
        </button>
      </div>

      {/* Secondary Fast Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => handleApplyStatus('late')}
          className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>متأخر</span>
        </button>

        <button
          type="button"
          onClick={() => handleApplyStatus('excused')}
          className="py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>بعذر رسمـي</span>
        </button>

        <button
          type="button"
          onClick={() => handleApplyStatus('activity')}
          className="py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>نشاط / رحلة</span>
        </button>
      </div>

      {/* Bottom Prev / Next Navigation Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => {
            triggerHaptic(20);
            setCurrentIndex((prev) => Math.max(0, prev - 1));
          }}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer hover:bg-slate-50"
        >
          <ChevronRight className="w-4 h-4" />
          <span>الطالب السابق</span>
        </button>

        <span className="text-xs font-black text-slate-500">
          {currentIndex + 1} / {classStudents.length}
        </span>

        <button
          type="button"
          disabled={currentIndex >= classStudents.length - 1}
          onClick={() => {
            triggerHaptic(20);
            setCurrentIndex((prev) => Math.min(classStudents.length - 1, prev + 1));
          }}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer hover:bg-indigo-700"
        >
          <span>الطالب التالي</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
