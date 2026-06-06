import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, FootballState, GymState, CollegeState, BioState, MiniQuizState, ModuleType, BodyPartId } from '../types';
import { DEFAULT_FOOTBALL_PLAN, DEFAULT_GYM_PLAN, DEFAULT_COLLEGE_TIMETABLE, INITIAL_ACHIEVEMENTS } from '../constants';
import { getDateKey } from '../utils/helpers';
import { sound } from '../utils/sound';

const STORAGE_KEY = 'lifeAthleteOS_v2';

// Helper to init stats
const initMuscleStats = () => {
    const parts: BodyPartId[] = [
        'head', 'chest', 'abs', 'upper_back', 'lower_back',
        'shoulders', 'biceps', 'triceps', 'forearms', 'wrists',
        'glutes', 'quads', 'hamstrings', 'calves',
        'knees', 'elbows', 'ankles', 'heart'
    ];
    const stats: Record<string, { maxWeight: number, lastUpdated: string }> = {};
    parts.forEach(p => stats[p] = { maxWeight: 0, lastUpdated: '' });
    return stats;
};

const BOUNTY_POOL = [
    { label: 'Drink 3L Water', reward: 50, type: 'general' },
    { label: 'No Junk Food Today', reward: 100, type: 'general' },
    { label: '10 Min Meditation', reward: 50, type: 'general' },
    { label: 'Perfect Attendance', reward: 150, type: 'college' },
    { label: 'Extra 15m Training', reward: 80, type: 'football' },
    { label: 'New Personal Best', reward: 200, type: 'gym' },
    { label: 'Read 10 Pages', reward: 50, type: 'general' },
    { label: 'Cold Shower', reward: 100, type: 'general' },
    { label: 'Sleep by 11 PM', reward: 100, type: 'general' },
    { label: 'Pack Bag Early', reward: 50, type: 'college' },
    { label: 'Morning Stretch', reward: 40, type: 'general' },
    { label: 'Log All Meals', reward: 120, type: 'gym' },
    { label: 'Clean Study Desk', reward: 60, type: 'college' },
    { label: 'Watch Match Analysis', reward: 90, type: 'football' },
    { label: '100 Pushups Total', reward: 150, type: 'gym' },
    { label: 'No Social Media > 1h', reward: 100, type: 'general' },
    { label: 'Plan Tomorrow', reward: 50, type: 'general' },
    { label: 'Review Notes', reward: 70, type: 'college' },
];

