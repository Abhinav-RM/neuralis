import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import clsx from 'clsx';
import { NeuralisLogo } from './NeuralisLogo';

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
    const { state } = useApp();
    const statusMsg = getStatusMessage(progress);

    const currentTheme = state?.theme || 'system';
    const isLight = currentTheme === 'system'
        ? !window.matchMedia('(prefers-color-scheme: dark)').matches
        : currentTheme === 'light';

    return (
        <div className={clsx(
            "fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden select-none transition-colors duration-300",
            isLight ? "bg-[#f8fafc]" : "bg-[#050505]"
        )}>
            {/* Soft Ambient Glows */}
            <div className={clsx(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none transition-colors duration-300",
                isLight ? "bg-blue-500/5" : "bg-blue-600/10"
            )} />
            <div className={clsx(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full blur-[80px] pointer-events-none transition-colors duration-300",
                isLight ? "bg-indigo-500/5" : "bg-indigo-600/5"
            )} />

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
                            scale: [1, 1.05, 1], 
                            opacity: [0.9, 1, 0.9],
                            borderColor: isLight 
                                ? 'transparent'
                                : ['rgba(59, 130, 246, 0.3)', 'rgba(99, 102, 241, 0.6)', 'rgba(59, 130, 246, 0.3)']
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className={clsx(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                            isLight 
                                ? "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                                : "bg-[#131316] border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                        )}
                    >
                        <NeuralisLogo size={36} className={clsx(
                            "w-9 h-9 transition-colors duration-300",
                            isLight ? "text-blue-600" : "text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                        )} />
                    </motion.div>
                </motion.div>

                {/* Progress Percentage */}
                <div className="mb-4">
                    <span className={clsx(
                        "text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r tracking-tighter transition-all duration-300",
                        isLight ? "from-blue-600 to-slate-800" : "from-blue-400 to-white"
                    )}>
                        {String(Math.round(progress)).padStart(2, '0')}%
                    </span>
                </div>

                {/* Sleek Progress Bar */}
                <div className={clsx(
                    "w-64 h-[3px] rounded-full overflow-hidden relative transition-colors duration-300",
                    isLight ? "bg-slate-200" : "bg-[#131316] border border-white/5"
                )}>
                    <motion.div
                        className={clsx(
                            "h-full bg-gradient-to-r from-blue-500 to-indigo-400",
                            !isLight && "shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                        )}
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
                        className={clsx(
                            "font-mono text-[10px] tracking-[0.2em] uppercase transition-colors duration-300",
                            isLight ? "text-slate-500" : "text-gray-400"
                        )}
                    >
                        {statusMsg}
                    </motion.p>
                </div>
            </div>
        </div>
    );
};
