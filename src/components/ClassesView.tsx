import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClassItem } from '../types';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Users,
  Clock,
  Calendar,
  X,
  Check,
  ChevronLeft,
} from 'lucide-react';

export const ClassesView: React.FC = () => {
  const { classes, students, addClass, updateClass, deleteClass, setSelectedClassId, setActiveTab } =
    useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    grade: 'الأول الثانوي',
    section: '1',
    period: 'الحصة الأولى',
    day: 'الأحد',
    notes: '',
  });

  const openAddModal = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      grade: 'الأول الثانوي',
      section: '1',
      period: 'الحصة الأولى',
      day: 'الأحد',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cls: ClassItem) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      grade: cls.grade,
      section: cls.section,
      period: cls.period,
      day: cls.day,
      notes: cls.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingClass) {
      updateClass(editingClass.id, formData);
    } else {
      addClass(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (cls: ClassItem) => {
    if (confirm(`هل أنت تأكد من حذف فصل "${cls.name}"؟`)) {
      deleteClass(cls.id);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-emerald-100 emerald-card-shadow">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <span>إدارة الحصص والفصول الدراسية</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            إجمالي الفصول المضافة: <span className="font-bold text-emerald-700">{classes.length}</span>
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فصل</span>
        </button>
      </div>

      {/* Classes List */}
      <div className="space-y-3">
        {classes.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-zinc-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2">
              <GraduationCap className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-zinc-700">لا توجد حصص مضافة</p>
            <p className="text-xs text-zinc-400 mt-1">قم بإضافة الفصول والحصص لتتمكن من تحضير الطلاب.</p>
            <button
              onClick={openAddModal}
              className="mt-4 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              + إضافة فصل جديد
            </button>
          </div>
        ) : (
          classes.map((cls) => {
            const classStudents = students.filter((s) => s.classId === cls.id);
            return (
              <div
                key={cls.id}
                className="bg-white p-4 rounded-3xl border border-emerald-100 emerald-card-shadow space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                      {cls.section || '1'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-900">{cls.name}</h3>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">{cls.grade}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cls)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setActiveTab('students');
                    }}
                    className="flex items-center gap-1 bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 text-zinc-700 px-2.5 py-1 rounded-xl font-medium transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{classStudents.length} طالب (عرض القائمة)</span>
                  </button>
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{cls.period}</span>
                  </span>
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-xl font-medium">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>{cls.day}</span>
                  </span>
                </div>

                {cls.notes && (
                  <p className="text-xs text-zinc-500 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    💡 {cls.notes}
                  </p>
                )}

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-zinc-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setActiveTab('students');
                    }}
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs py-2.5 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>عرض الطلاب</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setActiveTab('attendance');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>ابدأ التحضير</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">
                {editingClass ? 'تعديل بيانات الفصل' : 'إضافة فصل جديد'}
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
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  اسم الفصل / الشعبة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الصف الأول الثانوي - 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">المرحلة / الصف</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                  >
                    <option value="الأول الابتدائي">الأول الابتدائي</option>
                    <option value="الثاني الابتدائي">الثاني الابتدائي</option>
                    <option value="الثالث الابتدائي">الثالث الابتدائي</option>
                    <option value="الرابع الابتدائي">الرابع الابتدائي</option>
                    <option value="الخامس الابتدائي">الخامس الابتدائي</option>
                    <option value="السادس الابتدائي">السادس الابتدائي</option>
                    <option value="الأول المتوسط">الأول المتوسط</option>
                    <option value="الثاني المتوسط">الثاني المتوسط</option>
                    <option value="الثالث المتوسط">الثالث المتوسط</option>
                    <option value="الأول الثانوي">الأول الثانوي</option>
                    <option value="الثاني الثانوي">الثاني الثانوي</option>
                    <option value="الثالث الثانوي">الثالث الثانوي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">الشعبة / الفصل</label>
                  <input
                    type="text"
                    placeholder="1"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">الحصة</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                  >
                    <option value="الحصة الأولى">الحصة الأولى</option>
                    <option value="الحصة الثانية">الحصة الثانية</option>
                    <option value="الحصة الثالثة">الحصة الثالثة</option>
                    <option value="الحصة الرابعة">الحصة الرابعة</option>
                    <option value="الحصة الخامسة">الحصة الخامسة</option>
                    <option value="الحصة السادسة">الحصة السادسة</option>
                    <option value="الحصة السابعة">الحصة السابعة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">اليوم</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                  >
                    <option value="الأحد">الأحد</option>
                    <option value="الإثنين">الإثنين</option>
                    <option value="الثلاثاء">الثلاثاء</option>
                    <option value="الأربعاء">الأربعاء</option>
                    <option value="الخميس">الخميس</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول موقع التمارين أو الأنشطة..."
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
                  <span>{editingClass ? 'حفظ التغييرات' : 'إضافة الفصل'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
