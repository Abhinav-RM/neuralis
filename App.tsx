import React, { useState, useEffect, useRef } from 'react';
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
    const [isLoading, setIsLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    const wasOnboardedOnMount = useRef(state.hasOnboarded);

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

    useEffect(() => {
        // Initial load sequence
        const timer = setTimeout(() => {
            setIsLoading(false);
            if (state.hasOnboarded && state.userType === 'athlete') {
                setShowWelcome(true);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, []); // Only on mount

    // Handle transition from onboarding to welcome screen
    useEffect(() => {
        if (state.hasOnboarded && state.userType === 'athlete' && !isLoading && !showWelcome && !wasOnboardedOnMount.current) {
            setShowWelcome(true);
            setIsFirstLogin(true);
            wasOnboardedOnMount.current = true;
        }
    }, [state.hasOnboarded, state.userType, isLoading, showWelcome]);

    if (isLoading) {
        if (state.userType === 'athlete') {
            return <LoadingScreen />;
        }
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

    // Athlete flow
    if (!state.hasOnboarded) {
        return <Onboarding />;
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