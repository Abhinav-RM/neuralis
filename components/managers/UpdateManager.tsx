import React, { useEffect, useState } from 'react';
import { APP_VERSION } from '../../constants';
import { useApp } from '../../context/AppContext';
import { sound } from '../../utils/sound';
import { getDeviceId } from '../../utils/deviceId';

let Capacitor: any = null;
let CapacitorUpdater: any = null;

if (typeof window !== 'undefined') {
    Capacitor = (window as any).Capacitor;
    if (Capacitor?.isNativePlatform()) {
        import('@capgo/capacitor-updater').then((m) => {
            CapacitorUpdater = m.CapacitorUpdater;
        }).catch(err => console.error("Failed to load CapacitorUpdater plugin", err));
    }
}

interface ReleaseInfo {
    version: string;
    body: string;
    zipUrl: string;
    htmlUrl: string;
}

export const UpdateManager: React.FC = () => {
    const { state } = useApp();
    const [updateInfo, setUpdateInfo] = useState<ReleaseInfo | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [status, setStatus] = useState<'idle' | 'downloading' | 'applying' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const isNewerVersion = (current: string, latest: string) => {
        const clean = (v: string) => v.replace(/^v/, '').split('.').map(Number);
        const currParts = clean(current);
        const lateParts = clean(latest);
        for (let i = 0; i < Math.max(currParts.length, lateParts.length); i++) {
            const c = currParts[i] || 0;
            const l = lateParts[i] || 0;
            if (l > c) return true;
            if (c > l) return false;
        }
        return false;
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const checkForUpdates = async (isManual = false) => {
        const now = Date.now();
        const oneHourMs = 60 * 60 * 1000;

        // Load recent check history
        let checksLog: number[] = [];
        try {
            const raw = localStorage.getItem('neuralis_update_checks_log');
            if (raw) {
                checksLog = JSON.parse(raw);
            }
        } catch (e) {}

        // Filter for checks in the last 1 hour
        const recentChecks = checksLog.filter(ts => now - ts < oneHourMs);

        // Safeguard block: if we've checked 50 or more times in the last hour
        if (recentChecks.length >= 50) {
            if (isManual) {
                showToast("Rate limit safeguard active. Try again in an hour.");
            }
            return;
        }

        const isNative = Capacitor && Capacitor.isNativePlatform();

        try {
            if (isManual) {
                showToast("Checking for updates...");
            }
            
            if (!isNative) {
                if (isManual) {
                    setTimeout(() => {
                        showToast(`Neuralis is up to date (v${APP_VERSION})`);
                        sound.playSuccess();
                    }, 800);
                }
                return;
            }
            
            // Fetch the device targets manifest file from Raw GitHub User Content (bypasses REST API rate limit)
            const response = await fetch('https://raw.githubusercontent.com/Abhinav-RM/neuralis/main/device_targets.json');
            if (!response.ok) {
                if (isManual) showToast("Error connecting to update server");
                return;
            }
            
            // Successful API contact: save this check attempt
            recentChecks.push(now);
            localStorage.setItem('neuralis_update_checks_log', JSON.stringify(recentChecks));

            const data = await response.json();
            const deviceId = getDeviceId();
            
            // Find target release for this device, fall back to default
            const targetRelease = data.targets?.[deviceId] || data.default;
            if (!targetRelease) {
                if (isManual) {
                    showToast(`Neuralis is up to date (v${APP_VERSION})`);
                    sound.playSuccess();
                }
                return;
            }

            const latestVersion = targetRelease.version;
            const body = targetRelease.body || 'No release notes provided.';
            const htmlUrl = targetRelease.htmlUrl || 'https://github.com/Abhinav-RM/neuralis/releases';
            const zipUrl = targetRelease.zipUrl;

            if (isNewerVersion(APP_VERSION, latestVersion)) {
                const info = {
                    version: latestVersion,
                    body,
                    zipUrl,
                    htmlUrl
                };
                setUpdateInfo(info);
                if (typeof window !== 'undefined') {
                    (window as any).neuralisUpdateInfo = info;
                    window.dispatchEvent(new CustomEvent('update-info-changed', { detail: info }));
                }
                
                // If this version was previously dismissed with "Later", do not auto-popup
                const ignoredVersion = localStorage.getItem('neuralis_ignored_update_version');
                if (ignoredVersion === latestVersion && !isManual) {
                    return;
                }

                setShowModal(true);
                sound.playLevelUp();
            } else if (isManual) {
                showToast(`Neuralis is up to date (v${APP_VERSION})`);
                sound.playSuccess();
            }
        } catch (e) {
            console.error("Failed to check for updates:", e);
            if (isManual) showToast("Could not complete update check");
        }
    };

    useEffect(() => {
        // Run auto check on launch after a small delay to avoid competing with startup
        const timer = setTimeout(() => {
            checkForUpdates(false);
        }, 5000);

        // Listen for manual check trigger from settings
        const handleManualCheck = () => {
            checkForUpdates(true);
        };

        const handleShowModal = () => {
            if (typeof window !== 'undefined' && (window as any).neuralisUpdateInfo) {
                setUpdateInfo((window as any).neuralisUpdateInfo);
                setShowModal(true);
            }
        };

        window.addEventListener('check-for-updates', handleManualCheck);
        window.addEventListener('show-update-modal', handleShowModal);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('check-for-updates', handleManualCheck);
            window.removeEventListener('show-update-modal', handleShowModal);
        };
    }, []);

    const handleUpdate = async () => {
        if (!updateInfo) return;
        sound.playClick();

        const isNative = Capacitor?.isNativePlatform();

        if (!isNative) {
            // Web browser fallback: Redirect to release page
            window.open(updateInfo.htmlUrl, '_blank');
            setShowModal(false);
            return;
        }

        if (!CapacitorUpdater || !updateInfo.zipUrl) {
            setStatus('error');
            showToast("Update plugin or zip asset missing");
            return;
        }

        try {
            setStatus('downloading');
            setProgress(0);

            // Listen for download progress
            const progressListener = await CapacitorUpdater?.addListener(
                'download',
                (data: { percent: number }) => {
                    setProgress(Math.round(data.percent));
                }
            );

            // Download update bundle
            const versionData = await CapacitorUpdater.download({
                url: updateInfo.zipUrl,
                version: updateInfo.version,
            });

            if (progressListener) {
                progressListener.remove();
            }

            setStatus('applying');
            
            // Reload the app using the new bundle
            await CapacitorUpdater.set(versionData);
            
        } catch (err) {
            console.error("Update download/install failed:", err);
            setStatus('error');
            sound.playError();
            showToast("Failed to apply update");
        }
    };

    if (!showModal) {
        // Render simple toast notifier if present
        if (toastMessage) {
            return (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 99999,
                    backgroundColor: 'rgba(18, 18, 22, 0.9)',
                    backdropFilter: 'blur(12px)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '99px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    animation: 'fade-in 0.2s ease-out'
                }}>
                    {toastMessage}
                </div>
            );
        }
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="max-w-md w-full bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="text-center mb-4 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down-to-line"><path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide uppercase">Update Available</h2>
                    <p className="text-xs text-gray-400 mt-1">Version {updateInfo?.version} is ready for installation</p>
                </div>

                {/* Release Notes */}
                <div className="flex-1 overflow-y-auto mb-6 pr-1 bg-white/5 rounded-xl p-4 border border-white/5 text-sm leading-relaxed max-h-[40vh]">
                    <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider text-blue-400">What's New:</h4>
                    <div className="text-gray-300 whitespace-pre-wrap font-sans break-words text-xs">
                        {updateInfo?.body}
                    </div>
                </div>

                {/* Progress Indicator for Native Downloads */}
                {status !== 'idle' && (
                    <div className="mb-4 bg-white/5 rounded-xl p-4 border border-white/5 flex-shrink-0 text-center">
                        {status === 'downloading' && (
                            <>
                                <p className="text-xs text-gray-400 mb-2 font-medium">Downloading assets... {progress}%</p>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </>
                        )}
                        {status === 'applying' && (
                            <p className="text-xs text-blue-400 font-medium animate-pulse">Installing update and restarting...</p>
                        )}
                        {status === 'error' && (
                            <p className="text-xs text-red-400 font-medium">An error occurred during install. Please try again.</p>
                        )}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 mt-auto flex-shrink-0">
                    {status === 'idle' ? (
                        <>
                            <button
                                onClick={() => {
                                    if (updateInfo) {
                                        localStorage.setItem('neuralis_ignored_update_version', updateInfo.version);
                                    }
                                    setShowModal(false);
                                    sound.playClick();
                                }}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                            >
                                Later
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                            >
                                Update Now
                            </button>
                        </>
                    ) : status === 'error' ? (
                        <button
                            onClick={() => {
                                setStatus('idle');
                                setShowModal(false);
                            }}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl text-sm font-semibold transition-all"
                        >
                            Close
                        </button>
                    ) : null}
                </div>

            </div>
        </div>
    );
};
