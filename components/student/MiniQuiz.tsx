import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BrainCircuit, Plus, Trash2, ChevronDown, ChevronUp, 
    Play, Shuffle, ListOrdered, SkipForward, CheckCircle2, 
    XCircle, ArrowLeft, RefreshCw, Trophy, Target, 
    HelpCircle, Type, CheckSquare, X
} from 'lucide-react';
import { Button } from '../ui/Button';
import clsx from 'clsx';
import { sound } from '../../utils/sound';
import { MiniQuizQuestion } from '../../types';

export const MiniQuiz: React.FC = () => {
    const { state, updateMiniQuiz } = useApp();
    const { questions } = state.miniQuiz;

    const [view, setView] = useState<'manage' | 'quiz' | 'result'>('manage');
    const [isAdding, setIsAdding] = useState(false);
    const [newQuestion, setNewQuestion] = useState<Partial<MiniQuizQuestion>>({
        question: '',
        type: 'mcq',
        subject: '',
        options: ['', ''],
        correctAnswers: [],
        collapsed: false
    });

    const [selectedSubject, setSelectedSubject] = useState<string>('All');
    
    const availableSubjects = useMemo(() => {
        const subjects = questions.map(q => q.subject).filter(Boolean);
        return ['All', ...Array.from(new Set(subjects))];
    }, [questions]);

    const filteredQuestions = useMemo(() => {
        if (selectedSubject === 'All') return questions;
        return questions.filter(q => q.subject === selectedSubject);
    }, [questions, selectedSubject]);

    // Quiz Session State
    const [quizMode, setQuizMode] = useState<'ordered' | 'random'>('ordered');
    const [activeQuestions, setActiveQuestions] = useState<MiniQuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [skippedIds, setSkippedIds] = useState<string[]>([]);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [showCorrection, setShowCorrection] = useState(false);

    const handleAddQuestion = () => {
        if (!newQuestion.question || !newQuestion.subject || newQuestion.correctAnswers?.length === 0) return;
        if (newQuestion.type === 'mcq' && (newQuestion.options?.filter(opt => opt.trim()).length || 0) < 2) return;
        
        const q: MiniQuizQuestion = {
            id: Date.now().toString(),
            question: newQuestion.question!,
            type: newQuestion.type as 'mcq' | 'open',
            subject: newQuestion.subject!,
            options: newQuestion.type === 'mcq' ? newQuestion.options?.filter(opt => opt.trim()) : undefined,
            correctAnswers: newQuestion.correctAnswers!,
            collapsed: false,
            createdAt: new Date().toISOString()
        };

        updateMiniQuiz({ questions: [...questions, q] });
        setNewQuestion({ question: '', type: 'mcq', subject: '', options: ['', ''], correctAnswers: [], collapsed: false });
        setIsAdding(false);
        sound.playSuccess();
    };

    const deleteQuestion = (id: string) => {
        updateMiniQuiz({ questions: questions.filter(q => q.id !== id) });
        sound.playError();
    };

    const toggleCollapse = (id: string) => {
        updateMiniQuiz({
            questions: questions.map(q => q.id === id ? { ...q, collapsed: !q.collapsed } : q)
        });
    };

    const startQuiz = (mode: 'ordered' | 'random') => {
        if (filteredQuestions.length === 0) return;
        
        let pool = [...filteredQuestions];
        if (mode === 'random') {
            pool = pool.sort(() => Math.random() - 0.5);
        }
        
        setActiveQuestions(pool);
        setCurrentIndex(0);
        setScore(0);
        setSkippedIds([]);
        setQuizMode(mode);
        setView('quiz');
        sound.playClick();
    };

    const handleAnswer = (answer: string) => {
        if (feedback) return;

        const currentQ = activeQuestions[currentIndex];
        const isCorrect = currentQ.type === 'mcq' 
            ? answer === currentQ.correctAnswers[0]
            : currentQ.correctAnswers.some(a => a.toLowerCase().trim() === answer.toLowerCase().trim());

        if (isCorrect) {
            setScore(prev => prev + 1);
            setFeedback('correct');
            sound.playSuccess();
        } else {
            setFeedback('wrong');
            sound.playError();
        }

        setTimeout(() => {
            nextQuestion();
        }, 1500);
    };

    const handleSkip = () => {
        const currentQ = activeQuestions[currentIndex];
        setSkippedIds(prev => [...prev, currentQ.id]);
        setActiveQuestions(prev => [...prev, currentQ]); // Add to end
        nextQuestion();
        sound.playRobotBlip();
    };

    const nextQuestion = () => {
        setFeedback(null);
        setUserAnswer('');
        if (currentIndex < activeQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            const finalScore = score + (feedback === 'correct' ? 1 : 0); // Correct for async state if needed, but here it's fine
            setView('result');
            sound.playLevelUp();
        }
    };

    const getGrade = (pct: number) => {
        if (pct >= 90) return { label: 'A', color: 'text-emerald-400' };
        if (pct >= 75) return { label: 'B', color: 'text-blue-400' };
        if (pct >= 50) return { label: 'C', color: 'text-amber-400' };
        return { label: 'F', color: 'text-rose-400' };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 md:p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/20">
                        <BrainCircuit size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold font-heading tracking-tight">Mini Quiz</h1>
                        <p className="text-xs md:text-sm text-gray-400">Master your knowledge with custom drills</p>
                    </div>
                </div>
                {view === 'manage' && (
                    <Button 
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 text-sm"
                    >
                        <Plus size={16} /> Add Question
                    </Button>
                )}
            </div>

            {view === 'manage' && (
                <div className="space-y-6">
                    {availableSubjects.length > 2 && (
                        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {availableSubjects.map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => setSelectedSubject(sub)}
                                    className={clsx(
                                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                                        selectedSubject === sub 
                                            ? "bg-blue-600 border-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]" 
                                            : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"
                                    )}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filteredQuestions.length > 0 ? (
                                filteredQuestions.map((q) => (
                                    <motion.div 
                                        key={q.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors backdrop-blur-sm"
                                    >
                                        <div 
                                            className="p-4 flex items-center justify-between cursor-pointer"
                                            onClick={() => toggleCollapse(q.id)}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={clsx(
                                                    "p-2 rounded-lg shrink-0",
                                                    q.type === 'mcq' ? "bg-purple-500/20 text-purple-400" : "bg-amber-500/20 text-amber-400"
                                                )}>
                                                    {q.type === 'mcq' ? <CheckSquare size={16} /> : <Type size={16} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{q.subject}</span>
                                                    <span className="font-medium truncate text-sm md:text-base">{q.question}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}
                                                    className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <div className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                                                    {q.collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                                </div>
                                            </div>
                                        </div>
                                        <AnimatePresence>
                                            {!q.collapsed && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-white/5 bg-black/40 p-4 space-y-3"
                                                >
                                                    {q.type === 'mcq' ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {q.options?.map((opt, i) => (
                                                                <div key={i} className={clsx(
                                                                    "p-2.5 rounded-xl border text-sm flex items-center gap-2 transition-all",
                                                                    q.correctAnswers.includes(opt) 
                                                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                                                        : "bg-white/5 border-white/5 text-gray-400"
                                                                )}>
                                                                    {q.correctAnswers.includes(opt) ? <CheckCircle2 size={14} className="animate-pulse" /> : <div className="w-3.5" />}
                                                                    <span className="truncate">{opt}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Acceptable Answers</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {q.correctAnswers.map((ans, i) => (
                                                                    <span key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-mono">
                                                                        {ans}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20 bg-white/5 border border-white/10 border-dashed rounded-3xl"
                                >
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                                        <HelpCircle size={32} />
                                    </div>
                                    <p className="text-gray-400 font-medium">No questions added yet</p>
                                    <p className="text-xs text-gray-600 mt-1">Start building your knowledge base</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 rounded-3xl p-6 backdrop-blur-xl group hover:border-blue-500/50 transition-all duration-300">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Play className="text-blue-400 group-hover:scale-110 transition-transform" size={20} /> Start Drill
                            </h2>
                            <div className="space-y-3">
                                <button 
                                    className="w-full bg-black/40 hover:bg-white/10 border border-white/10 p-4 rounded-2xl flex items-center justify-between transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => startQuiz('ordered')}
                                    disabled={questions.length === 0}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl group-hover/btn:bg-blue-500 group-hover/btn:text-white transition-colors">
                                            <ListOrdered size={18} />
                                        </div>
                                        <span className="font-bold text-sm">Linear Order</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-600 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                                <button 
                                    className="w-full bg-black/40 hover:bg-white/10 border border-white/10 p-4 rounded-2xl flex items-center justify-between transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => startQuiz('random')}
                                    disabled={questions.length === 0}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl group-hover/btn:bg-purple-500 group-hover/btn:text-white transition-colors">
                                            <Shuffle size={18} />
                                        </div>
                                        <span className="font-bold text-sm">Randomized</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-600 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </section>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center backdrop-blur-sm">
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-1">Items</p>
                                <p className="text-2xl font-black text-white">{questions.length}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center backdrop-blur-sm">
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-1">Open Qs</p>
                                <p className="text-2xl font-black text-amber-500">
                                    {questions.filter(q => q.type === 'open').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

            {isAdding && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsAdding(false)}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-[#0a0a0c] border border-white/10 p-8 rounded-[2rem] max-w-lg w-full shadow-[0_30px_60px_rgba(0,0,0,0.5)] space-y-6 relative hardware-accel"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black tracking-tight">ADD QUESTION</h3>
                            <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">Question Prompt</label>
                                <textarea 
                                    autoFocus
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-blue-500 outline-none min-h-[120px] transition-all focus:bg-white/10 scrollbar-hide"
                                    placeholder="What would you like to ask?"
                                    value={newQuestion.question}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">Subject</label>
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. Mathematics, History..."
                                    value={newQuestion.subject}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                                    list="existing-subjects"
                                />
                                <datalist id="existing-subjects">
                                    {availableSubjects.filter(s => s !== 'All').map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setNewQuestion({ ...newQuestion, type: 'mcq', correctAnswers: [] })}
                                    className={clsx(
                                        "p-4 rounded-2xl border flex items-center justify-center gap-3 font-bold text-sm transition-all",
                                        newQuestion.type === 'mcq' ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-black/40 border-white/5 text-gray-500"
                                    )}
                                >
                                    <CheckSquare size={18} /> Multiple Choice
                                </button>
                                <button 
                                    onClick={() => setNewQuestion({ ...newQuestion, type: 'open', options: [], correctAnswers: [] })}
                                    className={clsx(
                                        "p-4 rounded-2xl border flex items-center justify-center gap-3 font-bold text-sm transition-all",
                                        newQuestion.type === 'open' ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-black/40 border-white/5 text-gray-500"
                                    )}
                                >
                                    <Type size={18} /> Open Response
                                </button>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {newQuestion.type === 'mcq' ? (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Setup Options</label>
                                        <div className="space-y-3">
                                            {(newQuestion.options || []).map((opt, i) => (
                                                <div key={i} className="flex gap-3 group/opt">
                                                    <button 
                                                        onClick={() => setNewQuestion({ ...newQuestion, correctAnswers: [opt] })}
                                                        className={clsx(
                                                            "w-12 h-12 rounded-xl border flex items-center justify-center transition-all",
                                                            newQuestion.correctAnswers?.includes(opt) && opt !== '' 
                                                                ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                                                                : "bg-white/5 border-white/10 text-transparent hover:border-emerald-500/50 hover:text-emerald-500/50"
                                                        )}
                                                    >
                                                        <Check size={20} />
                                                    </button>
                                                    <input 
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                                                        value={opt}
                                                        placeholder={`Option ${i+1}`}
                                                        onChange={(e) => {
                                                            const opts = [...(newQuestion.options || [])];
                                                            opts[i] = e.target.value;
                                                            // If we updated the correct answer, update the reference
                                                            const corrects = (newQuestion.options || [])[i] === (newQuestion.correctAnswers || [])[0] ? [e.target.value] : (newQuestion.correctAnswers || []);
                                                            setNewQuestion({ ...newQuestion, options: opts, correctAnswers: corrects });
                                                        }}
                                                    />
                                                    <button 
                                                        onClick={() => {
                                                            const opts = (newQuestion.options || []).filter((_, idx) => idx !== i);
                                                            setNewQuestion({ ...newQuestion, options: opts });
                                                        }}
                                                        className="p-3 text-gray-700 hover:text-rose-500 transition-colors opacity-0 group-hover/opt:opacity-100"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => setNewQuestion({ ...newQuestion, options: [...(newQuestion.options || []), ''] })}
                                                className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:border-blue-500/50 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={14} /> Add Option
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block">Valid Matches (Press Enter)</label>
                                        <input 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-blue-500 outline-none transition-colors"
                                            placeholder="Type an answer..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const val = e.currentTarget.value.trim();
                                                    if (val && !newQuestion.correctAnswers?.includes(val)) {
                                                        setNewQuestion({ ...newQuestion, correctAnswers: [...(newQuestion.correctAnswers || []), val] });
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {newQuestion.correctAnswers?.map((ans, i) => (
                                                <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold">
                                                    {ans}
                                                    <button onClick={() => setNewQuestion({ ...newQuestion, correctAnswers: newQuestion.correctAnswers?.filter((_, idx) => idx !== i) })}>
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-bold hover:bg-white/10 transition-all"
                                onClick={() => setIsAdding(false)}
                            >
                                CANCEL
                            </button>
                            <button 
                                className="flex-1 py-4 rounded-2xl bg-blue-600 shadow-[0_10px_30px_rgba(37,99,235,0.3)] text-white font-black tracking-widest disabled:opacity-30 disabled:shadow-none transition-all active:scale-95"
                                onClick={handleAddQuestion}
                                disabled={
                                    !newQuestion.question || 
                                    !newQuestion.subject || 
                                    newQuestion.correctAnswers?.length === 0 ||
                                    (newQuestion.type === 'mcq' && (newQuestion.options?.filter(opt => opt.trim()).length || 0) < 2)
                                }
                            >
                                SAVE
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {view === 'quiz' && activeQuestions.length > 0 && (
                <div className="max-w-2xl mx-auto space-y-12 py-16 px-4 hardware-accel">
                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Session Progress</h3>
                                <div className="text-xl font-black text-white">Q{currentIndex + 1} <span className="text-gray-600 font-medium">/ {activeQuestions.length}</span></div>
                            </div>
                            <div className="text-right space-y-1">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Success Rate</h3>
                                <div className="text-xl font-black text-blue-500">{Math.round((score / (currentIndex || 1)) * 100)}%</div>
                            </div>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
                                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                            />
                        </div>
                     </div>

                     <motion.div 
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-[3rem] p-10 md:p-14 backdrop-blur-2xl shadow-2xl relative overflow-hidden group"
                     >
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                            <BrainCircuit size={180} />
                        </div>

                        <div className="space-y-12 relative z-10">
                            <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-white/90">{activeQuestions[currentIndex].question}</h2>
                            
                            {activeQuestions[currentIndex].type === 'mcq' ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {(activeQuestions[currentIndex].options || []).map((opt, i) => (
                                        <button 
                                            key={i}
                                            disabled={!!feedback}
                                            onClick={() => handleAnswer(opt)}
                                            className={clsx(
                                                "w-full px-8 py-6 rounded-[1.5rem] border transition-all text-left flex items-center justify-between group/opt hardware-accel",
                                                feedback === 'correct' && opt === activeQuestions[currentIndex].correctAnswers[0] 
                                                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]" 
                                                    : feedback === 'wrong' && opt === activeQuestions[currentIndex].correctAnswers[0]
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500/40"
                                                        : feedback === 'wrong' && userAnswer === opt
                                                            ? "bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.1)]"
                                                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
                                            )}
                                        >
                                            <span className="text-lg font-bold">{opt}</span>
                                            <div className="shrink-0 ml-4">
                                                {feedback === 'correct' && opt === activeQuestions[currentIndex].correctAnswers[0] && <CheckCircle2 size={24} className="text-emerald-400" />}
                                                {feedback === 'wrong' && userAnswer === opt && <XCircle size={24} className="text-rose-400" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="relative">
                                        <input 
                                            autoFocus
                                            className={clsx(
                                                "w-full bg-white/5 border rounded-2xl p-6 text-2xl font-bold outline-none transition-all placeholder:text-white/10 shadow-inner",
                                                feedback === 'correct' ? "border-emerald-500 text-emerald-400 bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.1)]" :
                                                feedback === 'wrong' ? "border-rose-500 text-rose-400 bg-rose-500/5 shadow-[0_0_40px_rgba(244,63,94,0.1)]" :
                                                "border-white/10 focus:border-blue-500 focus:bg-white/10"
                                            )}
                                            value={userAnswer}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && userAnswer && handleAnswer(userAnswer)}
                                            placeholder="Specify answer..."
                                            disabled={!!feedback}
                                        />
                                        <div className="absolute top-1/2 right-4 -translate-y-1/2">
                                            {feedback === 'correct' && <CheckCircle2 size={28} className="text-emerald-400" />}
                                            {feedback === 'wrong' && <XCircle size={28} className="text-rose-400" />}
                                        </div>
                                    </div>
                                    {!feedback && (
                                        <button 
                                            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
                                            onClick={() => handleAnswer(userAnswer)}
                                            disabled={!userAnswer}
                                        >
                                            VERIFY DATA
                                        </button>
                                    )}
                                    <AnimatePresence>
                                        {feedback === 'wrong' && (
                                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                                <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500/60 mb-1">Correct Identity</p>
                                                <p className="text-xl font-black text-emerald-400">{activeQuestions[currentIndex].correctAnswers.join(', ')}</p>
                                             </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-10 mt-10 border-t border-white/5">
                            <button 
                                onClick={() => { setView('manage'); sound.playClick(); }}
                                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={16} /> ABORT DRILL
                            </button>
                            <button 
                                onClick={handleSkip}
                                disabled={!!feedback}
                                className="flex items-center gap-2 text-blue-500 hover:text-blue-300 font-black text-xs uppercase tracking-[0.2em] disabled:opacity-20 transition-all group/skip"
                            >
                                Skip & Queue <SkipForward size={16} className="group-hover/skip:translate-x-1 transition-transform" />
                            </button>
                        </div>
                     </motion.div>
                </div>
            )}

            {view === 'result' && (
                <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-12 relative">
                     <button 
                        onClick={() => setView('manage')}
                        className="absolute top-0 right-0 p-4 text-gray-500 hover:text-white transition-colors"
                     >
                        <X size={24} />
                     </button>
                     <div className="relative inline-block">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className="w-32 h-32 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-[2.5rem] rotate-12 flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(245,158,11,0.3)] relative z-10"
                        >
                            <Trophy size={56} className="text-black -rotate-12" />
                        </motion.div>
                        <div className="absolute inset-0 bg-amber-500/20 blur-[60px] rounded-full scale-150" />
                     </div>
                    
                    <div className="space-y-4">
                        <h2 className="text-5xl font-black tracking-tighter">DRILL COMPLETE</h2>
                        <p className="text-gray-500 font-medium tracking-wide">Syncing performance data to profile...</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-md">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Final Score</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-5xl font-black">{score}</span>
                                <span className="text-2xl text-gray-700 font-black">/ {questions.length}</span>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-md">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Efficiency Rating</p>
                            <span className={clsx("text-5xl font-black", getGrade((score/questions.length)*100).color)}>
                                {getGrade((score/questions.length)*100).label}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-4">
                        <button 
                            className="w-full py-6 rounded-[2rem] bg-blue-600 shadow-[0_15px_40px_rgba(37,99,235,0.4)] text-white font-black tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-500 active:scale-95 transition-all"
                            onClick={() => startQuiz(quizMode)}
                        >
                            <RefreshCw size={20} /> RESTART PROTOCOL
                        </button>
                        <button 
                            className="w-full py-6 rounded-[2rem] bg-white/5 border border-white/10 text-gray-400 font-black tracking-[0.2em] hover:bg-white/10 transition-all"
                            onClick={() => setView('manage')}
                        >
                            BACK TO MODULE
                        </button>
                    </div>

                    {skippedIds.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="text-gray-600 flex items-center justify-center gap-2 font-bold"
                        >
                            <Target size={14} className="text-rose-500" /> Protocol included {skippedIds.length} re-queued item(s).
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};

const ChevronRight = ({ size, className }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

const Check = ({ size }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5"/>
    </svg>
);
