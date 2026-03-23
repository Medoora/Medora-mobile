import UploadModal from "@/components/modal/upload-modal";
import Sidebar from "@/components/sidebar/sidebar";
import {
  getUserReminders,
  markReminderNotified,
} from "@/config/firebase/services/reminder/service";
import { useAuth } from "@/context/auth-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, Tabs, usePathname } from "expo-router";
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

export default function TabsLayout() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const pathname = usePathname();
  const { user } = useAuth();
  const [activeReminder, setActiveReminder] = useState<any>(null);
  const notifAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!activeReminder) return;

    const timer = setTimeout(() => {
      Animated.timing(notifAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(async () => {
        setActiveReminder(null);
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeReminder]);

  useEffect(() => {
    if (!user?.uid) return;

    const interval = setInterval(async () => {
      const reminders = await getUserReminders(user.uid);

      const now = new Date();

      const dueReminders = reminders.filter((r: any) => {
        const sendAt = r.sendAt?.toDate?.();
        return sendAt && sendAt <= now && !r.notified && r.status === "active";
      });

      const due = dueReminders[0];

      if (due && !activeReminder) {
        Vibration.vibrate(300);
        await markReminderNotified(due.id);
        setActiveReminder(due);
        notifAnim.setValue(-100);
        Animated.timing(notifAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user?.uid]);

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
      {/* Reminder Notification */}
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
            <TouchableOpacity onPress={() => setActiveReminder(null)}>
              <Ionicons name="close" size={18} color="#aaa" />
            </TouchableOpacity>
          </View>
          <View className="mt-3">
            <Text className="text-white text-base font-semibold">
              {activeReminder.title}
            </Text>
            <Text className="text-neutral-400 text-sm mt-1">
              {activeReminder.doctor}
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
            onPress={async () => {
              Animated.timing(notifAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
              }).start(async () => {
                setActiveReminder(null);
              });
            }}
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
                onPress={() => console.log("AI Assistant")}
                className="w-10 h-10 items-center justify-center"
              >
                <MaterialIcons
                  name="notifications"
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            ) : (
              <View className="w-10 h-10" />
            )}
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
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
                height: Platform.OS === "ios" ? 80 : 60,
                paddingBottom: Platform.OS === "ios" ? 25 : 10,
                paddingTop: 20,
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
          <TouchableOpacity
            onPress={openUploadModal}
            className="absolute bg-blue-600 bottom-28 right-6 rounded-full flex items-center justify-center p-4 z-30 shadow-lg"
            style={{ elevation: 5 }}
          >
            <Ionicons color={"white"} size={24} name="cloud-upload" />
          </TouchableOpacity>
        )}

        {/* Upload Modal */}
        <UploadModal
          visible={isUploadModalOpen}
          onClose={closeUploadModal}
          onUploadSuccess={handleUpload}
        />
      </View>

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