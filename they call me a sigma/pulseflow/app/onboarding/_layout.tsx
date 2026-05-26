import { Stack } from 'expo-router';
import { colors } from '../../src/constants/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.deep },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="connect" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
