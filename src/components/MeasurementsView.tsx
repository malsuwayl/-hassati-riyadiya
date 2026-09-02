import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MeasurementUnit, MeasurementInputType } from '../types';
import {
  calculateBMI,
  evaluateMeasurementValue,
  calculateStudentFitnessSummary,
} from '../utils/measurementUtils';
import {
  Plus,
  Trash2,
  Settings2,
  BarChart2,
  Table,
  Trophy,
  Award,
  Medal,
  Flame,
  Sparkles,
  FileText,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { generateMeasurementsPDFReport } from '../utils/pdfExport';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export const MeasurementsView: React.FC = () => {
  const {
    classes,
    students,
    selectedClassId,
    setSelectedClassId,
    measurementItems,
    measurementValues,
    addMeasurementItem,
    deleteMeasurementItem,
    setStudentMeasurementValue,
    updateMeasurementRanges,
    triggerHaptic,
    setSelectedStudentId,
    showToast,
    settings,
    forceSaveAll,
    saveStatus,
  } = useApp();

  const [viewMode, setViewMode] = useState<'sheet' | 'analytics' | 'ranges'>('sheet');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'overall' | 'single'>('overall');
  const [selectedSingleItemId, setSelectedSingleItemId] = useState<string>(
    measurementItems[0]?.id || ''
  );
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleExportMeasurementsPDF = async () => {
    if (!activeClass) return;
    setIsExportingPDF(true);
    showToast('جاري إنشاء تقرير القياسات اللياقية PDF...', 'info');
    try {
      const classSts = students.filter((s) => s.classId === activeClass.id);
      await generateMeasurementsPDFReport(
        activeClass,
        classSts,
        measurementItems,
        measurementValues,
        settings
      );
      showToast('تم تحميل تقرير القياسات البدنية PDF بنجاح 📄', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء إنشاء ملف PDF', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };
  const [selectedItemIdForRanges, setSelectedItemIdForRanges] = useState<string>(
    measurementItems[0]?.id || ''
  );

  // New Item Form
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<MeasurementUnit>('seconds');
  const [newItemType, setNewItemType] = useState<MeasurementInputType>('number');
  const [newItemBetter, setNewItemBetter] = useState<'higher' | 'lower'>('lower');

  // Score Ranges Editing State
  const activeRangeItem = measurementItems.find((i) => i.id === selectedItemIdForRanges) || measurementItems[0];
  const [tempRanges, setTempRanges] = useState<
    { minVal: number; maxVal: number; score: number; levelName: string }[]
  >([]);

  // Keep tempRanges synced with activeRangeItem
  useEffect(() => {
    if (activeRangeItem?.gradingRanges && activeRangeItem.gradingRanges.length > 0) {
      setTempRanges(activeRangeItem.gradingRanges.map((r) => ({ ...r })));
    } else {
      setTempRanges([
        { minVal: 0, maxVal: 10, score: 10, levelName: 'ممتاز' },
        { minVal: 10.1, maxVal: 20, score: 8, levelName: 'جيد جداً' },
        { minVal: 20.1, maxVal: 30, score: 6, levelName: 'جيد' },
        { minVal: 30.1, maxVal: 40, score: 4, levelName: 'مقبول' },
        { minVal: 40.1, maxVal: 60, score: 2, levelName: 'ضعيف' },
      ]);
    }
  }, [activeRangeItem?.id]);

  const classStudents = students.filter((s) => s.classId === selectedClassId);

  const handleAddNewRangeRow = () => {
    triggerHaptic(15);
    setTempRanges([
      ...tempRanges,
      { minVal: 0, maxVal: 0, score: 0, levelName: 'مستوى جديد' },
    ]);
  };

  const handleDeleteRangeRow = (index: number) => {
    triggerHaptic(20);
    setTempRanges(tempRanges.filter((_, i) => i !== index));
  };

  const handleDeleteMeasurementItem = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف عنصر القياس "${name}"؟`)) {
      triggerHaptic(30);
      deleteMeasurementItem(id);
    }
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    addMeasurementItem({
      name: newItemName.trim(),
      unit: newItemUnit,
      inputType: newItemType,
      betterDirection: newItemBetter,
      maxGrade: 10,
    });

    setNewItemName('');
    setIsAddingItem(false);
  };

  const handleSaveRanges = () => {
    if (!activeRangeItem) return;
    const formatted = tempRanges.map((r, i) => ({ id: `r-${i}`, ...r }));
    updateMeasurementRanges(activeRangeItem.id, formatted);
    triggerHaptic(30);
    showToast('تم حفظ معايير المستويات بنجاح', 'success');
  };

  // Compute Analytics
  const studentSummaries = classStudents.map((st) => {
    const summary = calculateStudentFitnessSummary(st.id, measurementItems, measurementValues);
    const stVals = measurementValues[st.id] || {};
    const h = parseFloat(String(stVals['m-height'] || ''));
    const w = parseFloat(String(stVals['m-weight'] || ''));
    const bmi = calculateBMI(h, w);

    return {
      student: st,
      summary,
      bmi,
    };
  });

  const sortedByScore = [...studentSummaries].sort(
    (a, b) => b.summary.totalScore - a.summary.totalScore
  );

  const top10 = sortedByScore.slice(0, 10);
  const needsImprovement = sortedByScore
    .filter((s) => s.summary.ratingLevel === 'ضعيف' || s.summary.ratingLevel === 'مقبول')
    .slice(0, 10);

  const bestStudent = sortedByScore[0];
  const worstStudent = sortedByScore[sortedByScore.length - 1];

  const totalPossibleScores = studentSummaries.reduce((sum, s) => sum + s.summary.totalScore, 0);
  const classAvgScore =
    studentSummaries.length > 0 ? (totalPossibleScores / studentSummaries.length).toFixed(1) : '0';

  // BMI Distribution
  const bmiStats = {
    normal: studentSummaries.filter((s) => s.bmi?.statusAr === 'وزن طبيعي').length,
    underweight: studentSummaries.filter((s) => s.bmi?.statusAr === 'نقص بالوزن').length,
    overweight: studentSummaries.filter((s) => s.bmi?.statusAr === 'زيادة بالوزن').length,
    obese: studentSummaries.filter((s) => s.bmi?.statusAr === 'سمنة').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-3 py-3 font-sans space-y-3">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl p-3 border border-zinc-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-black text-zinc-700">الفصل:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 text-zinc-900 font-extrabold text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('sheet')}
            className={`px-3 py-1 text-xs font-black rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
              viewMode === 'sheet'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>جدول القياسات</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('analytics')}
            className={`px-3 py-1 text-xs font-black rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
              viewMode === 'analytics'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>التحليلات البدنية</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('ranges')}
            className={`px-3 py-1 text-xs font-black rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
              viewMode === 'ranges'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>معايير المستويات</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Save Button */}
          <button
            type="button"
            onClick={forceSaveAll}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 border ${
              saveStatus === 'saving'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
            }`}
            title="حفظ فوري لبيانات القياسات البدنية"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600" />
            <span>{saveStatus === 'saving' ? 'جاري الحفظ...' : 'حفظ البيانات 💾'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportMeasurementsPDF}
            disabled={isExportingPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
            title="تصدير كشف القياسات البدنية كملف PDF"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>{isExportingPDF ? 'جاري...' : 'تصدير PDF 📄'}</span>
          </button>
        </div>
      </div>

      {/* SPREADSHEET VIEW */}
      {viewMode === 'sheet' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setIsAddingItem(!isAddingItem);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة عنصر قياس</span>
            </button>
          </div>

          {isAddingItem && (
            <form
              onSubmit={handleCreateItem}
              className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2 text-right"
            >
              <h3 className="text-xs font-black text-emerald-950">إضافة عنصر قياس بدني</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-600 block mb-1">اسم العنصر</label>
                  <input
                    type="text"
                    placeholder="مثال: الرشاقة"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-600 block mb-1">الوحدة</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as MeasurementUnit)}
                    className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none"
                  >
                    <option value="seconds">ثواني</option>
                    <option value="cm">سم</option>
                    <option value="kg">كجم</option>
                    <option value="count">تكرار</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-600 block mb-1">المعيار</label>
                  <select
                    value={newItemBetter}
                    onChange={(e) => setNewItemBetter(e.target.value as 'higher' | 'lower')}
                    className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none"
                  >
                    <option value="lower">الأقل أفضل</option>
                    <option value="higher">الأعلى أفضل</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-1 bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black cursor-pointer"
                >
                  حفظ
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-zinc-100/80 text-zinc-800 text-xs font-black border-b border-zinc-200">
                  <th className="p-2.5 w-8 text-center border-l border-zinc-200">#</th>
                  <th className="p-2.5 min-w-[140px] border-l border-zinc-200">اسم الطالب</th>
                  {measurementItems.map((item) => (
                    <th key={item.id} className="p-2 text-center border-l border-zinc-200 min-w-[100px] group">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteMeasurementItem(item.id, item.name)}
                          className="text-zinc-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                          title="إلغاء/حذف هذا العنصر"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-center flex-1">
                          <span>{item.name}</span>
                          <span className="text-[10px] font-bold text-zinc-400 block">({item.unit})</span>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="p-2.5 text-center bg-sky-50 text-sky-950 font-black min-w-[90px] border-l border-zinc-200">
                    BMI
                  </th>
                  <th className="p-2.5 text-center bg-emerald-50 text-emerald-950 font-black min-w-[100px]">
                    التقييم العام
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 text-xs font-bold text-zinc-800">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={measurementItems.length + 4} className="p-6 text-center text-zinc-400 font-bold">
                      لا يوجد طلاب في هذا الفصل
                    </td>
                  </tr>
                ) : (
                  classStudents.map((st, idx) => {
                    const stVals = measurementValues[st.id] || {};
                    const heightVal = parseFloat(String(stVals['m-height'] || ''));
                    const weightVal = parseFloat(String(stVals['m-weight'] || ''));
                    const bmiRes = calculateBMI(heightVal, weightVal);
                    const fitnessSummary = calculateStudentFitnessSummary(st.id, measurementItems, measurementValues);

                    return (
                      <tr key={st.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-2 text-center text-zinc-400 font-black border-l border-zinc-100">{idx + 1}</td>
                        <td className="p-2 border-l border-zinc-100">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(st.id)}
                            className="font-extrabold text-zinc-900 hover:text-emerald-700 text-right truncate block cursor-pointer"
                          >
                            {st.name}
                          </button>
                        </td>

                        {measurementItems.map((item) => {
                          const val = stVals[item.id] ?? '';
                          const evalRes = evaluateMeasurementValue(val, item);

                          return (
                            <td key={item.id} className="p-1 text-center border-l border-zinc-100">
                              <input
                                type="text"
                                value={val}
                                placeholder="-"
                                onChange={(e) => setStudentMeasurementValue(st.id, item.id, e.target.value)}
                                className="w-16 text-center font-extrabold text-xs py-1 bg-zinc-50 border border-zinc-200 rounded focus:border-emerald-600 outline-none"
                              />
                              {evalRes && (
                                <span className="text-[9px] font-black text-emerald-700 block mt-0.5">
                                  {evalRes.levelName}
                                </span>
                              )}
                            </td>
                          );
                        })}

                        <td className="p-2 text-center bg-sky-50/50 text-sky-950 font-black border-l border-zinc-100">
                          {bmiRes ? `${bmiRes.bmi}` : '-'}
                        </td>

                        <td className="p-2 text-center bg-emerald-50/50 text-emerald-950 font-black">
                          {fitnessSummary.ratingLevel}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {viewMode === 'analytics' && (
        <div className="space-y-4">
          {/* Analytics Mode Switcher */}
          <div className="bg-white p-2 rounded-xl border border-zinc-200 flex items-center justify-between gap-2">
            <span className="text-xs font-black text-zinc-700 px-2">وضع التحليل البدني:</span>
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg text-xs font-black">
              <button
                type="button"
                onClick={() => setAnalyticsSubTab('overall')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  analyticsSubTab === 'overall'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                القياسات كاملة (الأداء الشامل)
              </button>
              <button
                type="button"
                onClick={() => setAnalyticsSubTab('single')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  analyticsSubTab === 'single'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                قياس واحد محدد (ترتيب العنصر)
              </button>
            </div>
          </div>

          {/* MODE 1: OVERALL FITNESS ANALYTICS */}
          {analyticsSubTab === 'overall' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
                  <span className="text-[10px] font-black text-zinc-400 block">متوسط نقاط الفصل</span>
                  <span className="text-xl font-black text-emerald-700">{classAvgScore} نقطة</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
                  <span className="text-[10px] font-black text-zinc-400 block">🏆 بطل الفصل باللياقة</span>
                  <span className="text-xs font-black text-amber-600 truncate block mt-1">
                    {bestStudent ? bestStudent.student.name : '-'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
                  <span className="text-[10px] font-black text-zinc-400 block">أقل طالب باللياقة</span>
                  <span className="text-xs font-black text-rose-700 truncate block mt-1">
                    {worstStudent ? worstStudent.student.name : '-'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
                  <span className="text-[10px] font-black text-zinc-400 block">وزن طبيعي (BMI)</span>
                  <span className="text-xl font-black text-sky-700">{bmiStats.normal} طلاب</span>
                </div>
              </div>

              {/* Overall Score Recharts Bar Chart */}
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h3 className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-emerald-600" />
                    <span>رسم بياني: أداء الطلاب الشامل بالقياسات البدنية</span>
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-400">نقاط اللياقة الكلية</span>
                </div>

                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sortedByScore.map((s) => ({
                        name: s.student.name,
                        score: s.summary.totalScore,
                        level: s.summary.ratingLevel,
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fontWeight: 800, fill: '#52525b' }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                      <Tooltip
                        formatter={(val: any) => [`${val} نقطة`, 'النقاط الكلية']}
                        labelStyle={{ fontWeight: 800, textAlign: 'right' }}
                        contentStyle={{ borderRadius: '12px', borderColor: '#e4e4e7', fontSize: '11px' }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {sortedByScore.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              index === 0
                                ? '#f59e0b'
                                : index === 1
                                ? '#10b981'
                                : index === 2
                                ? '#06b6d4'
                                : '#6366f1'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 10 Podium & Needs Improvement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 space-y-2 shadow-2xs">
                  <h3 className="text-xs font-black text-emerald-800 border-b border-zinc-100 pb-2 flex items-center justify-between">
                    <span>🏆 ترتيب متصاعد الأوائل (Top 10)</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </h3>
                  <div className="divide-y divide-zinc-100 text-xs font-extrabold">
                    {top10.map((st, i) => (
                      <div
                        key={st.student.id}
                        onClick={() => setSelectedStudentId(st.student.id)}
                        className="py-2 flex items-center justify-between hover:bg-zinc-50 px-1 rounded-lg cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              i === 0
                                ? 'bg-amber-100 text-amber-800'
                                : i === 1
                                ? 'bg-zinc-200 text-zinc-800'
                                : i === 2
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="text-zinc-900 font-black">{st.student.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700 font-black">{st.summary.totalScore} نقطة</span>
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                            {st.summary.ratingLevel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 space-y-2 shadow-2xs">
                  <h3 className="text-xs font-black text-rose-800 border-b border-zinc-100 pb-2">
                    ⚠️ الطلاب بحاجة لمتابعة وتحسين بدني
                  </h3>
                  <div className="divide-y divide-zinc-100 text-xs font-extrabold">
                    {needsImprovement.length === 0 ? (
                      <p className="text-zinc-400 py-4 text-center text-xs">جميع الطلاب بمستويات بدنية ممتازة وجيدة جداً 👍</p>
                    ) : (
                      needsImprovement.map((st) => (
                        <div
                          key={st.student.id}
                          onClick={() => setSelectedStudentId(st.student.id)}
                          className="py-2 flex items-center justify-between hover:bg-rose-50/50 px-1 rounded-lg cursor-pointer"
                        >
                          <span className="text-zinc-900 font-black">{st.student.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-rose-700 font-black">{st.summary.totalScore} نقطة</span>
                            <span className="bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                              {st.summary.ratingLevel}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: SINGLE MEASUREMENT ITEM ANALYTICS */}
          {analyticsSubTab === 'single' && (
            <div className="space-y-4">
              {/* Selector Bar */}
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  <label className="text-xs font-black text-amber-950">اختر عنصر القياس لعرض الترتيب والرسم البياني:</label>
                </div>
                <select
                  value={selectedSingleItemId}
                  onChange={(e) => setSelectedSingleItemId(e.target.value)}
                  className="bg-white border border-amber-300 text-zinc-900 text-xs font-black rounded-xl px-3 py-1.5 outline-none shadow-2xs"
                >
                  {measurementItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.unit})
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const activeSingleItem =
                  measurementItems.find((i) => i.id === selectedSingleItemId) || measurementItems[0];

                if (!activeSingleItem) {
                  return (
                    <div className="bg-white p-6 rounded-2xl text-center text-zinc-400 font-bold text-xs border">
                      لا يوجد عناصر قياس متاحة
                    </div>
                  );
                }

                const singleRanked = classStudents
                  .map((st) => {
                    const val = (measurementValues[st.id] || {})[activeSingleItem.id];
                    const evalRes = evaluateMeasurementValue(val, activeSingleItem);
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
                    if (activeSingleItem.betterDirection === 'lower') {
                      return a.numVal - b.numVal; // Lower is better (e.g. 30m Sprint)
                    } else {
                      return b.numVal - a.numVal; // Higher is better (e.g. Pushups)
                    }
                  });

                const top3 = singleRanked.slice(0, 3);

                return (
                  <div className="space-y-4">
                    {/* Top 3 Winner Podium for this Single Measurement */}
                    <div className="bg-white p-4 rounded-2xl border border-zinc-200 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <h3 className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-500" />
                          <span>أبطال عنصر: {activeSingleItem.name} ({activeSingleItem.unit})</span>
                        </h3>
                        <span className="text-[10px] font-extrabold text-zinc-500">
                          {activeSingleItem.betterDirection === 'lower' ? 'الأقل زمناً هو الأفضل' : 'الأعلى نتيجة هي الأفضل'}
                        </span>
                      </div>

                      {top3.length === 0 ? (
                        <p className="text-xs text-zinc-400 font-bold text-center py-4 bg-zinc-50 rounded-xl">
                          لم يتم إدخال نتائج هذا العنصر لطلاب الفصل بعد
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {top3.map((entry, idx) => {
                            const medals = ['🥇 المركز الأول (البطل)', '🥈 المركز الثاني', '🥉 المركز الثالث'];
                            const medalBgs = [
                              'bg-gradient-to-br from-amber-50 to-amber-100/60 border-amber-300 text-amber-950',
                              'bg-zinc-50 border-zinc-300 text-zinc-950',
                              'bg-orange-50 border-orange-200 text-orange-950',
                            ];

                            return (
                              <div
                                key={entry.student.id}
                                onClick={() => setSelectedStudentId(entry.student.id)}
                                className={`p-3.5 rounded-2xl border ${medalBgs[idx]} flex flex-col justify-between cursor-pointer shadow-2xs hover:scale-[1.01] transition-transform`}
                              >
                                <span className="text-[11px] font-black block">{medals[idx]}</span>
                                <h4 className="text-sm font-black truncate my-1.5">{entry.student.name}</h4>
                                <div className="flex items-center justify-between pt-1 border-t border-black/5">
                                  <span className="text-base font-black text-emerald-800">
                                    {String(entry.rawVal)} {activeSingleItem.unit}
                                  </span>
                                  {entry.evalRes && (
                                    <span className="bg-white/80 px-2 py-0.5 rounded text-[10px] font-black border border-black/10">
                                      {entry.evalRes.levelName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Single Measurement Recharts Bar Chart */}
                    {singleRanked.length > 0 && (
                      <div className="bg-white p-4 rounded-2xl border border-zinc-200 space-y-3 shadow-2xs">
                        <h3 className="text-xs font-black text-zinc-900 border-b border-zinc-100 pb-2">
                          📊 مقارنة نتائج الطلاب في ({activeSingleItem.name})
                        </h3>

                        <div className="h-60 w-full pt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={singleRanked.map((item) => ({
                                name: item.student.name,
                                value: item.numVal,
                                level: item.evalRes?.levelName || '-',
                              }))}
                              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fontWeight: 800, fill: '#52525b' }}
                                interval={0}
                                angle={-25}
                                textAnchor="end"
                              />
                              <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                              <Tooltip
                                formatter={(val: any) => [`${val} ${activeSingleItem.unit}`, activeSingleItem.name]}
                                labelStyle={{ fontWeight: 800, textAlign: 'right' }}
                                contentStyle={{ borderRadius: '12px', borderColor: '#e4e4e7', fontSize: '11px' }}
                              />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {singleRanked.map((_, index) => (
                                  <Cell
                                    key={`cell-single-${index}`}
                                    fill={
                                      index === 0
                                        ? '#f59e0b'
                                        : index === 1
                                        ? '#10b981'
                                        : index === 2
                                        ? '#3b82f6'
                                        : '#8b5cf6'
                                    }
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Full Ranking Table for Single Measurement */}
                    <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 space-y-2 shadow-2xs">
                      <h3 className="text-xs font-black text-zinc-800 border-b border-zinc-100 pb-2">
                        📋 الترتيب الكامل للطلاب في ({activeSingleItem.name})
                      </h3>
                      <div className="divide-y divide-zinc-100 text-xs font-extrabold">
                        {singleRanked.map((item, idx) => (
                          <div
                            key={item.student.id}
                            onClick={() => setSelectedStudentId(item.student.id)}
                            className="py-2 flex items-center justify-between hover:bg-zinc-50 px-2 rounded-lg cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 text-center font-black text-zinc-400">{idx + 1}</span>
                              <span className="font-extrabold text-zinc-900">{item.student.name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-black text-emerald-800">
                                {String(item.rawVal)} {activeSingleItem.unit}
                              </span>
                              {item.evalRes && (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black">
                                  {item.evalRes.levelName}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* RANGES EDITOR VIEW */}
      {viewMode === 'ranges' && (
        <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-4 text-right">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black text-zinc-700">حدد عنصر القياس:</label>
              <select
                value={selectedItemIdForRanges}
                onChange={(e) => {
                  setSelectedItemIdForRanges(e.target.value);
                }}
                className="bg-zinc-50 border border-zinc-200 text-xs font-extrabold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
              >
                {measurementItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddNewRangeRow}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مستوى جديد (+)</span>
              </button>

              {activeRangeItem && (
                <button
                  type="button"
                  onClick={() => handleDeleteMeasurementItem(activeRangeItem.id, activeRangeItem.name)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  title="إلغاء/حذف هذا العنصر"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إلغاء البند</span>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-2">
            <h3 className="text-xs font-black text-zinc-900">
              تحديد درجات ومستويات المعايير (ممتاز، جيد جداً، جيد، مقبول، ضعيف)
            </h3>
            <p className="text-[11px] font-bold text-zinc-500 mt-0.5">
              يمكنك تخصيص المدى الرقمي لكل مستوى والدرجة المستحقة للطالب
            </p>
          </div>

          <div className="space-y-2">
            {tempRanges.map((r, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 items-center">
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-500 block mb-1">اسم المستوى</label>
                  <input
                    type="text"
                    value={r.levelName}
                    placeholder="مثال: ممتاز"
                    onChange={(e) => {
                      const copy = [...tempRanges];
                      copy[idx].levelName = e.target.value;
                      setTempRanges(copy);
                    }}
                    className="w-full bg-white border border-zinc-200 text-xs font-black rounded-lg px-2 py-1.5 outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-500 block mb-1">من قيمة</label>
                  <input
                    type="number"
                    step="any"
                    value={r.minVal}
                    onChange={(e) => {
                      const copy = [...tempRanges];
                      copy[idx].minVal = parseFloat(e.target.value) || 0;
                      setTempRanges(copy);
                    }}
                    className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-500 block mb-1">إلى قيمة</label>
                  <input
                    type="number"
                    step="any"
                    value={r.maxVal}
                    onChange={(e) => {
                      const copy = [...tempRanges];
                      copy[idx].maxVal = parseFloat(e.target.value) || 0;
                      setTempRanges(copy);
                    }}
                    className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-500 block mb-1">الدرجة المستحقة</label>
                  <input
                    type="number"
                    step="any"
                    value={r.score}
                    onChange={(e) => {
                      const copy = [...tempRanges];
                      copy[idx].score = parseFloat(e.target.value) || 0;
                      setTempRanges(copy);
                    }}
                    className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="flex justify-end sm:justify-center pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => handleDeleteRangeRow(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="حذف هذا المستوى"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleAddNewRangeRow}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مستوى جديد</span>
            </button>

            <button
              type="button"
              onClick={handleSaveRanges}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>حفظ معايير المستويات 💾</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


