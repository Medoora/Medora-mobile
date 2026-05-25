// app/(screens)/notification-settings.tsx
import DashboardWrapper from '@/components/wrapper/dashboard-wrapper';
import { notificationService } from '@/config/firebase/services/notification/service';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const soundOptions = [
  { id: 'default', name: 'Default', file: 'default', icon: 'volume-high-outline' },
  { id: 'guitar', name: 'Guitar', file: 'guitar', icon: 'musical-notes-outline' },
  { id: 'msg', name: 'Message', file: 'msg', icon: 'chatbubble-outline' },
  { id: 'scifi', name: 'Sci-Fi', file: 'scifi', icon: 'planet-outline' },
  { id: 'scifi2', name: 'Sci-Fi 2', file: 'scifi2', icon: 'rocket-outline' },
  { id: 'woss', name: 'Woss', file: 'woss', icon: 'volume-medium-outline' },
];

const SkeletonLoader = () => {
  const { isDark } = useAppTheme();
  const skeletonBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  
  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'} px-5 pt-4`}>
      <View className="flex-row justify-between items-center py-4">
        <View>
          <View className={`w-32 h-5 ${skeletonBg} rounded mb-1`} />
          <View className={`w-48 h-3 ${skeletonBg} rounded`} />
        </View>
        <View className={`w-12 h-6 ${skeletonBg} rounded-full`} />
      </View>
      <View className="mt-8">
        <View className={`w-24 h-4 ${skeletonBg} rounded mb-3`} />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} className="flex-row justify-between items-center py-4">
            <View className="flex-row items-center gap-3">
              <View className={`w-9 h-9 ${skeletonBg} rounded-full`} />
              <View>
                <View className={`w-24 h-4 ${skeletonBg} rounded mb-1`} />
                <View className={`w-32 h-3 ${skeletonBg} rounded`} />
              </View>
            </View>
            <View className={`w-12 h-6 ${skeletonBg} rounded`} />
          </View>
        ))}
      </View>
    </View>
  );
};

