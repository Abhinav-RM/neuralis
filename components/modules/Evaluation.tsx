import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getMonthName, getDateKey } from '../../utils/helpers';
import { Activity, Award, Calendar, ChevronLeft, ChevronRight, Share2, Trophy, Target, Zap, BookOpen, Flame, Star, Sparkles } from 'lucide-react';
import { AttendanceRecord, TrainingSession } from '../../types';
import { sound } from '../../utils/sound';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export const Evaluation: React.FC = () => {
    const { state } = useApp();
    const { football, gym, college } = state;

    // View Date State (Default to today, allows navigation)
    const [viewDate, setViewDate] = useState(new Date());
    const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
    const [activeTab, setActiveTab] = useState<'report' | 'history'>('report');

    const currentMonth = getMonthName(viewDate.getMonth());
    const currentYear = viewDate.getFullYear();
    const currentMonthIdx = viewDate.getMonth();
    
    const today = new Date();
    const isCurrentMonth = currentMonthIdx === today.getMonth() && currentYear === today.getFullYear();

    // Determine days passed in the viewed month
    let effectiveDaysPassed: number;
    if (isCurrentMonth) {
        effectiveDaysPassed = today.getDate();
    } else {
        effectiveDaysPassed = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
    }

    const startDateObj = useMemo(() => state.startDate ? new Date(state.startDate) : new Date(), [state.startDate]);
    
    // Adjust if user started within the viewed month
    if (startDateObj.getMonth() === currentMonthIdx && startDateObj.getFullYear() === currentYear) {
        const startDay = startDateObj.getDate();
        effectiveDaysPassed = Math.max(1, effectiveDaysPassed - startDay + 1);
    }

    // Navigation Handlers
    const prevMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() - 1);
        setViewDate(d);
        sound.playClick();
    };

    const nextMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + 1);
        if (d <= new Date()) {
            setViewDate(d);
            sound.playClick();
        } else {
            sound.playError();
        }
    };

    // Optimized Data Catching Logic
    const getStats = (history: Record<string, any>, type: 'training' | 'attendance') => {
        const monthlyEntries = Object.values(history).filter(entry => {
            if (!entry || !entry.date) return false;
            const [y, m] = entry.date.split('-').map(Number);
            return y === currentYear && (m - 1) === currentMonthIdx;
        });

        if (type === 'attendance') {
            let present = 0;
            let leave = 0;
            let absent = 0;
            let holidays = 0;

            monthlyEntries.forEach(e => {
                const record = e as AttendanceRecord;
                const remark = college.remarks[record.date];
                const weight = remark?.isHalfDay ? 0.5 : 1;

                if (record.status === 'present') {
                    present += weight;
                } else if (record.status === 'leave') {
                    leave += weight;
                } else if (record.status === 'absent-personal') {
                    absent += weight;
                } else if (record.status === 'absent-college') {
                    holidays += 1;
                }
            });

            const effectivePresent = present + leave;
            const total = effectivePresent + absent;
            const score = total === 0 ? 0 : (effectivePresent / total) * 100;
            return { score, count: effectivePresent, total: total, holidays };
        } else {
            // Consistency = Unique days with completed sessions
            const activeDays = new Set(monthlyEntries.filter(e => (e as TrainingSession).completed).map(e => e.date)).size;
            const score = Math.min(100, (activeDays / effectiveDaysPassed) * 100);
            return { score, count: activeDays, total: effectiveDaysPassed };
        }
    };

    const footballStats = getStats(football.trainingHistory, 'training');
    const gymStats = getStats(gym.trainingHistory, 'training');
    const collegeStatsRaw = getStats(college.attendanceHistory, 'attendance');
    const collegeStats = (college.savedTotalAttendance !== null && isCurrentMonth) 
        ? { ...collegeStatsRaw, score: college.savedTotalAttendance }
        : collegeStatsRaw;

    const averageScore = useMemo(() => {
        const stats = [
            { id: 'football', score: footballStats?.score || 0, hasData: (footballStats?.count || 0) > 0 || ((footballStats?.total || 0) > 0 && (footballStats?.score || 0) < 100) },
            { id: 'gym', score: gymStats?.score || 0, hasData: (gymStats?.count || 0) > 0 || ((gymStats?.total || 0) > 0 && (gymStats?.score || 0) < 100) },
            { id: 'college', score: collegeStats?.score || 0, hasData: (collegeStats?.total || 0) > 0 }
        ];
        
        const activeStats = stats.filter(s => s.hasData && state.enabledModules[s.id as keyof typeof state.enabledModules]);
        
        if (activeStats.length === 0) {
            const fallbackStats = stats.filter(s => state.enabledModules[s.id as keyof typeof state.enabledModules]);
            if (fallbackStats.length === 0) return 100;
            return fallbackStats.reduce((acc, curr) => acc + curr.score, 0) / fallbackStats.length;
        }
        
        return activeStats.reduce((acc, curr) => acc + curr.score, 0) / activeStats.length;
    }, [footballStats, gymStats, collegeStats, state.enabledModules]);

    const getGrade = (score: number) => {
        if (score >= 95) return { letter: 'S+', color: 'text-gold', shadow: 'shadow-gold/20', label: 'ELITE' };
        if (score >= 90) return { letter: 'S', color: 'text-gold', shadow: 'shadow-gold/20', label: 'LEGENDARY' };
        if (score >= 80) return { letter: 'A', color: 'text-success', shadow: 'shadow-success/20', label: 'EXCELLENT' };
        if (score >= 70) return { letter: 'B', color: 'text-accent', shadow: 'shadow-accent/20', label: 'STABLE' };
        if (score >= 50) return { letter: 'C', color: 'text-warning', shadow: 'shadow-warning/20', label: 'WARNING' };
        return { letter: 'D', color: 'text-danger', shadow: 'shadow-danger/20', label: 'CRITICAL' };
    };

    const grade = useMemo(() => {
        if (isCurrentMonth) {
            const start = new Date(startDateObj);
            start.setHours(0, 0, 0, 0);
            const now = new Date(today);
            now.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 3) {
                return { letter: '?', color: 'text-gray-500', shadow: 'shadow-white/5', label: 'CALIBRATING' };
            }
        }
        return getGrade(averageScore);
    }, [isCurrentMonth, startDateObj, today, averageScore]);

    const handleShare = () => {
        const report = `
🏆 NEURALIS - ${currentMonth.toUpperCase()} REPORT
📅 Period: ${currentMonth} ${currentYear}
👤 Athlete: ${state.userName || 'User'}

📊 PERFORMANCE:
${state.enabledModules.football ? `⚽ Football: ${Math.round(footballStats.score)}%\n` : ''}${state.enabledModules.gym ? `🏋️ Gym: ${Math.round(gymStats.score)}%\n` : ''}${state.enabledModules.college ? `🎓 College: ${Math.round(collegeStats.score)}%\n` : ''}
🌟 OVERALL GRADE: ${grade.letter} (${grade.label})

"The daily bridges define the final destination."
        `.trim();

        navigator.clipboard.writeText(report);
        setShareStatus('copied');
        sound.playSuccess();
        setTimeout(() => setShareStatus('idle'), 2000);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Minimal Tab Switcher */}
            <div className="flex justify-center">
                <div className="bg-white/5 p-1 rounded-full border border-white/10 flex gap-1">
                    <button 
                        onClick={() => setActiveTab('report')}
                        className={clsx(
                            "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                            activeTab === 'report' ? "bg-accent text-white shadow-lg" : "text-gray-500 hover:text-white"
                        )}
                    >
                        Report
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={clsx(
                            "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                            activeTab === 'history' ? "bg-accent text-white shadow-lg" : "text-gray-500 hover:text-white"
                        )}
                    >
                        History
                    </button>
                </div>
            </div>

            {activeTab === 'report' ? (
                <div className="space-y-8">
                    {/* Navigation & Period */}
                    <div className="flex items-center justify-between px-4">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <div className="text-center">
                            <h2 className="text-3xl font-display font-black tracking-tighter uppercase">{currentMonth}</h2>
                            <p className="text-[10px] text-gray-500 font-mono tracking-[0.3em]">{currentYear} PROTOCOL</p>
                        </div>
                        <button onClick={nextMonth} disabled={isCurrentMonth} className={clsx("p-2 rounded-full transition-colors", isCurrentMonth ? 'text-gray-800 cursor-not-allowed' : 'hover:bg-white/5 text-gray-400 hover:text-white')}>
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Main Evaluation Card */}
                    <div className="relative group">
                        {/* Particle Effect Background */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[40px]">
                            <ParticleBackground 
                                color={grade.color === 'text-gold' ? '#FFD700' : 
                                       grade.color === 'text-success' ? '#10b981' : 
                                       grade.color === 'text-accent' ? '#9d4edd' : 
                                       grade.color === 'text-warning' ? '#facc15' : '#ef4444'} 
                                density={grade.letter.includes('S') ? 40 : grade.letter === 'A' ? 30 : 15}
                            />
                        </div>

                        <div className="glass-panel p-1 rounded-[40px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent shadow-2xl overflow-hidden">
                            <div className="bg-black/60 backdrop-blur-2xl p-6 sm:p-8 md:p-12 rounded-[38px] relative">
                                {/* Animated Robot Section */}
                                <div className="flex flex-col items-center gap-6 md:gap-12 mb-8 md:mb-12">
                                    <div className="w-full flex justify-center relative">
                                        <RobotAnimator grade={grade.letter} remark={getCoachRemark(grade.letter)} />
                                        {/* Flying Football Animation */}
                                        {grade.letter.includes('S') && <FlyingFootball />}
                                    </div>
                                    
                                    <div className="w-full text-center">
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <span className={clsx("inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border", grade.color.replace('text-', 'border-').replace('text-', 'bg-').concat('/10'))}>
                                                {grade.label}
                                            </span>
                                            <div className="relative inline-block mb-4 md:mb-6">
                                                <h1 className={clsx("text-[min(25vw,80px)] sm:text-[min(30vw,100px)] md:text-[180px] font-display font-black leading-none tracking-tighter", grade.color, "drop-shadow-[0_0_40px_currentColor]")}>
                                                    {grade.letter}
                                                </h1>
                                                {grade.letter !== '?' && (
                                                    <motion.div 
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                                        className="absolute -top-4 -right-4"
                                                    >
                                                        <Sparkles className={clsx("w-12 h-12", grade.color)} />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {state.enabledModules.football && (
                                        <StatCard 
                                            label="Football" 
                                            score={footballStats.score} 
                                            icon={Trophy} 
                                            color="text-accent" 
                                            detail={`${footballStats.count}/${footballStats.total} Sessions`}
                                        />
                                    )}
                                    {state.enabledModules.gym && (
                                        <StatCard 
                                            label="Gym" 
                                            score={gymStats.score} 
                                            icon={Flame} 
                                            color="text-orange-500" 
                                            detail={`${gymStats.count}/${gymStats.total} Workouts`}
                                        />
                                    )}
                                    {state.enabledModules.college && (
                                        <StatCard 
                                            label="College" 
                                            score={collegeStats.score} 
                                            icon={BookOpen} 
                                            color="text-success" 
                                            detail={`${collegeStats.count}/${collegeStats.total} Present`}
                                        />
                                    )}
                                </div>

                                {/* Action Bar */}
                                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/10 pt-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                            <Activity className="text-accent" size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">System Status</p>
                                            <p className="text-sm font-bold text-white">All Protocols Synchronized</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleShare}
                                        className={clsx(
                                            "group relative flex items-center gap-3 px-8 py-4 rounded-full font-bold text-sm transition-all overflow-hidden",
                                            shareStatus === 'copied' 
                                                ? "bg-success text-white" 
                                                : "bg-white text-black hover:scale-105 active:scale-95"
                                        )}
                                    >
                                        <Share2 size={18} />
                                        {shareStatus === 'copied' ? 'COPIED' : 'EXPORT REPORT'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-6 text-center">Historical Archives</h3>
                    <div className="grid gap-3">
                        {[0, 1, 2, 3, 4, 5].map(offset => {
                            const date = new Date();
                            date.setMonth(date.getMonth() - offset);
                            if (date < startDateObj && offset > 0) return null;
                            
                            const isCurrent = offset === 0;
                            
                            return (
                                <motion.button 
                                    key={offset}
                                    whileHover={{ x: 10 }}
                                    onClick={() => { setViewDate(date); setActiveTab('report'); sound.playClick(); }}
                                    className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-accent transition-all group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="text-3xl font-display font-black text-white/20 group-hover:text-accent transition-colors">
                                            {String(date.getMonth() + 1).padStart(2, '0')}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xl font-display font-bold text-white">{getMonthName(date.getMonth())}</p>
                                            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">{date.getFullYear()} {isCurrent && '• ACTIVE'}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={24} className="text-gray-700 group-hover:text-accent transition-colors" />
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, score, icon: Icon, color, detail }: any) => (
    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className={clsx("p-2 rounded-xl bg-white/5", color)}>
                <Icon size={20} />
            </div>
            <span className="text-2xl font-display font-black text-white">{Math.round(score)}%</span>
        </div>
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">{label}</p>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-3">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={clsx("h-full", color.replace('text-', 'bg-'))}
            />
        </div>
        <p className="text-[10px] text-gray-400 font-mono">{detail}</p>
    </div>
);

const RobotAnimator = ({ grade, remark }: { grade: string, remark: string }) => {
    const isSPlus = grade === 'S+';
    const isS = grade === 'S';
    const isA = grade === 'A';
    const isB = grade === 'B';
    const isC = grade === 'C';
    const isD = grade === 'D';
    
    return (
        <div className="w-full flex flex-col items-center gap-8 py-4">
            {/* Speech Bubble - Now in flow to prevent overflow */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="z-30 w-full max-w-[320px] px-4"
            >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl relative">
                    <p className="text-[11px] sm:text-xs text-white text-center italic leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                        "{remark}"
                    </p>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/10 border-r border-b border-white/20 rotate-45" />
                </div>
            </motion.div>

            <div className="relative flex flex-col items-center justify-center">
                <motion.div
                    animate={isC ? { 
                        x: [0, -2, 2, -2, 2, 0],
                        y: [0, -10, 0]
                    } : { 
                        y: [0, -10, 0] 
                    }}
                    transition={isC ? {
                        x: { duration: 0.2, repeat: Infinity },
                        y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    } : { 
                        duration: 4, repeat: Infinity, ease: "easeInOut" 
                    }}
                    className="relative z-10 flex flex-col items-center"
                >
                    {/* Head */}
                    <motion.div 
                        animate={isD ? { rotateX: 45, y: 5 } : {}}
                        className="w-20 h-16 sm:w-24 sm:h-20 bg-[#1a1a1a] rounded-2xl border border-white/20 relative flex items-center justify-center shadow-2xl z-20"
                    >
                        <div className="absolute inset-2 bg-black rounded-xl border border-white/5 flex items-center justify-center gap-3">
                            <motion.div 
                                animate={isD ? { opacity: 0.3, scaleY: 0.2 } : { scaleY: [1, 1, 0.1, 1, 1] }} 
                                transition={{ duration: 3, repeat: Infinity }}
                                className={clsx("w-1.5 h-3 sm:w-2 sm:h-4 rounded-full", isC ? "bg-danger shadow-[0_0_10px_red]" : "bg-accent shadow-[0_0_10px_var(--accent-color)]")} 
                            />
                            <motion.div 
                                animate={isD ? { opacity: 0.3, scaleY: 0.2 } : { scaleY: [1, 1, 0.1, 1, 1] }} 
                                transition={{ duration: 3, repeat: Infinity, delay: 0.1 }}
                                className={clsx("w-1.5 h-3 sm:w-2 sm:h-4 rounded-full", isC ? "bg-danger shadow-[0_0_10px_red]" : "bg-accent shadow-[0_0_10px_var(--accent-color)]")} 
                            />
                        </div>
                    </motion.div>
                    
                    {/* Neck */}
                    <div className="w-3 h-2 sm:w-4 sm:h-3 bg-gray-800 z-10"></div>
                    
                    {/* Body */}
                    <div className="w-24 h-12 sm:w-28 sm:h-14 bg-[#151515] rounded-t-3xl border-t border-x border-white/10 relative overflow-hidden flex justify-center pt-2">
                         <div className={clsx("w-3 h-3 sm:w-4 sm:h-4 rounded-full animate-pulse", isC ? "bg-danger/20 border border-danger/40" : "bg-accent/20 border border-accent/40")}>
                            <div className={clsx("w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full m-auto mt-1", isC ? "bg-danger" : "bg-accent")}></div>
                         </div>
                    </div>
                </motion.div>

                {/* Tier Specific Animations - Now relative to the robot body */}
                {(isSPlus || isS) && (
                    <div className="absolute inset-0 pointer-events-none">
                        {[0, 1, 2].slice(0, isSPlus ? 3 : 2).map(i => (
                            <motion.div
                                key={i}
                                animate={{
                                    x: [0, 60, 0, -60, 0],
                                    y: [0, -80, -120, -80, 0],
                                    rotate: 360
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    delay: i * 0.8,
                                    ease: "linear"
                                }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            >
                                <div className="w-4 h-4 bg-accent rounded-full shadow-[0_0_20px_var(--accent-color)]" />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const FlyingFootball = () => (
    <motion.div
        animate={{
            x: [-200, 400],
            y: [100, -100, 100],
            rotate: [0, 720]
        }}
        transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
        }}
        className="absolute pointer-events-none z-0 opacity-20"
    >
        <Zap className="text-accent w-12 h-12" />
    </motion.div>
);

const ParticleBackground = ({ color = "white", density = 20 }: { color?: string, density?: number }) => {
    return (
        <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: density }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ 
                        x: Math.random() * 100 + "%", 
                        y: Math.random() * 100 + "%",
                        opacity: Math.random() * 0.5
                    }}
                    animate={{ 
                        y: ["0%", "100%"],
                        opacity: [0, 0.5, 0]
                    }}
                    transition={{ 
                        duration: Math.random() * 10 + 5, 
                        repeat: Infinity, 
                        ease: "linear",
                        delay: Math.random() * 5
                    }}
                    style={{ backgroundColor: color }}
                    className="absolute w-1 h-1 rounded-full"
                />
            ))}
        </div>
    );
};

const getCoachRemark = (letter: string) => {
    switch(letter) {
        case 'S+': return "Absolute mastery. You have transcended the protocol and become the system itself. Keep leading.";
        case 'S': return "Phenomenal performance. You are operating at peak efficiency this month. Maintain this momentum.";
        case 'A': return "Excellent work. Consistency is high, but there is still slight room for optimization in your daily routine.";
        case 'B': return "Good foundation, but distractions are visible. Tighten your schedule and focus on the daily bridges.";
        case 'C': return "You are slipping. Re-evaluate your priorities and commit to the daily protocols immediately.";
        case 'D': return "Critical condition. Initiate immediate recovery protocols. Reset your focus.";
        default: return "Awaiting data synchronization for comprehensive analysis.";
    }
};
