import { AuthProvider, useAuth } from "@/context/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function RootLayoutNav() {
  const { user, isLoading, hasCompletedOnboarding } = useAuth();
  const colorScheme = useColorScheme();

  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false); // 🔥 critical

  useEffect(() => {
    if (isLoading) return;
    if (hasNavigated.current) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    // routing logic (single place)
    if (!user && !inAuthGroup) {
      hasNavigated.current = true;
      router.replace("/(auth)/welcome");
    } else if (user && !hasCompletedOnboarding && !inOnboardingGroup) {
      hasNavigated.current = true;
      router.replace("/(onboarding)/welcome");
    } else if (user && hasCompletedOnboarding) {
      hasNavigated.current = true;
      router.replace("/(dashboard)/dashboard/(tabs)");
    }
  }, [user, isLoading, hasCompletedOnboarding, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0A0A0A",
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}