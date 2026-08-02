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
  notes?: string;
  updatedAt: string;
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

export type ActiveTab = 'dashboard' | 'classes' | 'students' | 'attendance' | 'reports' | 'settings';
