import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Student, ClassItem } from '../types';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  User,
  Users,
  Building2,
  FileSpreadsheet,
  X,
  ChevronLeft,
} from 'lucide-react';
import { ImportStudentsModal } from './ImportStudentsModal';

export const StudentsView: React.FC = () => {
  const {
    classes,
    students,
    selectedClassId,
    setSelectedClassId,
    addClass,
    updateClass,
    deleteClass,
    addStudent,
    updateStudent,
    deleteStudent,
    setSelectedStudentId,
    triggerHaptic,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'students' | 'classes'>('students');

  // Student Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState<string>('all');

  // Student Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Student Form states
  const [formName, setFormName] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formMedicalNotes, setFormMedicalNotes] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTeacherNotes, setFormTeacherNotes] = useState('');

  // Class Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [formClassName, setFormClassName] = useState('');

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleCloseClassModal = () => {
    setIsClassModalOpen(false);
    setEditingClass(null);
    setFormClassName('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) handleCloseModal();
        if (isClassModalOpen) handleCloseClassModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isClassModalOpen]);

  const filteredStudents = students
    .filter((s) => (filterClassId === 'all' ? true : s.classId === filterClassId))
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  const handleOpenAddModal = () => {
    triggerHaptic(20);
    setEditingStudent(null);
    setFormName('');
    setFormClassId(selectedClassId || classes[0]?.id || '');
    setFormNationalId('');
    setFormMedicalNotes('');
    setFormPhone('');
    setFormTeacherNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (st: Student) => {
    triggerHaptic(20);
    setEditingStudent(st);
    setFormName(st.name);
    setFormClassId(st.classId);
    setFormNationalId(st.nationalId || '');
    setFormMedicalNotes(st.medicalNotes || '');
    setFormPhone(st.phone || '');
    setFormTeacherNotes(st.teacherNotes || '');
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formClassId) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        name: formName.trim(),
        classId: formClassId,
        nationalId: formNationalId.trim(),
        medicalNotes: formMedicalNotes.trim(),
        phone: formPhone.trim(),
        teacherNotes: formTeacherNotes.trim(),
      });
    } else {
      addStudent({
        name: formName.trim(),
        classId: formClassId,
        nationalId: formNationalId.trim(),
        medicalNotes: formMedicalNotes.trim(),
        phone: formPhone.trim(),
        teacherNotes: formTeacherNotes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  // Class Actions
  const handleOpenAddClassModal = () => {
    triggerHaptic(20);
    setEditingClass(null);
    setFormClassName('');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClassModal = (cls: ClassItem) => {
    triggerHaptic(20);
    setEditingClass(cls);
    setFormClassName(cls.name);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassName.trim()) return;

    if (editingClass) {
      updateClass(editingClass.id, formClassName.trim());
    } else {
      addClass(formClassName.trim());
    }

    setIsClassModalOpen(false);
  };

  const handleDeleteClassConfirm = (cls: ClassItem) => {
    const classStudentCount = students.filter((s) => s.classId === cls.id).length;
    const confirmMessage =
      classStudentCount > 0
        ? `تنبيه: الفصل "${cls.name}" يحتوي على ${classStudentCount} طالب. هل أنت تأكد من الحذف؟ سيمسح جميع الطلاب المرتبطين به.`
        : `هل أنت متأكد من حذف الفصل "${cls.name}"؟`;

    if (window.confirm(confirmMessage)) {
      triggerHaptic(30);
      deleteClass(cls.id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 font-sans space-y-3">
      {/* View Sub-tabs Switcher [الطلاب | الفصول] */}
      <div className="bg-white rounded-xl p-1 border border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-1 w-full">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              setActiveSubTab('students');
            }}
            className={`flex-1 py-2 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeSubTab === 'students'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة الطلاب ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              setActiveSubTab('classes');
            }}
            className={`flex-1 py-2 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeSubTab === 'classes'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>إدارة الفصول ({classes.length})</span>
          </button>
        </div>
      </div>

      {/* STUDENTS SUB-TAB */}
      {activeSubTab === 'students' && (
        <div className="space-y-3">
          {/* Top Header & Search Bar */}
          <div className="bg-white rounded-xl p-3 border border-zinc-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-zinc-400 absolute right-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو السجل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 bg-zinc-50 border border-zinc-200 text-xs font-semibold rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              {/* Class Filter */}
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 text-zinc-900 font-extrabold text-xs rounded-lg px-2.5 py-1.5 outline-none"
              >
                <option value="all">جميع الفصول</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(20);
                    setIsImportModalOpen(true);
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                  title="استيراد الطلاب من ملف Excel أو CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>استيراد</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة طالب</span>
                </button>
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 font-bold text-xs">
                لا يوجد طلاب مطابقون للبحث
              </div>
            ) : (
              filteredStudents.map((st, index) => {
                const cls = classes.find((c) => c.id === st.classId);

                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentId(st.id)}
                    className="px-3.5 py-2.5 flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-zinc-400 w-5 text-right">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-xs font-extrabold text-zinc-900 hover:text-emerald-700">
                          {st.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.2 rounded">
                            {cls?.name || 'فصل مجهول'}
                          </span>
                          {st.medicalNotes && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                              ⚠️ {st.medicalNotes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(st)}
                        className="p-1.5 text-zinc-400 hover:text-emerald-700 rounded-lg hover:bg-zinc-100 transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteStudent(st.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CLASSES SUB-TAB */}
      {activeSubTab === 'classes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-200">
            <div>
              <h3 className="text-xs font-black text-zinc-900">إدارة فصول المدرسة</h3>
              <p className="text-[10px] font-bold text-zinc-500">
                إضافة فصول جديدة وتعديل أسمائها وحذف الفصول
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddClassModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة فصل جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {classes.map((cls) => {
              const classStudentsCount = students.filter((s) => s.classId === cls.id).length;

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-xl border border-zinc-200 p-3 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-black text-sm">
                      {cls.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-900">{cls.name}</h4>
                      <span className="text-[10px] font-extrabold text-zinc-500">
                        {classStudentsCount} طالب مسجل
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterClassId(cls.id);
                        setActiveSubTab('students');
                      }}
                      className="px-2 py-1 text-[10px] font-black bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors cursor-pointer"
                      title="عرض طلاب هذا الفصل"
                    >
                      الطلاب
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditClassModal(cls)}
                      className="p-1.5 text-zinc-400 hover:text-emerald-700 rounded-lg hover:bg-zinc-100 cursor-pointer"
                      title="تعديل اسم الفصل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClassConfirm(cls)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 cursor-pointer"
                      title="حذف الفصل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full p-4 space-y-3 shadow-xl text-right">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-xs font-black text-zinc-900">
                {editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 text-zinc-400 hover:text-zinc-700 bg-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-extrabold text-zinc-700 block mb-1">
                  اسم الطالب الرباعي *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: عبدالله بن محمد العتيبي"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-zinc-700 block mb-1">
                  الفصل *
                </label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500"
                  required
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-extrabold text-zinc-700 block mb-1">
                    رقم الهوية / الإقامة
                  </label>
                  <input
                    type="text"
                    value={formNationalId}
                    onChange={(e) => setFormNationalId(e.target.value)}
                    placeholder="10XXXXXXXX"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-zinc-700 block mb-1">
                    رقم جوال ولي الأمر
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-amber-800 block mb-1">
                  ملاحظات صحية (ربو، إصابة، عذر)
                </label>
                <input
                  type="text"
                  value={formMedicalNotes}
                  onChange={(e) => setFormMedicalNotes(e.target.value)}
                  placeholder="مثال: ربو خفيف، عذر طبي..."
                  className="w-full bg-amber-50/50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs font-bold text-amber-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-zinc-700 block mb-1">
                  ملاحظات المعلم الخاصة
                </label>
                <textarea
                  value={formTeacherNotes}
                  onChange={(e) => setFormTeacherNotes(e.target.value)}
                  placeholder="ملاحظات سلوكية أو مهارية..."
                  rows={2}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black shadow-2xs cursor-pointer"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {isClassModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseClassModal();
          }}
        >
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full p-4 space-y-3 shadow-xl text-right">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-xs font-black text-zinc-900">
                {editingClass ? 'تعديل اسم الفصل' : 'إضافة فصل جديد'}
              </h3>
              <button
                type="button"
                onClick={handleCloseClassModal}
                className="p-1 text-zinc-400 hover:text-zinc-700 bg-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3">
              <div>
                <label className="text-[11px] font-extrabold text-zinc-700 block mb-1">
                  اسم الفصل *
                </label>
                <input
                  type="text"
                  value={formClassName}
                  onChange={(e) => setFormClassName(e.target.value)}
                  placeholder="مثال: أول / 1 أو سادس / أ"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleCloseClassModal}
                  className="px-3.5 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black shadow-2xs cursor-pointer"
                >
                  حفظ الفصل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Students Modal */}
      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};

