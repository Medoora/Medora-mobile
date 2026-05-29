// app/(dashboard)/dashboard/(tabs)/settings.tsx
import { auth, db } from '@/config/firebase/config';
import { signOutUser } from '@/config/firebase/services/auth/auth';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { getInitials } from '@/utils/cryto';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { theme, setTheme, isDark } = useAppTheme();

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isLogoutDialogVisible, setIsLogoutDialogVisible] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const route = useRouter()
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  // User data
  const [userData, setUserData] = useState<any>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);

  const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'sunny-outline' },
    { value: 'dark', label: 'Dark', icon: 'moon-outline' },
    { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoadingUserData(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);

    try {
      if (user.displayName !== displayName) {
        await updateProfile(user, { displayName });
      }
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        username: displayName,
        updatedAt: new Date(),
      });
      Alert.alert('Success', 'Profile updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetEmailSent(true);
      Alert.alert('Success', 'Reset email sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email');
    } finally {
      setIsSendingReset(false);
    }
  };

 const handleSignOut = async () => {
     try {
       await signOutUser();
       route.push("/(auth)/sign-in")
       setTimeout(() => {
       }, 300);
     } catch (error) {
       console.log("Error", error);
       
     }
   };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      default: return 'System';
    }
  };

  const handleThemeChange = async (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  if (loadingUserData) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <ScrollView className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`} showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-8">
          {/* Profile Header */}
          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-16 h-16 bg-blue-500/20 rounded-full items-center justify-center">
              {!user?.photoURL ? (
                <Text className="text-white text-2xl font-semibold uppercase">
                  {getInitials(user?.displayName || 'User')}
                </Text>
              ) : (
                <Image
                  source={{ uri: user?.photoURL }}
                  className="w-16 h-16 rounded-full"
                />
              )}
            </View>
            <View>
              <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {displayName || 'User'}
              </Text>
              <Text className="text-neutral-500 text-sm">{user?.email}</Text>
            </View>
          </View>

          {/* Profile Options */}
          <View className={`rounded-xl overflow-hidden mb-4 ${isDark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
            <TouchableOpacity className="flex-row items-center justify-between px-4 py-4">
              <View className="flex-row items-center gap-3">
                <Ionicons name="person-outline" size={20} color="#737373" />
                <Text className={`text-base ${isDark ? 'text-white' : 'text-black'}`}>Display Name</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  className={`text-right min-w-[120px] ${isDark ? 'text-white' : 'text-black'}`}
                  placeholderTextColor="#737373"
                />
                <TouchableOpacity onPress={handleProfileUpdate} disabled={isUpdatingProfile}>
                  <Ionicons name="checkmark" size={20} color={isUpdatingProfile ? '#737373' : '#3b82f6'} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            <View className={`h-px ml-4 ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />

            <TouchableOpacity
              onPress={() => setShowEmail(!showEmail)}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="mail-outline" size={20} color="#737373" />
                <Text className={`text-base ${isDark ? 'text-white' : 'text-black'}`}>Email</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-neutral-400 text-sm">
                  {showEmail ? user?.email : '••••••••••••••••'}
                </Text>
                <Ionicons name={showEmail ? 'eye-off' : 'eye'} size={18} color="#737373" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Appearance Section - Updated with working theme selector */}
          <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3 px-1">Appearance</Text>
          
          <View className={`rounded-xl overflow-hidden mb-4 ${isDark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
            {themeOptions.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleThemeChange(option.value)}
                className={`flex-row items-center justify-between px-4 py-4 ${
                  index !== themeOptions.length - 1 ? `border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}` : ''
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name={option.icon as any} size={20} color="#737373" />
                  <Text className={`text-base ${isDark ? 'text-white' : 'text-black'}`}>{option.label}</Text>
                </View>
                <View className={`w-5 h-5 rounded-full border items-center justify-center ${
                  isDark ? 'border-neutral-600' : 'border-gray-400'
                }`}>
                  {theme === option.value && (
                    <View className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Security Section */}
          <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3 px-1">Security</Text>
          
          <View className={`rounded-xl overflow-hidden mb-4 ${isDark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
            <TouchableOpacity onPress={handlePasswordReset} className="flex-row items-center justify-between px-4 py-4">
              <View className="flex-row items-center gap-3">
                <Ionicons name="key-outline" size={20} color="#737373" />
                <Text className={`text-base ${isDark ? 'text-white' : 'text-black'}`}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#737373" />
            </TouchableOpacity>
          </View>

          {/* Preferences Section */}
          <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3 px-1">Notifications</Text>
          
          <View className={`rounded-xl overflow-hidden mb-4 ${isDark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
            <View className="flex-row items-center justify-between px-4 py-4">
              <View className="flex-row items-center gap-3">
                <Ionicons name="mail-outline" size={20} color="#737373" />
                <Text className={`text-base ${isDark ? 'text-white' : 'text-black'}`}>Email Notifications</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#3f3f46', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>
            
            <View className={`h-px ml-4 ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
            
            <View className="flex-row items-center justify-between px-4 py-4">
              <View className="flex-row items-center gap-3">
                <Ionicons name="phone-portrait-outline" size={20} color="#737373" />
                <Text className={`text-base ${isDark ? 'text-white' : 'text-black'}`}>Push Notifications</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#3f3f46', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Account Info Section */}
          <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3 px-1">Account Info</Text>
          
          <View className={`rounded-xl overflow-hidden mb-4 ${isDark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
            <View className="px-4 py-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-neutral-500 text-sm">User ID</Text>
                <Text className="text-neutral-400 text-xs font-mono">{user?.uid?.slice(0, 16)}...</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-neutral-500 text-sm">Member since</Text>
                <Text className="text-neutral-400 text-sm">{formatDate(userData?.createdAt)}</Text>
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-neutral-500 text-sm">Email Status</Text>
                <View className={`px-2 py-0.5 rounded-full ${user?.emailVerified ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                  <Text className={`text-xs ${user?.emailVerified ? 'text-green-500' : 'text-yellow-500'}`}>
                    {user?.emailVerified ? 'Verified' : 'Unverified'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sign Out Button */}
          {/* <View className="mt-4 pt-4">
            <TouchableOpacity
              onPress={() => setIsLogoutDialogVisible(true)}
              className={`py-4 rounded-xl ${isDark ? 'bg-neutral-900' : 'bg-gray-200'} active:opacity-80`}
            >
              <Text className="text-red-500 text-center text-base font-medium">Sign Out</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </ScrollView>
      
     {/*  <CustomDialogBox
        actionButtonName='Logout'
        message='Are You Sure You Want to Sign Out?'
        title={`Sign out ${user?.displayName}`}
        visible={isLogoutDialogVisible}
        onCancel={() => setIsLogoutDialogVisible(false)}
        onConfirm={() => {
          handleSignOut();
          setIsLogoutDialogVisible(false);
        }}
      /> */}
    </>
  );
}