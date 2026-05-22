export class WhiteNoiseSynth {
    private ctx: AudioContext | null = null;
    private noiseSource: AudioBufferSourceNode | null = null;
    private noiseGain: GainNode | null = null;
    private alarmInterval: any = null;
    private alarmOscs: OscillatorNode[] = [];
    private cafeChirpInterval: any = null;
    private activeNoiseType: string = 'none';

    initCtx() {
        if (!this.ctx) {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContextClass();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createNoiseBuffer(type: 'white' | 'pink' | 'brown') {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0.0; // For pink/brown filter states

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;

            if (type === 'white') {
                data[i] = white * 0.15;
            } else if (type === 'pink') {
                // Pink noise filter approximation
                lastOut = (0.997 * lastOut) + (white * 0.085);
                data[i] = lastOut * 0.4;
            } else if (type === 'brown') {
                // Brown noise filter approximation (deep, rich rumble)
                lastOut = (0.99 * lastOut) + (white * 0.05);
                data[i] = lastOut * 0.8;
            }
        }
        return buffer;
    }

    startNoise(type: string) {
        this.initCtx();
        this.stopNoise();

        if (!this.ctx || type === 'none') {
            this.activeNoiseType = 'none';
            return;
        }

        this.activeNoiseType = type;
        this.noiseSource = this.ctx.createBufferSource();
        this.noiseGain = this.ctx.createGain();

        let bufferType: 'white' | 'pink' | 'brown' = 'white';
        if (type === 'rain') bufferType = 'pink'; // rain simulates pink
        if (type === 'cafe') bufferType = 'brown'; // cafe base hum is brown

        const buffer = this.createNoiseBuffer(bufferType);
        if (!buffer) return;

        this.noiseSource.buffer = buffer;
        this.noiseSource.loop = true;

        // Sound filters for specific feels
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';

        if (type === 'rain') {
            // Filter to make it sound more like rain droplets
            filter.frequency.value = 1800; 
            this.noiseGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            
            this.noiseSource.connect(filter);
            filter.connect(this.noiseGain);
        } else if (type === 'cafe') {
            // Low pass rumble for background cafe hum
            filter.frequency.value = 600;
            this.noiseGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

            this.noiseSource.connect(filter);
            filter.connect(this.noiseGain);

            // Add dynamic subtle speech synthesizer chirp nodes to mock chatter
            this.startCafeChirpSynth();
        } else {
            // Standard White noise focus
            filter.frequency.value = 2500;
            this.noiseGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            this.noiseSource.connect(filter);
            filter.connect(this.noiseGain);
        }

        this.noiseGain.connect(this.ctx.destination);
        this.noiseSource.start(0);
    }

    stopNoise() {
        if (this.noiseSource) {
            try {
                this.noiseSource.stop();
            } catch (e) {}
            this.noiseSource = null;
        }
        this.stopCafeChirpSynth();
        this.activeNoiseType = 'none';
    }

    startCafeChirpSynth() {
        this.stopCafeChirpSynth();
        // Generates random low volume speech frequencies every 1-2.5s
        this.cafeChirpInterval = setInterval(() => {
            if (!this.ctx || this.activeNoiseType !== 'cafe') return;
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            // standard vowel base frequencies
            osc.frequency.setValueAtTime(150 + Math.random() * 200, this.ctx.currentTime); 
            
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.008, this.ctx.currentTime + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 1.3);
        }, 1200);
    }

    stopCafeChirpSynth() {
        if (this.cafeChirpInterval) {
            clearInterval(this.cafeChirpInterval);
            this.cafeChirpInterval = null;
        }
    }

    startSirenAlarm() {
        this.initCtx();
        this.stopSirenAlarm();

        if (!this.ctx) return;

        // High frequency police alarm beeping
        let isHigh = false;
        this.alarmInterval = setInterval(() => {
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(isHigh ? 980 : 820, this.ctx.currentTime);
            isHigh = !isHigh;

            gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
            this.alarmOscs.push(osc);
        }, 300);
    }

    stopSirenAlarm() {
        if (this.alarmInterval) {
            clearInterval(this.alarmInterval);
            this.alarmInterval = null;
        }
        this.alarmOscs.forEach(o => {
            try { o.stop(); } catch(e) {}
        });
        this.alarmOscs = [];
    }
}

export const AudioSynth = new WhiteNoiseSynth();
