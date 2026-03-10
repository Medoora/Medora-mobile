// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { auth } from '@/config/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "Logged in" : "Logged out");
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check onboarding status from storage
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsed = JSON.parse(userData);
          setHasCompletedOnboarding(parsed.hasCompletedOnboarding || false);
        }
      } else {
        setHasCompletedOnboarding(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const navigateBasedOnAuth = () => {
    if (!user) {
      router.replace('/(auth)/sign-in');
    } else if (!hasCompletedOnboarding) {
      router.replace('/(onboarding)/welcome');
    } else {
      router.replace('/(dashboard)/dashboard/dashboard');
    }
  }; 

  return { user, loading, hasCompletedOnboarding, /* navigateBasedOnAuth */ };
};