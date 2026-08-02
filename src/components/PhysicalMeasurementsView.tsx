import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PhysicalMeasurement, Student } from '../types';
import {
  Activity,
  GraduationCap,
  Search,
  Edit3,
  X,
  Check,
  Scale,
  Ruler,
  Zap,
  Award,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const calculateBMIDetails = (weight?: number, height?: number) => {
  if (!weight || !height || height <= 0) {
    return { bmi: undefined, label: 'غير محدد', badgeClass: 'bg-zinc-100 text-zinc-500 border-zinc-200' };
  }
  const heightM = height / 100;
  const val = parseFloat((weight / (heightM * heightM)).toFixed(1));

  if (val < 18.5) {
    return { bmi: val, label: 'نحافة', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' };
  } else if (val < 25) {
    return { bmi: val, label: 'وزن طبيعي 🟢', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
  } else if (val < 30) {
    return { bmi: val, label: 'وزن زائد 🟡', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' };
  } else {
    return { bmi: val, label: 'سمنة 🔴', badgeClass: 'bg-red-100 text-red-900 border-red-300' };
  }
};

export const PhysicalMeasurementsView: React.FC = () => {
  const {
    classes,
    students,
    selectedClassId,
    setSelectedClassId,
    measurements,
    updateStudentMeasurement,
    showToast,
    triggerHaptic,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  const filteredStudents = classStudents.filter(
    (s) =>
      s.name.includes(searchQuery) ||
      (s.studentNumber && s.studentNumber.includes(searchQuery))
  );

  const exportMeasurementsToExcel = () => {
    triggerHaptic(30);
    const dataToExport = classStudents.map((st, idx) => {
      const m = measurements[st.id] || {};
      const bmiDetails = calculateBMIDetails(m.weight, m.height);

      return {
        '#': idx + 1,
        'اسم الطالب': st.name,
        'رقم الطالب': st.studentNumber || '',
        'الفصل': currentClass?.name || '',
        'الطول (سم)': m.height || '-',
        'الوزن (كجم)': m.weight || '-',
        'مؤشر كتلة الجسم (BMI)': m.bmi || (bmiDetails.bmi ? bmiDetails.bmi : '-'),
        'تصنيف كتلة الجسم': bmiDetails.label,
        'جري 50م (ثواني)': m.sprint50m || '-',
        'جري 600م': m.run600m || '-',
        'الوثب الطويل (سم)': m.standingLongJump || '-',
        'ثني الجذع (عدد)': m.sitUps || '-',
        'الضغط بالذراعين (عدد)': m.pushUps || '-',
        'المرونة (سم)': m.flexibility || '-',
        'الرشاقة (ثانية)': m.agility || '-',
        'التوازن (ثانية)': m.balance || '-',
        'ملاحظات': m.notes || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'القياسات البدنية');
    XLSX.writeFile(workbook, `القياسات_البدنية_${currentClass?.name || 'الفصل'}.xlsx`);
    showToast('تم تصدير ملف اكسل للقياسات البدنية بنجاح 📊', 'success');
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-200 max-w-lg mx-auto">
      {/* Header Card */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">سجل القياسات البدنية</h2>
              <p className="text-xs text-zinc-500">حفظ دائم للقياسات واحتساب تلقائي للـ BMI</p>
            </div>
          </div>

          <button
            onClick={exportMeasurementsToExcel}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 px-3 py-2 rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel</span>
          </button>
        </div>

        {/* Class Selector Tabs */}
        {classes.length === 0 ? (
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-800 text-xs font-bold text-center">
            لا توجد فصول مضافة.
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {classes.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const count = students.filter((s) => s.classId === cls.id).length;
              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    triggerHaptic(30);
                    setSelectedClassId(cls.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 border min-h-[44px] ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{cls.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search Bar */}
        {classStudents.length > 2 && (
          <div className="relative pt-1">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث عن طالب لادخال أو عرض قياساته..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pr-9 pl-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Main Measurements Table / Cards */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-3 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <h3 className="text-xs font-extrabold text-zinc-800 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>طلاب {currentClass?.name || ''} ({filteredStudents.length})</span>
          </h3>
          <span className="text-[10px] text-zinc-400 font-bold">اضغط "تعديل" لإضافة البيانات</span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 text-xs font-bold">
            لا يوجد طلاب في هذا الفصل
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar rounded-2xl border border-zinc-100">
            <table className="w-full text-right text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-zinc-50 text-zinc-700 font-extrabold border-b border-zinc-200">
                  <th className="py-3 px-2 text-center w-10">#</th>
                  <th className="py-3 px-3">اسم الطالب</th>
                  <th className="py-3 px-2 text-center">الطول (سم)</th>
                  <th className="py-3 px-2 text-center">الوزن (كجم)</th>
                  <th className="py-3 px-2 text-center">BMI الكتلة</th>
                  <th className="py-3 px-2 text-center">جري 50م</th>
                  <th className="py-3 px-2 text-center">جري 600م</th>
                  <th className="py-3 px-2 text-center">الوثب سم</th>
                  <th className="py-3 px-2 text-center">ثني الجذع</th>
                  <th className="py-3 px-2 text-center">الضغط</th>
                  <th className="py-3 px-2 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-800">
                {filteredStudents.map((student, idx) => {
                  const m = measurements[student.id] || {};
                  const bmiInfo = calculateBMIDetails(m.weight, m.height);

                  return (
                    <tr key={student.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-2.5 px-2 text-center font-bold text-zinc-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-zinc-900">{student.name}</div>
                        {student.studentNumber && (
                          <div className="text-[10px] text-zinc-400">رقم: {student.studentNumber}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-zinc-700">
                        {m.height ? `${m.height} سم` : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-zinc-700">
                        {m.weight ? `${m.weight} كجم` : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {bmiInfo.bmi ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-xl text-[10px] font-black border ${bmiInfo.badgeClass}`}
                          >
                            {bmiInfo.bmi} ({bmiInfo.label})
                          </span>
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-zinc-700">
                        {m.sprint50m ? `${m.sprint50m} ث` : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-zinc-700">
                        {m.run600m || '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-zinc-700">
                        {m.standingLongJump ? `${m.standingLongJump} سم` : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-zinc-700">
                        {m.sitUps ? `${m.sitUps}` : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-zinc-700">
                        {m.pushUps ? `${m.pushUps}` : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => {
                            triggerHaptic(20);
                            setEditingStudent(student);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تعديل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Student Measurements Modal */}
      {editingStudent && (
        <EditMeasurementModal
          student={editingStudent}
          currentMeasurement={measurements[editingStudent.id] || { studentId: editingStudent.id }}
          onClose={() => setEditingStudent(null)}
          onSave={(data) => {
            updateStudentMeasurement(editingStudent.id, data);
            setEditingStudent(null);
          }}
        />
      )}
    </div>
  );
};

// Modal Component for editing a student's full measurements
interface EditMeasurementModalProps {
  student: Student;
  currentMeasurement: PhysicalMeasurement;
  onClose: () => void;
  onSave: (data: Partial<PhysicalMeasurement>) => void;
}

const EditMeasurementModal: React.FC<EditMeasurementModalProps> = ({
  student,
  currentMeasurement,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<PhysicalMeasurement>({
    studentId: student.id,
    height: currentMeasurement.height,
    weight: currentMeasurement.weight,
    sprint50m: currentMeasurement.sprint50m,
    run600m: currentMeasurement.run600m || '',
    standingLongJump: currentMeasurement.standingLongJump,
    sitUps: currentMeasurement.sitUps,
    pushUps: currentMeasurement.pushUps,
    flexibility: currentMeasurement.flexibility,
    agility: currentMeasurement.agility,
    balance: currentMeasurement.balance,
    notes: currentMeasurement.notes || '',
  });

  const liveBMI = calculateBMIDetails(form.weight, form.height);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>القياسات البدنية: {student.name}</span>
            </h3>
            <p className="text-xs text-zinc-500">ادخل بيانات القياسات والياقة البدنية للطالب</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Live BMI Banner */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-zinc-700">مؤشر كتلة الجسم التلقائي (BMI):</span>
            </div>
            {liveBMI.bmi ? (
              <span className={`px-3 py-1 rounded-xl text-xs font-black border ${liveBMI.badgeClass}`}>
                {liveBMI.bmi} ({liveBMI.label})
              </span>
            ) : (
              <span className="text-xs text-zinc-400 font-bold">ادخل الطول والوزن لاحتسابه</span>
            )}
          </div>

          {/* Core Body Measurements */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                <span>الطول (سم)</span>
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="170"
                value={form.height || ''}
                onChange={(e) =>
                  setForm({ ...form, height: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>الوزن (كجم)</span>
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="65"
                value={form.weight || ''}
                onChange={(e) =>
                  setForm({ ...form, weight: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Running Tests */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>جري 50م (ثواني)</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="7.5"
                value={form.sprint50m || ''}
                onChange={(e) =>
                  setForm({ ...form, sprint50m: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>جري 600م (د:ث)</span>
              </label>
              <input
                type="text"
                placeholder="2:30"
                value={form.run600m || ''}
                onChange={(e) => setForm({ ...form, run600m: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Jumps and Strength */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">الوثب الطويل (سم)</label>
              <input
                type="number"
                placeholder="180"
                value={form.standingLongJump || ''}
                onChange={(e) =>
                  setForm({ ...form, standingLongJump: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">ثني الجذع (بطن)</label>
              <input
                type="number"
                placeholder="25"
                value={form.sitUps || ''}
                onChange={(e) =>
                  setForm({ ...form, sitUps: e.target.value ? parseInt(e.target.value, 10) : undefined })
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">الضغط بالذراعين</label>
              <input
                type="number"
                placeholder="20"
                value={form.pushUps || ''}
                onChange={(e) =>
                  setForm({ ...form, pushUps: e.target.value ? parseInt(e.target.value, 10) : undefined })
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Flexibility, Agility, Balance */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">المرونة (سم)</label>
              <input
                type="number"
                step="0.5"
                placeholder="12"
                value={form.flexibility || ''}
                onChange={(e) =>
                  setForm({ ...form, flexibility: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">الرشاقة (ثانية)</label>
              <input
                type="number"
                step="0.1"
                placeholder="10.2"
                value={form.agility || ''}
                onChange={(e) =>
                  setForm({ ...form, agility: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1">التوازن (ثانية)</label>
              <input
                type="number"
                step="0.1"
                placeholder="15"
                value={form.balance || ''}
                onChange={(e) =>
                  setForm({ ...form, balance: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">ملاحظات بدنية أو رياضية</label>
            <textarea
              rows={2}
              placeholder="ملاحظات حول اللياقة أو التطور البدني..."
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-2.5 text-xs font-semibold outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>حفظ القياسات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
