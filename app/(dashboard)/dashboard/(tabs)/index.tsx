import { View, Text, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <Animated.ScrollView 
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      className="flex-1 bg-black"
    >
      <View className="pb-20 px-2 pt-2 bg-black">
        {/* Stats Cards Grid */}
        <View className="flex-row flex-wrap gap-4">
          {/* Total Studies */}
          <View className="bg-neutral-900 p-5 rounded-2xl flex-1 min-w-[150px] border border-neutral-800">
            <Text className="text-neutral-400 text-sm">Total Studies</Text>
            <Text className="text-white text-3xl font-bold mt-1">0</Text>
            <View className="flex-row items-center mt-2">
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text className="text-neutral-500 text-xs ml-1">started</Text>
            </View>
          </View>

          {/* Storage Used */}
          <View className="bg-neutral-900 p-5 rounded-2xl flex-1 min-w-[150px] border border-neutral-800">
            <Text className="text-neutral-400 text-sm">Storage Used</Text>
            <Text className="text-white text-3xl font-bold mt-1">0 Bytes</Text>
            <Text className="text-neutral-500 text-xs mt-2">of 500 MB (0.0%)</Text>
          </View>

          {/* Uploads This Month */}
          <View className="bg-neutral-900 p-5 rounded-2xl flex-1 min-w-[150px] border border-neutral-800">
            <Text className="text-neutral-400 text-sm">Uploads This Month</Text>
            <Text className="text-white text-3xl font-bold mt-1">0</Text>
            <Text className="text-neutral-500 text-xs mt-2">Last upload --</Text>
          </View>
        </View>

        {/* Reminder Card */}
        <View className="mt-6 bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
          <Text className="text-white font-semibold text-lg">Reminder</Text>
          <Text className="text-neutral-300 mt-1">Appointment alert</Text>
        </View>

        {/* Recent Uploads */}
        <View className="mt-8">
          <Text className="text-white text-xl font-semibold mb-4">Recent Uploads</Text>
          
          <View className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
            <Text className="text-white mb-6">Files by Type</Text>
            
            {/* Week Days Chart */}
            <View className="flex-row justify-between items-end h-32">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <View key={day} className="items-center">
                  <View className="w-8 bg-neutral-800 rounded-t-lg h-16" />
                  <Text className="text-neutral-500 text-xs mt-2">{day}</Text>
                </View>
              ))}
            </View>
            
            {/* No uploads message */}
            <View className="items-center py-8 mt-4 border-t border-neutral-800">
              <Ionicons name="cloud-upload-outline" size={40} color="#4b5563" />
              <Text className="text-neutral-400 text-base mt-2">No recent uploads</Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.ScrollView>
  );
}