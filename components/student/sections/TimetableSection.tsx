import React, { useState } from 'react';
import clsx from 'clsx';
import { Calendar, Lock, Edit2, Save, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { sound } from '../../../utils/sound';

interface TimetableEntry { subjects?: string; isLeave?: boolean; }

interface TimetableSectionProps {
    timetable: Record<number, TimetableEntry>;
    currentDay: number;
    currentHour: number;
    updateCollege: (updates: any) => void;
}

export const TimetableSection = React.memo<TimetableSectionProps>(({
    timetable, currentDay, currentHour, updateCollege
}) => {
    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState(timetable);
    React.useEffect(() => { if (!editing) setLocal(timetable); }, [timetable, editing]);

    return (
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                    <Calendar className="text-blue-400" /> Weekly Timetable
                </h2>
                {editing ? (
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X size={16}/></Button>
                        <Button size="sm" onClick={() => { updateCollege({ timetable: local }); setEditing(false); sound.playSuccess(); }}><Save size={16}/> Save</Button>
                    </div>
                ) : (
                    <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Edit2 size={16}/> Edit</Button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[1,2,3,4,5,6,0].map(dayNum => {
                    const isToday = currentDay === dayNum;
                    const subjects = (local[dayNum]?.subjects || '').split(/[\n,]/).map(s => s.trim()).filter(s => s);
                    const isLeave = local[dayNum]?.isLeave;
                    return (
                        <div key={dayNum} className={clsx("p-4 rounded-xl border transition-all flex flex-col min-h-[160px]", isToday ? "bg-blue-500/10 border-blue-500/30" : "bg-black/20 border-white/5", isLeave && "opacity-60 grayscale-[0.5]")}>
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex flex-col">
                                    <p className={clsx("text-sm font-bold uppercase", isToday ? "text-blue-400" : "text-gray-400")}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayNum]}</p>
                                    {isLeave && <span className="text-[10px] text-rose-400 font-bold uppercase">Holiday</span>}
                                </div>
                                {editing ? (
                                    <button onClick={() => setLocal({...local, [dayNum]: { ...local[dayNum], isLeave: !isLeave }})} className={clsx("p-1.5 rounded-lg transition-colors", isLeave ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-gray-500 hover:text-white")}><Lock size={14} /></button>
                                ) : isToday && !isLeave && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                            </div>
                            {editing ? (
                                <div className="flex flex-col flex-grow gap-2">
                                    <textarea value={local[dayNum]?.subjects || ''} onChange={(e) => setLocal({...local, [dayNum]: { ...local[dayNum], subjects: e.target.value }})} disabled={isLeave} className={clsx("w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm flex-grow resize-none outline-none focus:border-blue-500", isLeave && "opacity-30 cursor-not-allowed")} placeholder="Enter subjects" />
                                    <p className="text-[10px] text-gray-500 italic">Separate subjects by commas</p>
                                </div>
                            ) : (
                                <div className="space-y-2 flex-grow overflow-y-auto no-scrollbar">
                                    {isLeave ? (<div className="flex flex-col items-center justify-center h-full text-gray-600 italic text-xs"><Lock size={20} className="mb-2 opacity-20" />No Classes</div>
                                    ) : subjects.length > 0 ? subjects.map((sub, idx) => {
                                        const isCurrentClass = isToday && currentHour === 8 + idx;
                                        return (<div key={idx} className={clsx("text-xs p-2 rounded-lg flex justify-between items-center", isCurrentClass ? "bg-blue-500 text-white font-bold" : "bg-white/5 text-gray-300")}><span className="truncate">{sub}</span></div>);
                                    }) : (<div className="text-xs text-gray-500 italic">No classes</div>)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
});
TimetableSection.displayName = 'TimetableSection';
