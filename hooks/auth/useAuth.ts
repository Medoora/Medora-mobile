/* // hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { 
  loginUser, 
  signUpUser, 
  signOutUser,
  directLogin,
  getCurrentUserWithData,
  setupAuthListener,
  type AuthUser
} from '@/config/firebase/services/auth';
import { User } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = setupAuthListener(async (firebaseUser, userData) => {
      setUser(firebaseUser);
      setAuthUser(userData || null);
      
      if (firebaseUser && userData) {
        // Check onboarding status from your existing logic
        setNeedsOnboarding(!userData.hasCompletedOnboarding);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const result = await directLogin(email, password);
    if (result.success && result.needsOnboarding !== undefined) {
      setNeedsOnboarding(result.needsOnboarding);
    }
    setLoading(false);
    return result;
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    const result = await signUpUser(email, password, username);
    setLoading(false);
    return result;
  };

  const logout = async () => {
    setLoading(true);
    const result = await signOutUser();
    if (result.success) {
      setUser(null);
      setAuthUser(null);
      setNeedsOnboarding(false);
    }
    setLoading(false);
    return result;
  };

  return {
    user,
    authUser,
    loading,
    needsOnboarding,
    login,
    signUp,
    logout,
    isAuthenticated: !!user
  };
}; */