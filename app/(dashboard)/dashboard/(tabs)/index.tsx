import { View, Text, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;

export default function HomeScreen() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: isSidebarVisible ? -SIDEBAR_WIDTH : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
   <></>
  );
}





/*  <Animated.View 
          style={[
            {
              flex: 1,
              transform: [{ translateX: slideAnim.interpolate({
                inputRange: [-SIDEBAR_WIDTH, 0],
                outputRange: [0, SIDEBAR_WIDTH],
                extrapolate: 'clamp',
              }) }],
            }
          ]}
        >
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-6">
            

             
              <View className="flex-row flex-wrap gap-4 mt-2">
                
                <View className="bg-neutral-900 p-5 rounded-2xl flex-1 min-w-[180px] border border-neutral-800">
                  <Text className="text-neutral-400 text-sm">Total Studies</Text>
                  <Text className="text-white text-3xl font-bold mt-1">0</Text>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="time-outline" size={14} color="#6b7280" />
                    <Text className="text-neutral-500 text-xs ml-1">started</Text>
                  </View>
                </View>

              
                <View className="bg-neutral-900 p-5 rounded-2xl flex-1 min-w-[180px] border border-neutral-800">
                  <Text className="text-neutral-400 text-sm">Storage Used</Text>
                  <Text className="text-white text-3xl font-bold mt-1">0 Bytes</Text>
                  <Text className="text-neutral-500 text-xs mt-2">of 500 MB (0.0%)</Text>
                </View>

              
                <View className="bg-neutral-900 p-5 rounded-2xl flex-1 min-w-[180px] border border-neutral-800">
                  <Text className="text-neutral-400 text-sm">Uploads This Month</Text>
                  <Text className="text-white text-3xl font-bold mt-1">0</Text>
                  <Text className="text-neutral-500 text-xs mt-2">Last upload --</Text>
                </View>
              </View>

             
              <View className="mt-6 bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
                <Text className="text-white font-semibold text-lg">Reminder</Text>
                <Text className="text-neutral-300 mt-1">Appointment alert</Text>
              </View>

              
              <View className="mt-8">
                <Text className="text-white text-xl font-semibold mb-4">Recent Uploads</Text>
                
               
                <View className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
                  <Text className="text-white mb-6">Files by Type</Text>
                  
                 
                  <View className="flex-row justify-between items-end h-32">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <View key={day} className="items-center">
                        <View className="w-8 bg-neutral-800 rounded-t-lg h-16" />
                        <Text className="text-neutral-500 text-xs mt-2">{day}</Text>
                      </View>
                    ))}
                  </View>
                  
                  
                  <View className="items-center py-8 mt-4 border-t border-neutral-800">
                    <Ionicons name="cloud-upload-outline" size={40} color="#4b5563" />
                    <Text className="text-neutral-400 text-base mt-2">No recent uploads</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View> */