import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Brain, Menu, Dumbbell, Trophy, GraduationCap, LayoutDashboard, Settings, Activity, Wifi, Battery, Clock as ClockIcon, ScanLine, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';
import { ModuleType } from '../../types';
import { sound } from '../../utils/sound';
import { ParticleCanvas } from './ParticleCanvas';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { state, updateState } = useApp();
    const { accentColor, gradientStart, gradientMiddle, gradientEnd, backgroundImage, blur, bgZoom, bgX, bgY, fontStyle } = state.football.customization;
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Good morning';
        if (hour >= 12 && hour < 17) return 'Good afternoon';
        return 'Good evening';
    };
    
    // Level Up State
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [levelUpDetails, setLevelUpDetails] = useState({ module: '', level: 0 });
    const prevFootballLevel = useRef(state.football.level);
    const prevGymLevel = useRef(state.gym.level);

    // Apply theme vars
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--accent-color', accentColor);
        root.style.setProperty('--accent-light', accentColor); 
        root.style.setProperty('--accent-dark', accentColor);
        root.style.setProperty('--bg-blur', `${blur}px`);

        // Apply Font Styles
        if (fontStyle === 'cyber') {
            root.style.setProperty('--font-display', '"Share Tech Mono", monospace');
            root.style.setProperty('--font-heading', '"Orbitron", sans-serif');
            root.style.setProperty('--font-body', '"Rajdhani", sans-serif');
        } else if (fontStyle === 'clean') {
            root.style.setProperty('--font-display', '"Space Grotesk", sans-serif');
            root.style.setProperty('--font-heading', '"Space Grotesk", sans-serif');
            root.style.setProperty('--font-body', '"Archivo", sans-serif');
        } else {
            // Modern (Default)
            root.style.setProperty('--font-display', '"Orbitron", sans-serif');
            root.style.setProperty('--font-heading', '"Rajdhani", sans-serif');
            root.style.setProperty('--font-body', '"Archivo", sans-serif');
        }

    }, [accentColor, blur, fontStyle]);

    // Level Up Watcher
    useEffect(() => {
        if (state.football.level > prevFootballLevel.current) {
            triggerLevelUp('Football', state.football.level);
            prevFootballLevel.current = state.football.level;
        }
        if (state.gym.level > prevGymLevel.current) {
            triggerLevelUp('Gym', state.gym.level);
            prevGymLevel.current = state.gym.level;
        }
    }, [state.football.level, state.gym.level]);

    const triggerLevelUp = (module: string, level: number) => {
        setLevelUpDetails({ module, level });
        setShowLevelUp(true);
        sound.playLevelUp();
        setTimeout(() => setShowLevelUp(false), 4000);
    };

    const bgStyle: React.CSSProperties = {
        backgroundImage: backgroundImage 
            ? `url(${backgroundImage})`
            : `linear-gradient(135deg, ${gradientStart} 0%, ${gradientMiddle} 50%, ${gradientEnd} 100%)`,
        backgroundSize: backgroundImage ? `${bgZoom}%` : 'cover',
        backgroundPosition: backgroundImage ? `${bgX}% ${bgY}%` : 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
    };

    const NavItem = ({ module, icon: Icon, label }: { module: ModuleType, icon: any, label: string }) => (
        <button
            onClick={() => {
                updateState({ currentModule: module });
                setSidebarOpen(false);
                sound.playClick();
            }}
            className={clsx(
                "flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200 group",
                state.currentModule === module 
                    ? "bg-accent/20 text-accent border-l-4 border-accent" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
        >
            <Icon size={20} className={clsx("transition-transform group-hover:scale-110", state.currentModule === module && "animate-pulse")} />
            <span className="font-heading font-medium tracking-wide">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen text-white relative overflow-hidden font-body" style={bgStyle}>
            {/* Visual Overlays */}
            <div className="absolute inset-0 bg-black/40 -z-10" />
            <div className="fixed inset-0 pointer-events-none z-[10] opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />
            <div className="fixed inset-0 pointer-events-none z-[10] opacity-40 bg-[radial-gradient(circle_at_center,_transparent_60%,_black_100%)]" />

            {/* Level Up Overlay */}
            {showLevelUp && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 animate-fade-in pointer-events-none">
                    <ParticleCanvas active={true} color="var(--accent-color)" count={100} />
                    <div className="relative z-10 text-center animate-[scaleIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]">
                        <Trophy size={80} className="text-gold mx-auto mb-4 animate-bounce" />
                        <h1 className="text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-2">
                            LEVEL UP!
                        </h1>
                        <p className="text-2xl font-bold text-accent tracking-widest uppercase">{levelUpDetails.module} • Level {levelUpDetails.level}</p>
                    </div>
                </div>
            )}

            {/* Mobile Header */}
            <div className="lg:hidden sticky top-0 z-40 bg-[#0a0a0c] border-b border-white/10" style={{ paddingTop: 'var(--safe-top)' }}>
                <div className="flex items-center justify-between p-4">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-400 hover:text-white"><Menu /></button>
                    <div className="text-center">
                        <h1 className="font-sans font-bold text-xl tracking-tight text-white">
                            {getGreeting()}, {state.userName}
                        </h1>
                    </div>
                    <div className="w-10" /> {/* Balanced Spacer */}
                </div>
            </div>

            {/* Sidebar */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-black/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-out lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )} style={{ paddingLeft: 'var(--safe-left)', paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="font-sans font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-accent to-white">
                            {getGreeting()}
                        </h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                            OS v2.1 • {state.userName || 'User'}
                        </p>
                    </div>
                    <button className="lg:hidden text-2xl" onClick={() => setSidebarOpen(false)}>×</button>
                </div>
                <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
                    {state.enabledModules.football && <NavItem module="football" icon={Trophy} label="Football" />}
                    {state.enabledModules.gym && <NavItem module="gym" icon={Dumbbell} label="Gym" />}
                    {state.enabledModules.college && <NavItem module="college" icon={GraduationCap} label="College" />}
                    <NavItem module="bio" icon={ScanLine} label="Bio Status" />
                    <NavItem module="life" icon={LayoutDashboard} label="Life Dashboard" />
                    <NavItem module="evaluation" icon={Activity} label="Monthly Review" />
                    <NavItem module="quiz" icon={BrainCircuit} label="Mini Quiz" />
                    <div className="pt-8 pb-2">
                        <div className="h-px bg-white/10 mx-2" />
                    </div>
                    <NavItem module="settings" icon={Settings} label="Settings" />
                    
                    <div className="pt-4 mt-4 border-t border-white/10">
                        <button
                            onClick={() => {
                                updateState({ userType: 'student' });
                                sound.playClick();
                            }}
                            className="flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200 text-gray-400 hover:bg-white/5 hover:text-accent group"
                        >
                            <GraduationCap size={20} className="transition-transform group-hover:scale-110" />
                            <span className="font-heading font-medium tracking-wide">Student UI</span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen p-4 lg:p-8 hardware-accel relative z-0" style={{ paddingLeft: 'calc(var(--safe-left) + clamp(0.5rem, 3vw, 2rem))', paddingRight: 'calc(var(--safe-right) + clamp(0.5rem, 3vw, 2rem))', paddingBottom: 'calc(var(--safe-bottom) + 5rem)' }}>
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};