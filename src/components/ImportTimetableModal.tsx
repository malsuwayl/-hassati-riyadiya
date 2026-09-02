import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  RefreshCw,
  Eye,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { PeriodTimeConfig } from '../types';

interface ImportTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtractedEntry {
  dayOfWeek: number; // 0..4
  periodNumber: number; // 1..8
  className: string;
}

const DAYS_ARABIC = [
  { index: 0, name: 'الأحد' },
  { index: 1, name: 'الإثنين' },
  { index: 2, name: 'الثلاثاء' },
  { index: 3, name: 'الأربعاء' },
  { index: 4, name: 'الخميس' },
];

const PERIOD_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const ImportTimetableModal: React.FC<ImportTimetableModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { classes, applyTimetableBatch, showToast } = useApp();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Extracted data state
  const [extractedEntries, setExtractedEntries] = useState<ExtractedEntry[]>([]);
  const [extractedPeriodTimes, setExtractedPeriodTimes] = useState<PeriodTimeConfig[]>([]);
  const [detectedClassNames, setDetectedClassNames] = useState<string[]>([]);
  const [classMapping, setClassMapping] = useState<Record<string, string>>({}); // detectedName -> existingClassId or "__NEW__"
  const [includePeriodTimes, setIncludePeriodTimes] = useState<boolean>(true);
  const [step, setStep] = useState<'upload' | 'review'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle paste from clipboard
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة صالح (JPEG أو PNG أو WEBP)', 'error');
      return;
    }

    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setAnalysisError(null);
      // Automatically trigger analysis
      analyzeImage(result, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const analyzeImage = async (base64Data: string, imageMime: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const payload = {
        imageBase64: base64Data,
        mimeType: imageMime,
        existingClasses: classes.map((c) => ({ id: c.id, name: c.name })),
      };

      const response = await fetch('/api/gemini/extract-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'تعذر استخراج بيانات الجدول من الصورة');
      }

      const { entries = [], detectedClasses = [], periodTimes = [] } = resData.data;

      if (entries.length === 0) {
        throw new Error('لم يتم العثور على أي حصص واضحة في الصورة، يرجى التأكد من وضوح صورة الجدول والمحاولة مجدداً.');
      }

      // Filter valid day and period entries
      const validEntries: ExtractedEntry[] = entries.filter(
        (e: any) =>
          typeof e.dayOfWeek === 'number' &&
          e.dayOfWeek >= 0 &&
          e.dayOfWeek <= 4 &&
          typeof e.periodNumber === 'number' &&
          e.periodNumber >= 1 &&
          e.periodNumber <= 8 &&
          e.className &&
          typeof e.className === 'string'
      );

      setExtractedEntries(validEntries);
      setExtractedPeriodTimes(periodTimes);

      // Collect all unique detected class names
      const uniqueNames = Array.from(
        new Set([
          ...detectedClasses,
          ...validEntries.map((e) => e.className.trim()),
        ])
      ).filter(Boolean);

      setDetectedClassNames(uniqueNames);

      // Build initial class mappings (try to auto-match existing classes)
      const initialMap: Record<string, string> = {};
      uniqueNames.forEach((detectedName) => {
        const lowerDet = detectedName.toLowerCase().replace(/[^0-9a-zA-Z\u0621-\u064A]/g, '');
        const matched = classes.find((c) => {
          const lowerC = c.name.toLowerCase().replace(/[^0-9a-zA-Z\u0621-\u064A]/g, '');
          return lowerC === lowerDet || lowerC.includes(lowerDet) || lowerDet.includes(lowerC);
        });

        if (matched) {
          initialMap[detectedName] = matched.id;
        } else {
          initialMap[detectedName] = '__NEW__';
        }
      });

      setClassMapping(initialMap);
      setStep('review');
      showToast(`تم استخراج ${validEntries.length} حصة بنجاح بواسطة الذكاء الاصطناعي 🎉`, 'success');
    } catch (err: any) {
      console.error('Error analyzing timetable image:', err);
      setAnalysisError(err?.message || 'حدث خطأ أثناء قراءة الجدول، يرجى التأكد من جودة الصورة والمحاولة مجدداً.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyTimetable = () => {
    // 1. Prepare new classes to create
    const newClassesToCreate: Array<{ id: string; name: string }> = [];
    const finalMap: Record<string, string> = {};

    detectedClassNames.forEach((detectedName, idx) => {
      const mappedVal = classMapping[detectedName];
      if (mappedVal === '__NEW__') {
        const newId = `cls-ai-${Date.now()}-${idx}`;
        newClassesToCreate.push({ id: newId, name: detectedName });
        finalMap[detectedName] = newId;
      } else if (mappedVal) {
        finalMap[detectedName] = mappedVal;
      }
    });

    // 2. Build timetable entries
    const finalEntries = extractedEntries
      .map((entry) => {
        const classId = finalMap[entry.className.trim()] || classMapping[entry.className.trim()];
        if (!classId || classId === '__NEW__') {
          // Check if newly created
          const newly = newClassesToCreate.find((nc) => nc.name === entry.className.trim());
          if (newly) {
            return {
              dayOfWeek: entry.dayOfWeek,
              periodNumber: entry.periodNumber,
              classId: newly.id,
            };
          }
          return null;
        }
        return {
          dayOfWeek: entry.dayOfWeek,
          periodNumber: entry.periodNumber,
          classId,
        };
      })
      .filter((e): e is { dayOfWeek: number; periodNumber: number; classId: string } => Boolean(e));

    applyTimetableBatch(
      finalEntries,
      newClassesToCreate,
      includePeriodTimes && extractedPeriodTimes.length > 0 ? extractedPeriodTimes : undefined
    );

    onClose();
  };

  const updateCellClass = (dayOfWeek: number, periodNumber: number, newClassName: string) => {
    setExtractedEntries((prev) => {
      const existingIdx = prev.findIndex(
        (e) => e.dayOfWeek === dayOfWeek && e.periodNumber === periodNumber
      );
      if (existingIdx >= 0) {
        if (!newClassName) {
          return prev.filter((_, i) => i !== existingIdx);
        }
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], className: newClassName };
        return copy;
      } else {
        if (!newClassName) return prev;
        return [...prev, { dayOfWeek, periodNumber, className: newClassName }];
      }
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 font-sans"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>إضافة الجدول من صورة ذكياً</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  AI Vision Scan
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                ارفع صورة جدولك الأسبوعي وسيقوم الذكاء الاصطناعي بقراءته وترتيب حصصك وفصولك في ثوانٍ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Drop / Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer group space-y-4"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 mx-auto flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
                  {isAnalyzing ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-slate-800">
                    {isAnalyzing
                      ? 'جاري قراءة صورة الجدول بواسطة الذكاء الاصطناعي...'
                      : 'اسحب صورة الجدول وضعها هنا، أو اضغط للاختيار من جهازك'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    يدعم صور الجداول الورقية، المصورة بالجوال، ملفات PDF المحولة لصور، أو صور منصة مدرستي ونور
                  </p>
                </div>

                {!isAnalyzing && (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>اختيار صورة الجدول</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>التقاط صورة بالكاميرا</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Paste or quick tip notice */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3 text-xs">
                <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-slate-600 font-bold">
                  <span className="text-slate-800 block">نصائح للحصول على أدق نتيجة في المسح:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                    <li>يمكنك أيضاً الضغط على <strong>(Ctrl + V / لصق)</strong> بعد نسخ صورة الجدول مباشرة.</li>
                    <li>تأكد من إضاءة الصورة ووضوح أرقام الحصص وأيام الأسبوع وأسماء الفصول.</li>
                    <li>النظام سيتعرف تلقائياً على الفصول ويربطها بالفصول المسجلة لديك أو ينشئ فصولاً جديدة تلقائياً.</li>
                  </ul>
                </div>
              </div>

              {/* Error Display */}
              {analysisError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-rose-950">تعذر تحليل الصورة</p>
                    <p className="text-rose-800 font-medium">{analysisError}</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 inline-flex items-center gap-1.5 text-rose-700 hover:underline font-black cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة اختيار صورة أخرى</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              {/* Summary Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-emerald-950">
                      تم استخراج {extractedEntries.length} حصة بنجاح!
                    </h3>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      راجع الجدول أدناه وقم بتعديل أي خلية أو ربط الفصول قبل التطبيق النهائي.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setImagePreview(null);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>مسح صورة أخرى</span>
                </button>
              </div>

              {/* Class Mapping Card */}
              {detectedClassNames.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>مطابقة الفصول المستخرجة ({detectedClassNames.length} فصول مكتشفة):</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {detectedClassNames.map((detectedName) => {
                      const currentVal = classMapping[detectedName] || '__NEW__';

                      return (
                        <div
                          key={detectedName}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col gap-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800">{detectedName}</span>
                            <span className="text-[10px] text-slate-400 font-bold">في الصورة</span>
                          </div>

                          <select
                            value={currentVal}
                            onChange={(e) =>
                              setClassMapping((prev) => ({
                                ...prev,
                                [detectedName]: e.target.value,
                              }))
                            }
                            className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500"
                          >
                            <option value="__NEW__">✨ إنشاء كفصل جديد ("{detectedName}")</option>
                            {classes.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                🔗 ربط مع: {cls.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Interactive Timetable Grid Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>معاينة وتعديل الجدول الأسبوعي المستخرج:</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-bold">
                    يمكنك تغيير الفصل في أي خلية مباشرة بالنقر عليها
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-right text-xs font-bold border-collapse min-w-[600px] bg-white">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                        <th className="p-2.5 border-l border-slate-200 w-24 text-center font-black">
                          اليوم
                        </th>
                        {PERIOD_NUMBERS.map((p) => (
                          <th
                            key={p}
                            className="p-2 text-center border-l border-slate-200 min-w-[80px]"
                          >
                            الحصة {p}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DAYS_ARABIC.map((day) => (
                        <tr key={day.index} className="hover:bg-slate-50/70">
                          <td className="p-2.5 font-black text-slate-900 border-l border-slate-200 bg-slate-50/90 text-center">
                            {day.name}
                          </td>
                          {PERIOD_NUMBERS.map((p) => {
                            const entry = extractedEntries.find(
                              (e) => e.dayOfWeek === day.index && e.periodNumber === p
                            );
                            const classNameVal = entry ? entry.className : '';

                            return (
                              <td
                                key={p}
                                className={`p-1.5 border-l border-slate-100 text-center transition-colors ${
                                  classNameVal ? 'bg-emerald-50/40' : ''
                                }`}
                              >
                                <input
                                  type="text"
                                  value={classNameVal}
                                  onChange={(e) =>
                                    updateCellClass(day.index, p, e.target.value)
                                  }
                                  placeholder="فارغ"
                                  className={`w-full text-center text-xs font-bold rounded-lg px-1.5 py-1 outline-none transition-all ${
                                    classNameVal
                                      ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-200 focus:bg-white focus:border-emerald-500'
                                      : 'bg-transparent text-slate-400 hover:bg-slate-50 focus:bg-white focus:border focus:border-slate-300'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Period Times Option (if detected) */}
              {extractedPeriodTimes.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-950 font-bold">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>
                      تم رصد أوقات الحصص في الصورة ({extractedPeriodTimes.length} حصص مع توقيتها). هل ترغب بتطبيقها أيضاً؟
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-black text-amber-900">
                    <input
                      type="checkbox"
                      checked={includePeriodTimes}
                      onChange={(e) => setIncludePeriodTimes(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span>تطبيق أوقات الحصص</span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            إلغاء
          </button>

          {step === 'review' && (
            <button
              type="button"
              onClick={handleApplyTimetable}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تطبيق وحفظ الجدول في التطبيق 📅</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
