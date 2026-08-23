import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  parseFingerprintFile,
  generateDemoFingerprintLogs,
  downloadSampleFingerprintDAT,
  downloadSampleFingerprintExcel,
  downloadSampleFingerprintCSV,
  FingerprintParseResult,
} from '../utils/fingerprintParser';
import { FingerprintLogRecord, FingerprintDevice } from '../types';
import { playSchoolBellSound, speakArabicAnnouncement } from '../utils/notificationSound';
import {
  X,
  Upload,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Clock,
  Laptop,
  HardDrive,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Zap,
  Users,
  Search,
  Check,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Volume2,
} from 'lucide-react';

export const FingerprintModal: React.FC = () => {
  const {
    isFingerprintModalOpen,
    setIsFingerprintModalOpen,
    students,
    classes,
    selectedClassId,
    selectedDate,
    fingerprintDevices,
    addFingerprintDevice,
    updateFingerprintDevice,
    deleteFingerprintDevice,
    applyFingerprintAttendanceLogs,
    updateStudent,
    settings,
    updateSettings,
    showToast,
    triggerHaptic,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'import' | 'live_scanner' | 'devices' | 'enrollment' | 'guide'
  >('import');

  // Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<FingerprintParseResult | null>(null);
  const [targetDateInput, setTargetDateInput] = useState(selectedDate);
  const [targetClassFilter, setTargetClassFilter] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);

  // Live Biometric Scanner State
  const [liveScannerInput, setLiveScannerInput] = useState('');
  const [recentLiveScans, setRecentLiveScans] = useState<
    Array<{ studentId: string; studentName: string; className: string; time: string; status: 'present' | 'late' }>
  >([]);
  const [scannerFeedback, setScannerFeedback] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string;
    studentName?: string;
  }>({ type: null, message: '' });
  const liveInputRef = useRef<HTMLInputElement>(null);

  // Device Form State
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [devName, setDevName] = useState('');
  const [devModel, setDevModel] = useState('ZKTeco K40 / USB');
  const [devType, setDevType] = useState<'usb_file' | 'live_usb_reader' | 'network_ip'>('usb_file');
  const [devLocation, setDevLocation] = useState('مدخل الصالة الرياضية');
  const [devLateGrace, setDevLateGrace] = useState(settings.defaultFingerprintGraceMinutes || 10);

  // Student Enrollment State
  const [enrollSearch, setEnrollSearch] = useState('');
  const [enrollClassFilter, setEnrollClassFilter] = useState('all');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingFpVal, setEditingFpVal] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFingerprintModalOpen) {
        setIsFingerprintModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFingerprintModalOpen, setIsFingerprintModalOpen]);

  // Focus scanner input when tab switches to live scanner
  useEffect(() => {
    if (activeTab === 'live_scanner' && liveInputRef.current) {
      liveInputRef.current.focus();
    }
  }, [activeTab]);

  if (!isFingerprintModalOpen) return null;

  // Process uploaded file
  const handleFileProcess = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    try {
      const classStart = settings.periodTimes?.[0]?.startTime || '07:15';
      const grace = settings.defaultFingerprintGraceMinutes || 10;
      const res = await parseFingerprintFile(file, students, classes, classStart, grace);
      setParseResult(res);
      if (res.detectedDate) {
        setTargetDateInput(res.detectedDate);
      }
      showToast(`تم تحليل ملف البصمة بنجاح (${res.matchedCount} طالب مطابق) ✨`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'تعذر قراءة ملف البصمة، تأكد من صحة الملف', 'error');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleTestDemoLogs = () => {
    triggerHaptic(20);
    const res = generateDemoFingerprintLogs(students, classes, targetDateInput);
    setParseResult(res);
    showToast('تم تحميل سجلات تجريبية لجهاز البصمة 🖲️', 'info');
  };

  const handleApplyAttendance = () => {
    if (!parseResult || parseResult.logs.length === 0) return;
    triggerHaptic(30);

    const { updatedCount, presentCount, lateCount } = applyFingerprintAttendanceLogs(
      parseResult.logs,
      targetDateInput,
      targetClassFilter
    );

    showToast(
      `تم تطبيق التحضير بنجاح: ${updatedCount} طالب (${presentCount} حاضر، ${lateCount} متأخر) 🟢`,
      'success'
    );
    setIsFingerprintModalOpen(false);
  };

  // Live scanner submission
  const handleLiveScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const inputVal = liveScannerInput.trim();
    if (!inputVal) return;

    triggerHaptic(20);
    const cleanVal = inputVal.toLowerCase();

    // Match student
    const matched = students.find(
      (s) =>
        (s.fingerprintId && s.fingerprintId.toLowerCase() === cleanVal) ||
        (s.nationalId && s.nationalId.toLowerCase() === cleanVal) ||
        s.id.toLowerCase() === cleanVal ||
        s.name.toLowerCase().includes(cleanVal)
    );

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const classStart = settings.periodTimes?.[0]?.startTime || '07:15';
    const [startH, startM] = classStart.split(':').map((n) => parseInt(n, 10) || 0);
    const grace = settings.defaultFingerprintGraceMinutes || 10;
    const isLate = now.getHours() * 60 + now.getMinutes() > startH * 60 + startM + grace;
    const status: 'present' | 'late' = isLate ? 'late' : 'present';

    if (matched) {
      const cls = classes.find((c) => c.id === matched.classId);
      const studentName = matched.name;
      const className = cls?.name || 'الفصل';

      // Play audio chime and voice
      playSchoolBellSound('start');
      if (settings.notifications?.enableTTS) {
        speakArabicAnnouncement(`تم تسجيل حضور الطالب ${studentName}`);
      }

      // Record in logs
      applyFingerprintAttendanceLogs(
        [
          {
            rawId: inputVal,
            timestamp: `${selectedDate} ${timeStr}`,
            date: selectedDate,
            time: timeStr,
            studentId: matched.id,
            studentName: matched.name,
            className,
            status,
            matchType: 'fingerprint_id',
          },
        ],
        selectedDate
      );

      setScannerFeedback({
        type: 'success',
        message: `تم تسجيل حضور ${studentName} بنجاح (${status === 'present' ? 'حاضر' : 'متأخر'})!`,
        studentName,
      });

      setRecentLiveScans((prev) => [
        {
          studentId: matched.id,
          studentName,
          className,
          time: timeStr,
          status,
        },
        ...prev.slice(0, 19),
      ]);
    } else {
      setScannerFeedback({
        type: 'error',
        message: `لم يتم العثور على طالب مرتبط بالبصمة/الكود "${inputVal}". يرجى ربط بصمة الطالب أولاً.`,
      });
    }

    setLiveScannerInput('');
    if (liveInputRef.current) liveInputRef.current.focus();
  };

  // Add Device
  const handleSaveNewDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName.trim()) return;
    addFingerprintDevice({
      name: devName.trim(),
      model: devModel.trim(),
      type: devType,
      location: devLocation.trim(),
      autoMarkLateMinutes: devLateGrace,
    });
    setDevName('');
    setIsAddingDevice(false);
  };

  // Quick auto-assign fingerprint IDs
  const handleAutoAssignSequentialIDs = () => {
    if (students.length === 0) return;
    triggerHaptic(20);
    students.forEach((st, idx) => {
      if (!st.fingerprintId) {
        updateStudent(st.id, { fingerprintId: String(101 + idx) });
      }
    });
    showToast('تم ترقيم بصمات الطلاب تلقائياً (101, 102, 103...) 🔢', 'success');
  };

  const handleCopyFromNationalIDs = () => {
    if (students.length === 0) return;
    triggerHaptic(20);
    let count = 0;
    students.forEach((st) => {
      if (st.nationalId && !st.fingerprintId) {
        updateStudent(st.id, { fingerprintId: st.nationalId });
        count++;
      }
    });
    showToast(`تم تعيين رقم البصمة من السجل المدني لـ ${count} طالب 🪪`, 'success');
  };

  // Filtered students for enrollment
  const filteredEnrollmentStudents = students
    .filter((s) => (enrollClassFilter === 'all' ? true : s.classId === enrollClassFilter))
    .filter(
      (s) =>
        s.name.toLowerCase().includes(enrollSearch.toLowerCase().trim()) ||
        (s.fingerprintId && s.fingerprintId.includes(enrollSearch.trim())) ||
        (s.nationalId && s.nationalId.includes(enrollSearch.trim()))
    );

  const enrolledCount = students.filter((s) => s.fingerprintId).length;

  return (
    <div
      id="fingerprint-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsFingerprintModalOpen(false);
      }}
    >
      <div
        id="fingerprint-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-md">
              <Fingerprint className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold">جهاز البصمة والتحضير البيومتري</h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                استيراد سجلات الحضور بسهولة من أجهزة ZKTeco وفلاشات USB والماسح الحي
              </p>
            </div>
          </div>
          <button
            id="close-fingerprint-modal-btn"
            onClick={() => setIsFingerprintModalOpen(false)}
            className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-1 overflow-x-auto">
          <button
            id="fp-tab-import"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            استيراد ملف البصمة (USB / Excel / DAT)
          </button>

          <button
            id="fp-tab-live"
            onClick={() => setActiveTab('live_scanner')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'live_scanner'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            الماسح والتحضير المباشر (Live Scanner)
          </button>

          <button
            id="fp-tab-devices"
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'devices'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-4 h-4" />
            الأجهزة المربوطة ({fingerprintDevices.length})
          </button>

          <button
            id="fp-tab-enrollment"
            onClick={() => setActiveTab('enrollment')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'enrollment'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            ربط بصمات الطلاب ({enrolledCount}/{students.length})
          </button>

          <button
            id="fp-tab-guide"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            دليل الربط السريع
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: IMPORT USB / DAT / EXCEL / CSV */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                id="fingerprint-dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20'
                }`}
              >
                <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <Fingerprint className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  اسحب ملف سجلات البصمة هنا أو انقر للاختيار
                </h3>
                <p className="text-sm text-slate-500 mb-4 max-w-lg mx-auto">
                  يدعم ملفات فلاشة USB من أجهزة <b>ZKTeco (.dat, .txt)</b> وملفات <b>Excel (.xlsx, .xls)</b> و <b>CSV</b>
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label className="cursor-pointer px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    اختيار ملف من الفلاشة / الجهاز
                    <input
                      type="file"
                      accept=".dat,.txt,.log,.csv,.tsv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileProcess(f);
                      }}
                    />
                  </label>

                  <button
                    id="btn-demo-fingerprint-test"
                    onClick={handleTestDemoLogs}
                    className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    تجربة سجل بصمة فوري جاهز
                  </button>
                </div>
              </div>

              {/* Sample Templates Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>نماذج ملفات جهاز البصمة للتحميل:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => downloadSampleFingerprintDAT(targetDateInput)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                    نموذج ZKTeco (.dat)
                  </button>
                  <button
                    onClick={() => downloadSampleFingerprintExcel(targetDateInput)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    نموذج Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => downloadSampleFingerprintCSV(targetDateInput)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                    نموذج CSV
                  </button>
                </div>
              </div>

              {/* Parsing Loading */}
              {isParsing && (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">جاري قراءة ومطابقة سجلات البصمة...</p>
                </div>
              )}

              {/* Parse Results */}
              {parseResult && !isParsing && (
                <div className="space-y-4">
                  {/* Results Overview Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="text-xs text-emerald-700 font-medium">سجلات متطابقة</div>
                      <div className="text-2xl font-bold text-emerald-900 mt-1">
                        {parseResult.matchedCount} <span className="text-xs font-normal text-emerald-700">طالب</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="text-xs text-blue-700 font-medium">حاضر في الموعد</div>
                      <div className="text-2xl font-bold text-blue-900 mt-1">
                        {parseResult.presentCount}
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="text-xs text-amber-700 font-medium">متأخر عن الحصة</div>
                      <div className="text-2xl font-bold text-amber-900 mt-1">
                        {parseResult.lateCount}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-600 font-medium">غير مسجل / مجهول</div>
                      <div className="text-2xl font-bold text-slate-800 mt-1">
                        {parseResult.unmatchedCount}
                      </div>
                    </div>
                  </div>

                  {/* Target Date & Class Selectors */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">تاريخ التحضير:</label>
                        <input
                          type="date"
                          value={targetDateInput}
                          onChange={(e) => setTargetDateInput(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">تطبيق على فصل:</label>
                        <select
                          value={targetClassFilter}
                          onChange={(e) => setTargetClassFilter(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        >
                          <option value="all">جميع الفصول المتطابقة</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <button
                      id="btn-apply-fingerprint-attendance"
                      onClick={handleApplyAttendance}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      تطبيق التحضير على الطلاب فوراً ({parseResult.matchedCount})
                    </button>
                  </div>

                  {/* Matched Logs Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-right text-xs sm:text-sm">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">رقم البصمة</th>
                            <th className="py-2.5 px-3">اسم الطالب</th>
                            <th className="py-2.5 px-3">الفصل</th>
                            <th className="py-2.5 px-3">وقت البصمة</th>
                            <th className="py-2.5 px-3">حالة التحضير</th>
                            <th className="py-2.5 px-3">طريقة المطابقة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parseResult.logs.map((log, idx) => {
                            const isMatched = Boolean(log.studentId);
                            return (
                              <tr
                                key={idx}
                                className={`transition-colors ${
                                  isMatched ? 'hover:bg-emerald-50/40' : 'bg-rose-50/40 text-slate-500'
                                }`}
                              >
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                  {log.rawId}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">
                                  {log.studentName || 'غير مسجل في النظام'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {log.className || '—'}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-700">
                                  {log.time}
                                </td>
                                <td className="py-2.5 px-3">
                                  {isMatched ? (
                                    log.status === 'present' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                        <Check className="w-3 h-3" /> حاضر
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                        <Clock className="w-3 h-3" /> متأخر
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                                      غير مطابق
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-xs text-slate-500">
                                  {log.matchType === 'fingerprint_id' && 'معرف البصمة (PIN)'}
                                  {log.matchType === 'national_id' && 'السجل المدني'}
                                  {log.matchType === 'name' && 'الاسم'}
                                  {log.matchType === 'unmatched' && '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE BIOMETRIC SCANNER (KIOSK MODE) */}
          {activeTab === 'live_scanner' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                      القارئ المباشر نشط (Live Biometric Scanner)
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    تاريخ اليوم: <b className="text-white">{selectedDate}</b>
                  </span>
                </div>

                <div className="max-w-xl mx-auto text-center py-4">
                  <div className="w-24 h-24 mx-auto mb-4 bg-emerald-500/20 border-2 border-emerald-400/50 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/50 animate-pulse">
                    <Fingerprint className="w-12 h-12 text-emerald-300" />
                  </div>

                  <h3 className="text-xl font-bold mb-2">ضع إصبع الطالب أو امسح الباركود / الكود</h3>
                  <p className="text-xs text-slate-300 mb-6">
                    متوافق مع قوارئ البصمة USB وقوارئ الباركود والبطاقات الذكية، أو كتابة رقم البصمة مباشرة
                  </p>

                  <form onSubmit={handleLiveScanSubmit} className="flex gap-2 max-w-md mx-auto">
                    <input
                      ref={liveInputRef}
                      type="text"
                      value={liveScannerInput}
                      onChange={(e) => setLiveScannerInput(e.target.value)}
                      placeholder="رقم البصمة / السجل المدني / اسم الطالب..."
                      className="flex-1 px-4 py-3 bg-slate-800/90 border border-slate-600 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      تسجيل
                    </button>
                  </form>

                  {/* Feedback Message */}
                  {scannerFeedback.type && (
                    <div
                      className={`mt-4 p-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 ${
                        scannerFeedback.type === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {scannerFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      )}
                      <span>{scannerFeedback.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Student Click Punch-in */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  تسجيل سريع بالنقر على الطالب:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {students.slice(0, 12).map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setLiveScannerInput(st.fingerprintId || st.name);
                        setTimeout(() => handleLiveScanSubmit(), 50);
                      }}
                      className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-right transition-all group"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                        {st.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                        <span>بصمة #{st.fingerprintId || '—'}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold opacity-0 group-hover:opacity-100">
                          تبصيم 🟢
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Live Scans Ticker */}
              {recentLiveScans.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
                    <span>سجل التبصيم المباشر الأخير:</span>
                    <span className="text-emerald-700 font-semibold">{recentLiveScans.length} عملية تسجيل</span>
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recentLiveScans.map((scan, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            ✓
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">{scan.studentName}</span>
                            <span className="text-slate-500 mr-2">({scan.className})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-600">{scan.time}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              scan.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {scan.status === 'present' ? 'حاضر' : 'متأخر'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEVICES CONFIGURATION */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">أجهزة البصمة المربوطة بالنظام</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    إدارة أجهزة الحضور بالبصمة في الصالة الرياضية أو المدرسة وقواعد احتساب التأخر
                  </p>
                </div>
                {!isAddingDevice && (
                  <button
                    id="btn-add-new-device"
                    onClick={() => setIsAddingDevice(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة جهاز بصمة جديد
                  </button>
                )}
              </div>

              {/* Add Device Form */}
              {isAddingDevice && (
                <form
                  onSubmit={handleSaveNewDevice}
                  className="p-5 bg-slate-50 border border-emerald-200 rounded-2xl space-y-4 animate-in fade-in"
                >
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-emerald-600" />
                    بيانات جهاز البصمة الجديد
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم الجهاز</label>
                      <input
                        type="text"
                        required
                        value={devName}
                        onChange={(e) => setDevName(e.target.value)}
                        placeholder="مثال: جهاز مدخل الصالة الرياضية"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الموديل / النوع</label>
                      <select
                        value={devModel}
                        onChange={(e) => setDevModel(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="ZKTeco K40 / USB">ZKTeco K40 (فلاشة USB / شبكة)</option>
                        <option value="ZKTeco iClock / uFace">ZKTeco iClock / uFace</option>
                        <option value="USB Live Fingerprint Reader">قارئ بصمة USB مباشر للكمبيوتر</option>
                        <option value="Realand / Anviz Biometric">Realand / Anviz</option>
                        <option value="قارئ باركود وبطاقات ذكية">قارئ باركود وبطاقات ذكية</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">مكان الجهاز</label>
                      <input
                        type="text"
                        value={devLocation}
                        onChange={(e) => setDevLocation(e.target.value)}
                        placeholder="مثال: مدخل الصالة / غرفة المعلم"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        مهلة احتساب التأخر (بالدقائق بعد بداية الحصة)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={devLateGrace}
                        onChange={(e) => setDevLateGrace(parseInt(e.target.value) || 10)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingDevice(false)}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      حفظ الجهاز
                    </button>
                  </div>
                </form>
              )}

              {/* Device Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fingerprintDevices.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                            <Fingerprint className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{dev.name}</h4>
                            <span className="text-xs text-slate-500">{dev.model}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          متصل وجاهز
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px]">الموقع:</span>
                          <span className="font-semibold text-slate-800">{dev.location || 'غير محدد'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">آخر مزامنة:</span>
                          <span className="font-semibold text-slate-800">{dev.lastSync || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">
                        مهلة التأخر: <b>{dev.autoMarkLateMinutes || 10} دقائق</b>
                      </span>
                      <button
                        onClick={() => deleteFingerprintDevice(dev.id)}
                        className="text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="حذف الجهاز"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BIOMETRIC ENROLLMENT & PAIRING */}
          {activeTab === 'enrollment' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">ربط وتعيين بصمات الطلاب</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تخصيص رقم البصمة (PIN / ID) لكل طالب لمطابقة سجلات جهاز البصمة تلقائياً
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleAutoAssignSequentialIDs}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    ترقيم تلقائي (101, 102...)
                  </button>

                  <button
                    onClick={handleCopyFromNationalIDs}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    استخدام السجل المدني كبصمة
                  </button>
                </div>
              </div>

              {/* Filter & Search */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={enrollSearch}
                    onChange={(e) => setEnrollSearch(e.target.value)}
                    placeholder="بحث باسم الطالب أو رقم البصمة..."
                    className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <select
                  value={enrollClassFilter}
                  onChange={(e) => setEnrollClassFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="all">جميع الفصول ({students.length})</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enrollment Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">اسم الطالب</th>
                        <th className="py-2.5 px-3">الفصل</th>
                        <th className="py-2.5 px-3">السجل المدني</th>
                        <th className="py-2.5 px-3">رقم البصمة بالجهاز</th>
                        <th className="py-2.5 px-3 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEnrollmentStudents.map((st, idx) => {
                        const cls = classes.find((c) => c.id === st.classId);
                        const isEditing = editingStudentId === st.id;

                        return (
                          <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{st.name}</td>
                            <td className="py-2.5 px-3 text-slate-600">{cls?.name || '—'}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{st.nationalId || '—'}</td>
                            <td className="py-2.5 px-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingFpVal}
                                  onChange={(e) => setEditingFpVal(e.target.value)}
                                  placeholder="رقم البصمة..."
                                  className="px-2 py-1 bg-white border border-emerald-500 rounded-lg text-xs font-mono w-28 focus:outline-hidden"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateStudent(st.id, { fingerprintId: editingFpVal.trim() || undefined });
                                      setEditingStudentId(null);
                                    }
                                  }}
                                />
                              ) : st.fingerprintId ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                                  <Fingerprint className="w-3.5 h-3.5" />
                                  {st.fingerprintId}
                                </span>
                              ) : (
                                <span className="text-xs text-amber-600 font-medium">لم يتم التعيين</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isEditing ? (
                                <button
                                  onClick={() => {
                                    updateStudent(st.id, { fingerprintId: editingFpVal.trim() || undefined });
                                    setEditingStudentId(null);
                                  }}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                                >
                                  حفظ
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingStudentId(st.id);
                                    setEditingFpVal(st.fingerprintId || '');
                                  }}
                                  className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="تعديل رقم البصمة"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QUICK SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-900">
                  <h4 className="font-bold text-base mb-1">خطوات سحب سجلات الحضور من جهاز البصمة (ZKTeco)</h4>
                  <p className="text-emerald-800/90 text-xs leading-relaxed">
                    يمكنك سحب سجلات الحضور اليومية أو الشهرية من جهاز البصمة المدرسي في أقل من دقيقة باستخدام أي فلاشة USB وتفريغها هنا مباشرة.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs relative">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-3">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1.5">توصيل الفلاشة بجهاز البصمة</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    أدخل فلاشة USB في منفذ جهاز البصمة، ثم اضغط على زر <b>Menu / القائمة</b> على الجهاز.
                  </p>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs relative">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-3">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1.5">تنزيل سجلات الحضور (Download AttLog)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    اختر <b>USB Manager</b> ثم اضغط على <b>Download Attendance Data</b> أو <b>تنزيل سجلات الحضور</b>. سيتم حفظ ملف باسم <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono text-[11px]">1_attlog.dat</code> على الفلاشة.
                  </p>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs relative">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-3">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1.5">الرفع في التطبيق وتطبيق التحضير</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    افتح تبويب <b>استيراد ملف البصمة</b> واسحب ملف الـ DAT أو ملف Excel، ثم اضغط على <b>تطبيق التحضير على الطلاب فوراً</b>.
                  </p>
                </div>
              </div>

              {/* Pro tips */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  ملاحظات ونصائح مفيدة:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>
                    يمكنك استخدام <b>قارئ بصمة USB مباشر</b> وتوصيله بالكمبيوتر المحمول واستخدام تبويب <b>الماسح والتحضير المباشر</b> لتبصيم الطلاب عند مدخل الصالة.
                  </li>
                  <li>
                    إذا كانت أرقام الطلاب في جهاز البصمة هي أرقام الهوية أو أرقام تسلسلية (101, 102...)، يمكنك مطابقتها من تبويب <b>ربط بصمات الطلاب</b> بضغطة زر واحدة.
                  </li>
                  <li>
                    يقوم النظام بحساب وقت التبصيم ومقارنته ببداية الحصة لتحديد الطالب <b>الحاضر في الموعد</b> مقابل <b>المتأخر</b> تلقائياً.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Fingerprint className="w-4 h-4 text-emerald-600" />
            <span>نظام البصمة متوافق مع كافة أجهزة ZKTeco وقوارئ USB وفلاشات الحضور</span>
          </div>

          <button
            onClick={() => setIsFingerprintModalOpen(false)}
            className="px-5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
