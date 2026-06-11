import { registerPlugin } from '@capacitor/core';

export interface RingtonePickerPlugin {
    pickRingtone(options?: { existingUri?: string }): Promise<{ uri: string; name: string }>;
}

export const RingtonePicker = registerPlugin<RingtonePickerPlugin>('RingtonePicker');
