import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportJSONBackup } from '../utils/fileImportExport';
import {
  Settings,
  Save,
  RotateCcw,
  Download,
  Upload,
  School,
  UserCheck,
  CheckCircle2,
  Award,
  AlertTriangle,
  Flame,
  FileJson,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetAllData, importAllData, showToast, classes, students, dailyLogs } = useApp();

  const [formState, setFormState] = useState({ ...settings });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('حجم الصورة كبير جداً (يجب أن يكون أقل من 2 ميجابايت)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormState((prev) => ({ ...prev, schoolLogo: base64 }));
      showToast('تم تحميل شعار المدرسة بنجاح 🏫', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formState);
  };

  const handleReset = () => {
    if (confirm('هل أنت تأكد من استعادة البيانات الافتراضية للبرنامج؟ سيتم مسح أي تعديلات سابقة.')) {
      resetAllData();
      setFormState({ ...settings });
    }
  };

  const handleExportBackup = () => {
    exportJSONBackup(classes, students, dailyLogs, formState);
    showToast('تم تصدير النسخة الاحتياطية بنجاح 📁', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.classes && parsed.students && parsed.settings) {
          importAllData(parsed);
          setFormState(parsed.settings);
        } else {
          showToast('ملف غير صالح لمستند حصتي الرياضية', 'error');
        }
      } catch {
        showToast('حدث خطأ أثناء قراءة الملف', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 emerald-card-shadow">
        <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          <span>إعدادات النظام وتوزيع النقاط</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          خصص درجات الحضور والمشاركات والمخالفات، وقم بإدارة بيانات المدرسة
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Section 1: School & Teacher Profile */}
        <div className="bg-white p-4 rounded-3xl border border-emerald-100 emerald-card-shadow space-y-3">
          <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2">
            <School className="w-4 h-4 text-emerald-600" />
            <span>بيانات المدرسة والمعلم</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">شعار المدرسة</label>
              <div className="flex items-center gap-3">
                {formState.schoolLogo ? (
                  <div className="relative w-14 h-14 rounded-2xl border border-emerald-200 overflow-hidden shrink-0 bg-white p-1">
                    <img
                      src={formState.schoolLogo}
                      alt="شعار المدرسة"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, schoolLogo: '' })}
                      className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-bl-xl shadow-xs hover:bg-red-700 transition-colors"
                      title="حذف الشعار"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center shrink-0 text-zinc-400">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[9px] font-bold mt-0.5">لا يوجد logo</span>
                  </div>
                )}

                <label className="flex-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl p-2.5 text-center cursor-pointer transition-all">
                  <span className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>{formState.schoolLogo ? 'تغيير صورة الشعار' : 'رفع صورة شعار المدرسة'}</span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">اسم المدرسة *</label>
              <input
                type="text"
                required
                value={formState.schoolName}
                onChange={(e) => setFormState({ ...formState, schoolName: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">اسم معلم البدنية *</label>
              <input
                type="text"
                required
                value={formState.teacherName}
                onChange={(e) => setFormState({ ...formState, teacherName: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">مظهر التطبيق (Theme)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, theme: 'light' })}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    formState.theme !== 'dark'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                  }`}
                >
                  ☀️ المظهر الفاتح (Light)
                </button>
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, theme: 'dark' })}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    formState.theme === 'dark'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                  }`}
                >
                  🌙 المظهر الداكن (Dark)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Points Customization (إعدادات النقاط) */}
        <div className="bg-white p-4 rounded-3xl border border-emerald-100 emerald-card-shadow space-y-3">
          <div className="border-b border-zinc-100 pb-2">
            <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>توزيع درجات وتقييم البدنية (النقاط)</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              هذه النقاط تؤثر تلقائياً على حساب المجموع التراكمي لدرجة كل طالب
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 🟢 الحضور */}
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 space-y-1">
              <label className="block text-xs font-bold text-emerald-900">🟢 الحضور (حاضر)</label>
              <input
                type="number"
                value={formState.attendance}
                onChange={(e) => setFormState({ ...formState, attendance: Number(e.target.value) })}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-950 outline-none"
              />
            </div>

            {/* 🟡 التأخير */}
            <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 space-y-1">
              <label className="block text-xs font-bold text-amber-900">🟡 التأخير (متأخر)</label>
              <input
                type="number"
                value={formState.late}
                onChange={(e) => setFormState({ ...formState, late: Number(e.target.value) })}
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-black text-amber-950 outline-none"
              />
            </div>

            {/* ⭐ المشاركة */}
            <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 space-y-1">
              <label className="block text-xs font-bold text-amber-900">⭐ المشاركة التفاعلية</label>
              <input
                type="number"
                value={formState.participation}
                onChange={(e) => setFormState({ ...formState, participation: Number(e.target.value) })}
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-black text-amber-950 outline-none"
              />
            </div>

            {/* 🏆 التميز */}
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 space-y-1">
              <label className="block text-xs font-bold text-emerald-900">🏆 التميز الرياضي</label>
              <input
                type="number"
                value={formState.excellence}
                onChange={(e) => setFormState({ ...formState, excellence: Number(e.target.value) })}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-950 outline-none"
              />
            </div>

            {/* ⚠️ المخالفة */}
            <div className="bg-red-50/70 p-3 rounded-2xl border border-red-200 space-y-1">
              <label className="block text-xs font-bold text-red-900">⚠️ المخالفة السلوكية</label>
              <input
                type="number"
                value={formState.violation}
                onChange={(e) => setFormState({ ...formState, violation: Number(e.target.value) })}
                className="w-full bg-white border border-red-300 rounded-xl px-3 py-1.5 text-xs font-black text-red-950 outline-none"
              />
            </div>

            {/* 📢 الإنذار */}
            <div className="bg-orange-50/70 p-3 rounded-2xl border border-orange-200 space-y-1">
              <label className="block text-xs font-bold text-orange-900">📢 الإنذار الرسمي</label>
              <input
                type="number"
                value={formState.warning}
                onChange={(e) => setFormState({ ...formState, warning: Number(e.target.value) })}
                className="w-full bg-white border border-orange-300 rounded-xl px-3 py-1.5 text-xs font-black text-orange-950 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>حفظ إعدادات الدرجات والنظام</span>
          </button>
        </div>
      </form>

      {/* Section 3: Data Backup & Restore */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 emerald-card-shadow space-y-3">
        <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2">
          <FileJson className="w-4 h-4 text-emerald-600" />
          <span>النسخ الاحتياطي واسترجاع البيانات</span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير نسخة JSON</span>
          </button>

          <label className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>استرجاع ملف JSON</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>

        {/* Reset to defaults button */}
        <div className="pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={handleReset}
            className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs py-2.5 rounded-2xl transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>استعادة البيانات النموذجية الأولية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
