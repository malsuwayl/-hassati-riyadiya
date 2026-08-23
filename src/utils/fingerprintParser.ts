import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Student, ClassItem, FingerprintLogRecord } from '../types';

export interface FingerprintParseResult {
  logs: FingerprintLogRecord[];
  totalLogs: number;
  matchedCount: number;
  unmatchedCount: number;
  presentCount: number;
  lateCount: number;
  detectedDate: string;
  detectedClasses: string[];
}

/**
 * Standardize date to YYYY-MM-DD
 */
function standardizeDate(rawDateStr: string): string {
  if (!rawDateStr) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  // Check if standard ISO YYYY-MM-DD
  const isoMatch = rawDateStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(isoMatch[2]).padStart(2, '0');
    const d = String(isoMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Check if DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = rawDateStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, '0');
    const m = String(dmyMatch[2]).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  const parsed = new Date(rawDateStr);
  if (!isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }

  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Standardize time to HH:mm:ss
 */
function standardizeTime(rawTimeStr: string): string {
  if (!rawTimeStr) return '07:15:00';
  const match = rawTimeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const h = String(match[1]).padStart(2, '0');
    const m = String(match[2]).padStart(2, '0');
    const s = match[3] ? String(match[3]).padStart(2, '0') : '00';
    return `${h}:${m}:${s}`;
  }
  return rawTimeStr.trim();
}

/**
 * Parses ZKTeco raw DAT or TXT attendance log string
 * Formats supported:
 * 1. Standard ZK: "101\t2026-08-21 07:15:32\t1\t1\t0\t0"
 * 2. Space separated: "101 2026-08-21 07:15:32 1 1"
 * 3. Comma separated: "101,2026-08-21 07:15:32,1,0"
 */
function parseZKTecoRawText(text: string): Array<{ rawId: string; timestamp: string }> {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const results: Array<{ rawId: string; timestamp: string }> = [];

  for (const line of lines) {
    // Check if header line
    const lower = line.toLowerCase();
    if (lower.includes('user') || lower.includes('userid') || lower.includes('time') || lower.includes('pin')) {
      continue;
    }

    // Try tab, comma, or space splits
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map((p) => p.trim());
    } else if (line.includes(',')) {
      parts = line.split(',').map((p) => p.trim());
    } else {
      parts = line.split(/\s+/).map((p) => p.trim());
    }

    if (parts.length >= 2) {
      const rawId = parts[0];
      // Timestamp could be parts[1] or parts[1] + ' ' + parts[2] if space split split the date and time
      let timestamp = '';
      if (parts[1].includes(':') && (parts[1].includes('-') || parts[1].includes('/'))) {
        timestamp = parts[1];
      } else if (parts.length >= 3 && (parts[1].includes('-') || parts[1].includes('/')) && parts[2].includes(':')) {
        timestamp = `${parts[1]} ${parts[2]}`;
      } else {
        timestamp = parts[1];
      }

      if (rawId && timestamp) {
        results.push({ rawId, timestamp });
      }
    }
  }

  return results;
}

/**
 * Match a raw log record against existing students
 */
