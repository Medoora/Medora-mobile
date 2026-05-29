import { GoogleSignInButton } from '@/components/buttons/google-button';
import ForgotPassword from '@/components/modal/forgot-pass/forgot-password';
import { directLogin, resetPassword } from '@/config/firebase/services/auth/auth';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignIn() {
  const { isDark } = useAppTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { user, hasCompletedOnboarding } = useAuth();
  const [passwordShow, setPasswordShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotModal, setForgotModal] = useState(false);

  // Theme-aware colors
  const bgColor = isDark ? 'bg-[#0A0A0A]' : 'bg-white';
  const cardBg = isDark ? 'bg-neutral-900' : 'bg-gray-100';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-zinc-300' : 'text-gray-600';
  const textTertiary = isDark ? 'text-zinc-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-neutral-900' : 'bg-gray-100';
  const inputText = isDark ? 'text-zinc-100' : 'text-black';
  const placeholderColor = isDark ? '#525252' : '#9ca3af';
  const borderColor = isDark ? 'border-zinc-800' : 'border-gray-200';
  const dividerBg = isDark ? 'bg-zinc-800' : 'bg-gray-300';
  const errorBg = isDark ? 'bg-red-500/10' : 'bg-red-50';
  const errorBorder = isDark ? 'border-red-500/20' : 'border-red-200';
  const errorText = isDark ? 'text-red-400' : 'text-red-600';
  const linkText = isDark ? 'text-blue-400' : 'text-blue-600';

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
        
        if (result.user) {
          await AsyncStorage.setItem('user', JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            emailVerified: result.user.emailVerified,
            hasCompletedOnboarding: !result.needsOnboarding
          }));
        }
        
        setFormData({ email: '', password: '' });
        
      } else {
        console.log("❌ Login failed:", result.error);
        
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

  const handleGoogleSuccess = async () => {
    console.log('User signed in:', user?.email);
    if (!hasCompletedOnboarding) {
      router.push('/(onboarding)/onboarding');
    } else {
      router.replace('/(dashboard)/dashboard/(tabs)');
    }
  };

  const handleGoogleError = (error: string) => {
    console.error('Google sign-in error:', error);
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      Alert.alert(
        "Email Required",
        "Please enter your email address to reset your password.",
        [{ text: "OK" }]
      );
      return;
    }
    
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
    <>
      <View className={`flex-1 ${bgColor}`}>
        <StatusBar style={isDark ? "light" : "dark"} />
        
        <SafeAreaView className="flex-1">
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 px-6 pt-8 pb-12">
              
              {/* Logo */}
              <View className="items-center mt-5 mb-5">
                <Image
                  source={require('@/assets/icons/adaptive-icon.png')}
                  className="w-16 h-16 rounded-3xl"
                  resizeMode="contain"
                />
              </View>

              {/* Header */}
              <View className="mb-10">
                <Text className={`text-2xl ${textPrimary} font-medium tracking-tight text-center`}>
                  Welcome back
                </Text>
                <Text className={`text-sm ${textSecondary} text-center mt-2 font-medium`}>
                  Sign in to continue your health journey
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View className={`mb-6 p-4 ${errorBg} rounded-xl border ${errorBorder}`}>
                  <Text className={`${errorText} text-sm text-center font-medium`}>{error}</Text>
                </View>
              )}

              {/* Form */}
              <View className="space-y-6">
                {/* Email */}
                <View className='mb-4'>
                  <TextInput
                    className={`${inputBg} ${inputText} px-4 py-4 text-base rounded-xl`}
                    placeholder="Enter your email"
                    placeholderTextColor={placeholderColor}
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
                      className={`${inputBg} ${inputText} px-4 py-4 text-base rounded-xl pr-12`}
                      placeholder="Enter your password"
                      placeholderTextColor={placeholderColor}
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
                    onPress={() => setForgotModal(true)}
                    className="self-end mt-2"
                    disabled={loading || googleLoading}
                  >
                    <Text className={`${linkText} text-xs font-medium`}>
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  onPress={handleSignIn}
                  disabled={loading || googleLoading}
                  className="mt-4 bg-blue-600 py-4 rounded-xl"
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <View className="flex-row justify-center items-center">
                      <ActivityIndicator size="small" color="#000000" />
                      <Text className="text-white font-medium text-base ml-2">
                        Signing in...
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-white text-center font-medium text-base">
                      Sign in
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View className="flex-row items-center my-6">
                  <View className={`flex-1 h-[1px] ${dividerBg}`} />
                  <Text className={`mx-4 ${textTertiary} text-sm font-light`}>or</Text>
                  <View className={`flex-1 h-[1px] ${dividerBg}`} />
                </View>

                {/* Google Sign In */}
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  fullWidth={true}
                  buttonText='Continue With Google'
                />
                
                {/* Sign Up Link */}
                <View className="flex-row justify-center mt-8">
                  <Text className={`${textSecondary} text-sm font-medium`}>Don't have an account? </Text>
                  <TouchableOpacity 
                    onPress={() => router.push('/(auth)/sign-up')}
                    disabled={loading || googleLoading}
                  >
                    <Text className={`${linkText} text-sm font-medium`}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
      
      <ForgotPassword
        visible={forgotModal}
        onClose={() => setForgotModal(false)}
      />
    </>
  );
}