import React, { useState, useRef } from 'react';
import clsx from 'clsx';
import { Lock, GraduationCap, Edit2, RotateCcw, AlertCircle, ChevronDown, ChevronUp, User, Download, Upload, X, Check, Copy } from 'lucide-react';
import { Button } from '../../ui/Button';
import { sound } from '../../../utils/sound';
import { APP_VERSION } from '../../../constants';
import { validateBackupSchema } from '../../../utils/schemaValidator';
import { useApp } from '../../../context/AppContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

interface SettingsSectionProps {
    state: any;
    updateState: (u: any) => void;
    updateCustomization: (u: any) => void;
    updateCollege: (u: any) => void;
    monthsToRender: { label: string; value: number; year: number }[];
    selectedMonths: number[];
    toggleMonth: (monthIdx: number, year: number) => void;
    handleReset: () => void;
    handleFactoryReset: () => void;
    themePresets: any[];
    importData: (data: any) => void;
}

export const SettingsSection = React.memo<SettingsSectionProps>(({
    state, updateState, updateCustomization, updateCollege,
    monthsToRender, selectedMonths, toggleMonth,
    handleReset, handleFactoryReset, themePresets, importData
}) => {
    const { resetAll } = useApp();
    const [isAttCollapsed, setIsAttCollapsed] = useState(true);
    const [isCustCollapsed, setIsCustCollapsed] = useState(true);
    
    const [updateInfo, setUpdateInfo] = useState<any>(() => {
        if (typeof window !== 'undefined') {
            return (window as any).neuralisUpdateInfo || null;
        }
        return null;
    });

    React.useEffect(() => {
        const handleUpdateInfoChanged = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setUpdateInfo(detail);
        };
        window.addEventListener('update-info-changed', handleUpdateInfoChanged);
        return () => {
            window.removeEventListener('update-info-changed', handleUpdateInfoChanged);
        };
    }, []);

    const [presetsOpen, setPresetsOpen] = useState(true);
    const [colorsOpen, setColorsOpen] = useState(true);
    const [fontsOpen, setFontsOpen] = useState(true);
    const [bgOpen, setBgOpen] = useState(true);

    const [copied, setCopied] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [pendingImportData, setPendingImportData] = useState<any | null>(null);
    const [pastedBackup, setPastedBackup] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const importFileInputRef = useRef<HTMLInputElement>(null);
    const [showRequestPermissionModal, setShowRequestPermissionModal] = useState(false);
    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    const handleUploadClick = () => {
        sound.playClick();
        if (cust.storagePermission !== 'granted') {
            setShowRequestPermissionModal(true);
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                sound.playError();
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target?.result as string;
                updateCustomization({
                    backgroundImage: base64String
                });
                sound.playSuccess();
            };
            reader.onerror = () => {
                sound.playError();
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("Image upload stream failure:", err);
            sound.playError();
        } finally {
            e.target.value = '';
        }
    };

    const requestSystemPermission = async () => {
        const isNative = Capacitor.isNativePlatform();
        if (isNative) {
            try {
                const permission = await LocalNotifications.requestPermissions();
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

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target?.result as string);
                    if (validateBackupSchema(parsed)) {
                        setPendingImportData(parsed);
                        setImportError(null);
                    } else {
                        setImportError('Invalid or corrupted backup schema structure.');
                        sound.playError();
                    }
                } catch (err) {
                    setImportError('Failed to parse JSON backup file.');
                    sound.playError();
                }
            };
            reader.onerror = () => {
                setImportError('Failed to read system file stream.');
                sound.playError();
            };
            reader.readAsText(file);
        } catch (outerErr) {
            console.error("Critical file import stream failure:", outerErr);
            setImportError('System file selector access failed.');
            sound.playError();
        } finally {
            e.target.value = '';
        }
    };

    const handleExport = async () => {
        try {
            const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform();
            
            if (isNative) {
                sound.playClick();
                await Share.share({
                    title: 'Neuralis Backup',
                    text: JSON.stringify(state),
                    dialogTitle: 'Export App Data Backup'
                });
                sound.playSuccess();
            } else {
                // Web browser always downloads standard file directly to local Downloads folder
                const backupJson = JSON.stringify(state, null, 2);
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(backupJson);
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `neuralis_backup_${state.userName || 'user'}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
                sound.playSuccess();
            }
        } catch (err) {
            console.error("Export failed:", err);
            sound.playError();
        }
    };

    const handleCopyBackup = () => {
        try {
            navigator.clipboard.writeText(JSON.stringify(state));
            setCopied(true);
            sound.playSuccess();
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            sound.playError();
        }
    };

    const handlePasteImport = () => {
        try {
            const parsed = JSON.parse(pastedBackup);
            if (validateBackupSchema(parsed)) {
                setPendingImportData(parsed);
                setImportError(null);
                setPastedBackup('');
            } else {
                setImportError('Invalid or corrupted backup schema structure.');
                sound.playError();
            }
        } catch (err) {
            setImportError('Failed to parse pasted backup code.');
            sound.playError();
        }
    };

    const cust = state.customization;

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
                <button onClick={() => setIsAttCollapsed(!isAttCollapsed)} className="w-full flex items-center justify-between mb-4 group gap-2">
                    <h3 className="text-xs sm:text-lg font-bold flex items-center gap-2 text-left whitespace-nowrap overflow-hidden text-ellipsis">
                        <GraduationCap className="text-blue-400 shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="truncate">Combined Attendance Selection</span>
                    </h3>
                    {isAttCollapsed ? (
                        <ChevronDown className="text-gray-500 group-hover:text-white transition-colors shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                        <ChevronUp className="text-gray-500 group-hover:text-white transition-colors shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                    )}
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
                <button onClick={() => { setIsCustCollapsed(!isCustCollapsed); sound.playClick(); }} className="w-full flex items-center justify-between group gap-2">
                    <h3 className="text-xs sm:text-lg font-bold flex items-center gap-2 text-left text-white whitespace-nowrap overflow-hidden text-ellipsis">
                        <Edit2 className="text-blue-400 shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="truncate">Customization Panel</span>
                    </h3>
                    {isCustCollapsed ? (
                        <ChevronDown className="text-gray-500 group-hover:text-white transition-colors shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                        <ChevronUp className="text-gray-500 group-hover:text-white transition-colors shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                    )}
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
                                            updateCustomization({ 
                                                accentColor: preset.accentColor, 
                                                gradientStart: preset.gradientStart, 
                                                gradientMiddle: preset.gradientMiddle, 
                                                gradientEnd: preset.gradientEnd, 
                                                blur: preset.blur 
                                            }); sound.playSuccess();
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
                                                <input type="color" value={cust.accentColor} onChange={(e) => updateCustomization({ accentColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 bg-transparent cursor-pointer" />
                                                <span className="text-sm font-mono text-gray-300 uppercase">{cust.accentColor}</span>
                                            </div>
                                        </div>
                                        <div><label className="text-xs font-medium text-gray-400 block mb-2">Greetings Text Color</label>
                                            <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-xl border border-white/5">
                                                <input type="color" value={cust.greetingsColor || '#ffffff'} onChange={(e) => updateCustomization({ greetingsColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 bg-transparent cursor-pointer" />
                                                <span className="text-sm font-mono text-gray-300 uppercase">{cust.greetingsColor || 'DEFAULT'}</span>
                                                {cust.greetingsColor ? (
                                                    <button onClick={() => { updateCustomization({ greetingsColor: '' }); sound.playClick(); }} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase ml-auto">Reset</button>
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
                                                    onClick={() => { updateCustomization({ greetingsCasing: caseOption }); sound.playClick(); }}
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
                                        <select value={cust.logoFont || 'sekuya'} onChange={(e) => { updateCustomization({ logoFont: e.target.value }); sound.playClick(); }} className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm font-medium text-gray-300 focus:outline-none focus:border-blue-500 animate-none">
                                            <option value="sekuya" className="bg-[#121214] text-white">Sekuya (Original Cyber)</option><option value="mono" className="bg-[#121214] text-white">Share Tech Mono (Console Tech)</option><option value="grotesk" className="bg-[#121214] text-white">Space Grotesk (Modern Geometric)</option><option value="fascinate" className="bg-[#121214] text-white">Fascinate Inline (Stylized Art Deco)</option><option value="cinzel-dec" className="bg-[#121214] text-white">Cinzel Decorative (Classic Serif)</option><option value="orbitron" className="bg-[#121214] text-white">Orbitron (Futuristic Display)</option>
                                        </select></div>
                                    <div><label className="text-xs font-medium text-gray-400 block mb-2">Greetings & Section Headers Font Style</label>
                                        <select value={cust.greetingsFont || 'outfit'} onChange={(e) => { updateCustomization({ greetingsFont: e.target.value }); sound.playClick(); }} className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm font-medium text-gray-300 focus:outline-none focus:border-blue-500 animate-none">
                                            <option value="outfit" className="bg-[#121214] text-white">Outfit (Elegant Geometric)</option><option value="orbitron" className="bg-[#121214] text-white">Orbitron (Futuristic Sci-Fi)</option><option value="grotesk" className="bg-[#121214] text-white">Space Grotesk (Symmetrical Sans)</option><option value="fascinate" className="bg-[#121214] text-white">Fascinate Inline (Artistic Neon)</option><option value="cinzel" className="bg-[#121214] text-white">Cinzel (Classic Roman)</option><option value="rajdhani" className="bg-[#121214] text-white">Rajdhani (Technical Square)</option>
                                        </select></div>
                                    <div><label className="text-xs font-medium text-gray-400 block mb-2">Universal Body & Content Font Style</label>
                                        <select value={cust.bodyFont || 'jakarta'} onChange={(e) => { updateCustomization({ bodyFont: e.target.value }); sound.playClick(); }} className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm font-medium text-gray-300 focus:outline-none focus:border-blue-500 animate-none">
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
                                            <button onClick={() => { updateCustomization({ gradientStart: '#0a0a0c', gradientMiddle: '#0e131f', gradientEnd: '#0a0a0c' }); sound.playClick(); }} className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[10px] font-bold text-blue-300 rounded-lg transition-colors uppercase tracking-wider">Default Blue-Noir</button>
                                            <button onClick={() => { updateCustomization({ gradientStart: '#000000', gradientMiddle: '#000000', gradientEnd: '#000000' }); sound.playClick(); }} className="px-2.5 py-1.5 bg-black/40 hover:bg-black/60 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white rounded-lg transition-colors uppercase tracking-wider">Pure Black</button>
                                        </div>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-400">Set Solid Background Color</span>
                                            <div className="flex items-center gap-3">
                                                <input type="color" value={cust.gradientStart === cust.gradientEnd ? cust.gradientStart : '#0a0a0c'} onChange={(e) => { const c = e.target.value; updateCustomization({ gradientStart: c, gradientMiddle: c, gradientEnd: c }); }} className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer" />
                                                <span className="text-xs font-mono text-gray-300 uppercase">{cust.gradientStart === cust.gradientEnd ? cust.gradientStart : 'Custom Gradient'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Custom Gradient Stops (Fine Control)</span>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['gradientStart','gradientMiddle','gradientEnd'] as const).map((key, i) => (
                                                <div key={key}><span className="text-[10px] text-gray-500 block mb-1">{['Start','Middle','End'][i]} Color</span>
                                                    <input type="color" value={cust[key]} onChange={(e) => updateCustomization({ [key]: e.target.value })} className="w-full h-10 rounded-lg bg-black/20 border border-white/5 cursor-pointer" /></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-white/5 space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Background Image</label>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    accept="image/*" 
                                                    onChange={handleImageUpload} 
                                                    className="hidden" 
                                                />
                                                <Button 
                                                    onClick={handleUploadClick} 
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 text-xs flex items-center gap-2 animate-fade-in"
                                                >
                                                    <Upload size={14} /> Select Local Photo
                                                </Button>
                                                {cust.backgroundImage && (
                                                    <Button 
                                                        variant="danger" 
                                                        onClick={() => {
                                                            updateCustomization({ backgroundImage: null });
                                                            sound.playSuccess();
                                                        }} 
                                                        className="py-2 px-4 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30"
                                                    >
                                                        Remove Image
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        {cust.backgroundImage && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-[10px] text-gray-500 block mb-1">Background Blur ({cust.blur}px)</label><input type="range" min="0" max="40" value={cust.blur} onChange={(e) => updateCustomization({ blur: parseInt(e.target.value) })} className="w-full accent-blue-500" /></div>
                                                <div><label className="text-[10px] text-gray-500 block mb-1">Zoom ({cust.bgZoom}%)</label><input type="range" min="50" max="200" value={cust.bgZoom} onChange={(e) => updateCustomization({ bgZoom: parseInt(e.target.value) })} className="w-full accent-blue-500" /></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* App Feedback (Sound & Vibration) */}
                                    <div className="pt-3 border-t border-white/5 space-y-3">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">App Tones & Haptics</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* Sound toggle */}
                                            <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl">
                                                <div>
                                                    <span className="text-xs font-bold text-white block">Click Sounds</span>
                                                    <span className="text-[10px] text-gray-500">Play feedback sound effects</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newVal = cust.soundEnabled === false;
                                                        updateCustomization({ soundEnabled: newVal });
                                                        if (newVal) {
                                                            setTimeout(() => sound.playClick(), 50);
                                                        }
                                                    }}
                                                    className={clsx(
                                                        "w-10 h-6 rounded-full p-1 transition-colors duration-200 outline-none flex items-center",
                                                        cust.soundEnabled !== false ? "bg-blue-600" : "bg-white/10"
                                                    )}
                                                >
                                                    <div className={clsx(
                                                        "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200",
                                                        cust.soundEnabled !== false ? "translate-x-4" : "translate-x-0"
                                                    )} />
                                                </button>
                                            </div>

                                            {/* Vibration toggle */}
                                            <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl">
                                                <div>
                                                    <span className="text-xs font-bold text-white block">Vibration / Haptics</span>
                                                    <span className="text-[10px] text-gray-500">Vibrate device on interactions</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newVal = cust.vibrationEnabled === false;
                                                        updateCustomization({ vibrationEnabled: newVal });
                                                        if (newVal && navigator.vibrate) {
                                                            try { navigator.vibrate(20); } catch (e) {}
                                                        }
                                                    }}
                                                    className={clsx(
                                                        "w-10 h-6 rounded-full p-1 transition-colors duration-200 outline-none flex items-center",
                                                        cust.vibrationEnabled !== false ? "bg-blue-600" : "bg-white/10"
                                                    )}
                                                >
                                                    <div className={clsx(
                                                        "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200",
                                                        cust.vibrationEnabled !== false ? "translate-x-4" : "translate-x-0"
                                                    )} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Restore Defaults */}
                        <div className="pt-4 border-t border-white/5 flex justify-end">
                            <Button variant="secondary" onClick={() => {
                                sound.playClick();
                                setShowResetConfirmModal(true);
                            }} className="text-xs">Restore to Default</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Change Display Name */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold flex items-center gap-2"><User size={20} className="text-blue-400" /> Change Name</h3>
                    <Button variant="secondary" className="bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20" onClick={handleReset}>Change Name</Button>
                </div>
                <p className="text-gray-400 text-sm">Update your display name for dashboard greetings while preserving all your academic records.</p>
            </div>

            {/* App Updates */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Download size={18} className="text-blue-400 rotate-180 shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-white">App Updates</h3>
                        {updateInfo ? (
                            <div className="flex flex-col gap-0.5 mt-0.5">
                                <p className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Update Available: v{updateInfo.version}
                                </p>
                                <p className="text-gray-500 text-[10px]">
                                    Current Version: v{APP_VERSION}
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-[11px] mt-0.5">
                                Current Version: <span className="font-mono text-white font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">v{APP_VERSION}</span> • Checks for targeted OTA updates.
                            </p>
                        )}
                    </div>
                </div>
                {updateInfo ? (
                    <Button 
                        variant="secondary" 
                        className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20 text-[11px] font-semibold py-1.5 px-3 whitespace-nowrap self-start sm:self-auto animate-pulse" 
                        onClick={() => {
                            sound.playClick();
                            window.dispatchEvent(new CustomEvent('show-update-modal'));
                        }}
                    >
                        View Details
                    </Button>
                ) : (
                    <Button 
                        variant="secondary" 
                        className="bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20 text-[11px] font-semibold py-1.5 px-3 whitespace-nowrap self-start sm:self-auto" 
                        onClick={() => {
                            sound.playClick();
                            window.dispatchEvent(new CustomEvent('check-for-updates'));
                        }}
                    >
                        Check for Updates
                    </Button>
                )}
            </div>

            {/* Backup & Restore */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-1"><Download size={20} className="text-emerald-400" /> Backup & Restore</h3>
                    <p className="text-gray-400 text-sm">Export your profile data, attendance history, and settings to a JSON file, or restore a previously saved backup.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Export Card */}
                    <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-3">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Export Data</h4>
                        <p className="text-xs text-gray-500 font-medium">Save your current dashboard state, history, and customization choices.</p>
                        <div className="flex flex-col gap-2 pt-2">
                            <Button 
                                onClick={handleExport} 
                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 text-xs"
                            >
                                <Download size={14} /> Export Backup File
                            </Button>
                            <Button 
                                onClick={handleCopyBackup} 
                                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold py-2 text-xs"
                            >
                                {copied ? <Check size={14} className="text-emerald-400" /> : <Edit2 size={14} />} 
                                {copied ? "Code Copied!" : "Copy Backup Code"}
                            </Button>
                        </div>
                    </div>

                    {/* Import Card */}
                    <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-3">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Import Data</h4>
                        <p className="text-xs text-gray-500 font-medium font-medium">Upload a backup file or paste your backup JSON code to restore your profile.</p>
                        <div className="flex flex-col gap-2 pt-2">
                            <Button 
                                onClick={() => {
                                    sound.playClick();
                                    importFileInputRef.current?.click();
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 text-xs"
                            >
                                <Upload size={14} /> Import Backup File
                            </Button>
                            <input 
                                type="file" 
                                ref={importFileInputRef}
                                accept=".json,application/json" 
                                onChange={handleFileImport} 
                                className="hidden" 
                            />
                            
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Or paste backup code..."
                                    value={pastedBackup}
                                    onChange={(e) => setPastedBackup(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:border-blue-500 outline-none text-white"
                                />
                                <Button 
                                    onClick={handlePasteImport}
                                    disabled={!pastedBackup.trim()}
                                    className="bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {importError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2 mt-2">
                        <AlertCircle size={14} />
                        <span>{importError}</span>
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/20 rounded-2xl overflow-hidden">
                <div className="p-6 bg-red-500/5">
                    <h3 className="text-red-400 font-bold flex items-center gap-2 mb-2"><AlertCircle size={20} /> Danger Zone</h3>
                    <p className="text-gray-400 text-sm mb-6">Permanently delete all data and reset the application. This action cannot be undone.</p>
                    <div className="flex gap-3">
                        <Button variant="danger" onClick={handleFactoryReset}>Factory Reset</Button>
                        <Button 
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                            onClick={() => {
                                resetAll();
                                window.location.reload();
                            }}
                        >
                            check
                        </Button>
                    </div>
                </div>
            </div>



            {/* Backup Import Confirmation Modal */}
            {pendingImportData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="max-w-sm w-full bg-[#121214] p-6 rounded-2xl border border-white/10 relative text-center">
                        <button onClick={() => setPendingImportData(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Import Backup?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            This will overwrite all current settings, attendance history, and profile records with the backup for{" "}
                            <span className="font-bold text-white">"{pendingImportData.userName || 'Unknown'}"</span>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button className="flex-1 bg-white/5 text-white hover:bg-white/10" onClick={() => setPendingImportData(null)}>Cancel</Button>
                            <Button className="flex-1 bg-blue-500 text-white hover:bg-blue-600" onClick={() => {
                                importData(pendingImportData);
                                setPendingImportData(null);
                                window.location.reload();
                            }}>Import</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permission Request Modal from Settings */}
            {showRequestPermissionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="max-w-sm w-full bg-[#121214] p-6 rounded-2xl border border-white/10 relative text-center shadow-2xl">
                        <button onClick={() => setShowRequestPermissionModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Storage Access Required</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            Neuralis requires storage access to pick custom background photos from your device. Would you like to grant permission now?
                        </p>
                        <div className="flex gap-3">
                            <Button className="flex-1 bg-white/5 text-white hover:bg-white/10" onClick={() => setShowRequestPermissionModal(false)}>Cancel</Button>
                             <Button className="flex-1 bg-blue-500 text-white hover:bg-blue-600" onClick={async () => {
                                 const granted = await requestSystemPermission();
                                 updateCustomization({
                                     storagePermission: granted ? 'granted' : 'denied'
                                 });
                                 setShowRequestPermissionModal(false);
                                 if (granted) {
                                     sound.playSuccess();
                                     setTimeout(() => {
                                         fileInputRef.current?.click();
                                     }, 100);
                                 } else {
                                     sound.playError();
                                 }
                             }}>Grant</Button>
                        </div>
                    </div>
                </div>
            )}

            {showResetConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mb-4 mx-auto">
                            <RotateCcw size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white text-center">Restore Defaults?</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed text-center">
                            This will reset your theme colors, gradients, font family choices, blur filters, haptics, and background images back to factory defaults.
                        </p>
                        <div className="flex gap-3">
                            <Button className="flex-1 bg-white/5 text-white hover:bg-white/10" onClick={() => { sound.playClick(); setShowResetConfirmModal(false); }}>Cancel</Button>
                            <Button className="flex-1 bg-rose-500 text-white hover:bg-rose-600" onClick={() => {
                                 updateCustomization({
                                     accentColor: '#3b82f6',
                                     blur: 10,
                                     gradientStart: '#0a0a0c',
                                     gradientMiddle: '#0e131f',
                                     gradientEnd: '#0a0a0c',
                                     fontStyle: 'default',
                                     logoFont: 'sekuya',
                                     greetingsFont: 'outfit',
                                     bodyFont: 'jakarta',
                                     backgroundImage: null,
                                     bgZoom: 100,
                                     bgX: 50,
                                     bgY: 50,
                                     soundEnabled: true,
                                     vibrationEnabled: true,
                                     storagePermission: cust.storagePermission || 'prompt'
                                 });
                                 setShowResetConfirmModal(false);
                                 sound.playSuccess();
                             }}>Reset</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Mobile Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="max-w-sm w-full bg-[#121214] p-6 rounded-2xl border border-white/10 relative text-center shadow-2xl">
                        <button 
                            onClick={() => {
                                sound.playClick();
                                setShowExportModal(false);
                            }} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20}/>
                        </button>
                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Download size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">Export Backup Options</h3>
                        <p className="text-gray-400 text-xs leading-relaxed mb-6 text-left">
                            Due to Android WebView security restrictions, direct file downloads are disabled inside the mobile app. 
                            <br/><br/>
                            You can copy the data to your clipboard and paste it directly on the Import card. 
                            Alternatively, if you want the actual file, copy this code, paste it into the Web version of Neuralis, and export it as a file there.
                        </p>
                        <div className="flex gap-3">
                            <Button 
                                className="flex-1 bg-white/5 text-white hover:bg-white/10 text-xs font-semibold py-2.5" 
                                onClick={() => {
                                    sound.playClick();
                                    setShowExportModal(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="flex-1 bg-blue-500 text-white hover:bg-blue-600 text-xs font-semibold py-2.5" 
                                onClick={async () => {
                                    try {
                                        const backupJson = JSON.stringify(state, null, 2);
                                        await navigator.clipboard.writeText(backupJson);
                                        sound.playSuccess();
                                    } catch (err) {
                                        sound.playError();
                                    }
                                    setShowExportModal(false);
                                }}
                            >
                                Copy Backup Code
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
SettingsSection.displayName = 'SettingsSection';