function matchStudent(
  rawId: string,
  rawName: string | undefined,
  students: Student[],
  classes: ClassItem[]
): { student?: Student; className?: string; matchType: FingerprintLogRecord['matchType'] } {
  const cleanId = String(rawId || '').trim();

  // 1. Match by fingerprintId
  if (cleanId) {
    const matchByFp = students.find(
      (s) => s.fingerprintId && String(s.fingerprintId).trim() === cleanId
    );
    if (matchByFp) {
      const cls = classes.find((c) => c.id === matchByFp.classId);
      return { student: matchByFp, className: cls?.name, matchType: 'fingerprint_id' };
    }
  }

  // 2. Match by nationalId / Student ID
  if (cleanId) {
    const matchById = students.find(
      (s) => s.nationalId && String(s.nationalId).trim() === cleanId
    );
    if (matchById) {
      const cls = classes.find((c) => c.id === matchById.classId);
      return { student: matchById, className: cls?.name, matchType: 'national_id' };
    }
  }

  // 3. Match by numeric ID prefix or exact student id match
  if (cleanId) {
    const matchByDirect = students.find((s) => s.id === cleanId);
    if (matchByDirect) {
      const cls = classes.find((c) => c.id === matchByDirect.classId);
      return { student: matchByDirect, className: cls?.name, matchType: 'fingerprint_id' };
    }
  }

  // 4. Match by Name if provided
  if (rawName && rawName.trim()) {
    const cleanName = rawName.trim().toLowerCase();
    const matchByName = students.find((s) => s.name.trim().toLowerCase() === cleanName);
    if (matchByName) {
      const cls = classes.find((c) => c.id === matchByName.classId);
      return { student: matchByName, className: cls?.name, matchType: 'name' };
    }
  }

  return { matchType: 'unmatched' };
}

/**
 * Main parser for fingerprint files (.dat, .txt, .csv, .xlsx, .xls)
 */
