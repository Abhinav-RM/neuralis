class SoundEngine {
    private context: AudioContext | null = null;
    private enabled: boolean = true;
    private initialized: boolean = false;

    private checkPreferences(): { sound: boolean, vibrate: boolean } {
        try {
            const raw = localStorage.getItem('lifeAthleteOS_v2');
            if (raw) {
                const parsed = JSON.parse(raw);
                const cust = parsed?.football?.customization;
                const sound = cust?.soundEnabled !== false;
                const vibrate = cust?.vibrationEnabled !== false;
                return { sound, vibrate };
            }
        } catch (e) {
            // fallback
        }
        return { sound: true, vibrate: true };
    }

    private initContext() {
        if (this.initialized) return;
        this.initialized = true;
        try {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
    }

    private async ensureContext() {
        const prefs = this.checkPreferences();
        if (!prefs.sound) return false;
        if (!this.enabled) return false;
        if (!this.initialized) this.initContext();
        if (!this.context) return false;
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
        return true;
    }

    private async playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
        if (!(await this.ensureContext()) || !this.context) return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.context.currentTime);
        
        gain.gain.setValueAtTime(vol, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + duration);
    }

    public playClick() {
        const prefs = this.checkPreferences();
        if (prefs.vibrate) {
            try {
                if (navigator.vibrate) {
                    navigator.vibrate(15);
                }
            } catch (e) {}
        }
        if (prefs.sound) {
            this.playTone(800, 'sine', 0.05, 0.05);
        }
    }

    public playSuccess() {
        const prefs = this.checkPreferences();
        if (prefs.vibrate) {
            try {
                if (navigator.vibrate) {
                    navigator.vibrate([30, 50, 30]);
                }
            } catch (e) {}
        }
        if (!prefs.sound) return;
        this.initContext();
        if (!this.context) return;
        this.playTone(440, 'sine', 0.1); 
        setTimeout(() => this.playTone(554, 'sine', 0.1), 100); 
        setTimeout(() => this.playTone(659, 'sine', 0.2), 200); 
    }

    public playError() {
        const prefs = this.checkPreferences();
        if (prefs.vibrate) {
            try {
                if (navigator.vibrate) {
                    navigator.vibrate(100);
                }
            } catch (e) {}
        }
        if (!prefs.sound) return;
        this.initContext();
        if (!this.context) return;
        this.playTone(150, 'sawtooth', 0.2, 0.1);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.3, 0.1), 150);
    }

    public playLevelUp() {
        this.initContext();
        if (!this.context) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; 
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.3, 0.2), i * 100);
        });
    }

    public playCoin() {
        this.initContext();
        if (!this.context) return;
        this.playTone(1200, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1600, 'sine', 0.2, 0.1), 50);
    }

    public playRobotBlip() {
        this.initContext();
        if (!this.context) return;
        const variance = Math.random() * 100;
        this.playTone(800 + variance, 'square', 0.03, 0.02);
    }

    public async playRobotStartup() {
        if (!(await this.ensureContext()) || !this.context) return;
        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.6);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        
        osc.start(now);
        osc.stop(now + 0.6);
    }

    public async playRobotThinking() {
        if (!(await this.ensureContext()) || !this.context) return;
        const now = this.context.currentTime;
        for(let i=0; i<5; i++) {
             const osc = this.context.createOscillator();
             const gain = this.context.createGain();
             osc.connect(gain);
             gain.connect(this.context.destination);
             osc.type = 'square';
             osc.frequency.setValueAtTime(1000 + Math.random()*500, now + i*0.05);
             gain.gain.setValueAtTime(0.05, now + i*0.05);
             gain.gain.exponentialRampToValueAtTime(0.001, now + i*0.05 + 0.03);
             osc.start(now + i*0.05);
             osc.stop(now + i*0.05 + 0.03);
        }
    }

    public playRobotConfirm() {
        this.initContext();
        if (!this.context) return;
        this.playTone(1200, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1800, 'sine', 0.2, 0.1), 80);
    }

    public async playRobotTyping() {
        if (!(await this.ensureContext()) || !this.context) return;
        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.context.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500 + Math.random() * 500, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.02);
    }

    public async playTerminalType() {
        if (!(await this.ensureContext()) || !this.context) return;
        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        // A more "clicky" terminal sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(100 + Math.random() * 50, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
        
        osc.start(now);
        osc.stop(now + 0.01);
    }

    // --- BIO SOUNDS ---
    public async playScan() {
        if (!(await this.ensureContext()) || !this.context) return;
        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.15);
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    public playMedical() {
        this.initContext();
        if (!this.context) return;
        this.playTone(800, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(600, 'sine', 0.3, 0.1), 100);
    }

    public async playHydraulic() {
        if (!(await this.ensureContext()) || !this.context) return;
        const now = this.context.currentTime;
        // White noise burst simulated with low random square waves
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, now);
        osc.frequency.linearRampToValueAtTime(20, now + 0.3);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    public async playHeartbeat() {
        if (!(await this.ensureContext()) || !this.context) return;
        const now = this.context.currentTime;
        
        // Lub
        const osc1 = this.context.createOscillator();
        const gain1 = this.context.createGain();
        osc1.connect(gain1);
        gain1.connect(this.context.destination);
        osc1.frequency.setValueAtTime(60, now);
        osc1.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain1.gain.setValueAtTime(0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc1.start(now);
        osc1.stop(now + 0.1);

        // Dub
        const osc2 = this.context.createOscillator();
        const gain2 = this.context.createGain();
        osc2.connect(gain2);
        gain2.connect(this.context.destination);
        osc2.frequency.setValueAtTime(60, now + 0.2);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain2.gain.setValueAtTime(0.5, now + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc2.start(now + 0.2);
        osc2.stop(now + 0.3);
    }
}

export const sound = new SoundEngine();