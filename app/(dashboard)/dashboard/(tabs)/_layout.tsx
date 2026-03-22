import UploadModal from "@/components/modal/upload-modal";
import { useAuth } from "@/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, Tabs, usePathname } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = 320;

export default function TabsLayout() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pathname = usePathname();
  const { user } = useAuth();

  const openUploadModal = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  const closeUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  const handleUpload = (document: any) => {
    console.log("Uploaded document:", document);
  };

  const openSidebar = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    setIsSidebarVisible(true);
  }, []);

  const closeSidebar = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSidebarVisible(false);
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isSidebarVisible) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }, [isSidebarVisible]);

  const handleNavigation = useCallback((route: any) => {
    router.push(route);
    closeSidebar();
  }, []);

  /*  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutUser();
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  }; */

  const getTabName = () => {
    if (pathname.includes("mydrive")) return "My Drive";
    if (pathname.includes("reminder")) return "Reminders";
    if (pathname.includes("trash")) return "Trash";
    if (pathname.includes("settings")) return "Settings";
    return "Dashboard";
  };

  const currentTab = getTabName();

  return (
    <View className="flex-1 bg-neutral-950">
      <StatusBar barStyle="light-content" />

      {/* Main Content */}
      <View className="flex-1 relative">
        {/* Header */}
        <SafeAreaView edges={["top", "left", "right"]} className="bg-black">
          <View className="flex-row items-center justify-between px-4 pb-2">
            <TouchableOpacity
              onPress={toggleSidebar}
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
                <MaterialCommunityIcons
                  name="robot-love-outline"
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
              initialParams={{ refreshTrigger: Date.now() }}
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
              name="trash"
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <View className="items-center">
                    <Ionicons
                      name={focused ? "trash" : "trash-outline"}
                      size={22}
                      color={color}
                    />
                  </View>
                ),
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

      {/* Overlay when sidebar is open */}
      {isSidebarVisible && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              opacity: fadeAnim,
              zIndex: 25,
            },
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={closeSidebar}
          />
        </Animated.View>
      )}

      {/* Sidebar */}
      <Animated.View
        style={[
          {
            width: SIDEBAR_WIDTH,
            transform: [{ translateX: slideAnim }],
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 30,
            backgroundColor: "#0a0a0a",
            borderRightWidth: 1,
            borderRightColor: "#262626",
          },
        ]}
      >
        <SafeAreaView className="flex-1">
          <View className="px-4 py-2 flex-1">
            {/* Logo Section */}
            <View className="flex-row justify-between items-center mb-8">
              <View className="flex-row items-center">
                <Image
                  source={require("@/assets/logo/logo.png")}
                  className="w-14 h-14"
                />
                <Text className="text-white text-xl font-bold -ml-2">
                  Medora
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeSidebar}
                className="w-10 h-10 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            {/* User Profile Section */}
            <TouchableOpacity
              onPress={() => {
                handleNavigation("/(dashboard)/dashboard/(tabs)/settings");
              }}
              className="flex-row items-center bg-neutral-800/50 p-3 rounded-xl mb-6"
            >
              <View className="w-12 h-12 bg-blue-500/20 rounded-full items-center justify-center">
                <Ionicons name="person-outline" size={24} color="#3b82f6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-semibold">
                  {user?.email?.split("@")[0] || "User"}
                </Text>
                <Text className="text-neutral-500 text-xs">{user?.email}</Text>
              </View>
            </TouchableOpacity>

            {/* Quick Actions Section */}
            <View className="mb-6">
              <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3">
                Quick Actions
              </Text>

              <TouchableOpacity
                onPress={openUploadModal}
                className="flex-row items-center px-4 py-3 rounded-xl mb-2 bg-blue-500/10"
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color="#3b82f6"
                />
                <Text className="text-white ml-3 font-medium">
                  Upload New File
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  handleNavigation("/(dashboard)/dashboard/Starred")
                }
                className="flex-row items-center px-4 py-3 rounded-xl mb-2"
              >
                <Ionicons name="star-outline" size={20} color="#737373" />
                <Text className="text-neutral-300 ml-3">Starred</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  handleNavigation("/(dashboard)/dashboard/(tabs)/recent")
                }
                className="flex-row items-center px-4 py-3 rounded-xl mb-2"
              >
                <Ionicons name="time-outline" size={20} color="#737373" />
                <Text className="text-neutral-300 ml-3">Recent</Text>
              </TouchableOpacity>
            </View>

            {/* Preferences */}
            <View className="mb-6">
              <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3">
                Preferences
              </Text>

              <View className="flex-row items-center justify-between px-4 py-3 rounded-xl mb-2">
                <View className="flex-row items-center">
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color="#737373"
                  />
                  <Text className="text-neutral-300 ml-3">Notifications</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: "#3f3f46", true: "#3b82f6" }}
                  thumbColor="#ffffff"
                />
              </View>

              <View className="flex-row items-center justify-between px-4 py-3 rounded-xl mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="moon-outline" size={20} color="#737373" />
                  <Text className="text-neutral-300 ml-3">Dark Mode</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: "#3f3f46", true: "#3b82f6" }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Help & Support */}
            <View className="mb-6">
              <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3">
                Support
              </Text>

              <TouchableOpacity
                onPress={() =>
                  handleNavigation("/(dashboard)/dashboard/(tabs)/settings")
                }
                className="flex-row items-center px-4 py-3 rounded-xl mb-2"
              >
                <Ionicons name="settings-outline" size={20} color="#737373" />
                <Text className="text-neutral-300 ml-3">Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Help Center",
                    "Contact support: support@medora.com",
                  );
                }}
                className="flex-row items-center px-4 py-3 rounded-xl mb-2"
              >
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color="#737373"
                />
                <Text className="text-neutral-300 ml-3">Help Center</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Feedback",
                    "Send feedback to: feedback@medora.com",
                  );
                }}
                className="flex-row items-center px-4 py-3 rounded-xl mb-2"
              >
                <Ionicons name="chatbubble-outline" size={20} color="#737373" />
                <Text className="text-neutral-300 ml-3">Send Feedback</Text>
              </TouchableOpacity>
            </View>

            {/* Storage Info & Sign Out */}
            <View className="">
              <View className="bg-neutral-900 p-4 rounded-xl mb-4">
                <Text className="text-neutral-400 text-xs mb-1">Storage</Text>
                <Text className="text-white text-sm font-medium">
                  0 Bytes / 500 MB
                </Text>
                <View className="h-1 bg-neutral-800 rounded-full mt-3">
                  <View className="w-0 h-full bg-blue-500 rounded-full" />
                </View>
              </View>

              {/* Sign Out Button */}
              {/*   <TouchableOpacity 
                onPress={handleSignOut}
                className="flex-row items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 mb-4"
              >
                <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                <Text className="text-red-500 font-medium">Sign Out</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
