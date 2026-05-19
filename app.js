/**
 * FocusLock - Core Application JavaScript Engine
 * Author: Antigravity AI
 * Description: Fully integrated state manager, SPA router, Web Audio synthesizer,
 *              countdown controller with browser lock enforcement, and dynamic SVG chart renderer.
 */

// ==========================================================================
// 1. STATE MANAGER & PERSISTENCE (AppStateManager)
// ==========================================================================
class AppStateManager {
    constructor() {
        this.STORAGE_KEY = 'focuslock_app_state_v1';
        this.state = this.getDefaultState();
        this.loadState();
    }

    getDefaultState() {
        // High quality mock data representing 5 days of prior focus logs
        const now = new Date();
        const getPastDateStr = (daysAgo) => {
            const date = new Date(now);
            date.setDate(now.getDate() - daysAgo);
            return date.toISOString().split('T')[0];
        };

        const mockSessions = [
            // 5 Days Ago
            { id: 'mock-1', subject: '코딩', date: getPastDateStr(5), duration: 90, status: 'SUCCESS' },
            { id: 'mock-2', subject: '수학', date: getPastDateStr(5), duration: 60, status: 'SUCCESS' },
            // 4 Days Ago
            { id: 'mock-3', subject: '영어', date: getPastDateStr(4), duration: 50, status: 'SUCCESS' },
            { id: 'mock-4', subject: '코딩', date: getPastDateStr(4), duration: 50, status: 'SUCCESS' },
            // 3 Days Ago
            { id: 'mock-5', subject: '수학', date: getPastDateStr(3), duration: 90, status: 'SUCCESS' },
            // 2 Days Ago
            { id: 'mock-6', subject: '국어', date: getPastDateStr(2), duration: 50, status: 'SUCCESS' },
            { id: 'mock-7', subject: '코딩', date: getPastDateStr(2), duration: 90, status: 'SUCCESS' },
            // 1 Day Ago
            { id: 'mock-8', subject: '영어', date: getPastDateStr(1), duration: 30, status: 'SUCCESS' },
            { id: 'mock-9', subject: '코딩', date: getPastDateStr(1), duration: 60, status: 'SUCCESS' },
            { id: 'mock-10', subject: '수학', date: getPastDateStr(1), duration: 50, status: 'SUCCESS' }
        ];

        return {
            user: {
                nickname: '홍길동 님',
                email: 'focus@example.com',
                dailyGoal: 120, // default 120 minutes
                streak: 5,
                maxStreak: 5,
                alarmEnabled: true
            },
            subjects: ['국어', '영어', '수학', '코딩'],
            sessions: mockSessions,
            currentSession: null
        };
    }

    loadState() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                this.state = JSON.parse(raw);
            } else {
                this.saveState();
            }
        } catch (e) {
            console.error('Error loading state from localStorage:', e);
            this.state = this.getDefaultState();
        }
    }

    saveState() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error('Error saving state to localStorage:', e);
        }
    }

    addSession(subject, duration, isLocked, status) {
        const newSession = {
            id: 'session-' + Date.now(),
            subject: subject,
            date: new Date().toISOString().split('T')[0],
            duration: duration,
            isLocked: isLocked,
            status: status // 'SUCCESS' or 'FAILED'
        };
        
        this.state.sessions.push(newSession);

        if (status === 'SUCCESS') {
            // Update Streak logic
            this.state.user.streak += 1;
            if (this.state.user.streak > this.state.user.maxStreak) {
                this.state.user.maxStreak = this.state.user.streak;
            }
        } else {
            // Failed/Give up resets streak
            this.state.user.streak = 0;
        }

        this.saveState();
        return newSession;
    }

    resetStreak() {
        this.state.user.streak = 0;
        this.saveState();
    }

    clearAllData() {
        this.state = this.getDefaultState();
        this.state.sessions = [];
        this.state.user.streak = 0;
        this.state.user.maxStreak = 0;
        this.saveState();
    }
}

const Store = new AppStateManager();


