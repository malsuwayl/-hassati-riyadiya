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
 * Helper to compute Arabic Day of the Week name from date string YYYY-MM-DD
 */
export const getArabicDayName = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      return dayNames[d.getDay()] || '';
    }
  } catch {
    // fallback
  }
  return '';
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

  // 1. Attendance Metrics (Sorted newest first)
  const stLogs = dailyLogs
    .filter((l) => l.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalDays = stLogs.length || 1;
  const presentCount = stLogs.filter((l) => l.attendance === 'present').length;
  const absentCount = stLogs.filter((l) => l.attendance === 'absent').length;
  const lateCount = stLogs.filter((l) => l.attendance === 'late').length;
  const uniformViolationsLogs = stLogs.filter((l) => l.uniform === false);
  const uniformViolations = uniformViolationsLogs.length;
  const absentLogsList = stLogs.filter((l) => l.attendance === 'absent');
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

  // Absent Dates Rows
  const absentDatesRows = absentLogsList.length > 0
    ? absentLogsList.map((log, idx) => {
        const day = getArabicDayName(log.date);
        return `
          <tr style="border-bottom: 1px solid #fecaca; font-size: 10px; background: #fff5f5;">
            <td style="padding: 5px 6px; text-align: center; font-weight: 900; color: #b91c1c;">${idx + 1}</td>
            <td style="padding: 5px 6px; text-align: right; font-weight: 800; color: #18181b;">
              <strong style="color: #dc2626;">${day}</strong> ${log.date}
            </td>
            <td style="padding: 5px 6px; text-align: right; color: #52525b; font-size: 9px;">${log.notes || 'بدون عذر مسجل'}</td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="3" style="text-align: center; padding: 8px; color: #166534; font-size: 10px; font-weight: 800; background: #f0fdf4;">✨ سجل نظيف: لا توجد أي أيام غياب مسجلة للطالب</td></tr>`;

  // Uniform Violations Dates Rows
  const uniformDatesRows = uniformViolationsLogs.length > 0
    ? uniformViolationsLogs.map((log, idx) => {
        const day = getArabicDayName(log.date);
        return `
          <tr style="border-bottom: 1px solid #e9d5ff; font-size: 10px; background: #faf5ff;">
            <td style="padding: 5px 6px; text-align: center; font-weight: 900; color: #6b21a8;">${idx + 1}</td>
            <td style="padding: 5px 6px; text-align: right; font-weight: 800; color: #18181b;">
              <strong style="color: #7e22ce;">${day}</strong> ${log.date}
            </td>
            <td style="padding: 5px 6px; text-align: right; color: #52525b; font-size: 9px;">${log.notes || 'حضر الحصة بدون الزي الرياضي الكامل'}</td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="3" style="text-align: center; padding: 8px; color: #166534; font-size: 10px; font-weight: 800; background: #f0fdf4;">✨ التزام تام: لم تسجل أي مخالفة زي رياضي للطالب</td></tr>`;

  // Recent 10 Full Sessions Breakdown Rows
  const sessionsTableRows = stLogs.slice(0, 15).map((log, idx) => {
    const day = getArabicDayName(log.date);
    const isAbsent = log.attendance === 'absent';
    const isLate = log.attendance === 'late';
    const isExcused = log.attendance === 'excused';

    let attBadge = '<span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px;">حاضر ✓</span>';
    if (isAbsent) {
      attBadge = '<span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px;">غائب ✕</span>';
    } else if (isLate) {
      attBadge = '<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px;">متأخر ⏰</span>';
    } else if (isExcused) {
      attBadge = '<span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px;">معذور 📄</span>';
    }

    let uniBadge = '<span style="color: #71717a;">-</span>';
    if (!isAbsent) {
      if (log.uniform === false) {
        uniBadge = '<span style="background: #f3e8ff; color: #7e22ce; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px; border: 1px solid #d8b4fe;">❌ بدون زي</span>';
      } else if (log.uniform === true) {
        uniBadge = '<span style="background: #f0fdf4; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px;">✅ بالزي</span>';
      }
    }

    return `
      <tr style="border-bottom: 1px solid #e4e4e7; font-size: 10px; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="padding: 5px 6px; text-align: center; color: #71717a;">${idx + 1}</td>
        <td style="padding: 5px 6px; text-align: right; font-weight: 800; color: #18181b;">
          ${day ? `<strong style="color: #065f46;">${day}</strong> - ` : ''}${log.date}
        </td>
        <td style="padding: 5px 6px; text-align: center;">${attBadge}</td>
        <td style="padding: 5px 6px; text-align: center;">${uniBadge}</td>
        <td style="padding: 5px 6px; text-align: right; color: #52525b; font-size: 9px;">${log.notes || '-'}</td>
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
      'تقرير الأداء الفردي الشامل للطالب',
      `السجل المتكامل والمواظبة والزي والدرجات: ${student.name}`,
      className,
      settings
    )}

    <!-- Student Bio Card -->
    <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h3 style="margin: 0; font-size: 18px; font-weight: 900; color: #0f172a;">${student.name}</h3>
        <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 800; color: #64748b;">
          الفصل: <strong style="color: #047857;">${className}</strong> | المعرف: ${student.id.slice(0, 8)} ${student.nationalId ? `| الهوية: ${student.nationalId}` : ''}
        </p>
      </div>

      <div style="text-align: left; font-size: 11px; font-weight: 800; color: #334155;">
        <span style="background: #047857; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 900;">
          المستوى البدني: ${fitnessSummary.ratingLevel || 'جيد جداً'}
        </span>
      </div>
    </div>

    <!-- KPI Metrics -->
    <div style="display: flex; gap: 10px; margin-bottom: 16px; text-align: center;">
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #166534; display: block;">نسبة الحضور</span>
        <strong style="font-size: 16px; color: #065f46; font-weight: 900;">${attendanceRate}% (${presentCount} يوم)</strong>
      </div>
      <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #991b1b; display: block;">أيام الغياب</span>
        <strong style="font-size: 16px; color: #dc2626; font-weight: 900;">${absentCount} أيام</strong>
      </div>
      <div style="flex: 1; background: #faf5ff; border: 1px solid #e9d5ff; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #6b21a8; display: block;">بدون زي رياضي</span>
        <strong style="font-size: 16px; color: #7e22ce; font-weight: 900;">${uniformViolations} مرات</strong>
      </div>
      <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #1e40af; display: block;">مجموع اللياقة</span>
        <strong style="font-size: 16px; color: #1d4ed8; font-weight: 900;">${fitnessSummary.totalScore} نقطة</strong>
      </div>
      <div style="flex: 1; background: #fefce8; border: 1px solid #fef08a; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #854d0e; display: block;">رصيد التحفيز</span>
        <strong style="font-size: 16px; color: #ca8a04; font-weight: 900;">${netPoints > 0 ? `+${netPoints}` : netPoints} نقطة</strong>
      </div>
      <div style="flex: 1; background: #faf5ff; border: 1px solid #e9d5ff; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #6b21a8; display: block;">الدرجات</span>
        <strong style="font-size: 16px; color: #7e22ce; font-weight: 900;">${gradesEarned} / ${gradesMax}</strong>
      </div>
    </div>

    <!-- DEDICATED SECTION: DATES OF ABSENCE & UNIFORM VIOLATIONS -->
    <div style="background: #ffffff; border: 2px solid #065f46; border-radius: 12px; padding: 14px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 900; color: #065f46; display: flex; align-items: center; justify-content: space-between;">
        <span>📅 كشف تواريخ الغياب وعدم إحضار الزي الرياضي بالتفصيل</span>
        <span style="font-size: 10px; font-weight: 800; color: #047857; background: #f0fdf4; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 6px;">
          إجمالي الحصص المرصودة: ${stLogs.length} حصة
        </span>
      </h3>

      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <!-- Box 1: Absent Dates List -->
        <div style="flex: 1; background: #fffdfd; border: 1px solid #fecaca; border-radius: 10px; padding: 10px;">
          <h4 style="margin: 0 0 6px 0; font-size: 11px; font-weight: 900; color: #b91c1c; border-bottom: 2px solid #fecaca; padding-bottom: 4px;">
            🔴 تواريخ أيام الغياب المرصودة (${absentCount} يوم)
          </h4>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #fee2e2; font-size: 9px; font-weight: 900; color: #7f1d1d;">
                <th style="padding: 4px; text-align: center; width: 24px;">#</th>
                <th style="padding: 4px; text-align: right;">اليوم والتاريخ</th>
                <th style="padding: 4px; text-align: right;">العذر والملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${absentDatesRows}
            </tbody>
          </table>
        </div>

        <!-- Box 2: Missing Uniform Dates List -->
        <div style="flex: 1; background: #fdfcff; border: 1px solid #e9d5ff; border-radius: 10px; padding: 10px;">
          <h4 style="margin: 0 0 6px 0; font-size: 11px; font-weight: 900; color: #7e22ce; border-bottom: 2px solid #e9d5ff; padding-bottom: 4px;">
            🎽 تواريخ عدم إحضار الزي الرياضي (${uniformViolations} مرات)
          </h4>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3e8ff; font-size: 9px; font-weight: 900; color: #581c87;">
                <th style="padding: 4px; text-align: center; width: 24px;">#</th>
                <th style="padding: 4px; text-align: right;">اليوم والتاريخ</th>
                <th style="padding: 4px; text-align: right;">ملاحظة وتنبيه المعلم</th>
              </tr>
            </thead>
            <tbody>
              ${uniformDatesRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Chronological Sessions Table -->
      <div>
        <h4 style="margin: 0 0 6px 0; font-size: 11px; font-weight: 900; color: #334155;">
          📋 السجل الزمني التفصيلي للحضور والزي الرياضي (آخر الحصص):
        </h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9; font-size: 9px; font-weight: 900; color: #334155;">
              <th style="padding: 5px; text-align: center; width: 25px;">#</th>
              <th style="padding: 5px; text-align: right;">اليوم والتاريخ</th>
              <th style="padding: 5px; text-align: center; width: 75px;">حالة الحضور</th>
              <th style="padding: 5px; text-align: center; width: 90px;">الزي الرياضي</th>
              <th style="padding: 5px; text-align: right;">ملاحظات الحصة</th>
            </tr>
          </thead>
          <tbody>
            ${sessionsTableRows || '<tr><td colspan="5" style="text-align: center; padding: 8px;">لا توجد سجلات بعد</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 2 Column Section: Measurements & Grades -->
    <div style="display: flex; gap: 14px; margin-bottom: 16px;">
      <!-- Measurements -->
      <div style="flex: 1; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 10px;">
        <h4 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 900; color: #047857; border-bottom: 2px solid #a7f3d0; padding-bottom: 4px;">
          🏃‍♂️ نتائج الاختبارات والقياسات البدنية (BMI: ${bmiText})
        </h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f4f4f5; font-size: 9px; font-weight: 900; color: #3f3f46;">
              <th style="padding: 5px; text-align: right;">عنصر القياس</th>
              <th style="padding: 5px; text-align: center;">النتيجة</th>
              <th style="padding: 5px; text-align: center;">التصنيف</th>
            </tr>
          </thead>
          <tbody>
            ${measurementRows || '<tr><td colspan="3" style="text-align: center; padding: 8px;">لا توجد قياسات مسجلة</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Grades -->
      <div style="flex: 1; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 10px;">
        <h4 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 900; color: #047857; border-bottom: 2px solid #a7f3d0; padding-bottom: 4px;">
          📝 سجل التقويم والدرجات المهارية (${gradesEarned} / ${gradesMax})
        </h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f4f4f5; font-size: 9px; font-weight: 900; color: #3f3f46;">
              <th style="padding: 5px; text-align: right;">البند / الاختبار</th>
              <th style="padding: 5px; text-align: center;">العظمى</th>
              <th style="padding: 5px; text-align: center;">المكتسبة</th>
            </tr>
          </thead>
          <tbody>
            ${gradesRows || '<tr><td colspan="3" style="text-align: center; padding: 8px;">لا توجد درجات رُصدت بعد</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Incentives & Notes Row -->
    <div style="display: flex; gap: 14px; margin-bottom: 16px;">
      <!-- Incentives History -->
      <div style="flex: 1; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 10px;">
        <h4 style="margin: 0 0 6px 0; font-size: 11px; font-weight: 900; color: #047857;">
          ⭐ بنك التحفيز والسلوك (إيجابي: ${positiveCount} | مخالفات: ${negativeCount})
        </h4>
        ${recentIncentivesHTML || '<p style="font-size: 10px; color: #a1a1aa; text-align: center; margin: 8px 0;">لا توجد سجلات تحفيز مسجلة</p>'}
      </div>

      <!-- Notes & Medical -->
      <div style="flex: 1; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 10px; font-size: 10px; font-weight: 700;">
        <h4 style="margin: 0 0 6px 0; font-size: 11px; font-weight: 900; color: #047857;">
          📌 الملاحظات الصحية والتوصيات
        </h4>
        <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 6px; border-radius: 6px; margin-bottom: 6px;">
          <strong style="color: #92400e; display: block; margin-bottom: 2px;">الحالة الصحية:</strong>
          <span style="color: #78350f;">${student.medicalNotes || 'سليم ولله الحمد (لا توجد ملاحظات صحية)'}</span>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 6px;">
          <strong style="color: #334155; display: block; margin-bottom: 2px;">توصيات المعلم:</strong>
          <span style="color: #475569;">${student.teacherNotes || 'طالب متميز ومتفاعل في حصص التربية البدنية.'}</span>
        </div>
      </div>
    </div>

    ${buildReportFooterHTML(settings.teacherName)}
  `;

  container.innerHTML = html;
  await renderContainerToPDF(container, `تقرير_الطالب_الشامل_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 5.1 SPECIALIZED DATED ATTENDANCE & UNIFORM PDF REPORT (كشف تواريخ الغياب ومخالفات الزي الرياضي بالتفصيل)
 */
export const generateStudentAttendanceAndUniformPDFReport = async (
  student: Student,
  classItem: ClassItem | undefined,
  dailyLogs: DailyLogRecord[],
  settings: TeacherSettings
) => {
  const container = document.createElement('div');
  container.style.padding = '32px';

  // Sort logs chronologically (newest first)
  const stLogs = dailyLogs
    .filter((l) => l.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalSessions = stLogs.length;
  const presentCount = stLogs.filter((l) => l.attendance === 'present').length;
  const absentLogsList = stLogs.filter((l) => l.attendance === 'absent');
  const absentCount = absentLogsList.length;
  const lateLogsList = stLogs.filter((l) => l.attendance === 'late');
  const lateCount = lateLogsList.length;
  const excusedLogsList = stLogs.filter((l) => l.attendance === 'excused');
  const excusedCount = excusedLogsList.length;

  const uniformViolationsLogs = stLogs.filter((l) => l.uniform === false);
  const uniformViolationsCount = uniformViolationsLogs.length;

  const uniformAdherenceCount = stLogs.filter((l) => l.attendance === 'present' && l.uniform === true).length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

  // Format Absent Dates Table
  const absentRowsHTML = absentLogsList.length > 0
    ? absentLogsList.map((log, idx) => {
        const day = getArabicDayName(log.date);
        return `
          <tr style="border-bottom: 1px solid #fecaca; background: #fff5f5; font-size: 11px;">
            <td style="padding: 8px; text-align: center; font-weight: 900; color: #b91c1c;">${idx + 1}</td>
            <td style="padding: 8px; text-align: right; font-weight: 900; color: #18181b;">
              <span style="color: #dc2626;">${day}</span> - ${log.date}
            </td>
            <td style="padding: 8px; text-align: center; color: #dc2626; font-weight: 800;">غائب ✕</td>
            <td style="padding: 8px; text-align: right; color: #4b5563;">${log.notes || 'لم يُقدم عذر رسمي'}</td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="4" style="text-align: center; padding: 12px; color: #15803d; font-weight: 800; background: #f0fdf4;">✨ سجل نظيف تماماً: لا توجد أي أيام غياب مسجلة للطالب</td></tr>`;

  // Format Uniform Violations Dates Table
  const uniformRowsHTML = uniformViolationsLogs.length > 0
    ? uniformViolationsLogs.map((log, idx) => {
        const day = getArabicDayName(log.date);
        return `
          <tr style="border-bottom: 1px solid #e9d5ff; background: #faf5ff; font-size: 11px;">
            <td style="padding: 8px; text-align: center; font-weight: 900; color: #6b21a8;">${idx + 1}</td>
            <td style="padding: 8px; text-align: right; font-weight: 900; color: #18181b;">
              <span style="color: #7e22ce;">${day}</span> - ${log.date}
            </td>
            <td style="padding: 8px; text-align: center; color: #7e22ce; font-weight: 900;">بدون زي رياضي ❌</td>
            <td style="padding: 8px; text-align: right; color: #4b5563;">${log.notes || 'حضر الحصة بدون الزي الرياضي المطلوب'}</td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="4" style="text-align: center; padding: 12px; color: #15803d; font-weight: 800; background: #f0fdf4;">✨ التزام كامل: الطالب ملتزم دائماً بإحضار الزي الرياضي في كل الحصص</td></tr>`;

  // Format Complete Timeline Sessions Table
  const allSessionsRowsHTML = stLogs.length > 0
    ? stLogs.map((log, idx) => {
        const day = getArabicDayName(log.date);
        const isAbsent = log.attendance === 'absent';
        const isLate = log.attendance === 'late';
        const isExcused = log.attendance === 'excused';

        let attText = '<span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 10px;">حاضر ✓</span>';
        if (isAbsent) {
          attText = '<span style="background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 10px;">غائب ✕</span>';
        } else if (isLate) {
          attText = '<span style="background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 10px;">متأخر ⏰</span>';
        } else if (isExcused) {
          attText = '<span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 10px;">معذور 📄</span>';
        }

        let uniText = '<span style="color: #9ca3af;">-</span>';
        if (!isAbsent) {
          if (log.uniform === false) {
            uniText = '<span style="background: #f3e8ff; color: #7e22ce; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 10px; border: 1px solid #d8b4fe;">❌ بدون زي</span>';
          } else if (log.uniform === true) {
            uniText = '<span style="background: #f0fdf4; color: #166534; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 10px;">✅ مكتمل الزي</span>';
          }
        }

        return `
          <tr style="border-bottom: 1px solid #e5e7eb; font-size: 10px; background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            <td style="padding: 6px 8px; text-align: center; color: #6b7280;">${idx + 1}</td>
            <td style="padding: 6px 8px; text-align: right; font-weight: 800; color: #111827;">
              <strong style="color: #047857;">${day}</strong> - ${log.date}
            </td>
            <td style="padding: 6px 8px; text-align: center;">${attText}</td>
            <td style="padding: 6px 8px; text-align: center;">${uniText}</td>
            <td style="padding: 6px 8px; text-align: right; color: #4b5563;">${log.notes || '-'}</td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="5" style="text-align: center; padding: 12px; color: #9ca3af;">لا توجد أي حصص مسجلة حتى الآن</td></tr>`;

  const className = classItem ? classItem.name : 'الفصل الدراسي';

  const html = `
    ${buildReportHeaderHTML(
      'كشف سجل المواظبة والزي الرياضي التفصيلي',
      `بيان رسمي بتواريخ الغياب ومخالفات الزي للطالب: ${student.name}`,
      className,
      settings
    )}

    <!-- Student Bio Card -->
    <div style="background: #f0fdf4; border: 2px solid #a7f3d0; border-radius: 12px; padding: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2 style="margin: 0; font-size: 18px; font-weight: 900; color: #065f46;">${student.name}</h2>
        <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 800; color: #047857;">
          الفصل: <strong>${className}</strong> | الرقم الأكاديمي: ${student.id.slice(0, 8)} ${student.nationalId ? `| السجل المدني: ${student.nationalId}` : ''}
        </p>
      </div>

      <div style="text-align: left; font-size: 11px; font-weight: 800; color: #065f46;">
        <span style="background: #047857; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 900;">
          نسبة المواظبة: ${attendanceRate}%
        </span>
      </div>
    </div>

    <!-- KPI Summary Row -->
    <div style="display: flex; gap: 10px; margin-bottom: 16px; text-align: center;">
      <div style="flex: 1; background: #ffffff; border: 1px solid #d1d5db; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #4b5563; display: block;">إجمالي الحصص</span>
        <strong style="font-size: 18px; color: #111827; font-weight: 900;">${totalSessions} حصة</strong>
      </div>
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #15803d; display: block;">أيام الحضور</span>
        <strong style="font-size: 18px; color: #166534; font-weight: 900;">${presentCount} يوم</strong>
      </div>
      <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #991b1b; display: block;">أيام الغياب</span>
        <strong style="font-size: 18px; color: #dc2626; font-weight: 900;">${absentCount} يوم</strong>
      </div>
      <div style="flex: 1; background: #faf5ff; border: 1px solid #e9d5ff; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #6b21a8; display: block;">عدم إحضار الزي</span>
        <strong style="font-size: 18px; color: #7e22ce; font-weight: 900;">${uniformViolationsCount} مرات</strong>
      </div>
      <div style="flex: 1; background: #fefce8; border: 1px solid #fef08a; padding: 10px; border-radius: 10px;">
        <span style="font-size: 10px; font-weight: 800; color: #854d0e; display: block;">أيام التأخر</span>
        <strong style="font-size: 18px; color: #ca8a04; font-weight: 900;">${lateCount} يوم</strong>
      </div>
    </div>

    <!-- SECTION 1: DETAILED DATES OF ABSENCE -->
    <div style="background: #ffffff; border: 1px solid #fca5a5; border-radius: 10px; padding: 12px; margin-bottom: 14px;">
      <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 900; color: #b91c1c; display: flex; align-items: center; justify-content: space-between;">
        <span>🔴 جدول تواريخ أيام الغياب بالتفصيل (${absentCount} يوم غياب):</span>
        <span style="font-size: 10px; font-weight: 800; color: #991b1b;">يرجى مراجعة إدارة المدرسة في حال وجود أعذار طبية أو رسمية</span>
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #fee2e2; color: #991b1b; font-size: 10px; font-weight: 900;">
            <th style="padding: 6px; border: 1px solid #fecaca; text-align: center; width: 30px;">#</th>
            <th style="padding: 6px; border: 1px solid #fecaca; text-align: right; width: 180px;">اليوم والتاريخ</th>
            <th style="padding: 6px; border: 1px solid #fecaca; text-align: center; width: 90px;">الحالة</th>
            <th style="padding: 6px; border: 1px solid #fecaca; text-align: right;">الملاحظات والأعذار</th>
          </tr>
        </thead>
        <tbody>
          ${absentRowsHTML}
        </tbody>
      </table>
    </div>

    <!-- SECTION 2: DETAILED DATES OF UNIFORM VIOLATIONS -->
    <div style="background: #ffffff; border: 1px solid #d8b4fe; border-radius: 10px; padding: 12px; margin-bottom: 14px;">
      <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 900; color: #6b21a8; display: flex; align-items: center; justify-content: space-between;">
        <span>🎽 جدول تواريخ عدم إحضار الزي الرياضي (${uniformViolationsCount} مخالفات زي):</span>
        <span style="font-size: 10px; font-weight: 800; color: #7e22ce;">يلزم الطالب بارتداء الزي الرياضي الكامل المعتمد لحصص المادة</span>
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f3e8ff; color: #6b21a8; font-size: 10px; font-weight: 900;">
            <th style="padding: 6px; border: 1px solid #e9d5ff; text-align: center; width: 30px;">#</th>
            <th style="padding: 6px; border: 1px solid #e9d5ff; text-align: right; width: 180px;">اليوم والتاريخ</th>
            <th style="padding: 6px; border: 1px solid #e9d5ff; text-align: center; width: 110px;">حالة الزي</th>
            <th style="padding: 6px; border: 1px solid #e9d5ff; text-align: right;">ملاحظة وتنبيه المعلم</th>
          </tr>
        </thead>
        <tbody>
          ${uniformRowsHTML}
        </tbody>
      </table>
    </div>

    <!-- SECTION 3: FULL CHRONOLOGICAL TIMELINE OF ALL SESSIONS -->
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 900; color: #111827;">
        📋 السجل الزمني التوثيقي الكامل لجميع الحصص الدراسية المسجلة:
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #065f46; color: #ffffff; font-size: 10px; font-weight: 900;">
            <th style="padding: 6px; border: 1px solid #047857; text-align: center; width: 30px;">#</th>
            <th style="padding: 6px; border: 1px solid #047857; text-align: right; width: 170px;">اليوم والتاريخ</th>
            <th style="padding: 6px; border: 1px solid #047857; text-align: center; width: 85px;">حالة الحضور</th>
            <th style="padding: 6px; border: 1px solid #047857; text-align: center; width: 95px;">الزي الرياضي</th>
            <th style="padding: 6px; border: 1px solid #047857; text-align: right;">ملاحظات المعلم</th>
          </tr>
        </thead>
        <tbody>
          ${allSessionsRowsHTML}
        </tbody>
      </table>
    </div>

    <!-- OFFICIAL SIGNATURES & STAMP FOOTER -->
    <div style="margin-top: 24px; padding-top: 14px; border-top: 2px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; font-weight: 800; color: #374151;">
      <div style="text-align: center; width: 23%;">
        <p style="margin: 0 0 35px 0;">معلم مادة التربية البدنية</p>
        <p style="margin: 0; color: #065f46; font-size: 11px; font-weight: 900;">أ. ${settings.teacherName || '__________________'}</p>
      </div>

      <div style="text-align: center; width: 23%;">
        <p style="margin: 0 0 35px 0;">الموجه الطلابي (المرشد)</p>
        <p style="margin: 0;">التوقيع: __________________</p>
      </div>

      <div style="text-align: center; width: 20%;">
        <p style="margin: 0 0 35px 0;">ختم المدرسة الرسمي</p>
        <div style="width: 60px; height: 60px; border: 2px dashed #cbd5e1; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 9px;">
          [الختـم]
        </div>
      </div>

      <div style="text-align: center; width: 23%;">
        <p style="margin: 0 0 35px 0;">مدير المدرسة</p>
        <p style="margin: 0;">التوقيع: __________________</p>
      </div>
    </div>
  `;

  container.innerHTML = html;
  await renderContainerToPDF(
    container,
    `كشف_مواظبة_وزي_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  );
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


