import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { userAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOW } from '../utils/styles';

export default function ProfileScreen({ navigation }) {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    fetchUser();
  }, []));

  const fetchUser = async () => {
    try {
      const res = await userAPI.me();
      setUser(res.data);
    } catch (e) {
      console.error('유저 정보 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '탈퇴하면 모든 공부 기록이 삭제됩니다.\n정말 탈퇴하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기', style: 'destructive',
          onPress: async () => {
            try {
              await userAPI.delete();
              await logout();
            } catch (e) {
              Alert.alert('오류', '탈퇴에 실패했습니다');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const MenuItem = ({ icon, label, value, onPress, danger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Text>{icon}</Text>
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {!danger && <Text style={styles.menuArrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>내 정보</Text>

        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.nickname?.[0] || '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nickname}>{user?.nickname}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        {/* 공부 통계 요약 */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.currentStreak ?? 0}</Text>
            <Text style={styles.statLabel}>연속 달성</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.longestStreak ?? 0}</Text>
            <Text style={styles.statLabel}>최장 연속</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>계정</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="📊" label="전체 기록 보기" onPress={() => navigation.navigate('Records')} />
          <View style={styles.menuDivider} />
          <MenuItem icon="🚪" label="로그아웃" onPress={handleLogout} />
        </View>

        <View style={styles.menuCard}>
          <MenuItem icon="⚠️" label="회원 탈퇴" onPress={handleDeleteAccount} danger />
        </View>

        <Text style={styles.version}>Study Lock v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  profileCard: {
    backgroundColor: COLORS.white, marginHorizontal: 20,
    borderRadius: RADIUS.xl, padding: 20, flexDirection: 'row',
    alignItems: 'center', gap: 14, ...SHADOW.card, marginBottom: 14,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 24, color: '#fff', fontWeight: '800' },
  nickname: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  email: { fontSize: 13, color: COLORS.textSub, marginTop: 3 },
  statsCard: {
    backgroundColor: COLORS.white, marginHorizontal: 20,
    borderRadius: RADIUS.xl, padding: 20, flexDirection: 'row',
    ...SHADOW.card, marginBottom: 24,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSub, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSub, paddingHorizontal: 24, marginBottom: 10 },
  menuCard: {
    backgroundColor: COLORS.white, marginHorizontal: 20,
    borderRadius: RADIUS.xl, overflow: 'hidden',
    ...SHADOW.card, marginBottom: 14,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: '#FEE2E2' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  menuLabelDanger: { color: COLORS.danger },
  menuValue: { fontSize: 14, color: COLORS.textSub, marginRight: 4 },
  menuArrow: { fontSize: 20, color: COLORS.textMuted },
  menuDivider: { height: 1, backgroundColor: COLORS.bg, marginLeft: 64 },
  version: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12, marginTop: 8 },
});
