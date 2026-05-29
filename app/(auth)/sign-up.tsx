import { GoogleSignInButton } from '@/components/buttons/google-button';
import { signUpUser } from '@/config/firebase/services/auth/auth';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const { isDark } = useAppTheme();
  const { user, hasCompletedOnboarding } = useAuth();
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
  });
  
  const [passwordShow, setPasswordShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    fullname: '',
    email: '',
    password: ''
  });

  // Theme-aware colors
  const bgColor = isDark ? 'bg-[#0A0A0A]' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-zinc-300' : 'text-gray-600';
  const textTertiary = isDark ? 'text-zinc-600' : 'text-gray-500';
  const inputBg = isDark ? 'bg-zinc-900' : 'bg-gray-100';
  const inputText = isDark ? 'text-zinc-100' : 'text-black';
  const placeholderColor = isDark ? '#525252' : '#9ca3af';
  const borderColor = isDark ? 'border-zinc-800' : 'border-gray-200';
  const dividerBg = isDark ? 'bg-zinc-800' : 'bg-gray-300';
  const errorBg = isDark ? 'bg-red-500/10' : 'bg-red-50';
  const errorBorder = isDark ? 'border-red-500/20' : 'border-red-200';
  const errorText = isDark ? 'text-red-400' : 'text-red-600';
  const linkText = isDark ? 'text-blue-400' : 'text-blue-600';
  const checkboxColor = isDark ? '#3B82F6' : '#2563eb';
  const checkboxInactive = isDark ? '#404040' : '#9ca3af';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
    validateField(field, value);
  };

  const validateField = (field: string, value: string) => {
    if (field === 'fullname') {
      if (value && value.length < 2) {
        setFieldErrors(prev => ({ ...prev, fullname: 'Name must be at least 2 characters' }));
      } else {
        setFieldErrors(prev => ({ ...prev, fullname: '' }));
      }
    }
    
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, email: 'Invalid email format' }));
      } else {
        setFieldErrors(prev => ({ ...prev, email: '' }));
      }
    }
    
    if (field === 'password') {
      if (value && value.length < 6) {
        setFieldErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
      } else {
        setFieldErrors(prev => ({ ...prev, password: '' }));
      }
    }
  };

  // google buttons 
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

  const validateForm = (): boolean => {
    setError(null);
    
    if (formData.fullname.length < 2) {
      setError("Enter your full name");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Enter a valid email address");
      return false;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    
    if (!termsAccepted) {
      setError("You must agree to the Terms and Privacy Policy");
      return false;
    }
    
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("📝 Attempting signup for:", formData.email);
      
      const result = await signUpUser(
        formData.email, 
        formData.password, 
        formData.fullname
      );
      
      if (result.success) {
        console.log("✅ Signup successful for:", formData.email);
        
        if (result.user) {
          await AsyncStorage.setItem('user', JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            emailVerified: result.user.emailVerified
          }));
        }
        
        Alert.alert(
          "Account Created!",
          "Your account has been created successfully. Please check your email for verification.",
          [
            { 
              text: "Continue to Onboarding", 
              onPress: () => router.replace('/(onboarding)/onboarding')
            }
          ]
        );
      } else {
        console.log("❌ Signup failed:", result.error);
        
        if (result.error?.includes('email-already-in-use') || result.error?.includes('Email already registered')) {
          setError("This email is already registered. Please sign in instead.");
        } else if (result.error?.includes('invalid-email')) {
          setError("Invalid email address format.");
        } else if (result.error?.includes('weak-password')) {
          setError("Password is too weak. Please use a stronger password.");
        } else {
          setError(result.error || "Sign up failed. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("❌ Signup error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      className={`flex-1 ${bgColor}`}
    >
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
                Create your account
              </Text>
              <Text className={`text-sm ${textSecondary} text-center mt-2 font-light`}>
                Join Medora for smarter health tracking
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View className={`mb-6 p-4 ${errorBg} rounded-xl border ${errorBorder} flex-row items-center`}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className={`${errorText} text-sm font-light ml-2 flex-1`}>{error}</Text>
              </View>
            )}

            {/* Form */}
            <View className="space-y-6">
              {/* Full Name */}
              <View className='mb-4'>
                <TextInput
                  className={`${inputBg} ${inputText} px-4 py-4 text-base rounded-xl`}
                  placeholder="Full name"
                  placeholderTextColor={placeholderColor}
                  value={formData.fullname}
                  onChangeText={(value) => handleInputChange('fullname', value)}
                  onBlur={() => validateField('fullname', formData.fullname)}
                  editable={!loading && !googleLoading}
                />
                {fieldErrors.fullname ? (
                  <Text className={`${errorText} text-xs mt-1 ml-1 font-light`}>{fieldErrors.fullname}</Text>
                ) : null}
              </View>

              {/* Email */}
              <View className='mb-4'>
                <TextInput
                  className={`${inputBg} ${inputText} px-4 py-4 text-base rounded-xl`}
                  placeholder="Email address"
                  placeholderTextColor={placeholderColor}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  onBlur={() => validateField('email', formData.email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading && !googleLoading}
                />
                {fieldErrors.email ? (
                  <Text className={`${errorText} text-xs mt-1 ml-1 font-light`}>{fieldErrors.email}</Text>
                ) : null}
              </View>

              {/* Password */}
              <View>
                <View className="relative">
                  <TextInput
                    className={`${inputBg} ${inputText} px-4 py-4 text-base rounded-xl pr-12`}
                    placeholder="Password"
                    placeholderTextColor={placeholderColor}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    onBlur={() => validateField('password', formData.password)}
                    secureTextEntry={!passwordShow}
                    editable={!loading && !googleLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setPasswordShow(!passwordShow)}
                    className="absolute right-3 top-4"
                    disabled={loading || googleLoading}
                  >
                    <Ionicons 
                      name={passwordShow ? 'eye-off-outline' : 'eye-outline'} 
                      size={22} 
                      color="#737373" 
                    />
                  </TouchableOpacity>
                </View>
                {fieldErrors.password ? (
                  <Text className={`${errorText} text-xs mt-1 ml-1 font-light`}>{fieldErrors.password}</Text>
                ) : (
                  <Text className={`${textTertiary} text-xs mt-2 font-light ml-1`}>
                    Minimum 6 characters
                  </Text>
                )}
              </View>

              {/* Terms Checkbox */}
              <View className="flex-row items-center mt-4">
                <Checkbox
                  value={termsAccepted}
                  onValueChange={setTermsAccepted}
                  color={termsAccepted ? checkboxColor : checkboxInactive}
                  style={{ borderRadius: 4, width: 20, height: 20 }}
                  disabled={loading || googleLoading}
                />
                <Text className={`${textTertiary} text-sm ml-3 font-light flex-1`}>
                  I agree to the{' '}
                  <Text 
                    className={`${linkText} font-light`}
                    onPress={() => router.push('/(auth)/welcome')}
                  >
                    Terms
                  </Text>
                  {' '}and{' '}
                  <Text 
                    className={`${linkText} font-light`}
                    onPress={() => router.push('/(auth)/welcome')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={loading || googleLoading}
                className="mt-8 bg-blue-600 py-4 rounded-xl"
                activeOpacity={0.8}
              >
                {loading ? (
                  <View className="flex-row justify-center items-center">
                    <ActivityIndicator size="small" color="#000000" />
                    <Text className="text-white font-medium text-base ml-2">
                      Creating account...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white text-center font-medium text-base">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className={`flex-1 h-[1px] ${dividerBg}`} />
                <Text className={`mx-4 ${textTertiary} text-sm font-light`}>or</Text>
                <View className={`flex-1 h-[1px] ${dividerBg}`} />
              </View>

              {/* Google Sign Up */}
              <GoogleSignInButton
                buttonText='Continue With Google'
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                fullWidth={true}
              />
              
              {/* Sign In Link */}
              <View className="flex-row justify-center mt-8">
                <Text className={`${textSecondary} text-sm font-medium`}>Already have an account? </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(auth)/sign-in')}
                  disabled={loading || googleLoading}
                >
                  <Text className={`${linkText} text-sm font-bold`}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}