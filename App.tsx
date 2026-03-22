import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, ShieldAlert, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/ui/Layout';
import { Onboarding } from './components/Onboarding';
import { Football } from './components/modules/Football';
import { Gym } from './components/modules/Gym';
import { College } from './components/modules/College';
import { BioStatus } from './components/modules/BioStatus';
import { Life } from './components/modules/Life';
import { Settings } from './components/modules/Settings';
import { Evaluation } from './components/modules/Evaluation';
import { MiniQuiz } from './components/student/MiniQuiz';
import { NotificationManager } from './components/managers/NotificationManager';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { NeutralLoadingScreen } from './components/ui/NeutralLoadingScreen';
import { WelcomeScreen } from './components/ui/WelcomeScreen';
import { RoleSelection } from './components/RoleSelection';
import { StudentOnboarding } from './components/student/StudentOnboarding';
import { StudentDashboard } from './components/student/StudentDashboard';

const AppContent: React.FC = () => {
    const { state, updateState } = useApp();
    const [isInitialBoot, setIsInitialBoot] = useState(true);
    const [isModuleBooting, setIsModuleBooting] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    const wasOnboardedOnMount = useRef(state.hasOnboarded);
    const [isLocked, setIsLocked] = useState(true);
    const [passcode, setPasscode] = useState('');
    const [showPasscodeModal, setShowPasscodeModal] = useState(false);
    const [error, setError] = useState(false);

    // Initial boot sequence (3s fixed)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitialBoot(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // Re-lock when role changes away from athlete
    useEffect(() => {
        if (state.userType !== 'athlete') {
            setIsLocked(true);
            setPasscode('');
            setShowPasscodeModal(false);
            setIsModuleBooting(false);
        }
    }, [state.userType]);

    // Redirect if current module is disabled
    useEffect(() => {
        const current = state.currentModule;
        if (
            (current === 'football' && !state.enabledModules.football) ||
            (current === 'gym' && !state.enabledModules.gym) ||
            (current === 'college' && !state.enabledModules.college)
        ) {
            updateState({ currentModule: 'life' });
        }
    }, [state.currentModule, state.enabledModules, updateState]);

    const handlePasscodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passcode === '2628') {
            setIsLocked(false);
            setShowPasscodeModal(false);
            setError(false);
            
            // Trigger stylized module boot after unlock
            setIsModuleBooting(true);
            setTimeout(() => {
                setIsModuleBooting(false);
                if (state.hasOnboarded && state.userType === 'athlete') {
                    setShowWelcome(true);
                    if (!wasOnboardedOnMount.current) {
                        setIsFirstLogin(true);
                        wasOnboardedOnMount.current = true;
                    }
                }
            }, 3000);
        } else {
            setError(true);
            setPasscode('');
            setTimeout(() => setError(false), 2000);
        }
    };

    if (isInitialBoot) {
        return <NeutralLoadingScreen />;
    }

    if (state.userType === null || state.userType === undefined) {
        return <RoleSelection />;
    }

    if (state.userType === 'student') {
        if (!state.hasOnboarded) {
            return <StudentOnboarding />;
        }
        return <StudentDashboard />;
    }

    if (isLocked) {
        return (
            <div className="fixed inset-0 z-[999] bg-[#050505] flex items-center justify-center p-6 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
                
                {/* Top Right Lock Icon */}
                <div className="absolute top-6 right-6">
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowPasscodeModal(true)}
                        className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-accent transition-colors"
                    >
                        <Lock size={20} />
                    </motion.button>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full text-center space-y-8 relative z-10"
                >
                    <div className="inline-flex p-5 rounded-[2.5rem] bg-accent/10 border border-accent/20 text-accent mb-4">
                        <ShieldAlert size={48} strokeWidth={1.5} />
                    </div>
                    
                    <div className="space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tighter text-white">
                            CORE MODULES <br/>
                            <span className="text-accent uppercase">Frozen</span>
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-sm mx-auto">
                            This UI is currently frozen due to development process. Loading screen will be updated shortly.
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4 pt-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                            <Zap size={14} className="text-accent" />
                            Neuralis OS v2.0
                        </div>
                        <button 
                            onClick={() => updateState({ userType: 'student' })}
                            className="text-xs font-bold text-accent/60 hover:text-accent uppercase tracking-widest transition-colors py-2 px-4 border border-accent/20 rounded-full hover:bg-accent/5"
                        >
                            Switch to Student Mode
                        </button>
                    </div>
                </motion.div>

                {/* Passcode Modal */}
                <AnimatePresence>
                    {showPasscodeModal && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="glass-panel p-8 rounded-[2rem] border border-white/10 max-w-sm w-full text-center"
                            >
                                <h3 className="text-2xl font-display font-bold mb-2 text-white">Developer Access</h3>
                                <p className="text-gray-400 text-sm mb-8">Enter the 4-digit system override code.</p>
                                
                                <form onSubmit={handlePasscodeSubmit} className="space-y-6">
                                    <div className="relative">
                                        <input 
                                            autoFocus
                                            type="password"
                                            maxLength={4}
                                            value={passcode}
                                            onChange={(e) => setPasscode(e.target.value)}
                                            placeholder="••••"
                                            className={`text-4xl tracking-[1em] text-center w-full bg-white/5 border ${error ? 'border-danger animate-shake' : 'border-white/10'} rounded-2xl py-4 font-mono text-white outline-none focus:border-accent transition-all`}
                                        />
                                        {error && <p className="text-danger text-xs font-bold mt-2 uppercase tracking-widest animate-fade-in">Incorrect Passcode</p>}
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => { setShowPasscodeModal(false); setError(false); setPasscode(''); }}
                                            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-gray-400 hover:bg-white/10 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            className="flex-1 py-4 bg-accent text-white rounded-2xl font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            Unlock
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Athlete flow
    if (!state.hasOnboarded) {
        return <Onboarding />;
    }

    if (isModuleBooting) {
        return <LoadingScreen />;
    }

    if (showWelcome) {
        return <WelcomeScreen 
            onComplete={() => setShowWelcome(false)} 
            isFirstTime={isFirstLogin} 
        />;
    }

    const renderModule = () => {
        switch (state.currentModule) {
            case 'football': return <Football />;
            case 'gym': return <Gym />;
            case 'college': return <College />;
            case 'bio': return <BioStatus />;
            case 'life': return <Life />;
            case 'settings': return <Settings />;
            case 'evaluation': return <Evaluation />;
            case 'quiz': return <MiniQuiz />;
            default: return <Life />;
        }
    };

    return (
        <Layout>
            {renderModule()}
        </Layout>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <NotificationManager />
            <AppContent />
        </AppProvider>
    );
};

export default App;