import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ClassItem,
  Student,
  DailyLogRecord,
  TeacherSettings,
  MeasurementItem,
  IncentiveRecord,
  AssessmentItem,
  AttendanceCheckItem,
} from '../types';
import {
  evaluateMeasurementValue,
  calculateStudentFitnessSummary,
} from './measurementUtils';

/**
 * Core utility to render an HTML container into a crisp, multi-page PDF document
 */
export const renderContainerToPDF = async (
  container: HTMLElement,
  fileName: string
) => {
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.direction = 'rtl';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.color = '#18181b';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';

  document.body.appendChild(container);

  try {
    // Small delay to allow layout calculation
    await new Promise((res) => setTimeout(res, 250));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1000,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        // Remove all external stylesheets & Tailwind style blocks from clonedDoc to prevent html2canvas parsing oklab/oklch colors
        const styleAndLinks = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        styleAndLinks.forEach((el) => el.remove());

        // Add a clean basic style reset for the PDF container
        const baseStyle = clonedDoc.createElement('style');
        baseStyle.textContent = `
          * {
            box-sizing: border-box;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
        `;
        clonedDoc.head.appendChild(baseStyle);

        // Sanitize any remaining inline styles on elements that might contain oklab/oklch
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          if (el instanceof HTMLElement && el.style.cssText) {
            if (el.style.cssText.includes('oklab') || el.style.cssText.includes('oklch')) {
              el.style.cssText = el.style.cssText
                .replace(/oklab\([^)]*\)/gi, '#000000')
                .replace(/oklch\([^)]*\)/gi, '#000000');
            }
          }
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 4) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  } catch (err) {
    console.error('PDF Export Error:', err);
    throw err;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Common Header HTML generator for official physical education reports
 */
const buildReportHeaderHTML = (
  title: string,
  subtitle: string,
  className: string,
  settings: TeacherSettings
) => {
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <div style="border-bottom: 3px solid #065f46; padding-bottom: 16px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="text-align: right;">
          <h2 style="font-size: 11px; font-weight: 800; color: #047857; margin: 0 0 2px 0; text-transform: uppercase;">المملكة العربية السعودية - وزارة التعليم</h2>
          <h1 style="font-size: 20px; font-weight: 900; color: #065f46; margin: 0;">${settings.schoolName || 'مدرسة التربية البدنية'}</h1>
          <p style="font-size: 13px; color: #047857; margin: 4px 0 0 0; font-weight: 800;">سجل مادة التربية البدنية والدفاع عن النفس</p>
        </div>
        
        <div style="text-align: center; background: #f0fdf4; border: 2px dashed #a7f3d0; padding: 8px 16px; border-radius: 12px;">
          <h2 style="font-size: 16px; font-weight: 900; color: #065f46; margin: 0;">${title}</h2>
          <p style="font-size: 11px; font-weight: 800; color: #047857; margin: 2px 0 0 0;">${subtitle}</p>
        </div>

        <div style="text-align: left; font-size: 11px; font-weight: 800; color: #3f3f46; line-height: 1.6;">
          <p style="margin: 0;"><strong>معلم المادة:</strong> ${settings.teacherName || 'معلم التربية البدنية'}</p>
          <p style="margin: 0;"><strong>الفصل الدراسي:</strong> <span style="color: #065f46; font-weight: 900;">${className}</span></p>
          <p style="margin: 0;"><strong>تاريخ التقرير:</strong> ${currentDate}</p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Common Footer HTML generator with signature line for official school records
 */
const buildReportFooterHTML = (teacherName: string) => {
  return `
    <div style="margin-top: 32px; padding-top: 16px; border-top: 2px dashed #e4e4e7; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; font-weight: 800; color: #3f3f46;">
      <div style="text-align: center; width: 30%;">
        <p style="margin: 0 0 40px 0;">معلم التربية البدنية</p>
        <p style="margin: 0; color: #065f46; font-size: 12px; font-weight: 900;">أ. ${teacherName || '__________________'}</p>
      </div>

      <div style="text-align: center; width: 30%;">
        <p style="margin: 0 0 40px 0;">ختم المدرسة</p>
        <div style="width: 70px; height: 70px; border: 2px dashed #cbd5e1; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 9px;">
          [ختـم]
        </div>
      </div>

      <div style="text-align: center; width: 30%;">
        <p style="margin: 0 0 40px 0;">مدير المدرسة</p>
        <p style="margin: 0;">التوقيع: __________________</p>
      </div>
    </div>
  `;
};

/**
 * 1. ATTENDANCE & UNIFORM PDF REPORT (تقرير الحضور والغياب والزي الرياضي)
 */
export const generateAttendancePDFReport = async (
  classItem: ClassItem,
  classStudents: Student[],
  dailyLogs: DailyLogRecord[],
  checkItems: AttendanceCheckItem[],
  settings: TeacherSettings
) => {
  const container = document.createElement('div');
  container.style.padding = '32px';

  let totalLogs = 0;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let uniformViolations = 0;

  const rows = classStudents.map((student, idx) => {
    const stLogs = dailyLogs.filter((l) => l.studentId === student.id);
    totalLogs += stLogs.length;

    const stPresent = stLogs.filter((l) => l.attendance === 'present').length;
    const stAbsent = stLogs.filter((l) => l.attendance === 'absent').length;
    const stLate = stLogs.filter((l) => l.attendance === 'late').length;
    const stViolations = stLogs.filter((l) => l.uniform === false).length;

    presentCount += stPresent;
    absentCount += stAbsent;
    lateCount += stLate;
    uniformViolations += stViolations;

    // Check custom check items ratio
    let totalChecksPossible = stLogs.length * checkItems.length;
    let totalChecksDone = 0;

    stLogs.forEach((log) => {
      if (log.customChecks) {
        Object.values(log.customChecks).forEach((v) => {
          if (v) totalChecksDone++;
        });
      }
    });

    const checkCompliance =
      totalChecksPossible > 0
        ? Math.round((totalChecksDone / totalChecksPossible) * 100)
        : 100;

    const totalDays = stLogs.length || 1;
    const attendancePct = Math.round((stPresent / totalDays) * 100);

    return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; font-weight: 700; font-size: 11px;">
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: #71717a;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: right; font-weight: 900; color: #18181b;">${student.name}</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: #047857; font-weight: 900;">${stPresent} يوم</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: ${stAbsent > 0 ? '#b91c1c' : '#71717a'};">${stAbsent} يوم</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: ${stLate > 0 ? '#d97706' : '#71717a'};">${stLate} يوم</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: ${stViolations > 0 ? '#6b21a8' : '#71717a'}; font-weight: 800;">${stViolations} مخالفات</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: #0284c7; font-weight: 800;">${checkCompliance}%</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 900; ${
            attendancePct >= 90
              ? 'background: #dcfce7; color: #166534;'
              : attendancePct >= 75
              ? 'background: #fef9c3; color: #854d0e;'
              : 'background: #fee2e2; color: #991b1b;'
          }">
            ${attendancePct >= 90 ? 'ممتاز' : attendancePct >= 75 ? 'مقبول' : 'يحتاج متابعة'}
          </span>
        </td>
      </tr>
    `;
  });

  const overallAttendanceRate =
    totalLogs > 0 ? Math.round((presentCount / totalLogs) * 100) : 100;

  const html = `
    ${buildReportHeaderHTML(
      'تقرير الحضور والمواظبة والزي الرياضي',
      `كشف تحضير ومواظبة فصل: ${classItem.name}`,
      classItem.name,
      settings
    )}

    <!-- KPI Summary Row -->
    <div style="display: flex; gap: 10px; margin-bottom: 20px; text-align: center;">
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #166534; display: block;">نسبة الحضور الكلية</span>
        <strong style="font-size: 18px; color: #065f46; font-weight: 900;">${overallAttendanceRate}%</strong>
      </div>
      <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #1e40af; display: block;">إجمالي الحضور</span>
        <strong style="font-size: 18px; color: #1d4ed8; font-weight: 900;">${presentCount}</strong>
      </div>
      <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #991b1b; display: block;">إجمالي الغياب</span>
        <strong style="font-size: 18px; color: #dc2626; font-weight: 900;">${absentCount}</strong>
      </div>
      <div style="flex: 1; background: #faf5ff; border: 1px solid #e9d5ff; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #6b21a8; display: block;">مخالفات الزي الرياضي</span>
        <strong style="font-size: 18px; color: #7e22ce; font-weight: 900;">${uniformViolations}</strong>
      </div>
    </div>

    <!-- Main Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #065f46; color: #ffffff; font-weight: 900; font-size: 11px;">
          <th style="padding: 10px; border: 1px solid #047857; width: 35px; text-align: center;">#</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: right;">اسم الطالب</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">الحضور</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">الغياب</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">التأخر</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">مخالفات الزي</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">التزام البنود %</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">التقييم</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('')}
      </tbody>
    </table>

    ${buildReportFooterHTML(settings.teacherName)}
  `;

  container.innerHTML = html;
  await renderContainerToPDF(container, `تقرير_حضور_الفصل_${classItem.name}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 2. PHYSICAL MEASUREMENTS PDF REPORT (تقرير القياسات اللياقية والبدنية)
 */
export const generateMeasurementsPDFReport = async (
  classItem: ClassItem,
  classStudents: Student[],
  measurementItems: MeasurementItem[],
  measurementValues: Record<string, Record<string, string | number>>,
  settings: TeacherSettings
) => {
  const container = document.createElement('div');
  container.style.padding = '32px';

  let totalFitnessPointsSum = 0;
  let excellentCount = 0;

  const studentSummaries = classStudents.map((st) => {
    const sum = calculateStudentFitnessSummary(st.id, measurementItems, measurementValues);
    totalFitnessPointsSum += sum.totalScore;
    if (sum.ratingLevel === 'ممتاز') excellentCount++;

    return {
      student: st,
      summary: sum,
    };
  });

  const classAvgScore =
    classStudents.length > 0
      ? (totalFitnessPointsSum / classStudents.length).toFixed(1)
      : '0';

  // Table Headers for Measurement Items
  const itemHeadersHTML = measurementItems
    .map(
      (item) => `
    <th style="padding: 8px; border: 1px solid #047857; text-align: center; font-size: 10px;">
      ${item.name}<br/>
      <span style="font-weight: 600; font-size: 9px; opacity: 0.9;">(${item.unit})</span>
    </th>
  `
    )
    .join('');

  const rows = studentSummaries.map(({ student, summary }, idx) => {
    const itemValuesHTML = measurementItems
      .map((item) => {
        const val = (measurementValues[student.id] || {})[item.id];
        const evalRes = evaluateMeasurementValue(val, item);
        const displayVal = val !== undefined && val !== '' ? val : '-';

        return `
        <td style="padding: 6px; border: 1px solid #e4e4e7; text-align: center; font-size: 10px;">
          <div style="font-weight: 900; color: #18181b;">${displayVal}</div>
          ${
            evalRes
              ? `<span style="font-size: 8px; font-weight: 800; color: #047857; display: block;">${evalRes.levelName}</span>`
              : ''
          }
        </td>
      `;
      })
      .join('');

    return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; font-weight: 700; font-size: 11px;">
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: #71717a;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: right; font-weight: 900; color: #18181b;">${student.name}</td>
        ${itemValuesHTML}
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; font-weight: 900; color: #047857;">${summary.totalScore}</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 900; ${
            summary.ratingLevel === 'ممتاز'
              ? 'background: #dcfce7; color: #166534;'
              : summary.ratingLevel === 'جيد جداً'
              ? 'background: #e0f2fe; color: #0369a1;'
              : summary.ratingLevel === 'جيد'
              ? 'background: #fef9c3; color: #854d0e;'
              : 'background: #fee2e2; color: #991b1b;'
          }">
            ${summary.ratingLevel || 'غير مقيم'}
          </span>
        </td>
      </tr>
    `;
  });

  const html = `
    ${buildReportHeaderHTML(
      'تقرير اللياقة البدنية والقياسات الجسمية',
      `قياسات واختبارات عناصر اللياقة لفصل: ${classItem.name}`,
      classItem.name,
      settings
    )}

    <!-- KPI Summary Row -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px; text-align: center;">
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #166534; display: block;">متوسط نقاط اللياقة بالفصل</span>
        <strong style="font-size: 20px; color: #065f46; font-weight: 900;">${classAvgScore} نقطة</strong>
      </div>
      <div style="flex: 1; background: #fefce8; border: 1px solid #fef08a; padding: 12px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #854d0e; display: block;">عدد الطلاب بمستوى ممتاز 🏆</span>
        <strong style="font-size: 20px; color: #ca8a04; font-weight: 900;">${excellentCount} طالب</strong>
      </div>
      <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #1e40af; display: block;">عدد عناصر القياس المطبقة</span>
        <strong style="font-size: 20px; color: #2563eb; font-weight: 900;">${measurementItems.length} عناصر</strong>
      </div>
    </div>

    <!-- Main Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #065f46; color: #ffffff; font-weight: 900; font-size: 11px;">
          <th style="padding: 8px; border: 1px solid #047857; width: 30px; text-align: center;">#</th>
          <th style="padding: 8px; border: 1px solid #047857; text-align: right;">اسم الطالب</th>
          ${itemHeadersHTML}
          <th style="padding: 8px; border: 1px solid #047857; text-align: center; width: 60px;">المجموع</th>
          <th style="padding: 8px; border: 1px solid #047857; text-align: center; width: 85px;">التصنيف</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('')}
      </tbody>
    </table>

    ${buildReportFooterHTML(settings.teacherName)}
  `;

  container.innerHTML = html;
  await renderContainerToPDF(container, `تقرير_القياسات_البدنية_${classItem.name}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 3. INCENTIVES & VIOLATIONS PDF REPORT (تقرير بنك التحفيز والمخالفات)
 */
export const generateIncentivesPDFReport = async (
  classItem: ClassItem,
  classStudents: Student[],
  incentiveRecords: IncentiveRecord[],
  settings: TeacherSettings
) => {
  const container = document.createElement('div');
  container.style.padding = '32px';

  let totalPositives = 0;
  let totalNegatives = 0;
  let netClassPoints = 0;

  const rows = classStudents.map((student, idx) => {
    const stRecords = incentiveRecords.filter((r) => r.studentId === student.id);
    let stPos = 0;
    let stNeg = 0;
    let stPoints = 0;
    const notes: string[] = [];

    stRecords.forEach((rec) => {
      stPoints += rec.points;
      if (rec.type === 'positive') stPos++;
      else stNeg++;

      if (rec.title) notes.push(rec.title);
    });

    totalPositives += stPos;
    totalNegatives += stNeg;
    netClassPoints += stPoints;

    const recentNotesText = notes.slice(-2).join(' | ') || 'لا يوجد ملاحظات مسجلة';

    return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; font-weight: 700; font-size: 11px;">
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: #71717a;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: right; font-weight: 900; color: #18181b;">${student.name}</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: #047857; font-weight: 900;">+${stPos} ⭐️</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: ${stNeg > 0 ? '#b91c1c' : '#71717a'}; font-weight: 900;">-${stNeg} ⚠️</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center;">
          <span style="font-weight: 900; font-size: 13px; color: ${stPoints >= 0 ? '#047857' : '#b91c1c'};">
            ${stPoints > 0 ? `+${stPoints}` : stPoints} نقطة
          </span>
        </td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: right; font-size: 10px; color: #52525b; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${recentNotesText}
        </td>
      </tr>
    `;
  });

  const html = `
    ${buildReportHeaderHTML(
      'تقرير بنك التحفيز والسلوك والمخالفات',
      `كشف رصيد التحفيز والتنبيهات لفصل: ${classItem.name}`,
      classItem.name,
      settings
    )}

    <!-- KPI Summary Row -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px; text-align: center;">
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #166534; display: block;">مجموع نقاط التحفيز الإيجابية ⭐️</span>
        <strong style="font-size: 20px; color: #065f46; font-weight: 900;">+${totalPositives} مكافأة</strong>
      </div>
      <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #991b1b; display: block;">إجمالي المخالفات المرصدة ⚠️</span>
        <strong style="font-size: 20px; color: #dc2626; font-weight: 900;">-${totalNegatives} تنبيهات</strong>
      </div>
      <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #1e40af; display: block;">صافي النقاط الكلية للفصل</span>
        <strong style="font-size: 20px; color: #2563eb; font-weight: 900;">${netClassPoints} نقطة</strong>
      </div>
    </div>

    <!-- Main Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #065f46; color: #ffffff; font-weight: 900; font-size: 11px;">
          <th style="padding: 10px; border: 1px solid #047857; width: 35px; text-align: center;">#</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: right;">اسم الطالب</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">المكافآت الإيجابية</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">التنبيهات والمخالفات</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">الرصيد الصافي</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: right;">أبرز الملاحظات والتعزيز</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('')}
      </tbody>
    </table>

    ${buildReportFooterHTML(settings.teacherName)}
  `;

  container.innerHTML = html;
  await renderContainerToPDF(container, `تقرير_تحفيز_ومخالفات_${classItem.name}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 4. MASTER COMPREHENSIVE PDF REPORT (التقرير الشامل الموحد لجميع سجلات الفصل)
 */
export const generateComprehensivePDFReport = async (
  classItem: ClassItem,
  classStudents: Student[],
  dailyLogs: DailyLogRecord[],
  measurementItems: MeasurementItem[],
  measurementValues: Record<string, Record<string, string | number>>,
  incentiveRecords: IncentiveRecord[],
  assessments: AssessmentItem[],
  grades: Record<string, Record<string, number>>,
  settings: TeacherSettings
) => {
  const container = document.createElement('div');
  container.style.padding = '32px';

  const rows = classStudents.map((student, idx) => {
    // Attendance
    const stLogs = dailyLogs.filter((l) => l.studentId === student.id);
    const stPresent = stLogs.filter((l) => l.attendance === 'present').length;
    const stAbsent = stLogs.filter((l) => l.attendance === 'absent').length;

    // Fitness
    const fitnessSum = calculateStudentFitnessSummary(
      student.id,
      measurementItems,
      measurementValues
    );

    // Incentives
    const stIncentives = incentiveRecords.filter((r) => r.studentId === student.id);
    const netPoints = stIncentives.reduce((acc, curr) => acc + curr.points, 0);

    // Grades sum
    const stGrades = grades[student.id] || {};
    let gradesTotal = 0;
    assessments.forEach((ass) => {
      const val = stGrades[ass.id];
      if (val !== undefined && !isNaN(val)) gradesTotal += val;
    });

    return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; font-weight: 700; font-size: 11px;">
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: #71717a;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: right; font-weight: 900; color: #18181b;">${student.name}</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: #047857; font-weight: 800;">حضور: ${stPresent} | غياب: ${stAbsent}</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center;">
          <span style="font-weight: 900; color: #065f46;">${fitnessSum.totalScore} نقطة</span>
          <span style="font-size: 9px; color: #52525b; display: block;">(${fitnessSum.ratingLevel})</span>
        </td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; font-weight: 900; color: ${netPoints >= 0 ? '#047857' : '#b91c1c'};">
          ${netPoints > 0 ? `+${netPoints}` : netPoints}
        </td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; font-weight: 900; color: #7c3aed;">
          ${gradesTotal} درجة
        </td>
      </tr>
    `;
  });

  const html = `
    ${buildReportHeaderHTML(
      'التقرير الشامل والموحد لمادة التربية البدنية',
      `ملخص الأداء والحضور واللياقة والدرجات للفصل: ${classItem.name}`,
      classItem.name,
      settings
    )}

    <!-- Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #065f46; color: #ffffff; font-weight: 900; font-size: 11px;">
          <th style="padding: 10px; border: 1px solid #047857; width: 35px; text-align: center;">#</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: right;">اسم الطالب</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">سجل الحضور والغياب</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">مستوى اللياقة البدنية</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">نقاط بنك التحفيز</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center;">مجموع الدرجات الاكاديمية</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('')}
      </tbody>
    </table>

    ${buildReportFooterHTML(settings.teacherName)}
  `;

  container.innerHTML = html;
  await renderContainerToPDF(container, `التقرير_الشامل_الموحد_${classItem.name}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 5. INDIVIDUAL STUDENT COMPREHENSIVE PDF REPORT (تقرير الطالب الفردي الشامل)
 */
export const generateStudentIndividualPDFReport = async (
  student: Student,
  classItem: ClassItem | undefined,
  dailyLogs: DailyLogRecord[],
  measurementItems: MeasurementItem[],
  measurementValues: Record<string, Record<string, string | number>>,
  incentiveRecords: IncentiveRecord[],
  assessments: AssessmentItem[],
  grades: Record<string, Record<string, number>>,
  settings: TeacherSettings
) => {
  const container = document.createElement('div');
  container.style.padding = '32px';

  // 1. Attendance Metrics
  const stLogs = dailyLogs.filter((l) => l.studentId === student.id);
  const totalDays = stLogs.length || 1;
  const presentCount = stLogs.filter((l) => l.attendance === 'present').length;
  const absentCount = stLogs.filter((l) => l.attendance === 'absent').length;
  const lateCount = stLogs.filter((l) => l.attendance === 'late').length;
  const uniformViolations = stLogs.filter((l) => l.attendance === 'present' && l.uniform === false).length;
  const attendanceRate = Math.round((presentCount / totalDays) * 100);

  // 2. Fitness Metrics & BMI
  const stMeasVals = measurementValues[student.id] || {};
  const heightVal = parseFloat(String(stMeasVals['m-height'] || ''));
  const weightVal = parseFloat(String(stMeasVals['m-weight'] || ''));
  let bmiText = 'غير محدد';
  if (!isNaN(heightVal) && heightVal > 0 && !isNaN(weightVal) && weightVal > 0) {
    const bmiVal = (weightVal / ((heightVal / 100) * (heightVal / 100))).toFixed(1);
    bmiText = `${bmiVal} kg/m²`;
  }
  const fitnessSummary = calculateStudentFitnessSummary(student.id, measurementItems, measurementValues);

  // 3. Incentives
  const stIncentives = incentiveRecords.filter((r) => r.studentId === student.id);
  const positiveCount = stIncentives.filter((r) => r.type === 'positive').length;
  const negativeCount = stIncentives.filter((r) => r.type === 'negative').length;
  const netPoints = stIncentives.reduce((acc, curr) => acc + curr.points, 0);

  // 4. Academic Grades
  const stGrades = grades[student.id] || {};
  let gradesEarned = 0;
  let gradesMax = 0;
  assessments.forEach((ass) => {
    gradesMax += ass.maxScore;
    const sc = stGrades[ass.id];
    if (sc !== undefined && !isNaN(sc)) gradesEarned += sc;
  });

  // HTML Blocks for Tables
  // Physical Measurements Table Rows
  const measurementRows = measurementItems.map((item) => {
    const val = stMeasVals[item.id];
    const evalRes = evaluateMeasurementValue(val, item);
    const displayVal = val !== undefined && val !== '' ? `${val} ${item.unit}` : 'غير مقاس';
    return `
      <tr style="border-bottom: 1px solid #e4e4e7; font-size: 11px; font-weight: 700;">
        <td style="padding: 6px 8px; text-align: right; color: #18181b;">${item.name}</td>
        <td style="padding: 6px 8px; text-align: center; color: #047857; font-weight: 900;">${displayVal}</td>
        <td style="padding: 6px 8px; text-align: center;">
          <span style="padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 10px; ${
            evalRes?.levelName === 'ممتاز'
              ? 'background: #dcfce7; color: #15803d;'
              : evalRes?.levelName === 'جيد جداً'
              ? 'background: #e0f2fe; color: #0369a1;'
              : 'background: #f4f4f5; color: #52525b;'
          }">
            ${evalRes ? evalRes.levelName : 'طبيعي'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  // Assessment Grades Rows
  const gradesRows = assessments.map((ass) => {
    const sc = stGrades[ass.id];
    return `
      <tr style="border-bottom: 1px solid #e4e4e7; font-size: 11px; font-weight: 700;">
        <td style="padding: 6px 8px; text-align: right; color: #18181b;">${ass.name}</td>
        <td style="padding: 6px 8px; text-align: center; color: #71717a;">${ass.maxScore} درجة</td>
        <td style="padding: 6px 8px; text-align: center; font-weight: 900; color: #047857;">
          ${sc !== undefined ? `${sc} درجة` : 'غير مرصود'}
        </td>
      </tr>
    `;
  }).join('');

  // Recent Incentives History
  const recentIncentivesHTML = stIncentives.slice(-5).map((r) => `
    <div style="padding: 6px 10px; border-radius: 6px; margin-bottom: 4px; font-size: 10px; font-weight: 800; display: flex; justify-content: space-between; ${
      r.type === 'positive' ? 'background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534;' : 'background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;'
    }">
      <span>${r.title}</span>
      <span>${r.points > 0 ? `+${r.points}` : r.points} نقطة (${r.date})</span>
    </div>
  `).join('');

  const className = classItem ? classItem.name : 'الفصل الدراسي';

  const html = `
    ${buildReportHeaderHTML(
      'تقرير الأداء الفردي للطالب',
      `السجل الشامل للطالب: ${student.name}`,
      className,
      settings
    )}

    <!-- Student Bio Card -->
    <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h3 style="margin: 0; font-size: 18px; font-weight: 900; color: #0f172a;">${student.name}</h3>
        <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 800; color: #64748b;">
          الفصل: <strong style="color: #047857;">${className}</strong> | الرقم/المعرف: ${student.id.slice(0, 8)}
        </p>
      </div>

      <div style="text-align: left; font-size: 11px; font-weight: 800; color: #334155;">
        <span style="background: #047857; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 900;">
          المستوى البدني: ${fitnessSummary.ratingLevel || 'جيد جداً'}
        </span>
      </div>
    </div>

    <!-- KPI Metrics -->
    <div style="display: flex; gap: 10px; margin-bottom: 20px; text-align: center;">
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #166534; display: block;">نسبة الحضور</span>
        <strong style="font-size: 16px; color: #065f46; font-weight: 900;">${attendanceRate}% (${presentCount} يوم)</strong>
      </div>
      <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #1e40af; display: block;">مجموع اللياقة البدنية</span>
        <strong style="font-size: 16px; color: #1d4ed8; font-weight: 900;">${fitnessSummary.totalScore} نقطة</strong>
      </div>
      <div style="flex: 1; background: #fefce8; border: 1px solid #fef08a; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #854d0e; display: block;">رصيد التحفيز</span>
        <strong style="font-size: 16px; color: #ca8a04; font-weight: 900;">${netPoints > 0 ? `+${netPoints}` : netPoints} نقطة</strong>
      </div>
      <div style="flex: 1; background: #faf5ff; border: 1px solid #e9d5ff; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #6b21a8; display: block;">الدرجات العلمية</span>
        <strong style="font-size: 16px; color: #7e22ce; font-weight: 900;">${gradesEarned} / ${gradesMax}</strong>
      </div>
    </div>

    <!-- 2 Column Section: Measurements & Grades -->
    <div style="display: flex; gap: 16px; margin-bottom: 20px;">
      <!-- Measurements -->
      <div style="flex: 1; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px;">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 900; color: #047857; border-bottom: 2px solid #a7f3d0; padding-bottom: 4px;">
          🏃‍♂️ نتائج الاختبارات والقياسات البدنية (BMI: ${bmiText})
        </h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f4f4f5; font-size: 10px; font-weight: 900; color: #3f3f46;">
              <th style="padding: 6px; text-align: right;">عنصر القياس</th>
              <th style="padding: 6px; text-align: center;">النتيجة</th>
              <th style="padding: 6px; text-align: center;">التصنيف</th>
            </tr>
          </thead>
          <tbody>
            ${measurementRows || '<tr><td colspan="3" style="text-align: center; padding: 8px;">لا توجد قياسات مسجلة</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Grades -->
      <div style="flex: 1; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px;">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 900; color: #047857; border-bottom: 2px solid #a7f3d0; padding-bottom: 4px;">
          📝 سجل التقويم والدرجات المهارية
        </h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f4f4f5; font-size: 10px; font-weight: 900; color: #3f3f46;">
              <th style="padding: 6px; text-align: right;">البند / الاختبار</th>
              <th style="padding: 6px; text-align: center;">الدرجة العظمى</th>
              <th style="padding: 6px; text-align: center;">المكتسبة</th>
            </tr>
          </thead>
          <tbody>
            ${gradesRows || '<tr><td colspan="3" style="text-align: center; padding: 8px;">لا توجد درجات رُصدت بعد</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Incentives & Notes Row -->
    <div style="display: flex; gap: 16px; margin-bottom: 20px;">
      <!-- Incentives History -->
      <div style="flex: 1; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px;">
        <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 900; color: #047857;">
          ⭐ بنك التحفيز والسلوك (إيجابي: ${positiveCount} | مخالفات: ${negativeCount})
        </h4>
        ${recentIncentivesHTML || '<p style="font-size: 11px; color: #a1a1aa; text-align: center; margin: 10px 0;">لا توجد سجلات تحفيز مسجلة</p>'}
      </div>

      <!-- Notes & Medical -->
      <div style="flex: 1; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px; font-size: 11px; font-weight: 700;">
        <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 900; color: #047857;">
          📌 الملاحظات الصحية والتوصيات
        </h4>
        <div style="background: #fffbeb; border: 1px solid #fef3c7; p: 8px; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
          <strong style="color: #92400e; display: block; margin-bottom: 2px;">الحالة الصحية:</strong>
          <span style="color: #78350f;">${student.medicalNotes || 'سليم ولله الحمد (لا توجد ملاحظات صحية)'}</span>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px;">
          <strong style="color: #334155; display: block; margin-bottom: 2px;">توصيات المعلم:</strong>
          <span style="color: #475569;">${student.teacherNotes || 'طالب متميز ومتفاعل في حصص التربية البدنية.'}</span>
        </div>
      </div>
    </div>

    ${buildReportFooterHTML(settings.teacherName)}
  `;

  container.innerHTML = html;
  await renderContainerToPDF(container, `تقرير_الطالب_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 6. STATISTICS & ANALYTICS PDF REPORT (تقرير الإحصائيات والتحليلات العامة)
 */
export const generateStatisticsPDFReport = async (
  classItem: ClassItem | undefined,
  students: Student[],
  dailyLogs: DailyLogRecord[],
  measurementItems: MeasurementItem[],
  measurementValues: Record<string, Record<string, string | number>>,
  incentiveRecords: IncentiveRecord[],
  assessments: AssessmentItem[],
  grades: Record<string, Record<string, number>>,
  settings: TeacherSettings
) => {
  const container = document.createElement('div');
  container.style.padding = '32px';

  const targetStudents = classItem
    ? students.filter((s) => s.classId === classItem.id)
    : students;

  const className = classItem ? classItem.name : 'جميع الفصول الدراسية';

  // Metrics
  const targetStudentIds = targetStudents.map((s) => s.id);
  const targetLogs = dailyLogs.filter((l) => targetStudentIds.includes(l.studentId));
  const totalLogs = targetLogs.length || 1;
  const presentLogs = targetLogs.filter((l) => l.attendance === 'present').length;
  const absentLogs = targetLogs.filter((l) => l.attendance === 'absent').length;
  const lateLogs = targetLogs.filter((l) => l.attendance === 'late').length;
  const uniformViolations = targetLogs.filter((l) => l.attendance === 'present' && l.uniform === false).length;
  const attendanceRate = Math.round((presentLogs / totalLogs) * 100);

  // Fitness Levels Breakdown
  const fitnessCounts: Record<string, number> = {
    'ممتاز': 0,
    'جيد جداً': 0,
    'جيد': 0,
    'مقبول': 0,
    'ضعيف': 0,
  };

  const studentRankings = targetStudents.map((st) => {
    const fit = calculateStudentFitnessSummary(st.id, measurementItems, measurementValues);
    const lvl = fit.ratingLevel || 'مقبول';
    if (fitnessCounts[lvl] !== undefined) {
      fitnessCounts[lvl]++;
    } else {
      fitnessCounts['مقبول']++;
    }

    // Incentive points
    const stIncentives = incentiveRecords.filter((r) => r.studentId === st.id);
    const netPoints = stIncentives.reduce((acc, curr) => acc + curr.points, 0);

    // Grades
    const stGrades = grades[st.id] || {};
    let earnedSum = 0;
    assessments.forEach((ass) => {
      const sc = stGrades[ass.id];
      if (sc !== undefined && !isNaN(sc)) earnedSum += sc;
    });

    return {
      student: st,
      fitnessScore: fit.totalScore,
      fitnessLevel: lvl,
      points: netPoints,
      earnedGrades: earnedSum,
    };
  });

  // Sort top students by points & fitness
  const topIncentives = [...studentRankings].sort((a, b) => b.points - a.points).slice(0, 5);
  const topFitness = [...studentRankings].sort((a, b) => b.fitnessScore - a.fitnessScore).slice(0, 5);

  const topIncentiveRows = topIncentives.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e4e4e7; font-size: 11px; font-weight: 700;">
      <td style="padding: 6px; text-align: center; font-weight: 900; color: #d97706;">#${idx + 1}</td>
      <td style="padding: 6px; text-align: right; color: #18181b;">${item.student.name}</td>
      <td style="padding: 6px; text-align: center; color: #047857; font-weight: 900;">+${item.points} نقطة</td>
    </tr>
  `).join('');

  const topFitnessRows = topFitness.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e4e4e7; font-size: 11px; font-weight: 700;">
      <td style="padding: 6px; text-align: center; font-weight: 900; color: #0284c7;">#${idx + 1}</td>
      <td style="padding: 6px; text-align: right; color: #18181b;">${item.student.name}</td>
      <td style="padding: 6px; text-align: center; color: #0284c7; font-weight: 900;">${item.fitnessScore} نقطة (${item.fitnessLevel})</td>
    </tr>
  `).join('');

  const html = `
    ${buildReportHeaderHTML(
      'تقرير الإحصائيات والتحليلات العامة',
      `ملخص الأداء والمؤشرات للفصل: ${className}`,
      className,
      settings
    )}

    <!-- KPI Cards Row -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px; text-align: center;">
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: #166534; display: block;">إجمالي الطلاب</span>
        <strong style="font-size: 20px; color: #065f46; font-weight: 900;">${targetStudents.length} طالب</strong>
      </div>

      <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: #1e40af; display: block;">نسبة الانضباط والحضور</span>
        <strong style="font-size: 20px; color: #1d4ed8; font-weight: 900;">${attendanceRate}%</strong>
      </div>

      <div style="flex: 1; background: #fefce8; border: 1px solid #fef08a; padding: 12px; border-radius: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: #854d0e; display: block;">سجل الغياب والتأخر</span>
        <strong style="font-size: 16px; color: #ca8a04; font-weight: 900;">${absentLogs} غياب | ${lateLogs} تأخر</strong>
      </div>

      <div style="flex: 1; background: #faf5ff; border: 1px solid #e9d5ff; padding: 12px; border-radius: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: #6b21a8; display: block;">مخالفات الزي الرياضي</span>
        <strong style="font-size: 20px; color: #7e22ce; font-weight: 900;">${uniformViolations} مخالفة</strong>
      </div>
    </div>

    <!-- Fitness Distribution Breakdown Table -->
    <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 900; color: #047857;">
        🏃‍♂️ توزيع مستويات اللياقة البدنية والبدانة
      </h3>
      <div style="display: flex; gap: 8px; text-align: center;">
        <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px; border-radius: 8px;">
          <span style="font-size: 10px; font-weight: 800; color: #15803d; display: block;">ممتاز</span>
          <strong style="font-size: 15px; color: #166534;">${fitnessCounts['ممتاز']} طالب</strong>
        </div>
        <div style="flex: 1; background: #e0f2fe; border: 1px solid #bae6fd; padding: 8px; border-radius: 8px;">
          <span style="font-size: 10px; font-weight: 800; color: #0369a1; display: block;">جيد جداً</span>
          <strong style="font-size: 15px; color: #075985;">${fitnessCounts['جيد جداً']} طالب</strong>
        </div>
        <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; padding: 8px; border-radius: 8px;">
          <span style="font-size: 10px; font-weight: 800; color: #1d4ed8; display: block;">جيد</span>
          <strong style="font-size: 15px; color: #1e40af;">${fitnessCounts['جيد']} طالب</strong>
        </div>
        <div style="flex: 1; background: #fefce8; border: 1px solid #fef08a; padding: 8px; border-radius: 8px;">
          <span style="font-size: 10px; font-weight: 800; color: #a16207; display: block;">مقبول</span>
          <strong style="font-size: 15px; color: #854d0e;">${fitnessCounts['مقبول']} طالب</strong>
        </div>
        <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; padding: 8px; border-radius: 8px;">
          <span style="font-size: 10px; font-weight: 800; color: #b91c1c; display: block;">ضعيف</span>
          <strong style="font-size: 15px; color: #991b1b;">${fitnessCounts['ضعيف']} طالب</strong>
        </div>
      </div>
    </div>

    <!-- Leaderboards Section -->
    <div style="display: flex; gap: 16px; margin-bottom: 20px;">
      <!-- Top Incentives -->
      <div style="flex: 1; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 14px;">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 900; color: #d97706; border-bottom: 2px solid #fef08a; padding-bottom: 4px;">
          🏆 المتصدرون في بنك التحفيز والسلوك
        </h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #fffbeb; font-size: 10px; font-weight: 900; color: #78350f;">
              <th style="padding: 6px; text-align: center; width: 35px;">المركز</th>
              <th style="padding: 6px; text-align: right;">اسم الطالب</th>
              <th style="padding: 6px; text-align: center;">النقاط</th>
            </tr>
          </thead>
          <tbody>
            ${topIncentiveRows || '<tr><td colspan="3" style="text-align: center; padding: 8px;">لا توجد بيانات</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Top Fitness -->
      <div style="flex: 1; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 14px;">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 900; color: #0284c7; border-bottom: 2px solid #bae6fd; padding-bottom: 4px;">
          🏃‍♂️ المتصدرون في اللياقة والبدنية
        </h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f9ff; font-size: 10px; font-weight: 900; color: #0c4a6e;">
              <th style="padding: 6px; text-align: center; width: 35px;">المركز</th>
              <th style="padding: 6px; text-align: right;">اسم الطالب</th>
              <th style="padding: 6px; text-align: center;">مجموع النقاط</th>
            </tr>
          </thead>
          <tbody>
            ${topFitnessRows || '<tr><td colspan="3" style="text-align: center; padding: 8px;">لا توجد بيانات</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    ${buildReportFooterHTML(settings.teacherName)}
  `;

  container.innerHTML = html;
  await renderContainerToPDF(container, `تقرير_إحصائيات_${className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 7. ACADEMIC GRADES & ASSESSMENTS PDF REPORT (تقرير كشف الدرجات واختبارات التقييم)
 */
export const generateGradesPDFReport = async (
  classItem: ClassItem,
  classStudents: Student[],
  assessments: AssessmentItem[],
  grades: Record<string, Record<string, number>>,
  settings: TeacherSettings
) => {
  const container = document.createElement('div');
  container.style.padding = '32px';

  const totalMaxScore = assessments.reduce((sum, a) => sum + a.maxScore, 0);

  let totalScoresSum = 0;
  let highestScore = 0;
  let excellentStudentsCount = 0;

  // Build assessment header columns
  const assessmentHeadersHTML = assessments
    .map(
      (ass) => `
    <th style="padding: 8px; border: 1px solid #047857; text-align: center; font-size: 10px; min-width: 60px;">
      ${ass.name}<br/>
      <span style="font-weight: 600; font-size: 9px; opacity: 0.9;">(${ass.maxScore})</span>
    </th>
  `
    )
    .join('');

  const rows = classStudents.map((student, idx) => {
    const studentScores = grades[student.id] || {};
    let studentTotal = 0;

    const itemScoresHTML = assessments
      .map((ass) => {
        const score = studentScores[ass.id];
        if (score !== undefined && !isNaN(score)) {
          studentTotal += score;
          return `
            <td style="padding: 6px; border: 1px solid #e4e4e7; text-align: center; font-size: 11px; font-weight: 800; color: #18181b;">
              ${score}
            </td>
          `;
        }
        return `
          <td style="padding: 6px; border: 1px solid #e4e4e7; text-align: center; font-size: 11px; font-weight: 600; color: #a1a1aa;">
            -
          </td>
        `;
      })
      .join('');

    totalScoresSum += studentTotal;
    if (studentTotal > highestScore) highestScore = studentTotal;

    const pct = totalMaxScore > 0 ? Math.round((studentTotal / totalMaxScore) * 100) : 0;
    if (pct >= 90) excellentStudentsCount++;

    let gradeLevel = 'يحتاج تحسين';
    let gradeBadgeStyle = 'background: #fee2e2; color: #991b1b;';
    if (pct >= 90) {
      gradeLevel = 'ممتاز';
      gradeBadgeStyle = 'background: #dcfce7; color: #166534;';
    } else if (pct >= 80) {
      gradeLevel = 'جيد جداً';
      gradeBadgeStyle = 'background: #e0f2fe; color: #0369a1;';
    } else if (pct >= 70) {
      gradeLevel = 'جيد';
      gradeBadgeStyle = 'background: #fef9c3; color: #854d0e;';
    } else if (pct >= 60) {
      gradeLevel = 'مقبول';
      gradeBadgeStyle = 'background: #ffedd5; color: #9a3412;';
    }

    return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; font-weight: 700; font-size: 11px;">
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; color: #71717a;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: right; font-weight: 900; color: #18181b;">${student.name}</td>
        ${itemScoresHTML}
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; font-weight: 900; color: #047857; background: #f0fdf4;">
          ${studentTotal} / ${totalMaxScore}
        </td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center; font-weight: 900; color: #1d4ed8;">
          ${pct}%
        </td>
        <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 900; ${gradeBadgeStyle}">
            ${gradeLevel}
          </span>
        </td>
      </tr>
    `;
  });

  const classAvg = classStudents.length > 0 ? (totalScoresSum / classStudents.length).toFixed(1) : '0';
  const classAvgPct = totalMaxScore > 0 && classStudents.length > 0 ? Math.round((totalScoresSum / (classStudents.length * totalMaxScore)) * 100) : 0;

  const html = `
    ${buildReportHeaderHTML(
      'كشف درجات واختبارات التقويم المهارية والتحصيلية',
      `كشف الدرجات التفصيلي لفصل: ${classItem.name}`,
      classItem.name,
      settings
    )}

    <!-- KPI Summary Row -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px; text-align: center;">
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #166534; display: block;">متوسط درجات الفصل</span>
        <strong style="font-size: 18px; color: #065f46; font-weight: 900;">${classAvg} / ${totalMaxScore} (${classAvgPct}%)</strong>
      </div>
      <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #1e40af; display: block;">أعلى درجة مرصودة</span>
        <strong style="font-size: 18px; color: #1d4ed8; font-weight: 900;">${highestScore} / ${totalMaxScore}</strong>
      </div>
      <div style="flex: 1; background: #fefce8; border: 1px solid #fef08a; padding: 12px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #854d0e; display: block;">الطلاب المتفوقون (≥90%) 🏆</span>
        <strong style="font-size: 18px; color: #ca8a04; font-weight: 900;">${excellentStudentsCount} طالب</strong>
      </div>
      <div style="flex: 1; background: #faf5ff; border: 1px solid #e9d5ff; padding: 12px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #6b21a8; display: block;">عدد بنود التقييم</span>
        <strong style="font-size: 18px; color: #7e22ce; font-weight: 900;">${assessments.length} بنود</strong>
      </div>
    </div>

    <!-- Main Grades Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #065f46; color: #ffffff; font-weight: 900; font-size: 11px;">
          <th style="padding: 10px; border: 1px solid #047857; width: 35px; text-align: center;">#</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: right; min-width: 140px;">اسم الطالب</th>
          ${assessmentHeadersHTML}
          <th style="padding: 10px; border: 1px solid #047857; text-align: center; width: 80px;">المجموع</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center; width: 60px;">النسبة</th>
          <th style="padding: 10px; border: 1px solid #047857; text-align: center; width: 80px;">التقدير</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('')}
      </tbody>
    </table>

    ${buildReportFooterHTML(settings.teacherName)}
  `;

  container.innerHTML = html;
  await renderContainerToPDF(container, `كشف_الدرجات_${classItem.name}_${new Date().toISOString().slice(0, 10)}.pdf`);
};


