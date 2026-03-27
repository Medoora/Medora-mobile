import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function WelcomeScreen() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // ✅ Stable random video (runs once)
  const videoSource = useMemo(() => {
   const videos = [
    require('@/assets/videos/med-into-1.mp4'),
    require('@/assets/videos/med-intro-2.mp4'),
    require('@/assets/videos/med-intro-3.mp4')
  ];
    return videos[Math.floor(Math.random() * videos.length)];
  }, []);

  // ✅ Initialize player
  const player = useVideoPlayer(videoSource);

  // ✅ Proper lifecycle handling
  useEffect(() => {
    if (!player) return;

    player.loop = true;
    player.muted = true;
    player.play();

    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        setIsVideoLoaded(true);
      }
    });

    return () => {
      sub.remove();
    };
  }, [player]);

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar style="light" />

      {/* ✅ Loader */}
      {!isVideoLoaded && (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
            Loading experience...
          </Text>
        </View>
      )}

      {/* ✅ Video Background */}
      <VideoView
        player={player}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        contentFit="cover"
      />

      {/* ✅ Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* ✅ Content */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 24,
          paddingVertical: 48,
        }}
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginTop: 48 }}>
          <Image
            source={require('../../assets/logo/3.png')}
            style={{ width: 176, height: 176 }}
            resizeMode="contain"
          />
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Buttons */}
        <View style={{ width: '100%' }}>
          {/* Apple */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.9}
            style={{
              backgroundColor: '#fff',
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: 16,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <FontAwesome name="apple" size={22} color="#000" />
            <Text
              style={{
                color: '#000',
                fontWeight: '500',
                fontSize: 16,
                marginLeft: 12,
              }}
            >
              Connect to Apple
            </Text>
          </TouchableOpacity>

          {/* Other options */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-up')}
            style={{
              backgroundColor: 'rgba(38,38,38,0.6)',
              paddingVertical: 16,
              paddingHorizontal: 24,
              marginTop: 16,
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '500' }}>
              Other options
            </Text>
          </TouchableOpacity>

          {/* Sign in */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-in')}
            style={{ marginTop: 16, paddingVertical: 8 }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
              }}
            >
              Already have an account?{' '}
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text
           className='text-xs'
            style={{
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
              fontSize: 10,
              marginTop: 16,
            }}
          >
            signing up, you agree to our{' '}
            <Text className='text-xs' style={{ color: '#fff', fontWeight: '600' }}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text className='text-xs' style={{ color: '#fff', fontWeight: '600' }}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>
    </View>
  );
}