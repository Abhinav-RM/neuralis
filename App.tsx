import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationManager } from './components/managers/NotificationManager';
import { StudentOnboarding } from './components/student/StudentOnboarding';
import { StudentDashboard } from './components/student/StudentDashboard';
import { sound } from './utils/sound';

const AppContent: React.FC = () => {
    const { state, updateState, updateCustomization } = useApp();

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


    const showPermissionModal = state.customization.storagePermission === 'prompt';

    const requestSystemPermission = async () => {
        const isNative = (window as any).Capacitor?.isNativePlatform();
        if (isNative) {
            try {
                const permission = await (window as any).Capacitor.Plugins.LocalNotifications.requestPermissions();
                return permission.display === 'granted';
            } catch (e) {
                console.error(e);
            }
        } else if (typeof (window as any).cordova !== 'undefined' && (window as any).cordova.plugins?.notification?.local) {
            return new Promise<boolean>((resolve) => {
                (window as any).cordova.plugins.notification.local.requestPermission((granted: boolean) => {
                    resolve(granted);
                });
            });
        } else if (typeof Notification !== 'undefined') {
            try {
                if (Notification.permission === 'granted') {
                    return true;
                }
                const result = await Notification.requestPermission();
                return result === 'granted';
            } catch (e) {
                console.error(e);
            }
        }
        return false; 
    };

    const handleGrantPermission = async () => {
        const granted = await requestSystemPermission();
        updateCustomization({
            storagePermission: granted ? 'granted' : 'denied'
        });
        if (granted) {
            sound.playSuccess();
        } else {
            sound.playError();
        }
    };

    const handleDenyPermission = () => {
        updateCustomization({
            storagePermission: 'denied'
        });
        sound.playError();
    };

    return (
        <>
            {!state.hasOnboarded ? <StudentOnboarding /> : <StudentDashboard />}
            
            {showPermissionModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
                    <div className="max-w-sm w-full bg-[#121214] p-6 rounded-2xl border border-white/10 relative text-center shadow-2xl">
                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder-open"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Storage Permission</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            Neuralis requires permission to access device storage to upload custom background images and export/import academic data backup files.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                className="flex-1 bg-white/5 text-white hover:bg-white/10 py-2.5 rounded-xl text-sm font-semibold transition-all border border-white/5 active:scale-95" 
                                onClick={handleDenyPermission}
                            >
                                Deny
                            </button>
                            <button 
                                className="flex-1 bg-blue-500 text-white hover:bg-blue-600 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95" 
                                onClick={handleGrantPermission}
                            >
                                Grant
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
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