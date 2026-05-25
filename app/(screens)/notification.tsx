import DashboardWrapper from '@/components/wrapper/dashboard-wrapper';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';

import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

interface Reminder {
  id: string;
  title: string;
  doctor: string;
  appointmentDate: any;
  notes?: string;
  status: string;
  notified: boolean;
  createdAt: any;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'reminder' | 'alert' | 'info';
  reminderData?: any;
}

// Swipeable Notification Item Component with theme support
const SwipeableNotification = ({
  item,
  onPress,
  onDelete,
}: {
  item: NotificationItem;
  onPress: () => void;
  onDelete: () => void;
}) => {
  const { isDark } = useAppTheme();
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-400' : 'text-gray-500';
  const iconColor = isDark ? '#737373' : '#9ca3af';

  const renderRightActions = () => {
    return (
      <View className="flex-1 bg-red-500 justify-center items-end pr-6">
        <Ionicons name="trash-outline" size={24} color="white" />
      </View>
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Ionicons name="alarm-outline" size={20} color="#3b82f6" />;
      case 'alert':
        return <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />;
      default:
        return <Ionicons name="information-circle-outline" size={20} color={iconColor} />;
    }
  };

  const formatDate = (timestamp: Date) => {
    const diff = Date.now() - timestamp.getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);

    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    if (h < 24) return `${h}h`;
    if (d < 7) return `${d}d`;
    return timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      onSwipeableOpen={onDelete}
      friction={2}
      rightThreshold={40}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className={`px-4 py-5 border-b ${borderColor} ${bgColor}`}
      >
        <View className="flex-row items-center">
          {/* Icon */}
          <View className="w-10 h-10 items-center justify-center">
            {getNotificationIcon(item.type)}
          </View>

          {/* Content */}
          <View className="flex-1 ml-3">
            <View className="flex-row justify-between">
              <Text className={`${textPrimary} text-sm font-medium`}>
                {item.title}
              </Text>

              <Text className={`${textSecondary} text-xs`}>
                {formatDate(item.timestamp)}
              </Text>
            </View>

            <Text
              className={`${textSecondary} text-xs mt-1`}
              numberOfLines={2}
            >
              {item.message}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const NotificationScreen = () => {
  const { user } = useAuth();
  const { isDark } = useAppTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Theme-aware colors
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-400' : 'text-gray-500';
  const textTertiary = isDark ? 'text-neutral-500' : 'text-gray-400';
  const iconBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  const skeletonBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  const deleteText = isDark ? 'text-red-500' : 'text-red-600';

  const fetchNotifications = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      
      const stored = await AsyncStorage.getItem('app_notifications');
      let storedNotifications: NotificationItem[] = stored ? JSON.parse(stored) : [];
      
      storedNotifications = storedNotifications.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }));
      
      storedNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setNotifications(storedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleDeleteNotification = async (id: string) => {
    try {
      const updated = notifications.filter(n => n.id !== id);
      setNotifications(updated);
      
      const stored = await AsyncStorage.getItem('app_notifications');
      let storedNotifications: NotificationItem[] = stored ? JSON.parse(stored) : [];
      storedNotifications = storedNotifications.filter(n => n.id !== id);
      await AsyncStorage.setItem('app_notifications', JSON.stringify(storedNotifications));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      setNotifications([]);
      await AsyncStorage.setItem('app_notifications', JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing all:', error);
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    console.log('Notification pressed:', item.title);
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <SwipeableNotification
      item={item}
      onPress={() => handleNotificationPress(item)}
      onDelete={() => handleDeleteNotification(item.id)}
    />
  );

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <View className={`w-20 h-20 ${iconBg} rounded-full items-center justify-center mb-4`}>
        <Ionicons name="notifications-off-outline" size={32} color={iconBg === 'bg-neutral-800' ? '#737373' : '#9ca3af'} />
      </View>
      <Text className={`${textSecondary} text-lg font-medium`}>
        No notifications
      </Text>
      <Text className={`${textTertiary} text-sm text-center mt-2 px-8`}>
        When you receive reminders, they will appear here
      </Text>
    </View>
  );

  const SkeletonLoader = () => (
    <View className="px-4">
      {[1, 2, 3, 4].map((i) => (
        <View key={i} className="flex-row py-3 mb-3">
          <View className={`w-10 h-10 ${skeletonBg} rounded-full`} />
          <View className="flex-1 ml-3">
            <View className={`${skeletonBg} rounded h-4 w-32 mb-2`} />
            <View className={`${skeletonBg} rounded h-3 w-48`} />
          </View>
        </View>
      ))}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <DashboardWrapper title="Notifications">
        <SkeletonLoader />
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper title="Notifications">
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        showsVerticalScrollIndicator={false}
        className={`flex-1 ${bgColor}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={EmptyState}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
        ListHeaderComponent={
          notifications.length > 0 ? (
            <View className="flex-row justify-end px-4 py-3 mb-2">
              <TouchableOpacity onPress={handleClearAll}>
                <Text className={`${deleteText} text-sm font-medium`}>Clear all</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </DashboardWrapper>
  );
};

export default NotificationScreen;