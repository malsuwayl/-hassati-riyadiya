import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ClassItem, Student } from '../types';

export interface PDFExportData {
  schoolName: string;
  teacherName: string;
  schoolLogo?: string;
  dateStr: string;
  classesStats: Array<{
    classItem: ClassItem;
    studentScores: Array<{
      student: Student;
      stats: {
        attendanceRate: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        totalParticipations: number;
        totalExcellences: number;
        totalViolations: number;
        totalWarnings: number;
        totalScore: number;
        attendanceText: string;
      };
    }>;
  }>;
}

export const exportReportPDF = async (data: PDFExportData) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '32px';
  container.style.direction = 'rtl';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.color = '#18181b';
  container.style.zIndex = '-9999';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';

  let html = `
    <div style="border-bottom: 3px solid #059669; padding-bottom: 16px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 16px;">
          ${
            data.schoolLogo
              ? `<img src="${data.schoolLogo}" style="width: 54px; height: 54px; object-fit: contain; border-radius: 12px; border: 1px solid #e4e4e7;" />`
              : `<div style="width: 50px; height: 50px; background: #ecfdf5; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 1px solid #a7f3d0;">⚽</div>`
          }
          <div>
            <h1 style="font-size: 22px; font-weight: 800; color: #065f46; margin: 0;">${data.schoolName || 'مدرسة التربية البدنية'}</h1>
            <p style="font-size: 13px; color: #047857; margin: 4px 0 0 0; font-weight: 700;">تقرير حصتي الرياضية الشامل</p>
          </div>
        </div>
        <div style="text-align: left; font-size: 12px; font-weight: 600; color: #52525b;">
          <p style="margin: 0;"><strong>المعلم:</strong> ${data.teacherName || 'معلم البدنية'}</p>
          <p style="margin: 4px 0 0 0;"><strong>التاريخ:</strong> ${data.dateStr}</p>
        </div>
      </div>
    </div>
  `;

  for (const clsData of data.classesStats) {
    html += `
      <div style="margin-bottom: 28px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 10px 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
          <h2 style="font-size: 15px; font-weight: 800; color: #065f46; margin: 0;">
            فصل: ${clsData.classItem.name} (${clsData.classItem.grade} - ${clsData.classItem.period})
          </h2>
          <span style="font-size: 12px; font-weight: 700; color: #047857;">عدد الطلاب: ${clsData.studentScores.length}</span>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: center;">
          <thead>
            <tr style="background-color: #065f46; color: #ffffff; font-weight: 700;">
              <th style="padding: 8px; border: 1px solid #047857; width: 40px;">#</th>
              <th style="padding: 8px; border: 1px solid #047857; text-align: right;">اسم الطالب</th>
              <th style="padding: 8px; border: 1px solid #047857;">الحضور</th>
              <th style="padding: 8px; border: 1px solid #047857;">⭐ المشاركات</th>
              <th style="padding: 8px; border: 1px solid #047857;">⚠️ المخالفات</th>
              <th style="padding: 8px; border: 1px solid #047857;">📢 الإنذارات</th>
              <th style="padding: 8px; border: 1px solid #047857;">الدرجة النهائية</th>
            </tr>
          </thead>
          <tbody>
            ${
              clsData.studentScores.length === 0
                ? `<tr><td colspan="7" style="padding: 12px; border: 1px solid #e4e4e7; color: #71717a;">لا يوجد طلاب مضافين لهذا الفصل</td></tr>`
                : clsData.studentScores
                    .map(
                      ({ student, stats }, idx) => `
                <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; font-weight: 600;">
                  <td style="padding: 8px; border: 1px solid #e4e4e7; color: #71717a;">${idx + 1}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; text-align: right; font-weight: 700; color: #18181b;">${student.name}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7;">${stats.attendanceText}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; color: #d97706; font-weight: 700;">${stats.totalParticipations}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; color: #dc2626; font-weight: 700;">${stats.totalViolations}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; color: #ea580c; font-weight: 700;">${stats.totalWarnings}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; color: #059669; font-weight: 800; font-size: 13px;">${stats.totalScore}</td>
                </tr>
              `
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `تقرير_حصتي_الرياضية_${new Date().toISOString().slice(0, 10)}.pdf`;
    downloadLink.target = '_self';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    throw err;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

