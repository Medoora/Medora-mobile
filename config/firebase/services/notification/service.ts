// config/firebase/services/notification/service.ts
import { db } from '@/config/firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});


export const notificationSounds = {
  default: { name: 'Default', file: 'default', android: 'default', ios: 'default' },
  guitar: { name: 'Guitar', file: 'guitar', android: 'guitar', ios: 'guitar.wav' },
  msg: { name: 'Message', file: 'msg', android: 'msg', ios: 'msg.wav' },
  scifi: { name: 'Sci-Fi', file: 'scifi', android: 'sci_fi', ios: 'sci_fi.wav' },
  scifi2: { name: 'Sci-Fi 2', file: 'scifi2', android: 'sci_fi2', ios: 'sci_fi2.wav' },
  woss: { name: 'Woss', file: 'woss', android: 'woss', ios: 'woss.wav' },
};

class NotificationService {
  private expoPushToken: string | null = null;

  // Check if push notifications are enabled
  private async isPushEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('push_notifications_enabled');
      return enabled === null ? true : enabled === 'true';
    } catch (error) {
      return true;
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    // Check if push is enabled first
    const pushEnabled = await this.isPushEnabled();
    if (!pushEnabled) {
      console.log('Push notifications are disabled by user');
      return null;
    }

    if (!Device.isDevice) {
      console.log('Must use physical device');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.expoPushToken = token.data;
      console.log('✅ Expo Push Token:', this.expoPushToken);
      
      if (Platform.OS === 'android') {
  // Create channels with IMPORTANCE_MAX
  for (const [key, sound] of Object.entries(notificationSounds)) {
    if (key !== 'default') {
      await Notifications.setNotificationChannelAsync(key, {
        name: sound.name,
        importance: Notifications.AndroidImportance.MAX, // Change from HIGH to MAX
        sound: sound.android,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
        enableVibrate: true,
        enableLights: true,
        bypassDnd: true, // Bypass Do Not Disturb
      });
    }
  }
  
  // Default channel
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3b82f6',
    enableVibrate: true,
    enableLights: true,
    bypassDnd: true,
  });
}

      
      return this.expoPushToken;
    } catch (error) {
      console.error('Error registering:', error);
      return null;
    }
  }

  async savePushTokenToFirebase(userId: string, token: string): Promise<void> {
    const pushEnabled = await this.isPushEnabled();
    if (!pushEnabled) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushTokens: arrayUnion(token),
        pushEnabled: true,
        pushTokenUpdatedAt: new Date().toISOString(),
      });
      console.log('✅ Push token saved');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async removePushTokenFromFirebase(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushTokens: arrayRemove(token),
        pushEnabled: false,
      });
      console.log('✅ Push token removed');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  async scheduleNotification(
    title: string,
    body: string,
    date: Date,
    data?: any,
    soundFile?: string
  ): Promise<string | null> {
    // Check if push is enabled before scheduling
    const pushEnabled = await this.isPushEnabled();
    if (!pushEnabled) {
      console.log('Push notifications disabled, not scheduling');
      return null;
    }

    try {
      let sound = 'default';
      let channelId = 'default';
      
      if (soundFile && soundFile !== 'default') {
        const soundConfig = notificationSounds[soundFile as keyof typeof notificationSounds];
        if (soundConfig) {
          if (Platform.OS === 'ios') {
            sound = soundConfig.ios;
          } else {
            sound = soundConfig.android;
            channelId = soundFile;
          }
        }
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, type: 'reminder' },
          sound: sound,
          badge: 1,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: date,
          channelId: channelId,
        } as Notifications.DateTriggerInput,
      });
      
      console.log('✅ Notification scheduled with sound:', sound);
      return identifier;
    } catch (error) {
      console.error('Error scheduling:', error);
      return null;
    }
  }

  async sendImmediateNotification(
    title: string,
    body: string,
    data?: any,
    soundFile?: string
  ): Promise<void> {
    // Check if push is enabled before sending
    const pushEnabled = await this.isPushEnabled();
    if (!pushEnabled) {
      console.log('Push notifications disabled, not sending');
      return;
    }

    try {
      let sound = 'default';
      let channelId = 'default';
      
      if (soundFile && soundFile !== 'default') {
        const soundConfig = notificationSounds[soundFile as keyof typeof notificationSounds];
        if (soundConfig) {
          if (Platform.OS === 'ios') {
            sound = soundConfig.ios;
          } else {
            sound = soundConfig.android;
            channelId = soundFile;
          }
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, type: 'reminder' },
          sound: sound,
          badge: 1,
        },
        trigger: null,
      });
      console.log('✅ Immediate notification sent with sound:', sound);
    } catch (error) {
      console.error('Error sending immediate:', error);
    }
  }

  async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('✅ Notification cancelled');
    } catch (error) {
      console.error('Error cancelling:', error);
    }
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all:', error);
    }
  }

  addNotificationResponseListener(callback: (response: any) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();