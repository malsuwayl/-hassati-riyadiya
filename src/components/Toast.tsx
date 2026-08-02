import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-950/90 text-emerald-100 border-emerald-500/30',
    error: 'bg-red-950/90 text-red-100 border-red-500/30',
    warning: 'bg-amber-950/90 text-amber-100 border-amber-500/30',
    info: 'bg-slate-900/90 text-slate-100 border-slate-700/50',
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in fade-in slide-in-from-top duration-200">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${bgStyles[toast.type]}`}
      >
        {icons[toast.type]}
        <span className="text-sm font-semibold text-right leading-snug">{toast.message}</span>
      </div>
    </div>
  );
};
