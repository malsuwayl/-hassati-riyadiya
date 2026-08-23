import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  Student,
  ClassItem,
  DailyLogRecord,
  AssessmentItem,
  MeasurementItem,
  TimetableEntry,
  TeacherSettings,
} from '../types';

export interface AppFullBackupData {
  version: number;
  exportedAt: string;
  classes?: ClassItem[];
  students?: Student[];
  dailyLogs?: DailyLogRecord[];
  assessments?: AssessmentItem[];
  grades?: Record<string, Record<string, number>>;
  measurementItems?: MeasurementItem[];
  measurementValues?: Record<string, Record<string, string | number>>;
  timetable?: TimetableEntry[];
  settings?: TeacherSettings;
}

export function exportAppStateToJSON(data: Omit<AppFullBackupData, 'version' | 'exportedAt'>) {
  const fullBackup: AppFullBackupData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    ...data,
  };

  const jsonStr = JSON.stringify(fullBackup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hosati_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importAppStateFromJSON(file: File, onSuccess: (data: AppFullBackupData) => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const parsed = JSON.parse(content);
      onSuccess(parsed);
    } catch (err) {
      alert('عذراً، الملف غير صالح لاستعادة النسخة الاحتياطية.');
    }
  };
  reader.readAsText(file);
}

