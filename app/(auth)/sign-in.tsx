import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { directLogin, loginWithGoogle, resetPassword } from '@/config/firebase/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debugNetwork } from '@/utils/networkDebug';

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [passwordShow, setPasswordShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    setError(null);
    
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Enter a valid email address");
      return false;
    }
    
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    
    return true;
  };

 const handleSignIn = async () => {
  if (!validateForm()) return;
  
  setLoading(true);
  setError(null);
  
  try {
    console.log("🔐 Attempting login for:", formData.email);
    const result = await directLogin(formData.email, formData.password);
    
    if (result.success) {
      console.log("✅ Login successful for:", formData.email);
      
      // Store user data in AsyncStorage with onboarding status
      if (result.user) {
        await AsyncStorage.setItem('user', JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          emailVerified: result.user.emailVerified,
          hasCompletedOnboarding: !result.needsOnboarding // Store onboarding status
        }));
      }
      
      // Clear form
      setFormData({ email: '', password: '' });
      
      // Show success message (optional)
      Alert.alert(
        "Success",
        "Logged in successfully!",
        [{ text: "OK" }]
      );
      
      // DO NOT navigate here - let the AuthContext handle navigation
      // The context will automatically redirect based on user and onboarding status
      
    } else {
      console.log("❌ Login failed:", result.error);
      
      // Handle specific error messages
      if (result.error?.includes('invalid-credential') || result.error?.includes('Invalid email or password')) {
        setError("Invalid email or password. Please try again.");
      } else if (result.error?.includes('user-not-found') || result.error?.includes('No account found')) {
        setError("No account found with this email. Please sign up first.");
      } else if (result.error?.includes('network')) {
        setError("Network error. Please check your connection.");
      } else {
        setError(result.error || "Sign in failed. Please try again.");
      }
    }
  } catch (error: any) {
    console.error("❌ Login error:", error);
    setError("An unexpected error occurred. Please try again.");
  } finally {
    setLoading(false);
  }
};
/*   const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      console.log("🔐 Attempting Google Sign-In");
      
      // Dynamically import Google Sign-In
      let GoogleSignin;
      try {
        const googleSignIn = require('@react-native-google-signin/google-signin');
        GoogleSignin = googleSignIn.GoogleSignin;
        
        // Configure Google Sign-In
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        });
      } catch (error) {
        console.log("⚠️ Google Sign-In module not available");
        setError("Google Sign-In is not configured. Please use email/password.");
        setGoogleLoading(false);
        return;
      }
      
      const result = await loginWithGoogle(GoogleSignin);
      
      if (result.success) {
        console.log("✅ Google Sign-In successful");
        
        // Store user data in AsyncStorage
        if (result.user) {
          await AsyncStorage.setItem('user', JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            emailVerified: result.user.emailVerified
          }));
        }
        
        // Navigate based on onboarding status
        if (result.needsOnboarding) {
          console.log("📱 Google user needs onboarding (first app login)");
          router.replace('/(dashboard)/dashboard/dashboard');
        } else {
          console.log("📱 Google user has completed onboarding, going to dashboard");
          router.replace('/(dashboard)/dashboard/dashboard');
        }
      } else {
        console.log("❌ Google Sign-In failed:", result.error);
        setError(result.error || "Google sign in failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      
      // Handle specific Google Sign-In errors
      if (error.code === 'SIGN_IN_CANCELLED') {
        setError("Sign-in cancelled");
      } else if (error.code === 'IN_PROGRESS') {
        setError("Sign-in already in progress");
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setError("Google Play Services not available");
      } else {
        setError(error.message || "Google sign in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };
 */
  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      Alert.alert(
        "Email Required",
        "Please enter your email address to reset your password.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await resetPassword(formData.email);
      
      if (result.success) {
        Alert.alert(
          "Password Reset Email Sent",
          `Check your inbox at ${formData.email} for instructions to reset your password.`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to send password reset email. Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <StatusBar style="light" />
      
      <SafeAreaView className="flex-1">
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-8 pb-12">
            
            {/* Logo */}
            <View className="items-center mb-12">
              <Image
                source={require('@/assets/logo/4.png')}
                className="w-24 h-24"
                resizeMode="contain"
              />
            </View>

            {/* Header */}
            <View className="mb-10">
              <Text className="text-2xl text-white font-medium tracking-tight text-center">
                Welcome back
              </Text>
              <Text className="text-sm text-zinc-300 text-center mt-2 font-medium">
                Sign in to continue your health journey
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View className="mb-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <Text className="text-red-400 text-sm text-center font-medium">{error}</Text>
              </View>
            )}

            {/* Form */}
            <View className="space-y-6">
              {/* Email */}
              <View className='mb-4'>
                <TextInput
                  className="bg-neutral-900 text-zinc-100 px-4 py-4 text-base rounded-xl placeholder:text-zinc-400"
                  placeholder="Enter your email"
                  placeholderTextColor="#525252"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading && !googleLoading}
                />
              </View>

              {/* Password */}
              <View>
                <View className="relative">
                  <TextInput
                    className="bg-zinc-900 text-zinc-100 px-4 py-4 text-base rounded-xl pr-12"
                    placeholder="Enter your password"
                    placeholderTextColor="#525252"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!passwordShow}
                    editable={!loading && !googleLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setPasswordShow(!passwordShow)}
                    className="absolute right-3 top-3"
                    disabled={loading || googleLoading}
                  >
                    <Ionicons 
                      name={passwordShow ? 'eye-off-outline' : 'eye-outline'} 
                      size={22} 
                      color="#737373" 
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Forgot Password Link */}
                <TouchableOpacity 
                  onPress={handleForgotPassword}
                  className="self-end mt-2"
                  disabled={loading || googleLoading}
                >
                  <Text className="text-blue-400 text-xs font-medium">
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleSignIn}
                disabled={loading || googleLoading}
                className="mt-4 bg-white py-4 rounded-xl"
                activeOpacity={0.8}
              >
                {loading ? (
                  <View className="flex-row justify-center items-center">
                    <ActivityIndicator size="small" color="#000000" />
                    <Text className="text-black font-medium text-base ml-2">
                      Signing in...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-black text-center font-medium text-base">
                    Sign in
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-[1px] bg-zinc-800" />
                <Text className="mx-4 text-zinc-600 text-sm font-light">or</Text>
                <View className="flex-1 h-[1px] bg-zinc-800" />
              </View>

 <TouchableOpacity
    onPress={async () => {
      console.log("🔍 Running network debug...");
      await debugNetwork();
    }}
    className="bg-zinc-800 py-3 px-4 rounded-xl"
  >
    <Text className="text-white text-center">Debug Network</Text>
  </TouchableOpacity>
              {/* Google Sign In */}
              <TouchableOpacity
             /*    onPress={handleGoogleSignIn} */
                disabled={googleLoading || loading}
                className="border border-zinc-800 py-4 rounded-xl flex-row justify-center items-center"
                activeOpacity={0.7}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                    <Text className="text-zinc-300 font-medium text-base ml-2">
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View className="flex-row justify-center mt-8">
                <Text className="text-zinc-300 text-sm font-medium">Don't have an account? </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(auth)/sign-up')}
                  disabled={loading || googleLoading}
                >
                  <Text className="text-blue-400 text-sm font-medium">Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}