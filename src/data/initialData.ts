import { ClassItem, Student, SettingsPointsConfig, DailyLogRecord } from '../types';

export const DEFAULT_POINTS_CONFIG: SettingsPointsConfig = {
  attendance: 2,
  late: -1,
  absent: 0,
  participation: 1,
  excellence: 3,
  violation: -2,
  warning: -3,
  schoolName: '',
  teacherName: '',
  theme: 'light',
};

export const INITIAL_CLASSES: ClassItem[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_LOGS: DailyLogRecord[] = [];

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const SAMPLE_DEMO_CLASSES: ClassItem[] = [
  {
    id: 'class-demo-1',
    name: 'الصف الأول الثانوي - 1',
    grade: 'الأول الثانوي',
    section: '1',
    period: 'الحصة الأولى',
    day: 'الأحد',
    notes: 'حصص البدنية بالملعب الرئيسي',
  },
  {
    id: 'class-demo-2',
    name: 'الصف الأول الثانوي - 2',
    grade: 'الأول الثانوي',
    section: '2',
    period: 'الحصة الثانية',
    day: 'الأحد',
    notes: 'تمارين اللياقة والكرة الطائرة',
  },
];

export const SAMPLE_DEMO_STUDENTS: Student[] = [
  { id: 'st-1', name: 'عبدالله بن محمد العتيبي', classId: 'class-demo-1', studentNumber: '101', nationalId: '1102938471', medicalNotes: 'ربو خفيف - تجنب المجهود الشديد', phone: '0501234567' },
  { id: 'st-2', name: 'سعود بن عبدالعزيز الدوسري', classId: 'class-demo-1', studentNumber: '102', nationalId: '1098765432', phone: '0552345678' },
  { id: 'st-3', name: 'فهد بن خالد القحطاني', classId: 'class-demo-1', studentNumber: '103', nationalId: '1087654321', phone: '0543456789' },
  { id: 'st-4', name: 'سلمان بن حمد الشمري', classId: 'class-demo-2', studentNumber: '104', nationalId: '1032109876', phone: '0548901234' },
];

export const SAMPLE_DEMO_LOGS: DailyLogRecord[] = [
  {
    id: 'log-1',
    studentId: 'st-1',
    classId: 'class-demo-1',
    date: getTodayDateString(),
    attendance: 'present',
    participations: 2,
    excellences: 1,
    violations: 0,
    warnings: 0,
    notes: 'أداء ممتاز في تمرين الإحماء والسرعة',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'log-2',
    studentId: 'st-2',
    classId: 'class-demo-1',
    date: getTodayDateString(),
    attendance: 'present',
    participations: 1,
    excellences: 0,
    violations: 0,
    warnings: 0,
    notes: '',
    updatedAt: new Date().toISOString(),
  },
];
