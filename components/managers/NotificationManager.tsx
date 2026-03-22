import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { sound } from '../../utils/sound';

export const NotificationManager: React.FC = () => {
    const { state, setPendingAction, updateState } = useApp();
    const { football, gym, college } = state;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastScheduleRef = useRef<number>(0);

    useEffect(() => {
        const isNative = typeof (window as any).cordova !== 'undefined' || (window as any).Capacitor?.isNativePlatform();
        
        if (isNative) {
            const handleNotificationClick = (notification: any) => {
                const data = notification.data || notification.notification?.data;
                if (data && data.module) {
                    setPendingAction({
                        module: data.module,
                        type: data.type || 'check-in'
                    });
                    updateState({ currentModule: data.module });
                }
            };

            // 1. Cordova Support
            const cordova = (window as any).cordova;
            if (cordova?.plugins?.notification?.local) {
                cordova.plugins.notification.local.on('click', handleNotificationClick);
            }

            // 2. Capacitor Support
            const Capacitor = (window as any).Capacitor;
            if (Capacitor?.Plugins?.LocalNotifications) {
                Capacitor.Plugins.LocalNotifications.addListener('localNotificationActionPerformed', (action: any) => {
                    handleNotificationClick(action);
                });
            }

            return () => {
                if (cordova?.plugins?.notification?.local) {
                    cordova.plugins.notification.local.un('click', handleNotificationClick);
                }
                if (Capacitor?.Plugins?.LocalNotifications) {
                    Capacitor.Plugins.LocalNotifications.removeAllListeners();
                }
            };
        }
    }, [setPendingAction, updateState]);

    useEffect(() => {
        const requestPermissions = async () => {
            const Capacitor = (window as any).Capacitor;
            const isNative = Capacitor?.isNativePlatform();
            
            if (isNative && Capacitor?.Plugins?.LocalNotifications) {
                const permission = await Capacitor.Plugins.LocalNotifications.requestPermissions();
                console.log("Capacitor Notification Permission:", permission);
            } else if (typeof (window as any).cordova !== 'undefined') {
                const cordova = (window as any).cordova;
                if (cordova.plugins?.notification?.local) {
                    cordova.plugins.notification.local.requestPermission();
                }
            } else if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                try {
                    await Notification.requestPermission();
                } catch (e) {
                    console.error("Error requesting notification permission:", e);
                }
            }
        };
        requestPermissions();
    }, []);

    useEffect(() => {
        // Debounce scheduling to avoid rapid re-schedules on boot
        const nowTime = Date.now();
        const isFirstRun = lastScheduleRef.current === 0;
        
        if (!isFirstRun && nowTime - lastScheduleRef.current < 2000) return;
        lastScheduleRef.current = nowTime;

        const scheduleNotifications = async () => {
            const now = new Date();
            const Capacitor = (window as any).Capacitor;
            const isNative = Capacitor?.isNativePlatform();
            
            // Define all triggers with base IDs
            const triggers = [
                { baseId: 100, hour: football.reminderHour, minute: football.reminderMinute, msg: state.notificationMessages.football, module: 'football', type: 'check-in', skip: !state.enabledModules.football || !state.notificationToggles.football },
                { baseId: 200, hour: gym.reminderHour, minute: gym.reminderMinute, msg: state.notificationMessages.gym, module: 'gym', type: 'check-in', skip: !state.enabledModules.gym || !state.notificationToggles.gym },
                { baseId: 300, hour: college.booksReminderHour, minute: college.booksReminderMinute, msg: state.notificationMessages.books, module: 'college', type: 'reminder', skip: !state.enabledModules.college || !state.notificationToggles.books },
                { baseId: 400, hour: college.idReminderHour || 21, minute: college.idReminderMinute || 0, msg: state.notificationMessages.idcard, module: 'college', type: 'reminder', skip: !state.enabledModules.college || !state.notificationToggles.idcard },
                { baseId: 500, hour: college.homeworkReminderHour, minute: college.homeworkReminderMinute, msg: state.notificationMessages.homework, module: 'college', type: 'homework', skip: !state.enabledModules.college || !state.notificationToggles.homework },
                { baseId: 600, hour: state.morningReminderHour || 8, minute: state.morningReminderMinute || 0, msg: state.notificationMessages.morning, skip: !state.notificationToggles.morning },
                // Custom Notifications
                ...(college.customNotifications || [])
                    .filter(cn => cn.enabled)
                    .map((cn, i) => {
                        const [h, m] = cn.time.split(':').map(Number);
                        return { baseId: 1000 + (i * 100), hour: h, minute: m, msg: cn.message, skip: false };
                    })
            ].filter(t => !t.skip);

            const allEvents: any[] = [];
            triggers.forEach(t => {
                for (let i = 0; i < 14; i++) {
                    const target = new Date(now);
                    target.setDate(target.getDate() + i);
                    target.setHours(t.hour, t.minute, 0, 0);

                    // Skip if this specific time is already in the past (add 5s buffer to avoid instant fire)
                    if (target.getTime() <= now.getTime() + 5000) {
                        continue;
                    }

                    // Weekend logic for College
                    if ([300, 400, 500].includes(t.baseId)) {
                        if (target.getDay() === 0 || target.getDay() === 6) continue;
                    }

                    allEvents.push({
                        id: t.baseId + i,
                        time: target.getTime(),
                        targetDate: target,
                        msg: t.msg,
                        module: t.module,
                        type: t.type
                    });
                }
            });
            
            // Task Specific Reminders (Assignments & Exams)
            (college.assignments || []).forEach((a, i) => {
                if (!a.completed && a.reminders) {
                    a.reminders.forEach((rem, ri) => {
                        if (!rem.enabled) return;
                        
                        let target = new Date();
                        if (rem.type === 'date' && rem.at) {
                            target = new Date(rem.at + 'T' + rem.time + ':00');
                        } else if (rem.type === 'day-before') {
                            target = new Date(a.dueDate + 'T00:00:00');
                            target.setDate(target.getDate() - 1);
                            const [rh, rm] = rem.time.split(':').map(Number);
                            target.setHours(rh, rm, 0, 0);
                        } else {
                            // Fallback for unexpected types or missing 'at'
                            return;
                        }

                        if (target.getTime() > now.getTime() + 5000) {
                            allEvents.push({
                                id: 5000 + (i * 100) + ri,
                                time: target.getTime(),
                                targetDate: target,
                                msg: rem.message || `Assignment Reminder: ${a.title} 📝`,
                                module: 'college',
                                type: 'reminder'
                            });
                        }
                    });
                }
            });

            (college.exams || []).forEach((e, i) => {
                if (!e.completed && e.reminders) {
                    e.reminders.forEach((rem, ri) => {
                        if (!rem.enabled) return;
                        
                        let target = new Date();
                        if (rem.type === 'date' && rem.at) {
                            target = new Date(rem.at + 'T' + rem.time + ':00');
                        } else if (rem.type === 'day-before') {
                            target = new Date(e.date + 'T00:00:00');
                            target.setDate(target.getDate() - 1);
                            const [rh, rm] = rem.time.split(':').map(Number);
                            target.setHours(rh, rm, 0, 0);
                        } else {
                            return;
                        }

                        if (target.getTime() > now.getTime() + 5000) {
                            allEvents.push({
                                id: 6000 + (i * 100) + ri,
                                time: target.getTime(),
                                targetDate: target,
                                msg: rem.message || `Exam Reminder: ${e.subject} 📚`,
                                module: 'college',
                                type: 'reminder'
                            });
                        }
                    });
                }
            });

            // 1. Capacitor Native Scheduling (Preferred)
            if (isNative && Capacitor?.Plugins?.LocalNotifications) {
                try {
                    await Capacitor.Plugins.LocalNotifications.cancel({ notifications: await Capacitor.Plugins.LocalNotifications.getPending().then((p: any) => p.notifications) });
                    
                    const capNotifications = allEvents.map(e => ({
                        id: e.id,
                        title: 'NEURALIS',
                        body: e.msg,
                        schedule: { at: e.targetDate },
                        extra: { module: e.module, type: e.type },
                        sound: 'res://raw/notification.mp3', // Try to use custom sound if exists
                        smallIcon: 'res://icon',
                        largeIcon: 'res://icon'
                    }));

                    if (capNotifications.length > 0) {
                        await Capacitor.Plugins.LocalNotifications.schedule({ notifications: capNotifications });
                    }
                } catch (err) {
                    console.error("Capacitor Notification Error:", err);
                }
            } 
            // 2. Cordova Fallback
            else if (typeof (window as any).cordova !== 'undefined') {
                const cordova = (window as any).cordova;
                if (cordova.plugins?.notification?.local) {
                    cordova.plugins.notification.local.cancelAll(() => {
                        const nativeNotifications = allEvents.map(e => ({
                            id: e.id,
                            title: 'NEURALIS',
                            text: e.msg,
                            at: e.targetDate,
                            foreground: true,
                            wakeup: true,
                            vibrate: true,
                            priority: 2,
                            icon: 'res://icon',
                            smallIcon: 'res://icon',
                            data: { module: e.module, type: e.type }
                        }));
                        if (nativeNotifications.length > 0) {
                            cordova.plugins.notification.local.schedule(nativeNotifications);
                        }
                    });
                }
            }

            // 3. Browser/Foreground JS Timer
            allEvents.sort((a, b) => a.time - b.time);
            const nextEvent = allEvents[0];

            if (nextEvent) {
                const delay = Math.max(5000, nextEvent.time - now.getTime()); // Min 5s delay
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    sound.playLevelUp();
                    if (!isNative && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                        new Notification(`NEURALIS`, { body: nextEvent.msg, icon: '/favicon.ico' });
                    }
                    scheduleNotifications();
                }, delay);
            }
        };

        // Initial schedule delay only on first mount, otherwise run sooner
        const timer = setTimeout(scheduleNotifications, isFirstRun ? 2000 : 100);
        
        return () => {
            clearTimeout(timer);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [
        football.reminderHour, football.reminderMinute,
        gym.reminderHour, gym.reminderMinute,
        college.booksReminderHour, college.booksReminderMinute,
        college.idReminderHour, college.idReminderMinute,
        college.homeworkReminderHour, college.homeworkReminderMinute,
        state.morningReminderHour, state.morningReminderMinute,
        state.notificationMessages,
        college.customNotifications, college.assignments, college.exams
    ]);

    return null; 
};