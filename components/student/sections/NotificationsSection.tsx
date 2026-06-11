import React, { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Bell, Clock, CheckSquare, BookOpen, Plus, Trash2, X, AlertCircle, Edit2, Volume2, Upload } from 'lucide-react';
import { Button } from '../../ui/Button';
import { sound } from '../../../utils/sound';
import { Capacitor } from '@capacitor/core';
import { RingtonePicker } from '../../../utils/ringtonePicker';

interface NotificationsSectionProps {
    state: any;
    updateCustomization: (u: any) => void;
    assignments: any[];
    exams: any[];
    customNotifications: any[];
    updateCollege: (u: any) => void;
}

export const NotificationsSection = React.memo<NotificationsSectionProps>(({ 
    state, 
    updateCustomization, 
    assignments, 
    exams, 
    customNotifications, 
    updateCollege 
}) => {
    const [showAdd, setShowAdd] = useState(false);
    const [newNotif, setNewNotif] = useState({ 
        message: '', 
        time: '09:00', 
        repeats: 'once' as any, 
        days: [] as number[],
        sound: 'default' 
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [notifToDelete, setNotifToDelete] = useState<string | null>(null);

    const playSoundPreview = (soundName: string) => {
        if (soundName === 'chime') {
            sound.playLevelUp();
        } else if (soundName === 'ping') {
            sound.playCoin();
        } else if (soundName === 'cyber') {
            sound.playRobotStartup();
        } else if (soundName === 'beep') {
            sound.playError();
        } else if (soundName.startsWith('uploaded_')) {
            const uploadedSounds = state.customization?.uploadedSounds || [];
            const found = uploadedSounds.find((s: any) => `uploaded_${s.name}` === soundName);
            if (found && found.data) {
                try {
                    const audio = new Audio(found.data);
                    audio.volume = 0.3;
                    audio.play().catch(e => console.error("Failed to play preview:", e));
                } catch (e) {
                    console.error("Audio API preview error", e);
                }
            }
        } else {
            sound.playClick();
        }
    };

    const handleSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            // Limit size to 1MB to avoid bloated localStorage
            if (file.size > 1 * 1024 * 1024) {
                alert("File is too large! Please choose an audio file under 1MB.");
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const base64Data = reader.result as string;
                const currentUploaded = state.customization?.uploadedSounds || [];
                const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
                const newSound = { name: cleanName, data: base64Data };
                
                updateCustomization({
                    uploadedSounds: [...currentUploaded.filter((s: any) => s.name !== cleanName), newSound]
                });
                sound.playSuccess();
            };
            reader.onerror = () => {
                sound.playError();
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("Audio upload stream failure:", err);
            sound.playError();
        } finally {
            e.target.value = '';
        }
    };

    const handleAdd = () => {
        if (!newNotif.message || !newNotif.time) return;

        if (editingId) {
            // Edit mode
            updateCollege({
                customNotifications: (customNotifications || []).map(n => n.id === editingId ? {
                    ...n,
                    message: newNotif.message,
                    time: newNotif.time,
                    repeats: newNotif.repeats,
                    days: newNotif.repeats === 'specific-days' ? newNotif.days : undefined,
                    sound: newNotif.sound
                } : n)
            });
            setEditingId(null);
        } else {
            // Create mode
            updateCollege({
                customNotifications: [...(customNotifications || []), {
                    id: Date.now().toString(), 
                    message: newNotif.message, 
                    time: newNotif.time,
                    repeats: newNotif.repeats, 
                    days: newNotif.repeats === 'specific-days' ? newNotif.days : undefined, 
                    sound: newNotif.sound,
                    enabled: true
                }]
            });
        }

        setNewNotif({ message: '', time: '09:00', repeats: 'once', days: [], sound: 'default' });
        setShowAdd(false);
        sound.playSuccess();
    };

    const startEdit = (notif: any) => {
        setNewNotif({
            message: notif.message,
            time: notif.time,
            repeats: notif.repeats || 'once',
            days: notif.days || [],
            sound: notif.sound || 'default'
        });
        setEditingId(notif.id);
        setShowAdd(true);
        sound.playClick();
    };

    const toggle = (id: string) => { 
        updateCollege({ 
            customNotifications: (customNotifications || []).map(n => n.id === id ? { ...n, enabled: !n.enabled } : n) 
        }); 
        sound.playClick(); 
    };

    const remove = (id: string) => { 
        setNotifToDelete(id); 
        sound.playClick(); 
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h2 className="text-lg sm:text-2xl font-bold whitespace-nowrap">Notifications</h2>
            </div>

            <div className="space-y-8">
                {/* Task & Exam Reminders */}
                <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Task & Exam Reminders</h3>
                    <div className="space-y-3">
                        {[...assignments, ...exams].map(item => {
                            if (!item.reminders || item.reminders.length === 0) return null;
                            return (
                                <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold flex items-center gap-2 text-sm">
                                            {('title' in item) ? <CheckSquare size={16} className="text-blue-400"/> : <BookOpen size={16} className="text-purple-400"/>}
                                            {('title' in item) ? (item as any).title : (item as any).subject}
                                        </h4>
                                        <span className="text-[10px] uppercase font-bold text-gray-500">{('dueDate' in item) ? `Due: ${(item as any).dueDate}` : `Date: ${(item as any).date}`}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {item.reminders.map((rem: any, ri: number) => (
                                            <div key={rem.id} className={clsx("p-3 rounded-xl border flex items-center justify-between transition-all", rem.enabled ? "bg-black/40 border-white/10" : "bg-black/20 border-white/5 opacity-40")}>
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx("p-2 rounded-lg", rem.enabled ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-500")}><Clock size={14}/></div>
                                                    <div><p className="text-xs font-bold text-white">{rem.type === 'day-before' ? 'Day Before' : rem.at} @ {rem.time}</p><p className="text-[10px] text-gray-400">{rem.message || 'Standard Reminder'}</p></div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => {
                                                        const isA = ('title' in item);
                                                        const list = isA ? assignments.map(a => a.id === item.id ? { ...a, reminders: a.reminders!.map((r: any, idx: number) => idx === ri ? { ...r, enabled: !r.enabled } : r) } : a)
                                                            : exams.map(e => e.id === item.id ? { ...e, reminders: e.reminders!.map((r: any, idx: number) => idx === ri ? { ...r, enabled: !r.enabled } : r) } : e);
                                                        updateCollege(isA ? { assignments: list } : { exams: list }); sound.playClick();
                                                    }} className={clsx("w-8 h-4 rounded-full relative transition-colors", rem.enabled ? "bg-blue-500" : "bg-white/10")}>
                                                        <div className={clsx("w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform", rem.enabled ? "translate-x-4" : "translate-x-1")} />
                                                    </button>
                                                    <button onClick={() => {
                                                        const isA = ('title' in item);
                                                        const list = isA ? assignments.map(a => a.id === item.id ? { ...a, reminders: a.reminders!.filter((_: any, idx: number) => idx !== ri) } : a)
                                                            : exams.map(e => e.id === item.id ? { ...e, reminders: e.reminders!.filter((_: any, idx: number) => idx !== ri) } : e);
                                                        updateCollege(isA ? { assignments: list } : { exams: list }); sound.playError();
                                                    }} className="p-1.5 text-gray-500 hover:text-rose-400"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* General Notifications */}
                <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                            <Bell className="text-blue-400" /> General Notifications
                        </h2>
                        <button 
                            onClick={() => {
                                setEditingId(null);
                                setNewNotif({ message: '', time: '09:00', repeats: 'once', days: [], sound: 'default' });
                                setShowAdd(!showAdd);
                            }} 
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400 hover:text-white"
                        >
                            {showAdd && !editingId ? <X size={20} /> : <Plus size={20} />}
                        </button>
                    </div>

                    {/* Global Sound Configuration */}
                    <div className="p-4 bg-black/20 border border-white/5 rounded-xl space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Volume2 size={14} className="text-blue-400" /> Global Default Alert Sound
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex-1 min-w-[200px] flex items-center gap-2">
                                <select 
                                    value={state.customization?.defaultNotificationSound || 'default'} 
                                    onChange={(e) => {
                                        updateCustomization({ defaultNotificationSound: e.target.value });
                                        playSoundPreview(e.target.value);
                                    }} 
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="default" className="bg-[#121214]">Default System Sound</option>
                                    <option value="chime" className="bg-[#121214]">Chime (Warm Synth)</option>
                                    <option value="ping" className="bg-[#121214]">Digital Ping (Short Tech)</option>
                                    <option value="cyber" className="bg-[#121214]">Cyber Sweep (Sci-Fi Sweep)</option>
                                    <option value="beep" className="bg-[#121214]">Triple Beep (Pulse Alarm)</option>
                                    <option value="silent" className="bg-[#121214]">Silent (Vibration Only)</option>
                                    {state.customization?.systemNotificationSoundUri && (
                                        <option value="system_custom" className="bg-[#121214]">
                                            System: {state.customization.systemNotificationSoundName || 'Custom'}
                                        </option>
                                    )}
                                    {(state.customization?.uploadedSounds || []).map((s: any) => (
                                        <option key={s.name} value={`uploaded_${s.name}`} className="bg-[#121214]">
                                            Custom: {s.name}
                                        </option>
                                    ))}
                                </select>
                                <button 
                                    onClick={() => playSoundPreview(state.customization?.defaultNotificationSound || 'default')}
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-all active:scale-95"
                                    title="Play Sound Preview"
                                    disabled={state.customization?.defaultNotificationSound === 'system_custom'}
                                >
                                    <Volume2 size={16} />
                                </button>
                            </div>

                            <label className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-98">
                                <Upload size={14} />
                                Upload Sound (.mp3/.wav)
                                <input 
                                    type="file" 
                                    accept="audio/*" 
                                    onChange={handleSoundUpload} 
                                    className="hidden" 
                                />
                            </label>

                            {Capacitor.isNativePlatform() && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await RingtonePicker.pickRingtone({
                                                existingUri: state.customization?.systemNotificationSoundUri || undefined
                                            });
                                            updateCustomization({
                                                defaultNotificationSound: 'system_custom',
                                                systemNotificationSoundUri: res.uri,
                                                systemNotificationSoundName: res.name
                                            });
                                            sound.playSuccess();
                                        } catch (err) {
                                            console.warn("System sound selection cancelled", err);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 hover:text-purple-300 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-98"
                                >
                                    <Volume2 size={14} />
                                    Select System Sound
                                </button>
                            )}
                        </div>

                        <p className="text-[10px] text-gray-500">
                            Note: Uploaded custom sounds play while the app is in the foreground. Background alerts will use your preloaded selection chime/ping/cyber/beep/default.
                        </p>
                    </div>

                    {showAdd && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 space-y-4 p-4 bg-black/20 rounded-xl border border-white/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    {editingId ? 'Edit Notification' : 'New Notification'}
                                </h3>
                                <button 
                                    onClick={() => {
                                        setShowAdd(false);
                                        setEditingId(null);
                                    }} 
                                    className="text-gray-500 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold">Message</label>
                                <input 
                                    type="text" 
                                    placeholder="Drink water, Take a break..." 
                                    value={newNotif.message} 
                                    onChange={(e) => setNewNotif({...newNotif, message: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Time</label>
                                    <input 
                                        type="time" 
                                        value={newNotif.time} 
                                        onChange={(e) => setNewNotif({...newNotif, time: e.target.value})} 
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Repeats</label>
                                    <select 
                                        value={newNotif.repeats} 
                                        onChange={(e) => setNewNotif({...newNotif, repeats: e.target.value as any})} 
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="once" className="bg-[#121214]">Once</option>
                                        <option value="twice" className="bg-[#121214]">Twice (2 Days)</option>
                                        <option value="daily" className="bg-[#121214]">Daily</option>
                                        <option value="specific-days" className="bg-[#121214]">Specific Days</option>
                                    </select>
                                </div>
                            </div>

                            {newNotif.repeats === 'specific-days' && (
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Select Days</label>
                                    <div className="flex justify-between gap-1">
                                        {['S','M','T','W','T','F','S'].map((day, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => { 
                                                    const days = newNotif.days.includes(i) ? newNotif.days.filter(d => d !== i) : [...newNotif.days, i]; 
                                                    setNewNotif({...newNotif, days}); 
                                                }}
                                                className={clsx("w-8 h-8 rounded-lg text-xs font-bold transition-colors", newNotif.days.includes(i) ? "bg-blue-500 text-white" : "bg-black/40 text-gray-400 border border-white/5")}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sound Picker for specific Notification */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold">Alert Sound (Overrides default)</label>
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={newNotif.sound || 'default'} 
                                        onChange={(e) => setNewNotif({...newNotif, sound: e.target.value})} 
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="default" className="bg-[#121214]">Use Global Default</option>
                                        <option value="chime" className="bg-[#121214]">Chime (Warm Synth)</option>
                                        <option value="ping" className="bg-[#121214]">Digital Ping (Short Tech)</option>
                                        <option value="cyber" className="bg-[#121214]">Cyber Sweep (Sci-Fi Sweep)</option>
                                        <option value="beep" className="bg-[#121214]">Triple Beep (Pulse Alarm)</option>
                                        <option value="silent" className="bg-[#121214]">Silent (Vibration Only)</option>
                                        {(state.customization?.uploadedSounds || []).map((s: any) => (
                                            <option key={s.name} value={`uploaded_${s.name}`} className="bg-[#121214]">
                                                Custom: {s.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={() => playSoundPreview(newNotif.sound || 'default')}
                                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-all active:scale-95"
                                        title="Play Sound Preview"
                                    >
                                        <Volume2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <Button onClick={handleAdd} className="w-full py-2">
                                {editingId ? 'Update Notification' : 'Set Notification'}
                            </Button>
                        </motion.div>
                    )}

                    <div className="space-y-4">
                        {(customNotifications || []).length === 0 ? (
                            <div className="text-center py-12 text-gray-500 italic bg-white/5 rounded-2xl border border-white/5">
                                No custom notifications set.
                            </div>
                        ) : (
                            customNotifications.map((notif) => (
                                <div key={notif.id} className={clsx("p-4 rounded-2xl border flex items-center justify-between transition-all", notif.enabled ? "bg-white/5 border-white/20" : "bg-black/20 border-white/5 opacity-50")}>
                                    <div className="flex items-center gap-4">
                                        <div className={clsx("p-3 rounded-xl", notif.enabled ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-500")}>
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{notif.message}</h4>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <p className="text-xs text-gray-400 font-medium">{notif.time}</p>
                                                <span className="text-[10px] uppercase px-1.5 py-0.5 bg-white/5 rounded text-gray-500 font-bold border border-white/5">
                                                    {notif.repeats || 'once'}
                                                </span>
                                                {notif.sound && notif.sound !== 'default' && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 rounded text-blue-400 font-medium border border-blue-500/10 flex items-center gap-1">
                                                        <Volume2 size={10} /> {notif.sound.replace('uploaded_', '')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => startEdit(notif)} 
                                            className="p-2 text-gray-400 hover:text-white transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => toggle(notif.id)} 
                                            className={clsx("w-10 h-6 rounded-full relative transition-colors mr-1", notif.enabled ? "bg-blue-500" : "bg-white/10")}
                                        >
                                            <div className={clsx("w-4 h-4 rounded-full bg-white absolute top-1 transition-transform", notif.enabled ? "translate-x-5" : "translate-x-1")} />
                                        </button>
                                        <button 
                                            onClick={() => remove(notif.id)} 
                                            className="p-2 text-gray-500 hover:text-rose-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Delete custom notification confirmation modal */}
            {notifToDelete && (
                (() => {
                    const targetNotif = customNotifications.find(n => n.id === notifToDelete);
                    if (!targetNotif) return null;
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                            <div className="max-w-sm w-full bg-[#121214] p-6 rounded-2xl border border-white/10 relative text-center">
                                <button onClick={() => setNotifToDelete(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                                <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white">Delete Notification?</h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    Are you sure you want to delete the notification:{" "}
                                    <span className="font-bold text-white">"{targetNotif.message}"</span> at{" "}
                                    <span className="font-bold text-white">{targetNotif.time}</span>? This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <Button className="flex-1 bg-white/5 text-white hover:bg-white/10" onClick={() => setNotifToDelete(null)}>Cancel</Button>
                                    <Button className="flex-1 bg-rose-500 text-white hover:bg-rose-600" onClick={() => {
                                        updateCollege({ customNotifications: customNotifications.filter(n => n.id !== notifToDelete) });
                                        sound.playError();
                                        setNotifToDelete(null);
                                    }}>Delete</Button>
                                </div>
                            </div>
                        </div>
                    );
                })()
            )}
        </div>
    );
});
NotificationsSection.displayName = 'NotificationsSection';
