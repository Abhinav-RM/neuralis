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
    const [showAddExam, setShowAddExam] = useState(false);
    const [newExam, setNewExam] = useState({ subject: '', date: '', reminders: [] as any[] });
    const [tempReminder, setTempReminder] = useState({ type: 'date', time: '09:00', at: '', message: '' });

    const handleAddAssignment = () => {
        if (!newAssignment.title || !newAssignment.subject || !newAssignment.dueDate) return;
        updateCollege({ assignments: [...assignments, { id: Date.now().toString(), ...newAssignment, completed: false }] });
        setNewAssignment({ title: '', subject: '', dueDate: '', reminders: [] });
        setShowAddAssignment(false);
        sound.playSuccess();
    };

    const handleAddExam = () => {
        if (!newExam.subject || !newExam.date) return;
        updateCollege({ exams: [...exams, { id: Date.now().toString(), ...newExam, completed: false }] });
        setNewExam({ subject: '', date: '', reminders: [] });
        setShowAddExam(false);
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
                                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2"><span className="truncate">{assignment.subject}</span><span>•</span><span>{new Date(assignment.dueDate).toLocaleDateString()}</span></div>
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
                    <button onClick={() => setShowAddExam(!showAddExam)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Plus size={20} /></button>
                </div>
                {showAddExam && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 space-y-3 p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-xs text-gray-500 uppercase font-bold">Subject</label><input type="text" value={newExam.subject} onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500" placeholder="Subject Name" /></div>
                            <div className="space-y-2"><label className="text-xs text-gray-500 uppercase font-bold">Date</label><input type="date" value={newExam.date} min={getDateKey(new Date())} onChange={(e) => setNewExam({ ...newExam, date: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500" /></div>
                            <div className="p-3 bg-white/5 rounded-lg space-y-3 col-span-2">
                                <p className="text-[10px] uppercase font-bold text-blue-400">Add Reminders</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <select value={tempReminder.type} onChange={(e) => setTempReminder({...tempReminder, type: e.target.value as any})} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"><option value="date" className="bg-[#121214]">Specific Date</option><option value="day-before" className="bg-[#121214]">Day Before</option></select>
                                    <input type="time" value={tempReminder.time} onChange={(e) => setTempReminder({...tempReminder, time: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500" />
                                </div>
                                {tempReminder.type === 'date' && (<input type="date" value={tempReminder.at} onChange={(e) => setTempReminder({...tempReminder, at: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500" />)}
                                <input type="text" placeholder="Reminder Message (Optional)" value={tempReminder.message} onChange={(e) => setTempReminder({...tempReminder, message: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500" />
                                <Button size="sm" className="w-full py-1 text-[10px]" onClick={() => { setNewExam({ ...newExam, reminders: [...newExam.reminders, { ...tempReminder, id: Date.now().toString(), enabled: true }] }); setTempReminder({ type: 'date', time: '09:00', at: '', message: '' }); sound.playClick(); }}>+ Add Reminder</Button>
                                {newExam.reminders.length > 0 && (<div className="space-y-1 mt-2">{newExam.reminders.map((r, ri) => (<div key={r.id} className="flex justify-between items-center text-[10px] bg-black/40 p-1.5 rounded-lg border border-white/5"><span>{r.type === 'day-before' ? 'Day Before' : r.at} @ {r.time}</span><button onClick={() => setNewExam({...newExam, reminders: newExam.reminders.filter((_, idx) => idx !== ri)})} className="text-rose-400"><X size={10}/></button></div>))}</div>)}
                            </div>
                        </div>
                        <Button onClick={handleAddExam} className="w-full py-2 text-sm">Add to Timetable</Button>
                    </motion.div>
                )}
                <div className="space-y-3">
                    {upcomingExams.length === 0 ? (<div className="text-center py-6 text-gray-500 text-sm italic">No exams scheduled in the timetable.</div>) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead><tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500 font-bold"><th className="py-3 px-4">Subject</th><th className="py-3 px-4 text-center">Date</th><th className="py-3 px-4 text-center">Remaining</th><th className="py-3 px-4 text-right">Action</th></tr></thead>
                                <tbody>
                                    {exams.sort((a,b) => a.date.localeCompare(b.date)).map((exam) => {
                                        const dr = getDaysRemaining(exam.date);
                                        const done = exam.completed || dr < 0;
                                        return (<tr key={exam.id} className={clsx("border-b border-white/5 group hover:bg-white/5 transition-colors", done && "opacity-50")}><td className="py-4 px-4 font-bold text-white">{exam.subject}</td><td className="py-4 px-4 text-center text-gray-400 text-sm">{new Date(exam.date).toLocaleDateString()}</td><td className="py-4 px-4 text-center">{done ? (<span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">Completed</span>) : (<span className={clsx("px-2 py-1 rounded-full text-[10px] font-bold", dr <= 3 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30")}>{dr} Days</span>)}</td><td className="py-4 px-4 text-right"><button onClick={() => deleteExam(exam.id)} className="p-2 text-gray-500 hover:text-rose-400 transition-colors"><Trash2 size={16} /></button></td></tr>);
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
});
TasksSection.displayName = 'TasksSection';
