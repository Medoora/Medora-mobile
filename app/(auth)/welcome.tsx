import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { useRef, useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoSource, setVideoSource] = useState(null);

  // Array of your three videos
  const videos = [
    require('@/assets/videos/med-into-1.mp4'),
    require('@/assets/videos/med-intro-2.mp4'),
    require('@/assets/videos/med-intro-3.mp4')
  ];

  // Pick a random video when component mounts
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * videos.length);
    setVideoSource(videos[randomIndex]);
  }, []);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      
      {/* Show loading indicator while video is being selected/loaded */}
      {(!videoSource || !isVideoLoaded) && (
        <View className="absolute inset-0 justify-center items-center z-20">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="text-white/70 mt-2">Loading experience...</Text>
        </View>
      )}
      
      {/* Video Background - Only render when we have a source */}
      {videoSource && (
        <Video
          ref={videoRef}
          source={videoSource}
          className="absolute top-0 left-0 right-0 bottom-0"
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted={true}
          onLoad={() => setIsVideoLoaded(true)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}
      
      {/* Dark Gradient Overlay - Always visible */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
        className="absolute top-0 left-0 right-0 bottom-0"
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Content - Always visible */}
      <View className="absolute top-0 left-0 right-0 bottom-0 px-6 py-12">
        {/* Logo at the top */}
        <View className="items-center mt-12">
          <Image
            source={require("@/assets/logo/3.png")}
            className="w-44 h-44"
            resizeMode="contain"
          />
          
        </View>

        {/* Center content - using flex-1 to push buttons to bottom */}
        <View className="flex-1 justify-center">
         
        </View>
        
        {/* Bottom Buttons */}
        <View className="w-full">
         <TouchableOpacity
  onPress={() => router.push('/(auth)/sign-up')}
  className="bg-white py-4 px-6 rounded-2xl shadow-lg flex-row items-center justify-center w-full"
  activeOpacity={0.9}
  style={{
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }}
>
  <FontAwesome name="apple" size={22} color="#000000" />
  <Text className="text-black text-center font-medium text-base ml-3">
    Connect to Apple
  </Text>
</TouchableOpacity>
  <TouchableOpacity
   onPress={() => router.push('/(auth)/sign-up')}
  className="bg-neutral-800/60 py-4 px-6 mt-4 rounded-2xl shadow-lg flex-row items-center justify-center w-full"
  >
    <Text className='text-white font-medium'>Other options</Text>
  </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-in')}
            className="mt-4 py-2"
          >
            <Text className="text-white/80 text-center">
              Already have an account?{' '}
              <Text className="text-white font-bold">Sign In</Text>
            </Text>
          </TouchableOpacity>
          
          <Text className="text-white/50 text-center font-medium text-xs tracking-wide mt-4">
           By signing up, you agrees to our <Text className='font-semibold text-white'>Terms of Service</Text> and your <Text className='font-semibold text-white'>Privacy Policy.</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}