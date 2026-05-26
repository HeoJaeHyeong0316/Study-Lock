import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/client';
import api from '../api/client';

const AuthContext = createContext(null);

// 로그인/회원가입 후 FCM 토큰을 백엔드에 등록
async function registerFcmTokenToBackend() {
  try {
    const messaging = (await import('@react-native-firebase/messaging')).default;
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (!enabled) return;
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      await api.post('/api/user/fcm-token', { fcmToken });
      console.log('FCM 토큰 등록 완료');
    }
  } catch (e) {
    console.warn('FCM 토큰 등록 실패:', e?.message);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 저장된 토큰 확인
  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error('토큰 확인 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { accessToken, refreshToken } = res.data;
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify({ email }));
    setUser({ email });
    // 로그인 직후 FCM 토큰 등록 (await 안 함 - 실패해도 로그인은 성공)
    registerFcmTokenToBackend();
    return res.data;
  };

  const signup = async (email, password, nickname) => {
    await authAPI.signup({ email, password, nickname });
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
