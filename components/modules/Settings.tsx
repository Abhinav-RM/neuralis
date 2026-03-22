import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Bell, RefreshCw, Smartphone, Image as ImageIcon, ShieldCheck, Clock, Palette, Type, PaintBucket, Download, Upload, Trophy, Flame, BookOpen } from 'lucide-react';
import { sound } from '../../utils/sound';
import clsx from 'clsx';

export const Settings: React.FC = () => {
    const { state, updateState, updateFootball, updateGym, updateCollege, resetModule, resetAll, resetOnboarding, importData } = useApp();
    const { customization } = state.football;
    const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
    const [jsonInput, setJsonInput] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'onboarding' | 'factory' | 'football' | 'gym' | 'college', message: string } | null>(null);

    const requestNotifications = async () => {
        sound.playClick();
        if (typeof Notification !== 'undefined') {
            const permission = await Notification.requestPermission();
            setNotifPermission(permission);
            if (permission === 'granted') sound.playSuccess();
        } else {
            // Fallback for Cordova if needed, though NotificationManager handles the actual scheduling
            console.log("Notification API not available in this environment");
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `life_athlete_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        sound.playSuccess();
    };

    const handleImport = () => {
        try {
            const data = JSON.parse(jsonInput);
            if (data.football && data.gym) {
                importData(data);
                setShowImport(false);
                setJsonInput('');
            } else {
                alert("Invalid backup file");
                sound.playError();
            }
        } catch (e) {
            alert("Invalid JSON format");
            sound.playError();
        }
    };

    const TimeSelect = ({ label, hour, minute, onHourChange, onMinuteChange }: { 
        label: string, 
        hour: number, 
        minute: number, 
        onHourChange: (v: number) => void,
        onMinuteChange: (v: number) => void 
    }) => {
        const isPM = hour >= 12;
        const displayHour = hour % 12 || 12;

        const handleHourChange = (val: number) => {
            if (isPM) {
                onHourChange(val === 12 ? 12 : val + 12);
            } else {
                onHourChange(val === 12 ? 0 : val);
            }
        };

        const toggleAMPM = () => {
            if (isPM) {
                onHourChange(hour - 12);
            } else {
                onHourChange(hour + 12);
            }
        };

        return (
            <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase font-bold block">{label}</label>
                <div className="flex gap-2">
                    <select 
                        value={displayHour}
                        onChange={(e) => handleHourChange(parseInt(e.target.value))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-accent text-sm"
                    >
                        {Array.from({length: 12}).map((_, i) => (
                            <option key={i+1} value={i+1}>{(i+1).toString().padStart(2, '0')}</option>
                        ))}
                    </select>
                    <div className="flex items-center text-gray-500">:</div>
                    <select 
                        value={minute}
                        onChange={(e) => onMinuteChange(parseInt(e.target.value))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-accent text-sm"
                    >
                        {Array.from({length: 60}).map((_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                        ))}
                    </select>
                    <button 
                        onClick={() => { toggleAMPM(); sound.playClick(); }}
                        className="px-3 bg-accent/10 border border-accent/30 rounded-xl text-accent font-bold text-xs hover:bg-accent/20 transition-all"
                    >
                        {isPM ? 'PM' : 'AM'}
                    </button>
                </div>
            </div>
        );
    };

    const handleSyncNotifications = () => {
        // We trigger a state update to force NotificationManager to re-run
        updateState({ lastSyncTimestamp: Date.now() });
        sound.playSuccess();
        alert("Notifications Synchronized with System.");
    };

    return (
        <div className="space-y-6 animate-slide-up pb-10">
            {/* Module Configuration */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2"><Smartphone size={20} /> Module Configuration</h2>
                <p className="text-xs text-gray-500 mb-6">Toggle modules to hide them from the dashboard and evaluations. Your data will be preserved.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { id: 'football', label: 'Football Protocol', icon: Trophy },
                        { id: 'gym', label: 'Gym Protocol', icon: Flame },
                        { id: 'college', label: 'College Protocol', icon: BookOpen }
                    ].map((mod) => (
                        <button
                            key={mod.id}
                            onClick={() => {
                                const modId = mod.id as keyof typeof state.enabledModules;
                                const isEnabling = !state.enabledModules[modId];
                                
                                const updates: any = {
                                    enabledModules: {
                                        ...state.enabledModules,
                                        [modId]: isEnabling
                                    }
                                };

                                // If disabling a module, also turn off its notifications visually
                                if (!isEnabling) {
                                    const newToggles = { ...state.notificationToggles };
                                    if (modId === 'football') newToggles.football = false;
                                    if (modId === 'gym') newToggles.gym = false;
                                    if (modId === 'college') {
                                        newToggles.books = false;
                                        newToggles.idcard = false;
                                        newToggles.homework = false;
                                    }
                                    updates.notificationToggles = newToggles;
                                }

                                updateState(updates);
                                sound.playClick();
                            }}
                            className={clsx(
                                "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                state.enabledModules[mod.id as keyof typeof state.enabledModules]
                                    ? "bg-accent/10 border-accent/50 text-white"
                                    : "bg-white/5 border-white/10 text-gray-500"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <mod.icon size={18} className={state.enabledModules[mod.id as keyof typeof state.enabledModules] ? "text-accent" : "text-gray-600"} />
                                <span className="text-sm font-bold">{mod.label}</span>
                            </div>
                            <div className={clsx(
                                "w-10 h-5 rounded-full relative transition-colors",
                                state.enabledModules[mod.id as keyof typeof state.enabledModules] ? "bg-accent" : "bg-gray-700"
                            )}>
                                <div className={clsx(
                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                    state.enabledModules[mod.id as keyof typeof state.enabledModules] ? "left-6" : "left-1"
                                )} />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <ShieldCheck size={16} className={state.midnightLock ? "text-accent" : "text-gray-500"} /> Midnight Lock
                        </h3>
                        <button 
                            onClick={() => {
                                updateState({ midnightLock: !state.midnightLock });
                                sound.playClick();
                            }}
                            className={clsx(
                                "w-10 h-5 rounded-full relative transition-colors",
                                state.midnightLock ? "bg-accent" : "bg-gray-700"
                            )}
                        >
                            <div className={clsx(
                                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                state.midnightLock ? "left-6" : "left-1"
                            )} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">
                        Locks records at 12:00 AM. Today's entries remain editable until midnight.
                    </p>
                </div>
            </div>

            {/* Theme Engine */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2"><Palette size={20} /> Theme Engine</h2>
                
                <div className="space-y-6">
                    {/* Accent Color */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold block mb-3">System Accent</label>
                        <div className="flex gap-4 flex-wrap items-center">
                            {['#9d4edd', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#ec4899'].map(color => (
                                <button key={color} onClick={() => updateFootball({ customization: { ...customization, accentColor: color } })}
                                    className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${customization.accentColor === color ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent'}`} 
                                    style={{ backgroundColor: color }} 
                                />
                            ))}
                            <input 
                                type="color" 
                                value={customization.accentColor} 
                                onChange={(e) => updateFootball({ customization: { ...customization, accentColor: e.target.value } })}
                                className="w-10 h-10 rounded-full bg-transparent border-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Typography */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold block mb-3 flex items-center gap-2"><Type size={14}/> Typography Preset</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['modern', 'cyber', 'clean'].map(font => (
                                <button
                                    key={font}
                                    onClick={() => updateFootball({ customization: { ...customization, fontStyle: font } })}
                                    className={`p-3 rounded-xl border text-sm font-bold capitalize transition-all ${
                                        customization.fontStyle === font 
                                            ? 'bg-accent/20 border-accent text-accent' 
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    {font}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gradient Theme */}
                    {!customization.backgroundImage && (
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold block mb-3 flex items-center gap-2"><PaintBucket size={14}/> Gradient Mesh</label>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <span className="text-[10px] text-gray-500 mb-1 block">Start</span>
                                    <input type="color" className="w-full h-8 rounded cursor-pointer border-0 p-0" value={customization.gradientStart} onChange={(e) => updateFootball({ customization: { ...customization, gradientStart: e.target.value } })} />
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 mb-1 block">Middle</span>
                                    <input type="color" className="w-full h-8 rounded cursor-pointer border-0 p-0" value={customization.gradientMiddle} onChange={(e) => updateFootball({ customization: { ...customization, gradientMiddle: e.target.value } })} />
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 mb-1 block">End</span>
                                    <input type="color" className="w-full h-8 rounded cursor-pointer border-0 p-0" value={customization.gradientEnd} onChange={(e) => updateFootball({ customization: { ...customization, gradientEnd: e.target.value } })} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Background Settings */}
                    <div className="bg-white/5 p-4 rounded-2xl space-y-4 border border-white/5">
                        <label className="text-xs text-gray-400 uppercase font-bold block flex items-center gap-2"><ImageIcon size={14}/> Wallpaper Override</label>
                        
                        <div>
                            <input 
                                type="text" 
                                placeholder="Paste image URL..." 
                                value={customization.backgroundImage || ''}
                                onChange={(e) => updateFootball({ customization: { ...customization, backgroundImage: e.target.value } })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-accent outline-none"
                            />
                        </div>

                        {customization.backgroundImage && (
                            <>
                                <div>
                                    <div className="flex justify-between text-xs mb-1"><span>Zoom</span><span>{customization.bgZoom}%</span></div>
                                    <input type="range" min="100" max="300" value={customization.bgZoom} onChange={(e) => updateFootball({ customization: { ...customization, bgZoom: parseInt(e.target.value) } })} className="w-full accent-accent" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1"><span>Position X</span><span>{customization.bgX}%</span></div>
                                    <input type="range" min="0" max="100" value={customization.bgX} onChange={(e) => updateFootball({ customization: { ...customization, bgX: parseInt(e.target.value) } })} className="w-full accent-accent" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1"><span>Position Y</span><span>{customization.bgY}%</span></div>
                                    <input type="range" min="0" max="100" value={customization.bgY} onChange={(e) => updateFootball({ customization: { ...customization, bgY: parseInt(e.target.value) } })} className="w-full accent-accent" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1"><span>Blur Intensity</span><span>{customization.blur}px</span></div>
                                    <input type="range" min="0" max="50" value={customization.blur} onChange={(e) => updateFootball({ customization: { ...customization, blur: parseInt(e.target.value) } })} className="w-full accent-accent" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-display font-bold flex items-center gap-2"><Bell size={20} /> Reminders</h2>
                    <Button size="sm" onClick={handleSyncNotifications} className="gap-2"><RefreshCw size={14} /> Sync & Save</Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <TimeSelect label="Morning Protocol" hour={state.morningReminderHour} minute={state.morningReminderMinute} onHourChange={(v) => updateState({ morningReminderHour: v })} onMinuteChange={(v) => updateState({ morningReminderMinute: v })} />
                    <TimeSelect label="Football Training" hour={state.football.reminderHour} minute={state.football.reminderMinute} onHourChange={(v) => updateFootball({ reminderHour: v })} onMinuteChange={(v) => updateFootball({ reminderMinute: v })} />
                    <TimeSelect label="Gym Workout" hour={state.gym.reminderHour} minute={state.gym.reminderMinute} onHourChange={(v) => updateGym({ reminderHour: v })} onMinuteChange={(v) => updateGym({ reminderMinute: v })} />
                    <TimeSelect label="Pack Books (Mon-Fri)" hour={state.college.booksReminderHour} minute={state.college.booksReminderMinute} onHourChange={(v) => updateCollege({ booksReminderHour: v })} onMinuteChange={(v) => updateCollege({ booksReminderMinute: v })} />
                    <TimeSelect label="Wear ID Card (Mon-Fri)" hour={state.college.idReminderHour || 21} minute={state.college.idReminderMinute || 0} onHourChange={(v) => updateCollege({ idReminderHour: v })} onMinuteChange={(v) => updateCollege({ idReminderMinute: v })} />
                    <TimeSelect label="Homework Due" hour={state.college.homeworkReminderHour} minute={state.college.homeworkReminderMinute} onHourChange={(v) => updateCollege({ homeworkReminderHour: v })} onMinuteChange={(v) => updateCollege({ homeworkReminderMinute: v })} />
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-4">Notification Toggles</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(state.notificationToggles).map(([key, enabled]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    updateState({
                                        notificationToggles: {
                                            ...state.notificationToggles,
                                            [key]: !enabled
                                        }
                                    });
                                    sound.playClick();
                                }}
                                className={clsx(
                                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                                    enabled ? "bg-accent/10 border-accent/50 text-white" : "bg-white/5 border-white/10 text-gray-500"
                                )}
                            >
                                <span className="text-xs font-bold capitalize">{key}</span>
                                <div className={clsx(
                                    "w-8 h-4 rounded-full relative transition-colors",
                                    enabled ? "bg-accent" : "bg-gray-700"
                                )}>
                                    <div className={clsx(
                                        "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                                        enabled ? "left-[1.125rem]" : "left-0.5"
                                    )} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notification Manager (Content Editor) */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-display font-bold flex items-center gap-2"><Smartphone size={20} /> Notification Manager</h2>
                    <Button size="sm" onClick={handleSyncNotifications} className="gap-2"><RefreshCw size={14} /> Sync & Save</Button>
                </div>
                <p className="text-xs text-gray-500 mb-6">Customize the messages sent to your device. Emojis are supported. 🚀</p>

                <div className="space-y-4">
                    {[
                        { id: 'morning', label: 'Morning Protocol', hour: state.morningReminderHour, minute: state.morningReminderMinute },
                        { id: 'football', label: 'Football Training', hour: state.football.reminderHour, minute: state.football.reminderMinute },
                        { id: 'gym', label: 'Gym Workout', hour: state.gym.reminderHour, minute: state.gym.reminderMinute },
                        { id: 'books', label: 'Pack Books', hour: state.college.booksReminderHour, minute: state.college.booksReminderMinute },
                        { id: 'idcard', label: 'Wear ID Card', hour: state.college.idReminderHour || 21, minute: state.college.idReminderMinute || 0 },
                        { id: 'homework', label: 'Homework Due', hour: state.college.homeworkReminderHour, minute: state.college.homeworkReminderMinute }
                    ].map((item) => (
                        <div key={item.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-accent uppercase">{item.label}</span>
                                <span className="text-[10px] text-gray-300 font-mono bg-white/10 px-2 py-0.5 rounded-md">
                                    {item.hour % 12 || 12}:{item.minute.toString().padStart(2, '0')} {item.hour >= 12 ? 'PM' : 'AM'}
                                </span>
                            </div>
                            <input 
                                type="text"
                                value={state.notificationMessages[item.id as keyof typeof state.notificationMessages]}
                                onChange={(e) => updateState({
                                    notificationMessages: {
                                        ...state.notificationMessages,
                                        [item.id]: e.target.value
                                    }
                                })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none transition-all"
                                placeholder="Enter notification text..."
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Neural Backup */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2"><ShieldCheck size={20} /> Neural Backup</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h3 className="font-bold text-sm mb-2">Export Data</h3>
                        <p className="text-xs text-gray-500 mb-4">Save a local JSON copy of your entire OS state.</p>
                        <Button variant="secondary" onClick={handleExport} className="w-full gap-2"><Download size={16}/> Download JSON</Button>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h3 className="font-bold text-sm mb-2">Import Data</h3>
                        <p className="text-xs text-gray-500 mb-4">Restore from a previous backup file.</p>
                        {showImport ? (
                            <div className="space-y-2">
                                <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-mono h-20" placeholder="Paste JSON here..." />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleImport}>Restore</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setShowImport(false)}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <Button variant="secondary" onClick={() => setShowImport(true)} className="w-full gap-2"><Upload size={16}/> Import JSON</Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Module Management */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2"><RefreshCw size={20} /> Resets</h2>
                <div className="flex flex-wrap gap-4">
                    <Button variant="secondary" onClick={() => setConfirmAction({ type: 'football', message: 'Reset Football Protocol? This will clear all football training history and stats.' })}>Reset Football</Button>
                    <Button variant="secondary" onClick={() => setConfirmAction({ type: 'gym', message: 'Reset Gym Protocol? This will clear all gym history, weight logs, and stats.' })}>Reset Gym</Button>
                    <Button variant="secondary" onClick={() => setConfirmAction({ type: 'college', message: 'Reset College Protocol? This will clear all attendance, assignments, and timetable.' })}>Reset College</Button>
                </div>
            </div>
            
             <div className="glass-panel p-6 rounded-3xl border border-white/10 border-danger/30">
                <h2 className="text-xl font-display font-bold mb-4 text-danger">Danger Zone</h2>
                <div className="flex flex-wrap gap-4">
                    <Button variant="danger" onClick={() => setConfirmAction({ type: 'onboarding', message: 'Reset Onboarding? This will keep your stats but ask for your name and DOB again.' })}>Reset Onboarding</Button>
                    <Button variant="danger" onClick={() => setConfirmAction({ type: 'factory', message: 'CRITICAL: This will PERMANENTLY DELETE all your data, levels, and achievements. Are you absolutely sure?' })}>Factory Reset OS</Button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl max-w-sm w-full border border-danger/30 text-center">
                        <h3 className="text-xl font-bold text-danger mb-4">Confirm Action</h3>
                        <p className="text-gray-300 mb-8">{confirmAction.message}</p>
                        <div className="flex gap-4">
                            <Button variant="ghost" className="flex-1" onClick={() => setConfirmAction(null)}>Cancel</Button>
                            <Button variant="danger" className="flex-1" onClick={() => {
                                if (confirmAction.type === 'onboarding') {
                                    resetOnboarding();
                                } else if (confirmAction.type === 'factory') {
                                    resetAll();
                                    window.location.reload();
                                } else if (confirmAction.type === 'football') {
                                    resetModule('football');
                                } else if (confirmAction.type === 'gym') {
                                    resetModule('gym');
                                } else if (confirmAction.type === 'college') {
                                    resetModule('college');
                                }
                                setConfirmAction(null);
                            }}>Confirm</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Version Info */}
            <div className="text-center pt-10 opacity-30">
                <p className="text-[10px] font-mono tracking-[0.5em] uppercase">NEURALIS v2.4.0</p>
                <p className="text-[8px] font-mono mt-1 uppercase">All Protocols Synchronized • Build 2024.12.24</p>
            </div>
        </div>
    );
};