import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { configureApi } from '@repo/api';

import { getTokenSync, hydrateAuth } from '../lib/storage';

import { Platform } from 'react-native';

const defaultBaseUrl = 
  Platform.OS === 'android' 
    ? 'http://10.0.2.2:8080/api/v1' 
    : 'http://localhost:8080/api/v1';

configureApi({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || defaultBaseUrl,
  tokenProvider: getTokenSync,
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateAuth().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-civic-background">
        <ActivityIndicator size="large" color="#5b8aff" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
