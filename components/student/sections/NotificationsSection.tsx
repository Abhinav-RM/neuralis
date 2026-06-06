import React, { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Bell, Clock, CheckSquare, BookOpen, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { sound } from '../../../utils/sound';

interface NotificationsSectionProps {
    assignments: any[];
    exams: any[];
    customNotifications: any[];
    updateCollege: (u: any) => void;
}

export const NotificationsSection = React.memo<NotificationsSectionProps>(({ assignments, exams, customNotifications, updateCollege }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [newNotif, setNewNotif] = useState({ message: '', time: '09:00', repeats: 'once' as any, days: [] as number[] });
    const [notifToDelete, setNotifToDelete] = useState<string | null>(null);

    const handleAdd = () => {
        if (!newNotif.message || !newNotif.time) return;
        updateCollege({
            customNotifications: [...(customNotifications || []), {
                id: Date.now().toString(), message: newNotif.message, time: newNotif.time,
                repeats: newNotif.repeats, days: newNotif.repeats === 'specific-days' ? newNotif.days : undefined, enabled: true
            }]
        });
        setNewNotif({ message: '', time: '09:00', repeats: 'once', days: [] });
        setShowAdd(false);
        sound.playSuccess();
    };

    const toggle = (id: string) => { updateCollege({ customNotifications: customNotifications.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n) }); sound.playClick(); };
    const remove = (id: string) => { setNotifToDelete(id); sound.playClick(); };

    return (
        <div className="space-y-8 max-w-2xl">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg sm:text-2xl font-bold whitespace-nowrap">Custom Notifications</h2>
                <Button 
                    onClick={() => setShowAdd(!showAdd)} 
                    className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm bg-blue-500 hover:bg-blue-600 font-bold whitespace-nowrap shrink-0"
                >
                    {showAdd ? 'Cancel' : 'Add Notification'}
                </Button>
            </div>

            {showAdd && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white/10 rounded-2xl border border-white/20 mb-6 space-y-4">
                    <div className="space-y-2"><label className="text-xs text-gray-400 uppercase font-bold">Message (Emoji allowed)</label><input type="text" value={newNotif.message} onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none" placeholder="e.g. Water Break! 💧" /></div>
                    <div className="space-y-2"><label className="text-xs text-gray-400 uppercase font-bold">Time</label><input type="time" value={newNotif.time} onChange={(e) => setNewNotif({ ...newNotif, time: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none" /></div>
                    <Button onClick={handleAdd} className="w-full font-bold">Save Notification</Button>
                </motion.div>
            )}

            <div className="space-y-4">
                {/* Task & Exam Reminders */}
                <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Task & Exam Reminders</h3>
                    <div className="space-y-3">
                        {[...assignments, ...exams].map(item => {
                            if (!item.reminders || item.reminders.length === 0) return null;
                            return (
                                <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold flex items-center gap-2">
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
                <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><Bell className="text-blue-400" /> General Notifications</h2>
                        <button onClick={() => setShowAdd(!showAdd)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Plus size={20} /></button>
                    </div>
                    {showAdd && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 space-y-4 p-4 bg-black/20 rounded-xl border border-white/5">
                            <div className="space-y-2"><label className="text-xs text-gray-400 uppercase font-bold">Message</label><input type="text" placeholder="Drink water, Take a break..." value={newNotif.message} onChange={(e) => setNewNotif({...newNotif, message: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="text-xs text-gray-400 uppercase font-bold">Time</label><input type="time" value={newNotif.time} onChange={(e) => setNewNotif({...newNotif, time: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                                <div className="space-y-2"><label className="text-xs text-gray-400 uppercase font-bold">Repeats</label>
                                    <select value={newNotif.repeats} onChange={(e) => setNewNotif({...newNotif, repeats: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                                        <option value="once" className="bg-[#121214]">Once</option><option value="twice" className="bg-[#121214]">Twice (2 Days)</option><option value="daily" className="bg-[#121214]">Daily</option><option value="specific-days" className="bg-[#121214]">Specific Days</option>
                                    </select>
                                </div>
                            </div>
                            {newNotif.repeats === 'specific-days' && (
                                <div className="space-y-2"><label className="text-xs text-gray-400 uppercase font-bold">Select Days</label>
                                    <div className="flex justify-between gap-1">
                                        {['S','M','T','W','T','F','S'].map((day, i) => (
                                            <button key={i} onClick={() => { const days = newNotif.days.includes(i) ? newNotif.days.filter(d => d !== i) : [...newNotif.days, i]; setNewNotif({...newNotif, days}); }}
                                                className={clsx("w-8 h-8 rounded-lg text-xs font-bold transition-colors", newNotif.days.includes(i) ? "bg-blue-500 text-white" : "bg-black/40 text-gray-400 border border-white/5")}>{day}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <Button onClick={handleAdd} className="w-full py-2">Set Notification</Button>
                        </motion.div>
                    )}
                    <div className="space-y-4">
                        {(customNotifications || []).length === 0 ? (<div className="text-center py-12 text-gray-500 italic bg-white/5 rounded-2xl border border-white/5">No custom notifications set.</div>) : (
                            customNotifications.map((notif) => (
                                <div key={notif.id} className={clsx("p-4 rounded-2xl border flex items-center justify-between transition-all", notif.enabled ? "bg-white/5 border-white/20" : "bg-black/20 border-white/5 opacity-50")}>
                                    <div className="flex items-center gap-4">
                                        <div className={clsx("p-3 rounded-xl", notif.enabled ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-500")}><Clock size={20} /></div>
                                        <div><h4 className="font-bold text-white">{notif.message}</h4><div className="flex items-center gap-2 mt-1"><p className="text-xs text-gray-400 font-medium">{notif.time}</p><span className="text-[10px] uppercase px-1.5 py-0.5 bg-white/5 rounded text-gray-500 font-bold border border-white/5">{notif.repeats || 'once'}</span></div></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => toggle(notif.id)} className={clsx("w-10 h-6 rounded-full relative transition-colors", notif.enabled ? "bg-blue-500" : "bg-white/10")}><div className={clsx("w-4 h-4 rounded-full bg-white absolute top-1 transition-transform", notif.enabled ? "translate-x-5" : "translate-x-1")} /></button>
                                        <button onClick={() => remove(notif.id)} className="p-2 text-gray-500 hover:text-rose-400 transition-colors"><Trash2 size={16} /></button>
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
