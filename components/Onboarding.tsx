import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/Button';
import { sound } from '../utils/sound';
import { RobotHead } from './ui/RobotHead';
import clsx from 'clsx';

export const Onboarding: React.FC = () => {
    const { updateState } = useApp();
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [isExiting, setIsExiting] = useState(false);
    const [focusField, setFocusField] = useState<'none' | 'name' | 'dob'>('name');

    useEffect(() => {
        const t = setTimeout(() => sound.playRobotStartup(), 500);
        return () => clearTimeout(t);
    }, []);

    const handleStart = () => {
        if (!name || !dob) {
            sound.playError();
            return;
        }
        sound.playRobotConfirm();
        sound.playSuccess();
        setIsExiting(true);
        setTimeout(() => {
            updateState({ 
                hasOnboarded: true, 
                userName: name,
                dob: dob,
                startDate: new Date().toISOString()
            });
        }, 800);
    };

    const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        sound.playRobotTyping();
        if (val.length % 3 === 0) sound.playRobotBlip();
    };

    const isTyping = focusField === 'name' && name.length > 0;

    return (
        <div className={clsx(
            "fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 text-center transition-all duration-700 ease-in-out font-body",
            isExiting ? "scale-150 opacity-0 blur-xl pointer-events-none" : "animate-fade-in"
        )}>
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h1 className={clsx(
                        "text-4xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-accent to-white mb-2 transition-all duration-1000",
                        isExiting && "text-white drop-shadow-[0_0_50px_var(--accent-color)]"
                    )}>
                        NEURALIS
                    </h1>
                    <p className="text-gray-400 tracking-widest text-sm uppercase">Operating System 2.0</p>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 relative overflow-visible">
                    <RobotHead 
                        isTyping={isTyping} 
                        nameLength={name.length} 
                        focusField={focusField} 
                        className="mb-4"
                    />
                    <p className="text-xl font-medium font-heading h-8 text-accent animate-pulse">{name ? `Hello, ${name}` : 'Awaiting User Input...'}</p>
                    <input type="text" placeholder="Enter your name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-xl focus:border-accent outline-none transition-colors text-white placeholder-gray-600 font-bold" value={name} onChange={handleNameInput} onFocus={() => { setFocusField('name'); sound.playRobotThinking(); }} onBlur={() => setFocusField('none')} autoFocus />
                    <div className="relative">
                        <label className="text-xs text-gray-500 uppercase font-bold absolute -top-2 left-3 bg-[#0d0d12] px-1 z-10">Date of Birth</label>
                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-xl focus:border-accent outline-none transition-colors text-white font-mono" value={dob} onChange={(e) => setDob(e.target.value)} onFocus={() => setFocusField('dob')} onBlur={() => setFocusField('none')} />
                    </div>
                    <Button size="lg" className="w-full mt-6" onClick={handleStart}>Initialize System</Button>
                </div>
            </div>
        </div>
    );
};