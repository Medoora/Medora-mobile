import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View  className='bg-neutral-950 h-screen flex items-center justify-center'>
      <Text className='text-white font-bold text-2xl'>Dashboard Home</Text>
      <Text className='text-white font-medium'>Welcome to your dashboard!</Text>
    </View>
  );
}

