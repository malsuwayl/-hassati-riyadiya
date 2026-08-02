import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, School, User, GraduationCap, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  onComplete?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const { updateSettings, addClass, loadDemoData, showToast, setOnboardingCompleted } = useApp();

  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [firstClassName, setFirstClassName] = useState('الصف الأول الثانوي - 1');
  const [grade, setGrade] = useState('الأول الثانوي');
  const [period, setPeriod] = useState('الحصة الأولى');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !schoolName.trim()) {
      showToast('يرجى كتابة اسم المعلم والمدرسة للبدء', 'warning');
      return;
    }

    // Save Settings
    updateSettings({
      teacherName: teacherName.trim(),
      schoolName: schoolName.trim(),
    });

    // Add first class if provided
    if (firstClassName.trim()) {
      addClass({
        name: firstClassName.trim(),
        grade: grade || 'الأول الثانوي',
        section: '1',
        period: period || 'الحصة الأولى',
        day: 'الأحد',
        notes: 'الحصة الرياضية بالملعب',
      });
    }

    localStorage.setItem('hosati_pe_onboarding_completed', 'true');
    setOnboardingCompleted(true);
    showToast('مرحباً بك! تم إعداد التطبيق بنجاح ⚽', 'success');
    if (onComplete) onComplete();
  };

  const handleUseDemo = () => {
    loadDemoData();
    localStorage.setItem('hosati_pe_onboarding_completed', 'true');
    setOnboardingCompleted(true);
    if (onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 border border-emerald-100">
        {/* Header Hero */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/30">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-zinc-900 leading-tight">
            مرحباً بك في تطبيق <span className="text-emerald-600">حصتي الرياضية</span> ⚽
          </h1>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
            منصتك المتكاملة لإدارة حصص التربية البدنية، رصد الحضور، وتقييم الأداء والتميز السلوكي للطلاب بسهولة وسرعة.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>اسم معلم / معلمة البدنية *</span>
            </label>
            <input
              type="text"
              required
              placeholder="أ. عبد الرحمن الشهري"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1">
              <School className="w-3.5 h-3.5 text-emerald-600" />
              <span>اسم المدرسة *</span>
            </label>
            <input
              type="text"
              required
              placeholder="مدرسة النموذجية الثانوية"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="pt-2 border-t border-zinc-100">
            <label className="block text-xs font-extrabold text-zinc-900 mb-1.5 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>إضافة أول فصل دراسي (اختياري)</span>
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="اسم الفصل (مثال: الصف الأول الثانوي - 1)"
                value={firstClassName}
                onChange={(e) => setFirstClassName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="المرحلة (مثال: الأول الثانوي)"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-1.5 text-xs font-medium outline-none"
                />
                <input
                  type="text"
                  placeholder="الحصة (مثال: الحصة الأولى)"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-1.5 text-xs font-medium outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-emerald-500"
          >
            <span>بدء استخدام التطبيق</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </form>

        {/* Quick Demo Data Option */}
        <div className="pt-2 border-t border-zinc-100 text-center space-y-2">
          <p className="text-[11px] text-zinc-400">تريد تجربة التطبيق أولاً ببيانات نموذجية؟</p>
          <button
            type="button"
            onClick={handleUseDemo}
            className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs py-2.5 rounded-2xl border border-zinc-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>تحميل بيانات تجريبية للتجربة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
