// components/GoogleSignInButton.tsx
import { loginWithGoogle } from "@/config/firebase/services/auth/auth";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface GoogleSignInButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  buttonText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: 'light' | 'dark' | 'outline';
}

export function GoogleSignInButton({ 
  onSuccess, 
  onError, 
  onLoadingChange,
  buttonText = "Sign in with Google",
  disabled = false,
  fullWidth = false,
  variant = 'light'
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const getButtonClasses = () => {
    const baseClasses = "rounded-xl py-3 px-5 min-h-[48px] items-center justify-center";
    const widthClass = fullWidth ? "w-full" : "";
    
    switch (variant) {
      case 'dark':
        return `${baseClasses} bg-blue-500 ${widthClass}`;
      case 'outline':
        return `${baseClasses} bg-transparent rounded-2xl border border-white ${widthClass}`;
      default:
        return `${baseClasses} bg-white border border-gray-300 ${widthClass}`;
    }
  };

  const getTextClasses = () => {
    switch (variant) {
      case 'outline':
        return "text-white";
      default:
        return "text-gray-800";
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    onLoadingChange?.(true);
    
    try {
      const result = await loginWithGoogle();
      
      if (result.success) {
        console.log('✅ Google Sign-In Success:', result.user?.email);
        onSuccess?.(result);
      } else {
        console.error('❌ Google Sign-In Failed:', result.error);
        onError?.(result.error || 'Sign-in failed');
        
        // Platform-specific alert
        if (Platform.OS === 'ios') {
          Alert.alert('Sign-In Failed', result.error, [{ text: 'OK' }]);
        } else {
          Alert.alert('Sign-In Failed', result.error);
        }
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      onError?.(error.message);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <TouchableOpacity
      className={getButtonClasses()}
      onPress={handleGoogleSignIn}
      disabled={loading || disabled}
      activeOpacity={0.8}
      style={[
        (loading || disabled) && { opacity: 0.6 }
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'light' ? '#4285F4' : '#fff'} />
      ) : (
        <View className="flex-row items-center gap-2 justify-center">
          <Ionicons name="logo-google" size={20} color="#000" />
          <Text className={`text-base font-bold ${getTextClasses()}`}>
            {buttonText}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}