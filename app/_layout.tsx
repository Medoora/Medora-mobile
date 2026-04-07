// app/_layout.tsx
import { configureGoogleSignIn } from "@/config/firebase/services/auth/auth";
import { notificationService } from "@/config/firebase/services/notification/service";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "react-native-reanimated";
import "../global.css";

// Separate component to use auth context
function RootLayoutNav() {
  const { isLoading, user } = useAuth();
  const colorScheme = useColorScheme();
  const responseListener = useRef<any>(null);

  useEffect(() => {
    setupPushNotifications();
    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  const setupPushNotifications = async () => {
    if (!user?.uid) return;

    // Register for push notifications
    const token = await notificationService.registerForPushNotifications();
    if (token) {
      await notificationService.savePushTokenToFirebase(user.uid, token);
    }

    // Handle notification response (when user taps on notification)
    responseListener.current = notificationService.addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('📱 Notification tapped:', data);
      
      // Navigate based on notification type
      if (data?.type === 'reminder') {
        router.push('/(dashboard)/dashboard/(tabs)/reminder');
      }
    });
  };

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
  useEffect(() => {
    configureGoogleSignIn();
  }, []);
  
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}