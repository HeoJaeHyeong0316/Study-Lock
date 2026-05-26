import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/styles';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StudySetupScreen from '../screens/StudySetupScreen';
import StudyTimerScreen from '../screens/StudyTimerScreen';
import StudyResultScreen from '../screens/StudyResultScreen';
import RecordsScreen from '../screens/RecordsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 탭 아이콘
const TabIcon = ({ label, focused }) => {
  const icons = { 홈: '🏠', 통계: '📊', 내정보: '👤' };
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
        {icons[label]}
      </Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
        {label}
      </Text>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', paddingTop: 6 },
  icon: { fontSize: 22, opacity: 0.4 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  labelActive: { color: COLORS.primary, fontWeight: '700' },
});

// 하단 탭 (홈 / 통계 / 내정보)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 80,
          paddingBottom: 16,
          paddingTop: 4,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="홈" focused={focused} /> }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="통계" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="내정보" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// 인증된 사용자용 스택
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="StudySetup" component={StudySetupScreen} />
      <Stack.Screen
        name="StudyTimer"
        component={StudyTimerScreen}
        options={{ gestureEnabled: false }} // 스와이프 뒤로가기 차단
      />
      <Stack.Screen
        name="StudyResult"
        component={StudyResultScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Records" component={RecordsScreen} />
    </Stack.Navigator>
  );
}

// 비인증 사용자용 스택
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// 루트 네비게이터
export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <View style={{
          width: 72, height: 72, borderRadius: 20,
          backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <Text style={{ fontSize: 32 }}>🔒</Text>
        </View>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
