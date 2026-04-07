import { signOutUser } from '@/config/firebase/services/auth/auth';
import { StorageService, UserStorage } from '@/config/firebase/services/storage-tracker/service';
import { useAuth } from '@/context/auth-context';
import { getInitials } from '@/utils/cryto';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, Modal, Platform, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  darkMode = true,
  onDarkModeToggle,
}: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [storageInfo, setStorageInfo] = useState<UserStorage | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(true);

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
              backgroundColor: '#0a0a0a',
              borderRightWidth: 1,
              borderRightColor: '#262626',
            }
          ]}
        >
          <View className="flex-1" style={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top }}>
            {/* Sticky Header with Gradient */}
            <Animated.View 
              style={{ 
                opacity: headerOpacity,
                backgroundColor: '#0a0a0a',
                borderBottomWidth: 1,
                borderBottomColor: '#262626',
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
                    <Text className="text-white text-xl font-bold -ml-2">Medora</Text> 
                  </View>
                  <TouchableOpacity onPress={handleClose} className="w-10 h-10 items-center justify-center">
                    <Ionicons name="close" size={24} color="#a1a1aa" />
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
                  className="flex-row items-center bg-neutral-800/50 p-3 rounded-xl mb-6"
                >
                  <View className="w-12 h-12 bg-blue-500/20 rounded-full items-center justify-center">
                   {
                     !user?.photoURL ? (
                      <>
                      <Text className='text-white  font-semibold uppercase'>
                       {getInitials(user?.displayName || 'User')}
                                </Text>
                                </>)
                                 : ( <Image
                                src={user?.photoURL|| ""}
                                alt=''
                                className='w-16 h-16 rounded-full object-contain'
                               />)
                              }
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white text-lg font-medium">{user?.displayName || "User"}</Text>
                    <Text className='text-white text-xs opacity-50'>{user?.email}</Text>
                  </View>
                </TouchableOpacity>

                {/* Analytics Section - Storage Tracker */}
                <View className="mb-6">
                  <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Analytics</Text>
                  
                  <View className="bg-neutral-900 rounded-xl p-4 mb-3">
                    <Text className="text-neutral-400 text-xs mb-2">Storage Usage</Text>
                    <View className="flex-row justify-between items-end mb-2">
                      <Text className="text-white text-2xl font-bold">
                        {loadingStorage ? '...' : formatFileSize(totalBytes)}
                      </Text>
                      <Text className="text-neutral-500 text-xs">
                        of {storageLimitMB} MB
                      </Text>
                    </View>
                    <View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <View 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${loadingStorage ? 0 : storagePercentage}%` }}
                      />
                    </View>
                    <Text className="text-neutral-500 text-xs mt-2">
                      {loadingStorage ? 'Loading...' : `${storagePercentage.toFixed(1)}% used`}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate('/(screens)/storage-anal');
                      handleClose();
                    }}
                    className="flex-row items-center justify-between px-4 py-3 rounded-xl bg-neutral-800/50"
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="stats-chart-outline" size={20} color="#737373" />
                      <Text className="text-neutral-300 ml-3">View Detailed Analytics</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#737373" />
                  </TouchableOpacity>
                </View>

                {/* Starred & Recents */}
                <View className="mb-6">
                  <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Collections</Text>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate('/(screens)/starred');
                      handleClose();
                    }}
                    className={`flex-row items-center px-4 py-3 rounded-xl mb-2 ${
                      currentTab === 'Starred' ? 'bg-blue-500/10' : ''
                    }`}
                  >
                    <Ionicons name="star-outline" size={20} color={currentTab === 'Starred' ? '#3b82f6' : '#737373'} />
                    <Text className={`ml-3 ${currentTab === 'Starred' ? 'text-white font-medium' : 'text-neutral-400'}`}>
                      Starred Files
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate('/(screens)/recents');
                      handleClose();
                    }}
                    className={`flex-row items-center px-4 py-3 rounded-xl mb-2 ${
                      currentTab === 'Recents' ? 'bg-blue-500/10' : ''
                    }`}
                  >
                    <Ionicons name="time-outline" size={20} color={currentTab === 'Recents' ? '#3b82f6' : '#737373'} />
                    <Text className={`ml-3 ${currentTab === 'Recents' ? 'text-white font-medium' : 'text-neutral-400'}`}>
                      Recent Files
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Trash & Settings */}
                <View className="mb-6">
                  <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Manage</Text>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate('(screens)/trash');
                      handleClose();
                    }}
                    className={`flex-row items-center px-4 py-3 rounded-xl mb-2 ${
                      currentTab === 'Trash' ? 'bg-blue-500/10' : ''
                    }`}
                  >
                    <Ionicons name="trash-outline" size={20} color={currentTab === 'Trash' ? '#3b82f6' : '#737373'} />
                    <Text className={`ml-3 ${currentTab === 'Trash' ? 'text-white font-medium' : 'text-neutral-400'}`}>
                      Trash
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate('/(dashboard)/dashboard/(tabs)/settings');
                      handleClose();
                    }}
                    className={`flex-row items-center px-4 py-3 rounded-xl mb-2 ${
                      currentTab === 'Settings' ? 'bg-blue-500/10' : ''
                    }`}
                  >
                    <Ionicons name="settings-outline" size={20} color={currentTab === 'Settings' ? '#3b82f6' : '#737373'} />
                    <Text className={`ml-3 ${currentTab === 'Settings' ? 'text-white font-medium' : 'text-neutral-400'}`}>
                      Settings
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Preferences */}
                <View className="mb-6">
                  <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Preferences</Text>
                  
                 <TouchableOpacity 
  onPress={() => {
    onNavigate("/(screens)/noti-settings");
    handleClose();
  }}
  className="flex-row items-center px-4 py-3 rounded-xl mb-2"
>
  <Ionicons name="notifications-outline" size={20} color="#737373" />
  <Text className="text-neutral-300 ml-3">Notification Settings</Text>
</TouchableOpacity>
                  
                  <View className="flex-row items-center justify-between px-4 py-3 rounded-xl mb-2">
                    <View className="flex-row items-center">
                      <Ionicons name="moon-outline" size={20} color="#737373" />
                      <Text className="text-neutral-300 ml-3">Dark Mode</Text>
                    </View>
                    <Switch
                      value={darkMode}
                      onValueChange={onDarkModeToggle || (() => {})}
                      trackColor={{ false: '#3f3f46', true: '#3b82f6' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>

                {/* Help & Support */}
                <View className="mb-6">
                  <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Support</Text>

                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate("/(screens)/help");
                      handleClose();
                    }}
                    className="flex-row items-center px-4 py-3 rounded-xl mb-2"
                  >
                    <Ionicons name="help-circle-outline" size={20} color="#737373" />
                    <Text className="text-neutral-300 ml-3">Help Center</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => {
                      onNavigate("/(screens)/share-testi");
                      handleClose();
                    }}
                    className="flex-row items-center px-4 py-3 rounded-xl mb-2"
                  >
                    <Ionicons name="chatbubble-outline" size={20} color="#737373" />
                    <Text className="text-neutral-300 ml-3">Testimonials</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign Out Button */}
                <View className="pt-4 pb-8">
                  <TouchableOpacity 
                    onPress={handleSignOut}
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
              colors={['transparent', '#0a0a0a']}
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
    </Modal>
  );
}