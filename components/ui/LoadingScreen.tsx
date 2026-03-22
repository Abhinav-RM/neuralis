import React, { useEffect, useState } from 'react';
import { ParticleCanvas } from './ParticleCanvas';
import { Cpu, Zap, ShieldCheck, Database, Trophy } from 'lucide-react';
import { RobotHead } from './RobotHead';
import clsx from 'clsx';

export const LoadingScreen: React.FC = () => {
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState('Initializing Kernel...');

    useEffect(() => {
        const stages = [
            { p: 15, text: 'Loading Neural Modules...' },
            { p: 30, text: 'Syncing Bio-Metrics...' },
            { p: 50, text: 'Optimizing 3D Assets...' },
            { p: 75, text: 'Calibrating Physics Engine...' },
            { p: 90, text: 'Establishing Secure Connection...' },
            { p: 100, text: 'System Ready.' }
        ];

        let currentStage = 0;
        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + Math.random() * 5;
                if (next > stages[currentStage].p && currentStage < stages.length - 1) {
                    currentStage++;
                    setStage(stages[currentStage].text);
                }
                return next >= 100 ? 100 : next;
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center overflow-hidden font-mono">
            <ParticleCanvas active={true} color="#9d4edd" count={80} />
            
            {/* Football Field Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 border-2 border-white/20 m-8" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/20 rounded-full" />
            </div>

            <div className="z-10 w-full max-w-md p-8 relative">
                {/* Robot Head with Animation */}
                <div className="flex justify-center mb-12 relative">
                    <div className="animate-bounce">
                        <RobotHead className="scale-110" isBooting={true} />
                    </div>
                    {/* Bouncing Football */}
                    <div className="absolute -right-4 bottom-0 animate-[bounce_1s_infinite]">
                        <div className="w-6 h-6 bg-white rounded-full border-2 border-black flex items-center justify-center overflow-hidden">
                             <div className="w-full h-px bg-black rotate-45" />
                             <div className="w-full h-px bg-black -rotate-45" />
                        </div>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] animate-pulse">
                        Loading screen will be updated shortly
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-2 flex justify-between text-xs text-accent font-bold uppercase tracking-widest">
                    <span>{stage}</span>
                    <span>{Math.floor(progress)}%</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-8">
                    <div 
                        className="h-full bg-accent shadow-[0_0_20px_var(--accent-color)] transition-all duration-200 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* System Checks */}
                <div className="grid grid-cols-2 gap-4">
                    <SystemCheck label="Tactical Engine" icon={Trophy} delay={0} />
                    <SystemCheck label="Neural Sync" icon={Cpu} delay={500} />
                    <SystemCheck label="Bio Encryption" icon={ShieldCheck} delay={1000} />
                    <SystemCheck label="Physics Core" icon={Zap} delay={1500} />
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 text-center text-[10px] text-gray-600 uppercase tracking-[0.3em]">
                NEURALIS v2.1 • {progress < 100 ? 'Booting...' : 'Ready'}
            </div>
        </div>
    );
};

const SystemCheck = ({ label, icon: Icon, delay }: { label: string, icon: any, delay: number }) => {
    const [status, setStatus] = useState<'pending' | 'active' | 'done'>('pending');

    useEffect(() => {
        setTimeout(() => setStatus('active'), delay);
        setTimeout(() => setStatus('done'), delay + 800);
    }, [delay]);

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
            <div className={clsx(
                "p-1.5 rounded transition-colors duration-500",
                status === 'done' ? "bg-success/20 text-success" : 
                status === 'active' ? "bg-accent/20 text-accent animate-pulse" : "bg-white/5 text-gray-600"
            )}>
                <Icon size={14} />
            </div>
            <div className="flex flex-col">
                <span className={clsx("text-xs font-bold transition-colors", status === 'pending' ? "text-gray-600" : "text-gray-300")}>{label}</span>
                <span className="text-[10px] text-gray-500 uppercase">
                    {status === 'pending' ? 'Waiting...' : status === 'active' ? 'Checking...' : 'OK'}
                </span>
            </div>
        </div>
    );
};
