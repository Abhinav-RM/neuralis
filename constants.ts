import { Achievement, TimetableDay } from './types';

export const DEFAULT_COLLEGE_TIMETABLE: Record<number, TimetableDay> = {
    1: { subjects: "Math, Physics, Chemistry Lab" },
    2: { subjects: "English, History, Biology" },
    3: { subjects: "CS, Math, Physics" },
    4: { subjects: "Chemistry, English, PE" },
    5: { subjects: "Biology, History, Math" }
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
    { id: "col_perfect", name: "Perfect", description: "100% monthly attendance", icon: "🎯", category: "College", unlocked: false },
];

export const APP_VERSION: string = '1.0.8';
export const DEV_EMAIL = 'abhinavrm26@gmail.com';