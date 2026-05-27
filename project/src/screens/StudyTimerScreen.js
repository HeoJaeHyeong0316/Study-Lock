import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, AppState, Alert, Dimensions,
  Platform, NativeModules,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { studyAPI } from '../api/client';
import { COLORS, RADIUS } from '../utils/styles';

const { LockModule } = NativeModules;

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.72;
const RADIUS_VAL = (CIRCLE_SIZE - 28) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_VAL;

const pad = (n) => String(n).padStart(2, '0');

const formatElapsed = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
};

export default function StudyTimerScreen({ navigation, route }) {
  const { sessionId, subject, goalTime, screenLock, emergencyExit } = route.params;

  const [elapsed, setElapsed] = useState(0);
  const [escapeCount, setEscapeCount] = useState(0);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef(null);
  const timerRef = useRef(null);
  // 실시간 기준 타이머: 시계 기반으로 elapsed 계산 (백그라운드에서 정지돼도 복귀 시 정확)
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const realElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(realElapsed);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!screenLock || Platform.OS !== 'android' || !LockModule) return;
    let cancelled = false;
    (async () => {
      try {
        const enabled = await LockModule.isAccessibilityEnabled();
        if (!enabled) {
          Alert.alert(
            '접근성 권한 필요',
            '화면 이탈 방지를 위해 Study Lock 접근성 서비스를 켜주세요.',
            [
              { text: '취소', style: 'cancel' },
              { text: '설정 열기', onPress: () => LockModule.openAccessibilitySettings() },
            ]
          );
          return;
        }
        if (!cancelled) LockModule.startLock();
      } catch (e) {
        console.warn('LockModule init failed:', e);
      }
    })();
    return () => {
      cancelled = true;
      try { LockModule.stopLock(); } catch (_) {}
    };
  }, [screenLock]);

  useEffect(() => {
    if (!screenLock) return;
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (appState.current === 'active' && (nextState === 'inactive' || nextState === 'background')) {
        backgroundTime.current = Date.now();
      }
      if ((appState.current === 'inactive' || appState.current === 'background') && nextState === 'active') {
        // 백그라운드 동안 멈춰있던 elapsed를 실시간으로 즉시 보정
        const realElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(realElapsed);
        if (backgroundTime.current) {
          const diff = (Date.now() - backgroundTime.current) / 1000;
          if (diff > 1) {
            try {
              const res = await studyAPI.escape(sessionId);
              setEscapeCount(res.data);
            } catch (e) {
              setEscapeCount((c) => c + 1);
            }
          }
          backgroundTime.current = null;
        }
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [sessionId, screenLock]);

  useEffect(() => {
    if (elapsed >= goalTime && goalTime > 0) {
      clearInterval(timerRef.current);
      handleEnd();
    }
  }, [elapsed]);

  const handleEnd = async () => {
    clearInterval(timerRef.current);
    try {
      await studyAPI.end({ sessionId, escapeCount });
    } catch (e) {
      console.error('세션 종료 실패:', e);
    }
    navigation.replace('StudyResult', {
      subject,
      actualTime: elapsed,
      goalTime,
      escapeCount,
      isSuccess: elapsed >= goalTime,
    });
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      '긴급 종료',
      '정말 공부를 종료할까요?',
      [
        { text: '계속 공부하기', style: 'cancel' },
        { text: '종료', style: 'destructive', onPress: handleEnd },
      ]
    );
  };

  const progress = Math.min(elapsed / goalTime, 1);
  const remaining = Math.max(goalTime - elapsed, 0);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const percentDone = Math.floor(progress * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.focusBadge}>
          <View style={styles.focusDot} />
          <Text style={styles.focusText}>집중 모드</Text>
        </View>
        <Text style={styles.clock}>
          {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.subjectArea}>
        <Text style={styles.nowStudying}>NOW STUDYING</Text>
        <Text style={styles.subjectText}>{subject}</Text>
      </View>

      <View style={styles.circleWrapper}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS_VAL}
            stroke="#E8EDFF"
            strokeWidth={14}
            fill="none"
          />
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS_VAL}
            stroke={COLORS.primary}
            strokeWidth={14}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
          />
          <Circle
            cx={CIRCLE_SIZE / 2 + RADIUS_VAL * Math.cos((2 * Math.PI * progress) - Math.PI / 2)}
            cy={CIRCLE_SIZE / 2 + RADIUS_VAL * Math.sin((2 * Math.PI * progress) - Math.PI / 2)}
            r={10}
            fill={COLORS.primary}
            stroke="#fff"
            strokeWidth={3}
          />
        </Svg>
        <View style={styles.centerText}>
          <Text style={styles.remainLabel}>남은 시간</Text>
          <Text style={styles.remainTime}>{formatElapsed(remaining)}</Text>
          <Text style={styles.percentText}>{percentDone}% 완료</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>경과 시간</Text>
          <Text style={styles.statValue}>{formatElapsed(elapsed)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>이탈 횟수</Text>
          <Text style={[styles.statValue, { color: escapeCount === 0 ? COLORS.success : COLORS.danger }]}>
            {escapeCount}회
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>목표</Text>
          <Text style={styles.statValue}>{formatElapsed(goalTime)}</Text>
        </View>
      </View>

      {screenLock && (
        <View style={styles.lockNotice}>
          <View style={styles.lockIconBg}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lockTitle}>화면 고정 모드 활성화</Text>
            <Text style={styles.lockSub}>앱을 벗어나면 이탈로 기록돼요.</Text>
            <Text style={styles.lockSub}>완료까지 끝까지 집중해 보세요.</Text>
          </View>
        </View>
      )}

      {emergencyExit && (
        <TouchableOpacity style={styles.emergencyBtn} onPress={handleEmergencyStop}>
          <Text style={styles.emergencyText}>⚠ 긴급 종료</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', width: '100%', paddingHorizontal: 24, paddingTop: 12,
  },
  focusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF8E1', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  focusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' },
  focusText: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  clock: { fontSize: 15, color: COLORS.textSub, fontWeight: '500' },
  subjectArea: { alignItems: 'center', marginTop: 20, marginBottom: 8 },
  nowStudying: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 2 },
  subjectText: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 6 },
  circleWrapper: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE,
    position: 'relative', alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  centerText: { position: 'absolute', alignItems: 'center' },
  remainLabel: { fontSize: 13, color: COLORS.textSub, marginBottom: 4 },
  remainTime: { fontSize: 48, fontWeight: '800', color: COLORS.text, letterSpacing: -2 },
  percentText: { fontSize: 14, color: COLORS.textSub, marginTop: 4 },
  statsCard: {
    flexDirection: 'row', backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg, paddingVertical: 20,
    marginHorizontal: 24, width: '88%', marginTop: 16,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSub },
  statValue: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  lockNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg,
    padding: 16, marginHorizontal: 24, marginTop: 16, width: '88%',
  },
  lockIconBg: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  lockIcon: { fontSize: 20 },
  lockTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  lockSub: { fontSize: 12, color: COLORS.textSub, marginTop: 1 },
  emergencyBtn: {
    marginTop: 20, borderWidth: 1.5, borderColor: COLORS.danger + '60',
    borderRadius: RADIUS.full, paddingHorizontal: 28, paddingVertical: 12,
  },
  emergencyText: { color: COLORS.danger, fontSize: 14, fontWeight: '600' },
});
