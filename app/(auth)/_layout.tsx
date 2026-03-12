// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth } from "@/context/auth-context"
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function AuthLayout() {
  const { user, hasCompletedOnboarding } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect appropriately
    if (user) {
      if (hasCompletedOnboarding) {
        router.replace('/(dashboard)/dashboard/(tabs)');
      } else {
        router.replace('/(onboarding)/welcome');
      }
    }
  }, [user, hasCompletedOnboarding]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}