const INITIAL_STATE: AppState = {
    userType: 'student',
    startDate: null,
    dob: null,
    currentModule: 'football',
    hasOnboarded: false,
    football: {
        level: 1, xp: 0, xpToNextLevel: 100,
        currentStreak: 0, bestStreak: 0,
        trainingHistory: {}, triviaHistory: {},
        correctTriviaCount: 0, totalTrainingSessions: 0, totalTrainingHours: 0,
        stats: { technical: 50, physical: 50, tactical: 50, mental: 50 },
        inventory: { freeze: 0, doubleXP: 0, tripleXP: 0 },
        achievements: INITIAL_ACHIEVEMENTS.filter(a => a.category === 'Football'),
        trainingPlan: DEFAULT_FOOTBALL_PLAN,
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
        },
        reminderHour: 20,
        reminderMinute: 0,
        lastMorningCheck: null,
        matches: []
    },
    gym: {
        level: 1, xp: 0, xpToNextLevel: 100,
        currentStreak: 0, bestStreak: 0,
        trainingHistory: {}, totalTrainingSessions: 0, totalTrainingHours: 0,
        height: null, weight: null, weightHistory: [], lastHeightUpdate: null,
        inventory: { freeze: 0, doubleXP: 0, tripleXP: 0 },
        achievements: INITIAL_ACHIEVEMENTS.filter(a => a.category === 'Gym'),
        trainingPlan: DEFAULT_GYM_PLAN,
        reminderHour: 20,
        reminderMinute: 0,
        lastMorningCheck: null
    },
    college: {
        attendanceHistory: {},
        timetable: DEFAULT_COLLEGE_TIMETABLE,
        assignments: [],
        booksReminderHour: 21, booksReminderMinute: 0, idReminderHour: 21, idReminderMinute: 0, homeworkReminderHour: 20, homeworkReminderMinute: 0,
        booksPackedCount: 0, idCardRemembered: 0, homeworkCompleted: 0,
        homeworkText: '',
        lastDailyCheck: null,
        lastHomeworkCheck: null,
        lastArchivedMonthId: null,
        dailyFlags: { books: false, idCard: false, homework: false },
        achievements: INITIAL_ACHIEVEMENTS.filter(a => a.category === 'College'),
        remarks: {},
        savedTotalAttendance: null,
        selectedMonthsForTotal: [],
        monthlyAttendanceHistory: [],
        exams: [],
        customNotifications: []
    },
    miniQuiz: {
        questions: []
    },
    bio: {
        muscleStats: initMuscleStats(),
        injuries: {},
        cardio: {
            sprintSpeed: 0,
            sprintDuration: 0,
            maxDistance: 0,
            maxDistanceTime: 0,
            heartRating: 'Uncalibrated'
        },
        previousAssessment: undefined
    },
    dailyBounties: {
        date: '',
        tasks: []
    },
    enabledModules: {
        football: true,
        gym: true,
        college: true
    },
    coins: 0,
    morningReminderHour: 8,
    morningReminderMinute: 0,
    notificationToggles: {
        football: true,
        gym: true,
        books: true,
        idcard: true,
        homework: true,
        morning: true,
    },
    notificationMessages: {
        football: "Did you train today? ⚽",
        gym: "Did you go to the gym today? 🏋️",
        books: "Pack your books for tomorrow. 📚",
        idcard: "Ensure your ID card and books are ready. 🪪",
        homework: "Homework Check: Ensure all assignments are completed. 📝",
        morning: "Morning Protocol Active. ☀️"
    },
    midnightLock: true,
    lastSyncTimestamp: 0,
    theme: 'system'
};

