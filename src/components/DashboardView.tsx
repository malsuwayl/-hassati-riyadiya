import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  GraduationCap,
  UserCheck,
  Award,
  AlertTriangle,
  ArrowLeft,
  PlusCircle,
  CalendarCheck,
  Zap,
  CheckCircle2,
  ChevronLeft,
  Activity,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    classes,
    students,
    dailyLogs,
    selectedDate,
    setSelectedDate,
    setActiveTab,
    setSelectedClassId,
    getClassSummaryStats,
    settings,
  } = useApp();

  const totalStudents = students.length;
  const totalClasses = classes.length;

  // Today stats
  const todayLogs = dailyLogs.filter((l) => l.date === selectedDate);
  const presentToday = todayLogs.filter((l) => l.attendance === 'present').length;
  const absentToday = todayLogs.filter((l) => l.attendance === 'absent').length;
  const lateToday = todayLogs.filter((l) => l.attendance === 'late').length;

  const totalExcellenceToday = todayLogs.reduce((acc, l) => acc + (l.excellences || 0), 0);
  const totalParticipationsToday = todayLogs.reduce((acc, l) => acc + (l.participations || 0), 0);
  const totalViolationsToday = todayLogs.reduce((acc, l) => acc + (l.violations || 0), 0);

  const attendanceRate =
    totalStudents > 0 ? Math.round(((presentToday + lateToday * 0.5) / totalStudents) * 100) : 0;

  const handleQuickAttendance = (classId: string) => {
    setSelectedClassId(classId);
    setActiveTab('attendance');
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Date Switcher & Greeting Banner */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-emerald-200 text-xs font-semibold bg-emerald-900/40 px-2.5 py-1 rounded-full border border-emerald-400/20">
              أهلاً بك أستاذ التربية البدنية 🏃‍♂️
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1">لوحة المتابعة اليومية</h2>
          </div>
          <div className="bg-white/15 backdrop-blur-md p-2 rounded-2xl border border-white/20">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer text-center"
            />
          </div>
        </div>

        <p className="text-emerald-100 text-xs leading-relaxed max-w-xs">
          مرحباً بك في مدرسة {settings.schoolName || 'التربية البدنية'}. متابعة حضور الطلاب وتقييم
          السلوك والتميز الرياضي لليوم.
        </p>

        {/* Attendance Ring / Percentage Bar */}
        <div className="mt-4 pt-3 border-t border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/30 flex items-center justify-center font-black text-amber-300">
              %{attendanceRate}
            </div>
            <div>
              <span className="text-[11px] text-emerald-200 block font-medium">نسبة حضور اليوم</span>
              <span className="text-xs font-bold text-white">
                {presentToday} حاضر من إجمالي {totalStudents} طالب
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('attendance')}
            className="bg-white text-emerald-800 font-bold text-xs px-3.5 py-2 rounded-xl shadow-md hover:bg-emerald-50 transition-transform active:scale-95 flex items-center gap-1"
          >
            <span>ابدأ التحضير</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main KPI Grid Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Today Classes */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 emerald-card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">الحصص اليومية</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-zinc-900">{totalClasses}</span>
            <span className="text-xs font-semibold text-emerald-700 mr-1">حصة / فصل</span>
          </div>
          <button
            onClick={() => setActiveTab('classes')}
            className="mt-3 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>إدارة الحصص</span>
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        {/* Card 2: Total Students */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 emerald-card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">إجمالي الطلاب</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-zinc-900">{totalStudents}</span>
            <span className="text-xs font-semibold text-blue-700 mr-1">طالب مسجل</span>
          </div>
          <button
            onClick={() => setActiveTab('students')}
            className="mt-3 text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>دليل الطلاب</span>
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Attendance Summary */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 emerald-card-shadow col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-zinc-800">حالة الحضور والغياب اليوم</h3>
            </div>
            <span className="text-[11px] font-medium text-zinc-400">{selectedDate}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-50/80 border border-emerald-200/60 p-2.5 rounded-xl">
              <span className="text-xs font-bold text-emerald-700 block">🟢 حاضر</span>
              <span className="text-lg font-black text-emerald-900 mt-0.5 block">{presentToday}</span>
            </div>
            <div className="bg-amber-50/80 border border-amber-200/60 p-2.5 rounded-xl">
              <span className="text-xs font-bold text-amber-700 block">🟡 متأخر</span>
              <span className="text-lg font-black text-amber-900 mt-0.5 block">{lateToday}</span>
            </div>
            <div className="bg-red-50/80 border border-red-200/60 p-2.5 rounded-xl">
              <span className="text-xs font-bold text-red-700 block">🔴 غائب</span>
              <span className="text-lg font-black text-red-900 mt-0.5 block">{absentToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>الإجراءات السريعة</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className="flex flex-col items-center text-center bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-2xl shadow-sm transition-all active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-1">
              <CalendarCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold block leading-tight">التحضير اليومي</span>
            <span className="text-[9px] text-emerald-100 font-medium">تسجيل الحضور</span>
          </button>

          <button
            onClick={() => setActiveTab('measurements')}
            className="flex flex-col items-center text-center bg-teal-600 hover:bg-teal-700 text-white p-2.5 rounded-2xl shadow-sm transition-all active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-1">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold block leading-tight">القياسات البدنية</span>
            <span className="text-[9px] text-teal-100 font-medium">BMI واللياقة</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className="flex flex-col items-center text-center bg-white border border-emerald-200 hover:bg-emerald-50 text-zinc-800 p-2.5 rounded-2xl shadow-sm transition-all active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
              <PlusCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold block leading-tight">إضافة طالب</span>
            <span className="text-[9px] text-zinc-500 font-medium font-medium">تسجيل طالب</span>
          </button>
        </div>
      </div>

      {/* Today's Classes List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>قائمة الحصص والفصول اليوم</span>
          </h3>
          <button
            onClick={() => setActiveTab('classes')}
            className="text-xs font-bold text-emerald-600 hover:underline"
          >
            عرض الكل
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-zinc-300">
            <p className="text-xs text-zinc-500">لا توجد حصص مضافة حتى الآن.</p>
            <button
              onClick={() => setActiveTab('classes')}
              className="mt-2 text-xs font-bold text-emerald-600 underline"
            >
              + إضافة أول حصة
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {classes.map((cls) => {
              const stats = getClassSummaryStats(cls.id);
              return (
                <div
                  key={cls.id}
                  className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-sm hover:border-emerald-300 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                      {cls.section || '1'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{cls.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold">
                          {cls.period}
                        </span>
                        <span>• {stats.studentCount} طالب</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickAttendance(cls.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-transform active:scale-95 flex items-center gap-1 shrink-0"
                  >
                    <span>تحضير</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Highlights: Excellence vs Violations */}
      <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg font-bold">
            🏆
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-300">حصيلة التميّز والانضباط</h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              تميز اليوم: <span className="text-amber-400 font-bold">{totalExcellenceToday}</span> |{' '}
              مخالفات اليوم: <span className="text-red-400 font-bold">{totalViolationsToday}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('reports')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700"
        >
          التقرير
        </button>
      </div>
    </div>
  );
};
