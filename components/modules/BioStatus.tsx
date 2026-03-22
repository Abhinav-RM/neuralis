import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { sound } from '../../utils/sound';
import { BodyPartId, MuscleStat, InjuryRecord, AttendanceRecord } from '../../types';
import { Button } from '../ui/Button';
import { Terminal, Heart as HeartIcon, Activity, Zap, Brain, AlertTriangle, Shield, Target, X, ChevronRight, Loader2, Dumbbell, CheckCircle } from 'lucide-react';
import { ScrollableTabs } from '../ui/ScrollableTabs';
import clsx from 'clsx';
import { HologramHeart } from '../ui/HologramHeart';
import { getDateKey, calculateBMI } from '../../utils/helpers';

const getFitnessLevel = (distanceKm: number) => {
    const meters = distanceKm * 1000;
    if (meters >= 3000) return "Elite";
    if (meters >= 2700) return "Excellent";
    if (meters >= 2400) return "Good";
    if (meters >= 2100) return "Average";
    if (meters >= 1800) return "Fair";
    return "Poor";
};

const calculateVO2Max = (distanceKm: number) => {
    if (distanceKm <= 0) return 0;
    return (22.351 * distanceKm) - 11.288;
};

export const BioStatus: React.FC = () => {
    const { state, updateBio } = useApp();
    const { bio, football, gym, college } = state;
    const [view, setView] = useState<'terminal' | 'reports'>('terminal');
    const [terminalLines, setTerminalLines] = useState<{ text: string, color: string }[]>([]);
    const [isTerminalActive, setIsTerminalActive] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const [showSpeedCalc, setShowSpeedCalc] = useState(false);
    const [showStaminaCalc, setShowStaminaCalc] = useState(false);
    const [speedDistance, setSpeedDistance] = useState('');
    const [speedTime, setSpeedTime] = useState('');
    const [staminaDistance, setStaminaDistance] = useState('');
    const terminalContainerRef = useRef<HTMLDivElement>(null);

    // Calculate Discipline
    const totalTrainingHours = (state.enabledModules.football ? football.totalTrainingHours : 0) + (state.enabledModules.gym ? gym.totalTrainingHours : 0);
    const disciplineFromTraining = Math.min(100, (totalTrainingHours / 50) * 100); // 50 hours = 100%
    const assignmentsCompleted = college.assignments.filter(a => a.completed).length;
    const assignmentsTotal = college.assignments.length;
    const disciplineFromAssignments = assignmentsTotal > 0 ? (assignmentsCompleted / assignmentsTotal) * 100 : 0;
    
    // Combine with Neural Stats
    const overallDiscipline = (state.enabledModules.college && assignmentsTotal > 0)
        ? (disciplineFromTraining + disciplineFromAssignments) / 2 
        : disciplineFromTraining;

    // Calculate Consistency (Synced with College Module Logic)
    const footballConsistency = Math.min(100, (football.currentStreak / 7) * 100);
    const gymConsistency = Math.min(100, (gym.currentStreak / 7) * 100);
    
    const attendanceRecords = Object.values(college.attendanceHistory) as AttendanceRecord[];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate Monthly and Total Attendance (Synced with College Module Logic)
    const monthlyStats: Record<string, { present: number, leave: number, absent: number }> = {};
    
    attendanceRecords.forEach(r => {
        const [y, m] = r.date.split('-').map(Number);
        const monthKey = `${y}-${m}`;
        
        if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = { present: 0, leave: 0, absent: 0 };
        }
        
        const remark = college.remarks[r.date];
        const isHalf = remark?.isHalfDay;
        const weight = isHalf ? 0.5 : 1;
        
        if (r.status === 'present') {
            monthlyStats[monthKey].present += weight;
        } else if (r.status === 'leave') {
            monthlyStats[monthKey].leave += weight;
        } else if (r.status === 'absent-personal') {
            monthlyStats[monthKey].absent += weight;
        }
        // 'absent-college' (Holiday) is ignored
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyAttendanceLines = Object.entries(monthlyStats)
        .sort((a, b) => {
            const [y1, m1] = a[0].split('-').map(Number);
            const [y2, m2] = b[0].split('-').map(Number);
            return y1 !== y2 ? y1 - y2 : m1 - m2;
        })
        .map(([key, stats]) => {
            const [y, m] = key.split('-').map(Number);
            const effectivePresent = stats.present + stats.leave;
            const total = effectivePresent + stats.absent;
            const rate = total === 0 ? 0 : (effectivePresent / total) * 100;
            return {
                text: `${monthNames[m-1].toUpperCase()} ${y}: ${rate.toFixed(2)}%`,
                color: "text-yellow-300"
            };
        });

    // Overall Total Attendance
    let totalPresent = 0;
    let totalLeave = 0;
    let totalAbsent = 0;
    Object.values(monthlyStats).forEach(s => {
        totalPresent += s.present;
        totalLeave += s.leave;
        totalAbsent += s.absent;
    });
    const overallEffectivePresent = totalPresent + totalLeave;
    const overallTotalDays = overallEffectivePresent + totalAbsent;
    const overallAttendanceRate = overallTotalDays === 0 ? 0 : (overallEffectivePresent / overallTotalDays) * 100;

    // Consistency is still based on current month for the live stat bar
    const currentMonthKey = `${currentYear}-${currentMonth + 1}`;
    const currentMonthStats = monthlyStats[currentMonthKey] || { present: 0, leave: 0, absent: 0 };
    const currentMonthEffectivePresent = currentMonthStats.present + currentMonthStats.leave;
    const currentMonthTotal = currentMonthEffectivePresent + currentMonthStats.absent;
    const collegeConsistency = currentMonthTotal === 0 ? 0 : (currentMonthEffectivePresent / currentMonthTotal) * 100;
    
    const activeConsistencyStats = [
        ...(state.enabledModules.football ? [footballConsistency] : []),
        ...(state.enabledModules.gym ? [gymConsistency] : []),
        ...(state.enabledModules.college && currentMonthTotal > 0 ? [collegeConsistency] : [])
    ];

    const overallConsistency = activeConsistencyStats.length > 0 
        ? activeConsistencyStats.reduce((a, b) => a + b, 0) / activeConsistencyStats.length
        : 0;

    const lastCognitiveReport = bio.previousAssessment?.date ? new Date(bio.previousAssessment.date).toLocaleString() : 'NO DATA';

    const terminalIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const addLine = (text: string, color: string = "text-green-500") => {
        setTerminalLines(prev => [...prev.slice(-50), { text: `> ${text}`, color }]);
    };

    useEffect(() => {
        if (!isTerminalActive) return;

        const dataLines = [
            { text: "INITIALIZING BIO-LINK v5.0...", color: "text-gray-400" },
            { text: "ESTABLISHING SECURE CONNECTION...", color: "text-gray-400" },
            { text: "ACCESSING ATHLETE DATABASE...", color: "text-gray-400" },
            { text: `USER IDENTIFIED: ${state.userName || 'ATHLETE'}`, color: "text-white font-bold" },
            { text: `DOB: ${state.dob || 'NOT SET'}`, color: "text-gray-300" },
            { text: "--------------------------------", color: "text-gray-600" },
            { text: "LAST RECORDED COGNITIVE STATUS:", color: "text-blue-400 font-bold" },
            { text: `DATE: ${lastCognitiveReport}`, color: "text-blue-300" },
            { text: `DISCIPLINE: ${bio.previousAssessment?.discipline ? bio.previousAssessment.discipline.toFixed(1) : '0.0'}%`, color: "text-blue-300" },
            { text: `CONSISTENCY: ${bio.previousAssessment?.consistency ? bio.previousAssessment.consistency.toFixed(1) : '0.0'}%`, color: "text-blue-300" },
            { text: "--------------------------------", color: "text-gray-600" },
            { text: "RUNNING LIVE BIO-SCAN...", color: "text-green-400 font-bold" },
            { text: `CURRENT DISCIPLINE: ${overallDiscipline.toFixed(1)}%`, color: "text-green-300" },
            { text: `CURRENT CONSISTENCY: ${overallConsistency.toFixed(1)}%`, color: "text-green-300" },
            { text: "--------------------------------", color: "text-gray-600" },
            ...(state.enabledModules.college ? [
                { text: "COLLEGE STATUS:", color: "text-yellow-400 font-bold" },
                ...monthlyAttendanceLines,
                { text: `TOTAL ATTENDANCE: ${overallAttendanceRate.toFixed(2)}%`, color: "text-yellow-300 font-bold" },
                { text: `ASSIGNMENTS COMPLETED: ${assignmentsCompleted}/${assignmentsTotal}`, color: "text-yellow-300" },
                { text: "--------------------------------", color: "text-gray-600" }
            ] : []),
            { text: "PHYSICAL STATS:", color: "text-orange-400 font-bold" },
            ...(state.enabledModules.football ? [
                { text: `STAMINA (COOPER): ${bio.cardio.maxDistance > 0 ? (bio.cardio.maxDistance * 1000).toFixed(0) + 'm' : 'NO DATA'}`, color: "text-orange-300" },
                { text: `VO2 MAX (EST): ${bio.cardio.maxDistance > 0 ? calculateVO2Max(bio.cardio.maxDistance).toFixed(1) + ' ml/kg/min' : 'NO DATA'}`, color: "text-orange-300" },
                { text: `TOP SPEED: ${(bio.cardio.sprintSpeed || 0).toFixed(1)} km/h`, color: "text-orange-300" }
            ] : []),
            ...(state.enabledModules.gym ? [
                { text: `WEIGHT: ${gym.weight || 'N/A'} kg`, color: "text-orange-300" },
                { text: `HEIGHT: ${gym.height || 'N/A'} cm`, color: "text-orange-300" }
            ] : []),
            { text: "--------------------------------", color: "text-gray-600" },
            { text: "MUSCLE CONDITIONING:", color: "text-purple-400 font-bold" },
            ...Object.entries(bio.muscleStats).filter(([_, stat]) => (stat as MuscleStat).maxWeight > 0).map(([part, stat]) => ({
                text: `${part.toUpperCase()}: ${(stat as MuscleStat).maxWeight}kg (MAX)`,
                color: "text-purple-300"
            })),
            { text: "--------------------------------", color: "text-gray-600" },
            { text: "MEDICAL ALERTS:", color: "text-red-500 font-bold" },
            ...(Object.keys(bio.injuries).length > 0 
                ? Object.values(bio.injuries).map(injury => ({
                    text: `!!! WARNING: ${ (injury as InjuryRecord).partId.toUpperCase() } - ${ (injury as InjuryRecord).severity.toUpperCase() } SEVERITY !!!`,
                    color: "text-red-500 animate-pulse"
                }))
                : [{ text: "PHYSICAL INTEGRITY: 100% (NOMINAL)", color: "text-green-500" }]
            ),
            { text: "--------------------------------", color: "text-gray-600" },
            { text: "NEW ASSESSMENT DATA LOGGED.", color: "text-green-400 font-bold" },
            { text: "DIAGNOSTIC SEQUENCE COMPLETE.", color: "text-green-400 font-bold" }
        ];
        
        setTerminalLines([]);
        let i = 0;
        terminalIntervalRef.current = setInterval(() => {
            if (i < dataLines.length) {
                addLine(dataLines[i].text, dataLines[i].color);
                i++;
                sound.playTerminalType();
            } else {
                if (terminalIntervalRef.current) {
                    clearInterval(terminalIntervalRef.current);
                    terminalIntervalRef.current = null;
                }
                setIsTerminalActive(false);
                sound.playRobotConfirm();
                
                updateBio({
                    previousAssessment: {
                        discipline: overallDiscipline,
                        consistency: overallConsistency,
                        date: new Date().toISOString()
                    }
                });
            }
        }, 600); // Slower typing speed

        return () => {
            if (terminalIntervalRef.current) {
                clearInterval(terminalIntervalRef.current);
                terminalIntervalRef.current = null;
            }
        };
    }, [isTerminalActive]);

    useEffect(() => {
        if (terminalContainerRef.current) {
            const { scrollHeight, clientHeight } = terminalContainerRef.current;
            terminalContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'auto' });
        }
    }, [terminalLines]);

    const startTerminal = () => {
        if (isTerminalActive) return;
        sound.playClick();
        setIsTerminalActive(true);
    };

    const runDiagnostic = () => {
        sound.playScan();
        addLine("RUNNING QUICK SCAN...", "text-green-400 font-bold");
        setTimeout(() => {
            if (Object.keys(bio.injuries).length > 0) {
                addLine("WARNING: INJURIES DETECTED.", "text-red-500 font-bold animate-pulse");
                sound.playError();
            } else {
                addLine("SYSTEMS NOMINAL.", "text-green-500");
                sound.playRobotConfirm();
            }
        }, 1000);
    };

    const handleCalculateSpeed = () => {
        const d = parseFloat(speedDistance);
        const t = parseFloat(speedTime);
        if (!isNaN(d) && !isNaN(t) && t > 0) {
            // d in meters, t in seconds -> speed in m/s -> km/h (* 3.6)
            const speedKmh = (d / t) * 3.6;
            updateBio({ cardio: { ...bio.cardio, sprintSpeed: speedKmh } });
            sound.playSuccess();
            setShowSpeedCalc(false);
            setSpeedDistance('');
            setSpeedTime('');
        } else {
            sound.playError();
        }
    };

    const handleCalculateStamina = () => {
        const d = parseFloat(staminaDistance);
        if (!isNaN(d) && d > 0) {
            // Cooper Test logic: 3200m in 12 mins is elite (100%)
            // We store the distance and time for the record
            updateBio({ 
                cardio: { 
                    ...bio.cardio, 
                    maxDistance: d / 1000, 
                    maxDistanceTime: 12 
                } 
            });
            sound.playSuccess();
            setShowStaminaCalc(false);
            setStaminaDistance('');
        } else {
            sound.playError();
        }
    };

    // Derived Stamina Percentage
    const calculatedStamina = bio.cardio.maxDistance > 0 
        ? Math.min(100, (bio.cardio.maxDistance * 1000 / 3200) * 100)
        : (football.stats.physical || 0) * 1.2;

    return (
        <div className="h-full min-h-screen pb-20 animate-fade-in flex flex-col font-mono">
            {/* Speed Calculator Modal */}
            {showSpeedCalc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-6 rounded-3xl w-full max-w-sm border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Calculate Speed</h3>
                            <button onClick={() => setShowSpeedCalc(false)}><X className="text-gray-400" /></button>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Enter approximate distance and time to calculate your sprint speed.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Distance (meters)</label>
                                <input type="number" value={speedDistance} onChange={(e) => setSpeedDistance(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-accent" placeholder="e.g. 100" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Time (seconds)</label>
                                <input type="number" value={speedTime} onChange={(e) => setSpeedTime(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-accent" placeholder="e.g. 12.5" />
                            </div>
                        </div>

                        <Button className="w-full" onClick={handleCalculateSpeed}>Calculate & Save</Button>
                    </div>
                </div>
            )}

            {/* Stamina Calculator Modal */}
            {showStaminaCalc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-6 rounded-3xl w-full max-w-sm border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Stamina Test (Cooper)</h3>
                            <button onClick={() => setShowStaminaCalc(false)}><X className="text-gray-400" /></button>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">The Cooper Test measures endurance. How many meters can you run in 12 minutes?</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Distance Covered (meters)</label>
                                <input type="number" value={staminaDistance} onChange={(e) => setStaminaDistance(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-accent" placeholder="e.g. 2400" autoFocus />
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase mb-1">Reference</p>
                                <ul className="text-[10px] text-gray-400 space-y-1">
                                    <li>• 3000m+ : Elite Athlete</li>
                                    <li>• 2400m : Good / Average</li>
                                    <li>• 1600m : Beginner</li>
                                </ul>
                            </div>
                        </div>

                        <Button className="w-full" onClick={handleCalculateStamina}>Log Test Result</Button>
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <ScrollableTabs className="w-full">
                    <button onClick={() => { setView('terminal'); sound.playClick(); }} 
                        className={clsx("font-heading font-bold text-base sm:text-lg px-2 transition-colors shrink-0 flex items-center gap-2", 
                        view === 'terminal' ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                        <Terminal size={18} /> BIO-TERMINAL
                    </button>
                    <button onClick={() => { setView('reports'); sound.playClick(); }} 
                        className={clsx("font-heading font-bold text-base sm:text-lg px-2 transition-colors shrink-0 flex items-center gap-2", 
                        view === 'reports' ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                        <Activity size={18} /> MEDICAL REPORTS
                    </button>
                </ScrollableTabs>
            </div>

            {view === 'terminal' ? (
                <div className="flex-grow grid lg:grid-cols-3 gap-6 overflow-hidden">
                    {/* TERMINAL VIEW */}
                    <div className="lg:col-span-2 bg-black border border-green-500/30 rounded-3xl p-6 flex flex-col relative overflow-hidden shadow-[inset_0_0_30px_rgba(0,255,0,0.05)]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20">
                            <div className="h-full bg-green-500 animate-[loading_2s_infinite]" />
                        </div>
                        
                        <div className="flex justify-between items-center mb-4 border-b border-green-500/30 pb-4">
                            <div className="flex items-center gap-2">
                                <Terminal className="text-green-500 animate-pulse" size={16} />
                                <span className="text-[10px] text-green-500 uppercase tracking-widest">root@bio-link:~#</span>
                            </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                                <Button 
                                    size="sm" 
                                    onClick={startTerminal} 
                                    disabled={isTerminalActive}
                                    className="gap-2 text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/30"
                                >
                                    {isTerminalActive ? <Loader2 size={14} className="animate-spin" /> : <Terminal size={14} />} 
                                    EXECUTE
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setShowHeart(true); sound.playClick(); }} className="gap-2 text-[10px] border-green-500/30 text-green-500 hover:bg-green-500/10">
                                    <HeartIcon size={14} /> HEART
                                </Button>
                                <Button size="sm" onClick={runDiagnostic} className="gap-2 text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/30">
                                    <Zap size={14} /> SCAN
                                </Button>
                            </div>
                        </div>

                        <div ref={terminalContainerRef} className="flex-grow overflow-y-auto space-y-1 custom-scrollbar pr-2 font-mono text-sm text-green-500">
                            {terminalLines.length === 0 && !isTerminalActive && (
                                <div className="h-full flex flex-col items-center justify-center text-green-500/50 space-y-4">
                                    <Terminal size={48} className="opacity-50" />
                                    <p className="text-xs uppercase tracking-[0.3em]">Awaiting Command...</p>
                                    <Button onClick={startTerminal} variant="ghost" size="sm" className="border-green-500/30 text-green-500 hover:bg-green-500/10">./start_sequence.sh</Button>
                                </div>
                            )}
                            {terminalLines.map((line, i) => (
                                <div key={i} className={clsx("animate-fade-in", line.color)}>
                                    {line.text}
                                </div>
                            ))}
                            {isTerminalActive && (
                                <div className="animate-pulse text-green-500">_</div>
                            )}
                        </div>
                    </div>

                    {/* STATS SIDEBAR */}
                    <div className="space-y-6 overflow-y-auto pr-2">
                        <div className="glass-panel p-6 rounded-3xl border border-white/10">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <Brain size={14} className="text-pink-400" /> Cognitive Status
                            </h3>
                            <div className="space-y-4">
                                <StatBar label="Discipline" value={overallDiscipline} max={100} color="bg-accent" />
                                <StatBar label="Consistency" value={overallConsistency} max={100} color="bg-pink-500" />
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-3xl border border-white/10">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <Activity size={14} className="text-success" /> Physical Readiness
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[10px] text-gray-500 uppercase">Stamina (Cooper)</p>
                                        <button onClick={() => setShowStaminaCalc(true)} className="text-[10px] text-accent hover:underline">Test</button>
                                    </div>
                                    <p className="text-xl font-black text-white">{bio.cardio.maxDistance > 0 ? (bio.cardio.maxDistance * 1000).toFixed(0) + 'm' : '0m'}</p>
                                    <p className="text-[9px] text-gray-500 uppercase">{bio.cardio.maxDistance > 0 ? getFitnessLevel(bio.cardio.maxDistance) : 'No Data'}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[10px] text-gray-500 uppercase">Speed</p>
                                        <button onClick={() => setShowSpeedCalc(true)} className="text-[10px] text-accent hover:underline">Calc</button>
                                    </div>
                                    <p className="text-xl font-black text-white">{(bio.cardio.sprintSpeed || 0).toFixed(1)} <span className="text-[10px] font-normal text-gray-500">km/h</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                    <ReportsDashboard 
                        bio={bio} 
                        updateBio={updateBio} 
                        gym={gym} 
                        football={football} 
                        overallDiscipline={overallDiscipline}
                        overallConsistency={overallConsistency}
                        lastCognitiveReport={lastCognitiveReport}
                        setShowSpeedCalc={setShowSpeedCalc}
                        setShowStaminaCalc={setShowStaminaCalc}
                        calculatedStamina={calculatedStamina}
                    />
            )}

            {/* HEART OVERLAY */}
            {showHeart && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8 animate-fade-in">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowHeart(false)} />
                    <div className="relative w-full max-w-4xl h-[600px] glass-panel rounded-[40px] border border-white/10 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                            <div className="flex items-center gap-3">
                                <HeartIcon className="text-error animate-pulse" />
                                <div>
                                    <h2 className="text-xl font-display font-black tracking-tighter uppercase">Cardiac Visualization</h2>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Real-time Holographic Render</p>
                                </div>
                            </div>
                            <button onClick={() => setShowHeart(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-grow grid lg:grid-cols-3">
                            <div className="lg:col-span-2 relative">
                                <HologramHeart />
                            </div>
                            <div className="p-8 bg-black/40 border-l border-white/10 space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-4">Cardiac Metrics</h4>
                                    <div className="space-y-6">
                                        <Metric label="Cooper Test" value={bio.cardio.maxDistance > 0 ? (bio.cardio.maxDistance * 1000).toFixed(0) + 'm' : 'N/A'} />
                                        <Metric label="VO2 Max (Est)" value={bio.cardio.maxDistance > 0 ? calculateVO2Max(bio.cardio.maxDistance).toFixed(1) : 'N/A'} unit="ml/kg/min" />
                                        <Metric label="Fitness Level" value={bio.cardio.maxDistance > 0 ? getFitnessLevel(bio.cardio.maxDistance) : 'N/A'} />
                                        <Metric label="Stamina Index" value={`${calculatedStamina.toFixed(0)}/100`} />
                                    </div>
                                </div>
                                
                                <div className="pt-8 border-t border-white/10">
                                    <div className="flex items-center gap-2 text-success mb-2">
                                        <Shield size={16} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Valve Integrity: 100%</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-relaxed uppercase">
                                        Cardiac output is optimized for high-intensity interval training. No anomalies detected in rhythmic patterns.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReportsDashboard = ({ 
    bio, updateBio, gym, football, 
    overallDiscipline, overallConsistency, lastCognitiveReport,
    setShowSpeedCalc,
    setShowStaminaCalc,
    calculatedStamina
}: any) => {
    const [activeSection, setActiveSection] = useState<string | null>('muscles');
    const [injuryModal, setInjuryModal] = useState<string | null>(null);
    const [injuryDays, setInjuryDays] = useState('14');

    const toggle = (s: string) => setActiveSection(activeSection === s ? null : s);
    const muscleKeys = Object.keys(bio.muscleStats).filter(k => k !== 'head' && k !== 'brain' && k !== 'heart');
    const bmi = calculateBMI(gym.height || 0, gym.weight || 0);

    const reportInjury = () => {
        if (!injuryModal) return;
        const days = parseInt(injuryDays) || 14;
        updateBio({ 
            injuries: { 
                ...bio.injuries, 
                [injuryModal]: { 
                    partId: injuryModal, 
                    date: getDateKey(new Date()), 
                    durationDays: days, 
                    severity: 'med' 
                } 
            } 
        });
        sound.playError();
        setInjuryModal(null);
    };

    return (
        <div className="flex-grow overflow-y-auto px-4 pb-20 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-3xl border border-white/10">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Physique Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center relative">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs text-gray-500 uppercase font-bold">Stamina</p>
                                <button onClick={() => setShowStaminaCalc(true)} className="text-[10px] text-accent hover:underline">Test</button>
                            </div>
                            <p className="text-2xl font-display font-bold text-white">{bio.cardio.maxDistance > 0 ? (bio.cardio.maxDistance * 1000).toFixed(0) + 'm' : '0m'}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{bio.cardio.maxDistance > 0 ? `VO2 MAX: ${calculateVO2Max(bio.cardio.maxDistance).toFixed(1)}` : 'No Test Data'}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Weight</p>
                            <p className="text-2xl font-display font-bold text-white">{gym.weight || 'N/A'} kg</p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/10">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Muscular System (1RM)</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {muscleKeys.map((key) => (
                            <div key={key} className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">{key.replace('_',' ')}</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        className="w-full bg-black/20 rounded px-2 py-1 text-sm text-white font-mono outline-none focus:border-accent border border-transparent transition-colors"
                                        placeholder="0"
                                        value={bio.muscleStats[key].maxWeight || ''}
                                        onChange={(e) => updateBio({ 
                                            muscleStats: { ...bio.muscleStats, [key]: { maxWeight: parseFloat(e.target.value), lastUpdated: getDateKey(new Date()) } } 
                                        })}
                                    />
                                    <span className="text-[10px] text-gray-500 py-1">kg</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/10">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Cognitive Summary (Last Assessment)</h3>
                    <div className="space-y-4">
                        <StatBar label="Discipline" value={bio.previousAssessment?.discipline || 0} max={100} color="bg-pink-500" />
                        <StatBar label="Consistency" value={bio.previousAssessment?.consistency || 0} max={100} color="bg-pink-400" />
                        <div className="pt-2 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase">Assessment Timestamp</p>
                            <p className="text-xs font-bold text-white">{lastCognitiveReport}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trauma Report */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield size={14} className="text-danger" /> Trauma & Injury Log
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {Object.keys(bio.muscleStats).map((part) => (
                         <div key={part} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                             <span className="capitalize text-xs font-bold">{part.replace('_', ' ')}</span>
                             {bio.injuries[part] ? (
                                 <div className="flex items-center gap-2">
                                     <span className="text-[10px] text-danger font-bold uppercase">Recovering</span>
                                     <button onClick={() => {
                                         const next = {...bio.injuries}; delete next[part]; updateBio({injuries: next});
                                         sound.playSuccess();
                                     }} className="p-1 hover:bg-white/20 rounded"><CheckCircle size={14} className="text-success"/></button>
                                 </div>
                             ) : (
                                 <button onClick={() => { setInjuryModal(part); setInjuryDays('14'); sound.playClick(); }} 
                                    className="text-[10px] bg-danger/10 text-danger px-2 py-1 rounded border border-danger/30 hover:bg-danger/20 transition-colors">
                                    Report
                                 </button>
                             )}
                         </div>
                     ))}
                </div>
            </div>

            {/* Inline Injury Modal */}
            {injuryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-6 rounded-3xl w-full max-w-sm border border-danger/30">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-danger">Report Trauma</h3>
                            <button onClick={() => setInjuryModal(null)}><X className="text-gray-400" /></button>
                        </div>
                        <p className="text-sm text-gray-300 mb-4 capitalize">Affected Area: <span className="font-bold text-white">{injuryModal.replace('_', ' ')}</span></p>
                        
                        <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Estimated Recovery (Days)</label>
                        <input type="number" value={injuryDays} onChange={(e) => setInjuryDays(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-lg mb-4 focus:border-danger outline-none" autoFocus />
                        
                        <div className="flex gap-2 mb-4">
                            <Button size="sm" variant="ghost" onClick={() => setInjuryDays('3')} className="flex-1 border border-white/5 text-[10px]">Minor (3d)</Button>
                            <Button size="sm" variant="ghost" onClick={() => setInjuryDays('14')} className="flex-1 border border-white/5 text-[10px]">Med (14d)</Button>
                            <Button size="sm" variant="ghost" onClick={() => setInjuryDays('45')} className="flex-1 border border-white/5 text-[10px]">Major (45d)</Button>
                        </div>

                        <Button className="w-full" variant="danger" onClick={reportInjury}>Confirm Log</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatBar = ({ label, value, max, color }: { label: string, value: number, max: number, color: string }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
            <span className="text-gray-500">{label}</span>
            <span className="text-white">{(value || 0).toFixed(0)}</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
                className={clsx("h-full transition-all duration-1000", color)} 
                style={{ width: `${(value / max) * 100}%` }} 
            />
        </div>
    </div>
);

const Metric = ({ label, value, unit }: { label: string, value: string, unit?: string }) => (
    <div className="flex justify-between items-end border-b border-white/5 pb-2">
        <span className="text-[10px] text-gray-500 uppercase font-bold">{label}</span>
        <div className="text-right">
            <span className="text-xl font-black text-white">{value}</span>
            {unit && <span className="text-[10px] text-gray-500 ml-1 uppercase">{unit}</span>}
        </div>
    </div>
);
