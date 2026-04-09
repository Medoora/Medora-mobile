import UploadModal from "@/components/modal/upload-modal";
import BotSidebar from "@/components/sidebar/chat-sidebar";
import Sidebar from "@/components/sidebar/sidebar";
import {
  getUserReminders,
  markReminderNotified,
} from "@/config/firebase/services/reminder/service";
import { useAuth } from "@/context/auth-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Tabs, useFocusEffect, usePathname } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface Reminder {
  id: string;
  title: string;
  doctor: string;
  appointmentDate: any;
  notes?: string;
  status: string;
  notified: boolean;
  createdAt: any;
  sendAt?: any;
}

export default function TabsLayout() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isBotbarVisible, setIsBotbarVisible] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { user } = useAuth();
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
  const notifAnim = useRef(new Animated.Value(-100)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;

  // Load unread count from storage
  const loadUnreadCount = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('app_notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        const unread = notifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
        
        // Animate badge if new notifications
        if (unread > 0) {
          Animated.sequence([
            Animated.timing(badgeAnim, {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(badgeAnim, {
              toValue: 1,
              friction: 3,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, []);

  // Reset unread count when notification screen is viewed
  useFocusEffect(
    useCallback(() => {
      // Check if we're on the notification screen
      if (pathname.includes('notification')) {
        const resetUnreadCount = async () => {
          try {
            const stored = await AsyncStorage.getItem('app_notifications');
            if (stored) {
              const notifications = JSON.parse(stored);
              const updated = notifications.map((n: any) => ({ ...n, read: true }));
              await AsyncStorage.setItem('app_notifications', JSON.stringify(updated));
              setUnreadCount(0);
            }
          } catch (error) {
            console.error('Error resetting unread count:', error);
          }
        };
        resetUnreadCount();
      }
    }, [pathname])
  );

  // Save notification and update count
  const addNotification = useCallback(async (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    
    try {
      const stored = await AsyncStorage.getItem('app_notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      const updated = [newNotification, ...notifications];
      await AsyncStorage.setItem('app_notifications', JSON.stringify(updated));
      
      const newUnreadCount = updated.filter((n: any) => !n.read).length;
      setUnreadCount(newUnreadCount);
      
      // Animate badge
      Animated.sequence([
        Animated.timing(badgeAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(badgeAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  // Dismiss active reminder animation
  const dismissReminder = useCallback(() => {
    Animated.timing(notifAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setActiveReminder(null);
    });
  }, []);

  useEffect(() => {
    if (!activeReminder) return;

    const timer = setTimeout(() => {
      dismissReminder();
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeReminder]);

  useEffect(() => {
    if (!user?.uid) return;

    const interval = setInterval(async () => {
      try {
        const reminders = await getUserReminders(user.uid);
        const now = new Date();

        const dueReminders = reminders.filter((r: any) => {
          const sendAt = r.sendAt?.toDate?.();
          return sendAt && sendAt <= now && !r.notified && r.status === "active";
        });

        const due = dueReminders[0] as Reminder | undefined;

        if (due && !activeReminder) {
          Vibration.vibrate(300);
          await markReminderNotified(due.id);
          
          // Add to in-app notifications
          await addNotification({
            title: due.title,
            message: `Reminder: ${due.title} with Dr. ${due.doctor}`,
          });
          
          setActiveReminder(due);
          notifAnim.setValue(-100);
          Animated.timing(notifAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user?.uid, activeReminder, addNotification]);

  const openUploadModal = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  const closeUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  const handleUpload = (document: any) => {
    console.log("Uploaded document:", document);
  };

  const closeSidebar = useCallback(() => {
    setIsSidebarVisible(false);
  }, []);
 const closeBotBar = useCallback(() => {
     setIsBotbarVisible(false)
 },[])
  const handleNavigate = useCallback((route: string) => {
    router.push(route as any);
  }, []);

  const getTabName = () => {
    if (pathname.includes("mydrive")) return "My Drive";
    if (pathname.includes("reminder")) return "Reminders";
    if (pathname.includes("health-bot")) return "MediTalk";
    if (pathname.includes("settings")) return "Settings";
    return "Dashboard";
  };

  const currentTab = getTabName();

  return (
    <View className="flex-1 bg-neutral-950">
      {/* Reminder Popup Notification */}
      {activeReminder && (
        <Animated.View
          style={{
            transform: [{ translateY: notifAnim }],
          }}
          className="absolute top-14 left-4 right-4 z-50 bg-neutral-900 border border-blue-500 p-4 rounded-2xl shadow-lg"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="alarm" size={20} color="#3b82f6" />
              <Text className="text-white ml-2 font-semibold text-sm">
                Reminder Alert
              </Text>
            </View>
            <TouchableOpacity onPress={dismissReminder}>
              <Ionicons name="close" size={18} color="#aaa" />
            </TouchableOpacity>
          </View>
          <View className="mt-3">
            <Text className="text-white text-base font-semibold">
              {activeReminder.title}
            </Text>
            <Text className="text-neutral-400 text-sm mt-1">
              Dr. {activeReminder.doctor}
            </Text>
            <Text className="text-neutral-500 text-xs mt-2">
              {activeReminder.appointmentDate?.toDate?.().toLocaleString()}
            </Text>
            {activeReminder.notes && (
              <Text className="text-neutral-400 text-xs mt-2">
                {activeReminder.notes}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={dismissReminder}
            className="mt-4 bg-blue-500 py-2 rounded-lg items-center"
          >
            <Text className="text-white text-sm font-medium">Dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <StatusBar barStyle="light-content" />

      {/* Main Content */}
      <View className="flex-1 relative">
        {/* Header */}
        <SafeAreaView edges={["top", "left", "right"]} className="bg-black">
          <View className="flex-row items-center justify-between px-4 pb-2">
            <TouchableOpacity
              onPress={() => setIsSidebarVisible(true)}
              className="w-10 h-10 items-center justify-center"
            >
              <AntDesign name="align-left" size={20} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-lg font-semibold">
              {currentTab}
            </Text>
            
            {currentTab === "Dashboard" ? (
              <TouchableOpacity
                onPress={() => {
                  router.push("/(screens)/notification");
                }}
                className="w-10 h-10 items-center justify-center relative"
              >
                <MaterialIcons name="notifications" size={24} color="white" />
                {unreadCount > 0 && (
                  <Animated.View 
                    style={{
                      transform: [{ scale: badgeAnim }],
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      backgroundColor: '#ef4444',
                      borderRadius: 10,
                      minWidth: 18,
                      height: 18,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text className="text-white text-[10px] font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </Animated.View>
                )}
              </TouchableOpacity>
            ) : currentTab === 'MediTalk' ? (
            <TouchableOpacity
                onPress={() => {
                   setIsBotbarVisible(true)
                }}
                className="w-10 h-10 items-center justify-center relative"
              >
                <Ionicons name="chatbox" size={20} color="white" />
              </TouchableOpacity>
            
            ): (
              <View className="w-10 h-10" />
            )
            
            }
          </View>
        </SafeAreaView>

        {/* Tabs Content */}
        <View className="flex-1">
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: "#3b82f6",
              tabBarInactiveTintColor: "#525252",
              tabBarStyle: {
                backgroundColor: "#0a0a0a",
                borderTopWidth: 1,
                elevation: 0,
                shadowOpacity: 0,
                height: Platform.OS === "ios" ? 80 : 105,
                paddingBottom: Platform.OS === "ios" ? 25 : 10,
                paddingTop: 10,
                paddingLeft: 10,
                paddingRight: 10,
                borderTopColor: "#262626",
              },
              tabBarItemStyle: {
                gap: 0,
              },
              tabBarShowLabel: false,
              headerShown: false,
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <View className="items-center">
                    <Ionicons
                      name={focused ? "home" : "home-outline"}
                      size={22}
                      color={color}
                    />
                  </View>
                ),
              }}
            />

            <Tabs.Screen
              name="mydrive"
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <View className="items-center">
                    <Ionicons
                      name={focused ? "folder" : "folder-outline"}
                      size={22}
                      color={color}
                    />
                  </View>
                ),
              }}
            />

            <Tabs.Screen
              name="reminder"
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <View className="items-center">
                    <Ionicons
                      name={focused ? "alarm" : "alarm-outline"}
                      size={22}
                      color={color}
                    />
                  </View>
                ),
              }}
            />

            <Tabs.Screen
              name="health-bot"
              options={{
                tabBarIcon: ({ color, focused }) => {
                  const activeColor = focused ? "#EB4C4C" : color;
                  return (
                    <View className="items-center">
                      <MaterialCommunityIcons
                        name={focused ? "robot-love" : "robot-angry-outline"}
                        size={24}
                        color={activeColor}
                      />
                    </View>
                  );
                },
              }}
            />

            <Tabs.Screen
              name="settings"
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <View className="items-center">
                    <Ionicons
                      name={focused ? "settings" : "settings-outline"}
                      size={22}
                      color={color}
                    />
                  </View>
                ),
              }}
            />
          </Tabs>
        </View>

        {/* Upload button */}
        {["Dashboard", "My Drive"].includes(currentTab) && (
         Platform.OS === 'ios' ? (
           <TouchableOpacity
            onPress={openUploadModal}
            className="absolute bg-blue-600 bottom-28 right-6 rounded-full flex items-center justify-center p-4 z-30 shadow-lg"
            style={{ elevation: 5 }}
          >
            <Ionicons color={"white"} size={24} name="cloud-upload" />
          </TouchableOpacity>
         ) : ( <TouchableOpacity
            onPress={openUploadModal}
            className="absolute bg-blue-600 bottom-36 right-6 rounded-full flex items-center justify-center p-4 z-30 shadow-lg"
            style={{ elevation: 5 }}
          >
            <Ionicons color={"white"} size={24} name="cloud-upload" />
          </TouchableOpacity>)
        )}

        {/* Upload Modal */}
        <UploadModal
          visible={isUploadModalOpen}
          onClose={closeUploadModal}
          onUploadSuccess={handleUpload}
        />
      </View>
      {/* Chatbot sidebar */}
      <BotSidebar
        isVisible={isBotbarVisible}
        onClose={closeBotBar}
      />
      {/* Reusable Sidebar */}
      <Sidebar
        isVisible={isSidebarVisible}
        onClose={closeSidebar}
        onNavigate={handleNavigate}
        onUploadPress={openUploadModal}
        notificationsEnabled={notificationsEnabled}
        onNotificationsToggle={setNotificationsEnabled}
        darkMode={darkMode}
        onDarkModeToggle={setDarkMode}
      />
    </View>
  );
}