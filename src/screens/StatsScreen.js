import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { statsAPI } from '../api/client';
import { COLORS, RADIUS, SHADOW } from '../utils/styles';

const { width } = Dimensions.get('window');

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
};

const SubjectColors = [COLORS.primary, COLORS.cyan, COLORS.purple, COLORS.orange, COLORS.green];

export default function StatsScreen() {
  const [tab, setTab] = useState('주');
  const [weekly, setWeekly] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    fetchStats();
  }, []));

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [weeklyRes, subjectRes] = await Promise.all([
        statsAPI.weekly(),
        statsAPI.subject(),
      ]);
      setWeekly(weeklyRes.data);
      setSubjects(subjectRes.data);
    } catch (e) {
      console.error('통계 로딩 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const dailyStats = weekly?.dailyStats || [];
  const maxTime = Math.max(...dailyStats.map((d) => d.totalTime), 1);

  // 최고 과목 (막대 기준)
  const maxSubjectTime = subjects.length > 0 ? subjects[0].totalTime : 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateRange}>
              {weekly ? '이번 주' : ''}
            </Text>
            <Text style={styles.title}>통계</Text>
          </View>
          <View style={styles.tabGroup}>
            {['주', '월', '년'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 요약 카드 2개 */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { flex: 1.3 }]}>
            <Text style={styles.summaryLabel}>이번 주 총 공부</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 8 }}>
              <Text style={styles.summaryBig}>
                {Math.floor((weekly?.totalTime || 0) / 3600)}
              </Text>
              <Text style={styles.summaryUnit}>시간</Text>
              <Text style={styles.summaryBig}>
                {Math.floor(((weekly?.totalTime || 0) % 3600) / 60)}
              </Text>
              <Text style={styles.summaryUnit}>분</Text>
            </View>
            <View style={styles.changeRow}>
              <Text style={styles.changeUp}>↑ +18%</Text>
              <Text style={styles.changeLabel}> vs 지난주</Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { flex: 1 }]}>
            <Text style={styles.summaryLabel}>주간 달성률</Text>
            {/* 원형 게이지 */}
            <View style={styles.gaugeWrapper}>
              <View style={styles.gaugeCircle}>
                <Text style={styles.gaugePercent}>
                  {Math.round(weekly?.achieveRate || 0)}%
                </Text>
              </View>
            </View>
            <Text style={styles.gaugeSub}>
              5일 중{'\n'}
              <Text style={{ fontWeight: '800', color: COLORS.text }}>
                {Math.round((weekly?.achieveRate || 0) / 100 * 5)}일 달성
              </Text>
            </Text>
          </View>
        </View>

        {/* 요일별 막대 차트 */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>요일별 공부 시간</Text>
            <Text style={styles.chartUnit}>시간 (h)</Text>
          </View>
          <View style={styles.barsWrapper}>
            {dailyStats.map((d, i) => {
              const barHeight = maxTime > 0 ? (d.totalTime / maxTime) * 120 : 4;
              const h = (d.totalTime / 3600).toFixed(1);
              return (
                <View key={d.day} style={styles.barCol}>
                  <Text style={[styles.barValue, d.isToday && styles.barValueActive]}>
                    {d.totalTime > 0 ? `${h}h` : ''}
                  </Text>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { height: Math.max(barHeight, d.totalTime > 0 ? 6 : 4) },
                        d.isToday && styles.barFillActive,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDay, d.isToday && styles.barDayActive]}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 과목별 공부 시간 */}
        <View style={styles.subjectCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>과목별 공부 시간</Text>
            <Text style={styles.chartUnit}>상위 5개</Text>
          </View>
          {subjects.slice(0, 5).map((s, i) => (
            <View key={s.subject} style={styles.subjectRow}>
              <View style={[styles.subjectDot, { backgroundColor: SubjectColors[i] }]} />
              <Text style={styles.subjectName}>{s.subject}</Text>
              <Text style={styles.subjectTime}>{formatTime(s.totalTime)}</Text>
              <View style={styles.subjectBarBg}>
                <View
                  style={[
                    styles.subjectBarFill,
                    {
                      width: `${(s.totalTime / maxSubjectTime) * 100}%`,
                      backgroundColor: SubjectColors[i],
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16,
  },
  dateRange: { fontSize: 13, color: COLORS.textSub },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  tabGroup: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderRadius: RADIUS.full, padding: 4, ...SHADOW.card,
  },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSub },
  tabTextActive: { color: '#fff' },
  summaryRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 16 },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 18, ...SHADOW.card },
  summaryLabel: { fontSize: 12, color: COLORS.textSub },
  summaryBig: { fontSize: 36, fontWeight: '800', color: COLORS.text, letterSpacing: -1 },
  summaryUnit: { fontSize: 15, color: COLORS.textSub, paddingBottom: 6 },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  changeUp: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  changeLabel: { fontSize: 12, color: COLORS.textSub },
  gaugeWrapper: { alignItems: 'center', marginVertical: 8 },
  gaugeCircle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 8, borderColor: COLORS.primary,
    borderTopColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  gaugePercent: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  gaugeSub: { fontSize: 12, color: COLORS.textSub, textAlign: 'center', lineHeight: 18 },
  chartCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 20, marginHorizontal: 20, marginBottom: 16, ...SHADOW.card,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  chartUnit: { fontSize: 12, color: COLORS.textSub },
  barsWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { fontSize: 11, color: COLORS.textSub, marginBottom: 4 },
  barValueActive: { color: COLORS.primary, fontWeight: '700' },
  barBg: { width: 36, borderRadius: 8, backgroundColor: COLORS.primaryLight, overflow: 'hidden', justifyContent: 'flex-end', height: 120 },
  barFill: { width: '100%', backgroundColor: COLORS.primaryLight, borderRadius: 8 },
  barFillActive: { backgroundColor: COLORS.primary },
  barDay: { fontSize: 12, color: COLORS.textSub, marginTop: 6 },
  barDayActive: { color: COLORS.primary, fontWeight: '700' },
  subjectCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 20, marginHorizontal: 20, marginBottom: 16, ...SHADOW.card,
  },
  subjectRow: { marginBottom: 20 },
  subjectDot: { width: 10, height: 10, borderRadius: 5, position: 'absolute', top: 5 },
  subjectName: { fontSize: 14, fontWeight: '600', color: COLORS.text, paddingLeft: 22, marginBottom: 4 },
  subjectTime: { position: 'absolute', right: 0, top: 0, fontSize: 14, fontWeight: '700', color: COLORS.text },
  subjectBarBg: {
    height: 8, backgroundColor: COLORS.bg,
    borderRadius: 4, overflow: 'hidden', marginTop: 8,
  },
  subjectBarFill: { height: '100%', borderRadius: 4 },
});
