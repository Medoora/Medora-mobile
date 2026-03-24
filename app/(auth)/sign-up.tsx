import { signUpUser } from '@/config/firebase/services/auth/auth';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
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
        
        // Store user data in AsyncStorage
        if (result.user) {
          await AsyncStorage.setItem('user', JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            emailVerified: result.user.emailVerified
          }));
        }
        
        // Show success message
        Alert.alert(
          "Account Created!",
          "Your account has been created successfully. Please check your email for verification.",
          [
            { 
              text: "Continue to Onboarding", 
              onPress: () => router.replace('/(onboarding)/welcome')
            }
          ]
        );
      } else {
        console.log("❌ Signup failed:", result.error);
        
        // Handle specific error messages
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

/*   const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      console.log("🔐 Attempting Google Sign-Up");
      
      // Check if Google Sign-In is configured
      if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
        setError("Google Sign-In is not configured. Please check your environment variables.");
        setGoogleLoading(false);
        return;
      }
      
      const result = await loginWithGoogle(null);
      
      if (result.success) {
        console.log("✅ Google Sign-Up successful");
        
        // Store user data
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
          console.log("📱 Google user needs onboarding");
          router.replace('/(dashboard)/dashboard/dashboard');
        } else {
          console.log("📱 Google user has completed onboarding, going to dashboard");
          router.replace('/(dashboard)/dashboard/dashboard');
        }
      } else {
        console.log("❌ Google Sign-Up failed:", result.error);
        setError(result.error || "Google sign up failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Google Sign-Up Error:", error);
      setError("Google sign up failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };
 */
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      className="flex-1 bg-[#0A0A0A]"
    >
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
                Create your account
              </Text>
              <Text className="text-sm text-zinc-300 text-center mt-2 font-light">
                Join Medora for smarter health tracking
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View className="mb-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-red-400 text-sm font-light ml-2 flex-1">{error}</Text>
              </View>
            )}

            {/* Form */}
            <View className="space-y-6">
              {/* Full Name */}
              <View className='mb-4'>
                <TextInput
                  className="bg-zinc-900 text-zinc-100 px-4 py-4 text-base rounded-xl placeholder:text-zinc-400"
                  placeholder="Full name"
                  placeholderTextColor="#525252"
                  value={formData.fullname}
                  onChangeText={(value) => handleInputChange('fullname', value)}
                  onBlur={() => validateField('fullname', formData.fullname)}
                  editable={!loading && !googleLoading}
                />
                {fieldErrors.fullname ? (
                  <Text className="text-red-400 text-xs mt-1 ml-1 font-light">{fieldErrors.fullname}</Text>
                ) : null}
              </View>

              {/* Email */}
              <View className='mb-4'>
                <TextInput
                  className="bg-zinc-900 text-zinc-100 px-4 py-4 text-base rounded-xl placeholder:text-zinc-400"
                  placeholder="Email address"
                  placeholderTextColor="#525252"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  onBlur={() => validateField('email', formData.email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading && !googleLoading}
                />
                {fieldErrors.email ? (
                  <Text className="text-red-400 text-xs mt-1 ml-1 font-light">{fieldErrors.email}</Text>
                ) : null}
              </View>

              {/* Password */}
              <View>
                <View className="relative">
                  <TextInput
                    className="bg-neutral-900 text-zinc-100 px-4 py-4 text-base rounded-xl pr-12 placeholder:text-zinc-400"
                    placeholder="Password"
                    placeholderTextColor="#525252"
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
                  <Text className="text-red-400 text-xs mt-1 ml-1 font-light">{fieldErrors.password}</Text>
                ) : (
                  <Text className="text-xs text-zinc-600 mt-2 font-light ml-1">
                    Minimum 6 characters
                  </Text>
                )}
              </View>

              {/* Terms Checkbox */}
              <View className="flex-row items-center mt-4">
                <Checkbox
                  value={termsAccepted}
                  onValueChange={setTermsAccepted}
                  color={termsAccepted ? '#3B82F6' : '#404040'}
                  style={{ borderRadius: 4, width: 20, height: 20 }}
                  disabled={loading || googleLoading}
                />
                <Text className="text-zinc-400 text-sm ml-3 font-light flex-1">
                  I agree to the{' '}
                  <Text 
                    className="text-blue-400 font-light"
                    onPress={() => router.push('/(auth)/welcome')}
                  >
                    Terms
                  </Text>
                  {' '}and{' '}
                  <Text 
                    className="text-blue-400 font-light"
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
                className="mt-8 bg-white py-4 rounded-xl"
                activeOpacity={0.8}
              >
                {loading ? (
                  <View className="flex-row justify-center items-center">
                    <ActivityIndicator size="small" color="#000000" />
                    <Text className="text-black font-medium text-base ml-2">
                      Creating account...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-black text-center font-medium text-base">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-[1px] bg-zinc-800" />
                <Text className="mx-4 text-zinc-600 text-sm font-light">or</Text>
                <View className="flex-1 h-[1px] bg-zinc-800" />
              </View>

              {/* Google Sign Up */}
              <TouchableOpacity
               /*  onPress={handleGoogleSignUp} */
                disabled={googleLoading || loading}
                className="border border-zinc-800 py-4 rounded-xl flex-row justify-center items-center"
                activeOpacity={0.7}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                    <Text className="text-zinc-300 font-light text-base ml-2">
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Sign In Link */}
              <View className="flex-row justify-center mt-8">
                <Text className="text-zinc-300 text-sm font-medium">Already have an account? </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(auth)/sign-in')}
                  disabled={loading || googleLoading}
                >
                  <Text className="text-blue-400 text-sm font-bold">Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}