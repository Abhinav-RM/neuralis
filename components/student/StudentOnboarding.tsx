import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { sound } from '../../utils/sound';
import { BookOpen, Bell, Calendar, Mail, Cpu, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { NeuralisLogo } from '../ui/NeuralisLogo';

export const StudentOnboarding: React.FC = () => {
    const { updateState } = useApp();
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');

    const handleComplete = () => {
        if (!name.trim()) return;
        sound.playSuccess();
        updateState({
            userName: name.trim(),
            hasOnboarded: true
        });
    };

    const nextStep = () => {
        sound.playClick();
        setStep(prev => prev + 1);
    };

    const prevStep = () => {
        sound.playClick();
        setStep(prev => prev - 1);
    };

    const slides = [
        {
            title: "Welcome to Neuralis",
            subtitle: "Your intelligent local academic companion.",
            icon: <NeuralisLogo size={36} />,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Neuralis is a zero-latency, private-first workspace built to manage your schedules and track academic activities natively.
                    </p>
                    <div className="grid grid-cols-1 gap-3 pt-2">
                        <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                <Bell size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">Set Notifications</h4>
                                <p className="text-[11px] text-gray-400 mt-0.5">Customize daily schedules and system sound alerts entirely from the settings panel.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">Track Attendance</h4>
                                <p className="text-[11px] text-gray-400 mt-0.5">Keep log records of lecture check-ins and attendance metrics automatically.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Support & Custom Build Updates",
            subtitle: "Connected directly to your device workflow.",
            icon: <Cpu className="text-purple-400" size={32} />,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Get customized app optimizations and reach out for assistance at any time.
                    </p>
                    <div className="grid grid-cols-1 gap-3 pt-2">
                        <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                                <Mail size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">Developer Feedback</h4>
                                <p className="text-[11px] text-gray-400 mt-0.5">Report bugs or submit suggestions directly via Gmail links.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                                <Cpu size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">Targeted Hot-Updates</h4>
                                <p className="text-[11px] text-gray-400 mt-0.5">Request custom hot-update patches packaged specifically for your device model.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Initialize Sandbox",
            subtitle: "Let's set up your academic profile.",
            icon: <BookOpen className="text-blue-400" size={32} />,
            content: (
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">What is your name?</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                sound.playTerminalType();
                            }}
                            placeholder="Enter your name..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-lg focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                            autoFocus
                        />
                    </div>
                </div>
            )
        }
    ];

    const currentSlide = slides[step];

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="z-10 max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl flex flex-col justify-between min-h-[500px]"
            >
                <div>
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30 mx-auto">
                        {currentSlide.icon}
                    </div>
                    
                    <h1 className="text-2xl font-display font-bold text-center mb-1 text-white">
                        {currentSlide.title}
                    </h1>
                    <p className="text-gray-400 text-center text-xs mb-6">
                        {currentSlide.subtitle}
                    </p>

                    <div className="min-h-[200px]">
                        {currentSlide.content}
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                    {/* Progress dots */}
                    <div className="flex justify-center gap-1.5 mb-2">
                        {slides.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/20'}`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        {step > 0 && (
                            <Button 
                                className="flex-1 py-3 bg-white/5 text-white hover:bg-white/10 border border-white/5 flex items-center justify-center gap-1 text-sm"
                                onClick={prevStep}
                            >
                                <ChevronLeft size={16} /> Back
                            </Button>
                        )}
                        {step < slides.length - 1 ? (
                            <Button 
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white border-none flex items-center justify-center gap-1 text-sm" 
                                onClick={nextStep}
                            >
                                Next <ChevronRight size={16} />
                            </Button>
                        ) : (
                            <Button 
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white border-none flex items-center justify-center gap-1 text-sm" 
                                onClick={handleComplete}
                                disabled={!name.trim()}
                            >
                                Start <ArrowRight size={16} />
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
