import React, { useState } from 'react';
import clsx from 'clsx';
import { Lock, GraduationCap, Edit2, RotateCcw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../ui/Button';
import { sound } from '../../../utils/sound';

interface SettingsSectionProps {
    state: any;
    updateState: (u: any) => void;
    updateFootball: (u: any) => void;
    updateCollege: (u: any) => void;
    monthsToRender: { label: string; value: number; year: number }[];
    selectedMonths: number[];
    toggleMonth: (monthIdx: number, year: number) => void;
    handleReset: () => void;
    handleFactoryReset: () => void;
    themePresets: any[];
}

export const SettingsSection = React.memo<SettingsSectionProps>(({
    state, updateState, updateFootball, updateCollege,
    monthsToRender, selectedMonths, toggleMonth,
    handleReset, handleFactoryReset, themePresets
}) => {
    const [isAttCollapsed, setIsAttCollapsed] = useState(true);
    const [isCustCollapsed, setIsCustCollapsed] = useState(true);
    const [presetsOpen, setPresetsOpen] = useState(true);
    const [colorsOpen, setColorsOpen] = useState(true);
    const [fontsOpen, setFontsOpen] = useState(true);
    const [bgOpen, setBgOpen] = useState(true);

    const cust = state.football.customization;

    return (
        <div className="space-y-8 max-w-2xl">
            <h2 className="text-2xl font-bold">Settings</h2>

            {/* Midnight Lock */}
            <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Lock size={20} className="text-blue-400" /> Midnight Lock</h3>
                    <button onClick={() => { updateState({ midnightLock: !state.midnightLock }); sound.playClick(); }}
                        className={clsx("w-12 h-6 rounded-full transition-colors relative", state.midnightLock ? "bg-blue-500" : "bg-white/10")}>
                        <div className={clsx("w-4 h-4 rounded-full bg-white absolute top-1 transition-transform", state.midnightLock ? "translate-x-7" : "translate-x-1")} />
                    </button>
                </div>
                <p className="text-gray-400 text-sm">Locks records at 12:00 AM. Today's entries remain editable until midnight.</p>
            </div>

            {/* Combined Attendance Selection */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <button onClick={() => setIsAttCollapsed(!isAttCollapsed)} className="w-full flex items-center justify-between mb-4 group">
                    <h3 className="text-lg font-bold flex items-center gap-2"><GraduationCap size={20} className="text-blue-400" /> Combined Attendance Selection</h3>
                    {isAttCollapsed ? <ChevronDown size={20} className="text-gray-500 group-hover:text-white transition-colors" /> : <ChevronUp size={20} className="text-gray-500 group-hover:text-white transition-colors" />}
                </button>
                {!isAttCollapsed && (<>
                    <p className="text-sm text-gray-400 mb-6">Select multiple months to see your total average attendance across your entire academic period.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {monthsToRender.map((m) => {
                            const id = m.value + (m.year * 12);
                            return (<button key={id} onClick={() => toggleMonth(m.value, m.year)}
                                className={clsx("p-3 rounded-xl border text-sm font-medium transition-all text-center",
                                    selectedMonths.includes(id) ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-black/20 border-white/5 text-gray-500 hover:border-white/10"
                                )}>{m.label}</button>);
                        })}
                    </div>
                </>)}
            </div>

            {/* Customization Panel */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <button onClick={() => { setIsCustCollapsed(!isCustCollapsed); sound.playClick(); }} className="w-full flex items-center justify-between group">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-white"><Edit2 size={20} className="text-blue-400" /> Customization Panel</h3>
                    {isCustCollapsed ? <ChevronDown size={20} className="text-gray-500 group-hover:text-white transition-colors" /> : <ChevronUp size={20} className="text-gray-500 group-hover:text-white transition-colors" />}
                </button>
                {!isCustCollapsed && (
                    <div className="space-y-6 pt-4 border-t border-white/5">
                        {/* Quick Theme Presets */}
                        <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-4">
                            <button onClick={() => { setPresetsOpen(!presetsOpen); sound.playClick(); }} className="w-full flex items-center justify-between font-bold text-xs text-gray-400 uppercase tracking-wider block">
                                <span>Quick Theme Presets</span>{presetsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {presetsOpen && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
                                    {themePresets.map((preset) => (
                                        <button key={preset.name} onClick={() => {
                                            updateFootball({ customization: { 
                                                ...cust, 
                                                accentColor: preset.accentColor, 
                                                gradientStart: preset.gradientStart, 
                                                gradientMiddle: preset.gradientMiddle, 
                                                gradientEnd: preset.gradientEnd, 
                                                blur: preset.blur 
                                            }}); sound.playSuccess();
                                        }} className="p-3 bg-black/35 hover:bg-black/50 border border-white/5 hover:border-white/20 rounded-xl flex flex-col items-center gap-2 transition-all group">
                                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${preset.gradientStart} 0%, ${preset.gradientMiddle} 50%, ${preset.gradientEnd} 100%)` }}>
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.accentColor }} />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-300 group-hover:text-white text-center">{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Theme Colors */}
                        <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-4">
                            <button onClick={() => { setColorsOpen(!colorsOpen); sound.playClick(); }} className="w-full flex items-center justify-between font-bold text-xs text-gray-400 uppercase tracking-wider block">
                                <span>Theme Colors</span>{colorsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {colorsOpen && (
                                <div className="space-y-4 pt-2 border-t border-white/5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="text-xs font-medium text-gray-400 block mb-2">Accent Theme Color</label>
                                            <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-xl border border-white/5">
                                                <input type="color" value={cust.accentColor} onChange={(e) => updateFootball({ customization: { ...cust, accentColor: e.target.value } })} className="w-10 h-10 rounded-lg border-0 bg-transparent cursor-pointer" />
                                                <span className="text-sm font-mono text-gray-300 uppercase">{cust.accentColor}</span>
                                            </div>
                                        </div>
                                        <div><label className="text-xs font-medium text-gray-400 block mb-2">Greetings Text Color</label>
                                            <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-xl border border-white/5">
                                                <input type="color" value={cust.greetingsColor || '#ffffff'} onChange={(e) => updateFootball({ customization: { ...cust, greetingsColor: e.target.value } })} className="w-10 h-10 rounded-lg border-0 bg-transparent cursor-pointer" />
                                                <span className="text-sm font-mono text-gray-300 uppercase">{cust.greetingsColor || 'DEFAULT'}</span>
                                                {cust.greetingsColor ? (
                                                    <button onClick={() => { updateFootball({ customization: { ...cust, greetingsColor: '' } }); sound.playClick(); }} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase ml-auto">Reset</button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    <div><label className="text-xs font-medium text-gray-400 block mb-2">Greetings Text Case (Prefix)</label>
                                        <div className="flex gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                                            {(['caps', 'small', 'mix'] as const).map((caseOption) => (
                                                <button
                                                    key={caseOption}
                                                    type="button"
                                                    onClick={() => { updateFootball({ customization: { ...cust, greetingsCasing: caseOption } }); sound.playClick(); }}
                                                    className={clsx(
                                                        "flex-1 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border",
                                                        (cust.greetingsCasing || 'caps') === caseOption
                                                            ? "bg-blue-500/20 border-blue-500/30 text-blue-400 font-bold shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                                                            : "bg-transparent border-transparent text-gray-400 hover:text-white"
                                                    )}
                                                >
                                                    {caseOption}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Typography */}
                        <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-4">
                            <button onClick={() => { setFontsOpen(!fontsOpen); sound.playClick(); }} className="w-full flex items-center justify-between font-bold text-xs text-gray-400 uppercase tracking-wider block">
                                <span>Typography Settings</span>{fontsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {fontsOpen && (
                                <div className="space-y-4 pt-2 border-t border-white/5">
                                    <div><label className="text-xs font-medium text-gray-400 block mb-2">Logo & Branding Font Style</label>
                                        <select value={cust.logoFont || 'sekuya'} onChange={(e) => { updateFootball({ customization: { ...cust, logoFont: e.target.value } }); sound.playClick(); }} className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm font-medium text-gray-300 focus:outline-none focus:border-blue-500 animate-none">
                                            <option value="sekuya" className="bg-[#121214] text-white">Sekuya (Original Cyber)</option><option value="mono" className="bg-[#121214] text-white">Share Tech Mono (Console Tech)</option><option value="grotesk" className="bg-[#121214] text-white">Space Grotesk (Modern Geometric)</option><option value="fascinate" className="bg-[#121214] text-white">Fascinate Inline (Stylized Art Deco)</option><option value="cinzel-dec" className="bg-[#121214] text-white">Cinzel Decorative (Classic Serif)</option><option value="orbitron" className="bg-[#121214] text-white">Orbitron (Futuristic Display)</option>
                                        </select></div>
                                    <div><label className="text-xs font-medium text-gray-400 block mb-2">Greetings & Section Headers Font Style</label>
                                        <select value={cust.greetingsFont || 'outfit'} onChange={(e) => { updateFootball({ customization: { ...cust, greetingsFont: e.target.value } }); sound.playClick(); }} className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm font-medium text-gray-300 focus:outline-none focus:border-blue-500 animate-none">
                                            <option value="outfit" className="bg-[#121214] text-white">Outfit (Elegant Geometric)</option><option value="orbitron" className="bg-[#121214] text-white">Orbitron (Futuristic Sci-Fi)</option><option value="grotesk" className="bg-[#121214] text-white">Space Grotesk (Symmetrical Sans)</option><option value="fascinate" className="bg-[#121214] text-white">Fascinate Inline (Artistic Neon)</option><option value="cinzel" className="bg-[#121214] text-white">Cinzel (Classic Roman)</option><option value="rajdhani" className="bg-[#121214] text-white">Rajdhani (Technical Square)</option>
                                        </select></div>
                                    <div><label className="text-xs font-medium text-gray-400 block mb-2">Universal Body & Content Font Style</label>
                                        <select value={cust.bodyFont || 'jakarta'} onChange={(e) => { updateFootball({ customization: { ...cust, bodyFont: e.target.value } }); sound.playClick(); }} className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm font-medium text-gray-300 focus:outline-none focus:border-blue-500 animate-none">
                                            <option value="jakarta" className="bg-[#121214] text-white">Plus Jakarta Sans (Balanced UI)</option><option value="rajdhani" className="bg-[#121214] text-white">Rajdhani (Tech Compact)</option><option value="archivo" className="bg-[#121214] text-white">Archivo (High-Legibility Grotesque)</option><option value="grotesk" className="bg-[#121214] text-white">Space Grotesk (Geometric Sans)</option><option value="honk" className="bg-[#121214] text-white">Honk (Playful Color Font)</option><option value="lora" className="bg-[#121214] text-white">Lora (Sophisticated Serif)</option>
                                        </select></div>
                                    <p className="text-[10px] text-gray-500 italic">Note: Preset selections will align typography dynamically. You can adjust individually as needed.</p>
                                </div>
                            )}
                        </div>

                        {/* Background */}
                        <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-4">
                            <button onClick={() => { setBgOpen(!bgOpen); sound.playClick(); }} className="w-full flex items-center justify-between font-bold text-xs text-gray-400 uppercase tracking-wider block">
                                <span>Background & Backdrop Styling</span>{bgOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {bgOpen && (
                                <div className="space-y-4 pt-2 border-t border-white/5">
                                    <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                        <span className="text-xs text-gray-400">Default Themes:</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => { updateFootball({ customization: { ...cust, gradientStart: '#0a0a0c', gradientMiddle: '#0e131f', gradientEnd: '#0a0a0c' } }); sound.playClick(); }} className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[10px] font-bold text-blue-300 rounded-lg transition-colors uppercase tracking-wider">Default Blue-Noir</button>
                                            <button onClick={() => { updateFootball({ customization: { ...cust, gradientStart: '#000000', gradientMiddle: '#000000', gradientEnd: '#000000' } }); sound.playClick(); }} className="px-2.5 py-1.5 bg-black/40 hover:bg-black/60 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white rounded-lg transition-colors uppercase tracking-wider">Pure Black</button>
                                        </div>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-400">Set Solid Background Color</span>
                                            <div className="flex items-center gap-3">
                                                <input type="color" value={cust.gradientStart === cust.gradientEnd ? cust.gradientStart : '#0a0a0c'} onChange={(e) => { const c = e.target.value; updateFootball({ customization: { ...cust, gradientStart: c, gradientMiddle: c, gradientEnd: c } }); }} className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer" />
                                                <span className="text-xs font-mono text-gray-300 uppercase">{cust.gradientStart === cust.gradientEnd ? cust.gradientStart : 'Custom Gradient'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Custom Gradient Stops (Fine Control)</span>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['gradientStart','gradientMiddle','gradientEnd'] as const).map((key, i) => (
                                                <div key={key}><span className="text-[10px] text-gray-500 block mb-1">{['Start','Middle','End'][i]} Color</span>
                                                    <input type="color" value={cust[key]} onChange={(e) => updateFootball({ customization: { ...cust, [key]: e.target.value } })} className="w-full h-10 rounded-lg bg-black/20 border border-white/5 cursor-pointer" /></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-white/5 space-y-3">
                                        <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Background Image URL (Optional)</label>
                                            <input type="text" placeholder="https://images.unsplash.com/photo-..." value={cust.backgroundImage || ''} onChange={(e) => updateFootball({ customization: { ...cust, backgroundImage: e.target.value || null } })} className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm font-medium text-gray-300 focus:outline-none focus:border-blue-500" /></div>
                                        {cust.backgroundImage && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-[10px] text-gray-500 block mb-1">Background Blur ({cust.blur}px)</label><input type="range" min="0" max="40" value={cust.blur} onChange={(e) => updateFootball({ customization: { ...cust, blur: parseInt(e.target.value) } })} className="w-full accent-blue-500" /></div>
                                                <div><label className="text-[10px] text-gray-500 block mb-1">Zoom ({cust.bgZoom}%)</label><input type="range" min="50" max="200" value={cust.bgZoom} onChange={(e) => updateFootball({ customization: { ...cust, bgZoom: parseInt(e.target.value) } })} className="w-full accent-blue-500" /></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Restore Defaults */}
                        <div className="pt-4 border-t border-white/5 flex justify-end">
                            <Button variant="secondary" onClick={() => {
                                updateFootball({ customization: { accentColor: '#3b82f6', blur: 10, gradientStart: '#0a0a0c', gradientMiddle: '#0e131f', gradientEnd: '#0a0a0c', fontStyle: 'default', logoFont: 'sekuya', greetingsFont: 'outfit', bodyFont: 'jakarta', backgroundImage: null, bgZoom: 100, bgX: 50, bgY: 50 } });
                                sound.playSuccess();
                            }} className="text-xs">Restore to Default</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reset Profile */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold flex items-center gap-2"><RotateCcw size={20} className="text-amber-400" /> Reset Profile</h3>
                    <Button variant="secondary" className="bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20" onClick={handleReset}>Reset Profile</Button>
                </div>
                <p className="text-gray-400 text-sm">Reset your onboarding profile name while preserving all your academic records.</p>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/20 rounded-2xl overflow-hidden">
                <div className="p-6 bg-red-500/5">
                    <h3 className="text-red-400 font-bold flex items-center gap-2 mb-2"><AlertCircle size={20} /> Danger Zone</h3>
                    <p className="text-gray-400 text-sm mb-6">Permanently delete all data and reset the application. This action cannot be undone.</p>
                    <Button variant="danger" onClick={handleFactoryReset}>Factory Reset</Button>
                </div>
            </div>
        </div>
    );
});
SettingsSection.displayName = 'SettingsSection';
