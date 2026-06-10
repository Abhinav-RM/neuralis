import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Clock, CheckSquare, BookOpen, Calendar } from 'lucide-react';

const getDaysRemaining = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateStr);
    examDate.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

interface OverviewSectionProps {
    percentage: number;
    selectedMonthDate: Date;
    classesList: string[];
    pendingAssignmentsCount: number;
    upcomingExamsCount: number;
    nextExam: { subject: string; date: string } | null;
}

export const OverviewSection = React.memo<OverviewSectionProps>(({
    percentage, selectedMonthDate, classesList,
    pendingAssignmentsCount, upcomingExamsCount, nextExam
}) => {
    return (
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
                    <div className="text-2xl font-bold">{pendingAssignmentsCount}</div>
                    <div className="text-xs text-gray-500 mt-1">Pending</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen size={20} className="text-rose-400" />
                        <span className="text-sm text-gray-400">Exams</span>
                    </div>
                    <div className="text-2xl font-bold">{upcomingExamsCount}</div>
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
                            {(() => {
                                const dr = getDaysRemaining(nextExam.date);
                                if (dr === 0) {
                                    return (
                                        <>
                                            <div className="text-3xl font-black text-rose-400 uppercase tracking-wider">
                                                Today
                                            </div>
                                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Exam Day</div>
                                        </>
                                    );
                                }
                                if (dr === 1) {
                                    return (
                                        <>
                                            <div className="text-3xl font-black text-amber-400 uppercase tracking-wider">
                                                Tomorrow
                                            </div>
                                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Prep Day</div>
                                        </>
                                    );
                                }
                                return (
                                    <>
                                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                            {dr}
                                        </div>
                                        <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Days Remaining</div>
                                    </>
                                );
                            })()}
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
    );
});

OverviewSection.displayName = 'OverviewSection';
