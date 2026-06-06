import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationManager } from './components/managers/NotificationManager';
import { NeutralLoadingScreen } from './components/ui/NeutralLoadingScreen';
import { StudentOnboarding } from './components/student/StudentOnboarding';
import { StudentDashboard } from './components/student/StudentDashboard';

const AppContent: React.FC = () => {
    const { state, updateState } = useApp();
    const [progress, setProgress] = useState(0);
    const [isInitialBoot, setIsInitialBoot] = useState(true);

    // Initial boot sequence with dynamic progress loader
    useEffect(() => {
        let currentProgress = 0;
        const interval = setInterval(() => {
            // Increments by small random chunks to feel organic and dynamic
            const increment = Math.max(2, Math.floor(Math.random() * 8) + 4);
            currentProgress = Math.min(100, currentProgress + increment);
            setProgress(currentProgress);

            if (currentProgress >= 100) {
                clearInterval(interval);
                // Hold 100% briefly for smooth fade-out transition
                setTimeout(() => {
                    setIsInitialBoot(false);
                }, 250);
            }
        }, 50);

        return () => clearInterval(interval);
    }, []);

    // Ensure userType is always student
    useEffect(() => {
        if (state.userType !== 'student') {
            updateState({ userType: 'student' });
        }
    }, [state.userType, updateState]);

    // Theme management
    useEffect(() => {
        const root = document.documentElement;
        const updateTheme = () => {
            const currentTheme = state.theme || 'system';
            let isDark = true;
            if (currentTheme === 'system') {
                isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            } else {
                isDark = currentTheme === 'dark';
            }

            if (isDark) {
                root.classList.add('dark');
                root.classList.remove('light');
                root.style.colorScheme = 'dark';
            } else {
                root.classList.add('light');
                root.classList.remove('dark');
                root.style.colorScheme = 'light';
            }
        };

        updateTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = () => {
            if ((state.theme || 'system') === 'system') {
                updateTheme();
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, [state.theme]);

    if (isInitialBoot) {
        return <NeutralLoadingScreen progress={progress} />;
    }

    if (!state.hasOnboarded) {
        return <StudentOnboarding />;
    }

    return <StudentDashboard />;
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