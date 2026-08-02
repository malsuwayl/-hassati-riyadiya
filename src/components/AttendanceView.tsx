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
  Shirt,
  Star,
  Trophy,
  AlertTriangle,
  MessageSquare,
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
    toggleSportsUniform,
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

  const uniformCompliantCount = classStudents.filter((s) => {
    const rec = getStudentRecordForDate(s.id, selectedDate);
    return rec ? rec.sportsUniform !== false : true;
  }).length;

  const handleMarkAllPresent = () => {
    triggerHaptic(50);
    markAllPresent(selectedClassId, selectedDate);
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-200 max-w-xl mx-auto">
      {/* Header Card */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm space-y-3">
        {/* Title & Date Selector */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">التحضير اليومي ⚽</h2>
              <p className="text-xs text-zinc-500">جدول مدمج - حفظ وإحصائيات فورية</p>
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
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-base py-3 px-4 rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-emerald-500 min-h-[48px]"
        >
          <span className="text-lg">✅</span>
          <span>تحضير جميع طلاب الفصل</span>
        </button>

        {/* Top Summary Bar: 🟢 Present | 🔴 Absent | 🟡 Late | 👕 Sports Uniform */}
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

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-2 text-center">
            <div className="text-sm">👕</div>
            <div className="text-base font-black text-blue-950">{uniformCompliantCount}</div>
            <div className="text-[10px] font-extrabold text-blue-800">ملتزم بالزي</div>
          </div>
        </div>

        {/* Search input */}
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

      {/* Compact Responsive Attendance Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <h3 className="text-xs font-extrabold text-zinc-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>جدول التحضير ({filteredClassStudents.length} طالب)</span>
          </h3>
          <span className="text-[10px] text-zinc-400 font-bold">حفظ مباشر دون فتح بطاقات</span>
        </div>

        {filteredClassStudents.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-zinc-200 rounded-2xl">
            <Users className="w-8 h-8 text-zinc-300 mx-auto mb-1" />
            <p className="text-xs font-bold text-zinc-600">لا يوجد طلاب في هذا الفصل</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar rounded-2xl border border-zinc-100">
            <table className="w-full text-right text-xs border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-zinc-50 text-zinc-700 font-extrabold border-b border-zinc-200">
                  <th className="py-3 px-2 text-center w-10">الرقم</th>
                  <th className="py-3 px-3 min-w-[150px]">اسم الطالب</th>
                  <th className="py-3 px-2 text-center min-w-[140px]">التحضير (حاضر / غائب)</th>
                  <th className="py-3 px-2 text-center min-w-[85px]">متأخر</th>
                  <th className="py-3 px-2 text-center min-w-[95px]">الزي الرياضي</th>
                  <th className="py-3 px-2 min-w-[160px]">ملاحظات والتقييم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-800">
                {filteredClassStudents.map((student, idx) => {
                  const record = getStudentRecordForDate(student.id, selectedDate);
                  const attendance = record?.attendance || null;
                  const isUniformCompliant = record ? record.sportsUniform !== false : true;

                  const isPresent = attendance === 'present';
                  const isAbsent = attendance === 'absent';
                  const isLate = attendance === 'late';

                  const rowBg = isPresent
                    ? 'bg-emerald-50/30'
                    : isAbsent
                    ? 'bg-red-50/30'
                    : isLate
                    ? 'bg-amber-50/30'
                    : '';

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-zinc-100/60 transition-colors ${rowBg}`}
                    >
                      {/* 1. الرقم */}
                      <td className="py-2.5 px-2 text-center font-bold text-zinc-400">
                        {idx + 1}
                      </td>

                      {/* 2. اسم الطالب */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-zinc-900 leading-tight">
                            {student.name}
                          </span>
                          {student.medicalNotes && (
                            <span
                              title={student.medicalNotes}
                              className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded font-extrabold shrink-0"
                            >
                              🏥
                            </span>
                          )}
                        </div>
                        {student.studentNumber && (
                          <div className="text-[10px] text-zinc-400">#{student.studentNumber}</div>
                        )}
                      </td>

                      {/* 3. الحضور (حاضر / غائب) */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              triggerHaptic(40);
                              setStudentAttendance(student.id, selectedClassId, selectedDate, 'present');
                            }}
                            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-90 border min-h-[38px] min-w-[62px] ${
                              isPresent
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-1 ring-emerald-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-200'
                            }`}
                          >
                            🟢 حاضر
                          </button>

                          <button
                            onClick={() => {
                              triggerHaptic(40);
                              setStudentAttendance(student.id, selectedClassId, selectedDate, 'absent');
                            }}
                            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-90 border min-h-[38px] min-w-[62px] ${
                              isAbsent
                                ? 'bg-red-600 text-white border-red-600 shadow-sm ring-1 ring-red-300'
                                : 'bg-red-50 hover:bg-red-100 text-red-950 border-red-200'
                            }`}
                          >
                            🔴 غائب
                          </button>
                        </div>
                      </td>

                      {/* 4. متأخر */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => {
                            triggerHaptic(40);
                            const nextStatus = isLate ? 'present' : 'late';
                            setStudentAttendance(student.id, selectedClassId, selectedDate, nextStatus);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-90 border min-h-[38px] ${
                            isLate
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm ring-1 ring-amber-300'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-200'
                          }`}
                        >
                          🟡 متأخر
                        </button>
                      </td>

                      {/* 5. الزي الرياضي */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => {
                            triggerHaptic(30);
                            toggleSportsUniform(student.id, selectedClassId, selectedDate);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-90 border min-h-[38px] inline-flex items-center gap-1 ${
                            isUniformCompliant
                              ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                              : 'bg-red-100 text-red-900 border-red-300 hover:bg-red-200'
                          }`}
                        >
                          <Shirt className={`w-3.5 h-3.5 ${isUniformCompliant ? 'text-blue-600' : 'text-red-600'}`} />
                          <span>{isUniformCompliant ? 'ملتزم' : 'بدون زي'}</span>
                        </button>
                      </td>

                      {/* 6. ملاحظات والتقييم */}
                      <td className="py-2.5 px-2">
                        <RowNotesAndEvaluations
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Subcomponent for compact inline row notes & evaluations (+⭐ / +🏆 / +⚠️)
interface RowNotesAndEvaluationsProps {
  student: Student;
  record: any;
  selectedClassId: string;
  selectedDate: string;
  isNoteActive: boolean;
  onToggleNote: () => void;
}

const RowNotesAndEvaluations: React.FC<RowNotesAndEvaluationsProps> = ({
  student,
  record,
  selectedClassId,
  selectedDate,
  isNoteActive,
  onToggleNote,
}) => {
  const { incrementEvaluation, addStudentNote, triggerHaptic } = useApp();
  const [localNote, setLocalNote] = useState(record?.notes || '');

  const participations = record?.participations || 0;
  const excellences = record?.excellences || 0;
  const violations = record?.violations || 0;

  const handleNoteSave = (val: string) => {
    setLocalNote(val);
    addStudentNote(student.id, selectedClassId, selectedDate, val);
  };

  return (
    <div className="space-y-1">
      {/* Quick note input or quick note toggle */}
      <div className="flex items-center gap-1">
        <input
          type="text"
          placeholder="ملاحظة..."
          value={localNote}
          onChange={(e) => handleNoteSave(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-1 text-[11px] font-semibold outline-none focus:border-emerald-500"
        />

        {/* Evaluation Buttons (+⭐, +🏆, +⚠️) */}
        <button
          onClick={() => {
            triggerHaptic(20);
            incrementEvaluation(student.id, selectedClassId, selectedDate, 'participation', 1);
          }}
          title="إضافة مشاركة (+1)"
          className="px-1.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-[10px] shrink-0 active:scale-90 border border-amber-200"
        >
          ⭐ {participations > 0 ? participations : '+'}
        </button>

        <button
          onClick={() => {
            triggerHaptic(20);
            incrementEvaluation(student.id, selectedClassId, selectedDate, 'excellence', 1);
          }}
          title="إضافة تميز (+1)"
          className="px-1.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-[10px] shrink-0 active:scale-90 border border-emerald-200"
        >
          🏆 {excellences > 0 ? excellences : '+'}
        </button>

        <button
          onClick={() => {
            triggerHaptic(20);
            incrementEvaluation(student.id, selectedClassId, selectedDate, 'violation', 1);
          }}
          title="إضافة مخالفة (+1)"
          className="px-1.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-950 font-black text-[10px] shrink-0 active:scale-90 border border-red-200"
        >
          ⚠️ {violations > 0 ? violations : '+'}
        </button>
      </div>

      {/* Quick tags */}
      <div className="flex flex-wrap gap-1 text-[9px]">
        <button
          onClick={() => handleNoteSave('بدون زي رياضي')}
          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded font-bold"
        >
          👕 بدون زي
        </button>
        <button
          onClick={() => handleNoteSave('عذر طبي')}
          className="bg-amber-50 hover:bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold"
        >
          🏥 عذر
        </button>
      </div>
    </div>
  );
};
