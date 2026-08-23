import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LogIn,
  LogOut,
  UserCheck,
  Mail,
  Lock,
  X,
  ShieldCheck,
  CloudCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  User as UserIcon,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    logoutUser,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const formatFirebaseError = (err: any) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      case 'auth/email-already-in-use':
        return 'هذا البريد الإلكتروني مسجل بالفعل';
      case 'auth/weak-password':
        return 'كلمة المرور يجب ألا تقل عن 6 خانات';
      case 'auth/invalid-email':
        return 'صيغة البريد الإلكتروني غير صالحة';
      case 'auth/network-request-failed':
        return 'تعذر الاتصال بـ Firebase، تحقق من اتصال الإنترنت';
      case 'auth/popup-closed-by-user':
        return 'تم إغلاق نافذة تسجيل الدخول';
      default:
        return err?.message || 'حدث خطأ أثناء المصادقة';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('يرجى كتابة البريد الإلكتروني');
      return;
    }

    if (mode === 'forgot') {
      setIsSubmitting(true);
      try {
        await resetPassword(email.trim());
        setSuccessMsg('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح!');
        showToast('تم إرسال رابط الاستعادة إلى بريدك 📧', 'success');
      } catch (err: any) {
        setErrorMsg(formatFirebaseError(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password.trim()) {
      setErrorMsg('يرجى كتابة كلمة المرور');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
        showToast('تم تسجيل الدخول بنجاح! ☁️', 'success');
      } else {
        await registerWithEmail(email.trim(), password, teacherName.trim());
        showToast('تم إنشاء الحساب وتفعيل المزامنة السحابية! 🎉', 'success');
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(formatFirebaseError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      showToast('تم تسجيل الدخول بواسطة Google بنجاح ☁️', 'success');
      onClose();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(formatFirebaseError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetForLoggedInUser = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      showToast('تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني 📧', 'success');
    } catch (err: any) {
      showToast(formatFirebaseError(err), 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans" dir="rtl">
      <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-4 text-right shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              {user ? 'حساب المعلم السحابي (Firebase)' : 'تسجيل الدخول والمزامنة'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If user is logged in */}
        {user ? (
          <div className="space-y-4 py-1">
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-right space-y-3">
              <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                <CloudCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>حسابك متصل ومزامن حياً مع Firebase Firestore!</span>
              </div>
              <p className="text-xs font-bold text-emerald-900 leading-relaxed">
                جميع بيانات الحضور والغياب، الدرجات، القياسات البدنية، والفصول مخزنة سحابياً ومحمية بشكل كامل.
              </p>

              <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 space-y-1.5 text-xs font-bold">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">البريد الإلكتروني:</span>
                  <span className="text-slate-900 font-extrabold" dir="ltr">
                    {user.email || 'غير متوفر'}
                  </span>
                </div>
                {user.displayName && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <span className="text-slate-500">اسم المعلم:</span>
                    <span className="text-slate-900">{user.displayName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                  <span className="text-slate-500">معرف الحساب (UID):</span>
                  <span className="text-slate-600 font-mono text-[10px]" dir="ltr">
                    {user.uid.slice(0, 14)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {user.email && (
                <button
                  type="button"
                  onClick={handleSendResetForLoggedInUser}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>إرسال رابط إعادة تعيين كلمة المرور</span>
                </button>
              )}

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
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login/Register Form */
          <div className="space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Switch Mode Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
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
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                حساب جديد
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="text-[11px] font-black text-slate-600 block mb-1">
                    اسم المعلم / المعلمة
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="أ. محمد القحطاني"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pr-9 pl-3 py-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

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

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black text-slate-600 block">
                      كلمة المرور
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    )}
                  </div>
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
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>جاري المعالجة عبر Firebase...</span>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول بالبريد الإلكتروني</span>
                  </>
                ) : mode === 'register' ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>إنشاء الحساب والمزامنة السحابية</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>إرسال رابط استعادة كلمة المرور</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400">أو</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

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
              <span>المتابعة عبر Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
