import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

interface RobotHeadProps {
    isTyping?: boolean;
    isBooting?: boolean;
    nameLength?: number;
    focusField?: 'none' | 'name' | 'dob';
    className?: string;
}

export const RobotHead: React.FC<RobotHeadProps> = ({ 
    isTyping = false, 
    isBooting = false,
    nameLength = 0, 
    focusField = 'none',
    className 
}) => {
    const [blink, setBlink] = useState(false);
    const [bootLook, setBootLook] = useState({ x: 0, y: 0 });
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const bootIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const triggerBlink = () => {
            setBlink(true);
            setTimeout(() => setBlink(false), 150);
            const nextBlink = Math.random() * 3000 + 2000; 
            timeoutRef.current = setTimeout(triggerBlink, nextBlink);
        };
        timeoutRef.current = setTimeout(triggerBlink, 3000);

        if (isBooting) {
            bootIntervalRef.current = setInterval(() => {
                setBootLook({
                    x: (Math.random() - 0.5) * 20,
                    y: (Math.random() - 0.5) * 20
                });
            }, 1000);
        }

        return () => { 
            if(timeoutRef.current) clearTimeout(timeoutRef.current); 
            if(bootIntervalRef.current) clearInterval(bootIntervalRef.current);
        };
    }, [isBooting]);

    const getHeadStyle = () => {
        let transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        if (isBooting) {
            return { transition: 'transform 0.8s ease-in-out', transform: `rotateX(${bootLook.y}deg) rotateY(${bootLook.x}deg)` };
        }

        if (focusField === 'dob') return { transition, transform: 'rotateX(20deg) translateY(5px)' }; 
        if (focusField === 'name') {
            if (nameLength === 0) return { transition: 'transform 0.3s ease-out', transform: 'rotateX(0deg) rotateY(0deg)' };
            transition = 'transform 0.15s cubic-bezier(0.2, 0, 0.4, 1)'; 
            const maxChars = 15;
            const progress = Math.min(nameLength / maxChars, 1);
            const rotationY = -15 + (progress * 30); 
            return { transition, transform: `rotateX(30deg) rotateY(${rotationY}deg)` };
        }
        return { transition, transform: 'rotateY(0deg) rotateX(-10deg)' };
    };

    const getEyeStyle = () => {
        const transition = 'transform 0.05s linear';
        
        if (isBooting) {
            return { transition: 'transform 0.4s ease-out', transform: `translate(${bootLook.x * 0.3}px, ${bootLook.y * 0.3}px)` };
        }

        if (focusField === 'name') {
            if (nameLength === 0) return { transition, transform: 'translate(0, 0)' };
            const maxChars = 15;
            const progress = Math.min(nameLength / maxChars, 1);
            const x = -6 + (progress * 12); 
            return { transition, transform: `translate(${x}px, 8px)` }; 
        }
        if (focusField === 'dob') return { transition, transform: 'translate(0, 10px)' };
        return { transition, transform: 'translate(0, 0)' };
    };

    return (
        <div className={clsx("flex flex-col items-center justify-center perspective-[1000px] pointer-events-none", className)}>
            <div 
                className="w-28 h-24 bg-[#1a1a1a] rounded-3xl border border-white/20 relative shadow-[0_0_30px_rgba(157,78,221,0.15)] flex items-center justify-center origin-bottom"
                style={{ ...getHeadStyle(), transformStyle: 'preserve-3d' }}
            >
                <div className="absolute inset-2 bg-black/90 rounded-2xl border border-white/5 overflow-hidden flex flex-col items-center justify-center gap-3 shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
                    <div className="flex gap-4 items-center">
                        {/* Left Eye */}
                        <div className={clsx("w-3 h-5 rounded-full transition-all duration-150 relative overflow-hidden bg-gray-900", blink ? "scale-y-0" : "scale-y-100")}>
                            <div className={clsx("w-full h-full rounded-full absolute inset-0 transition-colors duration-200", isTyping ? "bg-cyan-400 shadow-[0_0_10px_cyan]" : "bg-accent shadow-[0_0_10px_var(--accent-color)]")} 
                                 style={getEyeStyle()}></div>
                        </div>
                        {/* Right Eye */}
                        <div className={clsx("w-3 h-5 rounded-full transition-all duration-150 relative overflow-hidden bg-gray-900", blink ? "scale-y-0" : "scale-y-100")}>
                            <div className={clsx("w-full h-full rounded-full absolute inset-0 transition-colors duration-200", isTyping ? "bg-cyan-400 shadow-[0_0_10px_cyan]" : "bg-accent shadow-[0_0_10px_var(--accent-color)]")} 
                                 style={getEyeStyle()}></div>
                        </div>
                    </div>
                    <div className="h-1 bg-white/50 rounded-full transition-all duration-100 ease-out" style={{ width: Math.max(10, Math.min(10 + nameLength * 2, 50)) + 'px' }}></div>
                </div>
                <div className="absolute -left-2 top-8 w-2 h-6 bg-gray-700 rounded-l-md border-l border-white/10"></div>
                <div className="absolute -right-2 top-8 w-2 h-6 bg-gray-700 rounded-r-md border-r border-white/10"></div>
            </div>
            <div className="w-8 h-4 bg-gray-800 border-x border-white/10 -mt-1 z-0 relative">
                 <div className="absolute inset-y-0 left-2 w-1 bg-black/30"></div>
                 <div className="absolute inset-y-0 right-2 w-1 bg-black/30"></div>
            </div>
            <div className="w-32 h-16 bg-[#151515] rounded-t-3xl border-t border-x border-white/10 relative overflow-hidden flex justify-center pt-4 shadow-lg">
                <div className={clsx("w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-500", isTyping ? "bg-cyan-500/10 border-cyan-500/30" : "bg-accent/10 border-accent/30")}>
                    <div className={clsx("w-3 h-3 rounded-full transition-colors duration-500", isTyping ? "bg-cyan-400 shadow-[0_0_15px_cyan]" : "bg-accent shadow-[0_0_15px_var(--accent-color)]", "animate-pulse")}></div>
                </div>
            </div>
        </div>
    );
};
