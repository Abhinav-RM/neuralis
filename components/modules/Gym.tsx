import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { calculateBMI, getDateKey } from '../../utils/helpers';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { sound } from '../../utils/sound';
import { ParticleCanvas } from '../ui/ParticleCanvas';
import { Dumbbell, ChevronDown, ChevronUp, Edit2, Save, X, RotateCcw, ChevronLeft, ChevronRight, LayoutList, CheckCircle, Zap, Snowflake, Lock } from 'lucide-react';
import { ScrollableTabs } from '../ui/ScrollableTabs';
import clsx from 'clsx';
import { TrainingPlanDay } from '../../types';
import { SKIP_REASONS, DEFAULT_GYM_PLAN } from '../../constants';

export const Gym: React.FC = () => {
    const { state, updateGym, updateState, logTraining, logMissed, setPendingAction } = useApp();
    const { gym } = state;
    const { lastMorningCheck } = gym;
    const [view, setView] = useState<'physique' | 'judge' | 'editor' | 'remarks'>('physique');
    const [weightInput, setWeightInput] = useState(gym.weight?.toString() || '');
    const [heightInput, setHeightInput] = useState(gym.height?.toString() || '');
    const [showParticles, setShowParticles] = useState(false);
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showMorningCheck, setShowMorningCheck] = useState(false);
    const [durationHours, setDurationHours] = useState(1);
    const [durationMinutes, setDurationMinutes] = useState(0);
    const [sessionRemark, setSessionRemark] = useState('');

    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reasonDate, setReasonDate] = useState<Date | null>(null);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showJudgeModal, setShowJudgeModal] = useState(false);
    const [showSealedModal, setShowSealedModal] = useState(false);

    const todayKey = getDateKey(new Date());
    const isTodayLogged = !!gym.trainingHistory[todayKey];
    const bmi = calculateBMI(parseFloat(heightInput) || gym.height || 0, parseFloat(weightInput) || gym.weight || 0);

    useEffect(() => {
        const now = new Date();
        const checkHour = gym.reminderHour || 8;
        const todayStr = getDateKey(now);
        const lastCheck = lastMorningCheck;
        const isTodayLogged = !!gym.trainingHistory[todayStr];
        const dayPlan = gym.trainingPlan[now.getDay()];

        if (now.getHours() >= checkHour && !isTodayLogged && lastCheck !== todayStr && dayPlan?.type !== 'rest') {
            setShowMorningCheck(true);
            updateGym({ lastMorningCheck: todayStr });
        }
    }, [gym.reminderHour, gym.trainingHistory, gym.trainingPlan, lastMorningCheck, updateGym]);

    // Pending Action Effect
    useEffect(() => {
        if (state.pendingAction?.module === 'gym' && state.pendingAction?.type === 'check-in') {
            setShowMorningCheck(true);
            setPendingAction(null);
        }
    }, [state.pendingAction, setPendingAction]);

    const handleWeightLog = () => {
        const w = parseFloat(weightInput);
        if (!w) return;
        const todayKey = getDateKey(new Date());
        updateGym({
            weight: w,
            weightHistory: [...gym.weightHistory, { date: todayKey, weight: w, timestamp: new Date().toISOString() }],
            xp: gym.xp + 20
        });
        sound.playSuccess();
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 2000);
    };

    const handleTrainingComplete = (isRest: boolean = false) => {
        const dateKey = selectedDate ? getDateKey(selectedDate) : getDateKey(new Date());
        const duration = isRest ? 0 : (durationHours + durationMinutes/60);
        const earnedCoins = isRest ? 10 : Math.round(duration * 20);
        
        logTraining('gym', {
            date: dateKey,
            completed: true,
            duration: duration,
            hours: durationHours,
            minutes: durationMinutes,
            timestamp: new Date().toISOString(),
            manualEntry: !!selectedDate,
            isRest: isRest,
            remark: sessionRemark
        });

        updateGym({
            inventory: {
                ...gym.inventory,
                doubleXP: Math.max(0, gym.inventory.doubleXP - 1),
                tripleXP: Math.max(0, gym.inventory.tripleXP - 1)
            }
        });
        updateState({ coins: state.coins + earnedCoins });

        setShowDurationModal(false);
        setShowMorningCheck(false);
        setSelectedDate(null);
        setSessionRemark('');
    };

    const handleMissedSession = (reasonId: string) => {
        const reason = SKIP_REASONS.find(r => r.id === reasonId);
        if (!reason) return;
        
        const targetDateObj = reasonDate || selectedDate || new Date();
        const dateKey = getDateKey(targetDateObj);
        const penalty = reason.valid ? 0 : 50;

        logMissed('gym', dateKey);

        updateGym({
            xp: Math.max(0, gym.xp - penalty),
            trainingHistory: {
                ...gym.trainingHistory,
                [dateKey]: {
                    ...gym.trainingHistory[dateKey],
                    skipReason: reasonId,
                    remark: reason.label
                }
            }
        });

        if (reason.valid) sound.playClick(); else sound.playError();
        setShowReasonModal(false);
        setShowMorningCheck(false);
        setReasonDate(null);
        setSelectedDate(null);
        setSessionRemark('');
    };

    const handleFreezeStreak = () => {
        if (gym.inventory.freeze <= 0) return;
        
        const targetDateObj = reasonDate || selectedDate || new Date();
        const dateKey = getDateKey(targetDateObj);

        updateGym({
            inventory: { ...gym.inventory, freeze: gym.inventory.freeze - 1 },
            trainingHistory: {
                ...gym.trainingHistory,
                [dateKey]: {
                    date: dateKey,
                    completed: false,
                    skipped: true,
                    timestamp: new Date().toISOString(),
                    manualEntry: true
                }
            }
        });
        
        sound.playRobotConfirm();
        setShowReasonModal(false);
        setShowMorningCheck(false);
        setShowSealedModal(false);
        setReasonDate(null);
        setSelectedDate(null);
    };

    const handleCalendarClick = (date: Date) => {
        setSelectedDate(date);
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const dateKey = getDateKey(date);
        const todayKey = getDateKey(today);
        
        const entry = gym.trainingHistory[dateKey];
        const isPast = dateKey < todayKey;
        const isEntryFromToday = entry && entry.timestamp && getDateKey(new Date(entry.timestamp)) === todayKey;

        // Only seal if it's a past date AND an entry already exists AND that entry wasn't made today
        if (isPast && entry && !isEntryFromToday) {
             setShowSealedModal(true);
             sound.playError();
        } else {
             setShowJudgeModal(true);
             sound.playClick();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <ScrollableTabs className="flex-1 min-w-0">
                    {['Dashboard', 'Workout Log', 'Remarks', 'Settings'].map((v, i) => {
                        const key = ['physique', 'judge', 'remarks', 'editor'][i] as any;
                        return (
                            <button key={key} onClick={() => { setView(key); sound.playClick(); }} 
                                className={clsx("font-heading font-bold text-base sm:text-lg px-2 shrink-0 transition-colors", view === key ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                                {v}
                            </button>
                        )
                    })}
                </ScrollableTabs>
            </div>

            {view === 'physique' ? (
                <div className="animate-slide-up grid lg:grid-cols-2 gap-6">
                    {/* Today's Workout Card */}
                    <TodayCard 
                        plan={gym.trainingPlan} 
                        isComplete={isTodayLogged} 
                        inventory={gym.inventory}
                        onComplete={(isRest) => { 
                            if (isRest) {
                                handleTrainingComplete(true);
                            } else {
                                setShowDurationModal(true); 
                            }
                            sound.playClick(); 
                        }}
                        onEdit={() => setView('editor')}
                    />

                    {/* Physique Metrics */}
                    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
                        <ParticleCanvas active={showParticles} color={bmi < 18.5 ? '#60a5fa' : bmi > 25 ? '#ef4444' : '#10b981'} />
                        <h2 className="text-xl sm:text-2xl font-display font-bold mb-6 z-10 text-center">Physique Metrics</h2>
                        <div className="relative w-full max-w-[240px] aspect-[2/1] mb-4 z-10">
                            <Speedometer value={bmi} />
                        </div>
                        <div className="text-center z-10">
                            <p className="text-3xl sm:text-4xl font-display font-bold text-white transition-all duration-300">{bmi.toFixed(1)}</p>
                            <p className={clsx("text-[10px] sm:text-sm font-bold uppercase tracking-widest mt-1", bmi < 18.5 ? 'text-blue-400' : bmi > 25 ? 'text-danger' : 'text-success')}>
                                {bmi < 18.5 ? 'Underweight' : bmi > 25 ? 'Overweight' : 'Optimal'}
                            </p>
                        </div>
                    </div>

                    {/* Vitals Input */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/10">
                        <h3 className="font-heading font-bold text-lg mb-4 text-accent">Update Vitals</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase">Height (cm)</label>
                                <input type="number" value={heightInput} onChange={(e) => { setHeightInput(e.target.value); updateGym({ height: parseFloat(e.target.value) }) }} 
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full mt-1 outline-none focus:border-accent transition-colors" placeholder="175" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase">Weight (kg)</label>
                                <div className="flex gap-2 mt-1">
                                    <input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} 
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full outline-none focus:border-accent transition-colors" placeholder="70" />
                                    <Button size="sm" onClick={handleWeightLog}>Log</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weight Chart */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/10 h-64 flex flex-col">
                        <h3 className="font-heading font-bold text-lg mb-4 text-accent">Weight Progression</h3>
                        <div className="flex-grow">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[...gym.weightHistory].sort((a, b) => a.date.localeCompare(b.date))}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" hide />
                                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{color: '#fff'}} />
                                    <Area type="monotone" dataKey="weight" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : view === 'judge' ? (
                <div className="space-y-4">
                     <div className="flex justify-end px-4">
                         {!isTodayLogged && (
                             <Button onClick={() => handleCalendarClick(new Date())} size="sm" className="gap-2">
                                 <Dumbbell size={16} /> Mark Today Complete
                             </Button>
                         )}
                     </div>
                     <GymJudgeCalendar 
                        onDayClick={handleCalendarClick} 
                     />
                </div>
            ) : view === 'remarks' ? (
                <div className="space-y-6 animate-slide-up">
                    <div className="glass-panel p-6 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-bold mb-6">Training Remarks</h3>
                        <div className="space-y-4">
                            {Object.values(gym.trainingHistory)
                                .filter((h: any) => h.remark)
                                .sort((a: any, b: any) => b.date.localeCompare(a.date))
                                .map((h: any) => (
                                    <div key={h.date} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-accent uppercase tracking-widest">{h.date}</span>
                                            <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded uppercase", h.completed ? "bg-success/20 text-success" : "bg-danger/20 text-danger")}>
                                                {h.completed ? 'Completed' : 'Skipped'}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 italic">"{h.remark}"</p>
                                    </div>
                                ))
                            }
                            {Object.values(gym.trainingHistory).filter((h: any) => h.remark).length === 0 && (
                                <p className="text-center text-gray-500 py-8">No remarks logged yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <PlanEditor 
                    plan={gym.trainingPlan} 
                    onSave={(newPlan) => {
                        updateGym({ trainingPlan: newPlan });
                        setView('physique');
                        sound.playSuccess();
                    }}
                    onCancel={() => setView('physique')}
                />
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
                        {gym.trainingHistory[getDateKey(selectedDate)] ? (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                                <p className={clsx("font-display font-bold text-lg", gym.trainingHistory[getDateKey(selectedDate)].completed ? "text-success" : "text-danger")}>
                                    {gym.trainingHistory[getDateKey(selectedDate)].completed ? "COMPLETED" : "SKIPPED"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-danger/10 p-4 rounded-xl border border-danger/20">
                                    <p className="text-danger font-bold">No Data Recorded</p>
                                </div>
                                {gym.inventory.freeze > 0 && (
                                    <button onClick={handleFreezeStreak} className="w-full py-3 bg-blue-500/10 border border-blue-500/50 rounded-xl flex items-center justify-center gap-2 text-blue-400 hover:bg-blue-500/20 transition-all">
                                        <Snowflake size={16} />
                                        <span className="font-bold text-sm">Use Gym Freeze ({gym.inventory.freeze})</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showJudgeModal && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full border border-white/10 relative">
                        <button onClick={() => { setShowJudgeModal(false); setSelectedDate(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                        <h3 className="text-xl font-bold mb-1 text-center">Log for {selectedDate.toLocaleDateString()}</h3>
                        <p className="text-center text-gray-400 text-sm mb-6">What is the verdict?</p>
                        <div className="space-y-3">
                            <div className="mb-4">
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Session Remark / Note</label>
                                <textarea 
                                    value={sessionRemark}
                                    onChange={(e) => setSessionRemark(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-accent"
                                    placeholder="How was the session? (Optional)"
                                    rows={2}
                                />
                            </div>
                            <Button className="w-full bg-success text-black" onClick={() => { setShowJudgeModal(false); setShowDurationModal(true); }}>Trained</Button>
                            <Button className="w-full bg-warning/20 text-warning" onClick={() => { setShowJudgeModal(false); handleTrainingComplete(true); }}>Rest Day</Button>
                            <Button className="w-full bg-danger/10 text-danger" onClick={() => { setShowJudgeModal(false); setShowReasonModal(true); }}>Missed</Button>
                        </div>
                    </div>
                </div>
            )}

            {showDurationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full border border-white/10 relative">
                        <button onClick={() => { setShowDurationModal(false); setSelectedDate(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                        <h3 className="text-2xl font-display font-bold mb-2 text-center text-white">Session Duration</h3>
                        {selectedDate && <p className="text-center text-gray-400 mb-6 text-sm uppercase tracking-widest">{selectedDate.toLocaleDateString()}</p>}
                        
                         {/* Booster Indicator */}
                         {(gym.inventory.doubleXP > 0 || gym.inventory.tripleXP > 0) && (
                            <div className="mb-4 bg-accent/20 border border-accent/50 p-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-accent uppercase tracking-widest animate-pulse">
                                <Zap size={12} fill="currentColor" />
                                {gym.inventory.tripleXP > 0 ? 'Triple XP Active' : 'Double XP Active'}
                            </div>
                        )}

                        <div className="flex justify-center items-center gap-6 mb-8">
                            <div className="flex flex-col items-center">
                                <button onClick={() => { setDurationHours(Math.min(12, durationHours + 1)); sound.playClick(); }} className="p-3 bg-white/5 rounded-full hover:bg-white/10 mb-2"><ChevronUp size={24}/></button>
                                <div className="text-6xl font-display font-bold w-24 text-center text-white">{durationHours.toString().padStart(2, '0')}</div>
                                <span className="text-xs text-accent uppercase font-bold mt-1">Hours</span>
                                <button onClick={() => { setDurationHours(Math.max(0, durationHours - 1)); sound.playClick(); }} className="p-3 bg-white/5 rounded-full hover:bg-white/10 mt-2"><ChevronDown size={24}/></button>
                            </div>
                            <span className="text-4xl font-bold text-gray-600 mb-6">:</span>
                            <div className="flex flex-col items-center">
                                <button onClick={() => { setDurationMinutes(Math.min(59, durationMinutes + 5)); sound.playClick(); }} className="p-3 bg-white/5 rounded-full hover:bg-white/10 mb-2"><ChevronUp size={24}/></button>
                                <div className="text-6xl font-display font-bold w-24 text-center text-white">{durationMinutes.toString().padStart(2, '0')}</div>
                                <span className="text-xs text-accent uppercase font-bold mt-1">Mins</span>
                                <button onClick={() => { setDurationMinutes(Math.max(0, durationMinutes - 5)); sound.playClick(); }} className="p-3 bg-white/5 rounded-full hover:bg-white/10 mt-2"><ChevronDown size={24}/></button>
                            </div>
                        </div>
                        <Button className="w-full" size="lg" onClick={() => handleTrainingComplete(false)}>Confirm Session</Button>
                    </div>
                </div>
            )}

             {showReasonModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full border border-white/10 relative">
                        <button onClick={() => { setShowReasonModal(false); setSelectedDate(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                        <h3 className="text-xl font-display font-bold mb-2 text-center text-danger">Session Missed</h3>
                        {selectedDate && <p className="text-center text-gray-400 mb-6 text-sm uppercase tracking-widest">{selectedDate.toLocaleDateString()}</p>}
                        <p className="text-center text-gray-400 mb-6 text-sm">Explain yourself to The Judge.</p>
                        
                        {gym.inventory.freeze > 0 && (
                            <div className="mb-6">
                                <button onClick={handleFreezeStreak} className="w-full py-4 bg-blue-500/10 border border-blue-500/50 rounded-xl flex items-center justify-center gap-3 text-blue-400 hover:bg-blue-500/20 transition-all group">
                                    <Snowflake className="group-hover:rotate-180 transition-transform duration-500" />
                                    <span className="font-bold">Use Streak Freeze ({gym.inventory.freeze})</span>
                                </button>
                                <div className="text-center text-[10px] text-gray-500 mt-2 uppercase tracking-wider">Protects Streak & XP</div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {SKIP_REASONS.map(reason => (
                                <button 
                                    key={reason.id}
                                    onClick={() => handleMissedSession(reason.id)}
                                    className={clsx(
                                        "w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center group",
                                        reason.valid 
                                            ? "bg-white/5 border-white/10 hover:border-warning hover:text-warning"
                                            : "bg-white/5 border-white/10 hover:border-danger hover:text-danger"
                                    )}
                                >
                                    <span className="font-bold">{reason.label}</span>
                                    <span className="text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        {reason.valid ? 'Neutral' : '-50 XP'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

             {showMorningCheck && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="max-w-md w-full text-center space-y-8 glass-panel p-8 border border-accent/20 rounded-3xl">
                        <div>
                            <h2 className="text-4xl font-display font-bold text-white mb-2">GYM BRIEFING</h2>
                            <div className="h-1 w-20 bg-accent mx-auto rounded-full"></div>
                        </div>
                        <p className="text-gray-300 text-lg">Have you hit the iron temple today?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="danger" size="lg" onClick={() => { setReasonDate(new Date()); setShowReasonModal(true); }}>No, I missed it</Button>
                            <Button size="lg" onClick={() => { setShowMorningCheck(false); setShowDurationModal(true); }}>Yes, Weights Lifted</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TodayCard: React.FC<{
    plan: Record<number, TrainingPlanDay>;
    isComplete: boolean;
    inventory: any;
    onComplete: (isRest: boolean) => void;
    onEdit: () => void;
}> = ({ plan, isComplete, inventory, onComplete, onEdit }) => {
    const [expanded, setExpanded] = useState(false);
    const dayPlan = plan[new Date().getDay()];

    if (isComplete) {
        return (
            <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <CheckCircle className="text-success mb-4" size={64} />
                <p className="text-2xl font-bold font-display text-white">Complete</p>
                <p className="text-gray-400">Gains Secured. Rest or Recover.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 relative overflow-hidden group min-h-[300px] flex flex-col transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg sm:text-xl font-display font-bold flex items-center gap-2"><LayoutList size={20} /> Today's Workout</h3>
                <button onClick={onEdit} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-gray-300 flex items-center gap-1"><Edit2 size={12} /> Edit</button>
            </div>
            <div className="flex-grow flex flex-col justify-center">
                <div onClick={() => { setExpanded(!expanded); sound.playClick(); }} className="bg-white/5 p-4 sm:p-6 rounded-2xl mb-6 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                    <h4 className="font-bold text-xl sm:text-2xl text-accent mb-1">{dayPlan.title || 'No Title Set'}</h4>
                    {expanded ? (
                        <div className="animate-fade-in mt-4 pt-4 border-t border-white/10">
                            <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{dayPlan.details || 'No details added.'}</p>
                            <p className="text-xs text-gray-500 mt-4 text-center uppercase flex items-center justify-center gap-1"><ChevronUp size={12} /> Tap to collapse</p>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-2 flex items-center gap-1">Tap for details <ChevronDown size={12} /></p>
                    )}
                </div>
                {!expanded && (
                    <Button className="w-full text-lg py-4 relative overflow-hidden" size="lg" onClick={() => onComplete(dayPlan.type === 'rest')}>
                        <span className="relative z-10">{dayPlan.type === 'rest' ? 'Acknowledge Rest Day' : 'Mark Complete (+50 XP)'}</span>
                        {dayPlan.type !== 'rest' && (inventory.doubleXP > 0 || inventory.tripleXP > 0) && (
                            <div className="absolute top-0 right-0 p-1">
                                <Zap size={12} className="text-yellow-400 animate-pulse" fill="currentColor" />
                            </div>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
};

const GymJudgeCalendar: React.FC<{ onDayClick: (date: Date) => void }> = ({ onDayClick }) => {
    const { state } = useApp();
    const { gym } = state;
    const [currentDate, setCurrentDate] = useState(new Date());
    const today = new Date();
    today.setHours(0,0,0,0);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = new Date(year, month, 1).getDay(); 
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 animate-slide-up">
           <div className="flex justify-between items-center mb-6">
               <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-white/10 rounded-lg"><ChevronLeft /></button>
               <h3 className="text-xl font-display font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
               <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-white/10 rounded-lg"><ChevronRight /></button>
           </div>
           <div className="grid grid-cols-7 gap-1 sm:gap-2">
               {['S','M','T','W','T','F','S'].map((d, i) => <div key={`${d}-${i}`} className="text-center text-xs text-gray-500 font-bold">{d}</div>)}
                {days.map((date, i) => {
                    if (!date) return <div key={i} />;
                    const key = getDateKey(date);
                    const entry = gym.trainingHistory[key];
                    const dayPlan = gym.trainingPlan[date.getDay()];
                    const isPast = date < today;
                    const isToday = key === getDateKey(today);
                    const isFuture = date > today;
                    
                    const status = entry 
                        ? (entry.isRest ? 'rest' : entry.completed ? 'completed' : 'skipped') 
                        : (dayPlan?.type === 'rest' ? 'rest' : 'empty');
                    
                    const isInactive = isPast && !entry && status !== 'rest';
                    const isEntryFromToday = entry && entry.timestamp && getDateKey(new Date(entry.timestamp)) === getDateKey(new Date());
                    const isLocked = state.midnightLock && isPast && entry && !isEntryFromToday;

                    return (
                        <button key={key} onClick={() => onDayClick(date)} disabled={date > today}
                            className={clsx("aspect-square rounded-xl flex items-center justify-center border transition-all relative overflow-hidden", 
                            status === 'completed' && "bg-success/20 border-success text-success",
                            status === 'rest' && (isFuture ? "bg-warning/5 border-warning/20 text-warning/30" : "bg-warning/20 border-warning text-warning"),
                            status === 'skipped' && "bg-danger/10 border-danger text-danger",
                            isInactive && "bg-gray-500/10 border-dashed border-gray-500/30 text-gray-500",
                            status === 'empty' && !isInactive && "bg-white/5 border-white/10 hover:border-accent"
                        )}>
                            <span className="font-bold relative z-10">{date.getDate()}</span>
                            {isLocked && <div className="absolute bottom-1 right-1"><Lock size={8} className="text-current opacity-40" /></div>}
                        </button>
                    );
                })}
           </div>
           <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] uppercase tracking-widest font-bold border-t border-white/5 pt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-success/20 border border-success"></div><span className="text-success">Completed</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-danger/10 border border-danger"></div><span className="text-danger">Skipped</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-warning/20 border border-warning"></div><span className="text-warning">Rest Day</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-500/10 border border-dashed border-gray-500/30"></div><span className="text-gray-500">No Data</span></div>
            </div>
       </div>
    );
};

const PlanEditor: React.FC<{
    plan: Record<number, TrainingPlanDay>;
    onSave: (plan: Record<number, TrainingPlanDay>) => void;
    onCancel: () => void;
}> = ({ plan, onSave, onCancel }) => {
    const [localPlan, setLocalPlan] = useState(plan);
    const handleChange = (dayIndex: string, field: keyof TrainingPlanDay, value: string) => {
        setLocalPlan(prev => ({ ...prev, [parseInt(dayIndex)]: { ...prev[parseInt(dayIndex)], [field]: value } }));
    };
    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold flex items-center gap-2"><Edit2 size={20} /> Edit Routine</h3>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setLocalPlan(DEFAULT_GYM_PLAN)}><RotateCcw size={16} /></Button>
                    <Button variant="secondary" size="sm" onClick={onCancel}><X size={16} /></Button>
                    <Button size="sm" onClick={() => onSave(localPlan)}><Save size={16} /> Save</Button>
                </div>
            </div>
            <div className="space-y-4">
                {Object.entries(localPlan).map(([key, value]) => {
                    const val = value as TrainingPlanDay;
                    return (
                        <div key={key} className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-accent">{val.name}</span>
                                <select value={val.type} onChange={(e) => handleChange(key, 'type', e.target.value as any)} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs">
                                    <option value="training">Training</option>
                                    <option value="rest">Rest</option>
                                </select>
                            </div>
                            <input type="text" value={val.title} onChange={(e) => handleChange(key, 'title', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent outline-none mb-2 font-bold" placeholder="Main Muscle Group" />
                            <textarea value={val.details} onChange={(e) => handleChange(key, 'details', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent outline-none h-20 resize-none" placeholder="Detailed routine..." />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Speedometer = ({ value }: { value: number }) => {
    const min = 15; const max = 35;
    const rotation = -90 + ((Math.min(Math.max(value, min), max) - min) / (max - min) * 180);
    return (
        <div className="relative w-full h-full">
            <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#333" strokeWidth="20" strokeLinecap="round" />
                <path d="M 20 100 A 80 80 0 0 1 73 35" fill="none" stroke="#60a5fa" strokeWidth="20" opacity="0.3" />
                <path d="M 73 35 A 80 80 0 0 1 127 35" fill="none" stroke="#10b981" strokeWidth="20" opacity="0.3" />
                <path d="M 127 35 A 80 80 0 0 1 180 100" fill="none" stroke="#ef4444" strokeWidth="20" opacity="0.3" />
                <g className="transition-transform duration-1000 ease-out origin-bottom" style={{ transformOrigin: '100px 100px', transform: `rotate(${rotation}deg)` }}>
                    <path d="M 100 100 L 100 20" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="100" cy="100" r="6" fill="var(--accent-color)" />
                </g>
            </svg>
        </div>
    )
}