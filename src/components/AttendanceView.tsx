import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import {
  CheckCheck,
  Calendar,
  GraduationCap,
  Users,
  Search,
  Check,
  X,
  Plus,
  Minus,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const {
    classes,
    students,
    selectedClassId,
    setSelectedClassId,
    selectedDate,
    setSelectedDate,
    getStudentRecordForDate,
    setStudentAttendance,
    incrementEvaluation,
    addStudentNote,
    markAllPresent,
    triggerHaptic,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeNoteStudentId, setActiveNoteStudentId] = useState<string | null>(null);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  const filteredClassStudents = classStudents.filter(
    (s) => s.name.includes(searchQuery) || (s.studentNumber && s.studentNumber.includes(searchQuery))
  );

  // Top summary metrics
  const presentTodayCount = classStudents.filter((s) => {
    const rec = getStudentRecordForDate(s.id, selectedDate);
    return rec && rec.attendance === 'present';
  }).length;

  const absentTodayCount = classStudents.filter((s) => {
    const rec = getStudentRecordForDate(s.id, selectedDate);
    return rec && rec.attendance === 'absent';
  }).length;

  const lateTodayCount = classStudents.filter((s) => {
    const rec = getStudentRecordForDate(s.id, selectedDate);
    return rec && rec.attendance === 'late';
  }).length;

  const participationTodayCount = classStudents.reduce((sum, s) => {
    const rec = getStudentRecordForDate(s.id, selectedDate);
    return sum + (rec?.participations || 0);
  }, 0);

  const handleMarkAllPresent = () => {
    triggerHaptic(50);
    markAllPresent(selectedClassId, selectedDate);
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-200 max-w-lg mx-auto">
      {/* Dedicated Header Card */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm space-y-3">
        {/* Title & Date Selector */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">شاشة التحضير اليومي</h2>
              <p className="text-xs text-zinc-500">حفظ تلقائي لجميع التغييرات والتقييمات</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-2xl">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-emerald-950 font-bold text-xs outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Class Selector Tabs */}
        {classes.length === 0 ? (
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-800 text-xs font-bold text-center">
            لا توجد فصول مضافة حتى الآن. يرجى إضافة فصل جديد للبدء.
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {classes.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const count = students.filter((s) => s.classId === cls.id).length;
              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    triggerHaptic(30);
                    setSelectedClassId(cls.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 border min-h-[44px] ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{cls.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Large Green Button: ✅ تحضير الجميع */}
        <button
          onClick={handleMarkAllPresent}
          disabled={classStudents.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-base py-3.5 px-4 rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-emerald-500 min-h-[50px]"
        >
          <span className="text-lg">✅</span>
          <span>تحضير الجميع</span>
        </button>

        {/* Top Summary Bar: 🟢 Present | 🔴 Absent | 🟡 Late | ⭐ Participation */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-100">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2 text-center">
            <div className="text-sm">🟢</div>
            <div className="text-base font-black text-emerald-950">{presentTodayCount}</div>
            <div className="text-[10px] font-extrabold text-emerald-800">حاضر</div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-2 text-center">
            <div className="text-sm">🔴</div>
            <div className="text-base font-black text-red-950">{absentTodayCount}</div>
            <div className="text-[10px] font-extrabold text-red-800">غائب</div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2 text-center">
            <div className="text-sm">🟡</div>
            <div className="text-base font-black text-amber-950">{lateTodayCount}</div>
            <div className="text-[10px] font-extrabold text-amber-800">متأخر</div>
          </div>

          <div className="bg-amber-100/70 border border-amber-300 rounded-2xl p-2 text-center">
            <div className="text-sm">⭐</div>
            <div className="text-base font-black text-amber-950">{participationTodayCount}</div>
            <div className="text-[10px] font-extrabold text-amber-900">مشاركة</div>
          </div>
        </div>

        {/* Search input for students */}
        {classStudents.length > 3 && (
          <div className="relative pt-1">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث عن اسم الطالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pr-9 pl-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Large Student Cards List */}
      <div className="space-y-3.5">
        {filteredClassStudents.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-zinc-300">
            <Users className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-700">لا يوجد طلاب في هذا الفصل</p>
            <p className="text-xs text-zinc-400 mt-1">قم بإضافة طلاب لهذا الفصل من زر (+)</p>
          </div>
        ) : (
          filteredClassStudents.map((student) => {
            const record = getStudentRecordForDate(student.id, selectedDate);
            return (
              <LargeStudentCard
                key={student.id}
                student={student}
                record={record}
                selectedClassId={selectedClassId}
                selectedDate={selectedDate}
                isNoteActive={activeNoteStudentId === student.id}
                onToggleNote={() =>
                  setActiveNoteStudentId(
                    activeNoteStudentId === student.id ? null : student.id
                  )
                }
              />
            );
          })
        )}
      </div>
    </div>
  );
};

// Sub-component: Large Student Attendance Card
interface LargeStudentCardProps {
  student: Student;
  record: any;
  selectedClassId: string;
  selectedDate: string;
  isNoteActive: boolean;
  onToggleNote: () => void;
}

const LargeStudentCard: React.FC<LargeStudentCardProps> = ({
  student,
  record,
  selectedClassId,
  selectedDate,
  isNoteActive,
  onToggleNote,
}) => {
  const {
    setStudentAttendance,
    incrementEvaluation,
    addStudentNote,
    triggerHaptic,
  } = useApp();

  const attendance = record?.attendance || null;
  const participations = record?.participations || 0;
  const excellences = record?.excellences || 0;
  const violations = record?.violations || 0;
  const warnings = record?.warnings || 0;
  const noteText = record?.notes || '';

  const [localNote, setLocalNote] = useState(noteText);

  const handleAttendanceChange = (status: 'present' | 'absent' | 'late') => {
    triggerHaptic(40);
    setStudentAttendance(student.id, selectedClassId, selectedDate, status);
  };

  const handleNoteSave = (text: string) => {
    setLocalNote(text);
    addStudentNote(student.id, selectedClassId, selectedDate, text);
  };

  return (
    <div
      className={`bg-white rounded-3xl border transition-all p-4.5 shadow-sm space-y-3.5 relative overflow-hidden ${
        attendance === 'present'
          ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/20 to-white'
          : attendance === 'absent'
          ? 'border-red-300 bg-gradient-to-b from-red-50/20 to-white'
          : attendance === 'late'
          ? 'border-amber-300 bg-gradient-to-b from-amber-50/20 to-white'
          : 'border-zinc-200'
      }`}
    >
      {/* 👤 Student Header */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 text-emerald-900 font-black text-lg flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-xs">
            👤
          </div>
          <div>
            <h3 className="text-base font-extrabold text-zinc-900 leading-tight">
              {student.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {(student.studentNumber || student.nationalId) && (
                <span className="text-xs font-bold text-zinc-500">
                  رقم الطالب: {student.studentNumber || student.nationalId}
                </span>
              )}
              {student.medicalNotes && (
                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                  🏥 {student.medicalNotes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicator Badge */}
        <div className="shrink-0">
          {attendance === 'present' && (
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-xl text-xs font-black">
              حاضر 🟢
            </span>
          )}
          {attendance === 'absent' && (
            <span className="bg-red-100 text-red-900 border border-red-300 px-2.5 py-1 rounded-xl text-xs font-black">
              غائب 🔴
            </span>
          )}
          {attendance === 'late' && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-xl text-xs font-black">
              متأخر 🟡
            </span>
          )}
          {!attendance && (
            <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 px-2.5 py-1 rounded-xl text-xs font-bold">
              لم يُحضر
            </span>
          )}
        </div>
      </div>

      {/* 🟢 حاضر | 🔴 غائب | 🟡 متأخر Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleAttendanceChange('present')}
          className={`py-3 px-2 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.96] border min-h-[48px] ${
            attendance === 'present'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-200'
          }`}
        >
          <span className="text-base">🟢</span>
          <span>حاضر</span>
        </button>

        <button
          onClick={() => handleAttendanceChange('absent')}
          className={`py-3 px-2 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.96] border min-h-[48px] ${
            attendance === 'absent'
              ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-300'
              : 'bg-red-50 hover:bg-red-100 text-red-950 border-red-200'
          }`}
        >
          <span className="text-base">🔴</span>
          <span>غائب</span>
        </button>

        <button
          onClick={() => handleAttendanceChange('late')}
          className={`py-3 px-2 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.96] border min-h-[48px] ${
            attendance === 'late'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-200'
          }`}
        >
          <span className="text-base">🟡</span>
          <span>متأخر</span>
        </button>
      </div>

      {/* ⭐ مشاركة | 🏆 تميز | ⚠️ مخالفة | 📢 إنذار Grid */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* ⭐ مشاركة */}
        <div className="bg-amber-50/90 border border-amber-200/80 p-2.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">⭐</span>
            <span className="text-xs font-extrabold text-amber-950">مشاركة</span>
          </div>
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-amber-300 shadow-xs">
            <button
              onClick={() => {
                triggerHaptic(20);
                incrementEvaluation(student.id, selectedClassId, selectedDate, 'participation', -1);
              }}
              className="w-6 h-6 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-black text-xs active:scale-90 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-xs font-black text-amber-950 w-5 text-center">
              {participations}
            </span>
            <button
              onClick={() => {
                triggerHaptic(30);
                incrementEvaluation(student.id, selectedClassId, selectedDate, 'participation', 1);
              }}
              className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs active:scale-90 flex items-center justify-center shadow-xs"
            >
              +
            </button>
          </div>
        </div>

        {/* 🏆 تميز */}
        <div className="bg-emerald-50/90 border border-emerald-200/80 p-2.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🏆</span>
            <span className="text-xs font-extrabold text-emerald-950">تميز</span>
          </div>
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-emerald-300 shadow-xs">
            <button
              onClick={() => {
                triggerHaptic(20);
                incrementEvaluation(student.id, selectedClassId, selectedDate, 'excellence', -1);
              }}
              className="w-6 h-6 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-black text-xs active:scale-90 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-xs font-black text-emerald-950 w-5 text-center">
              {excellences}
            </span>
            <button
              onClick={() => {
                triggerHaptic(30);
                incrementEvaluation(student.id, selectedClassId, selectedDate, 'excellence', 1);
              }}
              className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs active:scale-90 flex items-center justify-center shadow-xs"
            >
              +
            </button>
          </div>
        </div>

        {/* ⚠️ مخالفة */}
        <div className="bg-red-50/90 border border-red-200/80 p-2.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">⚠️</span>
            <span className="text-xs font-extrabold text-red-950">مخالفة</span>
          </div>
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-red-300 shadow-xs">
            <button
              onClick={() => {
                triggerHaptic(20);
                incrementEvaluation(student.id, selectedClassId, selectedDate, 'violation', -1);
              }}
              className="w-6 h-6 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-black text-xs active:scale-90 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-xs font-black text-red-950 w-5 text-center">
              {violations}
            </span>
            <button
              onClick={() => {
                triggerHaptic(30);
                incrementEvaluation(student.id, selectedClassId, selectedDate, 'violation', 1);
              }}
              className="w-6 h-6 rounded-lg bg-red-600 text-white font-black text-xs active:scale-90 flex items-center justify-center shadow-xs"
            >
              +
            </button>
          </div>
        </div>

        {/* 📢 إنذار */}
        <div className="bg-orange-50/90 border border-orange-200/80 p-2.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">📢</span>
            <span className="text-xs font-extrabold text-orange-950">إنذار</span>
          </div>
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-orange-300 shadow-xs">
            <button
              onClick={() => {
                triggerHaptic(20);
                incrementEvaluation(student.id, selectedClassId, selectedDate, 'warning', -1);
              }}
              className="w-6 h-6 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-black text-xs active:scale-90 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-xs font-black text-orange-950 w-5 text-center">
              {warnings}
            </span>
            <button
              onClick={() => {
                triggerHaptic(30);
                incrementEvaluation(student.id, selectedClassId, selectedDate, 'warning', 1);
              }}
              className="w-6 h-6 rounded-lg bg-orange-600 text-white font-black text-xs active:scale-90 flex items-center justify-center shadow-xs"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* 📝 ملاحظة (Inline Note Editor) */}
      <div className="pt-2 border-t border-zinc-100">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={onToggleNote}
            className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
              localNote
                ? 'bg-indigo-100 text-indigo-950 border border-indigo-200'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <span>📝</span>
            <span>{localNote ? `ملاحظة: ${localNote}` : '+ إضافة ملاحظة'}</span>
          </button>
        </div>

        {isNoteActive && (
          <div className="mt-2 space-y-2 animate-in fade-in duration-150 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
            <input
              type="text"
              placeholder="اكتب ملاحظة الطالب هنا (مثل: بدون زي رياضية، عذر طبي)..."
              value={localNote}
              onChange={(e) => {
                setLocalNote(e.target.value);
                handleNoteSave(e.target.value);
              }}
              className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
            />
            <div className="flex flex-wrap gap-1 text-[10px]">
              <button
                onClick={() => handleNoteSave('بدون زي رياضي')}
                className="bg-zinc-200 hover:bg-zinc-300 text-zinc-800 px-2 py-0.5 rounded-lg font-bold"
              >
                👕 بدون زي
              </button>
              <button
                onClick={() => handleNoteSave('أداء مميز بكرة القدم')}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-lg font-bold"
              >
                ⚽ ممتاز
              </button>
              <button
                onClick={() => handleNoteSave('عذر طبي')}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-0.5 rounded-lg font-bold"
              >
                🏥 عذر طبي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
