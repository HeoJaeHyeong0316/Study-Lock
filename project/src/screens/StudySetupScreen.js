import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  Switch, ActivityIndicator, Alert,
} from 'react-native';
import { studyAPI } from '../api/client';
import { COLORS, RADIUS, SHADOW } from '../utils/styles';

const PRESET_TIMES = [
  { label: '1시간', sub: '가볍게', value: 3600 },
  { label: '2시간', sub: '집중', value: 7200 },
  { label: '3시간', sub: '몰입', value: 10800 },
];

export default function StudySetupScreen({ navigation }) {
  const [subject, setSubject] = useState('');
  const [goalTime, setGoalTime] = useState(7200);
  const [screenLock, setScreenLock] = useState(true);
  const [emergencyExit, setEmergencyExit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleStart = async () => {
    if (!subject.trim()) {
      Alert.alert('알림', '과목명을 입력해주세요');
      return;
    }
    if (goalTime <= 0) {
      Alert.alert('알림', '목표 시간을 설정해주세요');
      return;
    }
    setLoading(true);
    try {
      const res = await studyAPI.start({ subject: subject.trim(), goalTime });
      navigation.replace('StudyTimer', {
        sessionId: res.data.sessionId,
        subject: res.data.subject,
        goalTime: res.data.goalTime,
        startTime: res.data.startTime,
        screenLock,
        emergencyExit,
      });
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (typeof e.response?.data === 'string' ? e.response.data : null) ||
        e.message ||
        '공부 시작에 실패했습니다';
      Alert.alert('오류', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTime = () => {
    const minutes = parseInt(customTime);
    if (!minutes || minutes <= 0) {
      Alert.alert('알림', '올바른 시간을 입력해주세요 (분 단위)');
      return;
    }
    setGoalTime(minutes * 60);
    setShowCustom(false);
    setCustomTime('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backLabel}>공부 시작 설정</Text>
        </TouchableOpacity>

        <Text style={styles.title}>무엇을 공부할까요?</Text>
        <Text style={styles.sub}>설정한 시간 동안 폰이 잠겨요</Text>

        {/* 과목명 자유 입력 */}
        <Text style={styles.label}>과목명</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>📋</Text>
          <TextInput
            style={styles.input}
            placeholder="예) 수학 미적분, 영어 단어, 국어 문법..."
            placeholderTextColor={COLORS.textMuted}
            value={subject}
            onChangeText={setSubject}
            maxLength={30}
            returnKeyType="done"
          />
          {subject.length > 0 && (
            <TouchableOpacity onPress={() => setSubject('')} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.charCount}>{subject.length}/30</Text>

        {/* 목표 시간 */}
        <Text style={styles.label}>목표 시간</Text>
        <View style={styles.timeRow}>
          {PRESET_TIMES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.timeCard, goalTime === t.value && !showCustom && styles.timeCardActive]}
              onPress={() => { setGoalTime(t.value); setShowCustom(false); }}
            >
              <Text style={[styles.timeLabel, goalTime === t.value && !showCustom && styles.timeLabelActive]}>
                {t.label}
              </Text>
              <Text style={[styles.timeSub, goalTime === t.value && !showCustom && styles.timeSubActive]}>
                {t.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 직접 시간 설정 */}
        <TouchableOpacity
          style={[styles.customTimeBtn, showCustom && styles.customTimeBtnActive]}
          onPress={() => setShowCustom(!showCustom)}
        >
          <Text style={[styles.customTimeBtnText, showCustom && { color: COLORS.primary }]}>
            + 직접 시간 설정 (분 단위)
          </Text>
        </TouchableOpacity>

        {showCustom && (
          <View style={styles.customInputRow}>
            <TextInput
              style={styles.customInput}
              placeholder="예) 90 (90분)"
              placeholderTextColor={COLORS.textMuted}
              value={customTime}
              onChangeText={setCustomTime}
              keyboardType="number-pad"
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.customConfirmBtn} onPress={handleCustomTime}>
              <Text style={styles.customConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 선택된 시간 표시 */}
        {goalTime > 0 && (
          <View style={styles.selectedTimeCard}>
            <Text style={styles.selectedTimeIcon}>⏱</Text>
            <Text style={styles.selectedTimeText}>
              목표 시간:{' '}
              <Text style={{ fontWeight: '800', color: COLORS.primary }}>
                {Math.floor(goalTime / 3600) > 0 && `${Math.floor(goalTime / 3600)}시간 `}
                {Math.floor((goalTime % 3600) / 60) > 0 && `${Math.floor((goalTime % 3600) / 60)}분`}
              </Text>
            </Text>
          </View>
        )}

        {/* 잠금 옵션 */}
        <Text style={styles.label}>잠금 옵션</Text>
        <View style={styles.optionCard}>
          <View style={styles.optionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>화면 고정 모드</Text>
              <Text style={styles.optionSub}>앱 이탈 시 이탈 횟수 +1</Text>
            </View>
            <Switch
              value={screenLock}
              onValueChange={setScreenLock}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.optionDivider} />
          <View style={styles.optionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>긴급 종료 허용</Text>
              <Text style={styles.optionSub}>비밀번호 입력 시 종료 가능</Text>
            </View>
            <Switch
              value={emergencyExit}
              onValueChange={setEmergencyExit}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* 시작 버튼 */}
        <TouchableOpacity
          style={[styles.startBtn, !subject.trim() && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={loading || !subject.trim()}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.startBtnText}>공부 시작 →</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backIcon: { fontSize: 26, color: COLORS.text, marginTop: -2 },
  backLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: COLORS.textSub, marginTop: 6, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 24, marginBottom: 12 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md,
    paddingHorizontal: 14, borderWidth: 2, borderColor: COLORS.primary,
  },
  inputIcon: { fontSize: 18, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text, fontWeight: '600' },
  clearBtn: { padding: 4 },
  clearIcon: { fontSize: 14, color: COLORS.textMuted },
  charCount: { fontSize: 12, color: COLORS.textMuted, textAlign: 'right', marginTop: 6 },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeCard: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.lg,
    paddingVertical: 20, alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.border,
  },
  timeCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, ...SHADOW.strong },
  timeLabel: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  timeLabelActive: { color: '#fff' },
  timeSub: { fontSize: 12, color: COLORS.textSub, marginTop: 4 },
  timeSubActive: { color: 'rgba(255,255,255,0.8)' },
  customTimeBtn: {
    marginTop: 10, borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, borderStyle: 'dashed',
    paddingVertical: 14, alignItems: 'center',
  },
  customTimeBtnActive: { borderColor: COLORS.primary },
  customTimeBtnText: { color: COLORS.textSub, fontSize: 14, fontWeight: '500' },
  customInputRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  customInput: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border,
  },
  customConfirmBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 20, justifyContent: 'center',
  },
  customConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  selectedTimeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md,
    padding: 12, marginTop: 12,
  },
  selectedTimeIcon: { fontSize: 16 },
  selectedTimeText: { fontSize: 14, color: COLORS.textSub },
  optionCard: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 4 },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  optionDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  optionSub: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  startBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: 18, alignItems: 'center', marginTop: 32, ...SHADOW.strong,
  },
  startBtnDisabled: { backgroundColor: COLORS.border, shadowOpacity: 0 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
});