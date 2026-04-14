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
import * as Linking from 'expo-linking';
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "react-native-reanimated";
import "../global.css";

// Separate component to use auth context
function RootLayoutNav() {
  const { isLoading, user } = useAuth();
  const colorScheme = useColorScheme();
  const responseListener = useRef<any>(null);

  // Handle deep links (for password reset)
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      const { path, queryParams } = Linking.parse(url);
      console.log('🔗 Deep link received:', { path, queryParams });
      
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
    
    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('📱 App opened from URL:', url);
        handleDeepLink({ url });
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

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

 /*  if (isLoading) {
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
  } */

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