import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sound } from '../../utils/sound';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';

export const NotificationManager: React.FC = () => {
    const { state, setPendingAction, updateState } = useApp();
    const { college } = state;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastScheduleRef = useRef<number>(0);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [dismissedWarning, setDismissedWarning] = useState(false);

    useEffect(() => {
        const isNative = Capacitor.isNativePlatform();
        
        if (isNative) {
            const handleNotificationClick = (action: any) => {
                const data = action.notification?.data;
                if (data && data.module) {
                    setPendingAction({
                        module: data.module,
                        type: data.type || 'check-in'
                    });
                    updateState({ currentModule: data.module });
                }
            };

            let actionListener: any = null;
            try {
                actionListener = LocalNotifications.addListener('localNotificationActionPerformed', handleNotificationClick);
            } catch (err) {
                console.error("Failed to add LocalNotifications listener:", err);
            }

            return () => {
                if (actionListener) {
                    actionListener.then ? actionListener.then((l: any) => l.remove()) : actionListener.remove();
                }
            };
        }
    }, [setPendingAction, updateState]);

    useEffect(() => {
        const setupNotifications = async () => {
            const isNative = Capacitor.isNativePlatform();
            
            if (isNative) {
                try {
                    const result = await LocalNotifications.checkPermissions();
                    if (result.display === 'denied') {
                        setPermissionDenied(true);
                        return;
                    }
                    if (result.display !== 'granted') {
                        const permission = await LocalNotifications.requestPermissions();
                        if (permission.display === 'denied') {
                            setPermissionDenied(true);
                            console.warn("Notification permission denied by user");
                        } else {
                            setPermissionDenied(false);
                        }
                    }

                    // Create custom notification channels for the preloaded WAV sounds
                    await LocalNotifications.createChannel({
                        id: 'neuralis_default',
                        name: 'Neuralis Default Alerts',
                        description: 'Notifications with the default system sound',
                        importance: 5,
                        visibility: 1,
                        vibration: true
                    });
                    await LocalNotifications.createChannel({
                        id: 'neuralis_chime',
                        name: 'Neuralis Chime Alerts',
                        description: 'Notifications with a gentle chime',
                        sound: 'chime.wav',
                        importance: 5,
                        visibility: 1,
                        vibration: true
                    });
                    await LocalNotifications.createChannel({
                        id: 'neuralis_ping',
                        name: 'Neuralis Digital Ping Alerts',
                        description: 'Notifications with a tech ping sound',
                        sound: 'ping.wav',
                        importance: 5,
                        visibility: 1,
                        vibration: true
                    });
                    await LocalNotifications.createChannel({
                        id: 'neuralis_cyber',
                        name: 'Neuralis Cyber Sweep Alerts',
                        description: 'Notifications with a sci-fi sweep sound',
                        sound: 'cyber.wav',
                        importance: 5,
                        visibility: 1,
                        vibration: true
                    });
                    await LocalNotifications.createChannel({
                        id: 'neuralis_beep',
                        name: 'Neuralis Pulse Alarm Alerts',
                        description: 'Notifications with a triple beep alert',
                        sound: 'beep.wav',
                        importance: 5,
                        visibility: 1,
                        vibration: true
                    });
                    await LocalNotifications.createChannel({
                        id: 'neuralis_silent',
                        name: 'Neuralis Silent Alerts',
                        description: 'Notifications with vibration only and no sound',
                        importance: 3,
                        sound: undefined,
                        visibility: 1,
                        vibration: true
                    });
                } catch (e) {
                    console.error("Error setting up notification channels/permissions:", e);
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
        setupNotifications();
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
                sound?: string;
            }[] = [
                { baseId: 300, hour: college.booksReminderHour, minute: college.booksReminderMinute, msg: state.notificationMessages.books, module: 'college', type: 'reminder', skip: !state.notificationToggles.books, sound: 'default' },
                { baseId: 400, hour: college.idReminderHour || 21, minute: college.idReminderMinute || 0, msg: state.notificationMessages.idcard, module: 'college', type: 'reminder', skip: !state.notificationToggles.idcard, sound: 'default' },
                { baseId: 500, hour: college.homeworkReminderHour, minute: college.homeworkReminderMinute, msg: state.notificationMessages.homework, module: 'college', type: 'homework', skip: !state.notificationToggles.homework, sound: 'default' },
                { baseId: 600, hour: state.morningReminderHour || 8, minute: state.morningReminderMinute || 0, msg: state.notificationMessages.morning, skip: !state.notificationToggles.morning, sound: 'default' },
                // Custom Notifications — use stable IDs derived from cn.id to prevent collisions on delete
                ...(college.customNotifications || [])
                    .filter(cn => cn.enabled)
                    .map((cn) => {
                        const [h, m] = cn.time.split(':').map(Number);
                        const stableBase = 10000 + (Math.abs(parseInt(cn.id, 10)) % 50000);
                        return {
                            baseId: stableBase,
                            hour: h,
                            minute: m,
                            msg: cn.message,
                            skip: false,
                            repeats: cn.repeats || 'daily',
                            days: cn.days,
                            sound: cn.sound || 'default'
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
                        type: t.type,
                        sound: t.sound || 'default'
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
                            return;
                        }

                        if (target.getTime() > now.getTime() + 5000) {
                            allEvents.push({
                                id: 5000 + (i * 100) + ri,
                                time: target.getTime(),
                                targetDate: target,
                                msg: rem.message || `Assignment Reminder: ${a.title} 📝`,
                                module: 'college',
                                type: 'reminder',
                                sound: rem.sound || 'default'
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
                                type: 'reminder',
                                sound: rem.sound || 'default'
                            });
                        }
                    });
                }
            });

            // 1. Capacitor Native Scheduling (Preferred)
            if (isNative) {
                try {
                    const pending = await LocalNotifications.getPending();
                    if (pending.notifications && pending.notifications.length > 0) {
                        await LocalNotifications.cancel({ notifications: pending.notifications });
                    }
                    
                    const capNotifications = allEvents.map(e => {
                        const selectedSound = e.sound || state.customization?.defaultNotificationSound || 'default';
                        let channelId = 'neuralis_default';
                        if (['chime', 'ping', 'cyber', 'beep', 'silent'].includes(selectedSound)) {
                            channelId = `neuralis_${selectedSound}`;
                        }
                        
                        return {
                            id: e.id,
                            title: 'NEURALIS',
                            body: e.msg,
                            schedule: { at: new Date(e.time) },
                            extra: { module: e.module, type: e.type },
                            channelId: channelId,
                            smallIcon: 'icon',
                            largeIcon: 'icon'
                        };
                    });

                    if (capNotifications.length > 0) {
                        await LocalNotifications.schedule({ notifications: capNotifications });
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
                    // Play the correct sound in foreground
                    const eventSound = nextEvent.sound || state.customization?.defaultNotificationSound || 'default';
                    if (eventSound === 'chime') {
                        sound.playLevelUp();
                    } else if (eventSound === 'ping') {
                        sound.playCoin();
                    } else if (eventSound === 'cyber') {
                        sound.playRobotStartup();
                    } else if (eventSound === 'beep') {
                        sound.playError();
                    } else if (eventSound.startsWith('uploaded_')) {
                        const uploadedSounds = state.customization?.uploadedSounds || [];
                        const found = uploadedSounds.find((s: any) => `uploaded_${s.name}` === eventSound);
                        if (found && found.data) {
                            try {
                                const audio = new Audio(found.data);
                                audio.volume = 0.3;
                                audio.play().catch(er => console.error("Foreground Audio play failed:", er));
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    } else if (eventSound !== 'silent') {
                        sound.playClick();
                    }

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
        state.customization?.defaultNotificationSound,
        college.customNotifications, college.assignments, college.exams
    ]);

    const openAppSettings = () => {
        if (Capacitor.isNativePlatform()) {
            (App as any).openUrl({ url: 'app-settings:' });
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