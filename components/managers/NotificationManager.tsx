import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sound } from '../../utils/sound';

export const NotificationManager: React.FC = () => {
    const { state, setPendingAction, updateState } = useApp();
    const { college } = state;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastScheduleRef = useRef<number>(0);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [dismissedWarning, setDismissedWarning] = useState(false);

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
                try {
                    const result = await Capacitor.Plugins.LocalNotifications.checkPermissions();
                    if (result.display === 'denied') {
                        // Already denied — don't re-request, show warning
                        setPermissionDenied(true);
                        return;
                    }
                    if (result.display !== 'granted') {
                        const permission = await Capacitor.Plugins.LocalNotifications.requestPermissions();
                        if (permission.display === 'denied') {
                            setPermissionDenied(true);
                            console.warn("Notification permission denied by user");
                        } else {
                            setPermissionDenied(false);
                        }
                    }
                } catch (e) {
                    console.error("Error checking notification permissions:", e);
                }
            } else if (typeof (window as any).cordova !== 'undefined') {
                const cordova = (window as any).cordova;
                if (cordova.plugins?.notification?.local) {
                    cordova.plugins.notification.local.requestPermission((granted: boolean) => {
                        if (!granted) setPermissionDenied(true);
                    });
                }
            } else if (typeof Notification !== 'undefined') {
                if (Notification.permission === 'denied') {
                    setPermissionDenied(true);
                } else if (Notification.permission === 'default') {
                    try {
                        const result = await Notification.requestPermission();
                        if (result === 'denied') setPermissionDenied(true);
                    } catch (e) {
                        console.error("Error requesting notification permission:", e);
                    }
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
            const triggers: {
                baseId: number;
                hour: number;
                minute: number;
                msg: string;
                module?: string;
                type?: string;
                skip: boolean;
                repeats?: string;
                days?: number[];
            }[] = [
                { baseId: 300, hour: college.booksReminderHour, minute: college.booksReminderMinute, msg: state.notificationMessages.books, module: 'college', type: 'reminder', skip: !state.notificationToggles.books },
                { baseId: 400, hour: college.idReminderHour || 21, minute: college.idReminderMinute || 0, msg: state.notificationMessages.idcard, module: 'college', type: 'reminder', skip: !state.notificationToggles.idcard },
                { baseId: 500, hour: college.homeworkReminderHour, minute: college.homeworkReminderMinute, msg: state.notificationMessages.homework, module: 'college', type: 'homework', skip: !state.notificationToggles.homework },
                { baseId: 600, hour: state.morningReminderHour || 8, minute: state.morningReminderMinute || 0, msg: state.notificationMessages.morning, skip: !state.notificationToggles.morning },
                // Custom Notifications — use stable IDs derived from cn.id to prevent collisions on delete
                ...(college.customNotifications || [])
                    .filter(cn => cn.enabled)
                    .map((cn) => {
                        const [h, m] = cn.time.split(':').map(Number);
                        // Generate a stable baseId from the notification's unique ID (timestamp string)
                        // Use modulo to keep it in a safe range, offset by 10000 to avoid collision with system IDs
                        const stableBase = 10000 + (Math.abs(parseInt(cn.id, 10)) % 50000);
                        return {
                            baseId: stableBase,
                            hour: h,
                            minute: m,
                            msg: cn.message,
                            skip: false,
                            repeats: cn.repeats || 'daily', // Default to daily for backward compat
                            days: cn.days
                        };
                    })
            ].filter(t => !t.skip);

            const allEvents: any[] = [];
            const usedIds = new Set<number>(); // Track used IDs to prevent any collision

            triggers.forEach(t => {
                // Determine how many days to schedule based on `repeats`
                const maxDays = t.repeats === 'once' ? 1
                    : t.repeats === 'twice' ? 2
                    : 14; // 'daily', 'specific-days', or system notifications

                let scheduled = 0;
                for (let i = 0; i < 14 && scheduled < maxDays; i++) {
                    const target = new Date(now);
                    target.setDate(target.getDate() + i);
                    target.setHours(t.hour, t.minute, 0, 0);

                    // Skip if this specific time is already in the past (add 5s buffer to avoid instant fire)
                    if (target.getTime() <= now.getTime() + 5000) {
                        continue;
                    }

                    // Weekend logic for College system notifications
                    if ([300, 400, 500].includes(t.baseId)) {
                        if (target.getDay() === 0 || target.getDay() === 6) continue;
                    }

                    // Specific-days filter for custom notifications
                    if (t.repeats === 'specific-days' && t.days && t.days.length > 0) {
                        if (!t.days.includes(target.getDay())) continue;
                    }

                    // Generate a unique ID and ensure no collision
                    let eventId = t.baseId + i;
                    while (usedIds.has(eventId)) {
                        eventId += 1;
                    }
                    usedIds.add(eventId);

                    allEvents.push({
                        id: eventId,
                        time: target.getTime(),
                        targetDate: target,
                        msg: t.msg,
                        module: t.module,
                        type: t.type
                    });

                    scheduled++;
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
        college.booksReminderHour, college.booksReminderMinute,
        college.idReminderHour, college.idReminderMinute,
        college.homeworkReminderHour, college.homeworkReminderMinute,
        state.morningReminderHour, state.morningReminderMinute,
        state.notificationMessages,
        college.customNotifications, college.assignments, college.exams
    ]);

    const openAppSettings = () => {
        const Capacitor = (window as any).Capacitor;
        if (Capacitor?.isNativePlatform() && Capacitor?.Plugins?.App) {
            // Opens Android app notification settings directly
            Capacitor.Plugins.App.openUrl({ url: 'app-settings:' });
        }
    };

    if (permissionDenied && !dismissedWarning) {
        return (
            <div style={{
                position: 'fixed',
                bottom: 16,
                left: 16,
                right: 16,
                zIndex: 9999,
                backgroundColor: 'rgba(220, 38, 38, 0.95)',
                backdropFilter: 'blur(12px)',
                borderRadius: 16,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>
                        🔔 Notifications Disabled
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '4px 0 0 0' }}>
                        Enable notifications in settings to receive reminders.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                        onClick={openAppSettings}
                        style={{
                            backgroundColor: 'white',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 14px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        Settings
                    </button>
                    <button
                        onClick={() => setDismissedWarning(true)}
                        style={{
                            backgroundColor: 'transparent',
                            color: 'rgba(255,255,255,0.6)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 8,
                            padding: '8px 10px',
                            fontSize: 11,
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    return null; 
};