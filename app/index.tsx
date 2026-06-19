import { useAuth } from '@/context/auth-context';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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

export default function Index() {
  const router = useRouter();
  const { user, isLoading: authLoading, hasCompletedOnboarding } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // ✅ Stable random video
  const videoSource = useMemo(() => {
    const videos = [
      require('@/assets/videos/med-into-1.mp4'),
      require('@/assets/videos/med-intro-2.mp4'),
      require('@/assets/videos/med-intro-3.mp4'),
    ];
    return videos[Math.floor(Math.random() * videos.length)];
  }, []);

  // ✅ Player
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // ✅ Redirect based on user and onboarding status
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    if (user && !isRedirecting) {
      setIsRedirecting(true);
      
      // Check if onboarding is completed
      if (hasCompletedOnboarding) {
        // Onboarding complete → Go to dashboard
        router.replace('/(dashboard)/dashboard/(tabs)');
      } else {
        // Onboarding not complete → Go to onboarding
        router.replace('/(onboarding)/onboarding'); // or your onboarding screen path
      }
    }
  }, [user, authLoading, hasCompletedOnboarding, isRedirecting]);

  // ✅ Show loading while checking auth (prevents flash)
  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // ✅ If user is logged in, don't render the splash screen (show loading while redirecting)
  if (user) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // ✅ Show splash screen only for non-authenticated users
  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar style="light" />

      {/* Video Background */}
      <VideoView
        player={player}
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
        style={{
          position: 'absolute',
          inset: 0,
        }}
      />

      {/* UI Content */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingVertical: 48,
        }}
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginTop: 48 }}>
          <Image
            source={require('@/assets/logo/new-medora-b.png')}
            style={{ width: 176, height: 176 }}
            resizeMode="contain"
          />
        </View>

        <View style={{ flex: 1 }} />

        {/* Buttons - Only show for non-authenticated users */}
        <View>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-up')}
            style={{
              backgroundColor: '#fff',
              padding: 16,
              borderRadius: 16,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <FontAwesome name="rocket" size={22} color="#000" />
            <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '600' }}>
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-up')}
            style={{
              backgroundColor: 'rgba(38,38,38,0.6)',
              padding: 16,
              marginTop: 16,
              borderRadius: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff' }}>Other options</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-in')}
            style={{ marginTop: 16 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center' }}>
              Already have an account? <Text style={{ fontWeight: 'bold' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
              fontSize: 10,
              marginTop: 16,
            }}
          >
            Signing up, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </View>
  );
}