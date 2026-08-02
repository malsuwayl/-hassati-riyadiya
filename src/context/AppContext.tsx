import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ClassItem,
  Student,
  DailyLogRecord,
  SettingsPointsConfig,
  AttendanceStatus,
  EvaluationType,
  ActiveTab,
} from '../types';
import {
  DEFAULT_POINTS_CONFIG,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_LOGS,
  SAMPLE_DEMO_CLASSES,
  SAMPLE_DEMO_STUDENTS,
  SAMPLE_DEMO_LOGS,
  getTodayDateString,
} from '../data/initialData';
import { loadIDBItem, saveIDBItem, IDB_KEYS } from '../utils/idbStorage';

interface ToastInfo {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  classes: ClassItem[];
  students: Student[];
  dailyLogs: DailyLogRecord[];
  settings: SettingsPointsConfig;
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  toast: ToastInfo | null;
  showToast: (message: string, type?: ToastInfo['type']) => void;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (val: boolean) => void;
  loadDemoData: () => void;
  triggerHaptic: (ms?: number) => void;

  // Class actions
  addClass: (classItem: Omit<ClassItem, 'id'>) => void;
  updateClass: (id: string, classItem: Partial<ClassItem>) => void;
  deleteClass: (id: string) => void;

  // Student actions
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  assignStudentToClass: (studentId: string, classId: string) => void;
  batchAddStudents: (
    newStudents: Omit<Student, 'id'>[],
    newClassesToCreate?: Omit<ClassItem, 'id'>[]
  ) => void;

  // Attendance & Evaluation actions
  setStudentAttendance: (studentId: string, classId: string, date: string, attendance: AttendanceStatus) => void;
  incrementEvaluation: (studentId: string, classId: string, date: string, type: EvaluationType, delta: number) => void;
  addStudentNote: (studentId: string, classId: string, date: string, note: string) => void;
  markAllPresent: (classId: string, date: string) => void;

  // Settings & Backup actions
  updateSettings: (newSettings: Partial<SettingsPointsConfig>) => void;
  resetAllData: () => void;
  importAllData: (data: {
    classes: ClassItem[];
    students: Student[];
    dailyLogs?: DailyLogRecord[];
    settings: SettingsPointsConfig;
  }) => void;

