import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, CheckSquare, Clock, Settings as SettingsIcon, LogOut, Plus, Check, Trash2, AlertCircle, GraduationCap, Edit2, Save, X, CreditCard, ChevronLeft, ChevronRight, Lock, Menu, LayoutDashboard, Bell, ChevronDown, ChevronUp, RotateCcw, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '../ui/Button';
import clsx from 'clsx';
import { getDateKey } from '../../utils/helpers';
import { sound } from '../../utils/sound';
import { AttendanceRecord } from '../../types';
import { OverviewSection } from './sections/OverviewSection';
import { AttendanceSection } from './sections/AttendanceSection';
import { TimetableSection } from './sections/TimetableSection';
import { TasksSection } from './sections/TasksSection';
import { NotificationsSection } from './sections/NotificationsSection';
import { SettingsSection } from './sections/SettingsSection';

const getGreeting = (time: Date, userName?: string, casing?: 'caps' | 'small' | 'mix') => {
    const hrs = time.getHours();
    let greet = 'Good evening';
    if (hrs >= 5 && hrs < 12) {
        greet = 'Good morning';
    } else if (hrs >= 12 && hrs < 17) {
        greet = 'Good afternoon';
    }

    const activeCasing = casing || 'caps';
    if (activeCasing === 'caps') {
        greet = greet.toUpperCase();
    } else if (activeCasing === 'small') {
        greet = greet.toLowerCase();
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
    const [activeSection, setActiveSection] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());

    const [isLight, setIsLight] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            const currentTheme = state.theme || 'system';
            if (currentTheme === 'system') {
                setIsLight(!window.matchMedia('(prefers-color-scheme: dark)').matches);
            } else {
                setIsLight(currentTheme === 'light');
            }
        };
        checkTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => {
            if ((state.theme || 'system') === 'system') {
                checkTheme();
            }
        };
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, [state.theme]);

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

    const pendingAssignments = useMemo(() => assignments.filter(a => !a.completed), [assignments]);
    const upcomingExams = useMemo(() => exams.filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0))), [exams]);
    const nextExam = useMemo(() => upcomingExams.length > 0 ? [...upcomingExams].sort((a,b) => a.date.localeCompare(b.date))[0] : null, [upcomingExams]);

    const [showResetModal, setShowResetModal] = useState(false);
    const [showFactoryResetModal, setShowFactoryResetModal] = useState(false);

    const handleReset = useCallback(() => setShowResetModal(true), []);
    const confirmReset = useCallback(() => {
        updateState({ userType: 'student', hasOnboarded: false, userName: '' });
        setShowResetModal(false);
    }, [updateState]);

    const handleFactoryReset = useCallback(() => setShowFactoryResetModal(true), []);
    const confirmFactoryReset = useCallback(() => {
        resetAll();
        window.location.reload();
    }, [resetAll]);

    const markAttendance = useCallback((status: 'present' | 'absent-personal' | 'absent-college') => {
        const today = getDateKey(new Date());
        updateCollege({
            attendanceHistory: {
                ...attendanceHistory,
                [today]: { date: today, status, timestamp: new Date().toISOString() }
            }
        });
        sound.playSuccess();
    }, [attendanceHistory, updateCollege]);

    const toggleDaily = useCallback((key: keyof typeof dailyFlags) => {
        updateCollege({
            dailyFlags: { ...dailyFlags, [key]: !dailyFlags[key] }
        });
        sound.playClick();
    }, [dailyFlags, updateCollege]);

    const monthsToRender = useMemo(() => {
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
        return [...months].reverse();
    }, []);

    const selectedMonths = college.selectedMonthsForTotal || [];
    
    const toggleMonth = useCallback((monthIdx: number, year: number) => {
        const id = monthIdx + (year * 12);
        const current = college.selectedMonthsForTotal || [];
        const next = current.includes(id) 
            ? current.filter(m => m !== id)
            : [...current, id];
        updateCollege({ selectedMonthsForTotal: next });
        sound.playClick();
    }, [college.selectedMonthsForTotal, updateCollege]);

    const combinedStats = useMemo(() => {
        if (selectedMonths.length === 0) return { present: 0, absent: 0, leave: 0, total: 0, percentage: 0 };
        let present = 0, absent = 0, leave = 0;
        Object.values(college.attendanceHistory).forEach((record: any) => {
            const [y, m] = record.date.split('-').map(Number);
            const id = (m - 1) + (y * 12);
            if (selectedMonths.includes(id)) {
                const remark = college.remarks?.[record.date];
                const weight = remark?.isHalfDay ? 0.5 : 1;
                if (record.status === 'present') present += weight;
                else if (record.status === 'leave') leave += weight;
                else if (record.status === 'absent-personal') absent += weight;
            }
        });
        const effectivePresent = present + leave;
        const total = effectivePresent + absent;
        return { present: effectivePresent, absent, leave, total, percentage: total === 0 ? 0 : (effectivePresent / total) * 100 };
    }, [selectedMonths, college.attendanceHistory, college.remarks]);

    const todayRecord = attendanceHistory[getDateKey(new Date())];

    const cycleTheme = useCallback(() => {
        const currentTheme = state.theme || 'system';
        let nextTheme: 'dark' | 'light' | 'system';
        if (currentTheme === 'dark') {
            nextTheme = 'light';
        } else if (currentTheme === 'light') {
            nextTheme = 'system';
        } else {
            nextTheme = 'dark';
        }
        updateState({ theme: nextTheme });
        sound.playClick();
    }, [state.theme, updateState]);

    const renderThemeToggle = () => {
        const currentTheme = state.theme || 'system';
        return (
            <button
                onClick={cycleTheme}
                className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all duration-200 backdrop-blur-sm"
                title={`Theme: ${currentTheme.toUpperCase()} (Click to toggle)`}
                aria-label="Toggle Theme"
            >
                {currentTheme === 'light' && <Sun size={18} className="text-amber-400" />}
                {currentTheme === 'dark' && <Moon size={18} className="text-indigo-400" />}
                {currentTheme === 'system' && <Monitor size={18} className="text-blue-400" />}
            </button>
        );
    };

    const { accentColor, greetingsColor, greetingsCasing, gradientStart, gradientMiddle, gradientEnd, backgroundImage, blur, bgZoom, bgX, bgY, fontStyle, logoFont, greetingsFont, bodyFont } = state.football.customization;

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

    const bgStyle: React.CSSProperties = isLight
        ? {
            backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }
        : !backgroundImage
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
            <div className={clsx("absolute inset-0 -z-10 transition-colors duration-300", isLight ? "hidden" : "bg-black/45")} />
            <div className="fixed inset-0 pointer-events-none z-[10] opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />
            {!isLight && (
                <div className="fixed inset-0 pointer-events-none z-[10] opacity-40 bg-[radial-gradient(circle_at_center,_transparent_60%,_black_100%)]" />
            )}

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
                        <h1 
                            className={clsx("text-xl font-greetings font-bold tracking-tight", !greetingsColor && "text-white")}
                            style={greetingsColor ? { color: greetingsColor } : undefined}
                        >
                            {getGreeting(currentTime, state.userName, greetingsCasing)}
                        </h1>
                    </div>
                    {renderThemeToggle()}
                </header>

                {/* Desktop Header */}
                <header className="hidden lg:block px-8 py-8 bg-transparent sticky top-0 z-20">
                    <div className="max-w-5xl mx-auto flex justify-between items-center">
                        <div>
                            <h1 
                                className={clsx("text-2xl font-greetings font-bold tracking-tight", !greetingsColor && "text-white")}
                                style={greetingsColor ? { color: greetingsColor } : undefined}
                            >
                                {getGreeting(currentTime, state.userName, greetingsCasing)}
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">Ready to tackle today's academic goals?</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-2xl font-mono font-bold text-blue-400">
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                            {renderThemeToggle()}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
                    {activeSection === 'overview' && (
                        <OverviewSection
                            percentage={percentage}
                            selectedMonthDate={selectedMonthDate}
                            classesList={classesList}
                            pendingAssignmentsCount={pendingAssignments.length}
                            upcomingExamsCount={upcomingExams.length}
                            nextExam={nextExam}
                        />
                    )}

                    {activeSection === 'attendance' && (
                        <AttendanceSection
                            percentage={percentage}
                            effectivePresent={effectivePresent}
                            totalCalcDays={totalCalcDays}
                            selectedMonthDate={selectedMonthDate}
                            setSelectedMonthDate={setSelectedMonthDate}
                            attendanceStatus={attendanceStatus}
                            todayRecord={todayRecord}
                            markAttendance={markAttendance}
                            selectedMonths={selectedMonths}
                            combinedStats={combinedStats}
                            CalendarComponent={StudentCalendar}
                        />
                    )}

                    {activeSection === 'timetable' && (
                        <TimetableSection
                            timetable={timetable}
                            currentDay={currentDay}
                            currentHour={currentHour}
                            updateCollege={updateCollege}
                        />
                    )}

                    {activeSection === 'tasks' && (
                        <TasksSection
                            assignments={assignments}
                            exams={exams}
                            updateCollege={updateCollege}
                        />
                    )}

                    {activeSection === 'notifications' && (
                        <NotificationsSection
                            assignments={assignments}
                            exams={exams}
                            customNotifications={college.customNotifications || []}
                            updateCollege={updateCollege}
                        />
                    )}

                    {activeSection === 'settings' && (
                        <SettingsSection
                            state={state}
                            updateState={updateState}
                            updateFootball={updateFootball}
                            updateCollege={updateCollege}
                            monthsToRender={monthsToRender}
                            selectedMonths={selectedMonths}
                            toggleMonth={toggleMonth}
                            handleReset={handleReset}
                            handleFactoryReset={handleFactoryReset}
                            themePresets={THEME_PRESETS}
                        />
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
