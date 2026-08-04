import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2 } from 'lucide-react';

export const GradesView: React.FC = () => {
  const {
    classes,
    students,
    selectedClassId,
    setSelectedClassId,
    assessments,
    grades,
    addAssessmentItem,
    deleteAssessmentItem,
    setStudentGradeScore,
    triggerHaptic,
    setSelectedStudentId,
  } = useApp();

  const [isAddingAssessment, setIsAddingAssessment] = useState(false);
  const [newAssName, setNewAssName] = useState('');
  const [newAssMax, setNewAssMax] = useState('10');

  const classStudents = students.filter((s) => s.classId === selectedClassId);

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssName.trim()) return;
    const maxScore = parseFloat(newAssMax) || 10;
    addAssessmentItem(newAssName, maxScore);
    setNewAssName('');
    setNewAssMax('10');
    setIsAddingAssessment(false);
  };

  const handleDeleteAssessment = (id: string, name: string) => {
    if (window.confirm(`هل أنت تأكد من إلغاء/حذف بند الدرجات "${name}"؟`)) {
      triggerHaptic(30);
      deleteAssessmentItem(id);
    }
  };

  const totalMaxScore = assessments.reduce((sum, a) => sum + a.maxScore, 0);

  return (
    <div className="max-w-4xl mx-auto px-3 py-3 font-sans space-y-3">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-3 border border-zinc-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-black text-zinc-600">الفصل:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 text-zinc-900 font-extrabold text-xs rounded-lg px-2.5 py-1.5 outline-none"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(20);
            setIsAddingAssessment(!isAddingAssessment);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة بند تقييم</span>
        </button>
      </div>

      {/* Add Assessment Inline Form */}
      {isAddingAssessment && (
        <form
          onSubmit={handleCreateAssessment}
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2 text-right"
        >
          <h3 className="text-xs font-black text-emerald-950">إضافة بند درجات جديد</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-extrabold text-zinc-600 block mb-1">اسم البند</label>
              <input
                type="text"
                placeholder="مثال: الواجبات"
                value={newAssName}
                onChange={(e) => setNewAssName(e.target.value)}
                className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-zinc-600 block mb-1">الدرجة العظمى</label>
              <input
                type="number"
                min="1"
                max="100"
                value={newAssMax}
                onChange={(e) => setNewAssMax(e.target.value)}
                className="w-full bg-white border border-zinc-200 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingAssessment(false)}
              className="px-3 py-1 bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black cursor-pointer"
            >
              حفظ
            </button>
          </div>
        </form>
      )}

      {/* Spreadsheet Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
        <table className="w-full text-right border-collapse min-w-[550px]">
          <thead>
            <tr className="bg-zinc-100/80 text-zinc-800 text-xs font-black border-b border-zinc-200">
              <th className="p-2.5 w-8 text-center border-l border-zinc-200">#</th>
              <th className="p-2.5 min-w-[150px] border-l border-zinc-200">اسم الطالب</th>
              {assessments.map((ass) => (
                <th key={ass.id} className="p-2 text-center border-l border-zinc-200 min-w-[100px] group">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteAssessment(ass.id, ass.name)}
                      className="text-zinc-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                      title="إلغاء/حذف هذا البند"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-center flex-1">
                      <span>{ass.name}</span>
                      <span className="text-[10px] font-bold text-zinc-400 block">({ass.maxScore})</span>
                    </div>
                  </div>
                </th>
              ))}
              <th className="p-2.5 text-center bg-emerald-50 text-emerald-950 font-black min-w-[80px]">
                المجموع ({totalMaxScore})
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 text-xs font-bold text-zinc-800">
            {classStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={assessments.length + 3}
                  className="p-6 text-center text-zinc-400 font-bold"
                >
                  لا يوجد طلاب في هذا الفصل
                </td>
              </tr>
            ) : (
              classStudents.map((st, idx) => {
                const studentScores = grades[st.id] || {};
                let studentTotal = 0;

                assessments.forEach((ass) => {
                  const score = studentScores[ass.id];
                  if (score !== undefined && !isNaN(score)) {
                    studentTotal += score;
                  }
                });

                return (
                  <tr key={st.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-2 text-center text-zinc-400 font-black border-l border-zinc-100">{idx + 1}</td>
                    <td className="p-2 border-l border-zinc-100">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(st.id)}
                        className="font-extrabold text-zinc-900 hover:text-emerald-700 text-right truncate block cursor-pointer"
                      >
                        {st.name}
                      </button>
                    </td>

                    {assessments.map((ass) => {
                      const score = studentScores[ass.id] ?? '';
                      return (
                        <td key={ass.id} className="p-1.5 text-center border-l border-zinc-100">
                          <input
                            type="number"
                            min="0"
                            max={ass.maxScore}
                            step="0.5"
                            value={score}
                            placeholder="-"
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              setStudentGradeScore(st.id, ass.id, val);
                            }}
                            className="w-14 text-center font-extrabold text-xs py-1 bg-zinc-50 border border-zinc-200 rounded focus:border-emerald-600 outline-none"
                          />
                        </td>
                      );
                    })}

                    <td className="p-2 text-center bg-emerald-50/50 text-emerald-950 font-black">
                      {studentTotal}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

