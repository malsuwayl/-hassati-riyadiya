import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateBMI,
  evaluateMeasurementValue,
  calculateStudentFitnessSummary,
} from '../utils/measurementUtils';
import { generateStudentIndividualPDFReport } from '../utils/pdfExport';
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
  Fingerprint,
  Edit2,
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
  const [fpId, setFpId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customPoints, setCustomPoints] = useState<number>(1);
  const [customType, setCustomType] = useState<'positive' | 'negative'>('positive');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const student = students.find((s) => s.id === selectedStudentId);

  useEffect(() => {
    if (student) {
      setMedNotes(student.medicalNotes || '');
      setTchNotes(student.teacherNotes || '');
      setFpId(student.fingerprintId || '');
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

  // Attendance
  const studentLogs = dailyLogs.filter((l) => l.studentId === student.id);
  const totalLogs = studentLogs.length;
  const presentLogs = studentLogs.filter((l) => l.attendance === 'present').length;
  const absentLogs = studentLogs.filter((l) => l.attendance === 'absent').length;
  const lateLogs = studentLogs.filter((l) => l.attendance === 'late').length;
  const uniformViolations = studentLogs.filter((l) => l.attendance === 'present' && l.uniform === false).length;

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
      fingerprintId: fpId.trim() || undefined,
    });
    showToast('تم حفظ بيانات وملاحظات الطالب بنجاح', 'success');
  };

  const handleExportStudentPDF = async () => {
    if (!student) return;
    setIsExportingPDF(true);
    showToast('جاري تصدير التقرير الفردي للطالب بصيغة PDF...', 'info');
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
      showToast('تم تحميل التقرير الفردي للطالب بنجاح 📄', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء تصدير PDF للطالب', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSelectedStudentId(null);
      }}
    >
      <div className="bg-white rounded-2xl border border-zinc-200 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-black text-zinc-900">{student.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs font-bold text-zinc-500">{studentClass?.name || 'فصل مجهول'}</p>
                {student.fingerprintId ? (
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Fingerprint className="w-2.5 h-2.5" />
                    بصمة #{student.fingerprintId}
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400 font-medium">بدون بصمة</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportStudentPDF}
              disabled={isExportingPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="تصدير تقرير الطالب الشامل بصيغة PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? 'جاري التصدير...' : 'تقرير PDF'}</span>
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
          {/* TAB 1: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-black">
                <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-emerald-800">
                  <span className="text-base font-black block">{presentLogs}</span>
                  <span className="text-[10px]">حاضر</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl text-rose-800">
                  <span className="text-base font-black block">{absentLogs}</span>
                  <span className="text-[10px]">غائب</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl text-amber-800">
                  <span className="text-base font-black block">{lateLogs}</span>
                  <span className="text-[10px]">متأخر</span>
                </div>
                <div className="bg-purple-50 border border-purple-200 p-2 rounded-xl text-purple-800">
                  <span className="text-base font-black block">{uniformViolations}</span>
                  <span className="text-[10px]">بدون زي</span>
                </div>
              </div>

              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                <span className="text-xs font-black text-zinc-700 block">سجل الحضور اليومي:</span>
                {studentLogs.length === 0 ? (
                  <p className="text-xs text-zinc-400 font-bold">لا توجد سجلات حضور حتى الآن</p>
                ) : (
                  studentLogs.map((l, i) => (
                    <div key={i} className="flex justify-between text-xs font-bold py-1 border-b border-zinc-200/60">
                      <span>تاريخ {l.date}</span>
                      <span className={l.attendance === 'present' ? 'text-emerald-700' : 'text-rose-700'}>
                        {l.attendance === 'present' ? 'حاضر' : l.attendance === 'absent' ? 'غائب' : 'متأخر'}
                      </span>
                    </div>
                  ))
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
                        {score !== undefined ? `${score} / ${ass.maxScore}` : 'غير مرصود'}
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
                          'غير مقاس'
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

          {/* TAB 5: TEACHER NOTES & BIOMETRIC */}
          {activeTab === 'teacher' && (
            <div className="space-y-3">
              <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl space-y-1">
                <label className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-teal-700" />
                  <span>رقم البصمة في جهاز الحضور البيومتري (PIN / ID):</span>
                </label>
                <input
                  type="text"
                  value={fpId}
                  onChange={(e) => setFpId(e.target.value)}
                  placeholder="مثال: 101 أو رقم الهوية..."
                  className="w-full bg-white border border-teal-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-teal-950 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

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

