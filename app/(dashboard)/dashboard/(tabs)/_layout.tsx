import React from 'react';
import { Text, ScrollView, TouchableOpacity, Animated, Dimensions, View, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useCallback } from 'react';
import { usePathname, router, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;

export default function TabsLayout() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pathname = usePathname();

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
    // 🔥 only after animation completes
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

  const handleNavigation = useCallback((route: string) => {
   /*  router.push(route); */
    closeSidebar();
  }, []);

  const getTabName = () => {
    if (pathname.includes('mydrive')) return 'My Drive';
    if (pathname.includes('reminder')) return 'Reminders';
    if (pathname.includes('trash')) return 'Trash';
    if (pathname.includes('settings')) return 'Settings';
    return 'Dashboard';
  };

  const currentTab = getTabName();

  return (
    <View className="flex-1 bg-neutral-950">
      <StatusBar barStyle="light-content" />
      
      {/* Main Content */}
      <View className="flex-1">
        {/* Header */}
        <SafeAreaView edges={['top', 'left', 'right']} className="bg-black">
          <View className="flex-row items-center justify-between px-4 pb-2">
            <TouchableOpacity onPress={toggleSidebar} className="w-10 h-10 items-center justify-center">
              <Ionicons name="menu-outline" size={24} color="white" />
            </TouchableOpacity>
            
            <Text className="text-white text-lg font-semibold">{currentTab}</Text>
            
            {currentTab === 'Dashboard' ? (
              <TouchableOpacity onPress={() => console.log('Filter')} className="w-10 h-10 items-center justify-center">
                <Ionicons name="options-outline" size={22} color="white" />
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
              tabBarActiveTintColor: '#3b82f6',
              tabBarInactiveTintColor: '#525252',
              tabBarStyle: {
                backgroundColor: '#0a0a0a',
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
                height: Platform.OS === 'ios' ? 80 : 60,
                paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                paddingTop: 20,
                paddingLeft: 10,
                paddingRight: 10,
                borderTopColor: '#262626',
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
              name='mydrive'
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
      </View>

      {/* Overlay when sidebar is open */}
      {isSidebarVisible && (
        <Animated.View 
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              opacity: fadeAnim,
              zIndex: 25,
            }
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
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 30,
            backgroundColor: '#0a0a0a',
            borderRightWidth: 1,
            borderRightColor: '#262626',
          }
        ]}
      >
        <SafeAreaView className="flex-1">
          <View className="px-4 py-2">
            <View className="flex-row justify-between items-center mb-8">
             <View className='flex-row items-center '>
               <Image
               source={require("@/assets/logo/logo.png")}
               className='w-14 h-14'
              />
              <Text className="text-white text-xl font-bold -ml-2">Medora</Text> 
             </View>
              <TouchableOpacity onPress={closeSidebar} className="w-10 h-10 items-center justify-center">
                <Ionicons name="close" size={24} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
            
           
              {/* Dashboard Tab */}
              <TouchableOpacity 
                onPress={() => handleNavigation('/')}
                className={`flex-row items-center px-4 py-3 rounded-xl mb-1 ${
                  currentTab === 'Dashboard' ? 'bg-blue-500/10' : ''
                }`}
              >
                <Ionicons 
                  name="apps-outline" 
                  size={22} 
                  color={currentTab === 'Dashboard' ? '#3b82f6' : '#737373'} 
                />
                <Text className={`ml-3 ${
                  currentTab === 'Dashboard' ? 'text-white font-medium' : 'text-neutral-400'
                }`}>
                  Dashboard
                </Text>
              </TouchableOpacity>

              {/* My Drive */}
              <TouchableOpacity 
                onPress={() => handleNavigation('/mydrive')}
                className={`flex-row items-center px-4 py-3 rounded-xl mb-1 ${
                  currentTab === 'My Drive' ? 'bg-blue-500/10' : ''
                }`}
              >
                <Ionicons 
                  name="folder-outline" 
                  size={22} 
                  color={currentTab === 'My Drive' ? '#3b82f6' : '#737373'} 
                />
                <Text className={`ml-3 ${
                  currentTab === 'My Drive' ? 'text-white font-medium' : 'text-neutral-400'
                }`}>
                  My Drive
                </Text>
              </TouchableOpacity>

              {/* Reminder */}
              <TouchableOpacity 
                onPress={() => handleNavigation('/reminder')}
                className={`flex-row items-center px-4 py-3 rounded-xl mb-1 ${
                  currentTab === 'Reminders' ? 'bg-blue-500/10' : ''
                }`}
              >
                <Ionicons 
                  name="alarm-outline" 
                  size={22} 
                  color={currentTab === 'Reminders' ? '#3b82f6' : '#737373'} 
                />
                <Text className={`ml-3 ${
                  currentTab === 'Reminders' ? 'text-white font-medium' : 'text-neutral-400'
                }`}>
                  Reminders
                </Text>
              </TouchableOpacity>

              <View className="h-px bg-neutral-800 my-4" />

              {/* Trash */}
              <TouchableOpacity 
                onPress={() => handleNavigation('/trash')}
                className={`flex-row items-center px-4 py-3 rounded-xl mb-1 ${
                  currentTab === 'Trash' ? 'bg-blue-500/10' : ''
                }`}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={20} 
                  color={currentTab === 'Trash' ? '#3b82f6' : '#737373'} 
                />
                <Text className={`ml-3 ${
                  currentTab === 'Trash' ? 'text-white font-medium' : 'text-neutral-400'
                }`}>
                  Trash
                </Text>
              </TouchableOpacity>
              
              {/* Settings */}
              <TouchableOpacity 
                onPress={() => handleNavigation('/settings')}
                className={`flex-row items-center px-4 py-3 rounded-xl mb-1 ${
                  currentTab === 'Settings' ? 'bg-blue-500/10' : ''
                }`}
              >
                <Ionicons 
                  name="settings-outline" 
                  size={20} 
                  color={currentTab === 'Settings' ? '#3b82f6' : '#737373'} 
                />
                <Text className={`ml-3 ${
                  currentTab === 'Settings' ? 'text-white font-medium' : 'text-neutral-400'
                }`}>
                  Settings
                </Text>
              </TouchableOpacity>
           

            {/* Storage Info */}
            <View className="mt-auto pt-6">
              <View className="bg-neutral-900 p-4 rounded-xl">
                <Text className="text-neutral-400 text-xs mb-1">Storage</Text>
                <Text className="text-white text-sm font-medium">0 Bytes / 500 MB</Text>
                <View className="h-1 bg-neutral-800 rounded-full mt-3">
                  <View className="w-0 h-full bg-blue-500 rounded-full" />
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}