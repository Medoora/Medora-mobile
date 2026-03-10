// app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth } from '@/context/auth-context'
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function OnboardingLayout() {
  const { user, hasCompletedOnboarding } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/welcome');
    } else if (hasCompletedOnboarding) {
      router.replace('/(dashboard)/dashboard/dashboard');
    }
  }, [user, hasCompletedOnboarding]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      {/* Add other onboarding screens here */}
    </Stack>
  );
}