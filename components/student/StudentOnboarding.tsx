import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { sound } from '../../utils/sound';
import { BookOpen } from 'lucide-react';

export const StudentOnboarding: React.FC = () => {
    const { updateState } = useApp();
    const [name, setName] = useState('');

    const handleComplete = () => {
        if (!name.trim()) return;
        sound.playSuccess();
        updateState({
            userName: name.trim(),
            hasOnboarded: true
        });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="z-10 max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl"
            >
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30 mx-auto">
                    <BookOpen size={32} className="text-blue-400" />
                </div>
                <h1 className="text-3xl font-display font-bold text-center mb-2">Welcome Scholar</h1>
                <p className="text-gray-400 text-center text-sm mb-8">Let's set up your academic workspace.</p>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">What is your name?</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-lg focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                            autoFocus
                        />
                    </div>

                    <Button 
                        className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-500 text-white border-none" 
                        onClick={handleComplete}
                        disabled={!name.trim()}
                    >
                        Initialize Workspace
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};
