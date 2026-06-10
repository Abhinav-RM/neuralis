import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, CollegeState, CustomizationState, ModuleType } from '../types';
import { DEFAULT_COLLEGE_TIMETABLE, INITIAL_ACHIEVEMENTS } from '../constants';
import { getDateKey } from '../utils/helpers';
import { sound } from '../utils/sound';

const STORAGE_KEY = 'lifeAthleteOS_v2';

const INITIAL_STATE: AppState = {
    startDate: null,
    dob: null,
    currentModule: 'college',
    hasOnboarded: false,
    college: {
        attendanceHistory: {},
        timetable: DEFAULT_COLLEGE_TIMETABLE,
        assignments: [],
        booksReminderHour: 21,
        booksReminderMinute: 0,
        idReminderHour: 21,
        idReminderMinute: 0,
        homeworkReminderHour: 20,
        homeworkReminderMinute: 0,
        booksPackedCount: 0,
        idCardRemembered: 0,
        homeworkCompleted: 0,
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
    customization: {
        accentColor: '#3b82f6',
        greetingsColor: '',
        greetingsCasing: 'caps',
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
        bgY: 50,
        soundEnabled: true,
        vibrationEnabled: true,
        storagePermission: 'prompt'
    },
    morningReminderHour: 8,
    morningReminderMinute: 0,
    notificationToggles: {
        books: true,
        idcard: true,
        homework: true,
        morning: true
    },
    notificationMessages: {
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
    updateCustomization: (updates: Partial<CustomizationState>) => void;
    updateCollege: (updates: Partial<CollegeState>) => void;
    resetAll: () => void;
    importData: (data: AppState) => void;
    resetOnboarding: () => void;
    setPendingAction: (action: AppState['pendingAction']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(INITIAL_STATE);
    const [isLoaded, setIsLoaded] = useState(false);
    const stateRef = useRef(state);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Keep stateRef up to date with the latest state
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const persist = useCallback((newState: AppState, forceImmediate = false) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        const performSave = () => {
            try {
                // Separate the heavy wallpaper text string from core data before committing to disk
                const stateToPersist = {
                    ...newState,
                    customization: {
                        ...newState.customization,
                        backgroundImage: null // Keep the main state key clear of large asset text
                    }
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
            } catch (e) {
                console.error("Failed to save state", e);
            }
        };

        if (forceImmediate) {
            performSave();
        } else {
            // 2-second debounce wrapper
            saveTimeoutRef.current = setTimeout(() => {
                performSave();
                saveTimeoutRef.current = null;
            }, 2000);
        }
    }, []);

    // Listen for mobile backgrounding events to force a final, synchronous save instantly
    useEffect(() => {
        const setupAppListener = async () => {
            try {
                const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
                if (isNative) {
                    const { App: CapApp } = await import('@capacitor/app');
                    const handleAppStateChange = ({ isActive }: { isActive: boolean }) => {
                        if (!isActive) {
                            persist(stateRef.current, true);
                        }
                    };
                    const listener = await CapApp.addListener('appStateChange', handleAppStateChange);
                    return () => {
                        listener.remove();
                    };
                }
            } catch (e) {
                console.error("Failed to setup App state listener", e);
            }
        };

        const cleanupPromise = setupAppListener();
        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [persist]);

    const updateState = useCallback((updates: Partial<AppState>) => {
        setState(prev => {
            const next = { ...prev, ...updates };
            persist(next);
            return next;
        });
    }, [persist]);

    const updateCustomization = useCallback((updates: Partial<CustomizationState>) => {
        setState(prev => {
            // Isolate base64 wallpaper asset storage from the main key
            if (updates.backgroundImage !== undefined) {
                try {
                    if (updates.backgroundImage) {
                        localStorage.setItem('neuralis_wallpaper', updates.backgroundImage);
                    } else {
                        localStorage.removeItem('neuralis_wallpaper');
                    }
                } catch (e) {
                    console.error("Failed to save wallpaper to storage", e);
                }
            }
            const next = { ...prev, customization: { ...prev.customization, ...updates } };
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

    const resetAll = useCallback(() => {
        try {
            localStorage.clear();
        } catch (e) {
            console.error("Failed to clear storage", e);
        }
        setState(INITIAL_STATE);
        persist(INITIAL_STATE, true);
        sound.playClick();
    }, [persist]);

    const setPendingAction = useCallback((action: AppState['pendingAction']) => {
        setState(prev => {
            const next = { ...prev, pendingAction: action };
            persist(next);
            return next;
        });
    }, [persist]);

    const importData = useCallback((importingData: AppState) => {
        const cleaned: AppState = {
            ...INITIAL_STATE,
            ...importingData,
            college: {
                ...INITIAL_STATE.college,
                ...(importingData.college || {})
            },
            customization: {
                ...INITIAL_STATE.customization,
                ...(importingData.customization || (importingData as any).football?.customization || {})
            }
        };
        // Clean out legacy properties
        delete (cleaned as any).football;
        delete (cleaned as any).gym;
        delete (cleaned as any).bio;
        delete (cleaned as any).miniQuiz;
        delete (cleaned as any).dailyBounties;
        delete (cleaned as any).enabledModules;
        delete (cleaned as any).coins;
        delete (cleaned as any).userType;

        // Isolate base64 wallpaper if imported
        const wallpaper = cleaned.customization.backgroundImage;
        try {
            if (wallpaper) {
                localStorage.setItem('neuralis_wallpaper', wallpaper);
            } else {
                localStorage.removeItem('neuralis_wallpaper');
            }
        } catch (e) {
            console.error("Failed to save imported wallpaper", e);
        }

        setState(cleaned);
        persist(cleaned, true); // Force immediate save for imported data
        sound.playLevelUp();
    }, [persist]);

    const resetOnboarding = useCallback(() => {
        const next = { ...state, hasOnboarded: false, userName: '' };
        setState(next);
        persist(next);
        sound.playClick();
    }, [state, persist]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') {
                    if (!parsed.customization && parsed.football && parsed.football.customization) {
                        parsed.customization = parsed.football.customization;
                    }
                    
                    // Retrieve isolated wallpaper from storage if present
                    try {
                        const wallpaper = localStorage.getItem('neuralis_wallpaper');
                        if (parsed.customization) {
                            parsed.customization.backgroundImage = wallpaper;
                        }
                    } catch (e) {
                        console.error("Failed to load wallpaper from storage", e);
                    }
                    
                    if (parsed.customization) {
                        if (parsed.customization.bgZoom === undefined) {
                            parsed.customization.bgZoom = 100;
                            parsed.customization.bgX = 50;
                            parsed.customization.bgY = 50;
                        }
                        if (parsed.customization.logoFont === undefined) {
                            parsed.customization.logoFont = 'sekuya';
                        }
                        if (parsed.customization.greetingsFont === undefined) {
                            parsed.customization.greetingsFont = 'outfit';
                        }
                        if (parsed.customization.bodyFont === undefined) {
                            parsed.customization.bodyFont = 'jakarta';
                        }
                        if (parsed.customization.soundEnabled === undefined) {
                            parsed.customization.soundEnabled = true;
                        }
                        if (parsed.customization.vibrationEnabled === undefined) {
                            parsed.customization.vibrationEnabled = true;
                        }
                        if (parsed.customization.storagePermission === undefined) {
                            parsed.customization.storagePermission = 'prompt';
                        }
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
                    if (parsed.theme === undefined) {
                        parsed.theme = 'system';
                    }

                    delete parsed.football;
                    delete parsed.gym;
                    delete parsed.bio;
                    delete parsed.miniQuiz;
                    delete parsed.dailyBounties;
                    delete parsed.enabledModules;
                    delete parsed.coins;
                    delete parsed.userType;

                    setState(prev => ({ ...prev, ...parsed }));
                }
            }
        } catch (e) {
            console.error("Failed to load state", e);
        }
        setIsLoaded(true);
    }, []);

    const collegeRef = React.useRef(state.college);
    React.useEffect(() => { collegeRef.current = state.college; }, [state.college]);

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
        
        if (lastArchivedMonthId !== null && lastArchivedMonthId < currentMonthId) {
            const archId = lastArchivedMonthId;
            const m = archId % 12;
            const y = Math.floor(archId / 12);
            
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

        // 3. Midnight Lock Check
        const collegeState = collegeRef.current;
        const attendanceHistoryUpdates = { ...collegeState.attendanceHistory };
        let historyChanged = false;
        if (state.midnightLock) {
            Object.keys(attendanceHistoryUpdates).forEach(key => {
                if (key < todayKey && !attendanceHistoryUpdates[key].locked) {
                    attendanceHistoryUpdates[key] = { ...attendanceHistoryUpdates[key], locked: true };
                    historyChanged = true;
                }
            });
        }

        if (historyChanged) {
            updateCollege({
                attendanceHistory: attendanceHistoryUpdates
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, state.college.lastDailyCheck, state.midnightLock, updateState, updateCollege]);

    if (!isLoaded) return null;

    return (
        <AppContext.Provider value={{ state, updateState, updateCustomization, updateCollege, resetAll, resetOnboarding, importData, setPendingAction }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};
