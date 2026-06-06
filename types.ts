 
export type ModuleType = 'football' | 'gym' | 'college' | 'life' | 'settings' | 'evaluation' | 'bio' | 'quiz';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'Football' | 'Gym' | 'College';
    unlocked: boolean;
}

export interface TrainingPlanDay {
    name: string;
    type: 'training' | 'rest';
    title: string;       // e.g., "Shooting & Drills"
    details: string;     // e.g., "30 mins free kicks, 20 mins cone dribbling"
}

export interface TrainingSession {
    date: string;
    completed: boolean;
    skipped?: boolean;
    timestamp: string;
    hours?: number;
    minutes?: number;
    duration?: number;
    muscles?: string[];
    manualEntry?: boolean;
    focus?: 'technical' | 'physical' | 'tactical' | 'mental';
    isRest?: boolean;
    remark?: string;
}

export interface TriviaRecord {
    date: string;
    correct: boolean;
    timestamp: string;
}

export interface WeightEntry {
    date: string;
    weight: number;
    timestamp: string;
}

export interface AttendanceRecord {
    date: string;
    status: 'present' | 'absent-personal' | 'absent-college' | 'leave';
    timestamp: string;
    manualEntry?: boolean;
}

export interface TimetableDay {
    subjects: string;
    isLeave?: boolean;
}

export interface Match {
    id: string;
    date: string;
    time: string;
    place: string;
    status: 'scheduled' | 'completed';
    result?: 'win' | 'loss' | 'draw';
    goals?: number;
    assists?: number;
    shots?: number;
    shotsOnTarget?: number;
    note?: string;
}

export type ReminderType = 'date' | 'day-before' | 'daily' | 'twice' | 'specific-days';

export interface MultiReminder {
    id: string;
    type: ReminderType;
    at?: string; // YYYY-MM-DD for 'date'
    time: string; // HH:mm
    days?: number[]; // [0-6] for 'specific-days'
    message: string;
    enabled: boolean;
}

export interface Exam {
    id: string;
    subject: string;
    date: string;
    reminder?: string; // Legacy HH:mm
    reminders?: MultiReminder[];
    completed?: boolean;
}

export interface Assignment {
    id: string;
    subject: string;
    title: string;
    dueDate: string; // YYYY-MM-DD
    completed: boolean;
    reminder?: string; // Legacy HH:mm
    reminders?: MultiReminder[];
}

export interface CustomNotification {
    id: string;
    message: string;
    time: string; // HH:mm
    enabled: boolean;
    type?: ReminderType;
    repeats?: 'once' | 'twice' | 'daily' | 'specific-days'; // How often this notification fires
    at?: string; // Specific date for 'date'
    days?: number[]; // Specific days for 'specific-days' (0=Sun, 6=Sat)
}

// --- NEW BIO TYPES ---
export type BodyPartId = 
    | 'head' | 'chest' | 'abs' | 'upper_back' | 'lower_back' 
    | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'wrists'
    | 'glutes' | 'quads' | 'hamstrings' | 'calves' 
    | 'knees' | 'elbows' | 'ankles' | 'heart';

export interface InjuryRecord {
    partId: BodyPartId;
    date: string;      // When it happened
    durationDays: number; // Estimated recovery
    severity: 'low' | 'med' | 'high';
}

export interface MuscleStat {
    maxWeight: number; // 1RM in kg
    lastUpdated: string;
}

export interface BioState {
    muscleStats: Record<string, MuscleStat>; // Keyed by BodyPartId string
    injuries: Record<string, InjuryRecord>; // Keyed by partId
    cardio: {
        sprintSpeed: number; // km/h (derived or manual)
        sprintDuration: number; // seconds (max time at full speed)
        maxDistance: number; // km
        maxDistanceTime: number; // minutes
        heartRating: string; // "Elite", "Average", etc.
    };
    previousAssessment?: {
        discipline: number;
        consistency: number;
        date: string;
    };
}

