export type AttendanceStatus = 'present' | 'absent' | 'late' | null;

export type EvaluationType = 'participation' | 'excellence' | 'violation' | 'warning';

export interface ClassItem {
  id: string;
  name: string; // e.g., "أول ثانوي - شعبة 1"
  grade: string; // e.g., "الأول الثانوي"
  section: string; // e.g., "1"
  period: string; // e.g., "الحصة الثانية"
  day: string; // e.g., "الأحد"
  notes?: string;
  studentCount?: number;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  studentNumber?: string;
  nationalId?: string; // رقم الهوية الوطنية / الإقامة
  medicalNotes?: string; // ملاحظات صحية (مثل: ربو، إصابة ركبة...)
  phone?: string;
  notes?: string;
  avatarColor?: string;
}

export interface DailyLogRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  attendance: AttendanceStatus;
  participations: number;
  excellences: number;
  violations: number;
  warnings: number;
  sportsUniform?: boolean; // true = ملتزم بالزي الرياضي, false = غير ملتزم
  notes?: string;
  updatedAt: string;
}

export interface PhysicalMeasurement {
  studentId: string;
  height?: number; // cm (الطول سم)
  weight?: number; // kg (الوزن كجم)
  bmi?: number; // (مؤشر كتلة الجسم - يحسب تلقائياً)
  sprint50m?: number; // seconds (جري 50م - ثواني)
  run600m?: string; // string (جري 600م - دقائق/ثواني)
  standingLongJump?: number; // cm (الوثب الطويل من الثبات - سم)
  sitUps?: number; // count (ثني الجذع من الجلوس / البطن)
  pushUps?: number; // count (الضغط بالذراعين)
  flexibility?: number; // cm (المرونة - مد الذراعين للأمام)
  agility?: number; // seconds/score (الرشاقة)
  balance?: number; // seconds/score (التوازن)
  notes?: string; // ملاحظات
  updatedAt?: string;
}

export interface SettingsPointsConfig {
  attendance: number;
  late: number;
  absent: number;
  participation: number;
  excellence: number;
  violation: number;
  warning: number;
  schoolName: string;
  teacherName: string;
  schoolLogo?: string;
  theme?: 'light' | 'dark';
}

export type ActiveTab =
  | 'dashboard'
  | 'classes'
  | 'students'
  | 'attendance'
  | 'measurements'
  | 'reports'
  | 'settings';
