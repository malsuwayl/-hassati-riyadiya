import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, GraduationCap, UserPlus, X, Check } from 'lucide-react';

export const FloatingActionButton: React.FC = () => {
  const { classes, addClass, addStudent, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'class' | 'student' | null>(null);

  // Class Form state
  const [classForm, setClassForm] = useState({
    name: '',
    grade: 'الأول الثانوي',
    section: '1',
    period: 'الحصة الأولى',
    day: 'الأحد',
    notes: '',
  });

  // Student Form state
  const [studentForm, setStudentForm] = useState({
    name: '',
    classId: classes[0]?.id || '',
    studentNumber: '',
    nationalId: '',
    medicalNotes: '',
    phone: '',
    notes: '',
  });

  const handleOpenClassModal = () => {
    setIsOpen(false);
    setClassForm({
      name: '',
      grade: 'الأول الثانوي',
      section: '1',
      period: 'الحصة الأولى',
      day: 'الأحد',
      notes: '',
    });
    setActiveModal('class');
  };

  const handleOpenStudentModal = () => {
    setIsOpen(false);
    setStudentForm({
      name: '',
      classId: classes[0]?.id || '',
      studentNumber: '',
      nationalId: '',
      medicalNotes: '',
      phone: '',
      notes: '',
    });
    setActiveModal('student');
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;
    addClass(classForm);
    setActiveModal(null);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name.trim()) return;
    if (!studentForm.classId && classes.length > 0) {
      studentForm.classId = classes[0].id;
    }
    if (!studentForm.classId) {
      showToast('يرجى إدخال فصل دراسي أولاً قبل إضافة الطالب', 'warning');
      return;
    }
    addStudent(studentForm);
    setActiveModal(null);
  };

  return (
    <>
      {/* Floating Action Button (FAB) Container - Bottom Right */}
      <div className="fixed bottom-20 right-4 z-40 no-print flex flex-col items-start">
        {/* Expanded Quick Options Menu */}
        {isOpen && (
          <div className="mb-3 space-y-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
            <button
              onClick={handleOpenStudentModal}
              className="flex items-center gap-2.5 bg-white text-zinc-900 px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-100 hover:bg-emerald-50 text-xs font-bold transition-all active:scale-95 text-right w-44 justify-end"
            >
              <span>إضافة طالب جديد</span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={handleOpenClassModal}
              className="flex items-center gap-2.5 bg-white text-zinc-900 px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-100 hover:bg-emerald-50 text-xs font-bold transition-all active:scale-95 text-right w-44 justify-end"
            >
              <span>إضافة فصل دراسي</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Main Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-13 h-13 rounded-2xl text-white shadow-xl flex items-center justify-center transition-all duration-200 active:scale-90 border border-emerald-400 ${
            isOpen
              ? 'bg-zinc-800 rotate-45'
              : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-600/30 hover:scale-105'
          }`}
          aria-label="إضافة سريعة"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-30 no-print"
        />
      )}

      {/* Quick Add Class Modal */}
      {activeModal === 'class' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span>إضافة فصل دراسي جديد</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">اسم الفصل *</label>
                <input
                  type="text"
                  required
                  placeholder="الصف الأول الثانوي - 1"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">المرحلة</label>
                  <input
                    type="text"
                    placeholder="الأول الثانوي"
                    value={classForm.grade}
                    onChange={(e) => setClassForm({ ...classForm, grade: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">الحصة</label>
                  <input
                    type="text"
                    placeholder="الحصة الأولى"
                    value={classForm.period}
                    onChange={(e) => setClassForm({ ...classForm, period: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">ملاحظات الفصل</label>
                <input
                  type="text"
                  placeholder="موقع الملعب أو تفاصيل التمارين..."
                  value={classForm.notes}
                  onChange={(e) => setClassForm({ ...classForm, notes: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ الفصل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Student Modal */}
      {activeModal === 'student' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>إضافة طالب جديد</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">اسم الطالب الرباعي *</label>
                <input
                  type="text"
                  required
                  placeholder="عبدالله بن محمد العتيبي"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">الفصل *</label>
                  {classes.length === 0 ? (
                    <p className="text-xs text-red-500 font-bold">يرجى إضافة فصل أولاً</p>
                  ) : (
                    <select
                      value={studentForm.classId || classes[0]?.id}
                      onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">رقم الطالب / الهوية</label>
                  <input
                    type="text"
                    placeholder="101"
                    value={studentForm.studentNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, studentNumber: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-800 mb-1">
                  تنبيهات صحية / إصابات (مثال: ربو، كسر قادم)
                </label>
                <input
                  type="text"
                  placeholder="ربو خفيف..."
                  value={studentForm.medicalNotes}
                  onChange={(e) => setStudentForm({ ...studentForm, medicalNotes: e.target.value })}
                  className="w-full bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">رقم جوال ولي الأمر</label>
                <input
                  type="tel"
                  placeholder="0501234567"
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={classes.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ الطالب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
