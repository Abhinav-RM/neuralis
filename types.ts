export type ModuleType = 'college' | 'settings' | 'notifications';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'College';
    unlocked: boolean;
}

export interface AttendanceRecord {
    date: string;
    status: 'present' | 'absent-personal' | 'absent-college' | 'leave';
    timestamp: string;
    manualEntry?: boolean;
    locked?: boolean;
}

export interface TimetableDay {
    subjects: string;
    isLeave?: boolean;
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

export interface CustomizationState {
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
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    storagePermission?: 'granted' | 'denied' | 'prompt';
}

export interface AppState {
    startDate: string | null;
    dob: string | null;
    currentModule: ModuleType;
    hasOnboarded: boolean;
    userName?: string;
    college: CollegeState;
    customization: CustomizationState;
    morningReminderHour: number;
    morningReminderMinute: number;
    notificationToggles: {
        books: boolean;
        idcard: boolean;
        homework: boolean;
        morning: boolean;
    };
    notificationMessages: {
        books: string;
        idcard: string;
        homework: string;
        morning: string;
    };
    midnightLock: boolean;
    pendingAction?: {
        module: ModuleType;
        type: 'reminder' | 'homework';
    } | null;
    lastSyncTimestamp?: number;
    theme?: 'dark' | 'light' | 'system';
}