// ==========================================================================
// 2. WEB AUDIO SYNTHESIZER (WhiteNoiseSynth & Alarms)
// ==========================================================================
class WhiteNoiseSynth {
    constructor() {
        this.ctx = null;
        this.noiseSource = null;
        this.noiseGain = null;
        this.alarmInterval = null;
        this.alarmOscs = [];
        this.activeNoiseType = 'none';
    }

    initCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createNoiseBuffer(type) {
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

    startNoise(type) {
        this.initCtx();
        this.stopNoise();

        if (type === 'none') {
            this.activeNoiseType = 'none';
            return;
        }

        this.activeNoiseType = type;
        this.noiseSource = this.ctx.createBufferSource();
        this.noiseGain = this.ctx.createGain();

        let bufferType = 'white';
        if (type === 'rain') bufferType = 'pink'; // rain simulates pink
        if (type === 'cafe') bufferType = 'brown'; // cafe base hum is brown

        this.noiseSource.buffer = this.createNoiseBuffer(bufferType);
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

const AudioSynth = new WhiteNoiseSynth();


// ==========================================================================
// 3. SPA ROUTER (Router)
// ==========================================================================
class AppRouter {
    constructor() {
        this.screens = document.querySelectorAll('.screen');
        this.bottomNav = document.getElementById('bottomNavBar');
        this.navItems = document.querySelectorAll('.bottom-nav .nav-item');
        
        this.initEvents();
    }

    initEvents() {
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const screenId = item.getAttribute('data-screen');
                this.navigateTo(screenId);
            });
        });
    }

    navigateTo(screenId) {
        // Toggle Active Screen
        this.screens.forEach(screen => {
            if (screen.id === screenId) {
                screen.classList.add('active');
            } else {
                screen.classList.remove('active');
            }
        });

        // Update Bottom Nav active state
        this.navItems.forEach(item => {
            if (item.getAttribute('data-screen') === screenId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Toggle Nav Bar Visibility
        const hideNavBarScreens = ['splash', 'login', 'timer', 'settings', 'completion'];
        if (hideNavBarScreens.includes(screenId)) {
            this.bottomNav.style.display = 'none';
        } else {
            this.bottomNav.style.display = 'flex';
        }

        // Trigger hooks based on page entries
        this.onPageEnter(screenId);
    }

    onPageEnter(screenId) {
        if (screenId === 'home') {
            App.renderHomeScreen();
        } else if (screenId === 'stats') {
            ChartEngine.renderAllCharts();
        } else if (screenId === 'mypage') {
            App.renderMyPage();
        }
    }
}


// ==========================================================================
// 4. COUNTDOWN TIMER CONTROLLER (TimerController)
// ==========================================================================
class TimerController {
    constructor() {
        this.timeLeftSeconds = 0;
        this.totalGoalSeconds = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.activeSubject = '';
        this.lockModeEnabled = false;
        this.isTimerActive = false;

        // SVG ring dimensions
        this.circleStrokeLength = 691; // 2 * PI * r = 2 * 3.14159 * 110
        this.fillCircle = document.getElementById('timerFillCircle');
        this.timerDisplay = document.getElementById('timerDisplayDigits');
        
        this.initEvents();
    }

    initEvents() {
        // Lock Mode event listener for blur and tab visibility change
        window.addEventListener('blur', () => this.handleLockModeViolation());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleLockModeViolation();
            }
        });
    }

    start(subject, minutes, lockEnabled) {
        this.activeSubject = subject;
        this.totalGoalSeconds = minutes * 60;
        this.timeLeftSeconds = this.totalGoalSeconds;
        this.lockModeEnabled = lockEnabled;
        this.isPaused = false;
        this.isTimerActive = true;

        document.getElementById('timerSubjectTag').innerText = `과목: ${subject}`;
        
        // Enter Fullscreen if Lock Mode is selected
        if (this.lockModeEnabled) {
            this.requestFullscreen();
        }

        // Trigger White Noise audio loop
        const selectedSound = App.getSelectedSound();
        AudioSynth.startNoise(selectedSound);

        this.updateCircleProgress();
        this.updateDisplayDigits();

        // Start 1 second countdown tick
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.tick(), 1000);
    }

    tick() {
        if (this.isPaused) return;

        this.timeLeftSeconds--;
        this.updateCircleProgress();
        this.updateDisplayDigits();

        if (this.timeLeftSeconds <= 0) {
            this.completeSession();
        }
    }

    pause() {
        if (!this.isTimerActive) return;
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('btnPauseTimer');
        
        if (this.isPaused) {
            btn.innerText = '계속하기';
            btn.style.borderColor = 'var(--accent-cyan)';
            btn.style.color = 'var(--accent-cyan)';
            AudioSynth.stopNoise();
        } else {
            btn.innerText = '일시정지';
            btn.style.borderColor = 'var(--glass-border)';
            btn.style.color = 'var(--text-pure)';
            
            const selectedSound = App.getSelectedSound();
            AudioSynth.startNoise(selectedSound);
        }
    }

    stop() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.isTimerActive = false;
        AudioSynth.stopNoise();
        this.exitFullscreen();
    }

    completeSession() {
        this.stop();
        const minutesFocused = Math.round(this.totalGoalSeconds / 60);
        
        // Save focus record as Successful
        Store.addSession(this.activeSubject, minutesFocused, this.lockModeEnabled, 'SUCCESS');
        
        // Setup completion page parameters
        document.getElementById('completeFocusTimeText').innerText = `${minutesFocused}분 집중 완료`;
        document.getElementById('completeStreakText').innerText = `${Store.state.user.streak}일째`;
        document.getElementById('completePointText').innerText = `+${minutesFocused * 3} XP`;
        
        // Open Screen and launch celebratory particles
        Router.navigateTo('completion');
        Confetti.launch();
    }

    giveUpSession() {
        this.stop();
        
        // Register Failed Session & reset streak
        const minutesFocused = Math.round((this.totalGoalSeconds - this.timeLeftSeconds) / 60);
        Store.addSession(this.activeSubject, minutesFocused, this.lockModeEnabled, 'FAILED');
        
        // Route to Home Dash
        Router.navigateTo('home');
    }

    handleLockModeViolation() {
        // Only trigger lock warning if lockMode is checked, timer is actively counting down, and not paused
        if (!this.lockModeEnabled || !this.isTimerActive || this.isPaused) return;

        // Sound Alarm and overlay warning
        AudioSynth.startSirenAlarm();
        document.getElementById('penaltyOverlay').classList.add('active');
        
        // Freeze timer inside lock screen until returned
        this.isPaused = true;

        // Reset streak inside state manager as penalty
        Store.resetStreak();
        App.renderHomeScreen();
    }

    dismissLockModeViolation() {
        document.getElementById('penaltyOverlay').classList.remove('active');
        AudioSynth.stopSirenAlarm();
        
        // Re-enter Fullscreen and resume
        if (this.lockModeEnabled) {
            this.requestFullscreen();
        }
        
        this.isPaused = false;
    }

    updateCircleProgress() {
        const percentElapsed = (this.totalGoalSeconds - this.timeLeftSeconds) / this.totalGoalSeconds;
        const offset = this.circleStrokeLength - (percentElapsed * this.circleStrokeLength);
        this.fillCircle.style.strokeDashoffset = offset;
    }

    updateDisplayDigits() {
        const mins = Math.floor(this.timeLeftSeconds / 60);
        const secs = this.timeLeftSeconds % 60;
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        this.timerDisplay.innerText = formatted;
    }

    requestFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.fullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
}

