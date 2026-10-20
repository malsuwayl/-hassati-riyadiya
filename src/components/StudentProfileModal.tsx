import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateBMI,
  evaluateMeasurementValue,
  calculateStudentFitnessSummary,
} from '../utils/measurementUtils';
import {
  generateStudentIndividualPDFReport,
  generateStudentAttendanceAndUniformPDFReport,
  getArabicDayName,
} from '../utils/pdfExport';
import { cleanImportedString } from '../utils/fileImportExport';
import {
  X,
  CheckCircle,
  Award,
  Activity,
  FileText,
  HeartPulse,
  Sparkles,
  Plus,
  Trash2,
  ThumbsUp,
  AlertTriangle,
  Download,
  Edit2,
  Calendar,
  Shirt,
  Clock,
  Check,
} from 'lucide-react';

export const StudentProfileModal: React.FC = () => {
  const {
    students,
    classes,
    selectedStudentId,
    setSelectedStudentId,
    dailyLogs,
    assessments,
    grades,
    measurementItems,
    measurementValues,
    incentiveRecords,
    settings,
    showToast,
    updateStudent,
    addIncentiveRecord,
    deleteIncentiveRecord,
    getStudentIncentiveSummary,
    selectedDate,
    triggerHaptic,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'attendance' | 'grades' | 'measurements' | 'incentives' | 'medical' | 'teacher'
  >('attendance');

  const [medNotes, setMedNotes] = useState('');
  const [tchNotes, setTchNotes] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customPoints, setCustomPoints] = useState<number>(1);
  const [customType, setCustomType] = useState<'positive' | 'negative'>('positive');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingAttendancePDF, setIsExportingAttendancePDF] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'absent' | 'no_uniform' | 'late'>('all');

  const student = students.find((s) => s.id === selectedStudentId);

  useEffect(() => {
    if (student) {
      setMedNotes(cleanImportedString(student.medicalNotes) || '');
      setTchNotes(cleanImportedString(student.teacherNotes) || '');
    }
  }, [student]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStudentId) {
        setSelectedStudentId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudentId, setSelectedStudentId]);

  if (!selectedStudentId || !student) return null;

  const studentClass = classes.find((c) => c.id === student.classId);

  // Attendance (sorted newest first)
  const studentLogs = dailyLogs
    .filter((l) => l.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const totalLogs = studentLogs.length;
  const presentLogs = studentLogs.filter((l) => l.attendance === 'present').length;
  const absentLogs = studentLogs.filter((l) => l.attendance === 'absent').length;
  const lateLogs = studentLogs.filter((l) => l.attendance === 'late').length;
  const uniformViolations = studentLogs.filter((l) => l.uniform === false).length;

  // Filtered attendance logs for list view
  const displayedAttendanceLogs = studentLogs.filter((log) => {
    if (attendanceFilter === 'absent') return log.attendance === 'absent';
    if (attendanceFilter === 'no_uniform') return log.uniform === false;
    if (attendanceFilter === 'late') return log.attendance === 'late';
    return true;
  });

  // Grades
  const studentScores = grades[student.id] || {};
  let totalGradeEarned = 0;
  let totalGradeMax = 0;

  assessments.forEach((ass) => {
    totalGradeMax += ass.maxScore;
    const score = studentScores[ass.id];
    if (score !== undefined && !isNaN(score)) {
      totalGradeEarned += score;
    }
  });

  // Measurements
  const stMeasVals = measurementValues[student.id] || {};
  const heightVal = parseFloat(String(stMeasVals['m-height'] || ''));
  const weightVal = parseFloat(String(stMeasVals['m-weight'] || ''));
  const bmiRes = calculateBMI(heightVal, weightVal);
  const fitnessSummary = calculateStudentFitnessSummary(student.id, measurementItems, measurementValues);

  const handleSaveNotes = () => {
    updateStudent(student.id, {
      medicalNotes: medNotes.trim(),
      teacherNotes: tchNotes.trim(),
    });
    showToast('تم حفظ بيانات وملاحظات الطالب بنجاح', 'success');
  };

  const handleExportStudentPDF = async () => {
    if (!student) return;
    setIsExportingPDF(true);
    showToast('جاري تصدير التقرير الفردي الشامل للطالب بصيغة PDF...', 'info');
    try {
      await generateStudentIndividualPDFReport(
        student,
        studentClass,
        dailyLogs,
        measurementItems,
        measurementValues,
        incentiveRecords,
        assessments,
        grades,
        settings
      );
      showToast('تم تحميل التقرير الشامل للطالب بنجاح 📄', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء تصدير PDF للطالب', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportAttendanceAndUniformPDF = async () => {
    if (!student) return;
    setIsExportingAttendancePDF(true);
    showToast('جاري إعداد وتصدير كشف تواريخ الغياب والزي الرياضي...', 'info');
    try {
      await generateStudentAttendanceAndUniformPDFReport(
        student,
        studentClass,
        dailyLogs,
        settings
      );
      showToast('تم تحميل كشف الغياب والزي بالتواريخ بنجاح 🎽', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء تصدير كشف الغياب والزي', 'error');
    } finally {
      setIsExportingAttendancePDF(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSelectedStudentId(null);
      }}
    >
      <div className="bg-white rounded-2xl border border-zinc-200 max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-2xs">
              {student.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-black text-zinc-900 truncate">{student.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] font-bold text-zinc-500 truncate">{studentClass?.name || 'فصل مجهول'}</p>
                {student.nationalId && (
                  <span className="text-[10px] font-bold text-zinc-400">({student.nationalId})</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportAttendanceAndUniformPDF}
              disabled={isExportingAttendancePDF}
              className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="طباعة وتصدير كشف تواريخ الغياب ومخالفات الزي بالتفصيل"
            >
              <Shirt className="w-3.5 h-3.5 text-purple-700" />
              <span>{isExportingAttendancePDF ? 'تصدير...' : 'كشف الزي والغياب 🎽'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportStudentPDF}
              disabled={isExportingPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="تصدير تقرير الطالب الشامل بصيغة PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? 'تصدير...' : 'التقرير الشامل 📄'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStudentId(null)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 bg-white border border-zinc-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6 Profile Tabs */}
        <div className="grid grid-cols-6 border-b border-zinc-200 text-center bg-white text-[10px] sm:text-[11px] font-black">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-2 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'attendance'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            التحضير
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('grades')}
            className={`py-2 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'grades'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            الدرجات
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('measurements')}
            className={`py-2 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'measurements'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            القياسات
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('incentives')}
            className={`py-2 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'incentives'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            التحفيز
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('medical')}
            className={`py-2 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'medical'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            الصحة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            className={`py-2 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'teacher'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            ملاحظات
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-right">
          {/* TAB 1: ATTENDANCE & UNIFORM LOG */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              {/* Quick Action & Official Print */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-purple-50 via-slate-50 to-emerald-50 border border-purple-200/80 p-2.5 rounded-xl">
                <div className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-700" />
                  <span>سجل مواظبة وزي الطالب ({totalLogs} حصة مسجلة)</span>
                </div>

                <button
                  type="button"
                  onClick={handleExportAttendanceAndUniformPDF}
                  disabled={isExportingAttendancePDF}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  title="طباعة وتصدير كشف رسمي بتواريخ الغياب ومخالفات الزي"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingAttendancePDF ? 'جاري التحميل...' : 'طباعة كشف الغياب والزي (PDF) 📄'}</span>
                </button>
              </div>

              {/* KPI Cards Row - Clickable to filter */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-black">
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('all')}
                  className={`border p-2 rounded-xl transition-all cursor-pointer ${
                    attendanceFilter === 'all'
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-950 shadow-xs'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60'
                  }`}
                >
                  <span className="text-base font-black block">{presentLogs}</span>
                  <span className="text-[10px]">حاضر</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceFilter('absent')}
                  className={`border p-2 rounded-xl transition-all cursor-pointer ${
                    attendanceFilter === 'absent'
                      ? 'bg-rose-100 border-rose-400 text-rose-950 shadow-xs'
                      : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/60'
                  }`}
                >
                  <span className="text-base font-black block">{absentLogs}</span>
                  <span className="text-[10px]">غائب</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceFilter('no_uniform')}
                  className={`border p-2 rounded-xl transition-all cursor-pointer ${
                    attendanceFilter === 'no_uniform'
                      ? 'bg-purple-100 border-purple-400 text-purple-950 shadow-xs'
                      : 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100/60'
                  }`}
                >
                  <span className="text-base font-black block">{uniformViolations}</span>
                  <span className="text-[10px]">بدون زي 🎽</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceFilter('late')}
                  className={`border p-2 rounded-xl transition-all cursor-pointer ${
                    attendanceFilter === 'late'
                      ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                      : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/60'
                  }`}
                >
                  <span className="text-base font-black block">{lateLogs}</span>
                  <span className="text-[10px]">متأخر</span>
                </button>
              </div>

              {/* Sub-Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-black">
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    attendanceFilter === 'all'
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  الكل ({totalLogs})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('absent')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    attendanceFilter === 'absent'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <span>🔴 تواريخ الغياب ({absentLogs})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('no_uniform')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    attendanceFilter === 'no_uniform'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <Shirt className="w-3 h-3" />
                  <span>تواريخ بدون زي ({uniformViolations})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('late')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    attendanceFilter === 'late'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  ⏰ التأخر ({lateLogs})
                </button>
              </div>

              {/* Detailed Dates List */}
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-zinc-700 px-1">
                  <span>
                    {attendanceFilter === 'absent'
                      ? '🔴 قائمة تواريخ أيام الغياب:'
                      : attendanceFilter === 'no_uniform'
                      ? '🎽 قائمة تواريخ عدم إحضار الزي الرياضي:'
                      : attendanceFilter === 'late'
                      ? '⏰ قائمة تواريخ التأخر:'
                      : 'سجل الحصص اليومي بالتاريخ واليوم:'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold">
                    ({displayedAttendanceLogs.length} حصة)
                  </span>
                </div>

                {displayedAttendanceLogs.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-white border border-zinc-100 space-y-1">
                    <p className="text-xs font-black text-emerald-700">
                      {attendanceFilter === 'absent'
                        ? '✨ الطالب لم يسجل أي يوم غياب ولله الحمد!'
                        : attendanceFilter === 'no_uniform'
                        ? '✨ الطالب ملتزم دائماً بإحضار الزي الرياضي الكامل!'
                        : attendanceFilter === 'late'
                        ? '✨ الطالب منضبط ولا يوجد أي تأخر مسجل!'
                        : 'لا توجد سجلات حضور مسجلة لهذا الطالب حتى الآن'}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-bold">
                      يمكنك تحضير الطالب ورصد الزي من صفحة التحضير اليومي
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-0.5">
                    {displayedAttendanceLogs.map((log, i) => {
                      const dayName = getArabicDayName(log.date);
                      const isAbsent = log.attendance === 'absent';
                      const isLate = log.attendance === 'late';
                      const isExcused = log.attendance === 'excused';
                      const isNoUniform = log.uniform === false;

                      return (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl border transition-colors flex flex-col gap-1.5 ${
                            isAbsent
                              ? 'bg-rose-50/70 border-rose-200'
                              : isNoUniform
                              ? 'bg-purple-50/70 border-purple-200'
                              : isLate
                              ? 'bg-amber-50/70 border-amber-200'
                              : 'bg-white border-zinc-200/80 hover:bg-zinc-50/80'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-black">
                            {/* Date & Day */}
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                              <span className="text-zinc-900 font-black">
                                {dayName ? <strong className="text-emerald-700">{dayName}</strong> : ''} {log.date}
                              </span>
                            </div>

                            {/* Attendance Status Badge */}
                            <div className="flex items-center gap-1.5">
                              {isAbsent ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white">
                                  غائب ✕
                                </span>
                              ) : isLate ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white">
                                  متأخر ⏰
                                </span>
                              ) : isExcused ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-600 text-white">
                                  معذور 📄
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white">
                                  حاضر ✓
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Uniform & Notes Row */}
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold pt-0.5 border-t border-zinc-100">
                            {/* Uniform Badge */}
                            <div className="flex items-center gap-1">
                              {isAbsent ? (
                                <span className="text-zinc-400 text-[10px]">غائب (لم يحضر)</span>
                              ) : isNoUniform ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
                                  <Shirt className="w-3 h-3 text-purple-700" />
                                  <span>لم يحضر الزي الرياضي ❌</span>
                                </span>
                              ) : log.uniform === true ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>ملتزم بالزي الرياضي ✅</span>
                                </span>
                              ) : (
                                <span className="text-zinc-400 text-[10px]">الزي: غير محدد</span>
                              )}
                            </div>

                            {/* Notes */}
                            {log.notes && (
                              <span className="text-[10px] font-bold text-zinc-600 bg-white/80 px-2 py-0.5 rounded border border-zinc-200">
                                💬 {log.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GRADES */}
          {activeTab === 'grades' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-xs font-black text-amber-950">مجموع درجات المادة:</span>
                <span className="text-sm font-black text-amber-800">
                  {totalGradeEarned} / {totalGradeMax}
                </span>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 divide-y divide-zinc-200 text-xs font-bold">
                {assessments.map((ass) => {
                  const score = studentScores[ass.id];
                  return (
                    <div key={ass.id} className="py-2 flex justify-between">
                      <span className="text-zinc-800">{ass.name}</span>
                      <span className="text-zinc-950 font-black">
                        {score !== undefined ? `${score} / ${ass.maxScore}` : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MEASUREMENTS */}
          {activeTab === 'measurements' && (
            <div className="space-y-3">
              {bmiRes && (
                <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl flex justify-between items-center text-xs font-black text-sky-950">
                  <span>كتلة الجسم (BMI): {bmiRes.bmi}</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-sky-200">{bmiRes.statusAr}</span>
                </div>
              )}

              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 divide-y divide-zinc-200 text-xs font-bold">
                {measurementItems.map((item) => {
                  const val = stMeasVals[item.id];
                  const evalRes = evaluateMeasurementValue(val, item);

                  return (
                    <div key={item.id} className="py-2 flex justify-between">
                      <span className="text-zinc-800">{item.name} ({item.unit})</span>
                      <span className="text-zinc-950 font-black">
                        {val !== undefined && val !== '' ? (
                          <span>
                            {String(val)} {evalRes && <span className="text-emerald-700">[{evalRes.levelName}]</span>}
                          </span>
                        ) : (
                          '-'
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: INCENTIVES & VIOLATIONS (بنك التحفيز والمخالفات) */}
          {activeTab === 'incentives' && (
            <div className="space-y-4">
              {(() => {
                const incSummary = getStudentIncentiveSummary(student.id);
                return (
                  <>
                    {/* Points Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-emerald-600 p-3 rounded-xl text-white flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[11px] font-bold block opacity-90">مجموع نقاط الطالب في بنك التحفيز</span>
                        <div className="text-xl font-black flex items-center gap-1.5">
                          <Sparkles className="w-5 h-5 text-amber-200" />
                          <span>{incSummary.totalPoints > 0 ? `+${incSummary.totalPoints}` : incSummary.totalPoints} نقطة</span>
                        </div>
                      </div>

                      <div className="flex gap-2 text-center text-xs font-black">
                        <div className="bg-white/20 px-2.5 py-1 rounded-lg">
                          <span className="block text-emerald-100 text-[10px]">إيجابي</span>
                          <span>{incSummary.positiveCount}</span>
                        </div>
                        <div className="bg-white/20 px-2.5 py-1 rounded-lg">
                          <span className="block text-rose-200 text-[10px]">مخالفات</span>
                          <span>{incSummary.negativeCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-zinc-600 block">إضافة سريعة لبنك التحفيز:</label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(30);
                            addIncentiveRecord({
                              studentId: student.id,
                              date: selectedDate,
                              type: 'positive',
                              points: 1,
                              title: 'مشاركة متميزة',
                            });
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>⭐ مشاركة (+1)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(30);
                            addIncentiveRecord({
                              studentId: student.id,
                              date: selectedDate,
                              type: 'positive',
                              points: 1,
                              title: 'روح رياضية عالية',
                            });
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>🏆 روح رياضية (+1)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(30);
                            addIncentiveRecord({
                              studentId: student.id,
                              date: selectedDate,
                              type: 'positive',
                              points: 1,
                              title: 'مساعدة وتنظيم الأدوات',
                            });
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>🤝 تنظيم وتألق (+1)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(30);
                            addIncentiveRecord({
                              studentId: student.id,
                              date: selectedDate,
                              type: 'positive',
                              points: 2,
                              title: 'تميز مهاري وبدني',
                            });
                          }}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>🥇 تفوق مهاري (+2)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(30);
                            addIncentiveRecord({
                              studentId: student.id,
                              date: selectedDate,
                              type: 'negative',
                              points: -1,
                              title: 'عدم الالتزام بالتعليمات',
                            });
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>⚠️ عدم التزام (-1)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(30);
                            addIncentiveRecord({
                              studentId: student.id,
                              date: selectedDate,
                              type: 'negative',
                              points: -1,
                              title: 'تأخر عن الحصة',
                            });
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>⏱️ تأخر (-1)</span>
                        </button>
                      </div>
                    </div>

                    {/* Custom Add Form */}
                    <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl space-y-2">
                      <label className="text-[11px] font-black text-zinc-700 block">إضافة بند مخصص:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="سبب التحفيز أو المخالفة..."
                          className="flex-1 bg-white border border-zinc-200 px-2.5 py-1 text-xs font-bold rounded-lg outline-none"
                        />
                        <select
                          value={customType}
                          onChange={(e) => setCustomType(e.target.value as any)}
                          className="bg-white border border-zinc-200 text-xs font-extrabold rounded-lg px-2 py-1"
                        >
                          <option value="positive">إيجابي (+)</option>
                          <option value="negative">مخالفة (-)</option>
                        </select>
                        <input
                          type="number"
                          value={customPoints}
                          onChange={(e) => setCustomPoints(Number(e.target.value))}
                          className="w-14 bg-white border border-zinc-200 px-2 py-1 text-xs font-bold text-center rounded-lg outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!customTitle.trim()) return;
                            triggerHaptic(30);
                            addIncentiveRecord({
                              studentId: student.id,
                              date: selectedDate,
                              type: customType,
                              points: customType === 'negative' ? -Math.abs(customPoints) : Math.abs(customPoints),
                              title: customTitle.trim(),
                            });
                            setCustomTitle('');
                          }}
                          className="bg-zinc-900 hover:bg-black text-white px-3 py-1 rounded-lg text-xs font-black cursor-pointer"
                        >
                          إضافة
                        </button>
                      </div>
                    </div>

                    {/* Records History */}
                    <div className="space-y-2 pt-2 border-t border-zinc-100">
                      <label className="text-[11px] font-black text-zinc-600 block">سجل التحفيز والمخالفات المسجلة:</label>
                      {incSummary.records.length === 0 ? (
                        <p className="text-xs text-zinc-400 font-bold text-center py-4 bg-zinc-50 rounded-xl">
                          لا توجد نقاط أو مخالفات مسجلة لهذا الطالب بعد
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {incSummary.records.map((rec) => (
                            <div
                              key={rec.id}
                              className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                                rec.type === 'positive'
                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                  : 'bg-rose-50/60 border-rose-200 text-rose-950'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                                    rec.type === 'positive'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-rose-600 text-white'
                                  }`}
                                >
                                  {rec.points > 0 ? `+${rec.points}` : rec.points}
                                </span>
                                <div>
                                  <span className="font-extrabold block">{rec.title}</span>
                                  <span className="text-[10px] text-zinc-400 font-bold block">{rec.date}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(20);
                                  deleteIncentiveRecord(rec.id);
                                }}
                                className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                                title="حذف هذا السجل"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 4: MEDICAL NOTES */}
          {activeTab === 'medical' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-amber-900 block mb-1">
                  الملاحظات والحالات الصحية الخاصة (ربو، كدمات، عذر طبي):
                </label>
                <textarea
                  value={medNotes}
                  onChange={(e) => setMedNotes(e.target.value)}
                  rows={4}
                  placeholder="اكتب الملاحظات الصحية إن وجدت..."
                  className="w-full bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-xs font-bold text-amber-950 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveNotes}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                حفظ الملاحظة الصحية
              </button>
            </div>
          )}

          {/* TAB 5: TEACHER NOTES */}
          {activeTab === 'teacher' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-zinc-800 block mb-1">
                  ملاحظات وتوصيات المعلم السلوكية والمهارية:
                </label>
                <textarea
                  value={tchNotes}
                  onChange={(e) => setTchNotes(e.target.value)}
                  rows={4}
                  placeholder="ملاحظات المعلم الفردية حول الطالب..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-bold outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveNotes}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                حفظ التعديلات وملاحظات المعلم
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

