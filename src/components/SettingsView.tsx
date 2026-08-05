import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportAppStateToJSON, importAppStateFromJSON, exportToExcel } from '../utils/fileImportExport';
import {
  generateAttendancePDFReport,
  generateMeasurementsPDFReport,
  generateIncentivesPDFReport,
  generateComprehensivePDFReport,
  generateStudentIndividualPDFReport,
  generateStatisticsPDFReport,
} from '../utils/pdfExport';
import { Save, Download, Upload, School, UserCheck, Calendar, FileSpreadsheet, FileText, Plus, Trash2, Users, CloudCheck, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { ImportStudentsModal } from './ImportStudentsModal';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    classes,
    addClass,
    deleteClass,
    timetable,
    updateTimetableEntry,
    restoreData,
    students,
    dailyLogs,
    assessments,
    grades,
    measurementItems,
    measurementValues,
    attendanceCheckItems,
    incentiveRecords,
    user,
    setIsAuthModalOpen,
    logoutUser,
    showToast,
  } = useApp();

  const [schoolNameInput, setSchoolNameInput] = useState(settings.schoolName);
  const [teacherNameInput, setTeacherNameInput] = useState(settings.teacherName);
  const [newClassName, setNewClassName] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPDFClassId, setSelectedPDFClassId] = useState<string>(classes[0]?.id || '');
  const [selectedPDFStudentId, setSelectedPDFStudentId] = useState<string>('');
  const [pdfReportType, setPdfReportType] = useState<
    'attendance' | 'measurements' | 'incentives' | 'comprehensive' | 'student_individual' | 'statistics'
  >('attendance');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const daysArabic = [
    { index: 0, name: 'الأحد' },
    { index: 1, name: 'الإثنين' },
    { index: 2, name: 'الثلاثاء' },
    { index: 3, name: 'الأربعاء' },
    { index: 4, name: 'الخميس' },
  ];

  const periods = [1, 2, 3, 4, 5, 6, 7];

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      schoolName: schoolNameInput.trim(),
      teacherName: teacherNameInput.trim(),
    });
  };

  const handleAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    addClass(newClassName.trim());
    setNewClassName('');
  };

  const handleExportBackup = () => {
    exportAppStateToJSON({
      classes,
      students,
      dailyLogs,
      assessments,
      grades,
      measurementItems,
      measurementValues,
      timetable,
      settings,
    });
    showToast('تم تحميل نسخة الاحتياط بنجاح 💾', 'success');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importAppStateFromJSON(file, (data) => {
      restoreData(data);
    });
  };

  const handleExportExcelAll = () => {
    exportToExcel(classes, students, dailyLogs, assessments, grades, measurementItems, measurementValues);
    showToast('تم تصدير ملف Excel الشامل 📊', 'success');
  };

  const handleExportPDFReport = async () => {
    const targetClass = classes.find((c) => c.id === selectedPDFClassId) || classes[0];

    if (pdfReportType === 'student_individual') {
      const targetStudent = students.find((s) => s.id === selectedPDFStudentId) || students.filter((s) => s.classId === targetClass?.id)[0];
      if (!targetStudent) {
        showToast('الرجاء اختيار طالب لتوليد التقرير', 'error');
        return;
      }
      setIsExportingPDF(true);
      showToast('جاري إعداد التقرير الفردي للطالب...', 'info');
      try {
        const studentClass = classes.find((c) => c.id === targetStudent.classId);
        await generateStudentIndividualPDFReport(
          targetStudent,
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
        showToast('حدث خطأ أثناء تصدير ملف PDF للطالب', 'error');
      } finally {
        setIsExportingPDF(false);
      }
      return;
    }

    if (!targetClass) {
      showToast('الرجاء اختيار فصل لتوليد التقرير', 'error');
      return;
    }

    setIsExportingPDF(true);
    showToast('جاري إعداد تقرير PDF رسمي ورائع...', 'info');

    try {
      const classSts = students.filter((s) => s.classId === targetClass.id);

      if (pdfReportType === 'attendance') {
        await generateAttendancePDFReport(
          targetClass,
          classSts,
          dailyLogs,
          attendanceCheckItems,
          settings
        );
      } else if (pdfReportType === 'measurements') {
        await generateMeasurementsPDFReport(
          targetClass,
          classSts,
          measurementItems,
          measurementValues,
          settings
        );
      } else if (pdfReportType === 'incentives') {
        await generateIncentivesPDFReport(
          targetClass,
          classSts,
          incentiveRecords,
          settings
        );
      } else if (pdfReportType === 'comprehensive') {
        await generateComprehensivePDFReport(
          targetClass,
          classSts,
          dailyLogs,
          measurementItems,
          measurementValues,
          incentiveRecords,
          assessments,
          grades,
          settings
        );
      } else if (pdfReportType === 'statistics') {
        await generateStatisticsPDFReport(
          targetClass,
          students,
          dailyLogs,
          measurementItems,
          measurementValues,
          incentiveRecords,
          assessments,
          grades,
          settings
        );
      }

      showToast('تم تحميل التقرير بصيغة PDF بنجاح 📄', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء تصدير ملف PDF', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 font-sans space-y-6">
      {/* Cloud Account & Data Sync Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-700/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/30 rounded-xl text-indigo-200 border border-indigo-400/30">
              <CloudCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <span>الحساب السحابي والمزامنة الدائمة</span>
                {user && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    متصل ومتزامن ☁️
                  </span>
                )}
              </h2>
              <p className="text-xs text-indigo-200 font-medium">
                {user
                  ? 'جميع بياناتك وفصولك وطلابك محفوظة سحابياً وتتزامن تلقائياً بحسابك.'
                  : 'سجّل دخولك لحفظ بياناتك في حسابك الخاص واستعادتها من أي جهاز ميكرو.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-white hover:bg-indigo-50 text-indigo-950 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            {user ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>إدارة حسابي</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-indigo-600" />
                <span>تسجيل الدخول / إنشاء حساب</span>
              </>
            )}
          </button>
        </div>

        {user && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <span className="text-indigo-200 font-bold truncate">
              البريد الإلكتروني: <strong className="text-white font-extrabold" dir="ltr">{user.email}</strong>
            </span>
            <button
              type="button"
              onClick={async () => {
                await logoutUser();
                showToast('تم تسجيل الخروج', 'info');
              }}
              className="text-rose-300 hover:text-rose-100 font-bold flex items-center gap-1 cursor-pointer underline text-[11px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        )}
      </div>

      {/* General School Settings */}
      <form onSubmit={handleSaveGeneralSettings} className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
          <School className="w-4 h-4 text-emerald-600" />
          <span>بيانات المدرسة والمعلم</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-zinc-600 block mb-1">اسم المدرسة</label>
            <input
              type="text"
              value={schoolNameInput}
              onChange={(e) => setSchoolNameInput(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-xs font-extrabold rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-600 block mb-1">اسم معلم التربية البدنية</label>
            <input
              type="text"
              value={teacherNameInput}
              onChange={(e) => setTeacherNameInput(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-xs font-extrabold rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التغييرات</span>
        </button>
      </form>

      {/* Class Management */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>إدارة الفصول الدراسية</span>
        </h2>

        <form onSubmit={handleAddClassSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="اسم الفصل الجديد (مثال: الثاني ثانوي - 2)"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            className="flex-1 bg-zinc-50 border border-zinc-200 text-xs font-bold rounded-xl px-3 py-2 outline-none"
            required
          />
          <button
            type="submit"
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فصل</span>
          </button>
        </form>

        <div className="divide-y divide-zinc-100">
          {classes.map((cls) => {
            const stCount = students.filter((s) => s.classId === cls.id).length;
            return (
              <div key={cls.id} className="py-2 flex items-center justify-between text-xs font-extrabold">
                <div>
                  <span className="text-zinc-900">{cls.name}</span>
                  <span className="text-zinc-400 mr-2">({stCount} طالب)</span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteClass(cls.id)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                  title="حذف الفصل"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Timetable Setup */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-4 overflow-x-auto">
        <h2 className="text-sm font-black text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>جدول الحصص الأسبوعي</span>
        </h2>

        <table className="w-full text-right text-xs font-bold border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-zinc-50 text-zinc-600 border-b border-zinc-200">
              <th className="p-2 border-r border-zinc-200 w-24">اليوم</th>
              {periods.map((p) => (
                <th key={p} className="p-2 text-center border-r border-zinc-200 min-w-[80px]">
                  الحصة {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {daysArabic.map((day) => (
              <tr key={day.index} className="hover:bg-zinc-50/60">
                <td className="p-2 font-black text-zinc-900 border-r border-zinc-200 bg-zinc-50/80">
                  {day.name}
                </td>
                {periods.map((p) => {
                  const entry = timetable.find((t) => t.dayOfWeek === day.index && t.periodNumber === p);
                  const selectedVal = entry ? entry.classId : '';

                  return (
                    <td key={p} className="p-1 border-r border-zinc-100 text-center">
                      <select
                        value={selectedVal}
                        onChange={(e) => updateTimetableEntry(day.index, p, e.target.value)}
                        className="w-full bg-transparent text-[11px] font-bold text-zinc-800 rounded p-1 outline-none focus:bg-emerald-50"
                      >
                        <option value="">- فارغ -</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reports & Backup Export / Import */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs space-y-5">
        <h2 className="text-sm font-black text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>مركز التقارير والنسخ الاحتياطي</span>
        </h2>

        {/* PDF Reports Studio */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-950 font-black text-xs">
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>طباعة وتصدير التقارير الرسمية (PDF)</span>
          </div>
          <p className="text-[11px] font-bold text-emerald-800 leading-relaxed">
            اختر الفصل ونوع التقرير المطلوب لتوليد ملف PDF عالي الجودة جاهز للطباعة أو المشاركة الرسمية:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-black text-emerald-900 block mb-1">اختر الفصل الدراسي</label>
              <select
                value={selectedPDFClassId}
                onChange={(e) => {
                  setSelectedPDFClassId(e.target.value);
                  const firstSt = students.find((s) => s.classId === e.target.value);
                  if (firstSt) setSelectedPDFStudentId(firstSt.id);
                }}
                className="w-full bg-white border border-emerald-200 text-xs font-bold text-zinc-900 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-emerald-900 block mb-1">نوع التقرير</label>
              <select
                value={pdfReportType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPdfReportType(val);
                  if (val === 'student_individual' && !selectedPDFStudentId) {
                    const firstSt = students.find((s) => s.classId === selectedPDFClassId) || students[0];
                    if (firstSt) setSelectedPDFStudentId(firstSt.id);
                  }
                }}
                className="w-full bg-white border border-emerald-200 text-xs font-bold text-zinc-900 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              >
                <option value="attendance">📋 تقرير الحضور والغياب والزي الرياضي (للفصل)</option>
                <option value="measurements">🏃‍♂️ تقرير القياسات وعناصر اللياقة البدنية (للفصل)</option>
                <option value="incentives">⭐️ تقرير بنك التحفيز والسلوك والمخالفات (للفصل)</option>
                <option value="statistics">📈 تقرير الإحصائيات والتحليلات العامة (للفصل)</option>
                <option value="comprehensive">📊 التقرير الشامل والموحد للمادة (للفصل)</option>
                <option value="student_individual">👤 تقرير الأداء الفردي الشامل (لطالب محدد)</option>
              </select>
            </div>
          </div>

          {pdfReportType === 'student_individual' && (
            <div className="pt-1">
              <label className="text-[10px] font-black text-emerald-900 block mb-1">اختر الطالب المطلوب</label>
              <select
                value={selectedPDFStudentId}
                onChange={(e) => setSelectedPDFStudentId(e.target.value)}
                className="w-full bg-white border border-emerald-200 text-xs font-bold text-zinc-900 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              >
                {students
                  .filter((s) => s.classId === selectedPDFClassId)
                  .map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportPDFReport}
            disabled={isExportingPDF || classes.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPDF ? 'جاري إنشاء ملف PDF المنسق...' : 'تحميل وتصدير تقرير PDF المنسق 📄'}</span>
          </button>
        </div>

        {/* Other Exports & Backups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="p-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <Users className="w-5 h-5" />
            <span>استيراد قائمة الطلاب (Excel / CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcelAll}
            className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-black flex items-center gap-2 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <span>تصدير تقرير Excel الشامل</span>
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            className="p-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-900 text-xs font-black flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-5 h-5 text-sky-700" />
            <span>تنزيل نسخة احتياطية (JSON)</span>
          </button>

          <label className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-purple-900 text-xs font-black flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-5 h-5 text-purple-700" />
            <span>استعادة نسخة احتياطية</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Import Students Modal */}
      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
