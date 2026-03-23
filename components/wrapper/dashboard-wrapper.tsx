import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sidebar from '../sidebar/sidebar';

interface DashboardWrapperProps {
  children: React.ReactNode;
  title: string;
  showRightIcon?: boolean;
  rightIconName?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export default function DashboardWrapper({ 
  children, 
  title, 
  showRightIcon = false,
  rightIconName = "options-outline",
  onRightIconPress 
}: DashboardWrapperProps) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <SafeAreaView edges={['top', 'left', 'right']} className="bg-black">
        <View className="flex-row items-center justify-between px-4 pb-2">
          <TouchableOpacity 
            onPress={() => setIsSidebarVisible(true)} 
            className="w-10 h-10 items-center justify-center"
          >
            <AntDesign name="align-left" size={20} color="white" />
          </TouchableOpacity>
          
          <Text className="text-white text-lg font-semibold">{title}</Text>
          
          {showRightIcon ? (
            <TouchableOpacity 
              onPress={onRightIconPress || (() => {})} 
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name={rightIconName} size={22} color="white" />
            </TouchableOpacity>
          ) : (
            <View className="w-10 h-10" />
          )}
        </View>
      </SafeAreaView>

      {/* Content */}
      <View className="flex-1">
        {children}
      </View>

      {/* Sidebar */}
      <Sidebar
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        onNavigate={handleNavigate}
        notificationsEnabled={notificationsEnabled}
        onNotificationsToggle={setNotificationsEnabled}
        darkMode={darkMode}
        onDarkModeToggle={setDarkMode}
      />
    </View>
  );
}