import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportReportPDF } from '../utils/pdfExport';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  AlertTriangle,
  Megaphone,
  Award,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  BarChart3,
  Sparkles,
  School,
  Calendar,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { classes, students, dailyLogs, getStudentSummaryStats, settings, showToast, selectedClassId } = useApp();

  const [expandedClassId, setExpandedClassId] = useState<string | null>(selectedClassId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(selectedClassId || 'ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  React.useEffect(() => {
    if (selectedClassId) {
      setSelectedClassFilter(selectedClassId);
      setExpandedClassId(selectedClassId);
    }
  }, [selectedClassId]);

  const isDateInFilter = (dateStr: string) => {
    if (dateRangeFilter === 'ALL') return true;
    const date = new Date(dateStr);
    const now = new Date();
    if (dateRangeFilter === 'TODAY') {
      return date.toDateString() === now.toDateString();
    }
    if (dateRangeFilter === 'WEEK') {
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (dateRangeFilter === 'MONTH') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Calculate statistics for a single class
  const getClassStats = (classId: string) => {
    const classStudents = students.filter((s) => s.classId === classId);
    const classLogs = dailyLogs.filter((l) => l.classId === classId && isDateInFilter(l.date));

    const totalAttendanceRecords = classLogs.filter((l) => l.attendance !== null).length;
    const totalPresents = classLogs.filter((l) => l.attendance === 'present').length;
    const totalAbsences = classLogs.filter((l) => l.attendance === 'absent').length;
    const totalLateArrivals = classLogs.filter((l) => l.attendance === 'late').length;

    // Attendance Percentage: (Presents + 0.5 * Late) / Total
    const attendancePercentage =
      totalAttendanceRecords > 0
        ? Math.round(((totalPresents + totalLateArrivals * 0.5) / totalAttendanceRecords) * 100)
        : 100;

    const participationCount = classLogs.reduce((acc, l) => acc + (l.participations || 0), 0);
    const excellencesCount = classLogs.reduce((acc, l) => acc + (l.excellences || 0), 0);
    const violationsCount = classLogs.reduce((acc, l) => acc + (l.violations || 0), 0);
    const warningsCount = classLogs.reduce((acc, l) => acc + (l.warnings || 0), 0);

    // Calculate student final scores and class average final score
    const studentScores = classStudents.map((student) => {
      const stats = getStudentSummaryStats(student.id);
      return {
        student,
        stats,
      };
    });

    const totalScoreSum = studentScores.reduce((acc, s) => acc + s.stats.totalScore, 0);
    const averageFinalScore =
      studentScores.length > 0 ? Math.round(totalScoreSum / studentScores.length) : 100;

    return {
      classStudents,
      studentScores,
      totalPresents,
      totalAbsences,
      totalLateArrivals,
      totalAttendanceRecords,
      attendancePercentage,
      participationCount,
      excellencesCount,
      violationsCount,
      warningsCount,
      averageFinalScore,
    };
  };

  // Filter classes according to filter selection
  const filteredClasses = classes.filter((cls) => {
    if (selectedClassFilter !== 'ALL' && cls.id !== selectedClassFilter) return false;
    if (searchQuery.trim() !== '') {
      const matchesClassName = cls.name.includes(searchQuery);
      const matchesStudent = students.some(
        (s) => s.classId === cls.id && s.name.includes(searchQuery)
      );
      return matchesClassName || matchesStudent;
    }
    return true;
  });

  // Calculate Overall School Totals
  const overallPresents = dailyLogs.filter((l) => l.attendance === 'present').length;
  const overallAbsences = dailyLogs.filter((l) => l.attendance === 'absent').length;
  const overallLates = dailyLogs.filter((l) => l.attendance === 'late').length;
  const overallParticipations = dailyLogs.reduce((acc, l) => acc + (l.participations || 0), 0);
  const overallViolations = dailyLogs.reduce((acc, l) => acc + (l.violations || 0), 0);
  const overallWarnings = dailyLogs.reduce((acc, l) => acc + (l.warnings || 0), 0);
  const totalLogsCount = dailyLogs.filter((l) => l.attendance !== null).length;
  const overallAttendanceRate =
    totalLogsCount > 0
      ? Math.round(((overallPresents + overallLates * 0.5) / totalLogsCount) * 100)
      : 100;

  // Export to Excel / CSV file
  const handleExportExcel = () => {
    const now = new Date().toLocaleDateString('ar-SA');

    let csvContent = '\uFEFF'; // UTF-8 BOM for Arabic text support in Excel

    // Header Metadata
    csvContent += `تقرير حصتي الرياضية الشامل\n`;
    csvContent += `المدرسة: ${settings.schoolName || 'مدرسة التربية البدنية'}\n`;
    csvContent += `المعلم: ${settings.teacherName || 'معلم البدنية'}\n`;
    csvContent += `تاريخ التقرير: ${now}\n\n`;

    // 1. CLASS SUMMARY TABLE
    csvContent += `=== ملخص الفصول الدراسية ===\n`;
    const classHeaders = [
      'اسم الفصل',
      'الصف/المرحلة',
      'الحصة',
      'عدد الطلاب',
      'نسبة الحضور (%)',
      'إجمالي الغياب',
      'إجمالي التأخير',
      'عدد المشاركات',
      'المخالفات',
      'الإنذارات',
      'الدرجة النهائية (المتوسط)',
    ];
    csvContent += classHeaders.join(',') + '\n';

    classes.forEach((cls) => {
      const stats = getClassStats(cls.id);
      const row = [
        `"${cls.name}"`,
        `"${cls.grade}"`,
        `"${cls.period}"`,
        stats.classStudents.length,
        `${stats.attendancePercentage}%`,
        stats.totalAbsences,
        stats.totalLateArrivals,
        stats.participationCount,
        stats.violationsCount,
        stats.warningsCount,
        stats.averageFinalScore,
      ];
      csvContent += row.join(',') + '\n';
    });

    csvContent += `\n=== تفاصيل الطلاب حسب الفصل ===\n`;
    const studentHeaders = [
      'الفصل',
      'اسم الطالب',
      'رقم الطالب / الهوية',
      'نسبة الحضور (%)',
      'أيام الحضور',
      'أيام الغياب',
      'أيام التأخير',
      'عدد المشاركات',
      'التميز',
      'المخالفات',
      'الإنذارات',
      'الدرجة النهائية',
    ];
    csvContent += studentHeaders.join(',') + '\n';

    classes.forEach((cls) => {
      const stats = getClassStats(cls.id);
      stats.studentScores.forEach(({ student, stats: sStats }) => {
        const sRow = [
          `"${cls.name}"`,
          `"${student.name}"`,
          `"${student.studentNumber || student.nationalId || '-'}"`,
          `${sStats.attendanceRate}%`,
          sStats.presentDays,
          sStats.absentDays,
          sStats.lateDays,
          sStats.totalParticipations,
          sStats.totalExcellences,
          sStats.totalViolations,
          sStats.totalWarnings,
          sStats.totalScore,
        ];
        csvContent += sRow.join(',') + '\n';
      });
    });

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `تقرير_الفصول_والطلاب_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('تم تصدير التقرير إلى إكسل بنجاح 🟢', 'success');
  };

  // Export to PDF
  const handleExportPDF = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      showToast('جاري إنشاء ملف PDF وتجهيز التقرير...', 'info');

      const classesToExport = filteredClasses.length > 0 ? filteredClasses : classes;
      const dateStr = new Date().toLocaleDateString('ar-SA');

      const classesStats = classesToExport.map((cls) => {
        const stats = getClassStats(cls.id);
        const studentScores = stats.studentScores.map(({ student, stats: sStats }) => {
          const attendanceText = `${sStats.attendanceRate}% (ح:${sStats.presentDays} غ:${sStats.absentDays} ت:${sStats.lateDays})`;
          return {
            student,
            stats: {
              ...sStats,
              attendanceText,
            },
          };
        });

        return {
          classItem: cls,
          studentScores,
        };
      });

      await exportReportPDF({
        schoolName: settings.schoolName || 'مدرسة التربية البدنية',
        teacherName: settings.teacherName || 'معلم البدنية',
        schoolLogo: settings.schoolLogo,
        dateStr,
        classesStats,
      });

      showToast('تم تصدير ملف PDF بنجاح 📄', 'success');
    } catch (err) {
      console.error('PDF Export Error:', err);
      showToast('حدث خطأ أثناء تصدير ملف PDF', 'error');
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-200 max-w-lg mx-auto">
      {/* Header Card & Export Buttons */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm space-y-3 no-print">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 leading-tight">تقارير الفصول والأداء</h2>
              <p className="text-xs text-zinc-500">إحصائيات شاملة لكل فصل مع تصدير PDF وإكسل</p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export to PDF & Export to Excel */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportPDF}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-3 rounded-2xl shadow-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 border border-emerald-500 min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>تصدير PDF (طباعة)</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleExportExcel();
            }}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs py-3 px-3 rounded-2xl shadow-xs transition-all active:scale-[0.97] flex items-center justify-center gap-2 min-h-[44px]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير إكسل (Excel)</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-100">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث باسم الفصل أو الطالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pr-9 pl-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 text-xs font-semibold text-zinc-800 outline-none focus:border-emerald-500"
          >
            <option value="ALL">جميع الفصول ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value as any)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 text-xs font-semibold text-zinc-800 outline-none focus:border-emerald-500"
          >
            <option value="ALL">📅 كل التواريخ</option>
            <option value="TODAY">اليوم فقط</option>
            <option value="WEEK">آخر 7 أيام</option>
            <option value="MONTH">هذا الشهر</option>
          </select>
        </div>
      </div>

      {/* Printable Header ONLY visible during PDF export/printing */}
      <div className="hidden print:block p-4 border-b border-zinc-300 text-right space-y-1 mb-4">
        <h1 className="text-2xl font-black text-zinc-900">تقرير حصتي الرياضية - تقارير الفصول</h1>
        <p className="text-sm font-bold text-zinc-700">
          المدرسة: {settings.schoolName || 'مدرسة التربية البدنية'} | المعلم: {settings.teacherName || 'معلم البدنية'}
        </p>
        <p className="text-xs text-zinc-500">تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</p>
      </div>

      {/* School Overall Quick Summary */}
      <div className="grid grid-cols-4 gap-2 no-print">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 text-center">
          <span className="text-xs font-bold text-emerald-800 block">نسبة الحضور</span>
          <span className="text-base font-black text-emerald-950 mt-0.5 block">%{overallAttendanceRate}</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-2.5 text-center">
          <span className="text-xs font-bold text-red-800 block">إجمالي الغياب</span>
          <span className="text-base font-black text-red-950 mt-0.5 block">{overallAbsences}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-center">
          <span className="text-xs font-bold text-amber-800 block">المشاركات</span>
          <span className="text-base font-black text-amber-950 mt-0.5 block">{overallParticipations}</span>
        </div>
        <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-2.5 text-center">
          <span className="text-xs font-bold text-zinc-700 block">الفصول</span>
          <span className="text-base font-black text-zinc-900 mt-0.5 block">{classes.length}</span>
        </div>
      </div>

      {/* CLASS CARDS FOR EVERY CLASS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>تقارير الفصول الدراسية ({filteredClasses.length})</span>
          </h3>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center border border-zinc-200 space-y-2">
            <GraduationCap className="w-10 h-10 text-zinc-300 mx-auto" />
            <p className="text-sm font-extrabold text-zinc-700">لا توجد فصول مطابقة</p>
            <p className="text-xs text-zinc-500">جرب البحث باسم فصل آخر أو تصفية جميع الفصول</p>
          </div>
        ) : (
          filteredClasses.map((cls) => {
            const stats = getClassStats(cls.id);
            const isExpanded = expandedClassId === cls.id;

            return (
              <div
                key={cls.id}
                className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden space-y-3 p-4 transition-all print-page"
              >
                {/* Class Title Header */}
                <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                      🏫
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-zinc-900 leading-tight">
                        {cls.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                        <span>{cls.grade}</span>
                        <span>•</span>
                        <span>{cls.period}</span>
                        <span>•</span>
                        <span className="font-bold text-emerald-700">{stats.classStudents.length} طالب</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                    className="no-print bg-zinc-50 hover:bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border border-zinc-200 transition-colors"
                  >
                    <span>{isExpanded ? 'إخفاء الطلاب' : 'عرض الطلاب'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* 📊 REQUIREMENTS STATS GRID FOR THIS CLASS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* 🟢 Attendance Percentage */}
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-900">
                      <span>🟢</span>
                      <span>نسبة الحضور</span>
                    </div>
                    <div className="text-lg font-black text-emerald-950 mt-1">
                      %{stats.attendancePercentage}
                    </div>
                  </div>

                  {/* 🔴 Total Absences */}
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-red-900">
                      <span>🔴</span>
                      <span>إجمالي الغياب</span>
                    </div>
                    <div className="text-lg font-black text-red-950 mt-1">
                      {stats.totalAbsences} <span className="text-xs font-bold text-red-700">أيام</span>
                    </div>
                  </div>

                  {/* 🟡 Total Late Arrivals */}
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
                      <span>🟡</span>
                      <span>إجمالي التأخير</span>
                    </div>
                    <div className="text-lg font-black text-amber-950 mt-1">
                      {stats.totalLateArrivals} <span className="text-xs font-bold text-amber-700">مرات</span>
                    </div>
                  </div>

                  {/* ⭐ Participation Count */}
                  <div className="bg-amber-100/60 border border-amber-300 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-950">
                      <span>⭐</span>
                      <span>عدد المشاركات</span>
                    </div>
                    <div className="text-lg font-black text-amber-950 mt-1">
                      {stats.participationCount} <span className="text-xs font-bold text-amber-800">مشاركة</span>
                    </div>
                  </div>

                  {/* ⚠️ Violations */}
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-red-900">
                      <span>⚠️</span>
                      <span>المخالفات</span>
                    </div>
                    <div className="text-lg font-black text-red-950 mt-1">
                      {stats.violationsCount} <span className="text-xs font-bold text-red-700">مخالفة</span>
                    </div>
                  </div>

                  {/* 📢 Warnings */}
                  <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-orange-900">
                      <span>📢</span>
                      <span>الإنذارات</span>
                    </div>
                    <div className="text-lg font-black text-orange-950 mt-1">
                      {stats.warningsCount} <span className="text-xs font-bold text-orange-700">إنذار</span>
                    </div>
                  </div>

                  {/* 🏆 Excellences */}
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-900">
                      <span>🏆</span>
                      <span>نقاط التميز</span>
                    </div>
                    <div className="text-lg font-black text-emerald-950 mt-1">
                      {stats.excellencesCount} <span className="text-xs font-bold text-emerald-700">نقطة</span>
                    </div>
                  </div>

                  {/* 💯 Final Score (Class Average) */}
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-2.5 rounded-2xl shadow-xs">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-100">
                      <span>💯</span>
                      <span>الدرجة النهائية</span>
                    </div>
                    <div className="text-lg font-black text-white mt-1">
                      {stats.averageFinalScore} <span className="text-[10px] font-normal text-emerald-100">(متوسط)</span>
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE STUDENTS TABLE FOR THIS CLASS */}
                {(isExpanded || window.matchMedia('print').matches) && (
                  <div className="pt-3 border-t border-zinc-100 space-y-2">
                    <h5 className="text-xs font-extrabold text-zinc-900">
                      جدول درجات ونتائج طلاب {cls.name} ({stats.classStudents.length} طالب):
                    </h5>

                    {stats.classStudents.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-2">لا يوجد طلاب مضافون في هذا الفصل حتى الآن.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200">
                            <tr>
                              <th className="p-2.5">الطالب</th>
                              <th className="p-2.5 text-center">النسبة %</th>
                              <th className="p-2.5 text-center">غائب</th>
                              <th className="p-2.5 text-center">متأخر</th>
                              <th className="p-2.5 text-center">مشاركة</th>
                              <th className="p-2.5 text-center">مخالفة</th>
                              <th className="p-2.5 text-center">إنذار</th>
                              <th className="p-2.5 text-center">الدرجة النهائية</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-800">
                            {stats.studentScores.map(({ student, stats: sStats }) => (
                              <tr key={student.id} className="hover:bg-emerald-50/40">
                                <td className="p-2.5 font-bold text-zinc-900">
                                  {student.name}
                                  {student.studentNumber && (
                                    <span className="block text-[10px] font-medium text-zinc-400">
                                      #{student.studentNumber}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-center font-bold text-emerald-700">
                                  %{sStats.attendanceRate}
                                </td>
                                <td className="p-2.5 text-center text-red-600 font-bold">{sStats.absentDays}</td>
                                <td className="p-2.5 text-center text-amber-600 font-bold">{sStats.lateDays}</td>
                                <td className="p-2.5 text-center text-amber-700 font-bold">{sStats.totalParticipations}</td>
                                <td className="p-2.5 text-center text-red-700 font-bold">{sStats.totalViolations}</td>
                                <td className="p-2.5 text-center text-orange-700 font-bold">{sStats.totalWarnings}</td>
                                <td className="p-2.5 text-center font-black text-emerald-800 text-sm">
                                  {sStats.totalScore}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
