import React from 'react';
import { motion } from 'framer-motion';

interface NeutralLoadingScreenProps {
    progress: number;
}

const getStatusMessage = (progress: number) => {
    if (progress < 25) return 'Initializing system core...';
    if (progress < 55) return 'Loading academic workspace...';
    if (progress < 80) return 'Syncing calendar & database...';
    if (progress < 100) return 'Finalizing dashboard widgets...';
    return 'System ready. Launching...';
};

export const NeutralLoadingScreen: React.FC<NeutralLoadingScreenProps> = ({ progress }) => {
    const statusMsg = getStatusMessage(progress);

    return (
        <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-50 overflow-hidden select-none">
            {/* Soft Ambient Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative flex flex-col items-center z-10">
                {/* Minimal Logo / Icon */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 relative"
                >
                    {/* Pulsing Outer Core */}
                    <motion.div
                        animate={{ 
                            scale: [1, 1.08, 1], 
                            opacity: [0.3, 0.6, 0.3],
                            borderColor: ['rgba(59, 130, 246, 0.2)', 'rgba(99, 102, 241, 0.4)', 'rgba(59, 130, 246, 0.2)']
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-16 h-16 rounded-2xl border flex items-center justify-center bg-white/[0.02] backdrop-blur-md"
                    >
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 opacity-80" />
                    </motion.div>
                </motion.div>

                {/* Progress Percentage */}
                <div className="mb-4">
                    <span className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white tracking-tighter">
                        {String(Math.round(progress)).padStart(2, '0')}%
                    </span>
                </div>

                {/* Sleek Progress Bar */}
                <div className="w-64 h-[3px] bg-white/[0.04] rounded-full overflow-hidden relative border border-white/5">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "easeOut", duration: 0.1 }}
                    />
                </div>

                {/* Dynamic Status Messaging */}
                <div className="mt-6 text-center h-8 flex items-center justify-center">
                    <motion.p
                        key={statusMsg}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-gray-400 font-mono text-[10px] tracking-[0.2em] uppercase"
                    >
                        {statusMsg}
                    </motion.p>
                </div>
            </div>
        </div>
    );
};
