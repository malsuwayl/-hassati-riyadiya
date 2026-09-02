import {
  ClassItem,
  Student,
  AssessmentItem,
  MeasurementItem,
  TimetableEntry,
  TeacherSettings,
  PeriodTimeConfig,
  NotificationSettings,
} from '../types';

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enableAlerts: true,
  preClassMinutes: 5,
  enablePreClassAlert: true,
  enableClassStartBell: true,
  enablePreEndAlert: true,
  enableClassEndBell: true,
  enableSound: true,
  enableTTS: true,
  enableBrowserNotifications: true,
};

export const DEFAULT_PERIOD_TIMES: PeriodTimeConfig[] = [
  { periodNumber: 1, startTime: '07:00', endTime: '07:45' },
  { periodNumber: 2, startTime: '07:50', endTime: '08:35' },
  { periodNumber: 3, startTime: '08:40', endTime: '09:25' },
  { periodNumber: 4, startTime: '09:55', endTime: '10:40' },
  { periodNumber: 5, startTime: '10:45', endTime: '11:30' },
  { periodNumber: 6, startTime: '11:35', endTime: '12:20' },
  { periodNumber: 7, startTime: '12:25', endTime: '13:10' },
];

export const DEFAULT_TEACHER_SETTINGS: TeacherSettings = {
  schoolName: 'مدرسة الأمل الثانوية',
  teacherName: 'أ. محمد القحطاني',
  periodTimes: DEFAULT_PERIOD_TIMES,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
};

export const SAMPLE_DEMO_CLASSES: ClassItem[] = [
  { id: 'class-1', name: 'الصف الأول الثانوي - 1' },
  { id: 'class-2', name: 'الصف الأول الثانوي - 2' },
  { id: 'class-3', name: 'الصف الثاني الثانوي - 1' },
];

export const SAMPLE_DEMO_STUDENTS: Student[] = [
  {
    id: 'st-1',
    name: 'عبدالله بن محمد العتيبي',
    classId: 'class-1',
    nationalId: '1102938471',
    medicalNotes: 'ربو خفيف عند الإجهاد العالي',
    phone: '0501234567',
    teacherNotes: 'طالب متميز رياضياً ولائق بدنياً',
  },
  {
    id: 'st-2',
    name: 'سعود بن عبدالعزيز الدوسري',
    classId: 'class-1',
    nationalId: '1098765432',
    phone: '0559876543',
  },
  {
    id: 'st-3',
    name: 'فهد بن خالد القحطاني',
    classId: 'class-1',
    nationalId: '1087654321',
    medicalNotes: 'إصابة سابقة بالرباط الصليبي',
  },
  {
    id: 'st-4',
    name: 'سلمان بن حمد الشمري',
    classId: 'class-2',
    nationalId: '1032109876',
  },
  {
    id: 'st-5',
    name: 'عمر بن فاروق الغامدي',
    classId: 'class-2',
    nationalId: '1044556677',
    medicalNotes: 'عذر طبي مؤقت',
  },
];

export const DEFAULT_ASSESSMENTS: AssessmentItem[] = [
  { id: 'ass-1', name: 'الزي الرياضي', maxScore: 10, weight: 1, order: 1 },
  { id: 'ass-2', name: 'المشاركة والحضور', maxScore: 20, weight: 1, order: 2 },
  { id: 'ass-3', name: 'الاختبار المهاري', maxScore: 30, weight: 1, order: 3 },
  { id: 'ass-4', name: 'المواظبة السلوكية', maxScore: 10, weight: 1, order: 4 },
  { id: 'ass-5', name: 'الاختبار النظري', maxScore: 30, weight: 1, order: 5 },
];

