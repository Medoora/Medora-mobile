import { signOutUser } from '@/config/firebase/services/auth/auth';
import { StorageService, UserStorage } from '@/config/firebase/services/storage-tracker/service';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { getInitials } from '@/utils/cryto';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, Platform, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomDialogBox from '../Custom-Dialog/Cus-dialog';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = 320;

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onUploadPress?: () => void;
  notificationsEnabled?: boolean;
  onNotificationsToggle?: (value: boolean) => void;
  darkMode?: boolean;
  onDarkModeToggle?: (value: boolean) => void;
}

export default function Sidebar({ 
  isVisible, 
  onClose, 
  onNavigate,
  onUploadPress,
  notificationsEnabled = true,
  onNotificationsToggle,
  darkMode: propDarkMode = true,
  onDarkModeToggle,
}: SidebarProps) {
  const { user } = useAuth();
  const { theme, setTheme, isDark } = useAppTheme();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [storageInfo, setStorageInfo] = useState<UserStorage | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(true);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [localDarkMode, setLocalDarkMode] = useState(isDark);

  // Theme-aware colors
  const bgColor = isDark ? '#0a0a0a' : '#f5f5f5';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-400' : 'text-gray-500';
  const textTertiary = isDark ? 'text-neutral-500' : 'text-gray-400';
  const cardBg = isDark ? 'bg-neutral-900' : 'bg-white';
  const borderColor = isDark ? 'border-neutral-800' : 'border-gray-200';
  const iconColor = isDark ? '#737373' : '#9ca3af';
  const activeBg = isDark ? 'bg-blue-500/10' : 'bg-blue-100';
  const activeText = isDark ? 'text-white' : 'text-blue-600';
  const activeIcon = isDark ? '#3b82f6' : '#2563eb';

  // Sync local dark mode with theme
  useEffect(() => {
    setLocalDarkMode(isDark);
  }, [isDark]);

  const getCurrentTab = () => {
    if (pathname.includes('mydrive')) return 'My Drive';
    if (pathname.includes('reminder')) return 'Reminders';
    if (pathname.includes('trash')) return 'Trash';
    if (pathname.includes('settings')) return 'Settings';
    if (pathname.includes('starred')) return 'Starred';
    if (pathname.includes('recents')) return 'Recents';
    return 'Dashboard';
  };

  const currentTab = getCurrentTab();

  // Load storage info when sidebar opens or user changes
  useEffect(() => {
    if (isVisible && user?.uid) {
      loadStorageInfo();
    }
  }, [isVisible, user?.uid]);

  const loadStorageInfo = async () => {
    if (!user?.uid) return;
    
    setLoadingStorage(true);
    try {
      const storage = await StorageService.getUserStorage(user.uid);
      setStorageInfo(storage);
    } catch (error) {
      console.error('Error loading storage info:', error);
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      slideAnim.setValue(-SIDEBAR_WIDTH);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setIsLoginVisible(false);
      handleClose();
      setTimeout(() => {
        router.push("/(auth)/sign-in");
      }, 300);
    } catch (error) {
      console.log("Error", error);
      setIsLoginVisible(false);
    }
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleThemeToggle = async (value: boolean) => {
    setLocalDarkMode(value);
    const newTheme = value ? 'dark' : 'light';
    await setTheme(newTheme);
    if (onDarkModeToggle) {
      onDarkModeToggle(value);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const totalBytes = storageInfo?.totalBytes || 0;
  const quotaBytes = storageInfo?.quotaBytes || 500 * 1024 * 1024;
  const storagePercentage = storageInfo?.quotaPercentage || Math.min((totalBytes / quotaBytes) * 100, 100);
  const storageLimitMB = quotaBytes / (1024 * 1024);

  // Scroll header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-black/70" style={{ paddingTop: 0, marginTop: 0 }}>
        <TouchableOpacity 
          className="flex-1" 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <Animated.View 
          style={[
            { 
              width: SIDEBAR_WIDTH,
              transform: [{ translateX: slideAnim }],
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              backgroundColor: bgColor,
              borderRightWidth: 1,
              borderRightColor: isDark ? '#262626' : '#e5e5e5',
            }
          ]}
        >
          <View className="flex-1" style={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top }}>
            {/* Sticky Header with Gradient */}
            <Animated.View 
              style={{ 
                opacity: headerOpacity,
                backgroundColor: bgColor,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? '#262626' : '#e5e5e5',
                zIndex: 10,
              }}
            >
              <View className="px-4 py-4">
                <View className="flex-row justify-between items-center">
                  <View className='flex-row items-center'>
                    <Image
                      source={require("@/assets/logo/logo.png")}
                      className='w-12 h-12'
                    />
                    <Text className={`text-xl font-bold -ml-2 ${textPrimary}`}>Medora</Text> 
                  </View>
                  <TouchableOpacity onPress={handleClose} className="w-10 h-10 items-center justify-center">
                    <Ionicons name="close" size={24} color={iconColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Scrollable Content */}
            <Animated.ScrollView
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              <View className="px-4 py-2">
                {/* User Profile Section */}
                <TouchableOpacity 
                  onPress={() => {
                    onNavigate('/(dashboard)/dashboard/(tabs)/settings');
                    handleClose();
                  }}
                  className={`flex-row items-center p-3 rounded-xl mb-6 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-100'}`}
                >
                  <View className="w-12 h-12 bg-blue-500/20 rounded-full items-center justify-center">
                    {!user?.photoURL ? (
                      <Text className={`font-semibold uppercase ${textPrimary}`}>
                        {getInitials(user?.displayName || 'User')}
                      </Text>
                    ) : (
                      <Image
                        source={{ uri: user?.photoURL }}
                        className='w-12 h-12 rounded-full object-contain'
                      />
                    )}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className={`text-lg font-medium ${textPrimary}`}>{user?.displayName || "User"}</Text>
                    <Text className={`text-xs opacity-50 ${textSecondary}`}>{user?.email}</Text>
                  </View>
                </TouchableOpacity>

                {/* Analytics Section - Storage Tracker */}
                <View className="mb-6">
                  <Text className={`text-xs uppercase tracking-wider mb-3 ${textSecondary}`}>Analytics</Text>
                  
                  <View className={`rounded-xl p-4 mb-3 ${cardBg}`}>
                    <Text className={`text-xs mb-2 ${textSecondary}`}>Storage Usage</Text>
                    <View className="flex-row justify-between items-end mb-2">
                      <Text className={`text-2xl font-bold ${textPrimary}`}>
                        {loadingStorage ? '...' : formatFileSize(totalBytes)}
                      </Text>
                      <Text className={`text-xs ${textTertiary}`}>
                        of {storageLimitMB} MB
                      </Text>
                    </View>
                    <View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <View 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${loadingStorage ? 0 : storagePercentage}%` }}
                      />
                    </View>
                    <Text className={`text-xs mt-2 ${textTertiary}`}>
                      {loadingStorage ? 'Loading...' : `${storagePercentage.toFixed(1)}% used`}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate('/(screens)/storage-anal');
                      handleClose();
                    }}
                    className={`flex-row items-center justify-between px-4 py-3 rounded-xl ${isDark ? 'bg-neutral-800/50' : 'bg-gray-100'}`}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="stats-chart-outline" size={20} color={iconColor} />
                      <Text className={`ml-3 ${textSecondary}`}>View Detailed Analytics</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={iconColor} />
                  </TouchableOpacity>
                </View>

                {/* Starred & Recents */}
                <View className="mb-6">
                  <Text className={`text-xs uppercase tracking-wider mb-3 ${textSecondary}`}>Collections</Text>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate('/(screens)/starred');
                      handleClose();
                    }}
                    className={`flex-row items-center px-4 py-3 rounded-xl mb-2 ${
                      currentTab === 'Starred' ? activeBg : ''
                    }`}
                  >
                    <Ionicons name="star-outline" size={20} color={currentTab === 'Starred' ? activeIcon : iconColor} />
                    <Text className={`ml-3 ${currentTab === 'Starred' ? activeText : textSecondary}`}>
                      Starred Files
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate('/(screens)/recents');
                      handleClose();
                    }}
                    className={`flex-row items-center px-4 py-3 rounded-xl mb-2 ${
                      currentTab === 'Recents' ? activeBg : ''
                    }`}
                  >
                    <Ionicons name="time-outline" size={20} color={currentTab === 'Recents' ? activeIcon : iconColor} />
                    <Text className={`ml-3 ${currentTab === 'Recents' ? activeText : textSecondary}`}>
                      Recent Files
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Trash & Settings */}
                <View className="mb-6">
                  <Text className={`text-xs uppercase tracking-wider mb-3 ${textSecondary}`}>Manage</Text>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate('(screens)/trash');
                      handleClose();
                    }}
                    className={`flex-row items-center px-4 py-3 rounded-xl mb-2 ${
                      currentTab === 'Trash' ? activeBg : ''
                    }`}
                  >
                    <Ionicons name="trash-outline" size={20} color={currentTab === 'Trash' ? activeIcon : iconColor} />
                    <Text className={`ml-3 ${currentTab === 'Trash' ? activeText : textSecondary}`}>
                      Trash
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate('/(dashboard)/dashboard/(tabs)/settings');
                      handleClose();
                    }}
                    className={`flex-row items-center px-4 py-3 rounded-xl mb-2 ${
                      currentTab === 'Settings' ? activeBg : ''
                    }`}
                  >
                    <Ionicons name="settings-outline" size={20} color={currentTab === 'Settings' ? activeIcon : iconColor} />
                    <Text className={`ml-3 ${currentTab === 'Settings' ? activeText : textSecondary}`}>
                      Settings
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Preferences */}
                <View className="mb-6">
                  <Text className={`text-xs uppercase tracking-wider mb-3 ${textSecondary}`}>Preferences</Text>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate("/(screens)/noti-settings");
                      handleClose();
                    }}
                    className="flex-row items-center px-4 py-3 rounded-xl mb-2"
                  >
                    <Ionicons name="notifications-outline" size={20} color={iconColor} />
                    <Text className={`ml-3 ${textSecondary}`}>Notification Settings</Text>
                  </TouchableOpacity>
                  
                  <View className="flex-row items-center justify-between px-4 py-3 rounded-xl mb-2">
                    <View className="flex-row items-center">
                      <Ionicons name="moon-outline" size={20} color={iconColor} />
                      <Text className={`ml-3 ${textSecondary}`}>Dark Mode</Text>
                    </View>
                    <Switch
                      value={localDarkMode}
                      onValueChange={handleThemeToggle}
                      trackColor={{ false: '#3f3f46', true: '#3b82f6' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>

                {/* Help & Support */}
                <View className="mb-6">
                  <Text className={`text-xs uppercase tracking-wider mb-3 ${textSecondary}`}>Support</Text>

                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate("/(screens)/help");
                      handleClose();
                    }}
                    className="flex-row items-center px-4 py-3 rounded-xl mb-2"
                  >
                    <Ionicons name="help-circle-outline" size={20} color={iconColor} />
                    <Text className={`ml-3 ${textSecondary}`}>Help Center</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate("/(screens)/share-testi");
                      handleClose();
                    }}
                    className="flex-row items-center px-4 py-3 rounded-xl mb-2"
                  >
                    <Ionicons name="chatbubble-outline" size={20} color={iconColor} />
                    <Text className={`ml-3 ${textSecondary}`}>Testimonials</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign Out Button */}
                <View className="pt-4 pb-8">
                  <TouchableOpacity 
                    onPress={() => setIsLoginVisible(true)}
                    className="flex-row items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10"
                  >
                    <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                    <Text className="text-red-500 font-medium">Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.ScrollView>

            {/* Gradient Overlay at Bottom */}
            <LinearGradient
              colors={isDark ? ['transparent', '#0a0a0a'] : ['transparent', '#f5f5f5']}
              locations={[0, 0.3]}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 40,
                pointerEvents: 'none',
              }}
            />
          </View>
        </Animated.View>
      </View>

      <CustomDialogBox
        visible={isLoginVisible}
        title={`Sign out ${user?.displayName}`} 
        actionButtonName='Logout'
        message='Are You Sure You Want to Sign Out?'
        onCancel={() => setIsLoginVisible(false)}
        onConfirm={() => {
          handleSignOut();
          setIsLoginVisible(false);
        }}
      />
    </Modal>
  );
}