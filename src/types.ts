export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'activity' | null;

export interface AttendanceCheckItem {
  id: string;
  name: string;
}

export interface ClassItem {
  id: string;
  name: string; // e.g. "الصف الأول الثانوي - 1"
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  nationalId?: string;
  fingerprintId?: string; // Fingerprint device user PIN / ID / Biometric Badge
  medicalNotes?: string; // e.g., "ربو خفيف", "إصابة ركبة", "عذر طبي مؤقت"
  phone?: string;
  teacherNotes?: string;
  notes?: string;
}

export interface FingerprintDevice {
  id: string;
  name: string; // e.g. "جهاز الصالة الرياضية (ZKTeco)"
  model: string; // e.g. "ZKTeco K40 / USB"
  type: 'usb_file' | 'live_usb_reader' | 'network_ip';
  location?: string;
  ipAddress?: string;
  port?: number;
  lastSync?: string;
  autoMarkLateMinutes?: number; // e.g. 10 minutes
}

export interface FingerprintLogRecord {
  rawId: string; // Student/User ID in fingerprint device
  timestamp: string; // "2026-08-21 07:15:30"
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm:ss"
  studentId?: string;
  studentName?: string;
  className?: string;
  status: 'present' | 'late';
  matchType: 'fingerprint_id' | 'national_id' | 'name' | 'unmatched';
}

export interface DailyLogRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  attendance: AttendanceStatus;
  uniform?: boolean; // true = wearing sports uniform ✅, false = not wearing ❌
  customChecks?: Record<string, boolean>; // itemId -> boolean
  notes?: string;
  updatedAt?: string;
}

export type IncentiveType = 'positive' | 'negative';

export interface IncentiveRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  type: IncentiveType;
  points: number; // positive (e.g. 1, 2) or negative (e.g. -1, -2)
  title: string; // e.g. "مشاركة متميزة", "روح رياضية", "مخالفة سلوكية"
  notes?: string;
  createdAt: string;
}

export interface TimetableEntry {
  id: string;
  dayOfWeek: number; // 0: الأحد, 1: الإثنين, 2: الثلاثاء, 3: الأربعاء, 4: الخميس
  periodNumber: number; // 1, 2, 3, 4, 5, 6, 7...
  classId: string;
}

export interface AssessmentItem {
  id: string;
  name: string; // e.g. "المشاركة والحضور", "الاختبار المهاري"
  maxScore: number;
  weight?: number;
  order?: number;
}

export type MeasurementInputType = 'number' | 'time' | 'yesno' | 'text';

export type MeasurementUnit =
  | 'cm'
  | 'kg'
  | 'bmi'
  | 'seconds'
  | 'mm:ss'
  | 'meters'
  | 'count'
  | 'degrees'
  | '%'
  | 'none';

export interface GradingRange {
  id: string;
  minVal: number;
  maxVal: number;
  score: number;
  levelName: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف';
}

export interface MeasurementItem {
  id: string;
  name: string; // e.g., "جري 50م", "جري 600م", "الطول", "الوزن", "BMI", "الضغط", "المرونة"
  inputType: MeasurementInputType;
  unit: MeasurementUnit;
  maxGrade: number; // e.g., 10
  betterDirection: 'higher' | 'lower'; // higher is better (e.g. pushups) or lower is better (e.g. 50m)
  gradingRanges?: GradingRange[];
}

export interface PeriodTimeConfig {
  periodNumber: number;
  startTime: string; // e.g., "07:00"
  endTime: string; // e.g., "07:45"
}

export interface NotificationSettings {
  enableAlerts: boolean; // General switch
  preClassMinutes: number; // e.g., 5 mins before
  enablePreClassAlert: boolean; // Pre-class reminder
  enableClassStartBell: boolean; // Start bell
  enablePreEndAlert: boolean; // Pre-end reminder (5 mins before end)
  enableClassEndBell: boolean; // End bell
  enableSound: boolean; // Play school bell sound
  enableTTS: boolean; // Speak Arabic announcement
  enableBrowserNotifications: boolean; // Native device push popup
}

export interface TeacherSettings {
  schoolName: string;
  teacherName: string;
  schoolLogo?: string;
  periodTimes?: PeriodTimeConfig[];
  notifications?: NotificationSettings;
  fingerprintDevices?: FingerprintDevice[];
  defaultFingerprintGraceMinutes?: number; // e.g. 10 minutes
}

export type ActiveTab =
  | 'home'
  | 'attendance'
  | 'grades'
  | 'measurements'
  | 'incentives'
  | 'statistics'
  | 'students'
  | 'settings';
