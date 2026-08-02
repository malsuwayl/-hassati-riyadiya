import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Student, ClassItem, SettingsPointsConfig, DailyLogRecord } from '../types';

export interface AppBackupData {
  version?: number;
  exportedAt?: string;
  classes: ClassItem[];
  students: Student[];
  dailyLogs: DailyLogRecord[];
  settings: SettingsPointsConfig;
}

export const parseStudentsFile = async (
  file: File,
  defaultClassId: string,
  existingClasses: ClassItem[]
): Promise<{
  newStudents: Omit<Student, 'id'>[];
  newClassesToCreate: Omit<ClassItem, 'id'>[];
  mappedClassIds: Map<string, string>; // className -> classId mapping if class exists
}> => {
  let rows: any[] = [];
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
    rows = parsed.data as any[];
  } else {
    // Excel file (.xlsx, .xls)
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
  }

  if (!rows || rows.length === 0) {
    throw new Error('الملف فارغ أو غير صالح');
  }

  // Check if row 0 is a header
  let startIndex = 0;
  if (rows.length > 1) {
    const row0 = (rows[0] || []).map((cell: any) => String(cell).toLowerCase()).join(' ');
    if (
      row0.includes('اسم') ||
      row0.includes('طالب') ||
      row0.includes('فصل') ||
      row0.includes('صف') ||
      row0.includes('name') ||
      row0.includes('student')
    ) {
      startIndex = 1;
    }
  }

  const newStudents: Omit<Student, 'id'>[] = [];
  const newClassesMap = new Map<string, Omit<ClassItem, 'id'>>();
  const mappedClassIds = new Map<string, string>();

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row) || row.length === 0) continue;

    const name = String(row[0] || '').trim();
    if (!name) continue;

    let rawClassName = String(row[1] || '').trim();
    let studentNumber = String(row[2] || '').trim();
    let phone = String(row[3] || '').trim();
    let medicalNotes = String(row[4] || '').trim();

    // Smart fallback if student number was placed in column 1
    if (/^\d+$/.test(rawClassName) && rawClassName.length >= 3 && !studentNumber) {
      studentNumber = rawClassName;
      rawClassName = '';
    }

    let targetClassId = defaultClassId;

    if (rawClassName) {
      // Find matching class among existing
      const matched = existingClasses.find(
        (c) => c.name.trim().toLowerCase() === rawClassName.toLowerCase()
      );

      if (matched) {
        targetClassId = matched.id;
        mappedClassIds.set(rawClassName, matched.id);
      } else {
        // Prepare new class
        if (!newClassesMap.has(rawClassName)) {
          newClassesMap.set(rawClassName, {
            name: rawClassName,
            grade: rawClassName.includes('ثانوي')
              ? 'الثانوي'
              : rawClassName.includes('متوسط')
              ? 'المتوسط'
              : 'الابتدائي',
            section: '1',
            period: 'الحصة الأولى',
            day: 'الأحد',
          });
        }
        targetClassId = `NEW:${rawClassName}`;
      }
    }

    newStudents.push({
      name,
      classId: targetClassId,
      studentNumber,
      nationalId: studentNumber,
      phone,
      medicalNotes,
    });
  }

  return {
    newStudents,
    newClassesToCreate: Array.from(newClassesMap.values()),
    mappedClassIds,
  };
};

export const exportJSONBackup = (
  classes: ClassItem[],
  students: Student[],
  dailyLogs: DailyLogRecord[],
  settings: SettingsPointsConfig
) => {
  const backupObj: AppBackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    classes,
    students,
    dailyLogs,
    settings,
  };

  const jsonStr = JSON.stringify(backupObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `حصتي_الرياضية_نسخة_احتياطية_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
