
import { Achievement, TrainingPlanDay, TimetableDay } from './types';

export const DEFAULT_FOOTBALL_PLAN: Record<number, TrainingPlanDay> = {
    0: { name: "Sunday", type: "rest", title: "Active Recovery", details: "Light stretching, foam rolling, mental visualization." },
    1: { name: "Monday", type: "training", title: "Ball Mastery", details: "30mins passing drills, 5km jog, cone weaving." },
    2: { name: "Tuesday", type: "training", title: "Speed & Agility", details: "Plyometrics box jumps, ladder drills, sprint intervals." },
    3: { name: "Wednesday", type: "training", title: "Tactics & Positioning", details: "Match analysis, positioning study, light technical work." },
    4: { name: "Thursday", type: "training", title: "Shooting Clinic", details: "50 shots on target, free kicks, penalties." },
    5: { name: "Friday", type: "training", title: "Strength & Core", details: "Gym leg day focused on explosiveness, core endurance." },
    6: { name: "Saturday", type: "rest", title: "Match Day", details: "Full match or high-intensity scrimmage." }
};

export const DEFAULT_GYM_PLAN: Record<number, TrainingPlanDay> = {
    0: { name: "Sunday", type: "rest", title: "Rest & Feed", details: "High protein intake, complete rest." },
    1: { name: "Monday", type: "training", title: "Push Day", details: "Bench Press, Overhead Press, Dips, Tricep extensions." },
    2: { name: "Tuesday", type: "training", title: "Pull Day", details: "Deadlifts, Pull-ups, Rows, Bicep curls." },
    3: { name: "Wednesday", type: "training", title: "Leg Day", details: "Squats, Leg Press, Lunges, Calf raises." },
    4: { name: "Thursday", type: "training", title: "Upper Body", details: "Hypertrophy focus: Chest and Back supersets." },
    5: { name: "Friday", type: "training", title: "Lower Body", details: "Power focus: Cleans, Box squats." },
    6: { name: "Saturday", type: "rest", title: "Active Cardio", details: "30 min steady state cardio or swimming." }
};

export const DEFAULT_COLLEGE_TIMETABLE: Record<number, TimetableDay> = {
    1: { subjects: "Math, Physics, Chemistry Lab" },
    2: { subjects: "English, History, Biology" },
    3: { subjects: "CS, Math, Physics" },
    4: { subjects: "Chemistry, English, PE" },
    5: { subjects: "Biology, History, Math" }
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
    { id: "fb_first", name: "First Step", description: "Complete first training", icon: "🎯", category: "Football", unlocked: false },
    { id: "fb_week", name: "Week Warrior", description: "7-day streak", icon: "🔥", category: "Football", unlocked: false },
    { id: "gym_first", name: "First Pump", description: "First workout", icon: "💪", category: "Gym", unlocked: false },
    { id: "col_perfect", name: "Perfect", description: "100% monthly attendance", icon: "🎯", category: "College", unlocked: false },
];

export const TRIVIA_DB = [
    // FOOTBALL IQ (Tactical)
    { type: 'tactical', question: "Who won the 2018 FIFA World Cup?", options: ["Brazil", "France", "Germany", "Argentina"], correct: 1 },
    { type: 'tactical', question: "Who has the most Ballon d'Or awards?", options: ["Ronaldo", "Messi", "Platini", "Cruyff"], correct: 1 },
    { type: 'tactical', question: "Standard football size?", options: ["Size 4", "Size 5", "Size 6", "Size 3"], correct: 1 },
    { type: 'tactical', question: "Which position wears gloves?", options: ["Striker", "Goalkeeper", "Defender", "Midfielder"], correct: 1 },
    { type: 'tactical', question: "How many players are on a team?", options: ["10", "11", "12", "9"], correct: 1 },
    
    // ANATOMY & PHYSIOLOGY (Physical IQ)
    { type: 'physical', question: "Which muscle is the prime mover in a bench press?", options: ["Biceps", "Pectoralis Major", "Lats", "Quadriceps"], correct: 1 },
    { type: 'physical', question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], correct: 2 },
    { type: 'physical', question: "Which nutrient is the primary source of energy?", options: ["Protein", "Fats", "Carbohydrates", "Vitamins"], correct: 2 },
    { type: 'physical', question: "How many chambers does the human heart have?", options: ["2", "3", "4", "5"], correct: 2 },
];

export const SKIP_REASONS = [
    { id: 'injured', label: 'Injured', valid: true },
    { id: 'sick', label: 'Sick', valid: true },
    { id: 'emergency', label: 'Emergency', valid: true },
    { id: 'tired', label: 'Exhausted', valid: true },
    { id: 'lazy', label: 'Just Lazy', valid: false },
    { id: 'forgot', label: 'Forgot', valid: false }
];