import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { getDateKey } from '../../utils/helpers';
import { BookOpen, Clock, CheckSquare, CreditCard, Calendar, ChevronLeft, ChevronRight, Check, X, Minus, Edit2, Save, Pause, Play, RotateCcw, Plus, Trash2, Lock, Trophy, LayoutList } from 'lucide-react';
import { ScrollableTabs } from '../ui/ScrollableTabs';
import { AttendanceRecord, Assignment } from '../../types';
import { sound } from '../../utils/sound';
import clsx from 'clsx';

export const College: React.FC = () => {
    const { state, updateCollege, setPendingAction } = useApp();
    const { college } = state;
    const { dailyFlags, assignments, lastHomeworkCheck } = college;
    const [view, setView] = useState<'dashboard' | 'attendance' | 'remarks' | 'exams'>('dashboard');

    const [editingTimetable, setEditingTimetable] = useState(false);
    const [localTimetable, setLocalTimetable] = useState<typeof college.timetable>(college.timetable);
    const [showFocusMode, setShowFocusMode] = useState(false);
    const [showHomeworkModal, setShowHomeworkModal] = useState(false);
    const [showAddAssignment, setShowAddAssignment] = useState(false);
    const [showAddExam, setShowAddExam] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const currentDay = currentTime.getDay(); // 0-6
    const currentHour = currentTime.getHours();

    // REAL-LIFE ATTENDANCE LOGIC
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const allRecords = Object.values(college.attendanceHistory) as AttendanceRecord[];
    const records = allRecords.filter(r => {
        const [y, m] = r.date.split('-').map(Number);
        return (m - 1) === currentMonth && y === currentYear;
    });
    const hasRecords = records.length > 0;
    
    // Calculate attendance considering Leave as Present
    // And including future weekends in the current month for "Projected Attendance"
    
    let presentDays = 0;
    let leaveDays = 0;
    let absentDays = 0;

    records.forEach(r => {
        const remark = college.remarks[r.date];
        const isHalf = remark?.isHalfDay;
        const weight = isHalf ? 0.5 : 1;
        
        const status = r.status;
        if (status === 'present') {
            presentDays += weight;
        } else if (status === 'leave') {
            leaveDays += weight;
        } else if (status === 'absent-personal') {
            absentDays += weight;
        }
    });
    
    const effectivePresent = presentDays + leaveDays;
    const totalCalcDays = effectivePresent + absentDays;
    const percentage = totalCalcDays === 0 ? 0 : (effectivePresent / totalCalcDays) * 100;

    const TARGET = 0.75; 
    let attendanceStatus = { type: 'safe', count: 0, msg: '' };

    if (totalCalcDays > 0) {
        if (effectivePresent / totalCalcDays >= TARGET) {
            const safeSkips = Math.floor((effectivePresent - (TARGET * totalCalcDays)) / TARGET);
            attendanceStatus = { type: 'safe', count: safeSkips, msg: 'Safe Skips' };
        } else {
            const needed = Math.ceil(((TARGET * totalCalcDays) - effectivePresent) / (1 - TARGET));
            attendanceStatus = { type: 'danger', count: needed, msg: 'Must Attend' };
        }
    }

    // Daily Homework Check Effect
    useEffect(() => {
        const now = new Date();
        const checkHour = college.homeworkReminderHour || 20;
        const todayStr = getDateKey(now);
        const lastCheck = lastHomeworkCheck;
        const isDone = dailyFlags.homework;
        
        // Only run on Weekdays (Mon=1 to Fri=5)
        const day = now.getDay();
        const isWeekday = day !== 0 && day !== 6;

        if (isWeekday && now.getHours() >= checkHour && !isDone && lastCheck !== todayStr) {
            setShowHomeworkModal(true);
            updateCollege({ lastHomeworkCheck: todayStr });
        }
    }, [dailyFlags.homework, college.homeworkReminderHour, lastHomeworkCheck, updateCollege]);

    // Pending Action Effect
    useEffect(() => {
        if (state.pendingAction?.module === 'college') {
            if (state.pendingAction.type === 'homework') {
                setShowHomeworkModal(true);
            }
            setPendingAction(null);
        }
    }, [state.pendingAction, setPendingAction]);

    const toggleDaily = (key: keyof typeof dailyFlags) => {
        const newVal = !dailyFlags[key];
        updateCollege({
            dailyFlags: { ...dailyFlags, [key]: newVal },
            ...(newVal ? {
                booksPackedCount: key === 'books' ? college.booksPackedCount + 1 : college.booksPackedCount,
                idCardRemembered: key === 'idCard' ? college.idCardRemembered + 1 : college.idCardRemembered,
                homeworkCompleted: key === 'homework' ? college.homeworkCompleted + 1 : college.homeworkCompleted
            } : {})
        });
        if (newVal) sound.playSuccess();
        else sound.playClick();
    };

    // Assignment Handlers
    const addAssignment = (subject: string, title: string, dueDate: string) => {
        if (!subject || !title || !dueDate) return;
        const newAssignment: Assignment = {
            id: Date.now().toString(),
            subject,
            title,
            dueDate,
            completed: false
        };
        updateCollege({ assignments: [...college.assignments, newAssignment] });
        setShowAddAssignment(false);
        sound.playSuccess();
    };

    const toggleAssignment = (id: string) => {
        const updated = college.assignments.map(a => a.id === id ? { ...a, completed: !a.completed } : a);
        updateCollege({ assignments: updated });
        sound.playClick();
    };

    const deleteAssignment = (id: string) => {
        const updated = college.assignments.filter(a => a.id !== id);
        updateCollege({ assignments: updated });
        sound.playRobotConfirm();
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <ScrollableTabs className="flex-1 min-w-0">
                    <button onClick={() => setView('dashboard')} className={clsx("font-heading font-bold text-base sm:text-lg px-2 transition-colors shrink-0", view === 'dashboard' ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                        Dashboard
                    </button>
                    <button onClick={() => setView('attendance')} className={clsx("font-heading font-bold text-base sm:text-lg px-2 transition-colors shrink-0", view === 'attendance' ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                        Attendance
                    </button>
                    <button onClick={() => setView('remarks')} className={clsx("font-heading font-bold text-base sm:text-lg px-2 transition-colors shrink-0", view === 'remarks' ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                        Remarks
                    </button>
                    <button onClick={() => setView('exams')} className={clsx("font-heading font-bold text-base sm:text-lg px-2 transition-colors shrink-0", view === 'exams' ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                        Exams
                    </button>
                </ScrollableTabs>
                <Button variant="secondary" size="sm" onClick={() => setShowFocusMode(true)} className="gap-2 shrink-0 whitespace-nowrap">
                    <Clock size={16} /> Focus Mode
                </Button>
            </div>

            {view === 'dashboard' ? (
                <div className="grid md:grid-cols-2 gap-6 animate-slide-up">
                    <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between">
                        <div className="flex justify-between items-start z-10">
                            <div>
                                <h2 className="text-3xl font-display font-bold text-white mb-1">{percentage.toFixed(2)}%</h2>
                                <div className="flex gap-3 text-[10px] text-gray-500 uppercase font-bold">
                                    <span className="text-success">P: {presentDays}</span>
                                    <span className="text-accent">L: {leaveDays}</span>
                                    <span className="text-danger">A: {absentDays}</span>
                                </div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1">Attendance of {currentTime.toLocaleString('default', { month: 'long' })}</p>
                            </div>
                            <div className={clsx("px-3 py-1 rounded-full text-xs font-bold uppercase", 
                                attendanceStatus.type === 'safe' ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                            )}>
                                {attendanceStatus.type === 'safe' ? 'Safe Zone' : 'Danger Zone'}
                            </div>
                        </div>
                        <div className="w-full bg-gray-800 h-2 rounded-full mt-6 mb-2 overflow-hidden">
                            <div className={clsx("h-full transition-all duration-1000", percentage >= 75 ? "bg-success" : "bg-danger")} style={{ width: `${percentage}%` }} />
                        </div>
                        <p className="text-sm text-gray-400">
                            {attendanceStatus.type === 'safe' 
                                ? `You can safely skip ${attendanceStatus.count} more classes.` 
                                : `You need to attend ${attendanceStatus.count} consecutive classes to recover.`}
                        </p>
                    </div>

                    <div className="glass-panel p-6 rounded-3xl border border-white/10">
                        <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                            <CheckSquare className="text-accent" size={20} /> Tactical Loadout
                        </h3>
                        <div className="space-y-3">
                            <LoadoutItem label="ID Card" checked={dailyFlags.idCard} onClick={() => toggleDaily('idCard')} icon={CreditCard} />
                            <LoadoutItem label="Books Packed" checked={dailyFlags.books} onClick={() => toggleDaily('books')} icon={BookOpen} />
                            <LoadoutItem label="Homework Done" checked={dailyFlags.homework} onClick={() => toggleDaily('homework')} icon={Edit2} />
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-gray-500">
                            <span className="flex items-center gap-2"> Next Bag Check:</span>
                            <span className="font-mono text-accent">{college.booksReminderHour.toString().padStart(2, '0')}:00</span>
                        </div>
                    </div>

                    {/* Assignment Tracker */}
                    <div className="md:col-span-2 glass-panel p-6 rounded-3xl border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                                <BookOpen className="text-accent" size={20} /> Active Assignments
                            </h3>
                            <Button size="sm" onClick={() => setShowAddAssignment(true)} className="gap-2"><Plus size={16}/> New</Button>
                        </div>
                        
                        <div className="space-y-2">
                            {assignments.filter(a => !a.completed).length === 0 && (
                                <p className="text-gray-500 text-sm text-center py-4 italic">No pending assignments. Clear skies.</p>
                            )}
                            {assignments.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map((assign) => (
                                <div key={assign.id} className={clsx("p-4 rounded-xl border flex items-center justify-between transition-all", assign.completed ? "bg-white/5 border-white/5 opacity-50" : "bg-white/5 border-white/10 hover:border-accent")}>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => toggleAssignment(assign.id)} className={clsx("w-5 h-5 rounded border flex items-center justify-center transition-colors", assign.completed ? "bg-accent border-accent" : "border-gray-500")}>
                                            {assign.completed && <Check size={12} className="text-white"/>}
                                        </button>
                                        <div>
                                            <p className={clsx("font-bold text-sm", assign.completed && "line-through text-gray-500")}>{assign.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-white">{assign.subject}</span>
                                                <span>Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteAssignment(assign.id)} className="p-2 text-gray-500 hover:text-danger transition-colors"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-2 glass-panel p-6 rounded-3xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                                <Calendar className="text-accent" size={20} /> Weekly Timetable
                            </h3>
                            {editingTimetable ? (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setEditingTimetable(false)}><X size={16}/></Button>
                                    <Button size="sm" onClick={() => { updateCollege({ timetable: localTimetable }); setEditingTimetable(false); sound.playSuccess(); }}><Save size={16}/> Save</Button>
                                </div>
                            ) : (
                                <Button size="sm" variant="ghost" onClick={() => setEditingTimetable(true)}><Edit2 size={16}/> Edit</Button>
                            )}
                        </div>
                        <div className="force-desktop-grid">
                            {[1, 2, 3, 4, 5].map(dayNum => {
                                const isToday = currentDay === dayNum;
                                const subjects = (college.timetable[dayNum]?.subjects || '').split(/[\n,]/).map(s => s.trim()).filter(s => s);
                                
                                return (
                                    <div key={dayNum} className={clsx(
                                        "p-4 rounded-xl border transition-all flex flex-col min-h-[160px]",
                                        isToday ? "bg-accent/10 border-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]" : "bg-white/5 border-white/5"
                                    )}>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className={clsx("text-xs font-bold uppercase", isToday ? "text-accent" : "text-gray-400")}>
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][dayNum-1]}
                                            </p>
                                            {isToday && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                                        </div>
                                        
                                        {editingTimetable ? (
                                            <textarea 
                                                value={localTimetable[dayNum]?.subjects || ''}
                                                onChange={(e) => setLocalTimetable({...localTimetable, [dayNum]: { subjects: e.target.value }})}
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm flex-grow resize-none outline-none focus:border-accent"
                                            />
                                        ) : (
                                            <div className="space-y-1 flex-grow overflow-y-auto no-scrollbar">
                                                {subjects.length > 0 ? subjects.map((sub, idx) => {
                                                    const classHour = 8 + idx;
                                                    const isCurrentClass = isToday && currentHour === classHour;
                                                    return (
                                                        <div key={idx} className={clsx(
                                                            "text-xs p-1.5 rounded flex justify-between items-center text-overlay-fix",
                                                            isCurrentClass ? "bg-accent text-white font-bold" : "text-gray-300"
                                                        )}>
                                                            <span>{sub}</span>
                                                            <span className="opacity-50 text-[9px] ml-2">{classHour}:00</span>
                                                        </div>
                                                    );
                                                }) : (
                                                    <p className="text-sm text-gray-500 italic">No classes</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : view === 'attendance' ? (
                <AttendanceManager />
            ) : view === 'remarks' ? (
                <RemarksManager />
            ) : (
                <div className="space-y-6 animate-slide-up">
                    <div className="glass-panel p-6 rounded-3xl border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Trophy className="text-accent" size={20} /> Exam Timetable
                            </h3>
                            <Button size="sm" onClick={() => setShowAddExam(true)} className="gap-2"><Plus size={16}/> Add Exam</Button>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                            {college.exams?.length === 0 && (
                                <p className="md:col-span-2 text-gray-500 text-sm text-center py-8 italic">No exams scheduled. Focus on the grind.</p>
                            )}
                            {(college.exams || []).sort((a,b) => a.date.localeCompare(b.date)).map((exam) => (
                                <div key={exam.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-accent/10 rounded-xl text-accent">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{exam.subject}</h4>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                                                    <Clock size={10} /> {exam.date} @ {exam.time}
                                                </span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                                                    <BookOpen size={10} /> Room: {exam.room}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const updated = college.exams.filter(e => e.id !== exam.id);
                                            updateCollege({ exams: updated });
                                            sound.playRobotConfirm();
                                        }}
                                        className="p-2 text-gray-500 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showFocusMode && <FocusTimer onClose={() => setShowFocusMode(false)} />}

            {/* Add Exam Modal */}
            {showAddExam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="max-w-sm w-full glass-panel p-6 rounded-3xl border border-white/10 relative">
                        <button onClick={() => setShowAddExam(false)} className="absolute top-4 right-4 text-gray-400"><X size={20}/></button>
                        <h3 className="text-xl font-bold mb-4">Schedule Exam</h3>
                        <form onSubmit={(e: any) => { 
                            e.preventDefault(); 
                            const newExam = {
                                id: Date.now().toString(),
                                subject: e.target.subject.value,
                                date: e.target.date.value,
                                time: e.target.time.value,
                                room: e.target.room.value
                            };
                            updateCollege({ exams: [...(college.exams || []), newExam] });
                            setShowAddExam(false);
                            sound.playSuccess();
                        }} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Subject</label>
                                <input name="subject" required className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-accent outline-none" placeholder="e.g. Physics" autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Date</label>
                                    <input name="date" type="date" required className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-accent outline-none font-mono" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Time</label>
                                    <input name="time" type="time" required className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-accent outline-none font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Room / Hall</label>
                                <input name="room" required className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-accent outline-none" placeholder="e.g. Hall A-102" />
                            </div>
                            <Button type="submit" className="w-full">Add to Timetable</Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Assignment Modal */}
            {showAddAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="max-w-sm w-full glass-panel p-6 rounded-3xl border border-white/10 relative">
                        <button onClick={() => setShowAddAssignment(false)} className="absolute top-4 right-4 text-gray-400"><X size={20}/></button>
                        <h3 className="text-xl font-bold mb-4">New Assignment</h3>
                        <form onSubmit={(e: any) => { 
                            e.preventDefault(); 
                            addAssignment(e.target.subject.value, e.target.title.value, e.target.date.value); 
                        }} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Subject</label>
                                <input name="subject" required className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-accent outline-none" placeholder="e.g. Math" autoFocus />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Task Title</label>
                                <input name="title" required className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-accent outline-none" placeholder="e.g. Chapter 5 Exercises" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Due Date</label>
                                <input name="date" type="date" required className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-accent outline-none font-mono" />
                            </div>
                            <Button type="submit" className="w-full">Create Task</Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Homework Check Modal */}
            {showHomeworkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="max-w-md w-full text-center space-y-8 glass-panel p-8 border border-accent/20 rounded-3xl">
                        <div>
                            <h2 className="text-4xl font-display font-bold text-white mb-2">EVENING BRIEF</h2>
                            <div className="h-1 w-20 bg-accent mx-auto rounded-full"></div>
                        </div>
                        <p className="text-gray-300 text-lg">Homework / Assignments status?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="danger" size="lg" onClick={() => setShowHomeworkModal(false)}>
                                Not Done
                            </Button>
                            <Button size="lg" onClick={() => { toggleDaily('homework'); setShowHomeworkModal(false); }}>
                                Complete
                            </Button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowHomeworkModal(false)} className="mt-4">
                            No Homework Today
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const LoadoutItem = ({ label, checked, onClick, icon: Icon }: { label: string, checked: boolean, onClick: () => void, icon: any }) => (
    <div 
        onClick={onClick}
        className={clsx(
            "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
            checked ? "bg-success/10 border-success/30" : "bg-white/5 border-white/10 hover:border-accent/50"
        )}
    >
        <div className="flex items-center gap-3">
            <div className={clsx("p-2 rounded-lg transition-colors", checked ? "bg-success/20 text-success" : "bg-white/10 text-gray-400")}>
                <Icon size={18} />
            </div>
            <span className={clsx("font-bold transition-colors", checked ? "text-white" : "text-gray-300")}>{label}</span>
        </div>
        <div className={clsx(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            checked ? "bg-success border-success" : "border-gray-500 group-hover:border-accent"
        )}>
            {checked && <Check size={14} className="text-black stroke-[3]" />}
        </div>
    </div>
);

const AttendanceManager: React.FC = () => {
    const { state, updateCollege } = useApp();
    const { college } = state;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showSealedModal, setShowSealedModal] = useState(false);

    const today = new Date();
    today.setHours(0,0,0,0);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)));

    const handleDayClick = (date: Date) => {
        const key = getDateKey(date);
        const record = college.attendanceHistory[key];
        const isPast = date < today;
        const isEntryFromToday = record && record.timestamp && getDateKey(new Date(record.timestamp)) === getDateKey(new Date());

        // If it's a past date AND there is a record AND it wasn't created/updated today, lock it
        if (isPast && record && !isEntryFromToday) {
            setSelectedDate(date);
            setShowSealedModal(true);
            sound.playError();
        } else {
            setSelectedDate(date);
            setShowModal(true);
            sound.playClick();
        }
    };

    const handleStatus = (status: AttendanceRecord['status'], isHalfDay: boolean = false, note: string = '') => {
        if (!selectedDate) return;
        const key = getDateKey(selectedDate);
        updateCollege({ 
            attendanceHistory: { ...college.attendanceHistory, [key]: { date: key, status, timestamp: new Date().toISOString(), manualEntry: true } },
            remarks: { ...college.remarks, [key]: { isHalfDay, note: note || (college.remarks[key]?.note || '') } }
        });
        if (status === 'present') sound.playSuccess(); else sound.playClick();
        setShowModal(false);
        setSelectedDate(null);
    };

    const monthDays = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)).filter(d => d <= today);

    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <Button variant="ghost" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft /></Button>
                <h3 className="text-xl font-display font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <Button variant="ghost" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight /></Button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-6">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest pb-2">{d}</div>
                ))}
                {days.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
                    
                    const key = getDateKey(date);
                    const record = college.attendanceHistory[key];
                    const remark = college.remarks[key];
                    const isToday = key === getDateKey(today);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isPast = date < today;
                    const isEntryFromToday = record && record.timestamp && getDateKey(new Date(record.timestamp)) === getDateKey(new Date());
                    const isLocked = state.midnightLock && isPast && record && !isEntryFromToday;

                    return (
                        <button
                            key={key}
                            onClick={() => handleDayClick(date)}
                            disabled={date > today && !isWeekend}
                            className={clsx(
                                "aspect-square rounded-xl border transition-all flex flex-col items-center justify-center relative group",
                                isToday ? "border-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]" : "border-white/5",
                                record?.status === 'present' ? "bg-success/20 border-success/40" :
                                record?.status === 'leave' ? "bg-blue-400/20 border-blue-400/40" :
                                record?.status === 'absent-personal' ? "bg-danger/20 border-danger/40" :
                                (record?.status === 'absent-college' || isWeekend) ? "bg-warning/20 border-warning/40" :
                                "bg-white/5 hover:bg-white/10",
                                date > today && !isWeekend && "opacity-20 cursor-not-allowed"
                            )}
                        >
                            <span className={clsx("text-sm font-bold", isToday ? "text-accent" : "text-white")}>{date.getDate()}</span>
                            {remark?.isHalfDay && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-400" />}
                            {isLocked && <Lock size={10} className="absolute bottom-1 right-1 text-gray-500" />}
                            
                            {/* Hover Note Tooltip */}
                            {remark?.note && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-black border border-white/10 rounded-lg text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 pointer-events-none z-20 transition-opacity">
                                    {remark.note}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] uppercase tracking-widest font-bold border-t border-white/5 pt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-success/20 border border-success"></div><span className="text-success">Present</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-400/20 border border-blue-400"></div><span className="text-blue-400">Leave</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-danger/20 border border-danger"></div><span className="text-danger">Absent</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-warning/20 border border-warning"></div><span className="text-warning">Holiday</span></div>
            </div>
            {showModal && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full border border-white/10 relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
                        <h3 className="text-xl font-bold text-center mb-1">Attendance Registry</h3>
                        <p className="text-center text-gray-400 text-sm mb-6 uppercase tracking-widest">{selectedDate.toDateString()}</p>
                        
                        <div className="mb-6 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                <span className="text-xs font-bold uppercase text-gray-400">Half Day Leave</span>
                                <button 
                                    onClick={() => {
                                        const key = getDateKey(selectedDate);
                                        updateCollege({ remarks: { ...college.remarks, [key]: { ...college.remarks[key], isHalfDay: !college.remarks[key]?.isHalfDay } } });
                                        sound.playClick();
                                    }}
                                    className={clsx("w-10 h-5 rounded-full relative transition-colors", college.remarks[getDateKey(selectedDate)]?.isHalfDay ? "bg-blue-400" : "bg-gray-700")}
                                >
                                    <div className={clsx("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", college.remarks[getDateKey(selectedDate)]?.isHalfDay ? "left-6" : "left-1")} />
                                </button>
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Note / Reason</label>
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-accent resize-none h-20"
                                    placeholder="Why take a leave?"
                                    value={college.remarks[getDateKey(selectedDate)]?.note || ''}
                                    onChange={(e) => {
                                        const key = getDateKey(selectedDate);
                                        updateCollege({ remarks: { ...college.remarks, [key]: { ...college.remarks[key], note: e.target.value } } });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button onClick={() => handleStatus('present', college.remarks[getDateKey(selectedDate)]?.isHalfDay)} className="w-full p-4 rounded-xl bg-success/10 border border-success/30 text-success hover:bg-success/20 flex items-center justify-between group transition-all"><span className="font-bold">Present</span><Check size={18} /></button>
                            <button onClick={() => handleStatus('leave', college.remarks[getDateKey(selectedDate)]?.isHalfDay)} className="w-full p-4 rounded-xl bg-blue-400/10 border border-blue-400/30 text-blue-400 hover:bg-blue-400/20 flex items-center justify-between group transition-all"><div className="text-left"><span className="font-bold block">Leave (Excused)</span><span className="text-[10px] opacity-70 uppercase">Counts as Present</span></div><Check size={18} /></button>
                            <button onClick={() => handleStatus('absent-personal', college.remarks[getDateKey(selectedDate)]?.isHalfDay)} className="w-full p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 flex items-center justify-between group transition-all"><div className="text-left"><span className="font-bold block">Absent (Personal)</span><span className="text-[10px] opacity-70 uppercase">Affects Attendance %</span></div><X size={18} /></button>
                            <button onClick={() => handleStatus('absent-college', college.remarks[getDateKey(selectedDate)]?.isHalfDay)} className="w-full p-4 rounded-xl bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20 flex items-center justify-between group transition-all"><div className="text-left"><span className="font-bold block">College Holiday</span><span className="text-[10px] opacity-70 uppercase">Ignored from Total</span></div><Minus size={18} /></button>
                        </div>
                    </div>
                </div>
            )}
            {/* SEALED MODAL */}
            {showSealedModal && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full border border-white/10 relative text-center">
                        <button onClick={() => { setShowSealedModal(false); setSelectedDate(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                        <div className="inline-block p-4 rounded-full bg-gray-800 text-gray-400 mb-4">
                            <Lock size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Day Sealed</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Past records are locked. Only future performance can be altered.
                        </p>
                        {college.attendanceHistory[getDateKey(selectedDate)] ? (
                            <div className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                                    <p className={clsx("font-display font-bold text-lg", 
                                        college.attendanceHistory[getDateKey(selectedDate)].status === 'present' ? "text-success" : 
                                        college.attendanceHistory[getDateKey(selectedDate)].status === 'leave' ? "text-blue-400" : 
                                        college.attendanceHistory[getDateKey(selectedDate)].status === 'absent-personal' ? "text-danger" : "text-warning"
                                    )}>
                                        {college.attendanceHistory[getDateKey(selectedDate)].status.toUpperCase().replace('-', ' ')}
                                        {college.remarks[getDateKey(selectedDate)]?.isHalfDay && <span className="text-blue-400 text-xs ml-2">(HALF DAY)</span>}
                                    </p>
                                </div>
                                {college.remarks[getDateKey(selectedDate)]?.note && (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-left">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Note</p>
                                        <p className="text-sm text-gray-300 italic">"{college.remarks[getDateKey(selectedDate)].note}"</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-danger/10 p-4 rounded-xl border border-danger/20">
                                <p className="text-danger font-bold">No Data Recorded</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const RemarksManager: React.FC = () => {
    const { state, updateCollege } = useApp();
    const { college } = state;
    const [selectedMonths, setSelectedMonths] = useState<number[]>(college.selectedMonthsForTotal || []);

    const now = new Date();
    const months: { label: string, value: number, year: number }[] = [];
    
    // Determine start date: Always show from January of the previous year
    const startYear = now.getFullYear() - 1;
    const startDate = new Date(startYear, 0, 1);
    
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= now) {
        months.push({
            label: current.toLocaleString('default', { month: 'long', year: 'numeric' }),
            value: current.getMonth(),
            year: current.getFullYear()
        });
        current.setMonth(current.getMonth() + 1);
    }

    const monthsToRender = [...months].reverse();

    const toggleMonth = (monthIdx: number, year: number) => {
        const id = monthIdx + (year * 12);
        const next = selectedMonths.includes(id) 
            ? selectedMonths.filter(m => m !== id)
            : [...selectedMonths, id];
        setSelectedMonths(next);
        sound.playClick();
    };

    // Combined Attendance Logic
    const calculateCombined = () => {
        if (selectedMonths.length === 0) return 0;
        
        let present = 0;
        let absent = 0;
        let leave = 0;

        Object.values(college.attendanceHistory).forEach((record: any) => {
            const [y, m] = record.date.split('-').map(Number);
            const id = (m - 1) + (y * 12);
            
            if (selectedMonths.includes(id)) {
                const remark = college.remarks[record.date];
                const isHalf = remark?.isHalfDay;
                const weight = isHalf ? 0.5 : 1;
                
                if (record.status === 'present') {
                    present += weight;
                } else if (record.status === 'leave') {
                    leave += weight;
                } else if (record.status === 'absent-personal') {
                    absent += weight;
                }
                // 'absent-college' (Holiday) is ignored
            }
        });

        const effectivePresent = present + leave;
        const total = effectivePresent + absent;
        return total === 0 ? 0 : (effectivePresent / total) * 100;
    };

    const combinedPercentage = calculateCombined();

    const handleSaveTotal = () => {
        updateCollege({ 
            savedTotalAttendance: combinedPercentage,
            selectedMonthsForTotal: selectedMonths
        });
        sound.playSuccess();
    };

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                    <Edit2 className="text-accent" size={20} /> Remarks & Combined Attendance
                </h3>
                
                <div className="mb-8">
                    <label className="text-xs text-gray-500 uppercase font-bold mb-3 block">Select Months to Combine</label>
                    <div className="flex flex-wrap gap-2">
                        {monthsToRender.map((m) => {
                            const id = m.value + (m.year * 12);
                            const active = selectedMonths.includes(id);
                            return (
                                <button 
                                    key={id} 
                                    onClick={() => toggleMonth(m.value, m.year)}
                                    className={clsx(
                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                        active ? "bg-accent border-accent text-white" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                    )}
                                >
                                    {m.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col justify-center items-center text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Total Attendance</p>
                        <h2 className="text-5xl font-display font-black text-white mb-4">{combinedPercentage.toFixed(2)}%</h2>
                        <Button onClick={handleSaveTotal} className="gap-2 w-full">
                            <Save size={16} /> Save to Terminal
                        </Button>
                        {college.savedTotalAttendance !== null && (
                            <p className="text-[10px] text-success mt-2 uppercase font-bold">Currently Saved: {college.savedTotalAttendance.toFixed(2)}%</p>
                        )}
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Leave Notes</h4>
                        {Object.entries(college.remarks)
                            .filter(([_, r]: [string, any]) => r.note || r.isHalfDay)
                            .sort((a, b) => b[0].localeCompare(a[0]))
                            .map(([date, r]: [string, any]) => (
                                <div key={date} className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-accent">{date}</span>
                                        {r.isHalfDay && <span className="text-[10px] bg-blue-400/20 text-blue-400 px-1.5 rounded uppercase font-bold">Half Day</span>}
                                    </div>
                                    <p className="text-xs text-gray-300 italic">"{r.note || 'No note provided'}"</p>
                                </div>
                            ))}
                        {Object.keys(college.remarks).length === 0 && (
                            <p className="text-xs text-gray-500 italic text-center py-4">No remarks recorded yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FocusTimer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'work' | 'break'>('work');
    
    // Breathing Phase State
    const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
    
    // Timer Logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isActive && timeLeft > 0) { 
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000); 
        } 
        else if (timeLeft === 0) { 
            sound.playLevelUp(); 
            setIsActive(false); 
            if (mode === 'work') { setMode('break'); setTimeLeft(5 * 60); } 
            else { setMode('work'); setTimeLeft(25 * 60); } 
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    // Breathing Logic (Independent 4-4-4 cycle)
    useEffect(() => {
        if (!isActive || mode !== 'work') return;
        
        const breathe = () => {
            setBreathPhase('in');
            setTimeout(() => {
                setBreathPhase('hold');
                setTimeout(() => {
                    setBreathPhase('out');
                }, 4000);
            }, 4000);
        };
        
        breathe();
        const interval = setInterval(breathe, 12000); // 4+4+4 = 12s cycle
        return () => clearInterval(interval);
    }, [isActive, mode]);

    const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    // Calculate scale for breathing animation
    const getScale = () => {
        if (!isActive) return 1;
        if (breathPhase === 'in') return 1.5;
        if (breathPhase === 'hold') return 1.5;
        return 1;
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-8 animate-fade-in overflow-hidden">
             {/* Breathing Background Orb */}
             <div 
                className="absolute w-96 h-96 bg-accent/20 rounded-full blur-[100px] transition-transform duration-[4000ms] ease-in-out pointer-events-none"
                style={{ 
                    transform: `scale(${getScale()})`,
                    transitionTimingFunction: breathPhase === 'hold' ? 'linear' : 'ease-in-out'
                }}
             />

             <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white z-20"><X size={32} /></button>
             
             <div className="text-center z-10 relative">
                 <div className={clsx("text-sm uppercase tracking-[0.3em] font-bold mb-8 px-4 py-2 rounded-full inline-block border", mode === 'work' ? "border-accent text-accent" : "border-success text-success")}>
                    {mode === 'work' ? (isActive ? 'Neural Sync Protocol' : 'Deep Work Ready') : 'System Recovery'}
                 </div>
                 
                 <div className="text-[120px] font-display font-black leading-none tabular-nums mb-12 tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {formatTime(timeLeft)}
                 </div>

                 <div className="flex items-center justify-center gap-8">
                     <button 
                        onClick={() => { setIsActive(!isActive); sound.playClick(); }} 
                        className={clsx("w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110", isActive ? "bg-white text-black" : "bg-accent text-white shadow-[0_0_30px_var(--accent-color)]")}
                    >
                        {isActive ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" className="ml-1" size={32} />}
                     </button>
                     
                     <button onClick={() => { setIsActive(false); setTimeLeft(mode === 'work' ? 25*60 : 5*60); sound.playClick(); }} className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                        <RotateCcw size={28} />
                     </button>
                 </div>

                 {isActive && mode === 'work' && (
                     <div className="mt-12 text-gray-500 text-xs uppercase tracking-[0.5em] animate-pulse">
                         {breathPhase === 'in' ? 'Inhale' : breathPhase === 'hold' ? 'Hold' : 'Exhale'}
                     </div>
                 )}
             </div>
        </div>
    );
};