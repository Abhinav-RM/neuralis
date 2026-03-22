import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { getDateKey } from '../../utils/helpers';
import { CheckCircle, XCircle, Flame, Coins, Clock, ChevronLeft, ChevronRight, Edit2, Save, RotateCcw, LayoutList, ChevronDown, ChevronUp, Brain, Trophy, X, Zap, Snowflake, ArrowUpCircle, Lock, Target, Radar as RadarIcon, Crosshair } from 'lucide-react';
import { ScrollableTabs } from '../ui/ScrollableTabs';
import { sound } from '../../utils/sound';
import { TRIVIA_DB, SKIP_REASONS, DEFAULT_FOOTBALL_PLAN } from '../../constants';
import clsx from 'clsx';
import { TrainingPlanDay, TriviaRecord } from '../../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const Football: React.FC = () => {
    const { state, updateFootball, updateState, logTraining, logMissed, setPendingAction } = useApp();
    const { football } = state;
    const { lastMorningCheck } = football;
    const { stats } = football;
    const [view, setView] = useState<'dashboard' | 'calendar' | 'editor' | 'matches' | 'remarks'>('dashboard');
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showMorningCheck, setShowMorningCheck] = useState(false);
    const [showJudgeModal, setShowJudgeModal] = useState(false);
    const [sessionRemark, setSessionRemark] = useState('');
    
    // Match State
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [showMatchResultModal, setShowMatchResultModal] = useState<string | null>(null);
    const [newMatch, setNewMatch] = useState({ date: getDateKey(new Date()), time: '19:00', place: '' });
    const [matchResult, setMatchResult] = useState({ result: 'win' as any, goals: 0, assists: 0, shots: 0, shotsOnTarget: 0, note: '' });
    const [pendingMatchPrompt, setPendingMatchPrompt] = useState<any>(null);
    
    // Trivia State
    const [showTriviaModal, setShowTriviaModal] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<typeof TRIVIA_DB[0] | null>(null);
    const [triviaFeedback, setTriviaFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [timer, setTimer] = useState(15);
    const [timerActive, setTimerActive] = useState(false);

    // Session State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reasonDate, setReasonDate] = useState<Date | null>(null);
    const [durationHours, setDurationHours] = useState(1);
    const [durationMinutes, setDurationMinutes] = useState(30);

    const [showSealedModal, setShowSealedModal] = useState(false);

    const todayKey = getDateKey(new Date());
    const isTodayLogged = !!football.trainingHistory[todayKey];

    // Morning Check Effect
    useEffect(() => {
        const now = new Date();
        const checkHour = football.reminderHour || 8;
        const todayStr = getDateKey(now);
        const lastCheck = lastMorningCheck;
        const isTodayLogged = !!football.trainingHistory[todayStr];
        const dayPlan = football.trainingPlan[now.getDay()];

        if (now.getHours() >= checkHour && !isTodayLogged && lastCheck !== todayStr && dayPlan?.type !== 'rest') {
            setShowMorningCheck(true);
            updateFootball({ lastMorningCheck: todayStr });
        }
    }, [football.reminderHour, football.trainingHistory, football.trainingPlan, lastMorningCheck, updateFootball]);

    // Pending Action Effect
    useEffect(() => {
        if (state.pendingAction?.module === 'football' && state.pendingAction?.type === 'check-in') {
            setShowMorningCheck(true);
            setPendingAction(null);
        }
    }, [state.pendingAction, setPendingAction]);

    // Match Prompt Effect
    useEffect(() => {
        const checkMatches = () => {
            const now = new Date();
            const pending = football.matches.find(m => {
                if (m.status !== 'scheduled') return false;
                const matchTime = new Date(`${m.date}T${m.time}`);
                const promptTime = new Date(matchTime.getTime() + 60 * 60 * 1000); // 1 hour later
                return now >= promptTime;
            });
            if (pending) {
                setPendingMatchPrompt(pending);
            }
        };

        checkMatches();
        const interval = setInterval(checkMatches, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [football.matches]);

    const handleCalendarClick = (date: Date) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const dateKey = getDateKey(date);
        const todayKey = getDateKey(today);
        
        const entry = football.trainingHistory[dateKey];
        const isPast = dateKey < todayKey;
        const isEntryFromToday = entry && entry.timestamp && getDateKey(new Date(entry.timestamp)) === todayKey;

        // Only seal if it's a past date AND an entry already exists AND that entry wasn't made today
        if (isPast && entry && !isEntryFromToday) {
             setSelectedDate(date);
             setShowSealedModal(true);
             sound.playError();
        } else {
             setSelectedDate(date);
             setShowJudgeModal(true);
             sound.playClick();
        }
    };

    // ... existing handlers ...

    // HANDLERS
    const handleStartTrivia = () => {
        const available = TRIVIA_DB.filter(q => !football.triviaHistory[todayKey]);
        if (available.length === 0) return;
        const q = available[Math.floor(Math.random() * available.length)];
        setCurrentQuestion(q);
        setShowTriviaModal(true);
        setTimer(15);
        setTimerActive(true);
        setTriviaFeedback(null);
        sound.playRobotStartup();
    };

    useEffect(() => {
        let interval: any;
        if (timerActive && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (timer === 0 && timerActive) {
            setTimerActive(false);
            sound.playError();
            setTimeout(() => setShowTriviaModal(false), 2000);
        }
        return () => clearInterval(interval);
    }, [timer, timerActive]);

    const handleTriviaAnswer = (index: number) => {
        if (!currentQuestion || !timerActive) return;
        setTimerActive(false);
        
        const isCorrect = index === currentQuestion.correct;
        setTriviaFeedback(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
            sound.playSuccess();
            updateFootball({
                xp: football.xp + 50,
                correctTriviaCount: football.correctTriviaCount + 1,
                stats: {
                    ...stats,
                    tactical: Math.min(100, (stats.tactical ?? 50) + 0.5),
                    mental: Math.min(100, (stats.mental ?? 50) + 0.5)
                },
                triviaHistory: { ...football.triviaHistory, [todayKey]: true }
            });
            updateState({ coins: state.coins + 20 });
        } else {
            sound.playError();
            updateFootball({
                triviaHistory: { ...football.triviaHistory, [todayKey]: true }
            });
        }

        setTimeout(() => {
            setShowTriviaModal(false);
            setCurrentQuestion(null);
        }, 1500);
    };

    const handleTrainingComplete = (isRest: boolean = false) => {
        const duration = isRest ? 0 : durationHours + (durationMinutes / 60);
        const earnedCoins = isRest ? 10 : Math.round(duration * 20);
        const dateKey = getDateKey(selectedDate || new Date());
        
        logTraining('football', {
            date: dateKey,
            completed: true,
            duration: duration,
            hours: durationHours,
            minutes: durationMinutes,
            timestamp: new Date().toISOString(),
            manualEntry: true,
            isRest: isRest,
            remark: sessionRemark
        });

        updateFootball({
            inventory: {
                ...football.inventory,
                doubleXP: Math.max(0, football.inventory.doubleXP - 1),
                tripleXP: Math.max(0, football.inventory.tripleXP - 1)
            },
            stats: {
                ...stats,
                physical: isRest ? stats.physical : Math.min(100, (stats.physical ?? 50) + (duration * 0.5)),
                technical: isRest ? stats.technical : Math.min(100, (stats.technical ?? 50) + (duration * 0.4))
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

        const dateKey = getDateKey(reasonDate || selectedDate || new Date());
        const penalty = reason.valid ? 0 : 50;

        logMissed('football', dateKey);
        
        updateFootball({
            xp: Math.max(0, football.xp - penalty),
            trainingHistory: {
                ...football.trainingHistory,
                [dateKey]: {
                    ...football.trainingHistory[dateKey],
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
    };

    const handleFreezeStreak = () => {
        if (football.inventory.freeze <= 0) return;
        
        const targetDateObj = reasonDate || selectedDate || new Date();
        const dateKey = getDateKey(targetDateObj);

        updateFootball({
            inventory: { ...football.inventory, freeze: football.inventory.freeze - 1 },
            trainingHistory: {
                ...football.trainingHistory,
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

    const handleAddMatch = () => {
        if (!newMatch.place) return;
        const match = {
            id: `match-${Date.now()}`,
            ...newMatch,
            status: 'scheduled' as any
        };
        updateFootball({ matches: [...football.matches, match] });
        setShowMatchModal(false);
        setNewMatch({ date: getDateKey(new Date()), time: '19:00', place: '' });
        sound.playSuccess();
    };

    const handleSaveMatchResult = (matchId: string) => {
        const updatedMatches = football.matches.map(m => 
            m.id === matchId ? { ...m, ...matchResult, status: 'completed' as any } : m
        );
        updateFootball({ matches: updatedMatches });
        setShowMatchResultModal(null);
        setPendingMatchPrompt(null);
        setMatchResult({ result: 'win', goals: 0, assists: 0, shots: 0, shotsOnTarget: 0, note: '' });
        sound.playLevelUp();
    };

    const matchStats = football.matches.filter(m => m.status === 'completed').reduce((acc, m) => ({
        games: acc.games + 1,
        goals: acc.goals + (m.goals || 0),
        assists: acc.assists + (m.assists || 0),
        shots: acc.shots + (m.shots || 0),
        shotsOnTarget: acc.shotsOnTarget + (m.shotsOnTarget || 0)
    }), { games: 0, goals: 0, assists: 0, shots: 0, shotsOnTarget: 0 });

    const matchChartData = football.matches
        .filter(m => m.status === 'completed')
        .slice(-10)
        .map((m, i) => ({
            name: `G${i+1}`,
            goals: m.goals,
            assists: m.assists
        }));

    const radarData = [
        { subject: 'Technical', A: stats.technical ?? 50, fullMark: 100 },
        { subject: 'Physical', A: stats.physical ?? 50, fullMark: 100 },
        { subject: 'Tactical', A: stats.tactical ?? 50, fullMark: 100 },
        { subject: 'Mental', A: stats.mental ?? 50, fullMark: 100 },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <ScrollableTabs className="flex-1 min-w-0">
                    <button onClick={() => setView('dashboard')} className={clsx("font-heading font-bold text-base sm:text-lg px-2 transition-colors shrink-0", view === 'dashboard' ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                        Dashboard
                    </button>
                    <button onClick={() => setView('calendar')} className={clsx("font-heading font-bold text-base sm:text-lg px-2 transition-colors shrink-0", view === 'calendar' ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                        Calendar
                    </button>
                    <button onClick={() => setView('matches')} className={clsx("font-heading font-bold text-base sm:text-lg px-2 transition-colors shrink-0", view === 'matches' ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                        Matches
                    </button>
                    <button onClick={() => setView('remarks')} className={clsx("font-heading font-bold text-base sm:text-lg px-2 transition-colors shrink-0", view === 'remarks' ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                        Remarks
                    </button>
                    <button onClick={() => setView('editor')} className={clsx("font-heading font-bold text-base sm:text-lg px-2 transition-colors shrink-0", view === 'editor' ? "text-accent border-b-2 border-accent" : "text-gray-400 hover:text-white")}>
                        Settings
                    </button>
                </ScrollableTabs>
                {!isTodayLogged && (
                    <Button variant="secondary" size="sm" onClick={() => setShowMorningCheck(true)} className="gap-2 shrink-0 whitespace-nowrap">
                        <CheckCircle size={16} /> Check-In
                    </Button>
                )}
            </div>

            {view === 'dashboard' ? (
                <div className="grid lg:grid-cols-2 gap-6 animate-slide-up">
                    {/* Main Stats Card */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden min-h-[300px]">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                             <div className="bg-white/5 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                 <Flame size={12} className={football.currentStreak > 0 ? "text-orange-500 fill-orange-500" : "text-gray-500"} />
                                 {football.currentStreak} Day Streak
                             </div>
                             <div className="bg-white/5 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 text-gold">
                                 <Coins size={12} className="fill-gold" /> {state.coins}
                             </div>
                        </div>

                        <div className="mt-8 h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 8, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Stats" dataKey="A" stroke="var(--accent-color)" strokeWidth={3} fill="var(--accent-color)" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Today's Training */}
                    <TodayCard 
                        plan={football.trainingPlan}
                        isComplete={isTodayLogged}
                        inventory={football.inventory}
                        onComplete={() => handleCalendarClick(new Date())}
                        onEdit={() => setView('editor')}
                    />

                    {/* Trivia Card */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                             <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400">
                                 <Brain size={24} />
                             </div>
                             <div>
                                 <h3 className="font-bold text-lg">Daily Football IQ</h3>
                                 <p className="text-xs text-gray-400">Boost Tactical & Mental stats</p>
                             </div>
                         </div>
                         <Button onClick={handleStartTrivia} disabled={!!football.triviaHistory[todayKey]} variant={football.triviaHistory[todayKey] ? 'secondary' : 'primary'}>
                             {football.triviaHistory[todayKey] ? 'Completed' : 'Start Quiz'}
                         </Button>
                    </div>
                </div>
            ) : view === 'calendar' ? (
                <CalendarView history={football.trainingHistory} plan={football.trainingPlan} onDateSelect={handleCalendarClick} midnightLock={state.midnightLock} />
            ) : view === 'matches' ? (
                <div className="space-y-6 animate-slide-up">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2"><Trophy className="text-gold" /> Match History</h3>
                                    <Button size="sm" onClick={() => setShowMatchModal(true)} className="gap-2"><Zap size={14} /> Schedule Match</Button>
                                </div>
                                <div className="space-y-4">
                                    {football.matches.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">No matches scheduled yet.</p>
                                    ) : (
                                        football.matches.slice().reverse().map(match => (
                                            <div key={match.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-accent uppercase tracking-widest">{match.date}</span>
                                                        <span className="text-xs text-gray-500">• {match.time}</span>
                                                    </div>
                                                    <h4 className="font-bold text-lg">{match.place}</h4>
                                                    {match.status === 'completed' && (
                                                        <div className="flex gap-3 mt-2">
                                                            <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded uppercase", 
                                                                match.result === 'win' ? "bg-success/20 text-success" : 
                                                                match.result === 'loss' ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning")}>
                                                                {match.result}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 uppercase font-bold">G: {match.goals} • A: {match.assists}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {match.status === 'scheduled' ? (
                                                    <Button size="sm" variant="secondary" onClick={() => setShowMatchResultModal(match.id)}>Log Result</Button>
                                                ) : (
                                                    <button onClick={() => setShowMatchResultModal(match.id)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                                        <Edit2 size={16} className="text-gray-400" />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {matchChartData.length > 0 && (
                                <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                    <h3 className="text-xl font-bold mb-6">Performance Chart</h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={matchChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                <XAxis dataKey="name" stroke="#666" fontSize={10} />
                                                <YAxis stroke="#666" fontSize={10} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }} />
                                                <Legend />
                                                <Line type="monotone" dataKey="goals" stroke="var(--accent-color)" strokeWidth={1.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                                <Line type="monotone" dataKey="assists" stroke="#4ade80" strokeWidth={1.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Career Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                        <span className="text-xs text-gray-400 uppercase font-bold">Games</span>
                                        <span className="text-xl font-black text-white">{matchStats.games}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                        <span className="text-xs text-gray-400 uppercase font-bold">Goals</span>
                                        <span className="text-xl font-black text-white">{matchStats.goals}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                        <span className="text-xs text-gray-400 uppercase font-bold">Assists</span>
                                        <span className="text-xl font-black text-white">{matchStats.assists}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                        <span className="text-xs text-gray-400 uppercase font-bold">Shots</span>
                                        <span className="text-xl font-black text-white">{matchStats.shots}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                        <span className="text-xs text-gray-400 uppercase font-bold">On Target</span>
                                        <span className="text-xl font-black text-white">{matchStats.shotsOnTarget}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : view === 'remarks' ? (
                <div className="space-y-6 animate-slide-up">
                    <div className="glass-panel p-6 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-bold mb-6">Training Remarks</h3>
                        <div className="space-y-4">
                            {Object.values(football.trainingHistory)
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
                            {Object.values(football.trainingHistory).filter((h: any) => h.remark).length === 0 && (
                                <p className="text-center text-gray-500 py-8">No remarks logged yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <PlanEditor plan={football.trainingPlan} onSave={(p) => { updateFootball({ trainingPlan: p }); setView('dashboard'); }} onCancel={() => setView('dashboard')} />
            )}

            {/* MODALS */}
            
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
                        {football.trainingHistory[getDateKey(selectedDate)] ? (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                                <p className={clsx("font-display font-bold text-lg", football.trainingHistory[getDateKey(selectedDate)].completed ? "text-success" : "text-danger")}>
                                    {football.trainingHistory[getDateKey(selectedDate)].completed ? "COMPLETED" : "SKIPPED"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-danger/10 p-4 rounded-xl border border-danger/20">
                                    <p className="text-danger font-bold">No Data Recorded</p>
                                </div>
                                {football.inventory.freeze > 0 && (
                                    <button onClick={handleFreezeStreak} className="w-full py-3 bg-blue-500/10 border border-blue-500/50 rounded-xl flex items-center justify-center gap-2 text-blue-400 hover:bg-blue-500/20 transition-all">
                                        <Snowflake size={16} />
                                        <span className="font-bold text-sm">Use Field Freeze ({football.inventory.freeze})</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Match Scheduling Modal */}
            {showMatchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full border border-white/10 relative">
                        <button onClick={() => setShowMatchModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                        <h3 className="text-2xl font-display font-bold mb-6 text-center text-white">Schedule Match</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Date</label>
                                <input type="date" value={newMatch.date} onChange={(e) => setNewMatch({...newMatch, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-accent" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Time</label>
                                <input type="time" value={newMatch.time} onChange={(e) => setNewMatch({...newMatch, time: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-accent" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Place / Opponent</label>
                                <input type="text" value={newMatch.place} onChange={(e) => setNewMatch({...newMatch, place: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-accent" placeholder="e.g. City Stadium" />
                            </div>
                        </div>
                        <Button className="w-full" size="lg" onClick={handleAddMatch}>Schedule</Button>
                    </div>
                </div>
            )}

            {/* Match Result Modal */}
            {showMatchResultModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-white/10 relative overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setShowMatchResultModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                        <h3 className="text-2xl font-display font-bold mb-2 text-center text-white">How did the match go?</h3>
                        <p className="text-center text-gray-400 text-sm mb-6">Log your performance and stats.</p>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-2">
                                {['win', 'draw', 'loss'].map(r => (
                                    <button 
                                        key={r}
                                        onClick={() => setMatchResult({...matchResult, result: r as any})}
                                        className={clsx("py-3 rounded-xl border font-bold uppercase text-xs transition-all", 
                                            matchResult.result === r ? "bg-accent border-accent text-white" : "bg-white/5 border-white/10 text-gray-400")}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Goals</label>
                                    <input type="number" value={matchResult.goals} onChange={(e) => setMatchResult({...matchResult, goals: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-accent" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Assists</label>
                                    <input type="number" value={matchResult.assists} onChange={(e) => setMatchResult({...matchResult, assists: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-accent" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Shots</label>
                                    <input type="number" value={matchResult.shots} onChange={(e) => setMatchResult({...matchResult, shots: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-accent" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">On Target</label>
                                    <input type="number" value={matchResult.shotsOnTarget} onChange={(e) => setMatchResult({...matchResult, shotsOnTarget: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-accent" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Match Note / Remarks</label>
                                <textarea 
                                    value={matchResult.note}
                                    onChange={(e) => setMatchResult({...matchResult, note: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-accent"
                                    placeholder="How was your performance? Any key moments?"
                                    rows={3}
                                />
                            </div>

                            <Button className="w-full" size="lg" onClick={() => handleSaveMatchResult(showMatchResultModal)}>Save Match Data</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Match Prompt (Notification Trigger) */}
            {pendingMatchPrompt && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm animate-slide-down px-4">
                    <div className="bg-accent p-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl text-white">
                            <Trophy size={24} />
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-bold text-white">Match Finished?</h4>
                            <p className="text-xs text-white/80">How did the game against {pendingMatchPrompt.place} go?</p>
                        </div>
                        <button 
                            onClick={() => setShowMatchResultModal(pendingMatchPrompt.id)}
                            className="bg-white text-accent px-4 py-2 rounded-xl font-bold text-xs hover:bg-white/90 transition-all"
                        >
                            Log
                        </button>
                    </div>
                </div>
            )}
            {showTriviaModal && currentQuestion && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/20 relative overflow-hidden">
                        {/* Timer Bar */}
                        <div className="absolute top-0 left-0 h-2 bg-accent transition-all duration-1000 ease-linear" style={{ width: `${(timer / 15) * 100}%` }} />
                        
                        <div className="flex justify-between items-center mb-6">
                             <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{currentQuestion.type} Question</span>
                             <span className={clsx("font-mono font-bold text-xl", timer < 5 ? "text-danger animate-pulse" : "text-white")}>{timer}s</span>
                        </div>

                        <h3 className="text-xl font-bold mb-8 text-center leading-relaxed">{currentQuestion.question}</h3>

                        <div className="space-y-3">
                            {currentQuestion.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleTriviaAnswer(idx)}
                                    disabled={!timerActive}
                                    className={clsx(
                                        "w-full p-4 rounded-xl border font-medium text-left transition-all",
                                        !timerActive && idx === currentQuestion.correct && "bg-success/20 border-success text-success",
                                        !timerActive && idx !== currentQuestion.correct && triviaFeedback === 'wrong' && "opacity-50",
                                        timerActive ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-accent" : ""
                                    )}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Judge Modal */}
            {showJudgeModal && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full border border-white/10 relative">
                        <button onClick={() => { setShowJudgeModal(false); setSelectedDate(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                        <h3 className="text-xl font-bold mb-1 text-center text-white">Log for {selectedDate.toLocaleDateString()}</h3>
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
                            <Button className="w-full bg-success text-black font-bold" onClick={() => { setShowJudgeModal(false); setShowDurationModal(true); }}>Trained</Button>
                            <Button className="w-full bg-warning/20 text-warning font-bold" onClick={() => { setShowJudgeModal(false); handleTrainingComplete(true); }}>Rest Day</Button>
                            <Button className="w-full bg-danger/10 text-danger font-bold" onClick={() => { setShowJudgeModal(false); setShowReasonModal(true); }}>Missed</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Duration Modal */}
            {showDurationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full border border-white/10 relative">
                        <button onClick={() => { setShowDurationModal(false); setSelectedDate(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                        <h3 className="text-2xl font-display font-bold mb-2 text-center text-white">Session Duration</h3>
                        
                         {/* Booster Indicator */}
                         {(football.inventory.doubleXP > 0 || football.inventory.tripleXP > 0) && (
                            <div className="mb-4 bg-accent/20 border border-accent/50 p-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-accent uppercase tracking-widest animate-pulse">
                                <Zap size={12} fill="currentColor" />
                                {football.inventory.tripleXP > 0 ? 'Triple XP Active' : 'Double XP Active'}
                            </div>
                        )}

                        <div className="flex justify-center items-center gap-6 mb-8">
                            <div className="flex flex-col items-center">
                                <button onClick={() => setDurationHours(Math.min(12, durationHours + 1))} className="p-3 bg-white/5 rounded-full hover:bg-white/10 mb-2"><ChevronUp size={24}/></button>
                                <div className="text-6xl font-display font-bold w-24 text-center text-white">{durationHours.toString().padStart(2, '0')}</div>
                                <span className="text-xs text-accent uppercase font-bold mt-1">Hours</span>
                                <button onClick={() => setDurationHours(Math.max(0, durationHours - 1))} className="p-3 bg-white/5 rounded-full hover:bg-white/10 mt-2"><ChevronDown size={24}/></button>
                            </div>
                            <span className="text-4xl font-bold text-gray-600 mb-6">:</span>
                            <div className="flex flex-col items-center">
                                <button onClick={() => setDurationMinutes(Math.min(59, durationMinutes + 5))} className="p-3 bg-white/5 rounded-full hover:bg-white/10 mb-2"><ChevronUp size={24}/></button>
                                <div className="text-6xl font-display font-bold w-24 text-center text-white">{durationMinutes.toString().padStart(2, '0')}</div>
                                <span className="text-xs text-accent uppercase font-bold mt-1">Mins</span>
                                <button onClick={() => setDurationMinutes(Math.max(0, durationMinutes - 5))} className="p-3 bg-white/5 rounded-full hover:bg-white/10 mt-2"><ChevronDown size={24}/></button>
                            </div>
                        </div>
                        <Button className="w-full" size="lg" onClick={() => handleTrainingComplete(false)}>Confirm Session</Button>
                    </div>
                </div>
            )}

            {/* Morning Check Modal */}
            {showMorningCheck && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="max-w-md w-full text-center space-y-8 glass-panel p-8 border border-accent/20 rounded-3xl">
                        <div>
                            <h2 className="text-4xl font-display font-bold text-white mb-2">TRAINING BRIEF</h2>
                            <div className="h-1 w-20 bg-accent mx-auto rounded-full"></div>
                        </div>
                        <p className="text-gray-300 text-lg">Did you complete your session today?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="danger" size="lg" onClick={() => { setReasonDate(new Date()); setShowReasonModal(true); }}>No, Missed</Button>
                            <Button size="lg" onClick={() => { setShowMorningCheck(false); setShowDurationModal(true); }}>Yes, Completed</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reason Modal */}
            {showReasonModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full border border-white/10 relative">
                        <button onClick={() => { setShowReasonModal(false); setSelectedDate(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                        <h3 className="text-xl font-display font-bold mb-6 text-center text-danger">Session Missed</h3>
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
        </div>
    );
};

// Sub-components (TodayCard, CalendarView, PlanEditor) would be defined here similarly to Gym.tsx
// Included minimal versions for brevity as they follow the same pattern

const TodayCard: React.FC<{ plan: any, isComplete: boolean, inventory: any, onComplete: (isRest: boolean) => void, onEdit: () => void }> = ({ plan, isComplete, inventory, onComplete, onEdit }) => {
    const dayPlan = plan[new Date().getDay()];
    if (isComplete) return <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center h-full min-h-[300px]"><CheckCircle className="text-success mb-4" size={64} /><p className="text-2xl font-bold font-display">Complete</p></div>;
    return (
        <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 flex flex-col justify-between min-h-[300px]">
            <div>
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg sm:text-xl font-bold flex items-center gap-2"><LayoutList size={20}/> Today's Training</h3><button onClick={onEdit}><Edit2 size={14}/></button></div>
                <h4 className="text-xl sm:text-2xl font-bold text-accent mb-2">{dayPlan.title}</h4>
                <p className="text-gray-400 text-sm">{dayPlan.details}</p>
            </div>
            <Button size="lg" className="w-full mt-6" onClick={() => onComplete(dayPlan.type === 'rest')}>
                {dayPlan.type === 'rest' ? 'Acknowledge Rest Day' : 'Mark Complete'}
            </Button>
        </div>
    );
};

const CalendarView: React.FC<{ history: any, plan: any, onDateSelect: (d: Date) => void, midnightLock: boolean }> = ({ history, plan, onDateSelect, midnightLock }) => {
    // Simplified Calendar Implementation
    const [currentDate, setCurrentDate] = useState(new Date());
    const today = new Date();
    today.setHours(0,0,0,0);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({length: daysInMonth}, (_, i) => new Date(year, month, i + 1));
    return (
        <div className="glass-panel p-6 rounded-3xl animate-slide-up">
            <div className="flex justify-between mb-4"><button onClick={() => setCurrentDate(new Date(year, month-1, 1))}><ChevronLeft/></button><span>{currentDate.toLocaleString('default', {month:'long'})}</span><button onClick={() => setCurrentDate(new Date(year, month+1, 1))}><ChevronRight/></button></div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {days.map(d => {
                    const k = getDateKey(d);
                    const entry = history[k];
                    const isPast = d < today;
                    const isToday = k === getDateKey(today);
                    const dayPlan = plan[d.getDay()];
                    
                    let status = 'bg-white/5';
                    if (entry?.isRest) status = 'bg-warning/20 text-warning';
                    else if (entry?.completed) status = 'bg-success/20 text-success';
                    else if (entry?.skipped) status = 'bg-danger/20 text-danger';
                    else if (dayPlan?.type === 'rest') {
                        if (isPast || isToday) status = 'bg-warning/20 text-warning';
                        else status = 'bg-warning/5 text-warning/30 border-warning/10'; // Dimmed for future
                    }
                    else if (isPast && !entry) status = 'bg-gray-500/10 text-gray-500 border-dashed border-gray-500/30';

                    const isEntryFromToday = entry && entry.timestamp && getDateKey(new Date(entry.timestamp)) === getDateKey(new Date());
                    const isLocked = midnightLock && isPast && entry && !isEntryFromToday;

                    return (
                        <button key={k} onClick={() => onDateSelect(d)} disabled={d > new Date()} className={`p-2 rounded-lg ${status} border relative overflow-hidden transition-all hover:border-accent`}>
                            <span className="relative z-10">{d.getDate()}</span>
                            {isLocked && <div className="absolute bottom-1 right-1"><Lock size={8} className="text-current opacity-40" /></div>}
                        </button>
                    )
                })}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] uppercase tracking-widest font-bold border-t border-white/5 pt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-success/20 border border-success"></div><span className="text-success">Completed</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-danger/20 border border-danger"></div><span className="text-danger">Skipped</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-warning/20 border border-warning"></div><span className="text-warning">Rest Day</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-500/10 border border-dashed border-gray-500/30"></div><span className="text-gray-500">No Data</span></div>
            </div>
        </div>
    );
};

const PlanEditor: React.FC<{ plan: any, onSave: (p: any) => void, onCancel: () => void }> = ({ plan, onSave, onCancel }) => {
    const [local, setLocal] = useState(plan);
    return (
        <div className="glass-panel p-6 rounded-3xl animate-slide-up">
            <div className="flex justify-between mb-4"><h3 className="font-bold">Edit Plan</h3><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={onCancel}>Cancel</Button><Button size="sm" onClick={() => onSave(local)}>Save</Button></div></div>
            <div className="space-y-4">
                {Object.entries(local).map(([k, v]: any) => (
                    <div key={k} className="bg-white/5 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                            <p className="font-bold text-accent">{v.name}</p>
                            <select 
                                className="bg-black/40 text-xs p-1 rounded border border-white/10 text-white outline-none"
                                value={v.type || 'training'}
                                onChange={e => setLocal({...local, [k]: {...v, type: e.target.value}})}
                            >
                                <option value="training">Training</option>
                                <option value="rest">Rest Day</option>
                            </select>
                        </div>
                        <input className="w-full bg-black/20 rounded p-2 mb-2 text-white outline-none" value={v.title} onChange={e => setLocal({...local, [k]: {...v, title: e.target.value}})} />
                        <textarea className="w-full bg-black/20 rounded p-2 text-white outline-none" value={v.details} onChange={e => setLocal({...local, [k]: {...v, details: e.target.value}})} />
                    </div>
                ))}
            </div>
        </div>
    );
};