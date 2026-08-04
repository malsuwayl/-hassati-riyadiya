import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Award,
  Search,
  Plus,
  Trash2,
  ThumbsUp,
  AlertTriangle,
  Flame,
  User,
  Medal,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { generateIncentivesPDFReport } from '../utils/pdfExport';

export const IncentivesView: React.FC = () => {
  const {
    classes,
    students,
    selectedClassId,
    setSelectedClassId,
    selectedDate,
    incentiveRecords,
    addIncentiveRecord,
    deleteIncentiveRecord,
    getStudentIncentiveSummary,
    setSelectedStudentId,
    triggerHaptic,
    settings,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleExportIncentivesPDF = async () => {
    if (!activeClass) return;
    setIsExportingPDF(true);
    showToast('جاري إنشاء تقرير بنك التحفيز والمخالفات PDF...', 'info');
    try {
      const classSts = students.filter((s) => s.classId === activeClass.id);
      await generateIncentivesPDFReport(
        activeClass,
        classSts,
        incentiveRecords,
        settings
      );
      showToast('تم تحميل تقرير بنك التحفيز والمخالفات PDF بنجاح 📄', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء إنشاء الملف', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Filter students
  const filteredStudents = students
    .filter((s) => (selectedClassId ? s.classId === selectedClassId : true))
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  // Calculate stats
  let totalPositive = 0;
  let totalNegative = 0;
  let totalPointsSchool = 0;

  incentiveRecords.forEach((r) => {
    totalPointsSchool += r.points;
    if (r.type === 'positive') totalPositive++;
    else totalNegative++;
  });

  // Calculate student ranks / leaderboard
  const studentRankings = students
    .map((st) => {
      const summary = getStudentIncentiveSummary(st.id);
      const cls = classes.find((c) => c.id === st.classId);
      return {
        student: st,
        className: cls?.name || 'فصل غير محدد',
        ...summary,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const top3Students = studentRankings.slice(0, 3).filter((s) => s.totalPoints > 0);

  const handleQuickAdd = (studentId: string, title: string, points: number, type: 'positive' | 'negative') => {
    triggerHaptic(35);
    addIncentiveRecord({
      studentId,
      date: selectedDate,
      type,
      points,
      title,
    });
  };

  return (
    <div className="space-y-4 font-sans text-right pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-4 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight">بنك التحفيز والمخالفات</h2>
              <p className="text-xs text-emerald-100 font-bold">تسجيل نقاط التميز، المشاركات، والتعزيز السلوكي</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportIncentivesPDF}
              disabled={isExportingPDF}
              className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer disabled:opacity-50"
              title="تصدير كشف بنك التحفيز والمخالفات كملف PDF"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>{isExportingPDF ? 'جاري...' : 'تصدير PDF 📄'}</span>
            </button>

            <div className="bg-white/15 px-3 py-1.5 rounded-xl text-center border border-white/10">
              <span className="text-[10px] font-bold block text-emerald-100">صافي النقاط</span>
              <span className="text-base font-black text-amber-200">{totalPointsSchool > 0 ? `+${totalPointsSchool}` : totalPointsSchool}</span>
            </div>
          </div>
        </div>

        {/* Global Stats bar */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/15 text-xs font-black">
          <div className="bg-white/10 p-2 rounded-xl flex items-center justify-between">
            <span className="text-emerald-100 text-[11px]">إجمالي التحفيزات الإيجابية:</span>
            <span className="bg-emerald-500/30 px-2 py-0.5 rounded text-amber-200">{totalPositive}</span>
          </div>

          <div className="bg-white/10 p-2 rounded-xl flex items-center justify-between">
            <span className="text-emerald-100 text-[11px]">إجمالي التنبيهات والمخالفات:</span>
            <span className="bg-rose-500/30 px-2 py-0.5 rounded text-rose-200">{totalNegative}</span>
          </div>
        </div>
      </div>

      {/* Top Performers Leaderboard (لوحة الشرف) */}
      {top3Students.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
            <Flame className="w-4 h-4 text-amber-600" />
            <span>لوحة الشرف للمتميزين (أعلى نقاط):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {top3Students.map((rank, idx) => (
              <div
                key={rank.student.id}
                onClick={() => setSelectedStudentId(rank.student.id)}
                className="bg-white border border-amber-200/80 p-2.5 rounded-xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-900 leading-tight">{rank.student.name}</h4>
                    <p className="text-[10px] font-bold text-zinc-500">{rank.className}</p>
                  </div>
                </div>

                <div className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-black">
                  +{rank.totalPoints}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls Bar: Class Filter & Search */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="bg-white border border-zinc-200 text-xs font-black rounded-xl px-3 py-2 outline-none text-zinc-800"
        >
          <option value="">جميع الفصول ({students.length} طالب)</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[150px]">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن طالب..."
            className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-xl pr-8 pl-3 py-2 outline-none"
          />
        </div>
      </div>

      {/* Students List with Fast Award Buttons */}
      <div className="space-y-2">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-zinc-200 text-zinc-400 font-bold text-xs space-y-1">
            <p>لا يوجد طلاب مطبقين للفلاتر المحددة</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const summary = getStudentIncentiveSummary(student.id);
            const isExpanded = expandedStudentId === student.id;

            return (
              <div
                key={student.id}
                className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-2xs hover:border-zinc-300 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-zinc-900 hover:text-emerald-700 transition-colors">
                        {student.name}
                      </h3>
                      <span className="text-[10px] font-bold text-zinc-400">
                        سجل السلوك: {summary.positiveCount} تحفيز | {summary.negativeCount} تنبيه
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Points Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${
                        summary.totalPoints > 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : summary.totalPoints < 0
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{summary.totalPoints > 0 ? `+${summary.totalPoints}` : summary.totalPoints} نقطة</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 bg-zinc-50 rounded-lg cursor-pointer"
                      title="عرض سجل التحفيز"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Action Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(student.id, 'مشاركة متميزة', 1, 'positive')}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-colors"
                  >
                    ⭐ مشاركة (+1)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAdd(student.id, 'روح رياضية عالية', 1, 'positive')}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-colors"
                  >
                    🏆 روح رياضية (+1)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAdd(student.id, 'مساعدة وتنظيم الأدوات', 1, 'positive')}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-colors"
                  >
                    🤝 تنظيم (+1)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAdd(student.id, 'تميز ومهارة بدنية', 2, 'positive')}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-colors"
                  >
                    🥇 تميز (+2)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAdd(student.id, 'عدم الالتزام بالتعليمات', -1, 'negative')}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-colors"
                  >
                    ⚠️ مخالفة (-1)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStudentId(student.id)}
                    className="mr-auto text-[11px] font-black text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                  >
                    الملف الكامل...
                  </button>
                </div>

                {/* Expanded Log History for this Student */}
                {isExpanded && (
                  <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-xl space-y-2 mt-2">
                    <h4 className="text-[11px] font-black text-zinc-700">سجل النقاط المسجلة للطالب:</h4>
                    {summary.records.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 font-bold py-2 text-center">لا توجد نقاط أو تنبيهات مسجلة لهذا الطالب</p>
                    ) : (
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {summary.records.map((rec) => (
                          <div
                            key={rec.id}
                            className={`p-1.5 rounded-lg border flex items-center justify-between text-[11px] ${
                              rec.type === 'positive'
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                : 'bg-rose-50/70 border-rose-200 text-rose-950'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                  rec.type === 'positive' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                }`}
                              >
                                {rec.points > 0 ? `+${rec.points}` : rec.points}
                              </span>
                              <span className="font-extrabold">{rec.title}</span>
                              <span className="text-[9px] text-zinc-400">({rec.date})</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic(20);
                                deleteIncentiveRecord(rec.id);
                              }}
                              className="text-zinc-400 hover:text-rose-600 p-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
