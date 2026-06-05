import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, CheckSquare, Clock, Settings as SettingsIcon, LogOut, Plus, Check, Trash2, AlertCircle, GraduationCap, Edit2, Save, X, CreditCard, ChevronLeft, ChevronRight, Lock, Menu, LayoutDashboard, Bell, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import clsx from 'clsx';
import { getDateKey } from '../../utils/helpers';
import { sound } from '../../utils/sound';
import { AttendanceRecord } from '../../types';

const getGreeting = (time: Date, userName?: string) => {
    const hrs = time.getHours();
    let greet = 'Good evening';
    if (hrs >= 5 && hrs < 12) {
        greet = 'Good morning';
    } else if (hrs >= 12 && hrs < 17) {
        greet = 'Good afternoon';
    }
    return userName ? `${greet}, ${userName}` : greet;
};

const getDaysRemaining = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateStr);
    examDate.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

const LoadoutItem = ({ label, checked, onClick, icon: Icon }: any) => (
    <button onClick={onClick} className={clsx("w-full p-3 rounded-xl border flex items-center justify-between transition-all", checked ? "bg-emerald-500/10 border-emerald-500/30" : "bg-black/20 border-white/5 hover:bg-white/5")}>
        <div className="flex items-center gap-3">
            <div className={clsx("p-2 rounded-lg", checked ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-400")}>
                <Icon size={16} />
            </div>
            <span className={clsx("font-medium text-sm", checked ? "text-emerald-400" : "text-gray-300")}>{label}</span>
        </div>
        <div className={clsx("w-5 h-5 rounded border flex items-center justify-center transition-colors", checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-500 text-transparent")}>
            <Check size={12} />
        </div>
    </button>
);

const StudentCalendar = ({ currentDate, setCurrentDate }: { currentDate: Date; setCurrentDate: (date: Date) => void }) => {
    const { state, updateCollege } = useApp();
    const { college } = state;
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

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <select 
                        value={month} 
                        onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i} className="bg-[#121214]">
                                {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <select 
                        value={year} 
                        onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                        {Array.from({ length: 10 }, (_, i) => {
                            const y = new Date().getFullYear() - 5 + i;
                            return <option key={y} value={y} className="bg-[#121214]">{y}</option>;
                        })}
                    </select>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight size={18} /></button>
                </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-gray-500 pb-2">{d}</div>
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
                                isToday ? "border-blue-500 bg-blue-500/10" : "border-white/5",
                                record?.status === 'present' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                                record?.status === 'leave' ? "bg-amber-500/20 border-amber-500/30 text-amber-400" :
                                record?.status === 'absent-personal' ? "bg-rose-500/20 border-rose-500/30 text-rose-400" :
                                (record?.status === 'absent-college' || isWeekend) ? "bg-gray-500/20 border-gray-500/30 text-gray-400" :
                                "bg-black/20 hover:bg-white/5 text-gray-300",
                                date > today && !isWeekend && "opacity-30 cursor-not-allowed"
                            )}
                        >
                            <span className="text-sm font-medium">{date.getDate()}</span>
                            {remark?.isHalfDay && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />}
                            {isLocked && <Lock size={10} className="absolute bottom-1 right-1 opacity-50" />}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-4 text-[10px] uppercase tracking-widest font-bold pt-4 border-t border-white/5">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40"></div><span className="text-emerald-400">Present</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40"></div><span className="text-amber-400">Leave</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40"></div><span className="text-rose-400">Absent</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-500/20 border border-gray-500/40"></div><span className="text-gray-400">Holiday/Weekend</span></div>
            </div>

            {/* Modals */}
            {showModal && selectedDate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="max-w-sm w-full bg-[#0a0a0c] p-8 rounded-[2rem] border border-blue-500/20 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
                        
                        <div className="text-center mb-8">
                            <div className="inline-flex p-3 rounded-2xl bg-white/5 text-blue-400 mb-4 border border-white/10">
                                <GraduationCap size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Attendance Record</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        </div>

                        <div className="space-y-3">
                            <Button variant="secondary" className="w-full bg-green-500/10 text-green-300 border-green-500/20 hover:bg-green-500/20" onClick={() => handleStatus('present')}>Mark Present</Button>
                            <Button variant="secondary" className="w-full bg-red-950/60 text-red-200 border-red-500/30 hover:bg-red-900/60" onClick={() => handleStatus('absent-personal')}>Mark Absent</Button>
                            <Button variant="secondary" className="w-full bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20" onClick={() => handleStatus('absent-college')}>College Holiday</Button>
                            
                            <button 
                                onClick={() => setShowModal(false)}
                                className="w-full py-4 text-[10px] font-bold text-gray-500 hover:text-gray-300 uppercase tracking-[0.3em] transition-colors mt-2"
                            >
                                Cancel Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSealedModal && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="max-w-sm w-full bg-[#121214] p-6 rounded-2xl border border-white/10 relative text-center">
                        <button onClick={() => setShowSealedModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                        <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Record Sealed</h3>
                        <p className="text-gray-400 text-sm mb-6">Past attendance records cannot be modified after the day has ended.</p>
                        <Button className="w-full" onClick={() => setShowSealedModal(false)}>Understood</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const THEME_PRESETS = [
    {
        name: "Default Blue-Noir",
        accentColor: "#3b82f6",
        gradientStart: "#0a0a0c",
        gradientMiddle: "#0e131f",
        gradientEnd: "#0a0a0c",
        fontStyle: "default",
        blur: 10
    },
    {
        name: "Neon Cyberpunk",
        accentColor: "#ff007f",
        gradientStart: "#050014",
        gradientMiddle: "#1f002a",
        gradientEnd: "#050014",
        fontStyle: "cyber",
        blur: 15
    },
    {
        name: "Emerald Forest",
        accentColor: "#10b981",
        gradientStart: "#020f08",
        gradientMiddle: "#052011",
        gradientEnd: "#020f08",
        fontStyle: "clean",
        blur: 8
    },
    {
        name: "Sunset Gold",
        accentColor: "#fbbf24",
        gradientStart: "#0f0c02",
        gradientMiddle: "#231b05",
        gradientEnd: "#0f0c02",
        fontStyle: "elegant",
        blur: 12
    },
    {
        name: "Royal Amethyst",
        accentColor: "#9d4edd",
        gradientStart: "#0a0a0a",
        gradientMiddle: "#1a0033",
        gradientEnd: "#0a0a0a",
        fontStyle: "default",
        blur: 10
    },
    {
        name: "Monochrome Slate",
        accentColor: "#ffffff",
        gradientStart: "#000000",
        gradientMiddle: "#1c1c1e",
        gradientEnd: "#000000",
        fontStyle: "clean",
        blur: 5
    }
];

export const StudentDashboard: React.FC = () => {
    const { state, updateState, updateFootball, updateCollege, resetAll } = useApp();
    const { college } = state;
    const { assignments, exams, timetable, attendanceHistory, remarks, dailyFlags } = college;

    const [currentTime, setCurrentTime] = useState(new Date());
    const [showAddAssignment, setShowAddAssignment] = useState(false);
    const [newAssignment, setNewAssignment] = useState({ title: '', subject: '', dueDate: '', reminders: [] as any[] });
    const [tempReminder, setTempReminder] = useState({ type: 'date', time: '09:00', at: '', message: '' });

    const [showAddExam, setShowAddExam] = useState(false);
    const [newExam, setNewExam] = useState({ subject: '', date: '', reminders: [] as any[] });
    
    const [editingTimetable, setEditingTimetable] = useState(false);
    const [localTimetable, setLocalTimetable] = useState(timetable);
    const [activeSection, setActiveSection] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());

    const [isAttendanceCollapsed, setIsAttendanceCollapsed] = useState(true);
    const [newCustomNotif, setNewCustomNotif] = useState({ message: '', time: '09:00', repeats: 'once' as any, days: [] as number[] });
    const [showAddCustomNotif, setShowAddCustomNotif] = useState(false);
    const [isSettingsNotificationsCollapsed, setIsSettingsNotificationsCollapsed] = useState(true);
    const [isCustomizationCollapsed, setIsCustomizationCollapsed] = useState(false);
    const [customPresetsOpen, setCustomPresetsOpen] = useState(true);
    const [customColorsOpen, setCustomColorsOpen] = useState(true);
    const [customFontsOpen, setCustomFontsOpen] = useState(true);
    const [customBgOpen, setCustomBgOpen] = useState(true);

    type Tab = 'overview' | 'attendance' | 'timetable' | 'tasks' | 'settings' | 'notifications';
    const SECTIONS: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'attendance', label: 'Attendance', icon: GraduationCap },
        { id: 'timetable', label: 'Timetable', icon: Calendar },
        { id: 'tasks', label: 'Tasks & Exams', icon: CheckSquare },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ];

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | null = null;

        const startTimer = () => {
            if (timer) clearInterval(timer);
            setCurrentTime(new Date()); // Refresh immediately on visibility
            timer = setInterval(() => setCurrentTime(new Date()), 60000);
        };

        const stopTimer = () => {
            if (timer) { clearInterval(timer); timer = null; }
        };

        const handleVisibility = () => {
            if (document.hidden) stopTimer(); else startTimer();
        };

        startTimer();
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            stopTimer();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const currentDay = currentTime.getDay(); // 0-6
    const currentHour = currentTime.getHours();
    const todayTimetable = timetable[currentDay]?.subjects || "No classes scheduled";
    const classesList = todayTimetable !== "No classes scheduled" ? todayTimetable.split(',').map(s => s.trim()) : [];

    // Attendance Calculation (Reflecting Selected Month)
    const currentMonth = selectedMonthDate.getMonth();
    const currentYear = selectedMonthDate.getFullYear();
    const allRecords = Object.values(attendanceHistory) as AttendanceRecord[];
    const records = allRecords.filter(r => {
        const [y, m] = r.date.split('-').map(Number);
        return (m - 1) === currentMonth && y === currentYear;
    });

    let presentDays = 0;
    let leaveDays = 0;
    let absentDays = 0;

    records.forEach(r => {
        const remark = remarks[r.date];
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

    const pendingAssignments = assignments.filter(a => !a.completed);
    const upcomingExams = exams.filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)));
    const nextExam = upcomingExams.length > 0 ? [...upcomingExams].sort((a,b) => a.date.localeCompare(b.date))[0] : null;

    const [showResetModal, setShowResetModal] = useState(false);
    const [showFactoryResetModal, setShowFactoryResetModal] = useState(false);

    const handleReset = () => {
        setShowResetModal(true);
    };

    const confirmReset = () => {
        updateState({ userType: 'student', hasOnboarded: false, userName: '' });
        setShowResetModal(false);
    };

    const handleFactoryReset = () => {
        setShowFactoryResetModal(true);
    };

    const confirmFactoryReset = () => {
        resetAll();
        window.location.reload();
    };

    const handleAddExam = () => {
        if (!newExam.subject || !newExam.date) return;
        updateCollege({
            exams: [...exams, {
                id: Date.now().toString(),
                subject: newExam.subject,
                date: newExam.date,
                reminders: newExam.reminders,
                completed: false
            }]
        });
        setNewExam({ subject: '', date: '', reminders: [] });
        setShowAddExam(false);
        sound.playSuccess();
    };

    const handleAddAssignment = () => {
        if (!newAssignment.title || !newAssignment.subject || !newAssignment.dueDate) return;
        updateCollege({
            assignments: [...assignments, {
                id: Date.now().toString(),
                title: newAssignment.title,
                subject: newAssignment.subject,
                dueDate: newAssignment.dueDate,
                completed: false,
                reminders: newAssignment.reminders
            }]
        });
        setNewAssignment({ title: '', subject: '', dueDate: '', reminders: [] });
        setShowAddAssignment(false);
        sound.playSuccess();
    };

    const handleAddCustomNotif = () => {
        if (!newCustomNotif.message || !newCustomNotif.time) return;
        updateCollege({
            customNotifications: [...(college.customNotifications || []), {
                id: Date.now().toString(),
                message: newCustomNotif.message,
                time: newCustomNotif.time,
                repeats: newCustomNotif.repeats,
                days: newCustomNotif.repeats === 'specific-days' ? newCustomNotif.days : undefined,
                enabled: true
            }]
        });
        setNewCustomNotif({ message: '', time: '09:00', repeats: 'once', days: [] });
        setShowAddCustomNotif(false);
        sound.playSuccess();
    };

    const toggleCustomNotif = (id: string) => {
        updateCollege({
            customNotifications: college.customNotifications.map(n => 
                n.id === id ? { ...n, enabled: !n.enabled } : n
            )
        });
        sound.playClick();
    };

    const deleteCustomNotif = (id: string) => {
        updateCollege({
            customNotifications: college.customNotifications.filter(n => n.id !== id)
        });
        sound.playError();
    };

    const toggleAssignment = (id: string) => {
        updateCollege({
            assignments: assignments.map(a => a.id === id ? { ...a, completed: !a.completed } : a)
        });
        sound.playClick();
    };

    const deleteAssignment = (id: string) => {
        updateCollege({
            assignments: assignments.filter(a => a.id !== id)
        });
        sound.playRobotConfirm();
    };

    const deleteExam = (id: string) => {
        updateCollege({
            exams: exams.filter(e => e.id !== id)
        });
        sound.playRobotConfirm();
    };

    const markAttendance = (status: 'present' | 'absent-personal' | 'absent-college') => {
        const today = getDateKey(new Date());
        updateCollege({
            attendanceHistory: {
                ...attendanceHistory,
                [today]: { date: today, status, timestamp: new Date().toISOString() }
            }
        });
        sound.playSuccess();
    };

    const toggleDaily = (key: keyof typeof dailyFlags) => {
        updateCollege({
            dailyFlags: { ...dailyFlags, [key]: !dailyFlags[key] }
        });
        sound.playClick();
    };

    const now = new Date();
    const months: { label: string, value: number, year: number }[] = [];
    const startDate = new Date(2025, 0, 1);
    
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= now) {
        months.push({
            label: current.toLocaleString('default', { month: 'short', year: 'numeric' }),
            value: current.getMonth(),
            year: current.getFullYear()
        });
        current.setMonth(current.getMonth() + 1);
    }
    const monthsToRender = [...months].reverse();

    const selectedMonths = college.selectedMonthsForTotal || [];
    
    const toggleMonth = (monthIdx: number, year: number) => {
        const id = monthIdx + (year * 12);
        const next = selectedMonths.includes(id) 
            ? selectedMonths.filter(m => m !== id)
            : [...selectedMonths, id];
        updateCollege({ selectedMonthsForTotal: next });
        sound.playClick();
    };

    const calculateCombined = () => {
        if (selectedMonths.length === 0) return { present: 0, absent: 0, leave: 0, total: 0, percentage: 0 };
        
        let present = 0;
        let absent = 0;
        let leave = 0;

        Object.values(college.attendanceHistory).forEach((record: any) => {
            const [y, m] = record.date.split('-').map(Number);
            const id = (m - 1) + (y * 12);
            
            if (selectedMonths.includes(id)) {
                const remark = college.remarks?.[record.date];
                const isHalf = remark?.isHalfDay;
                const weight = isHalf ? 0.5 : 1;
                
                if (record.status === 'present') {
                    present += weight;
                } else if (record.status === 'leave') {
                    leave += weight;
                } else if (record.status === 'absent-personal') {
                    absent += weight;
                }
            }
        });

        const effectivePresent = present + leave;
        const total = effectivePresent + absent;
        const percentage = total === 0 ? 0 : (effectivePresent / total) * 100;
        
        return { present: effectivePresent, absent, leave, total, percentage };
    };

    const combinedStats = calculateCombined();

    const todayRecord = attendanceHistory[getDateKey(new Date())];

    const { accentColor, gradientStart, gradientMiddle, gradientEnd, backgroundImage, blur, bgZoom, bgX, bgY, fontStyle, logoFont, greetingsFont, bodyFont } = state.football.customization;

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--accent-color', accentColor);
        root.style.setProperty('--accent-light', accentColor);
        root.style.setProperty('--accent-dark', accentColor);
        root.style.setProperty('--bg-blur', `${blur}px`);

        // Persistent accent color stylesheet — only updated when accentColor changes
        // This replaces the old <style dangerouslySetInnerHTML> which re-parsed CSS on every render
        const STYLE_ID = 'neuralis-accent-overrides';
        let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = `
            .text-blue-400 { color: ${accentColor} !important; }
            .bg-blue-500 { background-color: ${accentColor} !important; }
            .bg-blue-500\/20 { background-color: ${accentColor}33 !important; }
            .bg-blue-500\/10 { background-color: ${accentColor}1a !important; }
            .border-blue-500 { border-color: ${accentColor} !important; }
            .border-blue-500\/20 { border-color: ${accentColor}33 !important; }
            .border-blue-500\/30 { border-color: ${accentColor}4d !important; }
            .focus\\:border-blue-500:focus { border-color: ${accentColor} !important; }
            .hover\\:bg-blue-600:hover { background-color: ${accentColor}cc !important; }
            .accent-blue-500 { accent-color: ${accentColor} !important; }
        `;

        // Resolve logo, greetings, body fonts
        let activeLogoFont = logoFont;
        let activeGreetingsFont = greetingsFont;
        let activeBodyFont = bodyFont;

        if (!activeLogoFont || !activeGreetingsFont || !activeBodyFont) {
            if (fontStyle === 'cyber') {
                activeLogoFont = activeLogoFont || 'mono';
                activeGreetingsFont = activeGreetingsFont || 'orbitron';
                activeBodyFont = activeBodyFont || 'rajdhani';
            } else if (fontStyle === 'clean') {
                activeLogoFont = activeLogoFont || 'grotesk';
                activeGreetingsFont = activeGreetingsFont || 'grotesk';
                activeBodyFont = activeBodyFont || 'archivo';
            } else if (fontStyle === 'playful') {
                activeLogoFont = activeLogoFont || 'fascinate';
                activeGreetingsFont = activeGreetingsFont || 'fascinate';
                activeBodyFont = activeBodyFont || 'honk';
            } else if (fontStyle === 'elegant') {
                activeLogoFont = activeLogoFont || 'cinzel-dec';
                activeGreetingsFont = activeGreetingsFont || 'cinzel';
                activeBodyFont = activeBodyFont || 'lora';
            } else {
                activeLogoFont = activeLogoFont || 'sekuya';
                activeGreetingsFont = activeGreetingsFont || 'outfit';
                activeBodyFont = activeBodyFont || 'jakarta';
            }
        }

        // Set Logo Font Variable
        let logoCSS = '"Sekuya", sans-serif';
        if (activeLogoFont === 'mono') logoCSS = '"Share Tech Mono", monospace';
        else if (activeLogoFont === 'grotesk') logoCSS = '"Space Grotesk", sans-serif';
        else if (activeLogoFont === 'fascinate') logoCSS = '"Fascinate Inline", cursive';
        else if (activeLogoFont === 'cinzel-dec') logoCSS = '"Cinzel Decorative", serif';
        else if (activeLogoFont === 'orbitron') logoCSS = '"Orbitron", sans-serif';

        // Set Greetings Font Variable
        let greetingsCSS = '"Outfit", sans-serif';
        if (activeGreetingsFont === 'orbitron') greetingsCSS = '"Orbitron", sans-serif';
        else if (activeGreetingsFont === 'grotesk') greetingsCSS = '"Space Grotesk", sans-serif';
        else if (activeGreetingsFont === 'fascinate') greetingsCSS = '"Fascinate Inline", cursive';
        else if (activeGreetingsFont === 'cinzel') greetingsCSS = '"Cinzel", serif';
        else if (activeGreetingsFont === 'rajdhani') greetingsCSS = '"Rajdhani", sans-serif';

        // Set Body Font Variable
        let bodyCSS = '"Plus Jakarta Sans", sans-serif';
        if (activeBodyFont === 'rajdhani') bodyCSS = '"Rajdhani", sans-serif';
        else if (activeBodyFont === 'archivo') bodyCSS = '"Archivo", sans-serif';
        else if (activeBodyFont === 'grotesk') bodyCSS = '"Space Grotesk", sans-serif';
        else if (activeBodyFont === 'honk') bodyCSS = '"Honk", cursive';
        else if (activeBodyFont === 'lora') bodyCSS = '"Lora", serif';

        root.style.setProperty('--font-display', logoCSS);
        root.style.setProperty('--font-logo', logoCSS);
        root.style.setProperty('--font-heading', greetingsCSS);
        root.style.setProperty('--font-greetings', greetingsCSS);
        root.style.setProperty('--font-body', bodyCSS);
    }, [accentColor, blur, fontStyle, logoFont, greetingsFont, bodyFont]);

    const bgStyle: React.CSSProperties = !backgroundImage
        ? {
            backgroundImage: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientMiddle} 50%, ${gradientEnd} 100%)`,
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }
        : {
            backgroundColor: '#0a0a0c'
          };

    return (
        <div className="min-h-screen text-white font-sans selection:bg-blue-500/30 flex relative overflow-hidden" style={bgStyle}>
            {/* Visual Overlays */}
            <div className="absolute inset-0 bg-black/45 -z-10" />
            <div className="fixed inset-0 pointer-events-none z-[10] opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />
            <div className="fixed inset-0 pointer-events-none z-[10] opacity-40 bg-[radial-gradient(circle_at_center,_transparent_60%,_black_100%)]" />

            {backgroundImage && (
                <div 
                    className="absolute inset-0 -z-20 transition-all duration-300"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: `${bgZoom}%`,
                        backgroundPosition: `${bgX}% ${bgY}%`,
                        filter: `blur(${blur}px)`,
                        transform: 'scale(1.05)'
                    }}
                />
            )}


            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-black/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-out lg:translate-x-0 flex flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="font-logo font-bold text-lg tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-accent to-white uppercase">
                            NEURALIS
                        </h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                            Student OS
                        </p>
                    </div>
                    <button className="lg:hidden text-2xl text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}><X size={24}/></button>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {SECTIONS.map(section => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                            <button
                                key={section.id}
                                onClick={() => {
                                    setActiveSection(section.id);
                                    setSidebarOpen(false);
                                    sound.playClick();
                                }}
                                className={clsx(
                                    "flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-blue-500/20 text-blue-400 border-l-4 border-blue-500" 
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <Icon size={20} className={clsx("transition-transform group-hover:scale-110", isActive && "animate-pulse")} />
                                <span className="font-medium">{section.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full">
                {/* Mobile Header */}
                <header className="lg:hidden px-6 py-4 bg-transparent sticky top-0 z-30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-400 hover:text-white"><Menu size={24}/></button>
                        <h1 className="text-xl font-greetings font-bold tracking-tight text-white">
                            {getGreeting(currentTime, state.userName)}
                        </h1>
                    </div>
                    <div className="w-10" />
                </header>

                {/* Desktop Header */}
                <header className="hidden lg:block px-8 py-8 bg-transparent sticky top-0 z-20">
                    <div className="max-w-5xl mx-auto flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-greetings font-bold tracking-tight text-white">{getGreeting(currentTime, state.userName)}</h1>
                            <p className="text-gray-400 text-sm mt-1">Ready to tackle today's academic goals?</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-mono font-bold text-blue-400">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-sm text-gray-500">
                                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
                    {activeSection === 'overview' && (
                        <>
                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <GraduationCap size={20} className="text-blue-400" />
                                        <span className="text-sm text-gray-400">Attendance</span>
                                    </div>
                                    <div className="text-2xl font-bold">{percentage.toFixed(2)}%</div>
                                    <div className="text-xs text-gray-500 mt-1">{selectedMonthDate.toLocaleString('default', { month: 'long' })}</div>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock size={20} className="text-purple-400" />
                                        <span className="text-sm text-gray-400">Classes Today</span>
                                    </div>
                                    <div className="text-2xl font-bold">{classesList.length}</div>
                                    <div className="text-xs text-gray-500 mt-1">Scheduled</div>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckSquare size={20} className="text-amber-400" />
                                        <span className="text-sm text-gray-400">Assignments</span>
                                    </div>
                                    <div className="text-2xl font-bold">{pendingAssignments.length}</div>
                                    <div className="text-xs text-gray-500 mt-1">Pending</div>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <BookOpen size={20} className="text-rose-400" />
                                        <span className="text-sm text-gray-400">Exams</span>
                                    </div>
                                    <div className="text-2xl font-bold">{upcomingExams.length}</div>
                                    <div className="text-xs text-gray-500 mt-1">Upcoming</div>
                                </motion.div>
                            </div>

                            {/* Next Exam Featured Card */}
                            {nextExam && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Calendar size={120} />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] uppercase tracking-widest font-bold mb-3 border border-blue-500/20">
                                                Next Upcoming Exam
                                            </div>
                                            <h2 className="text-3xl font-bold text-white mb-1">{nextExam.subject}</h2>
                                            <p className="text-gray-400 flex items-center gap-2">
                                                <Calendar size={14} className="text-blue-400" />
                                                {new Date(nextExam.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="text-center md:text-right">
                                            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                                {getDaysRemaining(nextExam.date)}
                                            </div>
                                            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Days Remaining</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Today's Schedule */}
                                <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                                        <Calendar className="text-blue-400" /> Today's Schedule
                                    </h2>
                                    {classesList.length > 0 ? (
                                        <div className="space-y-3">
                                            {classesList.map((subject, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                                    <div className="font-medium">{subject}</div>
                                                    <div className="text-sm text-gray-400">Period {idx + 1}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No classes scheduled for today. Enjoy your day off!
                                        </div>
                                    )}
                                </section>
                            </div>
                        </>
                    )}

                    {activeSection === 'attendance' && (
                        <div className="space-y-8">
                            {/* Attendance Tracker */}
                            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                    <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                                        <GraduationCap className="text-blue-400" /> Attendance Tracker
                                    </h2>
                                    {attendanceStatus.msg && (
                                        <div className={clsx(
                                            "px-3 py-1 rounded-full text-xs font-medium border",
                                            attendanceStatus.type === 'safe' 
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                        )}>
                                            {attendanceStatus.count} {attendanceStatus.msg}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">{selectedMonthDate.toLocaleString('default', { month: 'long' })} Progress</span>
                                        <span className="font-medium">{percentage.toFixed(2)}%</span>
                                    </div>
                                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                        <div 
                                            className={clsx(
                                                "h-full rounded-full transition-all duration-500",
                                                percentage >= 75 ? "bg-emerald-500" : "bg-rose-500"
                                            )}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span>Target: 75%</span>
                                        <span>{effectivePresent} / {totalCalcDays} Days</span>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <h3 className="text-sm font-medium text-gray-400 mb-4">Mark Today's Attendance</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            onClick={() => markAttendance('present')}
                                            className={clsx(
                                                "py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                                                todayRecord?.status === 'present'
                                                    ? "bg-green-500/20 text-green-300 border-green-500/30 ring-1 ring-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                                    : "bg-black/20 text-gray-500 border-white/5 hover:border-green-500/30 hover:text-green-300"
                                            )}
                                        >
                                            Present
                                        </button>
                                        <button
                                            onClick={() => markAttendance('absent-personal')}
                                            className={clsx(
                                                "py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                                                todayRecord?.status === 'absent-personal'
                                                    ? "bg-red-950/60 text-red-200 border-red-500/30 ring-1 ring-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                                    : "bg-black/20 text-gray-500 border-white/5 hover:border-red-500/30 hover:text-red-200"
                                            )}
                                        >
                                            Absent
                                        </button>
                                        <button
                                            onClick={() => markAttendance('absent-college')}
                                            className={clsx(
                                                "py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                                                todayRecord?.status === 'absent-college'
                                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 ring-1 ring-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                                                    : "bg-black/20 text-gray-500 border-white/5 hover:border-yellow-500/30 hover:text-yellow-400"
                                            )}
                                        >
                                            Holiday
                                        </button>
                                    </div>
                                </div>
                            </section>

                             {/* Full Calendar */}
                            <StudentCalendar currentDate={selectedMonthDate} setCurrentDate={setSelectedMonthDate} />

                            {/* Combined Attendance */}
                            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                                    <Calendar className="text-blue-400" /> Combined Attendance
                                </h2>
                                {selectedMonths.length > 0 ? (
                                    <>
                                        <p className="text-sm text-gray-400 mb-4">
                                            Combining data for: {selectedMonths.map(id => {
                                                const m = id % 12;
                                                const y = Math.floor(id / 12);
                                                const date = new Date(y, m, 1);
                                                return date.toLocaleString('default', { month: 'short', year: 'numeric' });
                                            }).join(', ')}
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Percentage</p>
                                            <p className="text-2xl font-bold text-blue-400">{combinedStats.percentage.toFixed(2)}%</p>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Present</p>
                                            <p className="text-2xl font-bold text-emerald-400">{combinedStats.present}</p>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Absent</p>
                                            <p className="text-2xl font-bold text-rose-400">{combinedStats.absent}</p>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Days</p>
                                            <p className="text-2xl font-bold text-white">{combinedStats.total}</p>
                                        </div>
                                    </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No months selected. Go to Settings to select months to combine.</p>
                                )}
                            </section>
                        </div>
                    )}

                    {activeSection === 'timetable' && (
                        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            {/* Weekly Timetable */}
                            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                                <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                                    <Calendar className="text-blue-400" /> Weekly Timetable
                                </h2>
                                {editingTimetable ? (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setEditingTimetable(false)}><X size={16}/></Button>
                                        <Button size="sm" onClick={() => { updateCollege({ timetable: localTimetable }); setEditingTimetable(false); sound.playSuccess(); }}><Save size={16}/> Save</Button>
                                    </div>
                                ) : (
                                    <Button size="sm" variant="ghost" onClick={() => setEditingTimetable(true)}><Edit2 size={16}/> Edit</Button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                {[1, 2, 3, 4, 5, 6, 0].map(dayNum => {
                                    const isToday = currentDay === dayNum;
                                    const subjects = (localTimetable[dayNum]?.subjects || '').split(/[\n,]/).map(s => s.trim()).filter(s => s);
                                    const isLeave = localTimetable[dayNum]?.isLeave;
                                    
                                    return (
                                        <div key={dayNum} className={clsx(
                                            "p-4 rounded-xl border transition-all flex flex-col min-h-[160px]",
                                            isToday ? "bg-blue-500/10 border-blue-500/30" : "bg-black/20 border-white/5",
                                            isLeave && "opacity-60 grayscale-[0.5]"
                                        )}>
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex flex-col">
                                                    <p className={clsx("text-sm font-bold uppercase", isToday ? "text-blue-400" : "text-gray-400")}>
                                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayNum]}
                                                    </p>
                                                    {isLeave && <span className="text-[10px] text-rose-400 font-bold uppercase">Holiday</span>}
                                                </div>
                                                {editingTimetable ? (
                                                    <button 
                                                        onClick={() => setLocalTimetable({...localTimetable, [dayNum]: { ...localTimetable[dayNum], isLeave: !isLeave }})}
                                                        className={clsx("p-1.5 rounded-lg transition-colors", isLeave ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-gray-500 hover:text-white")}
                                                    >
                                                        <Lock size={14} />
                                                    </button>
                                                ) : isToday && !isLeave && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                                            </div>
                                            
                                            {editingTimetable ? (
                                                <div className="flex flex-col flex-grow gap-2">
                                                    <textarea 
                                                        value={localTimetable[dayNum]?.subjects || ''}
                                                        onChange={(e) => setLocalTimetable({...localTimetable, [dayNum]: { ...localTimetable[dayNum], subjects: e.target.value }})}
                                                        disabled={isLeave}
                                                        className={clsx("w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm flex-grow resize-none outline-none focus:border-blue-500", isLeave && "opacity-30 cursor-not-allowed")}
                                                        placeholder="Enter subjects"
                                                    />
                                                    <p className="text-[10px] text-gray-500 italic">Separate subjects by commas</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 flex-grow overflow-y-auto no-scrollbar">
                                                    {isLeave ? (
                                                        <div className="flex flex-col items-center justify-center h-full text-gray-600 italic text-xs">
                                                            <Lock size={20} className="mb-2 opacity-20" />
                                                            No Classes
                                                        </div>
                                                    ) : subjects.length > 0 ? subjects.map((sub, idx) => {
                                                        const classHour = 8 + idx;
                                                        const isCurrentClass = isToday && currentHour === classHour;
                                                        return (
                                                            <div key={idx} className={clsx(
                                                                "text-xs p-2 rounded-lg flex justify-between items-center",
                                                                isCurrentClass ? "bg-blue-500 text-white font-bold" : "bg-white/5 text-gray-300"
                                                            )}>
                                                                <span className="truncate">{sub}</span>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <div className="text-xs text-gray-500 italic">No classes</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {activeSection === 'tasks' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Assignments */}
                            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                                        <CheckSquare className="text-blue-400" /> Assignments
                                    </h2>
                                    <button 
                                        onClick={() => setShowAddAssignment(!showAddAssignment)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                {showAddAssignment && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: 'auto' }} 
                                        className="mb-4 space-y-3 p-4 bg-black/20 rounded-xl border border-white/5"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Assignment Title"
                                            value={newAssignment.title}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Subject"
                                            value={newAssignment.subject}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-gray-400">Due Date</label>
                                                <input
                                                    type="date"
                                                    value={newAssignment.dueDate}
                                                    min={getDateKey(new Date())}
                                                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg space-y-3">
                                            <p className="text-[10px] uppercase font-bold text-blue-400">Add Reminders</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <select 
                                                    value={tempReminder.type}
                                                    onChange={(e) => setTempReminder({...tempReminder, type: e.target.value as any})}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"
                                                >
                                                    <option value="date" className="bg-[#121214]">Specific Date</option>
                                                    <option value="day-before" className="bg-[#121214]">Day Before</option>
                                                </select>
                                                <input
                                                    type="time"
                                                    value={tempReminder.time}
                                                    onChange={(e) => setTempReminder({...tempReminder, time: e.target.value})}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            {tempReminder.type === 'date' && (
                                                <input
                                                    type="date"
                                                    value={tempReminder.at}
                                                    onChange={(e) => setTempReminder({...tempReminder, at: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"
                                                />
                                            )}
                                            <input
                                                type="text"
                                                placeholder="Reminder Message (Optional)"
                                                value={tempReminder.message}
                                                onChange={(e) => setTempReminder({...tempReminder, message: e.target.value})}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"
                                            />
                                            <Button 
                                                size="sm" 
                                                className="w-full py-1 text-[10px]"
                                                onClick={() => {
                                                    setNewAssignment({
                                                        ...newAssignment,
                                                        reminders: [...newAssignment.reminders, { ...tempReminder, id: Date.now().toString(), enabled: true }]
                                                    });
                                                    setTempReminder({ type: 'date', time: '09:00', at: '', message: '' });
                                                    sound.playClick();
                                                }}
                                            >
                                                + Add Reminder
                                            </Button>
                                            
                                            {newAssignment.reminders.length > 0 && (
                                                <div className="space-y-1 mt-2">
                                                    {newAssignment.reminders.map((r, ri) => (
                                                        <div key={r.id} className="flex justify-between items-center text-[10px] bg-black/40 p-1.5 rounded-lg border border-white/5">
                                                            <span>{r.type === 'day-before' ? 'Day Before' : r.at} @ {r.time}</span>
                                                            <button onClick={() => setNewAssignment({...newAssignment, reminders: newAssignment.reminders.filter((_, idx) => idx !== ri)})} className="text-rose-400"><X size={10}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Button onClick={handleAddAssignment} className="w-full py-2 text-sm">Add Assignment</Button>
                                    </motion.div>
                                )}

                                <div className="space-y-3">
                                    {assignments.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 text-sm">No assignments yet.</div>
                                    ) : (
                                        assignments.map(assignment => (
                                            <div 
                                                key={assignment.id} 
                                                className={clsx(
                                                    "p-3 rounded-xl border transition-all",
                                                    assignment.completed 
                                                        ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" 
                                                        : "bg-black/20 border-white/5"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <button 
                                                        onClick={() => toggleAssignment(assignment.id)}
                                                        className={clsx(
                                                            "mt-1 w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0",
                                                            assignment.completed 
                                                                ? "bg-emerald-500 border-emerald-500 text-white" 
                                                                : "border-gray-500 text-transparent"
                                                        )}
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={clsx("font-medium truncate", assignment.completed && "line-through")}>
                                                            {assignment.title}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                            <span className="truncate">{assignment.subject}</span>
                                                            <span>•</span>
                                                            <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => deleteAssignment(assignment.id)}
                                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>

                            {/* Upcoming Exams */}
                            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                                        <BookOpen className="text-blue-400" /> Upcoming Exams
                                    </h2>
                                    <button 
                                        onClick={() => setShowAddExam(!showAddExam)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                {showAddExam && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: 'auto' }} 
                                        className="mb-4 space-y-3 p-4 bg-black/20 rounded-xl border border-white/5"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-500 uppercase font-bold">Subject</label>
                                                <input 
                                                    type="text" 
                                                    value={newExam.subject}
                                                    onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                                                    placeholder="Subject Name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-500 uppercase font-bold">Date</label>
                                                <input 
                                                    type="date" 
                                                    value={newExam.date}
                                                    min={getDateKey(new Date())}
                                                    onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-lg space-y-3 col-span-2">
                                                <p className="text-[10px] uppercase font-bold text-blue-400">Add Reminders</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select 
                                                        value={tempReminder.type}
                                                        onChange={(e) => setTempReminder({...tempReminder, type: e.target.value as any})}
                                                        className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"
                                                    >
                                                        <option value="date" className="bg-[#121214]">Specific Date</option>
                                                        <option value="day-before" className="bg-[#121214]">Day Before</option>
                                                    </select>
                                                    <input
                                                        type="time"
                                                        value={tempReminder.time}
                                                        onChange={(e) => setTempReminder({...tempReminder, time: e.target.value})}
                                                        className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                {tempReminder.type === 'date' && (
                                                    <input
                                                        type="date"
                                                        value={tempReminder.at}
                                                        onChange={(e) => setTempReminder({...tempReminder, at: e.target.value})}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"
                                                    />
                                                )}
                                                <input
                                                    type="text"
                                                    placeholder="Reminder Message (Optional)"
                                                    value={tempReminder.message}
                                                    onChange={(e) => setTempReminder({...tempReminder, message: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"
                                                />
                                                <Button 
                                                    size="sm" 
                                                    className="w-full py-1 text-[10px]"
                                                    onClick={() => {
                                                        setNewExam({
                                                            ...newExam,
                                                            reminders: [...newExam.reminders, { ...tempReminder, id: Date.now().toString(), enabled: true }]
                                                        });
                                                        setTempReminder({ type: 'date', time: '09:00', at: '', message: '' });
                                                        sound.playClick();
                                                    }}
                                                >
                                                    + Add Reminder
                                                </Button>
                                                
                                                {newExam.reminders.length > 0 && (
                                                    <div className="space-y-1 mt-2">
                                                        {newExam.reminders.map((r, ri) => (
                                                            <div key={r.id} className="flex justify-between items-center text-[10px] bg-black/40 p-1.5 rounded-lg border border-white/5">
                                                                <span>{r.type === 'day-before' ? 'Day Before' : r.at} @ {r.time}</span>
                                                                <button onClick={() => setNewExam({...newExam, reminders: newExam.reminders.filter((_, idx) => idx !== ri)})} className="text-rose-400"><X size={10}/></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button onClick={handleAddExam} className="w-full py-2 text-sm">Add to Timetable</Button>
                                    </motion.div>
                                )}

                                <div className="space-y-3">
                                    {upcomingExams.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 text-sm italic">No exams scheduled in the timetable.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                                        <th className="py-3 px-4">Subject</th>
                                                        <th className="py-3 px-4 text-center">Date</th>
                                                        <th className="py-3 px-4 text-center">Remaining</th>
                                                        <th className="py-3 px-4 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {college.exams.sort((a,b) => a.date.localeCompare(b.date)).map((exam) => {
                                                        const daysRemaining = getDaysRemaining(exam.date);
                                                        const isCompleted = exam.completed || daysRemaining < 0;
                                                        return (
                                                            <tr key={exam.id} className={clsx("border-b border-white/5 group hover:bg-white/5 transition-colors", isCompleted && "opacity-50")}>
                                                                <td className="py-4 px-4 font-bold text-white">
                                                                    {exam.subject}
                                                                </td>
                                                                <td className="py-4 px-4 text-center text-gray-400 text-sm">{new Date(exam.date).toLocaleDateString()}</td>
                                                                <td className="py-4 px-4 text-center">
                                                                    {isCompleted ? (
                                                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                                                                            Completed
                                                                        </span>
                                                                    ) : (
                                                                        <span className={clsx(
                                                                            "px-2 py-1 rounded-full text-[10px] font-bold",
                                                                            daysRemaining <= 3 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                                        )}>
                                                                            {daysRemaining} Days
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-4 px-4 text-right">
                                                                    <button 
                                                                        onClick={() => deleteExam(exam.id)}
                                                                        className="p-2 text-gray-500 hover:text-rose-400 transition-colors"
                                                                    >
                                                                        <Trash2 size={16} />
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
                            </section>
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                        <div className="space-y-8 max-w-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">Custom Notifications</h2>
                                <Button 
                                    onClick={() => setShowAddCustomNotif(!showAddCustomNotif)}
                                    className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 font-bold"
                                >
                                    {showAddCustomNotif ? 'Cancel' : 'Add Notification'}
                                </Button>
                            </div>

                            {showAddCustomNotif && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 bg-white/10 rounded-2xl border border-white/20 mb-6 space-y-4"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 uppercase font-bold">Message (Emoji allowed)</label>
                                        <input 
                                            type="text"
                                            value={newCustomNotif.message}
                                            onChange={(e) => setNewCustomNotif({ ...newCustomNotif, message: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                            placeholder="e.g. Water Break! 💧"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 uppercase font-bold">Time</label>
                                        <input 
                                            type="time"
                                            value={newCustomNotif.time}
                                            onChange={(e) => setNewCustomNotif({ ...newCustomNotif, time: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <Button onClick={handleAddCustomNotif} className="w-full font-bold">Save Notification</Button>
                                </motion.div>
                            )}

                            <div className="space-y-4">
                                <section>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Task & Exam Reminders</h3>
                                    <div className="space-y-3">
                                        {[...assignments, ...exams].map(item => {
                                            if (!item.reminders || item.reminders.length === 0) return null;
                                            return (
                                                <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold flex items-center gap-2">
                                                            {('title' in item) ? <CheckSquare size={16} className="text-blue-400"/> : <BookOpen size={16} className="text-purple-400"/>}
                                                            {('title' in item) ? (item as any).title : (item as any).subject}
                                                        </h4>
                                                        <span className="text-[10px] uppercase font-bold text-gray-500">
                                                            {('dueDate' in item) ? `Due: ${(item as any).dueDate}` : `Date: ${(item as any).date}`}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {item.reminders.map((rem: any, ri: number) => (
                                                            <div key={rem.id} className={clsx(
                                                                "p-3 rounded-xl border flex items-center justify-between transition-all",
                                                                rem.enabled ? "bg-black/40 border-white/10" : "bg-black/20 border-white/5 opacity-40"
                                                            )}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className={clsx("p-2 rounded-lg", rem.enabled ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-500")}>
                                                                        <Clock size={14}/>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-white">
                                                                            {rem.type === 'day-before' ? 'Day Before' : rem.at} @ {rem.time}
                                                                        </p>
                                                                        <p className="text-[10px] text-gray-400">{rem.message || 'Standard Reminder'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button 
                                                                        onClick={() => {
                                                                            const isAssignment = ('title' in item);
                                                                            const updatedList = isAssignment 
                                                                                ? assignments.map(a => a.id === item.id ? { ...a, reminders: a.reminders!.map((r, idx) => idx === ri ? { ...r, enabled: !r.enabled } : r) } : a)
                                                                                : exams.map(e => e.id === item.id ? { ...e, reminders: e.reminders!.map((r, idx) => idx === ri ? { ...r, enabled: !r.enabled } : r) } : e);
                                                                            updateCollege(isAssignment ? { assignments: updatedList } : { exams: updatedList });
                                                                            sound.playClick();
                                                                        }}
                                                                        className={clsx(
                                                                            "w-8 h-4 rounded-full relative transition-colors",
                                                                            rem.enabled ? "bg-blue-500" : "bg-white/10"
                                                                        )}
                                                                    >
                                                                        <div className={clsx(
                                                                            "w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform",
                                                                            rem.enabled ? "translate-x-4" : "translate-x-1"
                                                                        )} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            const isAssignment = ('title' in item);
                                                                            const updatedList = isAssignment 
                                                                                ? assignments.map(a => a.id === item.id ? { ...a, reminders: a.reminders!.filter((_, idx) => idx !== ri) } : a)
                                                                                : exams.map(e => e.id === item.id ? { ...e, reminders: e.reminders!.filter((_, idx) => idx !== ri) } : e);
                                                                            updateCollege(isAssignment ? { assignments: updatedList } : { exams: updatedList });
                                                                            sound.playError();
                                                                        }}
                                                                        className="p-1.5 text-gray-500 hover:text-rose-400"
                                                                    >
                                                                        <Trash2 size={14}/>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>

                                <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                                            <Bell className="text-blue-400" /> General Notifications
                                        </h2>
                                        <button 
                                            onClick={() => setShowAddCustomNotif(!showAddCustomNotif)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    {showAddCustomNotif && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: 'auto' }} 
                                            className="mb-6 space-y-4 p-4 bg-black/20 rounded-xl border border-white/5"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 uppercase font-bold">Message</label>
                                                <input
                                                    type="text"
                                                    placeholder="Drink water, Take a break..."
                                                    value={newCustomNotif.message}
                                                    onChange={(e) => setNewCustomNotif({...newCustomNotif, message: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs text-gray-400 uppercase font-bold">Time</label>
                                                    <input
                                                        type="time"
                                                        value={newCustomNotif.time}
                                                        onChange={(e) => setNewCustomNotif({...newCustomNotif, time: e.target.value})}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs text-gray-400 uppercase font-bold">Repeats</label>
                                                    <select
                                                        value={newCustomNotif.repeats}
                                                        onChange={(e) => setNewCustomNotif({...newCustomNotif, repeats: e.target.value as any})}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                                    >
                                                        <option value="once" className="bg-[#121214]">Once</option>
                                                        <option value="twice" className="bg-[#121214]">Twice (2 Days)</option>
                                                        <option value="daily" className="bg-[#121214]">Daily</option>
                                                        <option value="specific-days" className="bg-[#121214]">Specific Days</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {newCustomNotif.repeats === 'specific-days' && (
                                                <div className="space-y-2">
                                                    <label className="text-xs text-gray-400 uppercase font-bold">Select Days</label>
                                                    <div className="flex justify-between gap-1">
                                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => {
                                                                    const days = newCustomNotif.days.includes(i)
                                                                        ? newCustomNotif.days.filter(d => d !== i)
                                                                        : [...newCustomNotif.days, i];
                                                                    setNewCustomNotif({...newCustomNotif, days});
                                                                }}
                                                                className={clsx(
                                                                    "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                                                                    newCustomNotif.days.includes(i) ? "bg-blue-500 text-white" : "bg-black/40 text-gray-400 border border-white/5"
                                                                )}
                                                            >
                                                                {day}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <Button onClick={handleAddCustomNotif} className="w-full py-2">Set Notification</Button>
                                        </motion.div>
                                    )}

                                    <div className="space-y-4">
                                        {(college.customNotifications || []).length === 0 ? (
                                            <div className="text-center py-12 text-gray-500 italic bg-white/5 rounded-2xl border border-white/5">
                                                No custom notifications set.
                                            </div>
                                        ) : (
                                            college.customNotifications.map((notif) => (
                                                <div 
                                                    key={notif.id}
                                                    className={clsx(
                                                        "p-4 rounded-2xl border flex items-center justify-between transition-all",
                                                        notif.enabled ? "bg-white/5 border-white/20" : "bg-black/20 border-white/5 opacity-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={clsx(
                                                            "p-3 rounded-xl",
                                                            notif.enabled ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-500"
                                                        )}>
                                                            <Clock size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white">{notif.message}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-xs text-gray-400 font-medium">{notif.time}</p>
                                                                <span className="text-[10px] uppercase px-1.5 py-0.5 bg-white/5 rounded text-gray-500 font-bold border border-white/5">
                                                                    {notif.repeats || 'once'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => toggleCustomNotif(notif.id)}
                                                            className={clsx(
                                                                "w-10 h-6 rounded-full relative transition-colors",
                                                                notif.enabled ? "bg-blue-500" : "bg-white/10"
                                                            )}
                                                        >
                                                            <div className={clsx(
                                                                "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                                                                notif.enabled ? "translate-x-5" : "translate-x-1"
                                                            )} />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteCustomNotif(notif.id)}
                                                            className="p-2 text-gray-500 hover:text-rose-400 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}


                    {activeSection === 'settings' && (
                        <div className="space-y-8 max-w-2xl">
                            <h2 className="text-2xl font-bold">Settings</h2>
                            
                            {/* Midnight Lock */}
                            <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Lock size={20} className="text-blue-400" /> Midnight Lock
                                    </h3>
                                    <button 
                                        onClick={() => {
                                            updateState({ midnightLock: !state.midnightLock });
                                            sound.playClick();
                                        }}
                                        className={clsx(
                                            "w-12 h-6 rounded-full transition-colors relative",
                                            state.midnightLock ? "bg-blue-500" : "bg-white/10"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                                            state.midnightLock ? "translate-x-7" : "translate-x-1"
                                        )} />
                                    </button>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Locks records at 12:00 AM. Today's entries remain editable until midnight.
                                </p>
                            </div>

                            {/* Combined Attendance Section */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <button 
                                    onClick={() => setIsAttendanceCollapsed(!isAttendanceCollapsed)}
                                    className="w-full flex items-center justify-between mb-4 group"
                                >
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <GraduationCap size={20} className="text-blue-400" />
                                        Combined Attendance Selection
                                    </h3>
                                    {isAttendanceCollapsed ? <ChevronDown size={20} className="text-gray-500 group-hover:text-white transition-colors" /> : <ChevronUp size={20} className="text-gray-500 group-hover:text-white transition-colors" />}
                                </button>
                                
                                {!isAttendanceCollapsed && (
                                    <>
                                        <p className="text-sm text-gray-400 mb-6">Select multiple months to see your total average attendance across your entire academic period.</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {monthsToRender.map((m) => {
                                                const id = m.value + (m.year * 12);
                                                const isSelected = selectedMonths.includes(id);
                                                return (
                                                    <button
                                                        key={id}
                                                        onClick={() => toggleMonth(m.value, m.year)}
                                                        className={clsx(
                                                            "p-3 rounded-xl border text-sm font-medium transition-all text-center",
                                                            isSelected ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-black/20 border-white/5 text-gray-500 hover:border-white/10"
                                                        )}
                                                    >
                                                        {m.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {/* Notifications Setting in Settings - Removed as we have a dedicated tab */}
                            
                            {/* Customization Settings */}
                            {/* Customization Settings */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                                <button
                                    onClick={() => {
                                        setIsCustomizationCollapsed(!isCustomizationCollapsed);
                                        sound.playClick();
                                    }}
                                    className="w-full flex items-center justify-between group"
                                >
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                                        <Edit2 size={20} className="text-blue-400" />
                                        Customization Panel
                                    </h3>
                                    {isCustomizationCollapsed ? (
                                        <ChevronDown size={20} className="text-gray-500 group-hover:text-white transition-colors" />
                                    ) : (
                                        <ChevronUp size={20} className="text-gray-500 group-hover:text-white transition-colors" />
                                    )}
                                </button>

                                {!isCustomizationCollapsed && (
                                    <div className="space-y-6 pt-4 border-t border-white/5">
                                        
                                        {/* Sub-section 1: Quick Theme Presets */}
                                        <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-4">
                                            <button 
                                                onClick={() => { setCustomPresetsOpen(!customPresetsOpen); sound.playClick(); }}
                                                className="w-full flex items-center justify-between font-bold text-xs text-gray-400 uppercase tracking-wider block"
                                            >
                                                <span>Quick Theme Presets</span>
                                                {customPresetsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>

                                            {customPresetsOpen && (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
                                                    {THEME_PRESETS.map((preset) => (
                                                        <button
                                                            key={preset.name}
                                                            onClick={() => {
                                                                updateFootball({
                                                                    customization: {
                                                                        ...state.football.customization,
                                                                        accentColor: preset.accentColor,
                                                                        gradientStart: preset.gradientStart,
                                                                        gradientMiddle: preset.gradientMiddle,
                                                                        gradientEnd: preset.gradientEnd,
                                                                        fontStyle: preset.fontStyle,
                                                                        blur: preset.blur,
                                                                        logoFont: preset.fontStyle === 'cyber' ? 'mono' : preset.fontStyle === 'clean' ? 'grotesk' : preset.fontStyle === 'elegant' ? 'cinzel-dec' : preset.fontStyle === 'playful' ? 'fascinate' : 'sekuya',
                                                                        greetingsFont: preset.fontStyle === 'cyber' ? 'orbitron' : preset.fontStyle === 'clean' ? 'grotesk' : preset.fontStyle === 'elegant' ? 'cinzel' : preset.fontStyle === 'playful' ? 'fascinate' : 'outfit',
                                                                        bodyFont: preset.fontStyle === 'cyber' ? 'rajdhani' : preset.fontStyle === 'clean' ? 'archivo' : preset.fontStyle === 'elegant' ? 'lora' : preset.fontStyle === 'playful' ? 'honk' : 'jakarta'
                                                                    }
                                                                });
                                                                sound.playSuccess();
                                                            }}
                                                            className="p-3 bg-black/35 hover:bg-black/50 border border-white/5 hover:border-white/20 rounded-xl flex flex-col items-center gap-2 transition-all group"
                                                        >
                                                            <div 
                                                                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110"
                                                                style={{
                                                                    background: `linear-gradient(135deg, ${preset.gradientStart} 0%, ${preset.gradientMiddle} 50%, ${preset.gradientEnd} 100%)`
                                                                }}
                                                            >
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.accentColor }} />
                                                            </div>
                                                            <span className="text-xs font-semibold text-gray-300 group-hover:text-white text-center">{preset.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Sub-section 2: Color Styling */}
                                        <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-4">
                                            <button 
                                                onClick={() => { setCustomColorsOpen(!customColorsOpen); sound.playClick(); }}
                                                className="w-full flex items-center justify-between font-bold text-xs text-gray-400 uppercase tracking-wider block"
                                            >
                                                <span>Theme Colors</span>
                                                {customColorsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>

                                            {customColorsOpen && (
                                                <div className="space-y-4 pt-2 border-t border-white/5">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-400 block mb-2">Accent Theme Color</label>
                                                        <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-xl border border-white/5">
                                                            <input 
                                                                type="color" 
                                                                value={state.football.customization.accentColor} 
                                                                onChange={(e) => {
                                                                    updateFootball({
                                                                        customization: {
                                                                            ...state.football.customization,
                                                                            accentColor: e.target.value
                                                                        }
                                                                    });
                                                                }}
                                                                className="w-10 h-10 rounded-lg border-0 bg-transparent cursor-pointer"
                                                            />
                                                            <span className="text-sm font-mono text-gray-300 uppercase">{state.football.customization.accentColor}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sub-section 3: Granular Fonts */}
                                        <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-4">
                                            <button 
                                                onClick={() => { setCustomFontsOpen(!customFontsOpen); sound.playClick(); }}
                                                className="w-full flex items-center justify-between font-bold text-xs text-gray-400 uppercase tracking-wider block"
                                            >
                                                <span>Typography Settings</span>
                                                {customFontsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>

                                            {customFontsOpen && (
                                                <div className="space-y-4 pt-2 border-t border-white/5">
                                                    
                                                    {/* Branding / Logo Font */}
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-400 block mb-2">Logo & Branding Font Style</label>
                                                        <select 
                                                            value={state.football.customization.logoFont || 'sekuya'} 
                                                            onChange={(e) => {
                                                                updateFootball({
                                                                    customization: {
                                                                        ...state.football.customization,
                                                                        logoFont: e.target.value
                                                                    }
                                                                });
                                                                sound.playClick();
                                                            }}
                                                            className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm font-medium text-gray-300 focus:outline-none focus:border-blue-500 animate-none"
                                                        >
                                                            <option value="sekuya" className="bg-[#121214] text-white" style={{ fontFamily: '"Sekuya", sans-serif' }}>Sekuya (Original Cyber)</option>
                                                            <option value="mono" className="bg-[#121214] text-white" style={{ fontFamily: '"Share Tech Mono", monospace' }}>Share Tech Mono (Console Tech)</option>
                                                            <option value="grotesk" className="bg-[#121214] text-white" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Space Grotesk (Modern Geometric)</option>
                                                            <option value="fascinate" className="bg-[#121214] text-white" style={{ fontFamily: '"Fascinate Inline", cursive' }}>Fascinate Inline (Stylized Art Deco)</option>
                                                            <option value="cinzel-dec" className="bg-[#121214] text-white" style={{ fontFamily: '"Cinzel Decorative", serif' }}>Cinzel Decorative (Classic Serif)</option>
                                                            <option value="orbitron" className="bg-[#121214] text-white" style={{ fontFamily: '"Orbitron", sans-serif' }}>Orbitron (Futuristic Display)</option>
                                                        </select>
                                                    </div>

                                                    {/* Greetings / Section Headers Font */}
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-400 block mb-2">Greetings & Section Headers Font Style</label>
                                                        <select 
                                                            value={state.football.customization.greetingsFont || 'outfit'} 
                                                            onChange={(e) => {
                                                                updateFootball({
                                                                    customization: {
                                                                        ...state.football.customization,
                                                                        greetingsFont: e.target.value
                                                                    }
                                                                });
                                                                sound.playClick();
                                                            }}
                                                            className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm font-medium text-gray-300 focus:outline-none focus:border-blue-500 animate-none"
                                                        >
                                                            <option value="outfit" className="bg-[#121214] text-white" style={{ fontFamily: '"Outfit", sans-serif' }}>Outfit (Elegant Geometric)</option>
                                                            <option value="orbitron" className="bg-[#121214] text-white" style={{ fontFamily: '"Orbitron", sans-serif' }}>Orbitron (Futuristic Sci-Fi)</option>
                                                            <option value="grotesk" className="bg-[#121214] text-white" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Space Grotesk (Symmetrical Sans)</option>
                                                            <option value="fascinate" className="bg-[#121214] text-white" style={{ fontFamily: '"Fascinate Inline", cursive' }}>Fascinate Inline (Artistic Neon)</option>
                                                            <option value="cinzel" className="bg-[#121214] text-white" style={{ fontFamily: '"Cinzel", serif' }}>Cinzel (Classic Roman)</option>
                                                            <option value="rajdhani" className="bg-[#121214] text-white" style={{ fontFamily: '"Rajdhani", sans-serif' }}>Rajdhani (Technical Square)</option>
                                                        </select>
                                                    </div>

                                                    {/* Universal Body / Main Content Font */}
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-400 block mb-2">Universal Body & Content Font Style</label>
                                                        <select 
                                                            value={state.football.customization.bodyFont || 'jakarta'} 
                                                            onChange={(e) => {
                                                                updateFootball({
                                                                    customization: {
                                                                        ...state.football.customization,
                                                                        bodyFont: e.target.value
                                                                    }
                                                                });
                                                                sound.playClick();
                                                            }}
                                                            className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm font-medium text-gray-300 focus:outline-none focus:border-blue-500 animate-none"
                                                        >
                                                            <option value="jakarta" className="bg-[#121214] text-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Plus Jakarta Sans (Balanced UI)</option>
                                                            <option value="rajdhani" className="bg-[#121214] text-white" style={{ fontFamily: '"Rajdhani", sans-serif' }}>Rajdhani (Tech Compact)</option>
                                                            <option value="archivo" className="bg-[#121214] text-white" style={{ fontFamily: '"Archivo", sans-serif' }}>Archivo (High-Legibility Grotesque)</option>
                                                            <option value="grotesk" className="bg-[#121214] text-white" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Space Grotesk (Geometric Sans)</option>
                                                            <option value="honk" className="bg-[#121214] text-white" style={{ fontFamily: '"Honk", cursive' }}>Honk (Playful Color Font)</option>
                                                            <option value="lora" className="bg-[#121214] text-white" style={{ fontFamily: '"Lora", serif' }}>Lora (Sophisticated Serif)</option>
                                                        </select>
                                                    </div>

                                                    <p className="text-[10px] text-gray-500 italic">
                                                        Note: Preset selections will align typography dynamically. You can adjust individually as needed.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sub-section 4: Background Visuals */}
                                        <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-4">
                                            <button 
                                                onClick={() => { setCustomBgOpen(!customBgOpen); sound.playClick(); }}
                                                className="w-full flex items-center justify-between font-bold text-xs text-gray-400 uppercase tracking-wider block"
                                            >
                                                <span>Background & Backdrop Styling</span>
                                                {customBgOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>

                                            {customBgOpen && (
                                                <div className="space-y-4 pt-2 border-t border-white/5">
                                                    
                                                    <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                                        <span className="text-xs text-gray-400">Default Themes:</span>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    updateFootball({
                                                                        customization: {
                                                                            ...state.football.customization,
                                                                            gradientStart: '#0a0a0c',
                                                                            gradientMiddle: '#0e131f',
                                                                            gradientEnd: '#0a0a0c'
                                                                        }
                                                                    });
                                                                    sound.playClick();
                                                                }}
                                                                className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[10px] font-bold text-blue-300 rounded-lg transition-colors uppercase tracking-wider"
                                                            >
                                                                Default Blue-Noir
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    updateFootball({
                                                                        customization: {
                                                                            ...state.football.customization,
                                                                            gradientStart: '#000000',
                                                                            gradientMiddle: '#000000',
                                                                            gradientEnd: '#000000'
                                                                        }
                                                                    });
                                                                    sound.playClick();
                                                                }}
                                                                className="px-2.5 py-1.5 bg-black/40 hover:bg-black/60 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white rounded-lg transition-colors uppercase tracking-wider"
                                                            >
                                                                Pure Black
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-medium text-gray-400">Set Solid Background Color</span>
                                                            <div className="flex items-center gap-3">
                                                                <input 
                                                                    type="color" 
                                                                    value={state.football.customization.gradientStart === state.football.customization.gradientEnd ? state.football.customization.gradientStart : '#0a0a0c'} 
                                                                    onChange={(e) => {
                                                                        const color = e.target.value;
                                                                        updateFootball({
                                                                            customization: {
                                                                                ...state.football.customization,
                                                                                gradientStart: color,
                                                                                gradientMiddle: color,
                                                                                gradientEnd: color
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                                                                />
                                                                <span className="text-xs font-mono text-gray-300 uppercase">
                                                                    {state.football.customization.gradientStart === state.football.customization.gradientEnd ? state.football.customization.gradientStart : 'Custom Gradient'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Custom Gradient Stops (Fine Control)</span>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div>
                                                                <span className="text-[10px] text-gray-500 block mb-1">Start Color</span>
                                                                <input 
                                                                    type="color" 
                                                                    value={state.football.customization.gradientStart} 
                                                                    onChange={(e) => {
                                                                        updateFootball({
                                                                            customization: {
                                                                                ...state.football.customization,
                                                                                gradientStart: e.target.value
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="w-full h-10 rounded-lg bg-black/20 border border-white/5 cursor-pointer"
                                                                />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-gray-500 block mb-1">Middle Color</span>
                                                                <input 
                                                                    type="color" 
                                                                    value={state.football.customization.gradientMiddle} 
                                                                    onChange={(e) => {
                                                                        updateFootball({
                                                                            customization: {
                                                                                ...state.football.customization,
                                                                                gradientMiddle: e.target.value
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="w-full h-10 rounded-lg bg-black/20 border border-white/5 cursor-pointer"
                                                                />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-gray-500 block mb-1">End Color</span>
                                                                <input 
                                                                    type="color" 
                                                                    value={state.football.customization.gradientEnd} 
                                                                    onChange={(e) => {
                                                                        updateFootball({
                                                                            customization: {
                                                                                ...state.football.customization,
                                                                                gradientEnd: e.target.value
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="w-full h-10 rounded-lg bg-black/20 border border-white/5 cursor-pointer"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 border-t border-white/5 space-y-3">
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Background Image URL (Optional)</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="https://images.unsplash.com/photo-..." 
                                                                value={state.football.customization.backgroundImage || ''} 
                                                                onChange={(e) => {
                                                                    updateFootball({
                                                                        customization: {
                                                                            ...state.football.customization,
                                                                            backgroundImage: e.target.value || null
                                                                        }
                                                                    });
                                                                }}
                                                                className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm font-medium text-gray-300 focus:outline-none focus:border-blue-500"
                                                            />
                                                        </div>

                                                        {state.football.customization.backgroundImage && (
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">Background Blur ({state.football.customization.blur}px)</label>
                                                                    <input 
                                                                        type="range" 
                                                                        min="0" 
                                                                        max="40" 
                                                                        value={state.football.customization.blur} 
                                                                        onChange={(e) => {
                                                                            updateFootball({
                                                                                customization: {
                                                                                    ...state.football.customization,
                                                                                    blur: parseInt(e.target.value)
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="w-full accent-blue-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-gray-500 block mb-1">Zoom ({state.football.customization.bgZoom}%)</label>
                                                                    <input 
                                                                        type="range" 
                                                                        min="50" 
                                                                        max="200" 
                                                                        value={state.football.customization.bgZoom} 
                                                                        onChange={(e) => {
                                                                            updateFootball({
                                                                                customization: {
                                                                                    ...state.football.customization,
                                                                                    bgZoom: parseInt(e.target.value)
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="w-full accent-blue-500"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Restore Defaults */}
                                        <div className="pt-4 border-t border-white/5 flex justify-end">
                                            <Button 
                                                variant="secondary" 
                                                onClick={() => {
                                                    updateFootball({
                                                        customization: {
                                                            accentColor: '#3b82f6',
                                                            blur: 10,
                                                            gradientStart: '#0a0a0c',
                                                            gradientMiddle: '#0e131f',
                                                            gradientEnd: '#0a0a0c',
                                                            fontStyle: 'default',
                                                            logoFont: 'sekuya',
                                                            greetingsFont: 'outfit',
                                                            bodyFont: 'jakarta',
                                                            backgroundImage: null,
                                                            bgZoom: 100,
                                                            bgX: 50,
                                                            bgY: 50
                                                        }
                                                    });
                                                    sound.playSuccess();
                                                }}
                                                className="text-xs"
                                            >
                                                Restore to Default
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reset Profile */}
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <RotateCcw size={20} className="text-amber-400" /> Reset Profile
                                    </h3>
                                    <Button variant="secondary" className="bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20" onClick={handleReset}>Reset Profile</Button>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Reset your onboarding profile name while preserving all your academic records.
                                </p>
                            </div>

                            {/* Danger Zone */}
                            <div className="border border-red-500/20 rounded-2xl overflow-hidden">
                                <div className="p-6 bg-red-500/5">
                                    <h3 className="text-red-400 font-bold flex items-center gap-2 mb-2">
                                        <AlertCircle size={20} /> Danger Zone
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-6">Permanently delete all data and reset the application. This action cannot be undone.</p>
                                    <Button variant="danger" onClick={handleFactoryReset}>Factory Reset</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Modals */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="max-w-sm w-full bg-[#121214] p-6 rounded-2xl border border-white/10 relative text-center">
                        <button onClick={() => setShowResetModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <RotateCcw size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Reset Profile?</h3>
                        <p className="text-gray-400 text-sm mb-6">Are you sure you want to reset your profile? This will ask for your name again but preserve your academic records.</p>
                        <div className="flex gap-3">
                            <Button className="flex-1 bg-white/5 text-white hover:bg-white/10" onClick={() => setShowResetModal(false)}>Cancel</Button>
                            <Button className="flex-1 bg-amber-500 text-white hover:bg-amber-600" onClick={confirmReset}>Confirm</Button>
                        </div>
                    </div>
                </div>
            )}

            {showFactoryResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="max-w-sm w-full bg-[#121214] p-6 rounded-2xl border border-white/10 relative text-center">
                        <button onClick={() => setShowFactoryResetModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                        <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Factory Reset</h3>
                        <p className="text-gray-400 text-sm mb-6">CRITICAL: This will PERMANENTLY DELETE all your data. Are you absolutely sure?</p>
                        <div className="flex gap-3">
                            <Button className="flex-1 bg-white/5 text-white hover:bg-white/10" onClick={() => setShowFactoryResetModal(false)}>Cancel</Button>
                            <Button className="flex-1 bg-rose-500 text-white hover:bg-rose-600" onClick={confirmFactoryReset}>Reset All</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
