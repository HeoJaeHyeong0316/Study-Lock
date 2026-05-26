import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOW } from '../utils/styles';

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  // 비밀번호 유효성
  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const handleSignup = async () => {
    if (!email || !password || !nickname) {
      Alert.alert('알림', '모든 항목을 입력해주세요');
      return;
    }
    if (!hasLength || !hasLetter || !hasNumber) {
      Alert.alert('알림', '비밀번호 조건을 확인해주세요');
      return;
    }
    if (!agreed) {
      Alert.alert('알림', '이용약관에 동의해주세요');
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, nickname);
      Alert.alert('가입 완료!', '로그인해주세요', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (typeof e.response?.data === 'string' ? e.response.data : null) ||
        e.message ||
        '다시 시도해주세요';
      Alert.alert('가입 실패', msg);
    } finally {
      setLoading(false);
    }
  };

  const Badge = ({ label, ok }) => (
    <View style={[styles.badge, ok && styles.badgeOk]}>
      <Text style={[styles.badgeText, ok && styles.badgeTextOk]}>
        {ok ? '✓' : '○'} {label}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
          {/* 뒤로가기 */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.sub}>몇 가지 정보로 집중 습관을 시작해 보세요</Text>

          {/* 이메일 */}
          <Text style={styles.label}>이메일</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* 비밀번호 */}
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="8자 이상, 영문+숫자 조합"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <View style={styles.badgeRow}>
            <Badge label="8자 이상" ok={hasLength} />
            <Badge label="영문 포함" ok={hasLetter} />
            <Badge label="숫자 포함" ok={hasNumber} />
          </View>

          {/* 닉네임 */}
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            style={styles.input}
            placeholder="앱에서 사용할 이름"
            placeholderTextColor={COLORS.textMuted}
            value={nickname}
            onChangeText={setNickname}
          />

          {/* 약관 */}
          <TouchableOpacity
            style={styles.agreeRow}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.agreeText}>
              <Text style={styles.agreeLink}>이용약관</Text> 및{' '}
              <Text style={styles.agreeLink}>개인정보처리방침</Text>에 동의합니다
            </Text>
          </TouchableOpacity>

          {/* 가입 버튼 */}
          <TouchableOpacity
            style={styles.signupBtn}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.signupBtnText}>회원가입 완료</Text>
            }
          </TouchableOpacity>

          {/* 로그인 이동 */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>로그인</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 40 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.bg, alignItems: 'center',
    justifyContent: 'center', marginBottom: 24,
  },
  backIcon: { fontSize: 26, color: COLORS.text, marginTop: -2 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  sub: { color: COLORS.textSub, marginTop: 6, fontSize: 14, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: COLORS.text,
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full, backgroundColor: COLORS.bg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  badgeOk: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  badgeText: { fontSize: 12, color: COLORS.textSub },
  badgeTextOk: { color: '#16A34A', fontWeight: '600' },
  agreeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  agreeText: { flex: 1, fontSize: 13, color: COLORS.textSub, lineHeight: 20 },
  agreeLink: { color: COLORS.primary, fontWeight: '600' },
  signupBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: 17, alignItems: 'center',
    marginTop: 28, ...SHADOW.strong,
  },
  signupBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { color: COLORS.textSub, fontSize: 14 },
  loginLink: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
