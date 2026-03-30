import { auth, db } from '@/config/firebase/config';
import { signOutUser } from '@/config/firebase/services/auth/auth';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const { user } = useAuth();

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  // Theme preference
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  // User data
  const [userData, setUserData] = useState<any>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);

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

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOutUser },
    ]);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return 'sunny-outline';
      case 'dark':
        return 'moon-outline';
      default:
        return 'phone-portrait-outline';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  if (loadingUserData) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-black" showsVerticalScrollIndicator={false}>
      <View className="px-4 pt-4 pb-8">
        {/* Profile Header */}
        <View className="flex-row items-center gap-4 mb-6">
          <View className="w-16 h-16 bg-blue-500/20 rounded-full items-center justify-center">
            <Ionicons name="person" size={32} color="#3b82f6" />
          </View>
          <View>
            <Text className="text-white text-xl font-semibold">{displayName || 'User'}</Text>
            <Text className="text-neutral-500 text-sm">{user?.email}</Text>
          </View>
        </View>

        {/* Profile Options */}
        <View className="bg-neutral-900 rounded-xl overflow-hidden mb-4">
          <TouchableOpacity className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="person-outline" size={20} color="#737373" />
              <Text className="text-white text-base">Display Name</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                className="text-white text-right min-w-[120px]"
                placeholderTextColor="#737373"
              />
              <TouchableOpacity onPress={handleProfileUpdate} disabled={isUpdatingProfile}>
                <Ionicons name="checkmark" size={20} color={isUpdatingProfile ? '#737373' : '#3b82f6'} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <View className="h-px bg-neutral-800 ml-4" />

          <TouchableOpacity
            onPress={() => setShowEmail(!showEmail)}
            className="flex-row items-center justify-between px-4 py-4"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="mail-outline" size={20} color="#737373" />
              <Text className="text-white text-base">Email</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-neutral-400 text-sm">
                {showEmail ? user?.email : '••••••••••••••••'}
              </Text>
              <Ionicons name={showEmail ? 'eye-off' : 'eye'} size={18} color="#737373" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3 px-1">Appearance</Text>
        
        <View className="bg-neutral-900 rounded-xl overflow-hidden mb-4">
          <TouchableOpacity
            onPress={() => {
              const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
              setTheme(nextTheme);
            }}
            className="flex-row items-center justify-between px-4 py-4"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name={getThemeIcon()} size={20} color="#737373" />
              <Text className="text-white text-base">Theme</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-neutral-400 text-sm">{getThemeLabel()}</Text>
              <Ionicons name="chevron-forward" size={18} color="#737373" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3 px-1">Security</Text>
        
        <View className="bg-neutral-900 rounded-xl overflow-hidden mb-4">
          <TouchableOpacity onPress={handlePasswordReset} className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="key-outline" size={20} color="#737373" />
              <Text className="text-white text-base">Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#737373" />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3 px-1">Notifications</Text>
        
        <View className="bg-neutral-900 rounded-xl overflow-hidden mb-4">
          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="mail-outline" size={20} color="#737373" />
              <Text className="text-white text-base">Email Notifications</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#3f3f46', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>
          
          <View className="h-px bg-neutral-800 ml-4" />
          
          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="phone-portrait-outline" size={20} color="#737373" />
              <Text className="text-white text-base">Push Notifications</Text>
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
        
        <View className="bg-neutral-900 rounded-xl overflow-hidden mb-4">
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
        <View className="mt-4 pt-4">
          <TouchableOpacity
            onPress={handleSignOut}
            className="py-4 rounded-xl bg-neutral-900 active:bg-neutral-800"
          >
            <Text className="text-red-500 text-center text-base font-medium">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}