// app/(auth)/_layout.tsx
import { useAuth } from "@/context/auth-context";
import { Stack } from 'expo-router';

export default function AuthLayout() {
  const { user, hasCompletedOnboarding } = useAuth();

 /*  useEffect(() => {
   
    if (user) {
      if (hasCompletedOnboarding) {
        router.replace('/(dashboard)/dashboard/(tabs)');
      } else {
        router.replace('/(onboarding)/welcome');
      }
    }
  }, [user, hasCompletedOnboarding]);
 */
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}