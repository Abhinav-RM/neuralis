import React from 'react';
import { motion } from 'framer-motion';

export const NeutralLoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-50">
            <div className="relative flex items-center justify-center">
                {/* Inner pulsing core */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-12 h-12 rounded-full bg-white/10"
                />
                {/* Outer spinning ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute w-16 h-16 rounded-full border-t-2 border-white/30 border-r-2 border-transparent border-b-2 border-transparent border-l-2 border-transparent"
                />
            </div>
            
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-gray-500 font-mono text-[10px] tracking-[0.3em] uppercase"
            >
                System Initializing
            </motion.div>
        </div>
    );
};
