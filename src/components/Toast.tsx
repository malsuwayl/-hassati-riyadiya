import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-950/95 text-emerald-100 border-emerald-500/40',
    error: 'bg-red-950/95 text-red-100 border-red-500/40',
    warning: 'bg-amber-950/95 text-amber-100 border-amber-500/40',
    info: 'bg-slate-900/95 text-slate-100 border-slate-700/60',
  };

  return (
    <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in fade-in slide-in-from-top-4 duration-200">
      <div
        onClick={dismissToast}
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md cursor-pointer transition-transform active:scale-[0.98] ${bgStyles[toast.type]}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icons[toast.type]}
          <span className="text-xs sm:text-sm font-bold text-right leading-snug">{toast.message}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissToast();
          }}
          className="p-1 rounded-full hover:bg-white/20 text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
          title="إغلاق التنبيه"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
