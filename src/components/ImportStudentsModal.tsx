import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  downloadSampleTemplateExcel,
  downloadSampleTemplateCSV,
  parseStudentsFileAdvanced,
  ParseStudentsResult,
} from '../utils/fileImportExport';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PlusCircle,
  X,
  Sparkles,
  Users,
} from 'lucide-react';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { students, classes, importStudentsBatch, triggerHaptic } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseStudentsResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Filters & options
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'new_class' | 'duplicate' | 'error'>('all');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [includePhysicalMeasurements, setIncludePhysicalMeasurements] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileSelect = async (selectedFile: File) => {
    triggerHaptic(20);
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setParseResult(null);

    try {
      const result = await parseStudentsFileAdvanced(selectedFile, students, classes);
      setParseResult(result);
    } catch (err: any) {
      setParseError(err.message || 'حدث خطأ أثناء قراءة الملف. يرجى التأكد من الصيغة.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleReset = () => {
    triggerHaptic(10);
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setStatusFilter('all');
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;
    triggerHaptic(40);

    // Filter rows to import based on user preferences
    const rowsToProcess = parseResult.rows.filter((r) => {
      if (r.status === 'error') return false;
      if (r.status === 'duplicate' && skipDuplicates) return false;
      return true;
    });

    if (rowsToProcess.length === 0) {
      alert('لا توجد بيانات صالحة للاستيراد');
      return;
    }

    const payload = rowsToProcess.map((r) => ({
      studentNumber: r.studentNumber,
      name: r.name,
      className: r.className,
      medicalNotes: r.medicalNotes,
      height: includePhysicalMeasurements ? r.height : undefined,
      weight: includePhysicalMeasurements ? r.weight : undefined,
    }));

    importStudentsBatch(payload);
    onClose();
  };

  // Filtered rows for preview table
  const filteredRows = parseResult
    ? parseResult.rows.filter((r) => {
        if (statusFilter === 'valid') return r.status === 'valid' && !r.isNewClass;
        if (statusFilter === 'new_class') return r.isNewClass && r.status !== 'error';
        if (statusFilter === 'duplicate') return r.status === 'duplicate';
        if (statusFilter === 'error') return r.status === 'error';
        return true;
      })
    : [];

  const eligibleCount = parseResult
    ? parseResult.rows.filter((r) => {
        if (r.status === 'error') return false;
        if (r.status === 'duplicate' && skipDuplicates) return false;
        return true;
      }).length
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl border border-zinc-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-900">
                استيراد قائمة الطلاب من ملف
              </h2>
              <p className="text-xs font-bold text-zinc-500">
                دعَم ملفات Excel (.xlsx) و CSV مع إنشاء الفصول ومنع التكرار تلقائياً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Template Downloads & File Picker */}
          {!parseResult && !isParsing && (
            <div className="space-y-5">
              {/* Sample Template Section */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>حمل النموذج القياسي أولاً لتنسيق بيانات طلابك بسهولة:</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      triggerHaptic(15);
                      downloadSampleTemplateExcel();
                    }}
                    className="bg-white border border-emerald-300 hover:bg-emerald-100/60 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>تحميل نموذج Excel (.xlsx)</span>
                    <Download className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic(15);
                      downloadSampleTemplateCSV();
                    }}
                    className="bg-white border border-emerald-300 hover:bg-emerald-100/60 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>تحميل نموذج CSV (.csv)</span>
                    <Download className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                  </button>
                </div>

                <div className="pt-2 border-t border-emerald-200/50 text-[11px] font-bold text-emerald-800/90 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                    <strong>الأعمدة المطلوبة الأساسية:</strong> رقم الطالب/السجل المدني ، اسم الطالب الرباعي ، الفصل/الصف.
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                    <strong>الأعمدة الاختيارية:</strong> الطول (سم) ، الوزن (كجم) ، الملاحظات الصحية.
                  </p>
                </div>
              </div>

              {/* Drag & Drop File Picker */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 hover:border-emerald-500 bg-zinc-50/50 hover:bg-emerald-50/30 rounded-3xl p-8 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .tsv, .txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-zinc-100 group-hover:bg-emerald-100 text-zinc-400 group-hover:text-emerald-700 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="text-sm font-black text-zinc-800 group-hover:text-emerald-800 mb-1">
                  إسقاط ملف الطلاب هنا، أو انقر للاختيار من جهازك
                </h3>
                <p className="text-xs font-bold text-zinc-400">
                  يدعم ملفات Excel (.xlsx, .xls) وقوائم النص (.csv)
                </p>
              </div>

              {parseError && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-bold text-rose-800 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-black text-zinc-700">
                جاري قراءة الملف وتحليل الصفوف والتحقق من التكرار...
              </p>
            </div>
          )}

          {/* Step 2: Preview & Validation Results */}
          {parseResult && (
            <div className="space-y-4">
              {/* Summary Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3">
                  <span className="text-[11px] font-extrabold text-emerald-800 block mb-0.5">
                    جاهز للاستيراد
                  </span>
                  <span className="text-lg font-black text-emerald-900">
                    {parseResult.validCount} <span className="text-xs font-bold">طالب</span>
                  </span>
                </div>

                <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-3">
                  <span className="text-[11px] font-extrabold text-sky-800 block mb-0.5">
                    فصول جديدة
                  </span>
                  <span className="text-lg font-black text-sky-900">
                    {parseResult.newClassesCount} <span className="text-xs font-bold">فصل</span>
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3">
                  <span className="text-[11px] font-extrabold text-amber-800 block mb-0.5">
                    طلاب مكررين
                  </span>
                  <span className="text-lg font-black text-amber-900">
                    {parseResult.duplicateCount} <span className="text-xs font-bold">طالب</span>
                  </span>
                </div>

                <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3">
                  <span className="text-[11px] font-extrabold text-rose-800 block mb-0.5">
                    أخطاء في البيانات
                  </span>
                  <span className="text-lg font-black text-rose-900">
                    {parseResult.errorCount} <span className="text-xs font-bold">صف</span>
                  </span>
                </div>
              </div>

              {/* Informational Alerts */}
              {parseResult.newClassesCount > 0 && (
                <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-3 text-xs font-bold text-sky-900 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    سيتم إنشاء الفصول الجديدة تلقائياً عند التأكيد: ({parseResult.newClassNames.join('، ')})
                  </span>
                </div>
              )}

              {parseResult.duplicateCount > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-xs font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    تنبيه: يوجد {parseResult.duplicateCount} طلاب مكررين في الملف أو النظام. (سيتم تجاوزهم تلقائياً لعدم التكرار).
                  </span>
                </div>
              )}

              {/* Preview Table Controls & Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    الكل ({parseResult.totalCount})
                  </button>

                  <button
                    onClick={() => setStatusFilter('valid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                      statusFilter === 'valid'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    جاهز ({parseResult.validCount})
                  </button>

                  {parseResult.newClassesCount > 0 && (
                    <button
                      onClick={() => setStatusFilter('new_class')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                        statusFilter === 'new_class'
                          ? 'bg-sky-700 text-white'
                          : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                      }`}
                    >
                      فصول جديدة ({parseResult.newClassesCount})
                    </button>
                  )}

                  {parseResult.duplicateCount > 0 && (
                    <button
                      onClick={() => setStatusFilter('duplicate')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                        statusFilter === 'duplicate'
                          ? 'bg-amber-700 text-white'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      مكرر ({parseResult.duplicateCount})
                    </button>
                  )}

                  {parseResult.errorCount > 0 && (
                    <button
                      onClick={() => setStatusFilter('error')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                        statusFilter === 'error'
                          ? 'bg-rose-700 text-white'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      أخطاء ({parseResult.errorCount})
                    </button>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer underline"
                >
                  تغيير الملف
                </button>
              </div>

              {/* Data Table */}
              <div className="border border-zinc-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-right font-sans text-xs">
                  <thead className="bg-zinc-100 text-zinc-700 font-black sticky top-0 z-10 border-b border-zinc-200">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">رقم الطالب</th>
                      <th className="px-3 py-2.5">اسم الطالب</th>
                      <th className="px-3 py-2.5">الفصل</th>
                      <th className="px-3 py-2.5">الطول</th>
                      <th className="px-3 py-2.5">الوزن</th>
                      <th className="px-3 py-2.5">الملاحظات</th>
                      <th className="px-3 py-2.5">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-bold text-zinc-800">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-zinc-400 font-bold">
                          لا توجد صفوف تطابق هذا التصفية
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r) => (
                        <tr
                          key={r.rowIndex}
                          className={`hover:bg-zinc-50 ${
                            r.status === 'error'
                              ? 'bg-rose-50/40'
                              : r.status === 'duplicate'
                              ? 'bg-amber-50/40'
                              : r.isNewClass
                              ? 'bg-sky-50/30'
                              : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-zinc-400">{r.rowIndex}</td>
                          <td className="px-3 py-2 text-zinc-600 font-mono">
                            {r.studentNumber || '-'}
                          </td>
                          <td className="px-3 py-2 font-black text-zinc-900">{r.name || '-'}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] ${
                                r.isNewClass
                                  ? 'bg-sky-100 text-sky-900 border border-sky-300 font-extrabold'
                                  : 'bg-zinc-100 text-zinc-700'
                              }`}
                            >
                              {r.className || '-'}
                              {r.isNewClass && <span className="text-[10px]">🆕</span>}
                            </span>
                          </td>
                          <td className="px-3 py-2">{r.height ? `${r.height} سم` : '-'}</td>
                          <td className="px-3 py-2">{r.weight ? `${r.weight} كجم` : '-'}</td>
                          <td className="px-3 py-2 text-zinc-500 text-[11px]">
                            {r.medicalNotes || '-'}
                          </td>
                          <td className="px-3 py-2">
                            {r.status === 'valid' && !r.isNewClass && (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                جاهز
                              </span>
                            )}
                            {r.status === 'valid' && r.isNewClass && (
                              <span className="inline-flex items-center gap-1 text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md text-[11px]">
                                <PlusCircle className="w-3 h-3 text-sky-600" />
                                فصل جديد
                              </span>
                            )}
                            {r.status === 'duplicate' && (
                              <span
                                className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px]"
                                title={r.warnings.join(' | ')}
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                مكرر
                              </span>
                            )}
                            {r.status === 'error' && (
                              <span
                                className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px]"
                                title={r.errors.join(' | ')}
                              >
                                <XCircle className="w-3 h-3 text-rose-600" />
                                {r.errors[0] || 'خطأ'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Import Options */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2 text-xs font-bold text-zinc-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span>تجاوز الطلاب المكررين تلقائياً (منع التكرار)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePhysicalMeasurements}
                    onChange={(e) => setIncludePhysicalMeasurements(e.target.checked)}
                    className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span>حفظ الطول والوزن تلقائياً في السجل البدني في حال وجودهما</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200/80 hover:bg-zinc-300 text-zinc-700 rounded-xl text-xs font-extrabold cursor-pointer transition-colors"
          >
            إلغاء
          </button>

          {parseResult && (
            <button
              onClick={handleConfirmImport}
              disabled={eligibleCount === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
                eligibleCount > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                  : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>تأكيد استيراد ({eligibleCount}) طالب</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