export async function parseFingerprintFile(
  file: File,
  students: Student[],
  classes: ClassItem[],
  classStartTime: string = '07:15',
  graceMinutes: number = 10
): Promise<FingerprintParseResult> {
  const fileName = file.name.toLowerCase();
  let rawEntries: Array<{ rawId: string; timestamp: string; rawName?: string }> = [];

  if (fileName.endsWith('.dat') || fileName.endsWith('.txt') || fileName.endsWith('.log')) {
    const text = await file.text();
    rawEntries = parseZKTecoRawText(text);
  } else if (fileName.endsWith('.csv') || fileName.endsWith('.tsv')) {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
    const rows = parsed.data as any[];

    if (rows && rows.length > 0) {
      // Find column indices
      let colId = 0;
      let colTime = 1;
      let colName = -1;
      let startIdx = 0;

      const headerRow = (rows[0] || []).map((c: any) => String(c || '').toLowerCase().trim());
      headerRow.forEach((c: string, idx: number) => {
        if (c.includes('id') || c.includes('pin') || c.includes('user') || c.includes('بصمة') || c.includes('رقم')) {
          colId = idx;
        }
        if (c.includes('time') || c.includes('date') || c.includes('وقت') || c.includes('تاريخ')) {
          colTime = idx;
        }
        if (c.includes('name') || c.includes('اسم') || c.includes('طالب')) {
          colName = idx;
        }
      });

      if (colName !== -1 || colId !== 0 || headerRow.some((c: string) => isNaN(Number(c)) && c.length > 2)) {
        startIdx = 1;
      }

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row) || row.length < 2) continue;
        const rawId = String(row[colId] ?? '').trim();
        const rawTime = String(row[colTime] ?? '').trim();
        const rawName = colName !== -1 ? String(row[colName] ?? '').trim() : undefined;
        if (rawId) {
          rawEntries.push({ rawId, timestamp: rawTime || new Date().toISOString(), rawName });
        }
      }
    }
  } else {
    // Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[];

    if (rows && rows.length > 0) {
      let colId = 0;
      let colTime = 1;
      let colName = -1;
      let startIdx = 0;

      const headerRow = (rows[0] || []).map((c: any) => String(c || '').toLowerCase().trim());
      headerRow.forEach((c: string, idx: number) => {
        if (c.includes('id') || c.includes('pin') || c.includes('user') || c.includes('بصمة') || c.includes('رقم')) {
          colId = idx;
        }
        if (c.includes('time') || c.includes('date') || c.includes('وقت') || c.includes('تاريخ')) {
          colTime = idx;
        }
        if (c.includes('name') || c.includes('اسم') || c.includes('طالب')) {
          colName = idx;
        }
      });

      if (headerRow.length > 0) {
        startIdx = 1;
      }

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row)) continue;
        const rawId = String(row[colId] ?? '').trim();
        const rawTime = String(row[colTime] ?? '').trim();
        const rawName = colName !== -1 ? String(row[colName] ?? '').trim() : undefined;
        if (rawId) {
          rawEntries.push({ rawId, timestamp: rawTime || new Date().toISOString(), rawName });
        }
      }
    }
  }

  if (rawEntries.length === 0) {
    throw new Error('لم يتم العثور على سجلات بصمة صالحة في الملف المرفوع');
  }

  // Calculate late threshold in minutes from midnight
  const [startH, startM] = (classStartTime || '07:15').split(':').map((n) => parseInt(n, 10) || 0);
  const startTotalMinutes = startH * 60 + startM;
  const lateThresholdMinutes = startTotalMinutes + graceMinutes;

  const logs: FingerprintLogRecord[] = [];
  const detectedClassesSet = new Set<string>();
  let matchedCount = 0;
  let unmatchedCount = 0;
  let presentCount = 0;
  let lateCount = 0;
  let detectedDate = '';

  // Process raw entries
  for (const entry of rawEntries) {
    let datePart = '';
    let timePart = '';

    if (entry.timestamp.includes(' ') || entry.timestamp.includes('T')) {
      const parts = entry.timestamp.replace('T', ' ').split(' ');
      datePart = standardizeDate(parts[0]);
      timePart = standardizeTime(parts[1] || '07:15:00');
    } else if (entry.timestamp.includes(':')) {
      datePart = standardizeDate('');
      timePart = standardizeTime(entry.timestamp);
    } else {
      datePart = standardizeDate(entry.timestamp);
      timePart = '07:15:00';
    }

    if (!detectedDate) {
      detectedDate = datePart;
    }

    // Determine status (present vs late)
    const [h, m] = timePart.split(':').map((n) => parseInt(n, 10) || 0);
    const logTotalMinutes = h * 60 + m;
    const status: 'present' | 'late' = logTotalMinutes > lateThresholdMinutes ? 'late' : 'present';

    const match = matchStudent(entry.rawId, entry.rawName, students, classes);

    if (match.student) {
      matchedCount++;
      if (status === 'present') presentCount++;
      else lateCount++;

      if (match.className) {
        detectedClassesSet.add(match.className);
      }

      logs.push({
        rawId: entry.rawId,
        timestamp: `${datePart} ${timePart}`,
        date: datePart,
        time: timePart,
        studentId: match.student.id,
        studentName: match.student.name,
        className: match.className,
        status,
        matchType: match.matchType,
      });
    } else {
      unmatchedCount++;
      logs.push({
        rawId: entry.rawId,
        timestamp: `${datePart} ${timePart}`,
        date: datePart,
        time: timePart,
        studentName: entry.rawName || `طالب غير مسجل (معرف #${entry.rawId})`,
        status,
        matchType: 'unmatched',
      });
    }
  }

  return {
    logs,
    totalLogs: logs.length,
    matchedCount,
    unmatchedCount,
    presentCount,
    lateCount,
    detectedDate: detectedDate || new Date().toISOString().slice(0, 10),
    detectedClasses: Array.from(detectedClassesSet),
  };
}

/**
 * Generate simulated demo fingerprint logs for instant trial
 */