export interface FootballState {
    level: number;
    xp: number;
    xpToNextLevel: number;
    currentStreak: number;
    bestStreak: number;
    trainingHistory: Record<string, TrainingSession>;
    triviaHistory: Record<string, TriviaRecord>;
    correctTriviaCount: number;
    totalTrainingSessions: number;
    totalTrainingHours: number;
    stats: {
        technical: number;
        physical: number;
        tactical: number;
        mental: number;
    };
    inventory: { freeze: number; doubleXP: number; tripleXP: number };
    achievements: Achievement[];
    trainingPlan: Record<number, TrainingPlanDay>;
    customization: {
        accentColor: string;
        greetingsColor?: string;
        greetingsCasing?: 'caps' | 'small' | 'mix';
        blur: number;
        gradientStart: string;
        gradientMiddle: string;
        gradientEnd: string;
        fontStyle: string;
        logoFont?: string;
        greetingsFont?: string;
        bodyFont?: string;
        backgroundImage: string | null;
        bgZoom: number;
        bgX: number;
        bgY: number;
    };
    reminderHour: number;
    reminderMinute: number;
    lastMorningCheck: string | null;
    matches: Match[];
}

export interface GymState {
    level: number;
    xp: number;
    xpToNextLevel: number;
    currentStreak: number;
    bestStreak: number;
    trainingHistory: Record<string, TrainingSession>;
    totalTrainingSessions: number;
    totalTrainingHours: number;
    height: number | null;
    weight: number | null;
    weightHistory: WeightEntry[];
    lastHeightUpdate: string | null;
    inventory: { freeze: number; doubleXP: number; tripleXP: number };
    achievements: Achievement[];
    trainingPlan: Record<number, TrainingPlanDay>;
    reminderHour: number;
    reminderMinute: number;
    lastMorningCheck: string | null;
}

export interface CollegeState {
    attendanceHistory: Record<string, AttendanceRecord>;
    timetable: Record<number, TimetableDay>;
    assignments: Assignment[];
    booksReminderHour: number;
    booksReminderMinute: number;
    idReminderHour: number;
    idReminderMinute: number;
    homeworkReminderHour: number;
    homeworkReminderMinute: number;
    booksPackedCount: number;
    idCardRemembered: number;
    homeworkCompleted: number;
    homeworkText: string;
    lastDailyCheck: string | null; 
    lastHomeworkCheck: string | null;
    lastArchivedMonthId: number | null;
    dailyFlags: {
        books: boolean;
        idCard: boolean;
        homework: boolean;
    };
    achievements: Achievement[];
    remarks: Record<string, { isHalfDay: boolean; note: string }>;
    savedTotalAttendance: number | null;
    selectedMonthsForTotal: number[];
    monthlyAttendanceHistory: { month: string; rate: number; timestamp: string }[];
    exams: Exam[];
    customNotifications: CustomNotification[];
}

export interface MiniQuizQuestion {
    id: string;
    question: string;
    type: 'mcq' | 'open';
    subject: string;
    options?: string[]; // For MCQ: array of possibilities
    correctAnswers: string[]; // For MCQ: the string value of correct option(s). For Open: acceptable answers.
    collapsed: boolean;
    createdAt: string;
}

export interface MiniQuizState {
    questions: MiniQuizQuestion[];
}

export interface BountyTask {
    id: string;
    label: string;
    reward: number;
    completed: boolean;
    type: 'football' | 'gym' | 'college' | 'general';
}

export interface ChartDataPoint {
    name: string;
    football: number;
    gym: number;
    college: number;
}

export interface AppState {
    userType?: 'student' | 'athlete' | null;
    startDate: string | null;
    dob: string | null;
    currentModule: ModuleType;
    userName?: string;
    football: FootballState;
    gym: GymState;
    college: CollegeState;
    miniQuiz: MiniQuizState;
    bio: BioState; 
    hasOnboarded: boolean;
    dailyBounties: {
        date: string;
        tasks: BountyTask[];
    };
    enabledModules: {
        football: boolean;
        gym: boolean;
        college: boolean;
    };
    coins: number;
    morningReminderHour: number;
    morningReminderMinute: number;
    notificationToggles: {
        football: boolean;
        gym: boolean;
        books: boolean;
        idcard: boolean;
        homework: boolean;
        morning: boolean;
    };
    notificationMessages: {
        football: string;
        gym: string;
        books: string;
        idcard: string;
        homework: string;
        morning: string;
    };
    midnightLock: boolean;
    pendingAction?: {
        module: ModuleType;
        type: 'check-in' | 'reminder' | 'homework';
    } | null;
    lastSyncTimestamp?: number;
    theme?: 'dark' | 'light' | 'system';
}
