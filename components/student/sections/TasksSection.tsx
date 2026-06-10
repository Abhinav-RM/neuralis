import React, { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { CheckSquare, BookOpen, Plus, X, Check, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { sound } from '../../../utils/sound';

const getDateKey = (date: Date) => date.toISOString().split('T')[0];
const getDaysRemaining = (dateStr: string) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(dateStr); d.setHours(0,0,0,0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000*60*60*24));
};

interface TasksSectionProps {
    assignments: any[];
    exams: any[];
    updateCollege: (u: any) => void;
}

export const TasksSection = React.memo<TasksSectionProps>(({ assignments, exams, updateCollege }) => {
    const [showAddAssignment, setShowAddAssignment] = useState(false);
    const [newAssignment, setNewAssignment] = useState({ title: '', subject: '', dueDate: '', reminders: [] as any[] });
    const [tempReminder, setTempReminder] = useState({ type: 'date', time: '09:00', at: '', message: '' });
    const [editingExams, setEditingExams] = useState(false);
    const [localExams, setLocalExams] = useState<{ id: string; subject: string; date: string }[]>([]);

    const handleAddAssignment = () => {
        if (!newAssignment.title || !newAssignment.subject || !newAssignment.dueDate) return;
        updateCollege({ assignments: [...assignments, { id: Date.now().toString(), ...newAssignment, completed: false }] });
        setNewAssignment({ title: '', subject: '', dueDate: '', reminders: [] });
        setShowAddAssignment(false);
        sound.playSuccess();
    };

    const handleSaveExams = () => {
        const updated = localExams
            .filter(r => r.subject.trim() && r.date)
            .map(r => {
                const existing = exams.find(e => e.id === r.id);
                return {
                    id: r.id,
                    subject: r.subject.trim(),
                    date: r.date,
                    reminders: existing?.reminders || [],
                    completed: existing?.completed || false
                };
            });
        updateCollege({ exams: updated });
        setEditingExams(false);
        sound.playSuccess();
    };

    const toggleAssignment = (id: string) => { updateCollege({ assignments: assignments.map(a => a.id === id ? { ...a, completed: !a.completed } : a) }); sound.playClick(); };
    const deleteAssignment = (id: string) => { updateCollege({ assignments: assignments.filter(a => a.id !== id) }); sound.playRobotConfirm(); };
    const deleteExam = (id: string) => { updateCollege({ exams: exams.filter(e => e.id !== id) }); sound.playRobotConfirm(); };

    const upcomingExams = exams.filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assignments */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><CheckSquare className="text-blue-400" /> Assignments</h2>
                    <button onClick={() => setShowAddAssignment(!showAddAssignment)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Plus size={20} /></button>
                </div>
                {showAddAssignment && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 space-y-3 p-4 bg-black/20 rounded-xl border border-white/5">
                        <input type="text" placeholder="Assignment Title" value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        <input type="text" placeholder="Subject" value={newAssignment.subject} onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-400">Due Date</label>
                                <input type="date" value={newAssignment.dueDate} min={getDateKey(new Date())} onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg space-y-3">
                            <p className="text-[10px] uppercase font-bold text-blue-400">Add Reminders</p>
                            <div className="grid grid-cols-2 gap-2">
                                <select value={tempReminder.type} onChange={(e) => setTempReminder({...tempReminder, type: e.target.value as any})} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500">
                                    <option value="date" className="bg-[#121214]">Specific Date</option>
                                    <option value="day-before" className="bg-[#121214]">Day Before</option>
                                </select>
                                <input type="time" value={tempReminder.time} onChange={(e) => setTempReminder({...tempReminder, time: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500" />
                            </div>
                            {tempReminder.type === 'date' && (<input type="date" value={tempReminder.at} onChange={(e) => setTempReminder({...tempReminder, at: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500" />)}
                            <input type="text" placeholder="Reminder Message (Optional)" value={tempReminder.message} onChange={(e) => setTempReminder({...tempReminder, message: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500" />
                            <Button size="sm" className="w-full py-1 text-[10px]" onClick={() => { setNewAssignment({ ...newAssignment, reminders: [...newAssignment.reminders, { ...tempReminder, id: Date.now().toString(), enabled: true }] }); setTempReminder({ type: 'date', time: '09:00', at: '', message: '' }); sound.playClick(); }}>+ Add Reminder</Button>
                            {newAssignment.reminders.length > 0 && (<div className="space-y-1 mt-2">{newAssignment.reminders.map((r, ri) => (<div key={r.id} className="flex justify-between items-center text-[10px] bg-black/40 p-1.5 rounded-lg border border-white/5"><span>{r.type === 'day-before' ? 'Day Before' : r.at} @ {r.time}</span><button onClick={() => setNewAssignment({...newAssignment, reminders: newAssignment.reminders.filter((_, idx) => idx !== ri)})} className="text-rose-400"><X size={10}/></button></div>))}</div>)}
                        </div>
                        <Button onClick={handleAddAssignment} className="w-full py-2 text-sm">Add Assignment</Button>
                    </motion.div>
                )}
                <div className="space-y-3">
                    {assignments.length === 0 ? (<div className="text-center py-6 text-gray-500 text-sm">No assignments yet.</div>) : (
                        assignments.map(assignment => (
                            <div key={assignment.id} className={clsx("p-3 rounded-xl border transition-all", assignment.completed ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" : "bg-black/20 border-white/5")}>
                                <div className="flex items-start gap-3">
                                    <button onClick={() => toggleAssignment(assignment.id)} className={clsx("mt-1 w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0", assignment.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-500 text-transparent")}><Check size={14} /></button>
                                    <div className="flex-1 min-w-0">
                                        <div className={clsx("font-medium truncate", assignment.completed && "line-through")}>{assignment.title}</div>
                                        <div className="text-[11px] text-gray-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                            <span className="truncate font-semibold text-gray-300">{assignment.subject}</span>
                                            <span>•</span>
                                            <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                                            <span>•</span>
                                            {assignment.completed ? (
                                                <span className="text-[10px] font-bold text-emerald-400 uppercase shrink-0">Completed</span>
                                            ) : (() => {
                                                const dr = getDaysRemaining(assignment.dueDate);
                                                return (
                                                    <span className={clsx("text-[10px] font-bold shrink-0", dr <= 3 ? "text-rose-400" : "text-blue-400")}>
                                                        {dr < 0 ? 'Overdue' : dr === 0 ? 'Today' : dr === 1 ? 'Tomorrow' : `${dr}d remaining`}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <button onClick={() => deleteAssignment(assignment.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Upcoming Exams */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><BookOpen className="text-blue-400" /> Upcoming Exams</h2>
                    {editingExams ? (
                        <div className="flex gap-2">
                            <button onClick={() => setEditingExams(false)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors text-gray-400">Cancel</button>
                            <button onClick={handleSaveExams} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-semibold transition-colors text-white">Save</button>
                        </div>
                    ) : (
                        <button onClick={() => {
                            setLocalExams(exams.map(e => ({ id: e.id, subject: e.subject, date: e.date })));
                            setEditingExams(true);
                            sound.playClick();
                        }} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/5 text-gray-300">
                            Edit Timetable
                        </button>
                    )}
                </div>
                {editingExams ? (
                    <div className="space-y-3 p-4 bg-black/20 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-400 mb-2">Configure subject dates below. Empty rows will be discarded on save.</p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {localExams.map((row, index) => (
                                <div key={row.id} className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Subject" 
                                        value={row.subject} 
                                        onChange={(e) => {
                                            const updated = [...localExams];
                                            updated[index].subject = e.target.value;
                                            setLocalExams(updated);
                                        }} 
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white" 
                                    />
                                    <input 
                                        type="date" 
                                        value={row.date} 
                                        onChange={(e) => {
                                            const updated = [...localExams];
                                            updated[index].date = e.target.value;
                                            setLocalExams(updated);
                                        }} 
                                        className="w-36 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white" 
                                    />
                                    <button 
                                        onClick={() => {
                                            setLocalExams(localExams.filter(item => item.id !== row.id));
                                            sound.playRobotConfirm();
                                        }} 
                                        className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => {
                                setLocalExams([...localExams, { id: (Date.now() + Math.random()).toString(), subject: '', date: '' }]);
                                sound.playClick();
                            }} 
                            className="w-full py-2 bg-white/5 border border-dashed border-white/10 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-all"
                        >
                            + Add Exam Row
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingExams.length === 0 ? (<div className="text-center py-6 text-gray-500 text-sm italic">No exams scheduled in the timetable.</div>) : (
                            exams.sort((a,b) => a.date.localeCompare(b.date)).map((exam) => {
                                const dr = getDaysRemaining(exam.date);
                                const done = exam.completed || dr < 0;
                                return (
                                    <div key={exam.id} className={clsx("p-3 rounded-xl border transition-all bg-black/20", done ? "border-white/5 opacity-60" : "border-white/5")}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white truncate">{exam.subject}</div>
                                                <div className="text-[11px] text-gray-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                    <span>{new Date(exam.date).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    {done ? (
                                                        <span className="text-[10px] font-bold text-emerald-400 uppercase shrink-0">Completed</span>
                                                    ) : (
                                                        <span className={clsx("text-[10px] font-bold shrink-0", dr <= 3 ? "text-rose-400" : "text-blue-400")}>
                                                            {dr < 0 ? 'Overdue' : dr === 0 ? 'Today' : dr === 1 ? 'Tomorrow' : `${dr}d remaining`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={() => deleteExam(exam.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </section>
        </div>
    );
});
TasksSection.displayName = 'TasksSection';
