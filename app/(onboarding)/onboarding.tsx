import CustomDialogBox from '@/components/Custom-Dialog/Cus-dialog';
import { db } from '@/config/firebase/config';
import { signOutUser } from '@/config/firebase/services/auth/auth';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  image: any;
  color: string;
}

const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    title: 'Welcome to Medora',
    description: 'Your personal health companion that helps you manage medical records effortlessly.',
    image: require("@/assets/images/wel.png"),
    color: '#3b82f6',
  },
  {
    id: '2',
    title: 'Register with Email or Google',
    description: 'Create your account securely to access all features.',
    image: require("@/assets/images/email.png"),
    color: '#10b981',
  },
  {
    id: '3',
    title: 'Complete Multistep form',
    description: 'Go to the Medora Web and complete your personal information, medical history, insurance details, and more.',
    image: require("@/assets/images/multi.png"),
    color: '#f59e0b',
  },
  {
    id: '4',
    title: 'Access Anywhere',
    description: 'Use Medora on web or mobile to manage your health data anytime, anywhere.',
    image: require("@/assets/images/access.png"),
    color: '#8b5cf6',
  },
  {
    id: '5',
    title: 'Back to App',
    description: 'You can always complete your profile later in Settings. Let\'s explore the app first!',
    image: require("@/assets/images/app.png"),
    color: '#ef4444',
  },
];

const OnboardingScreen = () => {
  const { isDark } = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [isSkipDia, setIsSkipDia] = useState(false);

  // Theme-aware colors
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-400' : 'text-gray-500';
  const textTertiary = isDark ? 'text-neutral-500' : 'text-gray-400';
  const borderColor = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  const dividerBg = isDark ? 'bg-neutral-800' : 'bg-gray-300';
  const skipText = isDark ? 'text-neutral-500' : 'text-gray-500';
  const paginationActive = '#3b82f6';
  const paginationInactive = isDark ? '#1f1f1f' : '#e5e5e5';

  const handleOpenWebForm = async () => {
    if (!user) return;
    
    const webUrl = `https://medora-web-kappa.vercel.app/`;
    
    try {
      await Linking.openURL(webUrl);
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Could not open the onboarding form. Please try again.');
    }
  };

  const handleSkipOnboarding = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user!.uid);
      await updateDoc(userRef, {
        hasCompletedOnboarding: true,
        onboardingSkipped: true,
        onboardingSkippedAt: new Date(),
        updatedAt: new Date(),
      });
      
      router.replace('/(dashboard)/dashboard/(tabs)');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      Alert.alert('Error', 'Failed to skip onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToApp = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user!.uid);
      await updateDoc(userRef, {
        hasCompletedOnboarding: true,
        onboardingSkipped: true,
        onboardingSkippedAt: new Date(),
        updatedAt: new Date(),
      });
      
      router.replace('/(dashboard)/dashboard/(tabs)');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      Alert.alert('Error', 'Failed to proceed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOutUser();
          },
        },
      ]
    );
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const renderItem = ({ item, index }: { item: OnboardingItem; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Animated.View
          style={{
            transform: [{ scale }],
            opacity,
            alignItems: 'center',
          }}
        >
          <Image
            className='h-96 w-96'
            source={item.image}
          />

          <Text className={`${textPrimary} text-3xl font-bold text-center mb-4`}>
            {item.title}
          </Text>
          <Text className={`${textSecondary} text-center text-base leading-6 px-4`}>
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    const dots = [];
    
    for (let i = 0; i < onboardingData.length; i++) {
      const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
      
      const dotWidth = scrollX.interpolate({
        inputRange,
        outputRange: [6, 18, 6],
        extrapolate: 'clamp',
      });
      
      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.3, 1, 0.3],
        extrapolate: 'clamp',
      });
      
      dots.push(
        <Animated.View
          key={i}
          style={{
            width: dotWidth,
            height: 6,
            borderRadius: 3,
            backgroundColor: currentIndex === i ? paginationActive : paginationInactive,
            marginHorizontal: 4,
            opacity,
          }}
        />
      );
    }
    
    return <View className="flex-row justify-center items-center mt-4 mb-6">{dots}</View>;
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const isLastSlide = currentIndex === onboardingData.length - 1;

  return (
    <>
      <SafeAreaView className={`flex-1 ${bgColor}`}>
        <View className="flex-1">
          {/* Skip Button */}
          <TouchableOpacity
            onPress={() => {
              setIsSkipDia(true);
            }}
            className="absolute top-2 right-6 z-10 py-2 px-3"
          >
            <Text className={`${skipText} text-sm`}>Skip</Text>
          </TouchableOpacity>

          {/* Carousel */}
          <FlatList
            ref={flatListRef}
            data={onboardingData}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            keyExtractor={(item) => item.id}
            scrollEventThrottle={16}
            className="flex-1"
          />

          {/* Pagination */}
          {renderPagination()}

          {/* Action Buttons */}
          <View className="px-6 pb-8">
            {isLastSlide ? (
              <TouchableOpacity
                onPress={handleOpenWebForm}
                disabled={loading}
                className={`w-full bg-blue-600 py-4 rounded-2xl mb-3 flex-row items-center justify-center gap-2 ${loading ? 'opacity-50' : ''}`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="arrow-forward-outline" size={20} color="white" />
                    <Text className="text-white font-semibold text-base">
                      Complete Profile
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleNext}
                className="w-full bg-blue-600 py-4 rounded-2xl mb-3 flex-row items-center justify-center gap-2"
              >
                <Text className="text-white font-semibold text-base">Next</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="white" />
              </TouchableOpacity>
            )}

            {/* Divider and Logout */}
            <View className="flex-row items-center gap-4 mt-5">
              <View className={`flex-1 h-px ${dividerBg}`} />
              <Text className={`${textTertiary} text-xs`}>already have an account?</Text>
              <View className={`flex-1 h-px ${dividerBg}`} />
            </View>

            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-center gap-2 py-3 mt-2"
            >
              <Ionicons name="log-out-outline" size={18} color="#737373" />
              <Text className={`${textTertiary} text-sm`}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <CustomDialogBox
        visible={isSkipDia}
        title='Skip Onboarding'
        message='Are you sure you want to skip onboarding? Skipping this step may prevent the chatbot from generating your chat history data.'
        onConfirm={handleSkipOnboarding}
        onCancel={() => {
          setIsSkipDia(false);
        }}
      />
    </>
  );
};

export default OnboardingScreen;