export function exportToExcel(
  classes: ClassItem[],
  students: Student[],
  dailyLogs: DailyLogRecord[],
  assessments: AssessmentItem[],
  grades: Record<string, Record<string, number>>,
  measurementItems: MeasurementItem[],
  measurementValues: Record<string, Record<string, string | number>>
) {
  const wb = XLSX.utils.book_new();

  // 1. Students Sheet
  const studentsRows = students.map((s, idx) => {
    const cls = classes.find((c) => c.id === s.classId);
    return {
      '#': idx + 1,
      'اسم الطالب': s.name,
      'الفصل': cls?.name || '',
      'رقم البصمة': s.fingerprintId || '',
      'السجل المدني': s.nationalId || '',
      'رقم الجوال': s.phone || '',
      'ملاحظات صحية': s.medicalNotes || '',
      'ملاحظات المعلم': s.teacherNotes || '',
    };
  });
  const wsStudents = XLSX.utils.json_to_sheet(studentsRows);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'الطلاب');

  // 2. Grades Sheet
  const gradesRows = students.map((s, idx) => {
    const cls = classes.find((c) => c.id === s.classId);
    const stGrades = grades[s.id] || {};
    const row: Record<string, any> = {
      '#': idx + 1,
      'اسم الطالب': s.name,
      'الفصل': cls?.name || '',
    };
    let sum = 0;
    assessments.forEach((ass) => {
      const score = stGrades[ass.id] ?? '';
      row[`${ass.name} (${ass.maxScore})`] = score;
      if (typeof score === 'number') sum += score;
    });
    row['المجموع'] = sum;
    return row;
  });
  const wsGrades = XLSX.utils.json_to_sheet(gradesRows);
  XLSX.utils.book_append_sheet(wb, wsGrades, 'الدرجات');

  // 3. Physical Measurements Sheet
  const measRows = students.map((s, idx) => {
    const cls = classes.find((c) => c.id === s.classId);
    const stMeas = measurementValues[s.id] || {};
    const row: Record<string, any> = {
      '#': idx + 1,
      'اسم الطالب': s.name,
      'الفصل': cls?.name || '',
    };
    measurementItems.forEach((m) => {
      row[`${m.name} (${m.unit})`] = stMeas[m.id] ?? '';
    });
    return row;
  });
  const wsMeas = XLSX.utils.json_to_sheet(measRows);
  XLSX.utils.book_append_sheet(wb, wsMeas, 'القياسات البدنية');

  XLSX.writeFile(wb, `تقرير_حصتي_الرياضية_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadSampleTemplateExcel() {
  const sampleData = [
    {
      'رقم الطالب': '1001',
      'اسم الطالب': 'أحمد محمد العتيبي',
      'الفصل': 'Grade 1A',
      'الطول': 145,
      'الوزن': 40,
      'الملاحظات الصحية': 'لا يوجد',
    },
    {
      'رقم الطالب': '1002',
      'اسم الطالب': 'خالد عبد الله الدوسري',
      'الفصل': 'Grade 1A',
      'الطول': 148,
      'الوزن': 42,
      'الملاحظات الصحية': 'ربو خفيف عند الجري',
    },
    {
      'رقم الطالب': '1003',
      'اسم الطالب': 'محمد علي الغامدي',
      'الفصل': 'Grade 2B',
      'الطول': 152,
      'الوزن': 46,
      'الملاحظات الصحية': 'حساسية طعام',
    },
    {
      'رقم الطالب': '1004',
      'اسم الطالب': 'سعد بن فهد القحطاني',
      'الفصل': 'Grade 2B',
      'الطول': 150,
      'الوزن': 44,
      'الملاحظات الصحية': 'عذر طبي مؤقت',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 26 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'قائمة الطلاب');
  XLSX.writeFile(wb, 'نموذج_استيراد_الطلاب.xlsx');
}

export function downloadSampleTemplateCSV() {
  const csvContent =
    '\uFEFF' +
    'Student Number,Student Name,Class,Height,Weight,Health Notes\n' +
    '1001,أحمد محمد العتيبي,Grade 1A,145,40,لا يوجد\n' +
    '1002,خالد عبد الله الدوسري,Grade 1A,148,42,ربو خفيف\n' +
    '1003,محمد علي الغامدي,Grade 2B,152,46,عذر طبي مؤقت\n' +
    '1004,سعد بن فهد القحطاني,Grade 2B,150,44,\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'نموذج_استيراد_الطلاب.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export interface ParsedStudentRow {
  rowIndex: number;
  studentNumber: string;
  name: string;
  className: string;
  fingerprintId?: string;
  height?: number | string;
  weight?: number | string;
  medicalNotes?: string;

  status: 'valid' | 'duplicate' | 'error';
  isNewClass: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParseStudentsResult {
  rows: ParsedStudentRow[];
  totalCount: number;
  validCount: number;
  duplicateCount: number;
  errorCount: number;
  newClassesCount: number;
  newClassNames: string[];
}

export const parseStudentsFileAdvanced = async (
  file: File,
  existingStudents: Student[],
  existingClasses: ClassItem[]
): Promise<ParseStudentsResult> => {
  let rawRows: any[] = [];
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
    rawRows = parsed.data as any[];
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
  }

  if (!rawRows || rawRows.length === 0) {
    throw new Error('الملف فارغ أو غير صالح للاستيراد');
  }

  // Column mapping strategy
  let colStudentNumber = -1;
  let colName = -1;
  let colClass = -1;
  let colHeight = -1;
  let colWeight = -1;
  let colMedicalNotes = -1;

  let startRowIndex = 0;

  // Inspect first 2 rows to see if row 0 is a header
  if (rawRows.length > 0) {
    const headerRow = (rawRows[0] || []).map((cell: any) =>
      String(cell || '').trim().toLowerCase()
    );

    headerRow.forEach((cellText: string, colIdx: number) => {
      if (
        colStudentNumber === -1 &&
        (cellText.includes('number') ||
          cellText.includes('رقم') ||
          cellText.includes('سجل') ||
          cellText.includes('هوية') ||
          cellText.includes('national') ||
          cellText.includes('id'))
      ) {
        colStudentNumber = colIdx;
      }

      if (
        colName === -1 &&
        (cellText.includes('name') ||
          cellText.includes('اسم') ||
          cellText.includes('طالب'))
      ) {
        colName = colIdx;
      }

      if (
        colClass === -1 &&
        (cellText.includes('class') ||
          cellText.includes('grade') ||
          cellText.includes('فصل') ||
          cellText.includes('صف') ||
          cellText.includes('قسم'))
      ) {
        colClass = colIdx;
      }

      if (
        colHeight === -1 &&
        (cellText.includes('height') ||
          cellText.includes('طول'))
      ) {
        colHeight = colIdx;
      }

      if (
        colWeight === -1 &&
        (cellText.includes('weight') ||
          cellText.includes('وزن'))
      ) {
        colWeight = colIdx;
      }

      if (
        colMedicalNotes === -1 &&
        (cellText.includes('notes') ||
          cellText.includes('health') ||
          cellText.includes('medical') ||
          cellText.includes('ملاحظ') ||
          cellText.includes('عذر') ||
          cellText.includes('صح'))
      ) {
        colMedicalNotes = colIdx;
      }
    });

    // Check if header row was detected
    if (colName !== -1 || colClass !== -1 || colStudentNumber !== -1) {
      startRowIndex = 1;
    }
  }

  // Fallbacks if columns were not mapped by header names
  if (colName === -1) colName = 1; // Default to column 2 (0-indexed 1)
  if (colStudentNumber === -1) colStudentNumber = 0; // Default to column 1
  if (colClass === -1) colClass = 2; // Default to column 3
  if (colHeight === -1) colHeight = 3;
  if (colWeight === -1) colWeight = 4;
  if (colMedicalNotes === -1) colMedicalNotes = 5;

  const parsedRows: ParsedStudentRow[] = [];
  const seenInFileNumbers = new Set<string>();
  const seenInFileKeys = new Set<string>();
  const newClassesSet = new Set<string>();

  for (let i = startRowIndex; i < rawRows.length; i++) {
    const rowData = rawRows[i];
    if (!rowData || !Array.isArray(rowData)) continue;

    // Skip row if all cells are empty
    const isRowEmpty = rowData.every((cell) => String(cell || '').trim() === '');
    if (isRowEmpty) continue;

    let studentNumber = String(rowData[colStudentNumber] ?? '').trim();
    let name = String(rowData[colName] ?? '').trim();
    let className = String(rowData[colClass] ?? '').trim();
    let heightRaw = rowData[colHeight];
    let weightRaw = rowData[colWeight];
    let medicalNotes = String(rowData[colMedicalNotes] ?? '').trim();

    // Handling position swaps if column 0 was name and column 1 was number
    if (/^\d+$/.test(className) && !studentNumber) {
      studentNumber = className;
      className = '';
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name) {
      errors.push('اسم الطالب مفقود');
    }
    if (!className) {
      errors.push('اسم الفصل مفقود');
    }

    // Parse height & weight if present
    let height: number | string | undefined = undefined;
    if (heightRaw !== undefined && heightRaw !== null && String(heightRaw).trim() !== '') {
      const numH = parseFloat(String(heightRaw));
      height = !isNaN(numH) ? numH : String(heightRaw).trim();
    }

    let weight: number | string | undefined = undefined;
    if (weightRaw !== undefined && weightRaw !== null && String(weightRaw).trim() !== '') {
      const numW = parseFloat(String(weightRaw));
      weight = !isNaN(numW) ? numW : String(weightRaw).trim();
    }

    // Check Class existence
    const matchedClass = existingClasses.find(
      (c) => c.name.trim().toLowerCase() === className.toLowerCase()
    );
    const isNewClass = !matchedClass && Boolean(className);
    if (isNewClass) {
      newClassesSet.add(className);
    }

    // Duplicate detection logic
    let isDuplicate = false;

    // 1. Check duplicate by student number / national ID in app database
    if (studentNumber) {
      const dbMatchByNumber = existingStudents.some(
        (s) => s.nationalId && s.nationalId.trim() === studentNumber
      );
      if (dbMatchByNumber) {
        isDuplicate = true;
        warnings.push(`رقم الطالب (${studentNumber}) موجود مسبقاً في النظام`);
      }
    }

    // 2. Check duplicate by Name + Class in app database
    if (!isDuplicate && name && className) {
      const dbMatchByName = existingStudents.some((s) => {
        const cls = existingClasses.find((c) => c.id === s.classId);
        const stClsName = cls?.name || '';
        return (
          s.name.trim().toLowerCase() === name.toLowerCase() &&
          stClsName.trim().toLowerCase() === className.toLowerCase()
        );
      });
      if (dbMatchByName) {
        isDuplicate = true;
        warnings.push(`الطالب (${name}) مسجل مسبقاً بنفس الفصل (${className})`);
      }
    }

    // 3. Check duplicate within the uploaded file itself
    const fileKeyNameCls = `${name.toLowerCase()}___${className.toLowerCase()}`;
    if (studentNumber && seenInFileNumbers.has(studentNumber)) {
      isDuplicate = true;
      warnings.push(`رقم الطالب (${studentNumber}) مكرر داخل هذا الملف`);
    } else if (seenInFileKeys.has(fileKeyNameCls)) {
      isDuplicate = true;
      warnings.push(`اسم الطالب مع الفصل مكرر داخل هذا الملف`);
    }

    if (studentNumber) seenInFileNumbers.add(studentNumber);
    if (name && className) seenInFileKeys.add(fileKeyNameCls);

    let status: 'valid' | 'duplicate' | 'error' = 'valid';
    if (errors.length > 0) {
      status = 'error';
    } else if (isDuplicate) {
      status = 'duplicate';
    }

    parsedRows.push({
      rowIndex: i + 1,
      studentNumber,
      name,
      className,
      height,
      weight,
      medicalNotes,
      status,
      isNewClass,
      errors,
      warnings,
    });
  }

  const validRows = parsedRows.filter((r) => r.status === 'valid');
  const duplicateRows = parsedRows.filter((r) => r.status === 'duplicate');
  const errorRows = parsedRows.filter((r) => r.status === 'error');

  return {
    rows: parsedRows,
    totalCount: parsedRows.length,
    validCount: validRows.length,
    duplicateCount: duplicateRows.length,
    errorCount: errorRows.length,
    newClassesCount: newClassesSet.size,
    newClassNames: Array.from(newClassesSet),
  };
};

export const parseStudentsFile = async (
  file: File,
  defaultClassId: string,
  existingClasses: ClassItem[]
): Promise<{
  newStudents: Omit<Student, 'id'>[];
  newClassesToCreate: Omit<ClassItem, 'id'>[];
  mappedClassIds: Map<string, string>;
}> => {
  let rows: any[] = [];
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
    rows = parsed.data as any[];
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
  }

  if (!rows || rows.length === 0) {
    throw new Error('الملف فارغ أو غير صالح');
  }

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

    if (/^\d+$/.test(rawClassName) && rawClassName.length >= 3 && !studentNumber) {
      studentNumber = rawClassName;
      rawClassName = '';
    }

    let targetClassId = defaultClassId;

    if (rawClassName) {
      const matched = existingClasses.find(
        (c) => c.name.trim().toLowerCase() === rawClassName.toLowerCase()
      );

      if (matched) {
        targetClassId = matched.id;
        mappedClassIds.set(rawClassName, matched.id);
      } else {
        if (!newClassesMap.has(rawClassName)) {
          newClassesMap.set(rawClassName, {
            name: rawClassName,
          });
        }
        targetClassId = `NEW:${rawClassName}`;
      }
    }

    newStudents.push({
      name,
      classId: targetClassId,
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

