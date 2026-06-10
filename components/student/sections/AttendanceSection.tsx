import React, { useState } from 'react';
import clsx from 'clsx';
import { GraduationCap, Calendar, X, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { sound } from '../../../utils/sound';

interface AttendanceSectionProps {
    percentage: number;
    effectivePresent: number;
    totalCalcDays: number;
    selectedMonthDate: Date;
    setSelectedMonthDate: (d: Date) => void;
    attendanceStatus: { type: string; count: number; msg: string };
    todayRecord: { status: string } | undefined;
    markAttendance: (status: 'present' | 'absent-personal' | 'absent-college') => void;
    clearAttendance: (d: Date) => void;
    selectedMonths: number[];
    combinedStats: { present: number; absent: number; leave: number; total: number; percentage: number };
    CalendarComponent: React.ComponentType<{ currentDate: Date; setCurrentDate: (d: Date) => void }>;
}

export const AttendanceSection = React.memo<AttendanceSectionProps>(({
    percentage, effectivePresent, totalCalcDays, selectedMonthDate, setSelectedMonthDate,
    attendanceStatus, todayRecord, markAttendance, clearAttendance, selectedMonths, combinedStats, CalendarComponent
}) => {
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    return (
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
                    <div className="mt-3 border-t border-white/5 pt-2 text-right space-y-1">
                        <p className="text-[10px] text-gray-500 italic">
                            * Unmarked days will be counted as Holiday
                        </p>
                        <p className="text-[10px] text-gray-500 italic">
                            * Please verify that your past attendance matches official records. Report any discrepancies to the developer.
                        </p>
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
            <div className="space-y-4">
                <CalendarComponent currentDate={selectedMonthDate} setCurrentDate={setSelectedMonthDate} />
                
                {/* Clear Attendance Bar */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-[10px] sm:text-xs text-gray-400 italic whitespace-nowrap shrink-0">
                        Clear Attendance for current month
                    </span>
                    <button
                        onClick={() => {
                            setShowClearConfirm(true);
                            sound.playClick();
                        }}
                        className="px-2 py-1.5 sm:px-3 sm:py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all"
                    >
                        Clear Attendance
                    </button>
                </div>

                {/* Custom confirmation modal */}
                {showClearConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="max-w-sm w-full bg-[#121214] p-6 rounded-2xl border border-white/10 relative text-center">
                            <button onClick={() => setShowClearConfirm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">Clear Month Attendance?</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Are you sure you want to clear all attendance records for{' '}
                                <span className="font-bold text-white">
                                    {selectedMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <Button className="flex-1 bg-white/5 text-white hover:bg-white/10" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
                                <Button className="flex-1 bg-rose-500 text-white hover:bg-rose-600" onClick={() => {
                                    clearAttendance(selectedMonthDate);
                                    setShowClearConfirm(false);
                                }}>Clear Records</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

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
    );
});

AttendanceSection.displayName = 'AttendanceSection';
