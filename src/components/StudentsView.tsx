import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { parseStudentsFile } from '../utils/fileImportExport';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  AlertCircle,
  X,
  Check,
  UserCheck,
  Award,
  AlertTriangle,
  ArrowRightLeft,
  FileText,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';

export const StudentsView: React.FC = () => {
  const {
    students,
    classes,
    addStudent,
    batchAddStudents,
    updateStudent,
    deleteStudent,
    assignStudentToClass,
    getStudentSummaryStats,
    selectedClassId,
    setSelectedClassId,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState<string>(selectedClassId || 'ALL');

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const defaultClassId = filterClassId === 'ALL' ? classes[0]?.id || 'class-1' : filterClassId;
      const { newStudents, newClassesToCreate } = await parseStudentsFile(file, defaultClassId, classes);

      if (newStudents.length === 0) {
        showToast('لم يتم العثور على أي أسماء طلاب في الملف', 'error');
        return;
      }

      batchAddStudents(newStudents, newClassesToCreate);
    } catch (err: any) {
      showToast(`خطأ في قراءة الملف: ${err?.message || 'تنسيق غير مدعوم'}`, 'error');
    }
  };

  React.useEffect(() => {
    if (selectedClassId) {
      setFilterClassId(selectedClassId);
    }
  }, [selectedClassId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    classId: classes[0]?.id || 'class-1',
    nationalId: '',
    medicalNotes: '',
    phone: '',
    notes: '',
  });

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      classId: filterClassId === 'ALL' ? classes[0]?.id || 'class-1' : filterClassId,
      nationalId: '',
      medicalNotes: '',
      phone: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      name: s.name,
      classId: s.classId,
      nationalId: s.nationalId || '',
      medicalNotes: s.medicalNotes || '',
      phone: s.phone || '',
      notes: s.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, formData);
    } else {
      addStudent(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (s: Student) => {
    if (confirm(`هل أنت تأكد من حذف الطالب "${s.name}"؟`)) {
      deleteStudent(s.id);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.includes(searchQuery) ||
      (s.nationalId && s.nationalId.includes(searchQuery)) ||
      (s.phone && s.phone.includes(searchQuery));

    const matchesClass = filterClassId === 'ALL' || s.classId === filterClassId;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Header & Actions */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 emerald-card-shadow space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>سجل الطلاب</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              إجمالي الطلاب المسجلين: <span className="font-bold text-emerald-700">{students.length}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs px-3 py-2.5 rounded-2xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>استيراد إكسل/CSV</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>

            <button
              onClick={openAddModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طالب</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Class Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث باسم الطالب أو رقم الهوية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pr-9 pl-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 text-xs font-semibold text-zinc-800 outline-none focus:border-emerald-500"
            >
              <option value="ALL">جميع الفصول ({students.length} طالب)</option>
              {classes.map((c) => {
                const count = students.filter((s) => s.classId === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({count} طالب)
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Student List Grid */}
      <div className="space-y-2.5">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-zinc-300">
            <p className="text-sm font-bold text-zinc-700">لم يتم العثور على طلاب</p>
            <p className="text-xs text-zinc-400 mt-1">
              جرب تغيير عبارة البحث أو الفصل المحدد، أو أضف طالباً جديداً.
            </p>
            <button
              onClick={openAddModal}
              className="mt-3 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              + إضافة طالب
            </button>
          </div>
        ) : (
          filteredStudents.map((st) => {
            const cls = classes.find((c) => c.id === st.classId);
            const stats = getStudentSummaryStats(st.id);

            return (
              <div
                key={st.id}
                className="bg-white p-3.5 rounded-3xl border border-emerald-100 emerald-card-shadow transition-all hover:border-emerald-300 relative space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setSelectedStudentForProfile(st)}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-base flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-900 hover:text-emerald-700 transition-colors">
                        {st.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">
                          {cls?.name || 'غير محدد'}
                        </span>
                        {st.phone && (
                          <span className="text-zinc-400 flex items-center gap-0.5 font-medium">
                            <Phone className="w-3 h-3" />
                            {st.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(st)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(st)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Medical Warning Badge */}
                {st.medicalNotes && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-2xl text-xs flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">تنبيه صحي: {st.medicalNotes}</span>
                  </div>
                )}

                {/* Stats Chips & Assign Class Quick Bar */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-600 font-bold">
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg">
                      ⭐ {stats.totalParticipations}
                    </span>
                    <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg">
                      🏆 {stats.totalExcellences}
                    </span>
                    <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded-lg">
                      ⚠️ {stats.totalViolations}
                    </span>
                  </div>

                  {/* Assign Class Quick Dropdown */}
                  <div className="flex items-center gap-1">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-400" />
                    <select
                      value={st.classId}
                      onChange={(e) => assignStudentToClass(st.id, e.target.value)}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold py-1 px-2 rounded-xl outline-none"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          نقل إلى: {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">
                {editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">اسم الطالب الرباعي *</label>
                <input
                  type="text"
                  required
                  placeholder="عبدالله بن محمد العتيبي"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">الفصل المخصص *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">رقم الهوية / الأكاديمي</label>
                  <input
                    type="text"
                    placeholder="1102938471"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>ملاحظات صحية / إصابات (مهم جداً للرياضة)</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: ربو خفيف، إصابة رباط صليبي، عذر طبي..."
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  className="w-full bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold text-amber-900 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">رقم هاتف ولي الأمر</label>
                <input
                  type="tel"
                  placeholder="0501234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">ملاحظات معلم البدنية</label>
                <textarea
                  rows={2}
                  placeholder="مستوى الطالب الكروي والرياضي..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStudent ? 'تحديث البيانات' : 'إضافة الطالب'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile Card Modal */}
      {selectedStudentForProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                  {selectedStudentForProfile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900">{selectedStudentForProfile.name}</h3>
                  <p className="text-xs text-emerald-700 font-bold">
                    {classes.find((c) => c.id === selectedStudentForProfile.classId)?.name || 'غير محدد'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForProfile(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Stats Summary */}
            {(() => {
              const stats = getStudentSummaryStats(selectedStudentForProfile.id);
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                      <span className="text-xs font-bold text-emerald-700 block">درجة التقييم التراكمية</span>
                      <span className="text-2xl font-black text-emerald-900 mt-1 block">
                        {stats.totalScore} نقطة
                      </span>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                      <span className="text-xs font-bold text-blue-700 block">نسبة الحضور التراكمية</span>
                      <span className="text-2xl font-black text-blue-900 mt-1 block">
                        %{stats.attendanceRate}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="bg-zinc-50 p-2 rounded-xl">
                      <span className="text-[10px] text-zinc-500 block">المشاركات</span>
                      <span className="font-bold text-zinc-900 text-sm">⭐ {stats.totalParticipations}</span>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-xl">
                      <span className="text-[10px] text-amber-700 block">التميز</span>
                      <span className="font-bold text-amber-900 text-sm">🏆 {stats.totalExcellences}</span>
                    </div>
                    <div className="bg-red-50 p-2 rounded-xl">
                      <span className="text-[10px] text-red-700 block">المخالفات</span>
                      <span className="font-bold text-red-900 text-sm">⚠️ {stats.totalViolations}</span>
                    </div>
                    <div className="bg-orange-50 p-2 rounded-xl">
                      <span className="text-[10px] text-orange-700 block">الإنذارات</span>
                      <span className="font-bold text-orange-900 text-sm">📢 {stats.totalWarnings}</span>
                    </div>
                  </div>

                  {selectedStudentForProfile.medicalNotes && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl text-xs space-y-1">
                      <span className="font-bold block flex items-center gap-1 text-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        السجل الطبي والحالات الخاصة:
                      </span>
                      <p className="font-semibold text-amber-950">{selectedStudentForProfile.medicalNotes}</p>
                    </div>
                  )}

                  {selectedStudentForProfile.phone && (
                    <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 text-xs flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">هاتف ولي الأمر:</span>
                      <a
                        href={`tel:${selectedStudentForProfile.phone}`}
                        className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {selectedStudentForProfile.phone}
                      </a>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudentForProfile(null)}
                className="w-full bg-zinc-900 text-white font-bold text-xs py-2.5 rounded-xl"
              >
                إغلاق الملف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