  // Stats calculation
  getStudentRecordForDate: (studentId: string, date: string) => DailyLogRecord | undefined;
  calculateStudentScore: (studentId: string, dateRange?: { start?: string; end?: string }) => number;
  getStudentSummaryStats: (studentId: string) => {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
    totalParticipations: number;
    totalExcellences: number;
    totalViolations: number;
    totalWarnings: number;
    totalScore: number;
  };
  getClassSummaryStats: (classId: string) => {
    studentCount: number;
    todayAttendanceRate: number;
    totalExcellences: number;
    totalViolations: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = IDB_KEYS;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hosati_pe_onboarding_completed') === 'true';
    } catch {
      return false;
    }
  });

  const triggerHaptic = useCallback((ms = 40) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  }, []);

  // Initialize state from LocalStorage or Fallbacks
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return saved ? JSON.parse(saved) : INITIAL_CLASSES;
    } catch {
      return INITIAL_CLASSES;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [dailyLogs, setDailyLogs] = useState<DailyLogRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  const [settings, setSettings] = useState<SettingsPointsConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_POINTS_CONFIG;
    } catch {
      return DEFAULT_POINTS_CONFIG;
    }
  });

  // Save changes to IndexedDB and localStorage
  useEffect(() => {
    saveIDBItem(STORAGE_KEYS.CLASSES, classes);
  }, [classes]);

  useEffect(() => {
    saveIDBItem(STORAGE_KEYS.STUDENTS, students);
  }, [students]);

  useEffect(() => {
    saveIDBItem(STORAGE_KEYS.LOGS, dailyLogs);
  }, [dailyLogs]);

  useEffect(() => {
    saveIDBItem(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Async hydration from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    async function hydrateIDB() {
      const [idbClasses, idbStudents, idbLogs, idbSettings] = await Promise.all([
        loadIDBItem<ClassItem[]>(STORAGE_KEYS.CLASSES, classes),
        loadIDBItem<Student[]>(STORAGE_KEYS.STUDENTS, students),
        loadIDBItem<DailyLogRecord[]>(STORAGE_KEYS.LOGS, dailyLogs),
        loadIDBItem<SettingsPointsConfig>(STORAGE_KEYS.SETTINGS, settings),
      ]);
      if (isMounted) {
        if (idbClasses && idbClasses.length > 0) setClasses(idbClasses);
        if (idbStudents && idbStudents.length > 0) setStudents(idbStudents);
        if (idbLogs && idbLogs.length > 0) setDailyLogs(idbLogs);
        if (idbSettings) setSettings(idbSettings);
      }
    }
    hydrateIDB();
    return () => {
      isMounted = false;
    };
  }, []);

  // Batch Add Students & Classes for Excel / CSV Import
  const batchAddStudents = (
    newStudents: Omit<Student, 'id'>[],
    newClassesToCreate: Omit<ClassItem, 'id'>[] = []
  ) => {
    let currentClasses = [...classes];
    const createdClassMap = new Map<string, string>();

    // 1. Create missing classes
    if (newClassesToCreate.length > 0) {
      const addedClasses: ClassItem[] = newClassesToCreate.map((cls) => {
        const id = `class-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        createdClassMap.set(cls.name, id);
        return { ...cls, id };
      });
      currentClasses = [...currentClasses, ...addedClasses];
      setClasses(currentClasses);
    }

    // 2. Add students with resolved class IDs
    const addedStudents: Student[] = newStudents.map((st, idx) => {
      let finalClassId = st.classId;
      if (finalClassId.startsWith('NEW:')) {
        const rawName = finalClassId.replace('NEW:', '');
        finalClassId = createdClassMap.get(rawName) || currentClasses[0]?.id || 'class-1';
      }
      return {
        ...st,
        id: `st-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        classId: finalClassId,
      };
    });

    setStudents((prev) => [...prev, ...addedStudents]);
    showToast(`تم استيراد (${addedStudents.length}) طالب بنجاح ⚽`, 'success');
  };

  // Backup Import Action
  const importAllData = (data: {
    classes: ClassItem[];
    students: Student[];
    dailyLogs?: DailyLogRecord[];
    settings: SettingsPointsConfig;
  }) => {
    if (data.classes) setClasses(data.classes);
    if (data.students) setStudents(data.students);
    if (data.dailyLogs) setDailyLogs(data.dailyLogs);
    if (data.settings) setSettings(data.settings);
    showToast('تمت استعادة جميع البيانات من النسخة الاحتياطية بنجاح 📁', 'success');
  };

  // Toast Helper
  const showToast = useCallback((message: string, type: ToastInfo['type'] = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3000);
  }, []);

  // Class Management
  const addClass = (newClass: Omit<ClassItem, 'id'>) => {
    const id = `class-${Date.now()}`;
    const item: ClassItem = { ...newClass, id };
    setClasses((prev) => [...prev, item]);
    showToast(`تمت إضافة الفصل "${item.name}" بنجاح`, 'success');
  };

  const updateClass = (id: string, updated: Partial<ClassItem>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    showToast('تم تعديل بيانات الفصل بنجاح', 'info');
  };

  const deleteClass = (id: string) => {
    const target = classes.find((c) => c.id === id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
    // Unassign or keep students
    showToast(`تم حذف الفصل ${target?.name || ''}`, 'warning');
    if (selectedClassId === id && classes.length > 1) {
      const remaining = classes.filter((c) => c.id !== id);
      setSelectedClassId(remaining[0].id);
    }
  };

  // Student Management
  const addStudent = (newStudent: Omit<Student, 'id'>) => {
    const id = `st-${Date.now()}`;
    const item: Student = { ...newStudent, id };
    setStudents((prev) => [...prev, item]);
    showToast(`تمت إضافة الطالب "${item.name}"`, 'success');
  };

  const updateStudent = (id: string, updated: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    showToast('تم تحديث بيانات الطالب', 'info');
  };

  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setDailyLogs((prev) => prev.filter((l) => l.studentId !== id));
    showToast(`تم حذف الطالب ${target?.name || ''}`, 'warning');
  };

  const assignStudentToClass = (studentId: string, classId: string) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, classId } : s)));
    showToast('تم نقل الطالب إلى الفصل المحدد', 'info');
  };

  // Log Finder / Creator Helper
  const getOrCreateLog = (
    logsList: DailyLogRecord[],
    studentId: string,
    classId: string,
    date: string
  ): DailyLogRecord => {
    const existing = logsList.find((l) => l.studentId === studentId && l.date === date);
    if (existing) return existing;
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      studentId,
      classId,
      date,
      attendance: null,
      participations: 0,
      excellences: 0,
      violations: 0,
      warnings: 0,
      notes: '',
      updatedAt: new Date().toISOString(),
    };
  };

  // Attendance Logic
  const setStudentAttendance = (
    studentId: string,
    classId: string,
    date: string,
    attendance: AttendanceStatus
  ) => {
    setDailyLogs((prev) => {
      const existing = prev.find((l) => l.studentId === studentId && l.date === date);
      if (existing) {
        return prev.map((l) =>
          l.studentId === studentId && l.date === date
            ? { ...l, attendance, updatedAt: new Date().toISOString() }
            : l
        );
      }
      const newRecord: DailyLogRecord = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        studentId,
        classId,
        date,
        attendance,
        participations: 0,
        excellences: 0,
        violations: 0,
        warnings: 0,
        updatedAt: new Date().toISOString(),
      };
      return [...prev, newRecord];
    });
  };

  // Evaluation Increment (Participation, Excellence, Violation, Warning)
  const incrementEvaluation = (
    studentId: string,
    classId: string,
    date: string,
    type: EvaluationType,
    delta: number
  ) => {
    setDailyLogs((prev) => {
      const existingIndex = prev.findIndex((l) => l.studentId === studentId && l.date === date);
      if (existingIndex >= 0) {
        const current = prev[existingIndex];
        const keyMap = {
          participation: 'participations',
          excellence: 'excellences',
          violation: 'violations',
          warning: 'warnings',
        } as const;
        const key = keyMap[type];
        const newVal = Math.max(0, current[key] + delta);

        const updated = {
          ...current,
          [key]: newVal,
          updatedAt: new Date().toISOString(),
        };
        const copy = [...prev];
        copy[existingIndex] = updated;
        return copy;
      } else {
        const record = getOrCreateLog(prev, studentId, classId, date);
        const keyMap = {
          participation: 'participations',
          excellence: 'excellences',
          violation: 'violations',
          warning: 'warnings',
        } as const;
        record[keyMap[type]] = Math.max(0, delta);
        return [...prev, record];
      }
    });
  };

  const addStudentNote = (studentId: string, classId: string, date: string, note: string) => {
    setDailyLogs((prev) => {
      const existingIndex = prev.findIndex((l) => l.studentId === studentId && l.date === date);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], notes: note, updatedAt: new Date().toISOString() };
        return copy;
      } else {
        const record = getOrCreateLog(prev, studentId, classId, date);
        record.notes = note;
        return [...prev, record];
      }
    });
    showToast('تم حفظ الملاحظة بنجاح', 'success');
  };

  // Mark All Present (تحضير الجميع)
  const markAllPresent = (classId: string, date: string) => {
    const classStudents = students.filter((s) => s.classId === classId);
    if (classStudents.length === 0) {
      showToast('لا يوجد طلاب في هذا الفصل', 'warning');
      return;
    }

    setDailyLogs((prev) => {
      const updatedLogs = [...prev];
      classStudents.forEach((student) => {
        const idx = updatedLogs.findIndex((l) => l.studentId === student.id && l.date === date);
        if (idx >= 0) {
          updatedLogs[idx] = {
            ...updatedLogs[idx],
            attendance: 'present',
            updatedAt: new Date().toISOString(),
          };
        } else {
          updatedLogs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            studentId: student.id,
            classId: student.classId,
            date,
            attendance: 'present',
            participations: 0,
            excellences: 0,
            violations: 0,
            warnings: 0,
            updatedAt: new Date().toISOString(),
          });
        }
      });
      return updatedLogs;
    });

    showToast(`تم تحضير جميع طلاب الفصل (${classStudents.length} طالب) 🟢`, 'success');
  };

  // Settings
  const updateSettings = (newSettings: Partial<SettingsPointsConfig>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('تمت تحديث إعدادات الدرجات والمدرسة', 'success');
  };

  const resetAllData = () => {
    setClasses([]);
    setStudents([]);
    setDailyLogs([]);
    setSettings(DEFAULT_POINTS_CONFIG);
    setSelectedClassId('');
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem('hosati_pe_onboarding_completed');
    setOnboardingCompleted(false);
    showToast('تمت استعادة التهيئة الأولية وإعادة الضبط بنجاح', 'info');
  };

  const loadDemoData = () => {
    setClasses(SAMPLE_DEMO_CLASSES);
    setStudents(SAMPLE_DEMO_STUDENTS);
    setDailyLogs(SAMPLE_DEMO_LOGS);
    setSettings((prev) => ({
      ...prev,
      schoolName: 'مدرسة النموذجية الثانوية - الرياض',
      teacherName: 'أ. عبد الرحمن الشهري',
    }));
    setSelectedClassId(SAMPLE_DEMO_CLASSES[0].id);
    showToast('تم تحميل البيانات التجريبية بنجاح ⚽', 'success');
  };

  // Sync theme class to html element
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Keep selectedClassId valid
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Helper getters
  const getStudentRecordForDate = (studentId: string, date: string) => {
    return dailyLogs.find((l) => l.studentId === studentId && l.date === date);
  };

  const calculateStudentScore = (studentId: string): number => {
    const studentLogs = dailyLogs.filter((l) => l.studentId === studentId);
    let totalScore = 100; // Base grade 100%

    studentLogs.forEach((log) => {
      if (log.attendance === 'present') totalScore += settings.attendance;
      if (log.attendance === 'late') totalScore += settings.late;
      if (log.attendance === 'absent') totalScore += settings.absent;

      totalScore += log.participations * settings.participation;
      totalScore += log.excellences * settings.excellence;
      totalScore += log.violations * settings.violation;
      totalScore += log.warnings * settings.warning;
    });

    return Math.max(0, totalScore);
  };

  const getStudentSummaryStats = (studentId: string) => {
    const logs = dailyLogs.filter((l) => l.studentId === studentId);
    const totalDays = logs.length;
    const presentDays = logs.filter((l) => l.attendance === 'present').length;
    const absentDays = logs.filter((l) => l.attendance === 'absent').length;
    const lateDays = logs.filter((l) => l.attendance === 'late').length;

    const totalParticipations = logs.reduce((acc, l) => acc + (l.participations || 0), 0);
    const totalExcellences = logs.reduce((acc, l) => acc + (l.excellences || 0), 0);
    const totalViolations = logs.reduce((acc, l) => acc + (l.violations || 0), 0);
    const totalWarnings = logs.reduce((acc, l) => acc + (l.warnings || 0), 0);

    const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays * 0.5) / totalDays) * 100) : 100;
    const totalScore = calculateStudentScore(studentId);

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendanceRate,
      totalParticipations,
      totalExcellences,
      totalViolations,
      totalWarnings,
      totalScore,
    };
  };

  const getClassSummaryStats = (classId: string) => {
    const classStudents = students.filter((s) => s.classId === classId);
    const today = getTodayDateString();
    const todayLogs = dailyLogs.filter((l) => l.classId === classId && l.date === today);

    const presentCount = todayLogs.filter((l) => l.attendance === 'present').length;
    const totalRecorded = todayLogs.length;

    const todayAttendanceRate =
      classStudents.length > 0 ? Math.round((presentCount / classStudents.length) * 100) : 0;

    const totalExcellences = dailyLogs
      .filter((l) => l.classId === classId)
      .reduce((acc, l) => acc + (l.excellences || 0), 0);

    const totalViolations = dailyLogs
      .filter((l) => l.classId === classId)
      .reduce((acc, l) => acc + (l.violations || 0), 0);

    return {
      studentCount: classStudents.length,
      todayAttendanceRate,
      totalExcellences,
      totalViolations,
    };
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        classes,
        students,
        dailyLogs,
        settings,
        selectedClassId,
        setSelectedClassId,
        selectedDate,
        setSelectedDate,
        toast,
        showToast,
        onboardingCompleted,
        setOnboardingCompleted,
        loadDemoData,
        triggerHaptic,
        addClass,
        updateClass,
        deleteClass,
        addStudent,
        updateStudent,
        deleteStudent,
        assignStudentToClass,
        batchAddStudents,
        setStudentAttendance,
        incrementEvaluation,
        addStudentNote,
        markAllPresent,
        updateSettings,
        resetAllData,
        importAllData,
        getStudentRecordForDate,
        calculateStudentScore,
        getStudentSummaryStats,
        getClassSummaryStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