const Timer = new TimerController();


// ==========================================================================
// 5. INTERACTIVE SVG CHARTS ENGINE (ChartRenderer)
// ==========================================================================
class ChartRenderer {
    renderAllCharts() {
        this.renderWeeklyBarChart();
        this.renderSubjectDonutChart();
        this.renderStatsTextMetrics();
    }

    renderWeeklyBarChart() {
        const container = document.getElementById('barChartContainer');
        container.innerHTML = ''; // Clear

        // 7 days ago to today calculation
        const now = new Date();
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const chartData = [];

        // Build last 7 days metrics
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const label = days[date.getDay()];

            // Accumulate success session durations on this day
            const dailyDuration = Store.state.sessions
                .filter(s => s.date === dateStr && s.status === 'SUCCESS')
                .reduce((acc, curr) => acc + curr.duration, 0);

            chartData.push({ label, value: dailyDuration });
        }

        const maxVal = Math.max(...chartData.map(d => d.value), 60); // min ceiling is 60 minutes for proportions
        const svgWidth = 340;
        const svgHeight = 160;
        const barPadding = 16;
        const barWidth = (svgWidth - (barPadding * 8)) / 7;

        let barsSvg = '';
        chartData.forEach((d, i) => {
            const barHeight = (d.value / maxVal) * 110;
            const x = barPadding + i * (barWidth + barPadding);
            const y = 130 - barHeight;

            // Bar column
            barsSvg += `
                <!-- Background column tracker -->
                <rect x="${x}" y="20" width="${barWidth}" height="110" rx="4" fill="rgba(255,255,255,0.02)"/>
                
                <!-- Glowing foreground bar -->
                <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="url(#barGrad)"/>
                
                <!-- Text tooltips -->
                <text x="${x + barWidth/2}" y="${y - 6}" font-size="9" fill="${d.value > 0 ? 'var(--accent-cyan)' : 'var(--text-dark)'}" font-weight="700" text-anchor="middle">
                    ${d.value > 0 ? d.value + 'm' : ''}
                </text>
                
                <!-- X axis weekday labels -->
                <text x="${x + barWidth/2}" y="148" font-size="11" fill="var(--text-muted)" font-weight="500" text-anchor="middle">
                    ${d.label}
                </text>
            `;
        });