export const DEFAULT_MEASUREMENT_ITEMS: MeasurementItem[] = [
  {
    id: 'm-height',
    name: 'الطول',
    inputType: 'number',
    unit: 'cm',
    maxGrade: 5,
    betterDirection: 'higher',
  },
  {
    id: 'm-weight',
    name: 'الوزن',
    inputType: 'number',
    unit: 'kg',
    maxGrade: 5,
    betterDirection: 'lower',
  },
  {
    id: 'm-sprint50',
    name: 'جري 50م',
    inputType: 'number',
    unit: 'seconds',
    maxGrade: 10,
    betterDirection: 'lower',
    gradingRanges: [
      { id: 'r1', minVal: 0, maxVal: 7.0, score: 10, levelName: 'ممتاز' },
      { id: 'r2', minVal: 7.01, maxVal: 7.5, score: 9, levelName: 'جيد جداً' },
      { id: 'r3', minVal: 7.51, maxVal: 8.2, score: 8, levelName: 'جيد' },
      { id: 'r4', minVal: 8.21, maxVal: 9.0, score: 6, levelName: 'مقبول' },
      { id: 'r5', minVal: 9.01, maxVal: 99, score: 4, levelName: 'ضعيف' },
    ],
  },
  {
    id: 'm-run600',
    name: 'جري 600م',
    inputType: 'time',
    unit: 'mm:ss',
    maxGrade: 10,
    betterDirection: 'lower',
    gradingRanges: [
      { id: 'r1', minVal: 0, maxVal: 150, score: 10, levelName: 'ممتاز' },
      { id: 'r2', minVal: 151, maxVal: 180, score: 8, levelName: 'جيد جداً' },
      { id: 'r3', minVal: 181, maxVal: 210, score: 6, levelName: 'جيد' },
      { id: 'r4', minVal: 211, maxVal: 999, score: 4, levelName: 'مقبول' },
    ],
  },
  {
    id: 'm-longjump',
    name: 'الوثب الطويل',
    inputType: 'number',
    unit: 'cm',
    maxGrade: 10,
    betterDirection: 'higher',
    gradingRanges: [
      { id: 'r1', minVal: 200, maxVal: 999, score: 10, levelName: 'ممتاز' },
      { id: 'r2', minVal: 170, maxVal: 199, score: 8, levelName: 'جيد جداً' },
      { id: 'r3', minVal: 140, maxVal: 169, score: 6, levelName: 'جيد' },
      { id: 'r4', minVal: 100, maxVal: 139, score: 4, levelName: 'مقبول' },
    ],
  },
  {
    id: 'm-flexibility',
    name: 'مرونة الجذع',
    inputType: 'number',
    unit: 'cm',
    maxGrade: 10,
    betterDirection: 'higher',
    gradingRanges: [
      { id: 'r1', minVal: 15, maxVal: 99, score: 10, levelName: 'ممتاز' },
      { id: 'r2', minVal: 10, maxVal: 14.9, score: 8, levelName: 'جيد جداً' },
      { id: 'r3', minVal: 5, maxVal: 9.9, score: 6, levelName: 'جيد' },
      { id: 'r4', minVal: 0, maxVal: 4.9, score: 4, levelName: 'مقبول' },
    ],
  },
  {
    id: 'm-pushups',
    name: 'الضغط',
    inputType: 'number',
    unit: 'count',
    maxGrade: 10,
    betterDirection: 'higher',
    gradingRanges: [
      { id: 'r1', minVal: 25, maxVal: 999, score: 10, levelName: 'ممتاز' },
      { id: 'r2', minVal: 18, maxVal: 24, score: 8, levelName: 'جيد جداً' },
      { id: 'r3', minVal: 12, maxVal: 17, score: 6, levelName: 'جيد' },
      { id: 'r4', minVal: 6, maxVal: 11, score: 4, levelName: 'مقبول' },
      { id: 'r5', minVal: 0, maxVal: 5, score: 2, levelName: 'ضعيف' },
    ],
  },
  {
    id: 'm-situps',
    name: 'البطن',
    inputType: 'number',
    unit: 'count',
    maxGrade: 10,
    betterDirection: 'higher',
    gradingRanges: [
      { id: 'r1', minVal: 30, maxVal: 999, score: 10, levelName: 'ممتاز' },
      { id: 'r2', minVal: 22, maxVal: 29, score: 8, levelName: 'جيد جداً' },
      { id: 'r3', minVal: 15, maxVal: 21, score: 6, levelName: 'جيد' },
      { id: 'r4', minVal: 8, maxVal: 14, score: 4, levelName: 'مقبول' },
    ],
  },
  {
    id: 'm-agility',
    name: 'الرشاقة',
    inputType: 'number',
    unit: 'seconds',
    maxGrade: 10,
    betterDirection: 'lower',
    gradingRanges: [
      { id: 'r1', minVal: 0, maxVal: 9.0, score: 10, levelName: 'ممتاز' },
      { id: 'r2', minVal: 9.01, maxVal: 10.0, score: 8, levelName: 'جيد جداً' },
      { id: 'r3', minVal: 10.01, maxVal: 11.5, score: 6, levelName: 'جيد' },
      { id: 'r4', minVal: 11.51, maxVal: 99, score: 4, levelName: 'مقبول' },
    ],
  },
  {
    id: 'm-balance',
    name: 'التوازن',
    inputType: 'number',
    unit: 'seconds',
    maxGrade: 10,
    betterDirection: 'higher',
    gradingRanges: [
      { id: 'r1', minVal: 30, maxVal: 999, score: 10, levelName: 'ممتاز' },
      { id: 'r2', minVal: 20, maxVal: 29, score: 8, levelName: 'جيد جداً' },
      { id: 'r3', minVal: 10, maxVal: 19, score: 6, levelName: 'جيد' },
      { id: 'r4', minVal: 0, maxVal: 9, score: 4, levelName: 'مقبول' },
    ],
  },
];

export const DEFAULT_TIMETABLE: TimetableEntry[] = [];
