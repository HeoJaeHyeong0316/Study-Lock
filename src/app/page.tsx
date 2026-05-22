'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AudioSynth } from '../utils/audio';
import { TimerCircle } from '../components/TimerCircle';
import { WeeklyChart } from '../components/WeeklyChart';
import { SubjectChart } from '../components/SubjectChart';
import { Confetti } from '../components/Confetti';

interface Session {
  id: string;
  subject: string;
  date: string;
  duration: number;
  status: 'SUCCESS' | 'FAILED';
}

interface User {
  nickname: string;
  email: string;
  dailyGoal: number;
  streak: number;
  maxStreak: number;
  alarmEnabled: boolean;
}

export default function FocusLockApp() {
  // --- Screen Router ---
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'login' | 'home' | 'settings' | 'timer' | 'completion' | 'stats' | 'mypage'>('splash');

  // --- Global App States ---
  const [user, setUser] = useState<User>({
    nickname: '',
    email: '',
    dailyGoal: 120,
    streak: 0,
    maxStreak: 0,
    alarmEnabled: true
  });
  const [subjects, setSubjects] = useState<string[]>(['국어', '영어', '수학', '코딩']);
  const [sessions, setSessions] = useState<Session[]>([]);

  // --- UI & Configuration States ---
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authNickname, setAuthNickname] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<string>('코딩');
  const [selectedSound, setSelectedSound] = useState<string>('none');
  const [selectedDuration, setSelectedDuration] = useState<number>(50);
  const [customTimeInput, setCustomTimeInput] = useState<string>('50');
  const [lockModeToggle, setLockModeToggle] = useState<boolean>(true);

  // --- Active Timer States ---
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [totalGoalSeconds, setTotalGoalSeconds] = useState<number>(0);

  // --- Dialog & Overlay States ---
  const [showPenaltyOverlay, setShowPenaltyOverlay] = useState<boolean>(false);
  const [showGiveUpModal, setShowGiveUpModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [longPressProgress, setLongPressProgress] = useState<number>(0);

  const [isMounted, setIsMounted] = useState<boolean>(false);

  // --- Hold Timer Refs ---
  const holdIntervalRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);

  // --- Setup Mount Initialization & localStorage ---
  useEffect(() => {
    const getPastDateStr = (daysAgo: number) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split('T')[0];
    };

    const defaultSessions: Session[] = [
      { id: 'mock-1', subject: '코딩', date: getPastDateStr(5), duration: 90, status: 'SUCCESS' },
      { id: 'mock-2', subject: '수학', date: getPastDateStr(5), duration: 60, status: 'SUCCESS' },
      { id: 'mock-3', subject: '영어', date: getPastDateStr(4), duration: 50, status: 'SUCCESS' },
      { id: 'mock-4', subject: '코딩', date: getPastDateStr(4), duration: 50, status: 'SUCCESS' },
      { id: 'mock-5', subject: '수학', date: getPastDateStr(3), duration: 90, status: 'SUCCESS' },
      { id: 'mock-6', subject: '국어', date: getPastDateStr(2), duration: 50, status: 'SUCCESS' },
      { id: 'mock-7', subject: '코딩', date: getPastDateStr(2), duration: 90, status: 'SUCCESS' },
      { id: 'mock-8', subject: '영어', date: getPastDateStr(1), duration: 30, status: 'SUCCESS' },
      { id: 'mock-9', subject: '코딩', date: getPastDateStr(1), duration: 60, status: 'SUCCESS' },
      { id: 'mock-10', subject: '수학', date: getPastDateStr(1), duration: 50, status: 'SUCCESS' }
    ];

    const defaultUser: User = {
      nickname: '홍길동 님',
      email: 'focus@example.com',
      dailyGoal: 120,
      streak: 5,
      maxStreak: 5,
      alarmEnabled: true
    };

    const defaultSubjects = ['국어', '영어', '수학', '코딩'];

    try {
      const raw = localStorage.getItem('focuslock_app_state_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user || defaultUser);
        setSubjects(parsed.subjects || defaultSubjects);
        setSessions(parsed.sessions || defaultSessions);
      } else {
        localStorage.setItem('focuslock_app_state_v1', JSON.stringify({
          user: defaultUser,
          subjects: defaultSubjects,
          sessions: defaultSessions
        }));
        setUser(defaultUser);
        setSubjects(defaultSubjects);
        setSessions(defaultSessions);
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
      setUser(defaultUser);
      setSubjects(defaultSubjects);
      setSessions(defaultSessions);
    }
    setIsMounted(true);
  }, []);

  // --- Splash Screen Redirection Timer ---
  useEffect(() => {
    if (isMounted) {
      const splashTimer = setTimeout(() => {
        if (user.nickname) {
          setCurrentScreen('home');
        } else {
          setCurrentScreen('login');
        }
      }, 2200);
      return () => clearTimeout(splashTimer);
    }
  }, [isMounted, user.nickname]);

  // --- Fullscreen Utility Helpers ---
  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // --- Lock Exit Protection Enforcement Blur Mechanism ---
  useEffect(() => {
    if (!lockModeToggle || !isTimerActive || isPaused) return;

    const handleBlur = () => {
      AudioSynth.startSirenAlarm();
      setShowPenaltyOverlay(true);
      setIsPaused(true);

      // Penalize: Reset streak, save changes
      setUser(prevUser => {
        const updatedUser = { ...prevUser, streak: 0 };
        localStorage.setItem('focuslock_app_state_v1', JSON.stringify({
          user: updatedUser,
          subjects,
          sessions
        }));
        return updatedUser;
      });
    };

    const handleVisibility = () => {
      if (document.hidden) {
        handleBlur();
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [lockModeToggle, isTimerActive, isPaused, subjects, sessions]);

  // --- Countdown Ticker ---
  useEffect(() => {
    let intervalId: any = null;
    if (isTimerActive && !isPaused) {
      intervalId = setInterval(() => {
        setTimeLeftSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTimerActive, isPaused]);

  // --- Start Session ---
  const startSession = () => {
    setTotalGoalSeconds(selectedDuration * 60);
    setTimeLeftSeconds(selectedDuration * 60);
    setIsPaused(false);
    setIsTimerActive(true);

    if (lockModeToggle) {
      requestFullscreen();
    }

    AudioSynth.startNoise(selectedSound);
    setCurrentScreen('timer');
  };

  // --- Pause/Resume Session ---
  const handlePauseToggle = () => {
    setIsPaused(prev => {
      const nextVal = !prev;
      if (nextVal) {
        AudioSynth.stopNoise();
      } else {
        AudioSynth.startNoise(selectedSound);
      }
      return nextVal;
    });
  };

  // --- Complete focus session successfully ---
  const completeSession = () => {
    setIsTimerActive(false);
    AudioSynth.stopNoise();
    exitFullscreen();

    const minutesFocused = Math.round(totalGoalSeconds / 60);
    const newSession: Session = {
      id: 'session-' + Date.now(),
      subject: selectedSubject,
      date: new Date().toISOString().split('T')[0],
      duration: minutesFocused,
      status: 'SUCCESS'
    };

    setSessions(prev => {
      const updated = [...prev, newSession];
      setUser(prevUser => {
        const nextStreak = prevUser.streak + 1;
        const nextMax = Math.max(prevUser.maxStreak, nextStreak);
        const updatedUser = { ...prevUser, streak: nextStreak, maxStreak: nextMax };
        
        localStorage.setItem('focuslock_app_state_v1', JSON.stringify({
          user: updatedUser,
          subjects,
          sessions: updated
        }));
        return updatedUser;
      });
      return updated;
    });

    setCurrentScreen('completion');
  };

  // --- Give up active session ---
  const giveUpSession = () => {
    setIsTimerActive(false);
    AudioSynth.stopNoise();
    exitFullscreen();

    const minutesFocused = Math.round((totalGoalSeconds - timeLeftSeconds) / 60);
    const newSession: Session = {
      id: 'session-' + Date.now(),
      subject: selectedSubject,
      date: new Date().toISOString().split('T')[0],
      duration: minutesFocused,
      status: 'FAILED'
    };

    setSessions(prev => {
      const updated = [...prev, newSession];
      setUser(prevUser => {
        const updatedUser = { ...prevUser, streak: 0 };
        localStorage.setItem('focuslock_app_state_v1', JSON.stringify({
          user: updatedUser,
          subjects,
          sessions: updated
        }));
        return updatedUser;
      });
      return updated;
    });

    setCurrentScreen('home');
  };

  // --- Dismiss Penalty Screen overlay ---
  const dismissPenaltyOverlay = () => {
    setShowPenaltyOverlay(false);
    AudioSynth.stopSirenAlarm();
    if (lockModeToggle) {
      requestFullscreen();
    }
    setIsPaused(false);
  };

  // --- Long Press hold animation loops for giving up ---
  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    holdStartRef.current = Date.now();

    const tickHold = () => {
      const elapsed = Date.now() - holdStartRef.current;
      const percent = Math.min(100, (elapsed / 3000) * 100);
      setLongPressProgress(percent);

      if (elapsed >= 3000) {
        stopHold();
        setShowGiveUpModal(false);
        giveUpSession();
      } else {
        holdIntervalRef.current = requestAnimationFrame(tickHold);
      }
    };
    holdIntervalRef.current = requestAnimationFrame(tickHold);
  };

  const stopHold = () => {
    if (holdIntervalRef.current) {
      cancelAnimationFrame(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setLongPressProgress(0);
  };

  // --- Form Handlers ---
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword.length < 8) {
      setAuthError('비밀번호는 8자 이상 입력해야 합니다.');
      return;
    }
    setAuthError(null);

    const cleanNick = isSignup ? (authNickname || '도전자') : '홍길동';
    const newNickname = cleanNick + ' 님';
    const updatedUser: User = {
      ...user,
      nickname: newNickname,
      email: authEmail
    };

    setUser(updatedUser);
    localStorage.setItem('focuslock_app_state_v1', JSON.stringify({
      user: updatedUser,
      subjects,
      sessions
    }));
    setCurrentScreen('home');
  };

  // --- Settings Chips Actions ---
  const addSubjectChip = () => {
    const newSubj = prompt('새로운 과목 이름을 입력해 주세요:');
    if (newSubj && newSubj.trim()) {
      const cleanName = newSubj.trim();
      if (!subjects.includes(cleanName)) {
        const updatedSubjs = [...subjects, cleanName];
        setSubjects(updatedSubjs);
        setSelectedSubject(cleanName);
        localStorage.setItem('focuslock_app_state_v1', JSON.stringify({
          user,
          subjects: updatedSubjs,
          sessions
        }));
      } else {
        alert('이미 존재하는 과목 이름입니다.');
      }
    }
  };

  // --- MyPage Menu Settings ---
  const handleDailyGoalSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setUser(prev => {
      const updated = { ...prev, dailyGoal: val };
      localStorage.setItem('focuslock_app_state_v1', JSON.stringify({
        user: updated,
        subjects,
        sessions
      }));
      return updated;
    });
  };

  const toggleAlarmState = () => {
    setUser(prev => {
      const updated = { ...prev, alarmEnabled: !prev.alarmEnabled };
      localStorage.setItem('focuslock_app_state_v1', JSON.stringify({
        user: updated,
        subjects,
        sessions
      }));
      return updated;
    });
  };

  const clearAllAppHistory = () => {
    if (confirm('정말로 모든 누적 몰입 데이터와 스트릭 카운터를 공장 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      const defaultUser = { ...user, streak: 0, maxStreak: 0 };
      setUser(defaultUser);
      setSessions([]);
      localStorage.setItem('focuslock_app_state_v1', JSON.stringify({
        user: defaultUser,
        subjects,
        sessions: []
      }));
      alert('데이터가 성공적으로 초기화되었습니다.');
      setCurrentScreen('home');
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      const defaultUser: User = {
        nickname: '',
        email: '',
        dailyGoal: 120,
        streak: 0,
        maxStreak: 0,
        alarmEnabled: true
      };
      setUser(defaultUser);
      localStorage.setItem('focuslock_app_state_v1', JSON.stringify({
        user: defaultUser,
        subjects,
        sessions
      }));
      setCurrentScreen('login');
    }
  };

  // --- Stats Calculations ---
  const successSessions = sessions.filter(s => s.status === 'SUCCESS');
  const statsTotalMinutes = successSessions.reduce((acc, curr) => acc + curr.duration, 0);
  const statsAvgSessionMinutes = successSessions.length > 0 ? Math.round(statsTotalMinutes / successSessions.length) : 0;
  
  // Favorite Subject
  const subjectFreq: Record<string, number> = {};
  successSessions.forEach(s => {
    subjectFreq[s.subject] = (subjectFreq[s.subject] || 0) + 1;
  });
  let favoriteSubject = '없음';
  let maxFreq = 0;
  Object.entries(subjectFreq).forEach(([subj, freq]) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      favoriteSubject = subj;
    }
  });

  // Today Accomplishments
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFocusedMinutes = sessions
    .filter(s => s.date === todayStr && s.status === 'SUCCESS')
    .reduce((acc, curr) => acc + curr.duration, 0);
  const progressPercentage = Math.min(100, Math.round((todayFocusedMinutes / user.dailyGoal) * 100));

  // --- Navigation Bar Visibility Check ---
  const hideNavBarScreens = ['splash', 'login', 'timer', 'settings', 'completion'];
  const showNavBar = !hideNavBarScreens.includes(currentScreen);

  return (
    <main className="app-frame" id="appFrame">
      <Confetti active={currentScreen === 'completion'} />

      {/* ==========================================
           1. SPLASH SCREEN (Initial Loader)
           ========================================== */}
      {currentScreen === 'splash' && (
        <section id="splash" className="screen active">
          <div className="splash-content">
            <div className="logo-glow">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.6 20 4 16.4 4 12S7.6 4 12 4 20 7.6 20 12 16.4 20 12 20M12.5 7H11V13L16.2 16.2L17 15L12.5 12.3V7Z" />
              </svg>
            </div>
            <h1 className="splash-title">FocusLock</h1>
            <p className="splash-subtitle">모든 방해를 지우고, 몰입의 순간으로</p>
            <div className="splash-loader" id="splashLoader"></div>
          </div>
        </section>
      )}

      {/* ==========================================
           2. AUTHENTICATION SCREEN (Login & Register)
           ========================================== */}
      {currentScreen === 'login' && (
        <section id="login" className="screen active">
          <div className="auth-header">
            <h2 className="auth-title" id="authTitle">{isSignup ? '회원가입' : '로그인'}</h2>
            <p className="auth-subtitle" id="authSubtitle">
              {isSignup ? '나만의 공부 루틴을 지금 시작해 보세요.' : '포커스락과 함께 공부 루틴을 만들어보세요.'}
            </p>
          </div>
          
          <div className="auth-card">
            <form id="authForm" onSubmit={handleAuthSubmit}>
              {isSignup && (
                <div className="form-group" id="nickGroup">
                  <label className="form-label" htmlFor="authNick">닉네임</label>
                  <input 
                    type="text" 
                    id="authNick" 
                    className="input-glow" 
                    placeholder="공부용 별명 입력"
                    value={authNickname}
                    onChange={(e) => setAuthNickname(e.target.value)}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label" htmlFor="authEmail">이메일 주소</label>
                <input 
                  type="email" 
                  id="authEmail" 
                  className="input-glow" 
                  placeholder="example@email.com" 
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="authPass">비밀번호</label>
                <input 
                  type="password" 
                  id="authPass" 
                  className="input-glow" 
                  placeholder="비밀번호 8자 이상 입력" 
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
                {authError && <span className="error-text" id="passError" style={{ display: 'block' }}>{authError}</span>}
              </div>
              
              <button type="submit" className="btn-primary" id="btnAuthSubmit">
                {isSignup ? '회원가입 완료' : '로그인'}
              </button>
            </form>
            
            <p className="auth-switch" id="authSwitchText">
              {isSignup ? (
                <>이미 가입하셨나요? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(false); }}>로그인</a></>
              ) : (
                <>아직 회원이 아니신가요? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(true); }}>회원가입</a></>
              )}
            </p>
          </div>
        </section>
      )}

      {/* ==========================================
           3. HOME SCREEN (Dashboard & Quick Launch)
           ========================================== */}
      {currentScreen === 'home' && (
        <section id="home" className="screen active">
          <div className="home-header">
            <div className="welcome-box">
              <h3>반가워요 👋</h3>
              <h2 id="homeNickName">{user.nickname}</h2>
            </div>
            <div className="streak-badge" title="연속 집중 성공 일수">
              <svg viewBox="0 0 24 24">
                <path d="M17.55 11.2C17.55 9.17 15.9 7.6 13.9 7.6C11.9 7.6 10.25 9.17 10.25 11.2C10.25 12.13 10.6 12.97 11.17 13.62C10.12 13.95 9.3 14.88 9.3 16C9.3 17.5 10.5 18.7 12 18.7C13.5 18.7 14.7 17.5 14.7 16C14.7 14.88 13.88 13.95 12.83 13.62C13.4 12.97 13.75 12.13 13.75 11.2M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M16.6 16.3C15.65 17.8 13.95 18.8 12 18.8C10.05 18.8 8.35 17.8 7.4 16.3C7.15 15.9 7.03 15.46 7.03 15C7.03 13.6 7.8 12.38 9 11.75V10.5C9 8 10.8 6 13 6S17 8 17 10.5V11.75C18.2 12.38 18.97 13.6 18.97 15C18.97 15.46 18.85 15.9 18.6 16.3Z" />
              </svg>
              <span id="homeStreakCount">{user.streak}</span>일 연속
            </div>
          </div>

          <div className="home-focus-summary">
            <div className="progress-header">
              <span>오늘의 목표 달성</span>
              <span id="progressPercentage">{progressPercentage}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" id="progressFillBar" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="progress-header" style={{ marginTop: '10px', marginBottom: 0, fontSize: '0.78rem' }}>
              <span id="homeActualFocusText">현재 {todayFocusedMinutes}분</span>
              <span id="homeTargetFocusText">목표 {user.dailyGoal}분</span>
            </div>
          </div>

          <div className="center-pulse-container">
            <button className="pulse-study-btn" id="btnLaunchStudy" onClick={() => setCurrentScreen('settings')}>
              <svg viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M10,8.5V15.5L15.5,12L10,8.5Z" />
              </svg>
              <span>공부 시작</span>
            </button>
          </div>
        </section>
      )}

      {/* ==========================================
           4. STUDY SETTINGS SCREEN (Configuration)
           ========================================== */}
      {currentScreen === 'settings' && (
        <section id="settings" className="screen active">
          <div className="settings-header">
            <h2>공부 준비</h2>
          </div>
          
          <div className="settings-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
            <div className="setting-card">
              <span className="form-label">집중할 과목</span>
              <div className="subject-grid" id="subjectGrid">
                {subjects.map((subj) => (
                  <div 
                    key={subj} 
                    className={`subject-chip ${subj === selectedSubject ? 'active' : ''}`}
                    onClick={() => setSelectedSubject(subj)}
                  >
                    {subj}
                  </div>
                ))}
                <div 
                  className="subject-chip" 
                  style={{ borderStyle: 'dashed', color: 'var(--accent-cyan)' }}
                  onClick={addSubjectChip}
                >
                  + 과목 추가
                </div>
              </div>
            </div>

            <div className="setting-card">
              <span className="form-label">목표 집중 시간</span>
              <div className="preset-container" id="presetTimeContainer">
                {[25, 50, 90].map((t) => (
                  <button 
                    key={t}
                    type="button" 
                    className={`preset-btn ${selectedDuration === t ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDuration(t);
                      setCustomTimeInput(t.toString());
                    }}
                  >
                    {t}분
                  </button>
                ))}
              </div>
              <div className="custom-time-picker">
                <span>직접 지정 (분 단위)</span>
                <input 
                  type="number" 
                  id="inputCustomTime" 
                  min="5" 
                  max="180"
                  value={customTimeInput}
                  onChange={(e) => {
                    const val = Math.max(5, Math.min(180, parseInt(e.target.value) || 5));
                    setSelectedDuration(val);
                    setCustomTimeInput(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="setting-card">
              <span className="form-label">몰입 백색소음 (자체 합성)</span>
              <div className="bgm-grid" id="bgmGrid">
                {[
                  { id: 'none', label: '소음 없음' },
                  { id: 'rain', label: '자연 빗소리' },
                  { id: 'white', label: '딥 백색소음' },
                  { id: 'cafe', label: '카페 소음' },
                ].map((s) => (
                  <button 
                    key={s.id}
                    type="button" 
                    className={`bgm-btn ${selectedSound === s.id ? 'active' : ''}`}
                    onClick={() => setSelectedSound(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-card">
              <div className="lock-toggle-box">
                <div>
                  <h4>웹 이탈 차단 (잠금 모드)</h4>
                  <p>공부 중 창 이탈 시 패널티 및 경보 작동</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    id="lockModeToggle" 
                    checked={lockModeToggle}
                    onChange={(e) => setLockModeToggle(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            
            <button type="button" className="btn-primary" id="btnStartStudySession" style={{ marginTop: '10px' }} onClick={startSession}>
              몰입 타이머 작동 시작
            </button>
            <button type="button" className="btn-secondary" id="btnCancelSettings" onClick={() => setCurrentScreen('home')}>
              취소하고 돌아가기
            </button>
          </div>
        </section>
      )}

      {/* ==========================================
           5. TIMER & HARDCORE LOCK SCREEN
           ========================================== */}
      {currentScreen === 'timer' && (
        <section id="timer" className="screen active">
          <span className="timer-sub-title" id="timerSubjectTag">과목: {selectedSubject}</span>
          
          <TimerCircle timeLeftSeconds={timeLeftSeconds} totalGoalSeconds={totalGoalSeconds} />
          
          <div className="timer-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              id="btnPauseTimer" 
              onClick={handlePauseToggle}
              style={isPaused ? { borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' } : {}}
            >
              {isPaused ? '계속하기' : '일시정지'}
            </button>
            <button type="button" className="btn-danger" id="btnTriggerGiveUp" onClick={() => setShowGiveUpModal(true)}>
              포기하기
            </button>
          </div>
        </section>
      )}

      {/* ==========================================
           6. STUDY COMPLETION SCREEN (Success)
           ========================================== */}
      {currentScreen === 'completion' && (
        <section id="completion" className="screen active">
          <div className="completion-wrap">
            <div className="completion-icon-box">
              <svg viewBox="0 0 24 24">
                <path d="M18 2H6C4.9 2 4 2.9 4 4V7C4 9.8 6.2 12 9 12.1V17H7C5.9 17 5 17.9 5 19V21H19V19C19 17.9 18.1 17 17 17H15V12.1C17.8 12 20 9.8 20 7V4C20 2.9 19.1 2 18 2M6 7V4H9V10.1C7.3 9.7 6 8.5 6 7M18 7C18 8.5 16.7 9.7 15 10.1V4H18V7Z" />
              </svg>
            </div>
            
            <h2 className="complete-title">오늘의 집중 몰입<br />성공했습니다!</h2>
            <div className="complete-duration" id="completeFocusTimeText">{Math.round(totalGoalSeconds / 60)}분 집중 완료</div>
            
            <div className="complete-stats-row">
              <div className="stat-item-inner">
                <h4>연속 달성일</h4>
                <p id="completeStreakText">{user.streak}일째</p>
              </div>
              <div className="stat-item-inner">
                <h4>누적 포인트</h4>
                <p id="completePointText">+{Math.round(totalGoalSeconds / 60) * 3} XP</p>
              </div>
            </div>
            
            <button type="button" className="btn-primary" id="btnTriggerInstagramShare" style={{ marginBottom: '12px' }} onClick={() => setShowShareModal(true)}>
              인스타그램 스토리에 공유하기
            </button>
            <button type="button" className="btn-secondary" id="btnGoToHomeFromCompletion" style={{ width: '100%' }} onClick={() => setCurrentScreen('home')}>
              홈 대시보드로 가기
            </button>
          </div>
        </section>
      )}

      {/* ==========================================
           7. STATISTICS SCREEN (SVG Visual Analytics)
           ========================================== */}
      {currentScreen === 'stats' && (
        <section id="stats" className="screen active">
          <div className="settings-header">
            <h2>몰입 통계</h2>
          </div>
          
          <div className="stats-scroll" style={{ paddingBottom: '80px' }}>
            <div className="chart-card">
              <h3>
                <svg viewBox="0 0 24 24"><path d="M22,21H2V3H4V19H22V21M20,6H17V17H20V6M15,11H12V17H15V11M10,9H7V17H10V9Z" /></svg>
                주간 몰입 분석 (시간/분)
              </h3>
              <WeeklyChart sessions={sessions} />
            </div>

            <div className="chart-card">
              <h3>
                <svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 1,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12H16A4,4 0 0,0 12,8V4M12,16A4,4 0 1,1 16,12H20A8,8 0 0,1 12,20V16Z" /></svg>
                학습 과목 비율
              </h3>
              <SubjectChart sessions={sessions} />
            </div>

            <div className="stats-grid">
              <div className="stat-box">
                <h4>총 집중 시간</h4>
                <p id="statsTotalFocus">{statsTotalMinutes.toLocaleString()}분</p>
              </div>
              <div className="stat-box">
                <h4>평균 집중 수행</h4>
                <p id="statsAvgSession">{statsAvgSessionMinutes}분</p>
              </div>
              <div className="stat-box">
                <h4>최애 공부 과목</h4>
                <p id="statsBestSubject">{favoriteSubject}</p>
              </div>
              <div className="stat-box">
                <h4>최대 연속 달성</h4>
                <p id="statsMaxStreak">{user.maxStreak}일</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
           8. MY PAGE SCREEN (Configuration & Personal)
           ========================================== */}
      {currentScreen === 'mypage' && (
        <section id="mypage" className="screen active">
          <div className="profile-card">
            <div className="profile-avatar" id="avatarLetter">{user.nickname ? user.nickname.charAt(0).toUpperCase() : 'H'}</div>
            <div className="profile-details">
              <h3 id="myPageNick">{user.nickname || '도전자'}</h3>
              <p id="myPageEmail">{user.email || 'focus@example.com'}</p>
            </div>
          </div>

          <div className="stats-scroll" style={{ paddingBottom: '80px' }}>
            <div className="setting-card">
              <div className="range-slider-group">
                <div className="range-label-row">
                  <span>하루 목표 집중 시간</span>
                  <span id="sliderValueText" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{user.dailyGoal}분</span>
                </div>
                <input 
                  type="range" 
                  id="dailyGoalSlider" 
                  className="slider-glow" 
                  min="30" 
                  max="360" 
                  step="10" 
                  value={user.dailyGoal}
                  onChange={handleDailyGoalSliderChange}
                />
              </div>
            </div>

            <div className="menu-list">
              <div className="menu-item" id="menuAlarmToggle" onClick={toggleAlarmState}>
                <span>집중 시간 시작 푸시 알림</span>
                <span className="chevron" id="alarmStateText">{user.alarmEnabled ? '켜짐' : '꺼짐'}</span>
              </div>
              <div className="menu-item" id="menuCheckPermissions" onClick={() => alert('시스템 검사 결과: 백그라운드 위젯 차단 권한 및 전체화면 API가 안전하게 매핑되었습니다.')}>
                <span>잠금 백그라운드 권한 진단</span>
                <span className="chevron">안전함</span>
              </div>
              <div className="menu-item danger-action" id="menuClearData" onClick={clearAllAppHistory}>
                <span>모든 몰입 기록 초기화하기</span>
                <span className="chevron">초기화</span>
              </div>
              <div className="menu-item danger-action" id="menuLogout" onClick={handleLogout}>
                <span>포커스락 로그아웃</span>
                <span className="chevron">나가기</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
           9. BOTTOM NAVIGATION TAB BAR
           ========================================== */}
      {showNavBar && (
        <nav className="bottom-nav" id="bottomNavBar">
          <div 
            className={`nav-item ${currentScreen === 'home' ? 'active' : ''}`} 
            onClick={() => setCurrentScreen('home')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span>홈 대시보드</span>
          </div>
          <div 
            className={`nav-item ${currentScreen === 'stats' ? 'active' : ''}`} 
            onClick={() => setCurrentScreen('stats')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
            </svg>
            <span>통계 분석</span>
          </div>
          <div 
            className={`nav-item ${currentScreen === 'mypage' ? 'active' : ''}`} 
            onClick={() => setCurrentScreen('mypage')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <span>마이페이지</span>
          </div>
        </nav>
      )}

      {/* ==========================================
           10. DIALOGS, MODALS, OVERLAYS
           ========================================== */}
      
      {/* 10.1. ESCAPE/BLUR INTENT PENALTY SYSTEM (Lock Mode Trigger) */}
      {showPenaltyOverlay && (
        <div className="penalty-overlay active" id="penaltyOverlay">
          <div className="penalty-glow-card">
            <svg className="warning-icon-animate" viewBox="0 0 24 24">
              <path d="M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z" />
            </svg>
            <h2>경고: 몰입 이탈 감지!</h2>
            <p>
              잠금(이탈 방지) 모드가 작동 중입니다.<br />
              다른 창으로 이동하면 현재까지의 집중 기록이 무효화되며, <strong>연속 공부 성공일이 리셋</strong>됩니다.
            </p>
            <button 
              type="button" 
              className="btn-primary" 
              id="btnAcknowledgePenalty" 
              style={{ background: 'var(--accent-magenta)', boxShadow: '0 4px 15px rgba(244,63,94,0.4)' }}
              onClick={dismissPenaltyOverlay}
            >
              몰입으로 즉시 복귀하기
            </button>
          </div>
        </div>
      )}

      {/* 10.2. LONG PRESS TO CONFIRM GIVING UP MODAL */}
      {showGiveUpModal && (
        <div className="giveup-modal active" id="giveUpConfirmationModal">
          <div className="giveup-card">
            <svg viewBox="0 0 24 24" style={{ width: '40px', height: '40px', fill: 'var(--accent-magenta)', marginBottom: '12px' }}>
              <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
            <h3>학습을 포기하시겠습니까?</h3>
            <p>지금 포기하시면 오늘의 누적 집중 기록에서 제외되며, <strong>연속 공부 성공(Streak)이 초기화</strong>됩니다.</p>
            
            {/* Long press loading button */}
            <div className="hold-btn-container">
              <div className="btn-hold-fill" id="btnHoldProgressFill" style={{ width: `${longPressProgress}%` }}></div>
              <div 
                className="btn-hold" 
                id="btnHoldGiveUpTrigger"
                onMouseDown={startHold}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                onTouchStart={startHold}
                onTouchEnd={stopHold}
              >
                여기를 길게 눌러 포기 완료 (3초)
              </div>
            </div>
            
            <button type="button" className="btn-secondary" id="btnCancelGiveUp" style={{ width: '100%' }} onClick={() => { stopHold(); setShowGiveUpModal(false); }}>
              아니요, 계속 공부하겠습니다
            </button>
          </div>
        </div>
      )}

      {/* 10.3. INSTAGRAM STORY SHARE GENERATOR CARD */}
      {showShareModal && (
        <div className="share-modal active" id="shareModal">
          <div className="share-card-container" id="shareCardImage">
            <div className="share-brand">FocusLock</div>
            <div className="share-main-time" id="shareFocusTime">{selectedDuration}분 몰입 완료</div>
            <div className="share-subject" id="shareSubjectName">과목: {selectedSubject}</div>
            <div className="share-badges">
              <div className="share-pill">성공 🔥</div>
              <div className="share-pill orange" id="shareStreakDay">{user.streak}일 연속 집중</div>
            </div>
            <div className="share-footer-text">방해 없는 완전한 몰입의 순간</div>
          </div>
          
          <div className="share-controls">
            <button type="button" className="btn-share-action cancel" id="btnDismissShare" onClick={() => setShowShareModal(false)}>닫기</button>
            <button type="button" className="btn-share-action insta" id="btnTriggerMockShare" onClick={() => { alert('인스타그램 스토리에 몰입 카드를 공유하였습니다!'); setShowShareModal(false); }}>스토리 전송</button>
          </div>
        </div>
      )}
    </main>
  );
}