interface AppContextType {
    state: AppState;
    updateState: (updates: Partial<AppState>) => void;
    updateFootball: (updates: Partial<FootballState>) => void;
    updateGym: (updates: Partial<GymState>) => void;
    updateCollege: (updates: Partial<CollegeState>) => void;
    updateBio: (updates: Partial<BioState>) => void;
    updateMiniQuiz: (updates: Partial<MiniQuizState>) => void;
    resetModule: (module: ModuleType) => void;
    resetAll: () => void;
    importData: (data: AppState) => void;
    completeBounty: (id: string) => void;
    deductCoins: (amount: number) => void;
    resetOnboarding: () => void;
    logTraining: (module: 'football' | 'gym', session: any) => void;
    logMissed: (module: 'football' | 'gym', dateKey: string) => void;
    setPendingAction: (action: AppState['pendingAction']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(INITIAL_STATE);
    const [isLoaded, setIsLoaded] = useState(false);

    const persist = useCallback((newState: AppState) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        } catch (e) {
            console.error("Failed to save state", e);
        }
    }, []);

    const updateState = useCallback((updates: Partial<AppState>) => {
        setState(prev => {
            const next = { ...prev, ...updates };
            persist(next);
            return next;
        });
    }, [persist]);

    const updateFootball = useCallback((updates: Partial<FootballState>) => {
        setState(prev => {
            const next = { ...prev, football: { ...prev.football, ...updates } };
            persist(next);
            return next;
        });
    }, [persist]);

    const updateGym = useCallback((updates: Partial<GymState>) => {
        setState(prev => {
            const next = { ...prev, gym: { ...prev.gym, ...updates } };
            persist(next);
            return next;
        });
    }, [persist]);

    const updateCollege = useCallback((updates: Partial<CollegeState>) => {
        setState(prev => {
            const next = { ...prev, college: { ...prev.college, ...updates } };
            persist(next);
            return next;
        });
    }, [persist]);

    const updateBio = useCallback((updates: Partial<BioState>) => {
        setState(prev => {
            const next = { ...prev, bio: { ...prev.bio, ...updates } };
            persist(next);
            return next;
        });
    }, [persist]);

    const updateMiniQuiz = useCallback((updates: Partial<MiniQuizState>) => {
        setState(prev => {
            const next = { ...prev, miniQuiz: { ...prev.miniQuiz, ...updates } };
            persist(next);
            return next;
        });
    }, [persist]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Deep merge logic for safe state migration
                if (parsed.college && !parsed.college.dailyFlags) {
                     parsed.college.dailyFlags = { books: false, idCard: false, homework: false };
                }
                if (parsed.college && !parsed.college.assignments) {
                    parsed.college.assignments = [];
                }
                if (parsed.college && !parsed.college.remarks) {
                    parsed.college.remarks = {};
                }
                if (parsed.college && parsed.college.savedTotalAttendance === undefined) {
                    parsed.college.savedTotalAttendance = null;
                }
                if (parsed.college && !parsed.college.selectedMonthsForTotal) {
                    parsed.college.selectedMonthsForTotal = [];
                }
                if (parsed.college && !parsed.college.monthlyAttendanceHistory) {
                    parsed.college.monthlyAttendanceHistory = [];
                }
                if (parsed.college && !parsed.college.exams) {
                    parsed.college.exams = [];
                }
                if (parsed.college && !parsed.college.customNotifications) {
                    parsed.college.customNotifications = [];
                }
                
                // Migration for multi-reminders
                if (parsed.college) {
                    if (parsed.college.assignments) {
                        parsed.college.assignments = parsed.college.assignments.map((a: any) => {
                            if (a.reminder && !a.reminders) {
                                return {
                                    ...a,
                                    reminders: [{
                                        id: `rem-init-${Date.now()}-${Math.random()}`,
                                        type: 'date',
                                        at: a.dueDate,
                                        time: a.reminder,
                                        message: `Assignment Due: ${a.title} 📝`,
                                        enabled: true
                                    }]
                                };
                            }
                            if (!a.reminders) a.reminders = [];
                            return a;
                        });
                    }
                    if (parsed.college.exams) {
                        parsed.college.exams = parsed.college.exams.map((e: any) => {
                            if (e.reminder && !e.reminders) {
                                return {
                                    ...e,
                                    reminders: [{
                                        id: `rem-init-${Date.now()}-${Math.random()}`,
                                        type: 'date',
                                        at: e.date,
                                        time: e.reminder,
                                        message: `Exam Reminder: ${e.subject} 📚`,
                                        enabled: true
                                    }]
                                };
                            }
                            if (!e.reminders) e.reminders = [];
                            return e;
                        });
                    }
                }
                if (parsed.football && !parsed.football.matches) {
                    parsed.football.matches = [];
                }
                if (parsed.football) {
                    if (!parsed.football.stats) {
                        parsed.football.stats = { technical: 50, physical: 50, tactical: 50, mental: 50 };
                    } else {
                        parsed.football.stats = { ...INITIAL_STATE.football.stats, ...parsed.football.stats };
                    }
                }
                if (!parsed.bio) {
                    parsed.bio = INITIAL_STATE.bio;
                } else {
                    if (!parsed.bio.muscleStats['quads'] || !parsed.bio.muscleStats['wrists']) {
                        parsed.bio.muscleStats = { ...INITIAL_STATE.bio.muscleStats, ...parsed.bio.muscleStats };
                    }
                    if (parsed.bio.brainStats) {
                        parsed.bio.previousAssessment = {
                            discipline: parsed.bio.brainStats.discipline,
                            consistency: parsed.bio.brainStats.consistency,
                            date: parsed.bio.brainStats.lastUpdated || new Date().toISOString()
                        };
                        delete parsed.bio.brainStats;
                    }
                }
                if (parsed.football && parsed.football.customization) {
                    if (parsed.football.customization.bgZoom === undefined) {
                        parsed.football.customization.bgZoom = 100;
                        parsed.football.customization.bgX = 50;
                        parsed.football.customization.bgY = 50;
                    }
                    if (parsed.football.customization.logoFont === undefined) {
                        parsed.football.customization.logoFont = 'sekuya';
                    }
                    if (parsed.football.customization.greetingsFont === undefined) {
                        parsed.football.customization.greetingsFont = 'outfit';
                    }
                    if (parsed.football.customization.bodyFont === undefined) {
                        parsed.football.customization.bodyFont = 'jakarta';
                    }
                }
                if (!parsed.dailyBounties) {
                    parsed.dailyBounties = INITIAL_STATE.dailyBounties;
                }
                if (!parsed.enabledModules) {
                    parsed.enabledModules = INITIAL_STATE.enabledModules;
                }
                if (parsed.morningReminderHour === undefined) {
                    parsed.morningReminderHour = 8;
                }
                if (parsed.morningReminderMinute === undefined) {
                    parsed.morningReminderMinute = 0;
                }
                if (parsed.football && parsed.football.reminderMinute === undefined) {
                    parsed.football.reminderMinute = 0;
                }
                if (parsed.gym && parsed.gym.reminderMinute === undefined) {
                    parsed.gym.reminderMinute = 0;
                }
                if (parsed.college) {
                    if (parsed.college.booksReminderMinute === undefined) parsed.college.booksReminderMinute = 0;
                    if (parsed.college.idReminderMinute === undefined) parsed.college.idReminderMinute = 0;
                    if (parsed.college.homeworkReminderMinute === undefined) parsed.college.homeworkReminderMinute = 0;
                }
                if (!parsed.notificationToggles) {
                    parsed.notificationToggles = INITIAL_STATE.notificationToggles;
                }
                if (!parsed.notificationMessages) {
                    parsed.notificationMessages = INITIAL_STATE.notificationMessages;
                }
                if (parsed.hasOnboarded && !parsed.userType) {
                    parsed.userType = 'student';
                }
                if (parsed.userType !== 'student') {
                    parsed.userType = 'student';
                }
                if (!parsed.miniQuiz) {
                    parsed.miniQuiz = INITIAL_STATE.miniQuiz;
                }
                if (parsed.theme === undefined) {
                    parsed.theme = 'system';
                }
                setState(prev => ({ ...prev, ...parsed }));
            }
        } catch (e) {
            console.error("Failed to load state", e);
        }
        setIsLoaded(true);
    }, []);

    // Refs for football/gym — avoids triggering the daily effect on every XP/training change
    const footballRef = React.useRef(state.football);
    const gymRef = React.useRef(state.gym);
    React.useEffect(() => { footballRef.current = state.football; }, [state.football]);
    React.useEffect(() => { gymRef.current = state.gym; }, [state.gym]);

    useEffect(() => {
        if (!isLoaded) return;
        const todayKey = getDateKey(new Date());
        
        // 1. Daily College Check
        if (state.college.lastDailyCheck !== todayKey) {
             updateCollege({
                 lastDailyCheck: todayKey,
                 dailyFlags: { books: false, idCard: false, homework: false },
                 exams: state.college.exams.map(e => {
                     if (e.date < todayKey && !e.completed) {
                         return { ...e, completed: true };
                     }
                     return e;
                 })
             });
        }

        // 2. Month-End Automation
        const now = new Date();
        const currentMonthId = now.getMonth() + (now.getFullYear() * 12);
        const lastArchivedMonthId = state.college.lastArchivedMonthId;
        
        // 3. Injury Expiration
        const injuries = { ...state.bio.injuries };
        let injuriesChanged = false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        Object.entries(injuries).forEach(([part, data]: [string, any]) => {
            const injuryDate = new Date(data.date);
            const expirationDate = new Date(injuryDate);
            expirationDate.setDate(expirationDate.getDate() + data.durationDays);
            
            if (today >= expirationDate) {
                delete injuries[part];
                injuriesChanged = true;
            }
        });

        if (injuriesChanged) {
            updateBio({ injuries });
        }
        
        if (lastArchivedMonthId !== null && lastArchivedMonthId < currentMonthId) {
            const archId = lastArchivedMonthId;
            const m = archId % 12;
            const y = Math.floor(archId / 12);
            
            // Calculate rate for the month that just ended
            const records = (Object.values(state.college.attendanceHistory) as any[]).filter(r => {
                const [ry, rm] = r.date.split('-').map(Number);
                return (rm - 1) === m && ry === y;
            });
            
            let present = 0;
            let absent = 0;
            let leave = 0;
            
            records.forEach(r => {
                const remark = state.college.remarks[r.date];
                const isHalf = remark?.isHalfDay;
                const weight = isHalf ? 0.5 : 1;
                
                if (r.status === 'present') {
                    present += weight;
                } else if (r.status === 'leave') {
                    leave += weight;
                } else if (r.status === 'absent-personal') {
                    absent += weight;
                }
            });
            
            const effectivePresent = present + leave;
            const total = effectivePresent + absent;
            const rate = total === 0 ? 0 : effectivePresent / total * 100;
            const monthName = new Date(y, m, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
            
            if (!state.college.monthlyAttendanceHistory.find(h => h.month === monthName)) {
                updateCollege({
                    monthlyAttendanceHistory: [
                        ...state.college.monthlyAttendanceHistory,
                        { month: monthName, rate, timestamp: new Date().toISOString() }
                    ],
                    lastArchivedMonthId: currentMonthId
                });
            } else {
                updateCollege({ lastArchivedMonthId: currentMonthId });
            }
        } else if (lastArchivedMonthId === null) {
            updateCollege({ lastArchivedMonthId: currentMonthId });
        }

        // 3. Midnight Logic & Bounty Refresh
        if (state.dailyBounties.date !== todayKey) {
            const shuffled = [...BOUNTY_POOL].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3).map((t, i) => ({
                ...t,
                id: `bounty-${i}-${todayKey}`,
                completed: false
            }));

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = getDateKey(yesterday);

            // Use refs to read current football/gym state without triggering re-runs
            const football = footballRef.current;
            const gym = gymRef.current;

            const fbHistory = football.trainingHistory as Record<string, any>;
            const gymHistory = gym.trainingHistory as Record<string, any>;

            let footballUpdates: any = {};
            let gymUpdates: any = {};

            // Football Streak Check
            const lastFbLog = Object.keys(fbHistory).sort().reverse()[0];
            if (lastFbLog && lastFbLog < yesterdayKey && football.currentStreak > 0) {
                footballUpdates.currentStreak = 0;
            }

            // Gym Streak Check
            const lastGymLog = Object.keys(gymHistory).sort().reverse()[0];
            if (lastGymLog && lastGymLog < yesterdayKey && gym.currentStreak > 0) {
                gymUpdates.currentStreak = 0;
            }

            // Recalculate totals to ensure consistency and fix any "assumed" data
            const fbTotalHours = Object.values(fbHistory).reduce((acc, curr: any) => acc + (curr.duration || 0), 0);
            const fbTotalSessions = Object.values(fbHistory).filter((e: any) => e.completed).length;
            
            const gymTotalHours = Object.values(gymHistory).reduce((acc, curr: any) => acc + (curr.duration || 0), 0);
            const gymTotalSessions = Object.values(gymHistory).filter((e: any) => e.completed).length;

            updateState({
                dailyBounties: {
                    date: todayKey,
                    tasks: selected
                },
                football: { 
                    ...football, 
                    ...footballUpdates,
                    totalTrainingHours: fbTotalHours,
                    totalTrainingSessions: fbTotalSessions
                },
                gym: { 
                    ...gym, 
                    ...gymUpdates,
                    totalTrainingHours: gymTotalHours,
                    totalTrainingSessions: gymTotalSessions
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, state.college.lastDailyCheck, state.dailyBounties.date, updateState, updateCollege]);

    const completeBounty = useCallback((id: string) => {
        setState(prev => {
            const task = prev.dailyBounties.tasks.find(t => t.id === id);
            if (!task || task.completed) return prev;

            const updatedTasks = prev.dailyBounties.tasks.map(t => 
                t.id === id ? { ...t, completed: true } : t
            );

            const next = {
                ...prev,
                coins: prev.coins + task.reward,
                football: { ...prev.football, xp: prev.football.xp + (task.reward * 2) },
                dailyBounties: { ...prev.dailyBounties, tasks: updatedTasks }
            };
            persist(next);
            sound.playCoin();
            return next;
        });
    }, [persist]);

    const deductCoins = useCallback((amount: number) => {
        setState(prev => {
            const next = {
                ...prev,
                coins: Math.max(0, prev.coins - amount)
            };
            persist(next);
            return next;
        });
    }, [persist]);

    const resetModule = useCallback((module: ModuleType) => {
        if (module === 'football') updateFootball(INITIAL_STATE.football);
        if (module === 'gym') updateGym(INITIAL_STATE.gym);
        if (module === 'college') updateCollege(INITIAL_STATE.college);
        if (module === 'bio') updateBio(INITIAL_STATE.bio);
        sound.playSuccess();
    }, [updateFootball, updateGym, updateCollege, updateBio]);

    const resetAll = useCallback(() => {
        try {
            localStorage.clear();
        } catch (e) {
            console.error("Failed to clear storage", e);
        }
        setState(INITIAL_STATE);
        persist(INITIAL_STATE);
        sound.playClick();
    }, [persist]);

    const logTraining = useCallback((module: 'football' | 'gym', session: any) => {
        setState(prev => {
            const modState = prev[module];
            const history = { ...modState.trainingHistory, [session.date]: session };
            
            // Streak logic
            const sessionDate = new Date(session.date);
            const dayBefore = new Date(sessionDate);
            dayBefore.setDate(dayBefore.getDate() - 1);
            const yesterdayKey = getDateKey(dayBefore);
            
            const yesterdayEntry = modState.trainingHistory[yesterdayKey];
            const isStreakPreserved = yesterdayEntry && (yesterdayEntry.completed || yesterdayEntry.skipped);
            const newStreak = isStreakPreserved ? modState.currentStreak + 1 : 1;
            
            // XP logic
            const duration = session.isRest ? 0 : (session.hours || 0) + ((session.minutes || 0) / 60);
            const baseXP = session.isRest ? 50 : duration * 100;
            const multiplier = (modState.inventory.tripleXP > 0 ? 3 : modState.inventory.doubleXP > 0 ? 2 : 1);
            const earnedXP = Math.round(baseXP * multiplier);
            
            let newXP = modState.xp + earnedXP;
            let newLevel = modState.level;
            let newXPToNext = modState.xpToNextLevel;
            
            if (newXP >= newXPToNext) {
                newXP -= newXPToNext;
                newLevel += 1;
                newXPToNext = Math.round(newXPToNext * 1.2);
                sound.playLevelUp();
            } else {
                sound.playSuccess();
            }
            
            const updatedMod = {
                ...modState,
                trainingHistory: history,
                currentStreak: newStreak,
                bestStreak: Math.max(modState.bestStreak, newStreak),
                xp: newXP,
                level: newLevel,
                xpToNextLevel: newXPToNext,
                totalTrainingSessions: modState.totalTrainingSessions + (session.completed ? 1 : 0),
                totalTrainingHours: modState.totalTrainingHours + duration
            };
            
            const next = { ...prev, [module]: updatedMod };
            persist(next);
            return next;
        });
    }, [persist]);

    const logMissed = useCallback((module: 'football' | 'gym', dateKey: string) => {
        setState(prev => {
            const modState = prev[module];
            const history = { ...modState.trainingHistory, [dateKey]: { date: dateKey, completed: false, skipped: true, timestamp: new Date().toISOString() } };
            const next = { ...prev, [module]: { ...modState, trainingHistory: history, currentStreak: 0 } };
            persist(next);
            return next;
        });
    }, [persist]);

    const setPendingAction = useCallback((action: AppState['pendingAction']) => {
        setState(prev => {
            const next = { ...prev, pendingAction: action };
            persist(next);
            return next;
        });
    }, [persist]);

    const importData = useCallback((importingData: AppState) => {
        setState(importingData);
        persist(importingData);
        sound.playLevelUp();
    }, [persist]);

    const resetOnboarding = useCallback(() => {
        const next = { ...state, hasOnboarded: false, userName: '' };
        setState(next);
        persist(next);
        sound.playClick();
    }, [state, persist]);

    if (!isLoaded) return null;

    return (
        <AppContext.Provider value={{ state, updateState, updateFootball, updateGym, updateCollege, updateBio, updateMiniQuiz, resetModule, resetAll, resetOnboarding, importData, completeBounty, deductCoins, logTraining, logMissed, setPendingAction }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};
