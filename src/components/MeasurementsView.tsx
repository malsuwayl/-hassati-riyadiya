import React, { useState, useEffect, useMemo } from 'react';
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
  Ruler,
  Weight,
  Activity,
  Filter,
  Info,
  ChevronDown,
  Search,
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
  PieChart,
  Pie,
  Legend,
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
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'overall' | 'single' | 'bmi'>('overall');
  const [bmiFilter, setBmiFilter] = useState<'all' | 'normal' | 'overweight' | 'obese' | 'underweight' | 'unmeasured'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Separate flexible custom fitness items from permanent height and weight
  const customFitnessItems = useMemo(() => {
    return measurementItems.filter((i) => i.id !== 'm-height' && i.id !== 'm-weight');
  }, [measurementItems]);

  const [selectedSingleItemId, setSelectedSingleItemId] = useState<string>(
    customFitnessItems[0]?.id || measurementItems[0]?.id || ''
  );

  const [selectedItemIdForRanges, setSelectedItemIdForRanges] = useState<string>(
    customFitnessItems[0]?.id || measurementItems[0]?.id || ''
  );

  // New Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<MeasurementUnit>('seconds');
  const [newItemType, setNewItemType] = useState<MeasurementInputType>('number');
  const [newItemBetter, setNewItemBetter] = useState<'higher' | 'lower'>('lower');

  // Score Ranges Editing State
  const activeRangeItem =
    measurementItems.find((i) => i.id === selectedItemIdForRanges) || customFitnessItems[0] || measurementItems[0];
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

  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Compute student fitness summaries & BMI metrics
  const studentSummaries = useMemo(() => {
    return classStudents.map((st) => {
      const summary = calculateStudentFitnessSummary(st.id, measurementItems, measurementValues);
      const stVals = measurementValues[st.id] || {};
      const heightRaw = stVals['m-height'] ?? (st.height !== undefined ? String(st.height) : '');
      const weightRaw = stVals['m-weight'] ?? (st.weight !== undefined ? String(st.weight) : '');
      const h = parseFloat(String(heightRaw || ''));
      const w = parseFloat(String(weightRaw || ''));
      const bmi = calculateBMI(h, w);

      return {
        student: st,
        summary,
        heightRaw,
        weightRaw,
        heightNum: !isNaN(h) && h > 0 ? h : null,
        weightNum: !isNaN(w) && w > 0 ? w : null,
        bmi,
      };
    });
  }, [classStudents, measurementItems, measurementValues]);

  // Filtered students for display in the table
  const filteredStudentSummaries = useMemo(() => {
    return studentSummaries.filter((entry) => {
      // Search query filter
      if (searchQuery.trim() && !entry.student.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // BMI filter
      if (bmiFilter === 'all') return true;
      if (bmiFilter === 'unmeasured') return !entry.bmi;
      if (!entry.bmi) return false;
      return entry.bmi.statusKey === bmiFilter;
    });
  }, [studentSummaries, searchQuery, bmiFilter]);

  // Summary Metrics & Statistics
  const stats = useMemo(() => {
    const validBMIs = studentSummaries.filter((s) => s.bmi !== null).map((s) => s.bmi!.bmi);
    const validHeights = studentSummaries.filter((s) => s.heightNum !== null).map((s) => s.heightNum!);
    const validWeights = studentSummaries.filter((s) => s.weightNum !== null).map((s) => s.weightNum!);

    const avgBMI =
      validBMIs.length > 0 ? (validBMIs.reduce((a, b) => a + b, 0) / validBMIs.length).toFixed(1) : null;
    const avgHeight =
      validHeights.length > 0 ? (validHeights.reduce((a, b) => a + b, 0) / validHeights.length).toFixed(1) : null;
    const avgWeight =
      validWeights.length > 0 ? (validWeights.reduce((a, b) => a + b, 0) / validWeights.length).toFixed(1) : null;

    const normalCount = studentSummaries.filter((s) => s.bmi?.statusKey === 'normal').length;
    const overweightCount = studentSummaries.filter((s) => s.bmi?.statusKey === 'overweight').length;
    const obeseCount = studentSummaries.filter((s) => s.bmi?.statusKey === 'obese').length;
    const underweightCount = studentSummaries.filter((s) => s.bmi?.statusKey === 'underweight').length;
    const unmeasuredCount = studentSummaries.filter((s) => !s.bmi).length;

    const totalScores = studentSummaries.reduce((sum, s) => sum + s.summary.totalScore, 0);
    const classAvgFitnessScore =
      studentSummaries.length > 0 ? (totalScores / studentSummaries.length).toFixed(1) : '0';

    return {
      avgBMI,
      avgHeight,
      avgWeight,
      normalCount,
      overweightCount,
      obeseCount,
      underweightCount,
      unmeasuredCount,
      classAvgFitnessScore,
      totalCount: studentSummaries.length,
      measuredBMICount: validBMIs.length,
    };
  }, [studentSummaries]);

  const sortedByScore = useMemo(() => {
    return [...studentSummaries].sort((a, b) => b.summary.totalScore - a.summary.totalScore);
  }, [studentSummaries]);

  const top10 = sortedByScore.slice(0, 10);
  const needsImprovement = sortedByScore
    .filter((s) => s.summary.ratingLevel === 'ضعيف' || s.summary.ratingLevel === 'مقبول')
    .slice(0, 10);

  const bestStudent = sortedByScore[0];
  const worstStudent = sortedByScore[sortedByScore.length - 1];

  const handleExportMeasurementsPDF = async () => {
    if (!activeClass) return;
    setIsExportingPDF(true);
    showToast('جاري إنشاء تقرير القياسات اللياقية ومؤشر الكتلة PDF...', 'info');
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
    if (id === 'm-height' || id === 'm-weight') {
      showToast('لا يمكن حذف عنصري الطول والوزن لأنهما ثابتان لحساب مؤشر الكتلة (BMI)', 'warning');
      return;
    }
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

  return (
    <div className="max-w-5xl mx-auto px-3 py-3 font-sans space-y-3">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl p-3 border border-zinc-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
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
            className={`px-3 py-1.5 text-xs font-black rounded-md flex items-center gap-1.5 cursor-pointer transition-all ${
              viewMode === 'sheet'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>جدول القياسات والكتلة</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('analytics')}
            className={`px-3 py-1.5 text-xs font-black rounded-md flex items-center gap-1.5 cursor-pointer transition-all ${
              viewMode === 'analytics'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>التحليلات ومقارنة الكتلة</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('ranges')}
            className={`px-3 py-1.5 text-xs font-black rounded-md flex items-center gap-1.5 cursor-pointer transition-all ${
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
            title="تصدير كشف القياسات البدنية ومؤشر الكتلة كملف PDF"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>{isExportingPDF ? 'جاري...' : 'تصدير PDF 📄'}</span>
          </button>
        </div>
      </div>

      {/* SPREADSHEET VIEW */}
      {viewMode === 'sheet' && (
        <div className="space-y-3">
          {/* BMI Quick Compare & Filter Bar */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white rounded-2xl p-3.5 shadow-sm border border-emerald-800">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>مقارنة القياسات الجسمية ومؤشر كتلة الجسم (BMI)</span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] px-2 py-0.2 rounded-full font-bold">
                      أعمدة ثابتة
                    </span>
                  </h3>
                  <p className="text-[10px] text-emerald-200/80 font-bold mt-0.5">
                    الطول والوزن ومؤشر الكتلة مثبتة جنباً إلى جنب للمقارنة الفورية وفق المعايير المعتمدة
                  </p>
                </div>
              </div>

              {/* Class KPI Averages */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/15 text-center">
                  <span className="text-[9px] text-emerald-200 font-bold block">متوسط الطول</span>
                  <span className="text-xs font-black text-white">{stats.avgHeight ? `${stats.avgHeight} سم` : '-'}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/15 text-center">
                  <span className="text-[9px] text-emerald-200 font-bold block">متوسط الوزن</span>
                  <span className="text-xs font-black text-white">{stats.avgWeight ? `${stats.avgWeight} كجم` : '-'}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/15 text-center">
                  <span className="text-[9px] text-emerald-200 font-bold block">متوسط الكتلة (BMI)</span>
                  <span className="text-xs font-black text-emerald-300">{stats.avgBMI || '-'}</span>
                </div>
              </div>
            </div>

            {/* Quick Interactive Filter Chips */}
            <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black text-emerald-200/80 flex items-center gap-1 pl-1">
                  <Filter className="w-3 h-3 text-emerald-300" />
                  <span>تصفية للمقارنة:</span>
                </span>

                <button
                  type="button"
                  onClick={() => setBmiFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                    bmiFilter === 'all'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  الكل ({stats.totalCount})
                </button>

                <button
                  type="button"
                  onClick={() => setBmiFilter('normal')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                    bmiFilter === 'normal'
                      ? 'bg-emerald-400 text-emerald-950 font-black shadow-xs'
                      : 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                  }`}
                  title="وزن طبيعي (18.5 - 24.9)"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>طبيعي ({stats.normalCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBmiFilter('overweight')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                    bmiFilter === 'overweight'
                      ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                      : 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
                  }`}
                  title="زيادة بالوزن (25 - 29.9)"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>زيادة وزن ({stats.overweightCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBmiFilter('obese')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                    bmiFilter === 'obese'
                      ? 'bg-rose-400 text-rose-950 font-black shadow-xs'
                      : 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                  }`}
                  title="سمنة (30 فما فوق)"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>سمنة ({stats.obeseCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBmiFilter('underweight')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
                    bmiFilter === 'underweight'
                      ? 'bg-sky-400 text-sky-950 font-black shadow-xs'
                      : 'bg-sky-500/20 text-sky-200 hover:bg-sky-500/30'
                  }`}
                  title="نقص وزن / نحافة (أقل من 18.5)"
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span>نحافة ({stats.underweightCount})</span>
                </button>

                {stats.unmeasuredCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setBmiFilter('unmeasured')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                      bmiFilter === 'unmeasured'
                        ? 'bg-zinc-200 text-zinc-950 shadow-xs'
                        : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                    }`}
                  >
                    غير مقاس ({stats.unmeasuredCount})
                  </button>
                )}
              </div>

              {/* Live search input */}
              <div className="relative min-w-[160px]">
                <input
                  type="text"
                  placeholder="بحث عن طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-emerald-200/50 text-xs font-bold rounded-lg pr-7 pl-2 py-1 outline-none focus:bg-white/20"
                />
                <Search className="w-3.5 h-3.5 text-emerald-200 absolute right-2 top-2" />
              </div>
            </div>
          </div>

          {/* Action Header for Adding Custom Fitness Test */}
          <div className="flex justify-between items-center">
            <div className="text-xs font-bold text-zinc-500">
              عرض {filteredStudentSummaries.length} من أصل {classStudents.length} طالب
              {bmiFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setBmiFilter('all')}
                  className="text-emerald-700 hover:underline mr-2 font-black cursor-pointer"
                >
                  (إلغاء التصفية ✕)
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setIsAddingItem(!isAddingItem);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة اختبار لياقة بدنية</span>
            </button>
          </div>

          {isAddingItem && (
            <form
              onSubmit={handleCreateItem}
              className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2.5 text-right shadow-2xs"
            >
              <h3 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>إضافة اختبار لياقة بدنية جديد (مرن)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-600 block mb-1">اسم الاختبار</label>
                  <input
                    type="text"
                    placeholder="مثال: الجري الترددي، الرشاقة، القفز"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-600 block mb-1">الوحدة</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as MeasurementUnit)}
                    className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-600"
                  >
                    <option value="seconds">ثواني</option>
                    <option value="cm">سم</option>
                    <option value="kg">كجم</option>
                    <option value="count">تكرار / عدد</option>
                    <option value="mm:ss">دقيقة:ثانية (mm:ss)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-600 block mb-1">المعيار الأفضل</label>
                  <select
                    value={newItemBetter}
                    onChange={(e) => setNewItemBetter(e.target.value as 'higher' | 'lower')}
                    className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-600"
                  >
                    <option value="lower">الأقل زمناً أفضل (مثل السرعة)</option>
                    <option value="higher">الأعلى نتيجة أفضل (مثل الوثب/الضغط)</option>
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
                  className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black cursor-pointer"
                >
                  حفظ الاختبار
                </button>
              </div>
            </form>
          )}

          {/* MAIN SPREADSHEET TABLE */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[900px]">
                <thead>
                  {/* Category Header Row */}
                  <tr className="border-b border-zinc-200 text-xs font-black">
                    <th colSpan={2} className="p-2 bg-zinc-100/90 text-zinc-700 border-l border-zinc-200 text-center">
                      بيانات الطالب
                    </th>
                    <th colSpan={3} className="p-2 bg-emerald-100/80 text-emerald-950 border-l border-zinc-200 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-700" />
                        <span>القياسات الجسمية ومؤشر كتلة الجسم (BMI) - ثابتة للمقارنة</span>
                      </div>
                    </th>
                    {customFitnessItems.length > 0 && (
                      <th colSpan={customFitnessItems.length} className="p-2 bg-sky-100/70 text-sky-950 border-l border-zinc-200 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-sky-700" />
                          <span>اختبارات وعناصر اللياقة البدنية المرنة</span>
                        </div>
                      </th>
                    )}
                    <th className="p-2 bg-emerald-100/80 text-emerald-950 text-center">
                      التقييم العام
                    </th>
                  </tr>

                  {/* Sub Header Row */}
                  <tr className="bg-zinc-50 text-zinc-800 text-xs font-black border-b border-zinc-200">
                    <th className="p-2.5 w-8 text-center border-l border-zinc-200">#</th>
                    <th className="p-2.5 min-w-[140px] border-l border-zinc-200">اسم الطالب</th>

                    {/* FIXED 1: HEIGHT */}
                    <th className="p-2 text-center border-l border-zinc-200 min-w-[100px] bg-emerald-50/50">
                      <div className="flex items-center justify-center gap-1 text-emerald-950">
                        <Ruler className="w-3.5 h-3.5 text-emerald-700" />
                        <span>الطول</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-700/80 block">(سم)</span>
                    </th>

                    {/* FIXED 2: WEIGHT */}
                    <th className="p-2 text-center border-l border-zinc-200 min-w-[100px] bg-emerald-50/50">
                      <div className="flex items-center justify-center gap-1 text-emerald-950">
                        <Weight className="w-3.5 h-3.5 text-emerald-700" />
                        <span>الوزن</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-700/80 block">(كجم)</span>
                    </th>

                    {/* FIXED 3: BMI */}
                    <th className="p-2.5 text-center bg-teal-50 text-teal-950 font-black min-w-[140px] border-l border-zinc-200">
                      <div className="flex items-center justify-center gap-1 text-teal-950">
                        <Activity className="w-3.5 h-3.5 text-teal-700" />
                        <span>كتلة الجسم (BMI)</span>
                      </div>
                      <span className="text-[9px] font-extrabold text-teal-700 block">المؤشر والتصنيف</span>
                    </th>

                    {/* CUSTOM FITNESS ITEMS */}
                    {customFitnessItems.map((item) => (
                      <th key={item.id} className="p-2 text-center border-l border-zinc-200 min-w-[105px] group bg-sky-50/30">
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteMeasurementItem(item.id, item.name)}
                            className="text-zinc-300 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                            title="حذف هذا الاختبار"
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

                    <th className="p-2.5 text-center bg-emerald-50/60 text-emerald-950 font-black min-w-[100px]">
                      مستوى اللياقة
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 text-xs font-bold text-zinc-800">
                  {filteredStudentSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={customFitnessItems.length + 6} className="p-8 text-center text-zinc-400 font-bold">
                        {classStudents.length === 0 ? 'لا يوجد طلاب في هذا الفصل' : 'لا يوجد طلاب يطابقون خيارات البحث أو التصفية'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudentSummaries.map((entry, idx) => {
                      const { student: st, summary: fitnessSummary, heightRaw, weightRaw, bmi: bmiRes } = entry;
                      const stVals = measurementValues[st.id] || {};

                      // Status styles for BMI
                      const getBMIBadge = () => {
                        if (!bmiRes) {
                          return <span className="text-zinc-300 text-[11px] font-extrabold">-</span>;
                        }
                        const bgs = {
                          normal: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                          overweight: 'bg-amber-50 border-amber-200 text-amber-800',
                          obese: 'bg-rose-50 border-rose-200 text-rose-800',
                          underweight: 'bg-sky-50 border-sky-200 text-sky-800',
                        };
                        const badges = {
                          normal: 'وزن طبيعي 🟢',
                          overweight: 'زيادة وزن 🟡',
                          obese: 'سمنة 🔴',
                          underweight: 'نحافة 🔵',
                        };

                        return (
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="text-xs font-black text-zinc-900">{bmiRes.bmi}</span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${bgs[bmiRes.statusKey]}`}
                              title={bmiRes.statusAr}
                            >
                              {badges[bmiRes.statusKey]}
                            </span>
                          </div>
                        );
                      };

                      return (
                        <tr key={st.id} className="hover:bg-zinc-50/80 transition-colors">
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

                          {/* FIXED HEIGHT INPUT */}
                          <td className="p-1.5 text-center border-l border-zinc-100 bg-emerald-50/20">
                            <input
                              type="number"
                              step="any"
                              value={heightRaw}
                              placeholder="سم"
                              onChange={(e) => setStudentMeasurementValue(st.id, 'm-height', e.target.value)}
                              className="w-16 text-center font-extrabold text-xs py-1 bg-white border border-emerald-200 rounded-lg focus:border-emerald-600 outline-none shadow-2xs"
                            />
                          </td>

                          {/* FIXED WEIGHT INPUT */}
                          <td className="p-1.5 text-center border-l border-zinc-100 bg-emerald-50/20">
                            <input
                              type="number"
                              step="any"
                              value={weightRaw}
                              placeholder="كجم"
                              onChange={(e) => setStudentMeasurementValue(st.id, 'm-weight', e.target.value)}
                              className="w-16 text-center font-extrabold text-xs py-1 bg-white border border-emerald-200 rounded-lg focus:border-emerald-600 outline-none shadow-2xs"
                            />
                          </td>

                          {/* FIXED BMI RESULT & STATUS CHIP */}
                          <td className="p-1.5 text-center bg-teal-50/40 border-l border-zinc-100">
                            {getBMIBadge()}
                          </td>

                          {/* CUSTOM FITNESS ITEMS */}
                          {customFitnessItems.map((item) => {
                            const val = stVals[item.id] ?? '';
                            const evalRes = evaluateMeasurementValue(val, item);

                            return (
                              <td key={item.id} className="p-1 text-center border-l border-zinc-100">
                                <input
                                  type="text"
                                  value={val}
                                  placeholder="-"
                                  onChange={(e) => setStudentMeasurementValue(st.id, item.id, e.target.value)}
                                  className="w-16 text-center font-extrabold text-xs py-1 bg-zinc-50 border border-zinc-200 rounded-lg focus:border-emerald-600 outline-none"
                                />
                                {evalRes && (
                                  <span className="text-[9px] font-black text-emerald-700 block mt-0.5">
                                    {evalRes.levelName}
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* OVERALL FITNESS RATING */}
                          <td className="p-2 text-center bg-emerald-50/30 text-emerald-950 font-black">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                                fitnessSummary.ratingLevel === 'ممتاز'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : fitnessSummary.ratingLevel === 'جيد جداً'
                                  ? 'bg-sky-100 text-sky-800'
                                  : fitnessSummary.ratingLevel === 'جيد'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-zinc-100 text-zinc-700'
                              }`}
                            >
                              {fitnessSummary.ratingLevel}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {viewMode === 'analytics' && (
        <div className="space-y-4">
          {/* Analytics Mode Switcher */}
          <div className="bg-white p-2 rounded-xl border border-zinc-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
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
                القياسات والأداء الشامل
              </button>
              <button
                type="button"
                onClick={() => setAnalyticsSubTab('bmi')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  analyticsSubTab === 'bmi'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>مقارنة كتلة الجسم (BMI)</span>
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
                ترتيب اختبار محدد
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
                  <span className="text-xl font-black text-emerald-700">{stats.classAvgFitnessScore} نقطة</span>
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
                  <span className="text-xl font-black text-sky-700">{stats.normalCount} طلاب</span>
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
                        {sortedByScore.map((_, index) => (
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

          {/* MODE 2: BMI SPECIFIC ANALYTICS */}
          {analyticsSubTab === 'bmi' && (
            <div className="space-y-4">
              {/* BMI Distribution Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-black text-emerald-800 block">وزن طبيعي (18.5 - 24.9)</span>
                  <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.normalCount}</span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    {stats.measuredBMICount > 0 ? `${Math.round((stats.normalCount / stats.measuredBMICount) * 100)}% من المقاسين` : '-'}
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-black text-amber-800 block">زيادة وزن (25 - 29.9)</span>
                  <span className="text-2xl font-black text-amber-700 mt-1 block">{stats.overweightCount}</span>
                  <span className="text-[10px] font-bold text-amber-600">
                    {stats.measuredBMICount > 0 ? `${Math.round((stats.overweightCount / stats.measuredBMICount) * 100)}% من المقاسين` : '-'}
                  </span>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-black text-rose-800 block">سمنة (30 فأكثر)</span>
                  <span className="text-2xl font-black text-rose-700 mt-1 block">{stats.obeseCount}</span>
                  <span className="text-[10px] font-bold text-rose-600">
                    {stats.measuredBMICount > 0 ? `${Math.round((stats.obeseCount / stats.measuredBMICount) * 100)}% من المقاسين` : '-'}
                  </span>
                </div>

                <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-black text-sky-800 block">نقص بالوزن (أقل من 18.5)</span>
                  <span className="text-2xl font-black text-sky-700 mt-1 block">{stats.underweightCount}</span>
                  <span className="text-[10px] font-bold text-sky-600">
                    {stats.measuredBMICount > 0 ? `${Math.round((stats.underweightCount / stats.measuredBMICount) * 100)}% من المقاسين` : '-'}
                  </span>
                </div>
              </div>

              {/* BMI Bar Chart Comparison */}
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h3 className="text-xs font-black text-zinc-900 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>رسم بياني لمؤشر كتلة الجسم (BMI) لطلاب الفصل</span>
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-400">مقياس منظمة الصحة العالمية</span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={studentSummaries
                        .filter((s) => s.bmi !== null)
                        .map((s) => ({
                          name: s.student.name,
                          bmi: s.bmi!.bmi,
                          status: s.bmi!.statusAr,
                          statusKey: s.bmi!.statusKey,
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
                      <YAxis domain={[10, 40]} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [`${val} (${item.payload.status})`, 'مؤشر الكتلة BMI']}
                        labelStyle={{ fontWeight: 800, textAlign: 'right' }}
                        contentStyle={{ borderRadius: '12px', borderColor: '#e4e4e7', fontSize: '11px' }}
                      />
                      <Bar dataKey="bmi" radius={[6, 6, 0, 0]}>
                        {studentSummaries
                          .filter((s) => s.bmi !== null)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-bmi-${index}`}
                              fill={
                                entry.bmi?.statusKey === 'normal'
                                  ? '#10b981'
                                  : entry.bmi?.statusKey === 'overweight'
                                  ? '#f59e0b'
                                  : entry.bmi?.statusKey === 'obese'
                                  ? '#ef4444'
                                  : '#38bdf8'
                              }
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Comprehensive Height / Weight / BMI Table */}
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
                <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                  <h4 className="text-xs font-black text-zinc-900">جدول المقارنة التفصيلي (الطول | الوزن | الكتلة)</h4>
                  <span className="text-[10px] font-bold text-zinc-400">انقر على اسم الطالب لعرض الملف الكامل</span>
                </div>
                <div className="divide-y divide-zinc-100 text-xs font-extrabold max-h-80 overflow-y-auto">
                  {studentSummaries.map((entry, i) => (
                    <div
                      key={entry.student.id}
                      onClick={() => setSelectedStudentId(entry.student.id)}
                      className="p-2.5 flex items-center justify-between hover:bg-zinc-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center text-zinc-400 font-bold">{i + 1}</span>
                        <span className="text-zinc-900 font-black">{entry.student.name}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-zinc-600">
                          📏 {entry.heightNum ? `${entry.heightNum} سم` : '-'}
                        </span>
                        <span className="text-zinc-600">
                          ⚖️ {entry.weightNum ? `${entry.weightNum} كجم` : '-'}
                        </span>
                        <div className="w-28 text-left">
                          {entry.bmi ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${
                                entry.bmi.statusKey === 'normal'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : entry.bmi.statusKey === 'overweight'
                                  ? 'bg-amber-100 text-amber-800'
                                  : entry.bmi.statusKey === 'obese'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              BMI: {entry.bmi.bmi}
                            </span>
                          ) : (
                            <span className="text-zinc-300 text-[10px]">غير مقاس</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: SINGLE MEASUREMENT ITEM ANALYTICS */}
          {analyticsSubTab === 'single' && (
            <div className="space-y-4">
              {/* Selector Bar */}
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
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
                      {item.name} ({item.unit}) {item.id === 'm-height' || item.id === 'm-weight' ? '⭐ (أساسي)' : ''}
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
                    {/* Top 3 Winner Podium */}
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
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 space-y-4 text-right shadow-2xs">
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
                    {item.name} ({item.unit}) {item.id === 'm-height' || item.id === 'm-weight' ? '⭐ (عنصر جسمي أساسي)' : ''}
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

              {activeRangeItem && activeRangeItem.id !== 'm-height' && activeRangeItem.id !== 'm-weight' && (
                <button
                  type="button"
                  onClick={() => handleDeleteMeasurementItem(activeRangeItem.id, activeRangeItem.name)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  title="حذف هذا الاختبار"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الاختبار</span>
                </button>
              )}
            </div>
          </div>

          {activeRangeItem && (activeRangeItem.id === 'm-height' || activeRangeItem.id === 'm-weight') && (
            <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-950">
              <Info className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                عنصر {activeRangeItem.name} هو مقياس أنثروبومتري أساسي يُستخدم لحساب مؤشر كتلة الجسم (BMI) وفقاً للمعادلة: [الوزن ÷ (الطول بالمتر)²].
              </span>
            </div>
          )}

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
