import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  evaluateMeasurementValue,
  calculateStudentFitnessSummary,
} from '../utils/measurementUtils';
import { generateStatisticsPDFReport } from '../utils/pdfExport';
import { Trophy, Award, CheckCircle, Activity, Shirt, Users, BarChart2, PieChart as PieIcon, Download } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

export const StatisticsView: React.FC = () => {
  const {
    classes,
    students,
    selectedClassId,
    setSelectedClassId,
    dailyLogs,
    incentiveRecords,
    assessments,
    grades,
    measurementItems,
    measurementValues,
    settings,
    showToast,
    setSelectedStudentId,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'leaderboards'>('overview');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportStatsPDF = async () => {
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    setIsExportingPDF(true);
    showToast('جاري إعداد تقرير الإحصائيات بصيغة PDF...', 'info');
    try {
      await generateStatisticsPDFReport(
        selectedClass,
        students,
        dailyLogs,
        measurementItems,
        measurementValues,
        incentiveRecords,
        assessments,
        grades,
        settings
      );
      showToast('تم تحميل تقرير الإحصائيات بنجاح 📄', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء تصدير إحصائيات PDF', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // Overall Attendance Stats for Selected Class
  const classStudentIds = classStudents.map((s) => s.id);
  const classLogs = dailyLogs.filter((l) => classStudentIds.includes(l.studentId));
  const totalClassLogs = classLogs.length;
  const presentLogs = classLogs.filter((l) => l.attendance === 'present').length;
  const absentLogs = classLogs.filter((l) => l.attendance === 'absent').length;
  const lateLogs = classLogs.filter((l) => l.attendance === 'late').length;
  const uniformViolations = classLogs.filter((l) => l.attendance === 'present' && l.uniform === false).length;

  const attendanceRate = totalClassLogs > 0 ? Math.round((presentLogs / totalClassLogs) * 100) : 100;

  // Recharts Attendance Data
  const attendanceChartData = [
    { name: 'حضور', value: presentLogs, fill: '#10b981' },
    { name: 'غياب', value: absentLogs, fill: '#f43f5e' },
    { name: 'تأخر', value: lateLogs, fill: '#f59e0b' },
    { name: 'مخالف زي', value: uniformViolations, fill: '#8b5cf6' },
  ];

  // Overall Grades Stats for Selected Class
  let totalClassGradesSum = 0;
  const totalAssMax = assessments.reduce((sum, a) => sum + a.maxScore, 0);

  classStudents.forEach((st) => {
    const stScores = grades[st.id] || {};
    assessments.forEach((ass) => {
      const score = stScores[ass.id];
      if (score !== undefined && !isNaN(score)) {
        totalClassGradesSum += score;
      }
    });
  });

  const classGradesAvg =
    classStudents.length > 0 && totalAssMax > 0
      ? (totalClassGradesSum / classStudents.length).toFixed(1)
      : '0';

  // Fitness Levels Breakdown Data
  const fitnessCounts: Record<string, number> = {
    'ممتاز': 0,
    'جيد جداً': 0,
    'جيد': 0,
    'مقبول': 0,
    'ضعيف': 0,
  };

  classStudents.forEach((st) => {
    const fit = calculateStudentFitnessSummary(st.id, measurementItems, measurementValues);
    const lvl = fit.ratingLevel || 'مقبول';
    if (fitnessCounts[lvl] !== undefined) {
      fitnessCounts[lvl]++;
    } else {
      fitnessCounts['مقبول']++;
    }
  });

  const fitnessChartData = [
    { level: 'ممتاز', count: fitnessCounts['ممتاز'], fill: '#10b981' },
    { level: 'جيد جداً', count: fitnessCounts['جيد جداً'], fill: '#06b6d4' },
    { level: 'جيد', count: fitnessCounts['جيد'], fill: '#3b82f6' },
    { level: 'مقبول', count: fitnessCounts['مقبول'], fill: '#f59e0b' },
    { level: 'ضعيف', count: fitnessCounts['ضعيف'], fill: '#f43f5e' },
  ];

  // Grades per Assessment Chart Data
  const assessmentGradesData = assessments.map((ass) => {
    let sum = 0;
    let count = 0;
    classStudents.forEach((st) => {
      const sc = (grades[st.id] || {})[ass.id];
      if (sc !== undefined && !isNaN(sc)) {
        sum += sc;
        count++;
      }
    });
    const avg = count > 0 ? (sum / count).toFixed(1) : 0;
    return {
      name: ass.title,
      'متوسط الدرجة': parseFloat(String(avg)),
      'الدرجة العظمى': ass.maxScore,
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 font-sans space-y-4">
      {/* Top Class Selector & Sub-tabs */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-black text-zinc-600 whitespace-nowrap">الفصل:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 text-zinc-900 font-extrabold text-sm rounded-xl px-3 py-2 outline-none"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportStatsPDF}
            disabled={isExportingPDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="تصدير تقرير الإحصائيات بصيغة PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isExportingPDF ? 'جاري التصدير...' : 'تصدير PDF'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            الرسوم البيانية والملخص 📊
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('leaderboards')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'leaderboards'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            أوائل البدنية والرياضة 🏆
          </button>
        </div>
      </div>

      {activeSubTab === 'overview' ? (
        <div className="space-y-4">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs text-right space-y-1">
              <span className="text-[11px] font-extrabold text-zinc-500 block">نسبة الحضور</span>
              <span className="text-2xl font-black text-emerald-700">{attendanceRate}%</span>
              <span className="text-[10px] font-bold text-zinc-400 block">
                {presentLogs} حضور / {absentLogs} غياب
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs text-right space-y-1">
              <span className="text-[11px] font-extrabold text-zinc-500 block">مخالفات الزي</span>
              <span className="text-2xl font-black text-purple-700">{uniformViolations}</span>
              <span className="text-[10px] font-bold text-zinc-400 block">مرصدة بالفصل</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs text-right space-y-1">
              <span className="text-[11px] font-extrabold text-zinc-500 block">متوسط الدرجات</span>
              <span className="text-2xl font-black text-amber-700">
                {classGradesAvg} / {totalAssMax}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 block">من {totalAssMax} درجة</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs text-right space-y-1">
              <span className="text-[11px] font-extrabold text-zinc-500 block">عدد الطلاب</span>
              <span className="text-2xl font-black text-zinc-900">{classStudents.length}</span>
              <span className="text-[10px] font-bold text-zinc-400 block">طالب مقيد</span>
            </div>
          </div>

          {/* VISUAL CHARTS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Chart 1: Fitness Levels Distribution */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h3 className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>توزيع مستويات اللياقة البدنية</span>
                </h3>
                <span className="text-[10px] font-bold text-zinc-400">توزيع الفصل</span>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fitnessChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="level" tick={{ fontSize: 10, fontWeight: 800, fill: '#52525b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} طالب`, 'عدد الطلاب']}
                      labelStyle={{ fontWeight: 800, textAlign: 'right' }}
                      contentStyle={{ borderRadius: '12px', borderColor: '#e4e4e7', fontSize: '11px' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {fitnessChartData.map((entry, idx) => (
                        <Cell key={`fit-cell-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Attendance & Uniform Breakdown */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h3 className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-indigo-600" />
                  <span>تحليل الحضور والمخالفات المرصدة</span>
                </h3>
                <span className="text-[10px] font-bold text-zinc-400">سجلات الإحصاء</span>
              </div>

              <div className="h-56 w-full pt-2">
                {totalClassLogs === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-400 font-bold">
                    لا توجد سجلات حضور مرصدة بعد لهذا الفصل
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceChartData.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {attendanceChartData.map((entry, index) => (
                          <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${val} مرصد`, 'السجلات']}
                        contentStyle={{ borderRadius: '12px', borderColor: '#e4e4e7', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 800 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Chart 3: Assessment Performance Comparison */}
          {assessmentGradesData.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h3 className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-amber-600" />
                  <span>مقارنة متوسط درجات الاختبارات والتقييمات</span>
                </h3>
                <span className="text-[10px] font-bold text-zinc-400">درجات التقييم المقارنة</span>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assessmentGradesData} margin={{ top: 10, right: 10, left: -10, bottom: 15 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 800, fill: '#52525b' }} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} درجة`, name]}
                      labelStyle={{ fontWeight: 800, textAlign: 'right' }}
                      contentStyle={{ borderRadius: '12px', borderColor: '#e4e4e7', fontSize: '11px' }}
                    />
                    <Bar dataKey="متوسط الدرجة" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="الدرجة العظمى" fill="#e4e4e7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Fitness Levels Distribution List */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-black text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>ترتيب اللياقة والبدن للفصل</span>
            </h3>

            <div className="divide-y divide-zinc-100 text-xs font-bold">
              {classStudents.map((st, idx) => {
                const fit = calculateStudentFitnessSummary(st.id, measurementItems, measurementValues);
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentId(st.id)}
                    className="py-2.5 flex items-center justify-between hover:bg-zinc-50 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-black text-zinc-400">{idx + 1}</span>
                      <span className="font-extrabold text-zinc-900">{st.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-zinc-600 font-black">
                        {fit.totalScore} / {fit.totalMaxPossible}د
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-extrabold text-[11px]">
                        {fit.ratingLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Leaderboards View per Measurement Item */
        <div className="space-y-4">
          {measurementItems.map((item) => {
            // Rank students for this measurement item
            const rankedStudents = classStudents
              .map((st) => {
                const val = (measurementValues[st.id] || {})[item.id];
                const evalRes = evaluateMeasurementValue(val, item);
                const numVal = parseFloat(String(val || '0')) || 0;
                return {
                  student: st,
                  rawVal: val,
                  numVal,
                  evalRes,
                };
              })
              .filter((entry) => entry.rawVal !== undefined && entry.rawVal !== '')
              .sort((a, b) => {
                if (item.betterDirection === 'lower') {
                  return a.numVal - b.numVal; // Lower is better (e.g. 50m sprint)
                } else {
                  return b.numVal - a.numVal; // Higher is better (e.g. Pushups)
                }
              });

            const top3 = rankedStudents.slice(0, 3);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h3 className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>أفضل النتائج: {item.name} ({item.unit})</span>
                  </h3>
                  <span className="text-[10px] font-extrabold text-zinc-500">
                    {item.betterDirection === 'lower' ? 'الأقل زمناً هو الأفضل' : 'الأعلى أداءً هو الأفضل'}
                  </span>
                </div>

                {top3.length === 0 ? (
                  <p className="text-xs text-zinc-400 font-bold text-center py-2">
                    لم يُسجل أي نتائج لهذا العنصر بعد
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {top3.map((entry, idx) => {
                      const medals = ['🥇 المركز الأول', '🥈 المركز الثاني', '🥉 المركز الثالث'];
                      const medalBgs = [
                        'bg-amber-50 border-amber-200 text-amber-950',
                        'bg-zinc-50 border-zinc-200 text-zinc-950',
                        'bg-orange-50 border-orange-200 text-orange-950',
                      ];

                      return (
                        <div
                          key={entry.student.id}
                          onClick={() => setSelectedStudentId(entry.student.id)}
                          className={`p-3 rounded-xl border ${medalBgs[idx]} flex flex-col justify-between cursor-pointer`}
                        >
                          <span className="text-[10px] font-black">{medals[idx]}</span>
                          <span className="text-xs font-black truncate my-1">
                            {entry.student.name}
                          </span>
                          <span className="text-sm font-black text-emerald-800">
                            {String(entry.rawVal)} {item.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

