import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { recordsAPI, userAPI } from '../api/client';
import { COLORS, RADIUS, SHADOW } from '../utils/styles';

const formatTime = (seconds) => {
  if (!seconds) return '0분';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
};

const formatTimeHM = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return { h, m };
};

const SubjectColor = {
  수학: COLORS.primary,
  영어: COLORS.cyan,
  국어: COLORS.purple,
  한국사: COLORS.orange,
  과학: COLORS.green,
};

const getSubjectColor = (subject) => {
  for (const key of Object.keys(SubjectColor)) {
    if (subject?.includes(key)) return SubjectColor[key];
  }
  return COLORS.primary;
};

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [userRes, todayRes] = await Promise.all([
        userAPI.me(),
        recordsAPI.today(),
      ]);
      setUser(userRes.data);
      setTodayData(todayRes.data);
    } catch (e) {
      console.error('홈 데이터 로딩 실패:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일 ${['일','월','화','수','목','금','토'][today.getDay()]}요일`;

  const totalTime = todayData?.totalTime || 0;
  const { h, m } = formatTimeHM(totalTime);
  // 홈 화면의 목표: 4시간(14400초) 고정 예시 (실제로는 유저 설정에서 가져올 수 있음)
  const goalSeconds = 4 * 3600;
  const progress = Math.min(totalTime / goalSeconds, 1);
  const remainingSec = Math.max(goalSeconds - totalTime, 0);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{dateStr}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.greetText}>안녕하세요, </Text>
              <Text style={[styles.greetText, { color: COLORS.primary }]}>
                {user?.nickname || ''}님
              </Text>
              <Text style={styles.greetText}>👋</Text>
            </View>
          </View>
        </View>

        {/* 오늘 공부 카드 */}
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>오늘의 공부 시간</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 8 }}>
            <Text style={styles.todayHour}>{h}</Text>
            <Text style={styles.todayUnit}>시간</Text>
            <Text style={styles.todayMin}>{m}</Text>
            <Text style={styles.todayUnit}>분</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>목표</Text>
              <Text style={styles.statValue}>{goalSeconds / 3600}시간</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>이탈</Text>
              <Text style={styles.statValue}>
                {todayData?.records?.reduce((s, r) => s + r.escapeCount, 0) || 0}회
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>연속</Text>
              <Text style={styles.statValue}>{user?.currentStreak ?? 0}일째</Text>
            </View>
          </View>

          {/* 프로그레스 바 */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          {remainingSec > 0 && (
            <Text style={styles.remainText}>
              목표까지 {formatTime(remainingSec)} 남았어요
            </Text>
          )}
        </View>

        {/* 공부 시작 버튼 */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('StudySetup')}
        >
          <Text style={styles.startBtnText}>▶  공부 시작하기</Text>
        </TouchableOpacity>

        {/* 최근 기록 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최근 공부 기록</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Records')}>
            <Text style={styles.seeAll}>전체보기</Text>
          </TouchableOpacity>
        </View>

        {todayData?.records?.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>아직 오늘 기록이 없어요 📚</Text>
            <Text style={styles.emptySub}>공부를 시작해보세요!</Text>
          </View>
        )}

        {(todayData?.records || []).slice(0, 5).map((record, idx) => {
          const color = getSubjectColor(record.subject);
          const timeStr = formatTime(record.actualTime);
          const startTime = record.startedAt
            ? new Date(record.startedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            : '';
          return (
            <View key={record.sessionId || idx} style={styles.recordCard}>
              <View style={[styles.recordDot, { backgroundColor: color + '22' }]}>
                <View style={[styles.recordDotInner, { backgroundColor: color }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recordSubject}>{record.subject}</Text>
                <Text style={styles.recordTime}>오늘 {startTime}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.recordDuration}>{timeStr}</Text>
                <Text style={[styles.recordStatus, { color: record.isSuccess ? COLORS.success : COLORS.danger }]}>
                  {record.isSuccess ? '달성' : '미달성'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8,
  },
  dateText: { fontSize: 13, color: COLORS.textSub, marginBottom: 4 },
  greetText: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  todayCard: {
    marginHorizontal: 20, marginTop: 8,
    backgroundColor: COLORS.primary, borderRadius: 24,
    padding: 24, ...SHADOW.strong,
  },
  todayLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  todayHour: { color: '#fff', fontSize: 52, fontWeight: '800', letterSpacing: -2 },
  todayMin: { color: '#fff', fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  todayUnit: { color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: '500', paddingBottom: 6 },
  statsRow: { flexDirection: 'row', marginTop: 20, gap: 0 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 4 },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  progressBg: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3, marginTop: 20, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  remainText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 8 },
  startBtn: {
    marginHorizontal: 20, marginTop: 14,
    backgroundColor: COLORS.primaryDark, borderRadius: 18,
    paddingVertical: 18, alignItems: 'center', ...SHADOW.strong,
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 24, marginTop: 28, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  emptyCard: {
    marginHorizontal: 20, backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: 32, alignItems: 'center', ...SHADOW.card,
  },
  emptyText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  emptySub: { fontSize: 13, color: COLORS.textSub, marginTop: 4 },
  recordCard: {
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    gap: 14, ...SHADOW.card,
  },
  recordDot: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  recordDotInner: { width: 14, height: 14, borderRadius: 7 },
  recordSubject: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  recordTime: { fontSize: 12, color: COLORS.textSub, marginTop: 3 },
  recordDuration: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  recordStatus: { fontSize: 12, fontWeight: '600', marginTop: 3 },
});
