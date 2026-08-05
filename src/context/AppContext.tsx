import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ClassItem,
  Student,
  DailyLogRecord,
  AttendanceStatus,
  AttendanceCheckItem,
  IncentiveRecord,
  ActiveTab,
  AssessmentItem,
  MeasurementItem,
  TimetableEntry,
  TeacherSettings,
} from '../types';

export const DEFAULT_ATTENDANCE_CHECK_ITEMS: AttendanceCheckItem[] = [
  { id: 'uniform', name: 'الزي الرياضي' },
];
import {
  SAMPLE_DEMO_CLASSES,
  SAMPLE_DEMO_STUDENTS,
  DEFAULT_ASSESSMENTS,
  DEFAULT_MEASUREMENT_ITEMS,
  DEFAULT_TIMETABLE,
  DEFAULT_TEACHER_SETTINGS,
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
  timetable: TimetableEntry[];
  settings: TeacherSettings;

  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;

  toast: ToastInfo | null;
  showToast: (message: string, type?: ToastInfo['type']) => void;
  dismissToast: () => void;
  triggerHaptic: (ms?: number) => void;

  // Class actions
  addClass: (name: string) => void;
  updateClass: (id: string, name: string) => void;
  deleteClass: (id: string) => void;

  // Student actions
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  batchAddStudents: (
    newStudents: Omit<Student, 'id'>[],
    newClassesToCreate?: Omit<ClassItem, 'id'>[]
  ) => void;
  importStudentsBatch: (rowsToImport: Array<{
    studentNumber: string;
    name: string;
    className: string;
    height?: number | string;
    weight?: number | string;
    medicalNotes?: string;
  }>) => void;

  // Attendance actions
  attendanceCheckItems: AttendanceCheckItem[];
  addAttendanceCheckItem: (name: string) => void;
  deleteAttendanceCheckItem: (id: string) => void;
  toggleStudentCheckItem: (studentId: string, classId: string, date: string, itemId: string) => void;
  setStudentAttendance: (
    studentId: string,
    classId: string,
    date: string,
    attendance: AttendanceStatus,
    uniform?: boolean
  ) => void;
  toggleStudentUniform: (studentId: string, classId: string, date: string) => void;
  markAllPresent: (classId: string, date: string) => void;
  clearAttendance: (classId: string, date: string) => void;
  getStudentRecordForDate: (studentId: string, date: string) => DailyLogRecord | undefined;

  // Grades actions
  assessments: AssessmentItem[];
  grades: Record<string, Record<string, number>>; // studentId -> assessmentId -> score
  addAssessmentItem: (name: string, maxScore: number, weight?: number) => void;
  updateAssessmentItem: (id: string, name: string, maxScore: number, weight?: number) => void;
  deleteAssessmentItem: (id: string) => void;
  setStudentGradeScore: (studentId: string, assessmentId: string, score: number | undefined) => void;

  // Measurements actions
  measurementItems: MeasurementItem[];
  measurementValues: Record<string, Record<string, string | number>>; // studentId -> itemId -> val
  addMeasurementItem: (item: Omit<MeasurementItem, 'id'>) => void;
  updateMeasurementItem: (id: string, item: Partial<MeasurementItem>) => void;
  deleteMeasurementItem: (id: string) => void;
  setStudentMeasurementValue: (
    studentId: string,
    itemId: string,
    val: string | number | undefined
  ) => void;

  // Incentive & Violations actions
  incentiveRecords: IncentiveRecord[];
  addIncentiveRecord: (record: Omit<IncentiveRecord, 'id' | 'createdAt'>) => void;
  deleteIncentiveRecord: (id: string) => void;
  getStudentIncentiveSummary: (studentId: string) => {
    totalPoints: number;
    positiveCount: number;
    negativeCount: number;
    records: IncentiveRecord[];
  };

  // Timetable actions
  updateTimetableEntry: (dayOfWeek: number, periodNumber: number, classId: string) => void;

  // Settings actions
  updateSettings: (newSettings: Partial<TeacherSettings>) => void;
  restoreData: (data: {
    classes?: ClassItem[];
    students?: Student[];
    dailyLogs?: DailyLogRecord[];
    assessments?: AssessmentItem[];
    grades?: Record<string, Record<string, number>>;
    measurementItems?: MeasurementItem[];
    measurementValues?: Record<string, Record<string, string | number>>;
    timetable?: TimetableEntry[];
    settings?: TeacherSettings;
  }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastInfo | null>(null);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLogRecord[]>([]);
  const [attendanceCheckItems, setAttendanceCheckItems] = useState<AttendanceCheckItem[]>(DEFAULT_ATTENDANCE_CHECK_ITEMS);
  const [timetable, setTimetable] = useState<TimetableEntry[]>(DEFAULT_TIMETABLE);
  const [settings, setSettings] = useState<TeacherSettings>(DEFAULT_TEACHER_SETTINGS);

  // Grades
  const [assessments, setAssessments] = useState<AssessmentItem[]>(DEFAULT_ASSESSMENTS);
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({});

  // Measurements
  const [measurementItems, setMeasurementItems] = useState<MeasurementItem[]>(DEFAULT_MEASUREMENT_ITEMS);
  const [measurementValues, setMeasurementValues] = useState<Record<string, Record<string, string | number>>>({});

  // Incentives & Violations
  const [incentiveRecords, setIncentiveRecords] = useState<IncentiveRecord[]>([]);

  const showToast = useCallback((message: string, type: ToastInfo['type'] = 'info') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Auto hide toast after 3.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const triggerHaptic = useCallback((ms = 30) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  }, []);

  // Load Initial Data from IndexedDB
  useEffect(() => {
    const loadAll = async () => {
      try {
        const savedClasses = await loadIDBItem<ClassItem[]>(IDB_KEYS.CLASSES, SAMPLE_DEMO_CLASSES);
        const savedStudents = await loadIDBItem<Student[]>(IDB_KEYS.STUDENTS, SAMPLE_DEMO_STUDENTS);
        const savedLogs = await loadIDBItem<DailyLogRecord[]>(IDB_KEYS.LOGS, []);
        const savedAssessments = await loadIDBItem<AssessmentItem[]>('hosati_assessments', DEFAULT_ASSESSMENTS);
        const savedAttItems = await loadIDBItem<AttendanceCheckItem[]>('hosati_att_items', DEFAULT_ATTENDANCE_CHECK_ITEMS);
        const savedGrades = await loadIDBItem<Record<string, Record<string, number>>>('hosati_grades', {});
        const savedMeasItems = await loadIDBItem<MeasurementItem[]>('hosati_meas_items', DEFAULT_MEASUREMENT_ITEMS);
        const savedMeasVals = await loadIDBItem<Record<string, Record<string, string | number>>>('hosati_meas_vals', {});
        const savedIncentives = await loadIDBItem<IncentiveRecord[]>('hosati_incentives', []);
        const savedTimetable = await loadIDBItem<TimetableEntry[]>('hosati_timetable', DEFAULT_TIMETABLE);
        const savedSettings = await loadIDBItem<TeacherSettings>('hosati_settings', DEFAULT_TEACHER_SETTINGS);

        const activeClasses = savedClasses && savedClasses.length > 0 ? savedClasses : SAMPLE_DEMO_CLASSES;
        const activeStudents = savedStudents && savedStudents.length > 0 ? savedStudents : SAMPLE_DEMO_STUDENTS;

        setClasses(activeClasses);
        setStudents(activeStudents);
        setDailyLogs(savedLogs || []);
        setAttendanceCheckItems(savedAttItems && savedAttItems.length > 0 ? savedAttItems : DEFAULT_ATTENDANCE_CHECK_ITEMS);
        setAssessments(savedAssessments && savedAssessments.length > 0 ? savedAssessments : DEFAULT_ASSESSMENTS);
        setGrades(savedGrades || {});
        setMeasurementItems(savedMeasItems && savedMeasItems.length > 0 ? savedMeasItems : DEFAULT_MEASUREMENT_ITEMS);
        setMeasurementValues(savedMeasVals || {});
        setIncentiveRecords(savedIncentives || []);
        setTimetable(savedTimetable && savedTimetable.length > 0 ? savedTimetable : DEFAULT_TIMETABLE);
        setSettings(savedSettings || DEFAULT_TEACHER_SETTINGS);

        if (activeClasses.length > 0) {
          setSelectedClassId(activeClasses[0].id);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setClasses(SAMPLE_DEMO_CLASSES);
        setStudents(SAMPLE_DEMO_STUDENTS);
        setSelectedClassId(SAMPLE_DEMO_CLASSES[0].id);
      }
    };
    loadAll();
  }, []);

  // Sync state changes to IDB automatically (No save button required)
  useEffect(() => {
    if (classes.length > 0) saveIDBItem(IDB_KEYS.CLASSES, classes);
  }, [classes]);

  useEffect(() => {
    if (students.length > 0) saveIDBItem(IDB_KEYS.STUDENTS, students);
  }, [students]);

  useEffect(() => {
    saveIDBItem(IDB_KEYS.LOGS, dailyLogs);
  }, [dailyLogs]);

  useEffect(() => {
    saveIDBItem('hosati_att_items', attendanceCheckItems);
  }, [attendanceCheckItems]);

  useEffect(() => {
    saveIDBItem('hosati_assessments', assessments);
  }, [assessments]);

  useEffect(() => {
    saveIDBItem('hosati_grades', grades);
  }, [grades]);

  useEffect(() => {
    saveIDBItem('hosati_meas_items', measurementItems);
  }, [measurementItems]);

  useEffect(() => {
    saveIDBItem('hosati_meas_vals', measurementValues);
  }, [measurementValues]);

  useEffect(() => {
    saveIDBItem('hosati_incentives', incentiveRecords);
  }, [incentiveRecords]);

  useEffect(() => {
    saveIDBItem('hosati_timetable', timetable);
  }, [timetable]);

  useEffect(() => {
    saveIDBItem('hosati_settings', settings);
  }, [settings]);

  // Class actions
  const addClass = (name: string) => {
    const newCls: ClassItem = { id: `cls-${Date.now()}`, name: name.trim() };
    const updated = [...classes, newCls];
    setClasses(updated);
    setSelectedClassId(newCls.id);
    showToast(`تم إضافة الفصل "${name}"`, 'success');
  };

  const updateClass = (id: string, name: string) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    showToast('تم تعديل اسم الفصل', 'success');
  };

  const deleteClass = (id: string) => {
    const cls = classes.find((c) => c.id === id);
    if (!cls) return;
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setStudents((prev) => prev.filter((s) => s.classId !== id));
    if (selectedClassId === id) {
      const remaining = classes.filter((c) => c.id !== id);
      if (remaining.length > 0) setSelectedClassId(remaining[0].id);
    }
    showToast(`تم حذف الفصل "${cls.name}"`, 'info');
  };

  // Student actions
  const addStudent = (stData: Omit<Student, 'id'>) => {
    const newSt: Student = { ...stData, id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` };
    setStudents((prev) => [...prev, newSt]);
    showToast(`تمت إضافة الطالب ${stData.name}`, 'success');
  };

  const updateStudent = (id: string, updatedData: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s)));
    showToast('تم تحديث بيانات الطالب', 'success');
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    showToast('تم حذف الطالب', 'info');
  };

  const batchAddStudents = (
    newStudents: Omit<Student, 'id'>[],
    newClassesToCreate?: Omit<ClassItem, 'id'>[]
  ) => {
    let currentClasses = [...classes];
    if (newClassesToCreate && newClassesToCreate.length > 0) {
      const createdClasses: ClassItem[] = newClassesToCreate.map((c, i) => ({
        id: `class-imported-${Date.now()}-${i}`,
        name: c.name,
      }));
      currentClasses = [...currentClasses, ...createdClasses];
      setClasses(currentClasses);
    }

    const createdStudents: Student[] = newStudents.map((st, i) => ({
      ...st,
      id: `st-imp-${Date.now()}-${i}`,
    }));

    setStudents((prev) => [...prev, ...createdStudents]);
  };

  const importStudentsBatch = (
    rowsToImport: Array<{
      studentNumber: string;
      name: string;
      className: string;
      height?: number | string;
      weight?: number | string;
      medicalNotes?: string;
    }>
  ) => {
    if (!rowsToImport || rowsToImport.length === 0) return;

    // 1. Unique class names
    const uniqueClassNames = Array.from(
      new Set(rowsToImport.map((r) => r.className.trim()))
    );

    let currentClasses = [...classes];
    const classIdMap = new Map<string, string>();

    currentClasses.forEach((c) => {
      classIdMap.set(c.name.trim().toLowerCase(), c.id);
    });

    const newlyCreatedClasses: ClassItem[] = [];
    uniqueClassNames.forEach((clsName, idx) => {
      const lower = clsName.toLowerCase();
      if (!classIdMap.has(lower)) {
        const newId = `cls-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
        const newClassItem: ClassItem = { id: newId, name: clsName };
        newlyCreatedClasses.push(newClassItem);
        classIdMap.set(lower, newId);
      }
    });

    if (newlyCreatedClasses.length > 0) {
      currentClasses = [...currentClasses, ...newlyCreatedClasses];
      setClasses(currentClasses);
    }

    // 2. Add students
    const newStudentsList: Student[] = [];
    const newMeasurementValues = { ...measurementValues };
    let hasMeasurements = false;

    rowsToImport.forEach((r, idx) => {
      const clsId =
        classIdMap.get(r.className.trim().toLowerCase()) ||
        currentClasses[0]?.id ||
        'cls-1';
      const stId = `st-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`;

      const newStudent: Student = {
        id: stId,
        name: r.name.trim(),
        classId: clsId,
        nationalId: r.studentNumber || undefined,
        medicalNotes: r.medicalNotes || undefined,
      };

      newStudentsList.push(newStudent);

      if (r.height !== undefined || r.weight !== undefined) {
        if (!newMeasurementValues[stId]) {
          newMeasurementValues[stId] = {};
        }
        if (r.height !== undefined && r.height !== '') {
          newMeasurementValues[stId]['m-height'] = r.height;
          hasMeasurements = true;
        }
        if (r.weight !== undefined && r.weight !== '') {
          newMeasurementValues[stId]['m-weight'] = r.weight;
          hasMeasurements = true;
        }
      }
    });

    setStudents((prev) => [...prev, ...newStudentsList]);
    if (hasMeasurements) {
      setMeasurementValues(newMeasurementValues);
    }

    const createdClassesMsg =
      newlyCreatedClasses.length > 0
        ? ` وتم إضافة ${newlyCreatedClasses.length} فصول جديدة`
        : '';
    showToast(
      `تم استيراد ${newStudentsList.length} طالب بنجاح${createdClassesMsg} 🎉`,
      'success'
    );
  };

  // Attendance actions
  const addAttendanceCheckItem = (name: string) => {
    const newItem: AttendanceCheckItem = {
      id: `att-${Date.now()}`,
      name: name.trim(),
    };
    setAttendanceCheckItems((prev) => [...prev, newItem]);
    showToast(`تم إضافة بند التحضير "${name}"`, 'success');
  };

  const deleteAttendanceCheckItem = (id: string) => {
    const item = attendanceCheckItems.find((a) => a.id === id);
    setAttendanceCheckItems((prev) => prev.filter((a) => a.id !== id));
    showToast(`تم حذف بند التحضير "${item?.name || ''}"`, 'info');
  };

  const toggleStudentCheckItem = (
    studentId: string,
    classId: string,
    date: string,
    itemId: string
  ) => {
    setDailyLogs((prev) => {
      const idx = prev.findIndex((l) => l.studentId === studentId && l.date === date);
      if (idx >= 0) {
        const copy = [...prev];
        const log = copy[idx];
        const currentChecks = log.customChecks || {};
        const isUniformItem = itemId === 'uniform';
        const currentVal = isUniformItem
          ? log.uniform !== false
          : currentChecks[itemId] === true;
        const newVal = !currentVal;

        const updatedChecks = { ...currentChecks, [itemId]: newVal };
        copy[idx] = {
          ...log,
          uniform: isUniformItem ? newVal : log.uniform,
          customChecks: updatedChecks,
          updatedAt: new Date().toISOString(),
        };
        return copy;
      } else {
        const isUniformItem = itemId === 'uniform';
        return [
          ...prev,
          {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            studentId,
            classId,
            date,
            attendance: 'present',
            uniform: isUniformItem ? false : true,
            customChecks: isUniformItem ? {} : { [itemId]: true },
            updatedAt: new Date().toISOString(),
          },
        ];
      }
    });
  };

  const setStudentAttendance = (
    studentId: string,
    classId: string,
    date: string,
    attendance: AttendanceStatus,
    uniform?: boolean
  ) => {
    setDailyLogs((prev) => {
      const idx = prev.findIndex((l) => l.studentId === studentId && l.date === date);
      const isPresent = attendance === 'present';
      const defaultUniform = uniform !== undefined ? uniform : isPresent ? true : false;

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          attendance,
          uniform: isPresent ? (uniform !== undefined ? uniform : copy[idx].uniform ?? true) : false,
          updatedAt: new Date().toISOString(),
        };
        return copy;
      } else {
        const newRecord: DailyLogRecord = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          studentId,
          classId,
          date,
          attendance,
          uniform: defaultUniform,
          updatedAt: new Date().toISOString(),
        };
        return [...prev, newRecord];
      }
    });
  };

  const toggleStudentUniform = (studentId: string, classId: string, date: string) => {
    setDailyLogs((prev) => {
      const idx = prev.findIndex((l) => l.studentId === studentId && l.date === date);
      if (idx >= 0) {
        const copy = [...prev];
        if (copy[idx].attendance === 'present') {
          copy[idx] = {
            ...copy[idx],
            uniform: !copy[idx].uniform,
            updatedAt: new Date().toISOString(),
          };
        }
        return copy;
      } else {
        // If no record exists, make present with uniform true
        return [
          ...prev,
          {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            studentId,
            classId,
            date,
            attendance: 'present',
            uniform: true,
            updatedAt: new Date().toISOString(),
          },
        ];
      }
    });
  };

  const markAllPresent = (classId: string, date: string) => {
    const classStudents = students.filter((s) => s.classId === classId);
    setDailyLogs((prev) => {
      let copy = [...prev];
      classStudents.forEach((st) => {
        const idx = copy.findIndex((l) => l.studentId === st.id && l.date === date);
        if (idx >= 0) {
          copy[idx] = {
            ...copy[idx],
            attendance: 'present',
            uniform: copy[idx].uniform ?? true,
            updatedAt: new Date().toISOString(),
          };
        } else {
          copy.push({
            id: `log-${Date.now()}-${st.id}`,
            studentId: st.id,
            classId,
            date,
            attendance: 'present',
            uniform: true,
            updatedAt: new Date().toISOString(),
          });
        }
      });
      return copy;
    });
    showToast('تم تحضير جميع الطلاب حاضر مع الزي 🟢', 'success');
  };

  const clearAttendance = (classId: string, date: string) => {
    const classStudentIds = students.filter((s) => s.classId === classId).map((s) => s.id);
    setDailyLogs((prev) => prev.filter((l) => !(l.date === date && classStudentIds.includes(l.studentId))));
    showToast('تم إعادة ضبط تحضير اليوم', 'info');
  };

  const getStudentRecordForDate = (studentId: string, date: string) => {
    return dailyLogs.find((l) => l.studentId === studentId && l.date === date);
  };

  // Assessment / Grades Actions
  const addAssessmentItem = (name: string, maxScore: number, weight = 1) => {
    const newItem: AssessmentItem = {
      id: `ass-${Date.now()}`,
      name: name.trim(),
      maxScore,
      weight,
      order: assessments.length + 1,
    };
    setAssessments((prev) => [...prev, newItem]);
    showToast(`تم إضافة بند "${name}" (${maxScore} درجات)`, 'success');
  };

  const updateAssessmentItem = (id: string, name: string, maxScore: number, weight = 1) => {
    setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, name, maxScore, weight } : a)));
    showToast('تم تحديث بند التقييم', 'success');
  };

  const deleteAssessmentItem = (id: string) => {
    const item = assessments.find((a) => a.id === id);
    setAssessments((prev) => prev.filter((a) => a.id !== id));
    showToast(`تم حذف بند "${item?.name || ''}"`, 'info');
  };

  const setStudentGradeScore = (studentId: string, assessmentId: string, score: number | undefined) => {
    setGrades((prev) => {
      const studentScores = { ...(prev[studentId] || {}) };
      if (score === undefined || isNaN(score)) {
        delete studentScores[assessmentId];
      } else {
        studentScores[assessmentId] = score;
      }
      return {
        ...prev,
        [studentId]: studentScores,
      };
    });
  };

  // Measurement Items Actions
  const addMeasurementItem = (itemData: Omit<MeasurementItem, 'id'>) => {
    const newItem: MeasurementItem = {
      ...itemData,
      id: `m-${Date.now()}`,
    };
    setMeasurementItems((prev) => [...prev, newItem]);
    showToast(`تم إضافة بند قياس "${itemData.name}"`, 'success');
  };

  const updateMeasurementItem = (id: string, itemData: Partial<MeasurementItem>) => {
    setMeasurementItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...itemData } : m)));
    showToast('تم تحديث بند القياس', 'success');
  };

  const deleteMeasurementItem = (id: string) => {
    setMeasurementItems((prev) => prev.filter((m) => m.id !== id));
    showToast('تم حذف بند القياس', 'info');
  };

  const setStudentMeasurementValue = (
    studentId: string,
    itemId: string,
    val: string | number | undefined
  ) => {
    setMeasurementValues((prev) => {
      const stVals = { ...(prev[studentId] || {}) };
      if (val === undefined || val === '') {
        delete stVals[itemId];
      } else {
        stVals[itemId] = val;
      }
      return {
        ...prev,
        [studentId]: stVals,
      };
    });
  };

  // Incentive & Violations Actions
  const addIncentiveRecord = (record: Omit<IncentiveRecord, 'id' | 'createdAt'>) => {
    const newRecord: IncentiveRecord = {
      ...record,
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    setIncentiveRecords((prev) => [newRecord, ...prev]);
    const isPos = record.type === 'positive';
    showToast(
      isPos
        ? `تم إضافة تحفيز (+${record.points} نقطة) للطالب`
        : `تم تسجيل مخالفة (${record.points} نقطة) على الطالب`,
      isPos ? 'success' : 'warning'
    );
  };

  const deleteIncentiveRecord = (id: string) => {
    setIncentiveRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('تم حذف السجل من بنك التحفيز', 'info');
  };

  const getStudentIncentiveSummary = useCallback(
    (studentId: string) => {
      const records = incentiveRecords.filter((r) => r.studentId === studentId);
      let totalPoints = 0;
      let positiveCount = 0;
      let negativeCount = 0;

      records.forEach((r) => {
        totalPoints += r.points;
        if (r.type === 'positive') positiveCount++;
        else negativeCount++;
      });

      return {
        totalPoints,
        positiveCount,
        negativeCount,
        records,
      };
    },
    [incentiveRecords]
  );

  // Timetable
  const updateTimetableEntry = (dayOfWeek: number, periodNumber: number, classId: string) => {
    setTimetable((prev) => {
      const existingIdx = prev.findIndex((t) => t.dayOfWeek === dayOfWeek && t.periodNumber === periodNumber);
      if (existingIdx >= 0) {
        if (!classId) {
          // Remove if empty
          return prev.filter((_, idx) => idx !== existingIdx);
        }
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], classId };
        return copy;
      } else {
        if (!classId) return prev;
        return [
          ...prev,
          {
            id: `t-${dayOfWeek}-${periodNumber}-${Date.now()}`,
            dayOfWeek,
            periodNumber,
            classId,
          },
        ];
      }
    });
    showToast('تم تحديث جدول الحصص', 'success');
  };

  // Settings
  const updateSettings = (newSettings: Partial<TeacherSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('تم حفظ الإعدادات', 'success');
  };

  const restoreData = (data: any) => {
    if (data.classes) setClasses(data.classes);
    if (data.students) setStudents(data.students);
    if (data.dailyLogs) setDailyLogs(data.dailyLogs);
    if (data.assessments) setAssessments(data.assessments);
    if (data.grades) setGrades(data.grades);
    if (data.measurementItems) setMeasurementItems(data.measurementItems);
    if (data.measurementValues) setMeasurementValues(data.measurementValues);
    if (data.timetable) setTimetable(data.timetable);
    if (data.settings) setSettings(data.settings);
    showToast('تم استعادة البيانات بنجاح 🟢', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        classes,
        students,
        dailyLogs,
        timetable,
        settings,

        selectedClassId,
        setSelectedClassId,
        selectedDate,
        setSelectedDate,

        selectedStudentId,
        setSelectedStudentId,

        toast,
        showToast,
        dismissToast,
        triggerHaptic,

        addClass,
        updateClass,
        deleteClass,

        addStudent,
        updateStudent,
        deleteStudent,
        batchAddStudents,
        importStudentsBatch,

        attendanceCheckItems,
        addAttendanceCheckItem,
        deleteAttendanceCheckItem,
        toggleStudentCheckItem,
        setStudentAttendance,
        toggleStudentUniform,
        markAllPresent,
        clearAttendance,
        getStudentRecordForDate,

        assessments,
        grades,
        addAssessmentItem,
        updateAssessmentItem,
        deleteAssessmentItem,
        setStudentGradeScore,

        measurementItems,
        measurementValues,
        addMeasurementItem,
        updateMeasurementItem,
        deleteMeasurementItem,
        setStudentMeasurementValue,

        incentiveRecords,
        addIncentiveRecord,
        deleteIncentiveRecord,
        getStudentIncentiveSummary,

        updateTimetableEntry,

        updateSettings,
        restoreData,
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
