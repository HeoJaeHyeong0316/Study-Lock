import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated,
} from 'react-native';
import { userAPI } from '../api/client';
import { COLORS, RADIUS, SHADOW } from '../utils/styles';

const pad = (n) => String(n).padStart(2, '0');

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${pad(m)}:${pad(s)}`;
};

export default function StudyResultScreen({ navigation, route }) {
  const { subject, actualTime, goalTime, escapeCount, isSuccess } = route.params;
  const [streak, setStreak] = useState(null);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    if (isSuccess) {
      userAPI.me()
        .then((res) => setStreak(res.data?.currentStreak ?? 0))
        .catch(() => {});
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* 성공/실패 아이콘 */}
        <View style={styles.iconArea}>
          {/* 배경 파티클 */}
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[styles.particle, {
                width: i % 2 === 0 ? 10 : 7,
                height: i % 2 === 0 ? 10 : 7,
                top: [20, 60, 30, 80, 10, 50][i],
                left: [30, 280, 320, 40, 200, 150][i],
                backgroundColor: [COLORS.primary, COLORS.cyan, COLORS.primary,
                  COLORS.purple, COLORS.primary, COLORS.orange][i],
                opacity: 0.5,
              }]}
            />
          ))}
          <Animated.View
            style={[styles.checkCircle,
              { transform: [{ scale: scaleAnim }] },
              isSuccess ? styles.checkCircleSuccess : styles.checkCircleFail,
            ]}
          >
            <Text style={styles.checkIcon}>{isSuccess ? '✓' : '!'}</Text>
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.title}>
            {isSuccess ? '목표 달성 완료!' : '공부 종료'}
          </Text>
          <Text style={styles.sub}>
            {isSuccess
              ? '대단해요. 오늘도 한 걸음 나아갔어요 🎯'
              : '수고했어요. 다음엔 꼭 달성해봐요 💪'
            }
          </Text>
        </Animated.View>

        {/* 결과 카드 */}
        <Animated.View style={[styles.resultCard, { opacity: fadeAnim }]}>
          {/* 과목 */}
          <View style={styles.subjectRow}>
            <View style={styles.subjectIcon}>
              <Text>📖</Text>
            </View>
            <View>
              <Text style={styles.subjectLabel}>과목</Text>
              <Text style={styles.subjectName}>{subject}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 통계 */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>공부 시간</Text>
              <Text style={styles.statValue}>{formatDuration(actualTime)}</Text>
              <Text style={styles.statCaption}>
                {isSuccess ? '목표 달성' : `목표 ${formatDuration(goalTime)}`}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>이탈 횟수</Text>
              <Text style={[styles.statValue, { color: escapeCount === 0 ? COLORS.success : COLORS.danger }]}>
                {escapeCount}회
              </Text>
              <Text style={styles.statCaption}>
                {escapeCount === 0 ? '완벽한 집중' : '이탈 발생'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 달성 배지 */}
        <Animated.View style={[styles.achieveBadge, { opacity: fadeAnim, marginBottom: 24 }]}>
          <Text style={styles.achieveIcon}>⭐</Text>
          <View>
            <Text style={styles.achieveTitle}>
              달성률 · {isSuccess ? '100%' : `${Math.floor((actualTime / goalTime) * 100)}%`}
            </Text>
            {isSuccess && streak !== null && streak > 0 && (
              <Text style={styles.achieveSub}>연속 {streak}일째 달성 중이에요 🔥</Text>
            )}
          </View>
        </Animated.View>

        {/* 버튼 */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.homeBtnText}>홈으로 돌아가기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.recordBtn}
          onPress={() => navigation.navigate('Records')}
        >
          <Text style={styles.recordBtnText}>기록 자세히 보기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32, alignItems: 'center' },
  iconArea: { height: 160, justifyContent: 'center', alignItems: 'center', position: 'relative', width: '100%' },
  particle: { position: 'absolute', borderRadius: 999 },
  checkCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleSuccess: { backgroundColor: COLORS.primary, ...SHADOW.strong },
  checkCircleFail: { backgroundColor: COLORS.warning },
  checkIcon: { color: '#fff', fontSize: 42, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginTop: 8, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: COLORS.textSub, marginTop: 8, marginBottom: 24 },
  resultCard: {
    width: '100%', backgroundColor: COLORS.bg,
    borderRadius: RADIUS.xl, padding: 20, marginBottom: 12,
  },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  subjectIcon: {
    width: 44, height: 44, backgroundColor: COLORS.primaryLight,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  subjectLabel: { fontSize: 12, color: COLORS.textSub },
  subjectName: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 16 },
  statsRow: { flexDirection: 'row' },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSub },
  statValue: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  statCaption: { fontSize: 11, color: COLORS.textSub, marginTop: 4 },
  achieveBadge: {
    width: '100%', backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg, padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginBottom: 10,
  },
  achieveIcon: { fontSize: 22 },
  achieveTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  achieveSub: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  homeBtn: {
    width: '100%', backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full, paddingVertical: 17,
    alignItems: 'center', ...SHADOW.strong,
  },
  homeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  recordBtn: { marginTop: 14, paddingVertical: 8 },
  recordBtnText: { color: COLORS.textSub, fontSize: 14, fontWeight: '500' },
});