        const svgCode = `
            <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="var(--accent-cyan)" />
                        <stop offset="100%" stop-color="var(--accent-purple)" />
                    </linearGradient>
                </defs>
                
                <!-- Ground grid horizontal floor line -->
                <line x1="10" y1="130" x2="${svgWidth - 10}" y2="130" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
                
                ${barsSvg}
            </svg>
        `;
        container.innerHTML = svgCode;
    }

    renderSubjectDonutChart() {
        const container = document.getElementById('donutChartContainer');
        container.innerHTML = ''; // Clear

        const subjectTimes = {};
        let totalFocusTime = 0;

        // Calculate time per subject
        Store.state.sessions
            .filter(s => s.status === 'SUCCESS')
            .forEach(s => {
                subjectTimes[s.subject] = (subjectTimes[s.subject] || 0) + s.duration;
                totalFocusTime += s.duration;
            });

        // Fallback placeholder if no studies exist
        if (totalFocusTime === 0) {
            container.innerHTML = `<span style="font-size:0.85rem; color:var(--text-muted);">아직 성공한 집중 세션이 없습니다.</span>`;
            return;
        }

        const chartColors = ['#00e1ff', '#8b5cf6', '#ff4e50', '#00ff88', '#f9d423'];
        const slices = [];
        let index = 0;
        for (const [subj, time] of Object.entries(subjectTimes)) {
            slices.push({
                label: subj,
                value: time,
                percent: time / totalFocusTime,
                color: chartColors[index % chartColors.length]
            });
            index++;
        }

        // Draw SVG Donut paths
        const radius = 50;
        const strokeWidth = 12;
        const center = 80;
        const circumference = 2 * Math.PI * radius; // 314.159

        let currentOffset = 0;
        let donutPaths = '';
        let legendsSvg = '';

        slices.forEach((slice, i) => {
            const strokeDash = slice.percent * circumference;
            const strokeOffset = circumference - strokeDash + currentOffset;
            
            donutPaths += `
                <circle cx="${center}" cy="${center}" r="${radius}" fill="none"
                        stroke="${slice.color}" stroke-width="${strokeWidth}"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${strokeOffset}"
                        stroke-linecap="round" />
            `;
            currentOffset -= strokeDash;

            // Draw accompanying label legend lists
            const legendY = 32 + (i * 20);
            legendsSvg += `
                <circle cx="160" cy="${legendY - 4}" r="5" fill="${slice.color}"/>
                <text x="172" y="${legendY}" font-size="10.5" font-weight="600" fill="var(--text-pure)">
                    ${slice.label}
                </text>
                <text x="280" y="${legendY}" font-size="10.5" font-weight="700" fill="var(--text-muted)" text-anchor="end">
                    ${Math.round(slice.percent * 100)}% (${slice.value}m)
                </text>
            `;
        });

        const svgCode = `
            <svg width="100%" height="100%" viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg">
                <!-- Center hole background shadow -->
                <circle cx="${center}" cy="${center}" r="${radius}" fill="var(--bg-deep)"/>
                
                <!-- Silent Base track ring -->
                <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="${strokeWidth}" />
                
                ${donutPaths}
                
                <!-- Central Total metric text -->
                <text x="${center}" y="${center - 3}" font-size="8.5" font-weight="600" fill="var(--text-muted)" text-anchor="middle">
                    총 시간
                </text>
                <text x="${center}" y="${center + 11}" font-size="13" font-weight="800" fill="var(--text-pure)" text-anchor="middle">
                    ${totalFocusTime}분
                </text>
                
                ${legendsSvg}
            </svg>
        `;
        container.innerHTML = svgCode;
    }

    renderStatsTextMetrics() {
        const successSessions = Store.state.sessions.filter(s => s.status === 'SUCCESS');
        
        // Total Focus Minutes
        const totalMin = successSessions.reduce((acc, curr) => acc + curr.duration, 0);
        document.getElementById('statsTotalFocus').innerText = `${totalMin.toLocaleString()}분`;

        // Average focus time
        const avgSession = successSessions.length > 0 
            ? Math.round(totalMin / successSessions.length) 
            : 0;
        document.getElementById('statsAvgSession').innerText = `${avgSession}분`;

        // Favorite subject
        const subjectFrequencies = {};
        successSessions.forEach(s => {
            subjectFrequencies[s.subject] = (subjectFrequencies[s.subject] || 0) + 1;
        });
        
        let bestSubject = '없음';
        let maxFreq = 0;
        for (const [subj, freq] of Object.entries(subjectFrequencies)) {
            if (freq > maxFreq) {
                maxFreq = freq;
                bestSubject = subj;
            }
        }
        document.getElementById('statsBestSubject').innerText = bestSubject;

        // Max Streak
        document.getElementById('statsMaxStreak').innerText = `${Store.state.user.maxStreak}일`;
    }
}