export function generateDemoFingerprintLogs(
  students: Student[],
  classes: ClassItem[],
  targetDate: string
): FingerprintParseResult {
  const sampleStudents = students.slice(0, Math.min(15, students.length));
  const logs: FingerprintLogRecord[] = [];
  const detectedClassesSet = new Set<string>();

  sampleStudents.forEach((st, idx) => {
    const cls = classes.find((c) => c.id === st.classId);
    if (cls) detectedClassesSet.add(cls.name);

    // Randomize time around 07:05 to 07:35
    const minute = 5 + idx * 2;
    const hour = 7;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:15`;
    const isLate = minute > 20;

    logs.push({
      rawId: st.fingerprintId || st.nationalId || String(100 + idx + 1),
      timestamp: `${targetDate} ${timeStr}`,
      date: targetDate,
      time: timeStr,
      studentId: st.id,
      studentName: st.name,
      className: cls?.name || '',
      status: isLate ? 'late' : 'present',
      matchType: 'fingerprint_id',
    });
  });

  return {
    logs,
    totalLogs: logs.length,
    matchedCount: logs.length,
    unmatchedCount: 0,
    presentCount: logs.filter((l) => l.status === 'present').length,
    lateCount: logs.filter((l) => l.status === 'late').length,
    detectedDate: targetDate,
    detectedClasses: Array.from(detectedClassesSet),
  };
}

/**
 * Download standard sample ZKTeco .dat file
 */
export function downloadSampleFingerprintDAT(targetDate: string = '2026-08-21') {
  const lines = [
    `101\t${targetDate} 07:08:12\t1\t1\t0\t0`,
    `102\t${targetDate} 07:11:45\t1\t1\t0\t0`,
    `103\t${targetDate} 07:14:20\t1\t1\t0\t0`,
    `104\t${targetDate} 07:22:30\t1\t1\t0\t0`,
    `105\t${targetDate} 07:25:10\t1\t1\t0\t0`,
    `1098765432\t${targetDate} 07:12:05\t1\t1\t0\t0`,
  ];

  const content = lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `1_attlog.dat`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download sample Excel fingerprint log
 */
export function downloadSampleFingerprintExcel(targetDate: string = '2026-08-21') {
  const sampleData = [
    {
      'رقم البصمة / User PIN': '101',
      'اسم الطالب': 'عبدالله بن محمد العتيبي',
      'تاريخ ووقت البصمة': `${targetDate} 07:08:15`,
      'حالة الحركة': 'دخول الصالة',
      'الجهاز': 'ZKTeco K40 Main',
    },
    {
      'رقم البصمة / User PIN': '102',
      'اسم الطالب': 'سعود بن عبدالعزيز الدوسري',
      'تاريخ ووقت البصمة': `${targetDate} 07:12:30`,
      'حالة الحركة': 'دخول الصالة',
      'الجهاز': 'ZKTeco K40 Main',
    },
    {
      'رقم البصمة / User PIN': '103',
      'اسم الطالب': 'فهد بن خالد القحطاني',
      'تاريخ ووقت البصمة': `${targetDate} 07:14:50`,
      'حالة الحركة': 'دخول الصالة',
      'الجهاز': 'ZKTeco K40 Main',
    },
    {
      'رقم البصمة / User PIN': '104',
      'اسم الطالب': 'سلمان بن حمد الشمري',
      'تاريخ ووقت البصمة': `${targetDate} 07:24:10`,
      'حالة الحركة': 'دخول الصالة',
      'الجهاز': 'ZKTeco K40 Main',
    },
    {
      'رقم البصمة / User PIN': '105',
      'اسم الطالب': 'عمر بن فاروق الغامدي',
      'تاريخ ووقت البصمة': `${targetDate} 07:28:40`,
      'حالة الحركة': 'دخول الصالة',
      'الجهاز': 'ZKTeco K40 Main',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 28 },
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'سجلات جهاز البصمة');
  XLSX.writeFile(wb, `سجل_بصمات_الطلاب_${targetDate}.xlsx`);
}

/**
 * Download sample CSV fingerprint log
 */
export function downloadSampleFingerprintCSV(targetDate: string = '2026-08-21') {
  const content =
    '\uFEFF' +
    'User PIN,Student Name,DateTime,Device Name\n' +
    `101,عبدالله بن محمد العتيبي,${targetDate} 07:08:15,Gym Scanner\n` +
    `102,سعود بن عبدالعزيز الدوسري,${targetDate} 07:12:30,Gym Scanner\n` +
    `103,فهد بن خالد القحطاني,${targetDate} 07:14:50,Gym Scanner\n` +
    `104,سلمان بن حمد الشمري,${targetDate} 07:24:10,Gym Scanner\n` +
    `105,عمر بن فاروق الغامدي,${targetDate} 07:28:40,Gym Scanner\n`;

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `سجل_بصمة_${targetDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
