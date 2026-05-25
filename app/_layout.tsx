// app/_layout.tsx
import { configureGoogleSignIn } from "@/config/firebase/services/auth/auth";
import { notificationService } from "@/config/firebase/services/notification/service";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { ThemeProvider, useAppTheme } from "@/context/theme-context";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import * as Linking from 'expo-linking';
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "react-native-reanimated";
import "../global.css";

// Separate component to use auth context
// Separate component to use auth context
function RootLayoutNav() {
  const { isLoading, user } = useAuth();
  const { isDark } = useAppTheme();
  const responseListener = useRef<any>(null);

  // Handle deep links (for password reset)
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      const { path } = Linking.parse(url);
      console.log('🔗 Deep link received:', { path });
      
      if (path === 'reset-success') {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been reset successfully. Please sign in with your new password.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(auth)/sign-in')
            }
          ]
        );
      }
    };
    
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('📱 App opened from URL:', url);
        handleDeepLink({ url });
      }
    });
    
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    setupPushNotifications();
    return () => {
      if (responseListener.current) responseListener.current.remove();
    };
  }, [user]);

  const setupPushNotifications = async () => {
    if (!user?.uid) return;

    const token = await notificationService.registerForPushNotifications();
    if (token) {
      await notificationService.savePushTokenToFirebase(user.uid, token);
    }

    responseListener.current = notificationService.addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('📱 Notification tapped:', data);
      
      if (data?.type === 'reminder') {
        router.push('/(dashboard)/dashboard/(tabs)/reminder');
      }
    });
  };

  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    configureGoogleSignIn();
  }, []);
  
  return (
    <AuthProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </ThemeProvider>
    </AuthProvider>
  );
}