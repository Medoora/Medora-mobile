// context/AuthContext.tsx
import { auth, db } from "@/config/firebase/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check onboarding status from Firestore
  const checkOnboardingStatus = async (uid: string) => {
    try {
      console.log("🔍 Checking onboarding status for user:", uid);

      // First check Firestore (source of truth)
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const onboardingStatus = userData.hasCompletedOnboarding || false;
        console.log("📱 Onboarding status from Firestore:", onboardingStatus);

        // Update AsyncStorage to match Firestore
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.hasCompletedOnboarding = onboardingStatus;
          await AsyncStorage.setItem("user", JSON.stringify(parsed));
        }

        return onboardingStatus;
      }

      // Fallback to AsyncStorage
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        console.log(
          "📱 Onboarding status from AsyncStorage:",
          parsed.hasCompletedOnboarding,
        );
        return parsed.hasCompletedOnboarding || false;
      }

      return false;
    } catch (error) {
      console.log("Error checking onboarding status:", error);

      // Fallback to AsyncStorage on error
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          return parsed.hasCompletedOnboarding || false;
        }
      } catch (e) {}

      return false;
    }
  };

  useEffect(() => {
    console.log("🔐 AuthProvider mounted");
    let mounted = true;

    // Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "🔥 Auth state changed:",
        firebaseUser ? "logged in" : "logged out",
      );

      if (!mounted) return;

      if (firebaseUser) {
        setUser(firebaseUser);

        const onboardingStatus = await checkOnboardingStatus(firebaseUser.uid);
        if (mounted) {
          setHasCompletedOnboarding(onboardingStatus);
        }
      } else {
        setUser(null);
        setHasCompletedOnboarding(false);
      }

      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    console.log("🧭 Navigation check:", {
      user: !!user,
      hasCompletedOnboarding,
    });

    if (!user) {
      router.replace("/(auth)/welcome");
    } else if (!hasCompletedOnboarding) {
      router.replace("/(onboarding)/onboarding");
    } else {
      router.replace("/(dashboard)/dashboard/(tabs)");
    }
  }, [isLoading, user, hasCompletedOnboarding]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
