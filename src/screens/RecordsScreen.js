import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  SafeAreaView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { recordsAPI } from '../api/client';
import { COLORS, RADIUS, SHADOW } from '../utils/styles';

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
};

const getDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return `오늘 ${d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `어제 ${d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
};

const SubjectColors = {
  수학: COLORS.primary, 영어: COLORS.cyan, 국어: COLORS.purple,
  한국사: COLORS.orange, 과학: COLORS.green,
};

const getColor = (subject) => {
  for (const key of Object.keys(SubjectColors)) {
    if (subject?.includes(key)) return SubjectColors[key];
  }
  return COLORS.primary;
};

export default function RecordsScreen({ navigation }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    fetchRecords();
  }, []));

  const fetchRecords = async () => {
    try {
      const res = await recordsAPI.all();
      setRecords(res.data);
    } catch (e) {
      console.error('기록 조회 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const color = getColor(item.subject);
    return (
      <View style={styles.card}>
        <View style={[styles.colorBar, { backgroundColor: color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.dot, { backgroundColor: color + '22' }]}>
              <View style={[styles.dotInner, { backgroundColor: color }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.date}>{getDate(item.startedAt)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.duration}>{formatTime(item.actualTime)}</Text>
              <View style={[styles.badge, { backgroundColor: item.isSuccess ? '#DCFCE7' : '#FEE2E2' }]}>
                <Text style={[styles.badgeText, { color: item.isSuccess ? '#16A34A' : '#DC2626' }]}>
                  {item.isSuccess ? '달성' : '미달성'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.cardBottom}>
            <Text style={styles.meta}>목표 {formatTime(item.goalTime)}</Text>
            <Text style={styles.meta}>이탈 {item.escapeCount}회</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>전체 기록</Text>
        <Text style={styles.count}>{records.length}개</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => String(item.sessionId)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>아직 공부 기록이 없어요</Text>
            <Text style={styles.emptySub}>첫 번째 공부를 시작해보세요!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    ...SHADOW.card,
  },
  backIcon: { fontSize: 22, color: COLORS.text, marginTop: -2 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: COLORS.text },
  count: { fontSize: 14, color: COLORS.textSub, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    marginBottom: 12, flexDirection: 'row', overflow: 'hidden', ...SHADOW.card,
  },
  colorBar: { width: 4 },
  cardBody: { flex: 1, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  dot: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dotInner: { width: 12, height: 12, borderRadius: 6 },
  subject: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  duration: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  meta: { fontSize: 12, color: COLORS.textSub },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.textSub, marginTop: 6 },
});
