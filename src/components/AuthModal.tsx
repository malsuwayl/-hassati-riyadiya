import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, LogOut, UserCheck, Mail, Lock, Sparkles, X, ShieldCheck, CloudCheck, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    authLoading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logoutUser,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('يرجى كتابة البريد الإلكتروني وكلمة المرور');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        showToast('تم تسجيل الدخول بنجاح! ☁️', 'success');
      } else {
        await registerWithEmail(email, password);
        showToast('تم إنشاء الحساب وحفظ بياناتك بنجاح! 🎉', 'success');
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('هذا البريد الإلكتروني مستخدم بالفعل، يمكنك تسجيل الدخول');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('كلمة المرور ضعيفة (يجب أن تكون 6 خانات على الأقل)');
      } else {
        setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال بالحساب');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      showToast('تم تسجيل الدخول بواسطة حساب Google بنجاح ☁️', 'success');
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'فشل تسجيل الدخول باستخدام Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans">
      <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-4 text-right shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900">
              {user ? 'حسابك الشخصي والسحابي' : 'تسجيل الدخول / حفظ البيانات'}
            </h3>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* If user is already logged in */}
        {user ? (
          <div className="space-y-4 py-2">
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-right space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                <CloudCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>حسابك مقترن ومزامن سحابياً!</span>
              </div>
              <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                يتم مزامنة جميع التحضيرات، الدرجات، القياسات، والفصول تلقائياً إلى حسابك الخاص على السحابة.
              </p>
              <div className="pt-2 border-t border-emerald-200/60 text-xs font-extrabold text-slate-700 bg-white/80 p-2.5 rounded-xl flex items-center justify-between">
                <span className="text-slate-900 truncate max-w-[220px]" dir="ltr">
                  {user.email || 'حساب مسجل'}
                </span>
                <span className="text-slate-500 font-bold">البريد المسجل:</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await logoutUser();
                  showToast('تم تسجيل الخروج بنجاح', 'info');
                  onClose();
                }}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login or Register Form */
          <div className="space-y-4">
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              سجّل دخولك بحسابك الخاص لحفظ وتزامن بيانات الطلاب والفصول والتحضير والدرجات بين أجهزتك تلقائياً وبأمان تام.
            </p>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Switch Mode Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                إنشاء حساب جديد
              </button>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>الدخول بواسطة Google</span>
            </button>

            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400">أو بالبريد الإلكتروني</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-slate-600 block mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pr-9 pl-3 py-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-600 block mb-1">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pr-9 pl-3 py-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>جاري المعالجة...</span>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>إنشاء الحساب والتزامن</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
