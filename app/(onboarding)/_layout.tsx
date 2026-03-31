// app/(onboarding)/_layout.tsx
import { useAuth } from '@/context/auth-context';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';

export default function OnboardingLayout() {
  const { user, hasCompletedOnboarding } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/welcome');
    } else if (hasCompletedOnboarding) {
      router.replace('/(dashboard)/dashboard/(tabs)');
    }
  }, [user, hasCompletedOnboarding]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      {/* Add other onboarding screens here */}
    </Stack>
  );
}