const NotificationSettingsScreen = () => {
  const { user } = useAuth();
  const { isDark } = useAppTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState('default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Theme-aware colors
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const cardBg = isDark ? 'bg-neutral-950' : 'bg-white';
  const borderColor = isDark ? 'border-neutral-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-500' : 'text-gray-500';
  const textTertiary = isDark ? 'text-neutral-300' : 'text-gray-700';
  const iconBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  const iconColor = isDark ? '#a3a3a3' : '#6b7280';
  const activeIconBg = isDark ? 'bg-blue-600/20' : 'bg-blue-100';
  const warningText = isDark ? 'text-yellow-500' : 'text-yellow-600';

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPushEnabled = await AsyncStorage.getItem('push_notifications_enabled');
      const savedVibrate = await AsyncStorage.getItem('vibrate_enabled');
      const savedPreview = await AsyncStorage.getItem('preview_enabled');
      const savedSound = await AsyncStorage.getItem('notification_sound');
      
      setPushEnabled(savedPushEnabled === null ? true : savedPushEnabled === 'true');
      setVibrateEnabled(savedVibrate === null ? true : savedVibrate === 'true');
      setPreviewEnabled(savedPreview === null ? true : savedPreview === 'true');
      setSelectedSound(savedSound || 'default');
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem('push_notifications_enabled', String(pushEnabled));
      await AsyncStorage.setItem('vibrate_enabled', String(vibrateEnabled));
      await AsyncStorage.setItem('preview_enabled', String(previewEnabled));
      await AsyncStorage.setItem('notification_sound', selectedSound);
      
      if (pushEnabled) {
        const token = await notificationService.registerForPushNotifications();
        if (token && user?.uid) {
          await notificationService.savePushTokenToFirebase(user.uid, token);
        }
      } else if (user?.uid) {
        const token = notificationService.getExpoPushToken();
        if (token) {
          await notificationService.removePushTokenFromFirebase(user.uid, token);
        }
        await notificationService.cancelAllScheduledNotifications();
      }
      
      Alert.alert('Success', 'Preferences saved');
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const testSound = async (soundFile: string) => {
    const sound = soundOptions.find(s => s.file === soundFile);
    
    const settings = await Notifications.getPermissionsAsync();
    if (settings.status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notifications in settings');
      return;
    }
    
    if (!pushEnabled) {
      Alert.alert('Notifications Disabled', 'Please enable push notifications first');
      return;
    }
    
    try {
      await notificationService.sendImmediateNotification(
        'Sound Test',
        `Testing ${sound?.name} sound`,
        { test: true },
        soundFile
      );
    } catch (error) {
      console.error('Error testing sound:', error);
      Alert.alert('Error', 'Failed to test sound');
    }
  };

  if (loading) {
    return (
      <DashboardWrapper title="Notifications">
        <SkeletonLoader />
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper title="Notifications">
      <ScrollView
        className={`flex-1 ${bgColor} px-5`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Push Notifications */}
        <View className="mt-0">
          <Text className={`${textSecondary} text-xs mb-2 tracking-widest`}>GENERAL</Text>
          <View className="flex-row justify-between items-center py-4">
            <View className="flex-1 pr-4">
              <Text className={`${textPrimary} text-[15px] font-medium`}>Push notifications</Text>
              <Text className={`${textSecondary} text-xs mt-1`}>Receive reminders and alerts</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#2a2a2a', true: '#2563eb' }}
              thumbColor="#fff"
            />
          </View>
          {!pushEnabled && (
            <Text className={`${warningText} text-xs mt-[-8px] mb-2`}>
              ⚠️ You won't receive any notifications while this is off
            </Text>
          )}
        </View>

        {/* Sound Selection */}
        {pushEnabled && (
          <View className="mt-8">
            <Text className={`${textSecondary} text-xs mb-3 tracking-widest`}>SOUND</Text>
            <View className={`${cardBg} rounded-2xl overflow-hidden`}>
              {soundOptions.map((sound, index) => {
                const isActive = selectedSound === sound.file;
                return (
                  <TouchableOpacity
                    key={sound.id}
                    onPress={() => setSelectedSound(sound.file)}
                    className={`flex-row items-center justify-between px-4 py-4 ${
                      index !== soundOptions.length - 1 ? `border-b ${borderColor}` : ''
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className={`w-9 h-9 rounded-full items-center justify-center ${isActive ? activeIconBg : iconBg}`}>
                        <Ionicons name={sound.icon as any} size={18} color={isActive ? '#3b82f6' : iconColor} />
                      </View>
                      <View>
                        <Text className={`text-[14px] ${isActive ? textPrimary : textTertiary}`}>
                          {sound.name}
                        </Text>
                        <Text className={`${textSecondary} text-xs mt-0.5`}>
                          {sound.file === 'default' ? 'System sound' : 'Custom tone'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-4">
                      <TouchableOpacity onPress={() => testSound(sound.file)}>
                        <Text className="text-blue-500 text-sm">Test</Text>
                      </TouchableOpacity>
                      {isActive && <Ionicons name="checkmark" size={18} color="#3b82f6" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Options */}
        {pushEnabled && (
          <View className="mt-5">
            <Text className={`${textSecondary} text-xs mb-3 tracking-widest`}>OPTIONS</Text>
            <View className={`${cardBg} rounded-2xl overflow-hidden`}>
              <View className={`flex-row justify-between items-center px-4 py-4 border-b ${borderColor}`}>
                <View className="flex-1 pr-4">
                  <Text className={`${textPrimary} text-[14px]`}>Vibrate</Text>
                  <Text className={`${textSecondary} text-xs mt-1`}>Vibrate on notification</Text>
                </View>
                <Switch
                  value={vibrateEnabled}
                  onValueChange={setVibrateEnabled}
                  trackColor={{ false: '#2a2a2a', true: '#2563eb' }}
                  thumbColor="#fff"
                />
              </View>

              <View className="flex-row justify-between items-center px-4 py-4">
                <View className="flex-1 pr-4">
                  <Text className={`${textPrimary} text-[14px]`}>Preview</Text>
                  <Text className={`${textSecondary} text-xs mt-1`}>Show on lock screen</Text>
                </View>
                <Switch
                  value={previewEnabled}
                  onValueChange={setPreviewEnabled}
                  trackColor={{ false: '#2a2a2a', true: '#2563eb' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          onPress={savePreferences}
          disabled={saving}
          className="mt-10 py-4 rounded-full bg-blue-600 active:bg-blue-700"
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white text-center text-[15px] font-medium">Save changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </DashboardWrapper>
  );
};

export default NotificationSettingsScreen;