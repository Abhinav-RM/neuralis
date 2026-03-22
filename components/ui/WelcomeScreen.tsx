import React, { useEffect, useState } from 'react';
import { RobotHead } from './RobotHead';
import { sound } from '../../utils/sound';
import { useApp } from '../../context/AppContext';
import clsx from 'clsx';

interface WelcomeScreenProps {
    onComplete: () => void;
    isFirstTime?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete, isFirstTime }) => {
    const { state } = useApp();
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        sound.playRobotStartup();
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onComplete, 800);
        }, 2500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className={clsx(
            "fixed inset-0 bg-black z-[110] flex flex-col items-center justify-center p-8 text-center transition-all duration-700 ease-in-out font-body",
            isExiting ? "scale-150 opacity-0 blur-xl pointer-events-none" : "animate-fade-in"
        )}>
            <div className="max-w-md w-full space-y-8">
                <RobotHead className="mb-8" />
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-accent to-white uppercase tracking-tighter">
                        {isFirstTime ? 'System Initialized' : 'System Online'}
                    </h1>
                    <p className="text-xl font-heading text-accent animate-pulse">
                        {isFirstTime ? `Welcome, ${state.userName}` : `Welcome back, ${state.userName || 'Athlete'}`}
                    </p>
                </div>
                <div className="pt-8">
                    <div className="h-0.5 w-24 bg-accent/30 mx-auto rounded-full overflow-hidden">
                        <div className="h-full bg-accent animate-[loading_2.5s_ease-in-out]" />
                    </div>
                </div>
            </div>
        </div>
    );
};
