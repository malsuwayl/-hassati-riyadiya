import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mail,
  Lock,
  User as UserIcon,
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  School,
  Cloud,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    loginWithGoogle,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const formatFirebaseError = (err: any) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة، يرجى التأكد من البيانات المدخلة.';
      case 'auth/email-already-in-use':
        return 'هذا البريد الإلكتروني مسجل بالفعل مسبقاً، يمكنك الانتقال لتسجيل الدخول.';
      case 'auth/weak-password':
        return 'كلمة المرور ضعيفة جداً، يرجى إدخال 6 خانات أو أحرف على الأقل.';
      case 'auth/invalid-email':
        return 'صيغة البريد الإلكتروني غير صالحة، يرجى كتابة بريد إلكتروني صحيح.';
      case 'auth/network-request-failed':
        return 'تعذر الاتصال بخوادم Firebase، يرجى التحقق من اتصال الإنترنت لديك.';
      case 'auth/too-many-requests':
        return 'تم تعليق المحاولات مؤقتاً لكثرة المحاولات الخاطئة، يرجى الانتظار قليلاً والمحاولة مجدداً.';
      case 'auth/popup-closed-by-user':
        return 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.';
      default:
        return err?.message || 'حدث خطأ أثناء المصادقة عبر Firebase، يرجى إعادة المحاولة.';
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setSuccessMsg(`تم إرسال رابط استعادة كلمة المرور إلى (${email.trim()}) بنجاح! 
يرجى التحقق من صندوق الوارد ومجلد الرسائل غير المرغوب فيها (Spam / Junk) والترويجات (Promotions).`);
        showToast('تم إرسال رابط الاستعادة إلى بريدك 📧', 'success');
      } catch (err: any) {
        setErrorMsg(formatFirebaseError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password.trim()) {
      setErrorMsg('يرجى إدخال كلمة المرور');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMsg('يجب أن تتكون كلمة المرور من 6 خانات على الأقل');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('كلمتا المرور غير متطابقتين');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
        showToast('مرحباً بك! تم تسجيل الدخول بنجاح ☁️', 'success');
      } else {
        await registerWithEmail(email.trim(), password, teacherName.trim());
        showToast('أهلاً بك! تم إنشاء حسابك السحابي بنجاح 🎉', 'success');
      }
    } catch (err: any) {
      setErrorMsg(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await loginWithGoogle();
      showToast('تم تسجيل الدخول بواسطة Google بنجاح ☁️', 'success');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(formatFirebaseError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white font-sans" dir="rtl">
      {/* Background glowing ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-600/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white/95 text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        {/* App Logo & Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-lg shadow-indigo-600/30 mb-2 border border-indigo-400/20">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            منظومة التربية البدنية الذكية
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-500 flex items-center justify-center gap-1.5">
            <Cloud className="w-4 h-4 text-indigo-600" />
            <span>ربط ومزامنة سحابية حقيقية عبر Firebase ☁️</span>
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl gap-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            حساب جديد
          </button>
        </div>

        {/* Security & Cloud Privacy Notice */}
        <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-[11px] font-bold text-indigo-950 leading-relaxed">
            بيانات طلابك ودرجاتك وتحضيرك اليومي مشفرة ومعزولة سحابياً وخاصة بك وحدك عبر Firebase.
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2 mb-4 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2 mb-4 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Main Email / Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1">
                اسم المعلم / المعلمة
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="أ. محمد القحطاني"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pr-10 pl-3.5 py-3 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1">
              البريد الإلكتروني (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@example.com"
                dir="ltr"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pr-10 pl-3.5 py-3 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-slate-700 block">
                  كلمة المرور (Password)
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pr-10 pl-3.5 py-3 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pr-10 pl-3.5 py-3 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="text-left">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
              >
                العودة إلى تسجيل الدخول
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-98 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري المعالجة عبر Firebase...</span>
              </span>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول بالبريد الإلكتروني</span>
              </>
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>إنشاء الحساب وبدء المزامنة السحابية</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>إرسال رابط إعادة تعيين كلمة المرور</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-bold text-slate-400">أو يمكنك الدخول عبر</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300/80 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-2xs active:scale-98 cursor-pointer disabled:opacity-50"
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
          <span>المتابعة عبر حساب Google</span>
        </button>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold">
            مشروع التربية البدنية © {new Date().getFullYear()} • مدعوم بقاعدة بيانات Firebase Firestore
          </p>
        </div>
      </div>
    </div>
  );
};
