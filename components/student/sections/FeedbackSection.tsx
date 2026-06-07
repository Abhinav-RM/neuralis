import React, { useState } from 'react';
import { MessageSquare, Copy, Check } from 'lucide-react';
import { Button } from '../../ui/Button';
import { sound } from '../../../utils/sound';
import { DEV_EMAIL } from '../../../constants';
import { getDeviceId } from '../../../utils/deviceId';
import { Capacitor } from '@capacitor/core';

interface FeedbackSectionProps {
    state: any;
}

export const FeedbackSection = React.memo<FeedbackSectionProps>(({ state }) => {
    const deviceId = getDeviceId();
    const [deviceIdCopied, setDeviceIdCopied] = useState(false);

    const handleCopyDeviceId = () => {
        sound.playClick();
        navigator.clipboard.writeText(deviceId);
        setDeviceIdCopied(true);
        setTimeout(() => setDeviceIdCopied(false), 2000);
    };

    const handleRequestUpdate = () => {
        sound.playClick();
        const subject = encodeURIComponent(`Neuralis Feedback & Update Request - ${state.userName || 'Student'}`);
        const body = encodeURIComponent(
            `Hi Abhinav,\n\n` +
            `Name: ${state.userName || 'Student'}\n` +
            `Device ID: ${deviceId}\n` +
            `Platform: ${Capacitor.isNativePlatform() ? 'Android APK' : 'Web'}\n\n` +
            `--- Write your message below (describe your request, bug report, or feedback, and feel free to attach screenshots) ---\n\n`
        );
        window.location.href = `mailto:${DEV_EMAIL}?subject=${subject}&body=${body}`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <MessageSquare className="text-blue-400" size={24} /> Feedback & Troubleshooting
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                    Get help with your app, report issues, or request tailored system updates.
                </p>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">Request Updates & Report Bugs</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        If you need a specific update targeted to your device, want to report a bug, share feedback, or attach screenshots of issues you've encountered, you can submit a request directly via Gmail.
                    </p>
                </div>

                <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-3">
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Device ID Info</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                            Share this ID with the developer to receive custom updates tailored to your phone.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[12px]">
                        <span className="text-gray-400">Device ID:</span>
                        <span className="font-mono text-white bg-black/40 px-2 py-0.5 rounded border border-white/5 select-all">{deviceId}</span>
                        <button 
                            onClick={handleCopyDeviceId}
                            className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                            title="Copy Device ID"
                        >
                            {deviceIdCopied ? <span className="text-emerald-400 font-bold">Copied!</span> : <Copy size={12} />}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
                    <p className="text-xs text-gray-400 max-w-md font-medium">
                        This button will launch your Gmail client with a pre-formatted template. You can type any additional details and attach any screenshots before sending.
                    </p>
                    <Button 
                        onClick={handleRequestUpdate} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 text-xs whitespace-nowrap self-start sm:self-auto"
                    >
                        Request Update / Send Feedback
                    </Button>
                </div>
            </div>
        </div>
    );
});

FeedbackSection.displayName = 'FeedbackSection';
