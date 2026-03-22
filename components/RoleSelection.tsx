import React from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { BookOpen, Activity } from 'lucide-react';
import { sound } from '../utils/sound';

export const RoleSelection: React.FC = () => {
    const { updateState } = useApp();

    const handleSelect = (type: 'student' | 'athlete') => {
        sound.playClick();
        updateState({ userType: type });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 text-center mb-12"
            >
                <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">Choose Your Path</h1>
                <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">Select the operating system that best fits your lifestyle and goals.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl z-10">
                {/* Student Card */}
                <motion.button
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect('student')}
                    className="group relative flex flex-col items-center text-center p-10 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30 group-hover:scale-110 transition-transform">
                        <BookOpen size={40} className="text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">STUDENT</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">Focus on academics, assignments, exams, and personal growth. A clean, organized dashboard for the modern scholar.</p>
                </motion.button>

                {/* Student Athlete Card */}
                <motion.button
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect('athlete')}
                    className="group relative flex flex-col items-center text-center p-10 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#9d4edd]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-20 h-20 rounded-2xl bg-[#9d4edd]/20 flex items-center justify-center mb-6 border border-[#9d4edd]/30 group-hover:scale-110 transition-transform">
                        <Activity size={40} className="text-[#9d4edd]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">STUDENT ATHLETE</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">The ultimate OS for balancing intense physical training, sports, and college life. Track stats, workouts, and attendance.</p>
                </motion.button>
            </div>
        </div>
    );
};
