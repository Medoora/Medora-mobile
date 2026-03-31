// app/(auth)/_layout.tsx
import { useAuth } from "@/context/auth-context";
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { user, hasCompletedOnboarding } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect appropriately
    if (user) {
      if (hasCompletedOnboarding) {
        router.replace('/(dashboard)/dashboard/(tabs)');
      } else {
        router.replace('/(onboarding)/onboarding');
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