const ChartEngine = new ChartRenderer();


// ==========================================================================
// 6. CANVAS CELEBRATORY CONFETTI ENGINE (ConfettiGenerator)
// ==========================================================================
class ConfettiGenerator {
    constructor() {
        this.canvas = document.getElementById('confettiCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationFrameId = null;
        this.isRunning = false;
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    launch() {
        this.resizeCanvas();
        this.particles = [];
        this.isRunning = true;

        const colors = ['#00e1ff', '#8b5cf6', '#ff4e50', '#00ff88', '#f9d423'];

        // Seed 120 confetti chips
        for (let i = 0; i < 120; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * -100 - 20,
                r: Math.random() * 6 + 4,
                d: Math.random() * this.canvas.height,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.random() * 10 - 5,
                tiltAngleIncremental: Math.random() * 0.07 + 0.02,
                tiltAngle: 0,
                speedY: Math.random() * 2 + 3,
                speedX: Math.random() * 2 - 1
            });
        }

        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let activeCount = 0;

        this.particles.forEach(p => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(p.tiltAngle) * 0.5;
            p.tilt = Math.sin(p.tiltAngle - (p.r / 2)) * 10;

            if (p.y <= this.canvas.height + 20) {
                activeCount++;
            }

            this.ctx.beginPath();
            this.ctx.lineWidth = p.r;
            this.ctx.strokeStyle = p.color;
            this.ctx.moveTo(p.x + p.tilt + (p.r / 2), p.y);
            this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + (p.r / 2));
            this.ctx.stroke();
        });

        if (activeCount > 0) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        } else {
            this.stop();
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

let Confetti;


// ==========================================================================
// 7. PRIMARY CORE CONTROLLER & EVENT INITIALIZATION (App)
// ==========================================================================
class AppCore {
    constructor() {
        this.selectedSubject = '코딩';
        this.selectedSound = 'none';
        this.selectedDuration = 50;

        // Long Press variables
        this.longPressTimer = null;
        this.longPressStart = 0;
        this.longPressDuration = 3000; // 3 seconds confirm threshold
        this.longPressActive = false;
    }

    init() {
        // Instantiate child system managers
        window.Router = new AppRouter();
        Confetti = new ConfettiGenerator();

        this.registerEvents();
        this.runSplashLoader();
    }

    runSplashLoader() {
        setTimeout(() => {
            // Check session. Mock auto log in if credentials exist
            if (Store.state.user.nickname) {
                Router.navigateTo('home');
            } else {
                Router.navigateTo('login');
            }
        }, 2200);
    }

    registerEvents() {
        // 7.1. Authentication Switch Mode (Login <=> Sign up)
        const linkSwitch = document.getElementById('linkSwitchMode');
        let isSignup = false;
        
        linkSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            isSignup = !isSignup;
            
            const authTitle = document.getElementById('authTitle');
            const authSub = document.getElementById('authSubtitle');
            const nickGroup = document.getElementById('nickGroup');
            const btnSubmit = document.getElementById('btnAuthSubmit');
            const switchText = document.getElementById('authSwitchText');

            if (isSignup) {
                authTitle.innerText = '회원가입';
                authSub.innerText = '나만의 공부 루틴을 지금 시작해 보세요.';
                nickGroup.style.display = 'block';
                btnSubmit.innerText = '회원가입 완료';
                switchText.innerHTML = '이미 가입하셨나요? <a href="#" id="linkSwitchMode">로그인</a>';
            } else {
                authTitle.innerText = '로그인';
                authSub.innerText = '포커스락과 함께 공부 루틴을 만들어보세요.';
                nickGroup.style.display = 'none';
                btnSubmit.innerText = '로그인';
                switchText.innerHTML = '아직 회원이 아니신가요? <a href="#" id="linkSwitchMode">회원가입</a>';
            }

            // Re-bind click event to newly written link
            this.registerSwitchRebind();
        });

        // 7.2. Submit Authentication Form
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const pass = document.getElementById('authPass').value;
            const nickname = document.getElementById('authNick').value || '도전자';

            // simple validation check
            if (pass.length < 8) {
                const passErr = document.getElementById('passError');
                passErr.innerText = '비밀번호는 8자 이상 입력해야 합니다.';
                passErr.style.display = 'block';
                return;
            }

            // Save to State
            Store.state.user.nickname = nickname + ' 님';
            Store.state.user.email = email;
            Store.saveState();

            Router.navigateTo('home');
        });

        // 7.3. Quick trigger from Home Dashboard to Study Config Settings screen
        document.getElementById('btnLaunchStudy').addEventListener('click', () => {
            this.renderSettingsScreen();
            Router.navigateTo('settings');
        });

        // 7.4. Preset focus times triggers
        const presets = document.querySelectorAll('#presetTimeContainer .preset-btn');
        presets.forEach(p => {
            p.addEventListener('click', () => {
                presets.forEach(btn => btn.classList.remove('active'));
                p.classList.add('active');
                
                const val = parseInt(p.getAttribute('data-time'));
                this.selectedDuration = val;
                document.getElementById('inputCustomTime').value = val;
            });
        });

        // Custom time input syncing
        document.getElementById('inputCustomTime').addEventListener('input', (e) => {
            this.selectedDuration = Math.max(5, Math.min(180, parseInt(e.target.value) || 5));
            // de-activate active presets
            presets.forEach(btn => btn.classList.remove('active'));
        });

        // 7.5. BGM / White Noise select triggers
        const bgmButtons = document.querySelectorAll('#bgmGrid .bgm-btn');
        bgmButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                bgmButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedSound = btn.getAttribute('data-sound');
            });
        });

        // 7.6. Launch Timer Core
        document.getElementById('btnStartStudySession').addEventListener('click', () => {
            const lockEnabled = document.getElementById('lockModeToggle').checked;
            
            // Start focus timing countdown
            Timer.start(this.selectedSubject, this.selectedDuration, lockEnabled);
            Router.navigateTo('timer');
        });

        // Cancel Settings and retreat to home
        document.getElementById('btnCancelSettings').addEventListener('click', () => {
            Router.navigateTo('home');
        });

        // 7.7. Pause/Resume timer action
        document.getElementById('btnPauseTimer').addEventListener('click', () => {
            Timer.pause();
        });

        // 7.8. Trigger Give Up modal overlay screen
        document.getElementById('btnTriggerGiveUp').addEventListener('click', () => {
            document.getElementById('giveUpConfirmationModal').classList.add('active');
        });

        document.getElementById('btnCancelGiveUp').addEventListener('click', () => {
            this.resetGiveUpLongPressState();
            document.getElementById('giveUpConfirmationModal').classList.remove('active');
        });

        // Double Confirmation LONG PRESS interactions for giving up
        const holdTrigger = document.getElementById('btnHoldGiveUpTrigger');
        
        const startHold = (e) => {
            e.preventDefault();
            this.longPressActive = true;
            this.longPressStart = Date.now();
            
            const fill = document.getElementById('btnHoldProgressFill');
            
            // Loop frame animation to draw the border load
            const frame = () => {
                if (!this.longPressActive) return;
                const elapsed = Date.now() - this.longPressStart;
                const percent = Math.min(100, (elapsed / this.longPressDuration) * 100);
                
                fill.style.width = `${percent}%`;

                if (elapsed >= this.longPressDuration) {
                    // Trigger Session cancellation
                    this.resetGiveUpLongPressState();
                    document.getElementById('giveUpConfirmationModal').classList.remove('active');
                    Timer.giveUpSession();
                } else {
                    requestAnimationFrame(frame);
                }
            };
            requestAnimationFrame(frame);
        };

        const stopHold = () => {
            this.longPressActive = false;
            document.getElementById('btnHoldProgressFill').style.width = '0%';
        };

        holdTrigger.addEventListener('mousedown', startHold);
        holdTrigger.addEventListener('mouseup', stopHold);
        holdTrigger.addEventListener('mouseleave', stopHold);
        holdTrigger.addEventListener('touchstart', startHold, { passive: false });
        holdTrigger.addEventListener('touchend', stopHold);

        // Acknowledge Penalty Screen warning exit
        document.getElementById('btnAcknowledgePenalty').addEventListener('click', () => {
            Timer.dismissLockModeViolation();
        });

        // 7.9. Exit Success Completion Page
        document.getElementById('btnGoToHomeFromCompletion').addEventListener('click', () => {
            Confetti.stop();
            Router.navigateTo('home');
        });

        // 7.10. Instagram Stories Sharing Modal toggles
        document.getElementById('btnTriggerInstagramShare').addEventListener('click', () => {
            document.getElementById('shareFocusTime').innerText = `${this.selectedDuration}분 몰입 완료`;
            document.getElementById('shareSubjectName').innerText = `과목: ${this.selectedSubject}`;
            document.getElementById('shareStreakDay').innerText = `${Store.state.user.streak}일 연속 집중`;
            document.getElementById('shareModal').classList.add('active');
        });

        document.getElementById('btnDismissShare').addEventListener('click', () => {
            document.getElementById('shareModal').classList.remove('active');
        });

        document.getElementById('btnTriggerMockShare').addEventListener('click', () => {
            alert('인스타그램 스토리에 몰입 카드를 공유하였습니다!');
            document.getElementById('shareModal').classList.remove('active');
        });

        // 7.11. My Page Goals slide controls
        const dailyGoalSlider = document.getElementById('dailyGoalSlider');
        dailyGoalSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            document.getElementById('sliderValueText').innerText = `${val}분`;
            Store.state.user.dailyGoal = parseInt(val);
            Store.saveState();
        });

        // Menu items clicks
        document.getElementById('menuAlarmToggle').addEventListener('click', () => {
            Store.state.user.alarmEnabled = !Store.state.user.alarmEnabled;
            document.getElementById('alarmStateText').innerText = Store.state.user.alarmEnabled ? '켜짐' : '꺼짐';
            Store.saveState();
        });

        document.getElementById('menuCheckPermissions').addEventListener('click', () => {
            alert('시스템 검사 결과: 백그라운드 위젯 차단 권한 및 전체화면 API가 안전하게 매핑되었습니다.');
        });

        document.getElementById('menuClearData').addEventListener('click', () => {
            if (confirm('정말로 모든 누적 몰입 데이터와 스트릭 카운터를 공장 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                Store.clearAllData();
                this.renderHomeScreen();
                alert('데이터가 성공적으로 초기화되었습니다.');
                Router.navigateTo('home');
            }
        });

        document.getElementById('menuLogout').addEventListener('click', () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                // simple simulated logout: wipes state user profiles and redirects to auth
                Store.state.user.nickname = '';
                Store.state.user.email = '';
                Store.saveState();
                
                Router.navigateTo('login');
            }
        });
    }

    registerSwitchRebind() {
        const linkSwitch = document.getElementById('linkSwitchMode');
        // Simple swap logic recursive bind
        linkSwitch.replaceWith(linkSwitch.cloneNode(true));
        document.getElementById('linkSwitchMode').addEventListener('click', (e) => {
            e.preventDefault();
            // Trigger same click by firing on primary mock click
            document.getElementById('linkSwitchMode').click();
        });
    }

    resetGiveUpLongPressState() {
        this.longPressActive = false;
        document.getElementById('btnHoldProgressFill').style.width = '0%';
    }

    renderHomeScreen() {
        document.getElementById('homeNickName').innerText = Store.state.user.nickname;
        document.getElementById('homeStreakCount').innerText = Store.state.user.streak;

        // Daily accomplishment bar calculations
        const today = new Date().toISOString().split('T')[0];
        const todayMinutes = Store.state.sessions
            .filter(s => s.date === today && s.status === 'SUCCESS')
            .reduce((acc, curr) => acc + curr.duration, 0);

        const targetMin = Store.state.user.dailyGoal;
        const progressPercentage = Math.min(100, Math.round((todayMinutes / targetMin) * 100));
        
        document.getElementById('progressPercentage').innerText = `${progressPercentage}%`;
        document.getElementById('progressFillBar').style.width = `${progressPercentage}%`;
        document.getElementById('homeActualFocusText').innerText = `현재 ${todayMinutes}분`;
        document.getElementById('homeTargetFocusText').innerText = `목표 ${targetMin}분`;
    }

    renderSettingsScreen() {
        const container = document.getElementById('subjectGrid');
        container.innerHTML = ''; // Clear prior

        // Inject selection chips dynamically
        Store.state.subjects.forEach(subj => {
            const chip = document.createElement('div');
            chip.className = 'subject-chip';
            if (subj === this.selectedSubject) {
                chip.classList.add('active');
            }
            chip.innerText = subj;
            
            chip.addEventListener('click', () => {
                document.querySelectorAll('#subjectGrid .subject-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.selectedSubject = subj;
            });
            container.appendChild(chip);
        });

        // Add custom subject creator chip at bottom of grid
        const addChip = document.createElement('div');
        addChip.className = 'subject-chip';
        addChip.style.borderStyle = 'dashed';
        addChip.style.color = 'var(--accent-cyan)';
        addChip.innerText = '+ 과목 추가';
        
        addChip.addEventListener('click', () => {
            const newSubj = prompt('새로운 과목 이름을 입력해 주세요:');
            if (newSubj && newSubj.trim()) {
                const cleanName = newSubj.trim();
                if (!Store.state.subjects.includes(cleanName)) {
                    Store.state.subjects.push(cleanName);
                    Store.saveState();
                    this.selectedSubject = cleanName;
                    this.renderSettingsScreen();
                } else {
                    alert('이미 존재하는 과목 이름입니다.');
                }
            }
        });
        container.appendChild(addChip);
    }

    renderMyPage() {
        const name = Store.state.user.nickname || '도전자';
        document.getElementById('myPageNick').innerText = name;
        document.getElementById('myPageEmail').innerText = Store.state.user.email || 'focus@example.com';
        document.getElementById('avatarLetter').innerText = name.charAt(0).toUpperCase();

        const dailyGoal = Store.state.user.dailyGoal;
        document.getElementById('dailyGoalSlider').value = dailyGoal;
        document.getElementById('sliderValueText').innerText = `${dailyGoal}분`;
        document.getElementById('alarmStateText').innerText = Store.state.user.alarmEnabled ? '켜짐' : '꺼짐';
    }

    getSelectedSound() {
        return this.selectedSound;
    }
}

// Global Core App launch instantiation
const App = new AppCore();
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
