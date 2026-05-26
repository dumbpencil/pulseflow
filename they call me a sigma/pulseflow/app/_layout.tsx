import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter, useSegments } from 'expo-router';
import { initSchema } from '../src/db/schema';
import { runSeedIfNeeded } from '../src/db/seed';
import { useProfileStore } from '../src/stores/profileStore';
import { useReadinessStore } from '../src/stores/readinessStore';
import { useSessionStore } from '../src/stores/sessionStore';
import { colors } from '../src/constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [authState, setAuthState] = useState<'loading' | 'authed' | 'unauthed'>('loading');
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    DMMonoRegular: require('../assets/fonts/DMMonoRegular.ttf'),
    PlusJakartaSansRegular: require('../assets/fonts/PlusJakartaSansRegular.ttf'),
    PlusJakartaSansMedium: require('../assets/fonts/PlusJakartaSansMedium.ttf'),
    PlusJakartaSansBold: require('../assets/fonts/PlusJakartaSansBold.ttf'),
    BarlowCondensedSemiBold: require('../assets/fonts/BarlowCondensedSemiBold.ttf'),
  });

  useEffect(() => {
    async function bootstrap() {
      try {
        initSchema();
        runSeedIfNeeded();
        useProfileStore.getState().loadProfile();
        useReadinessStore.getState().loadToday();
        useReadinessStore.getState().loadHistory();
        useSessionStore.getState().loadWeeklySessions();

        const token = await SecureStore.getItemAsync('auth_token');
        const ob = await SecureStore.getItemAsync('onboarding_complete');
        setOnboardingComplete(ob === 'true');
        setAuthState(token ? 'authed' : 'unauthed');
      } catch {
        setAuthState('unauthed');
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (!fontsLoaded || authState === 'loading' || onboardingComplete === null) return;
    SplashScreen.hideAsync();

    const inAuth = segments[0] === 'login';
    const inOnboarding = segments[0] === 'onboarding';

    if (authState === 'unauthed' && !inAuth) {
      router.replace('/login');
    } else if (authState === 'authed' && !onboardingComplete && !inOnboarding) {
      router.replace('/onboarding/welcome');
    } else if (authState === 'authed' && onboardingComplete && (inAuth || inOnboarding)) {
      router.replace('/');
    }
  }, [fontsLoaded, authState, onboardingComplete, segments]);

  if (!fontsLoaded || authState === 'loading') return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background.deep }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background.deep } }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="pairing" options={{ presentation: 'modal' }} />
        <Stack.Screen name="session" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
