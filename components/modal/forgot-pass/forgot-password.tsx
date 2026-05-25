import { resetPassword } from '@/config/firebase/services/auth/auth';
import { useAppTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { height } = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.85;

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ForgotPassword = ({ onClose, visible }: Props) => {
  const { isDark } = useAppTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;

  // Theme-aware colors
  const modalBg = isDark ? 'bg-black' : 'bg-white';
  const overlayBg = isDark ? 'bg-black/50' : 'bg-black/30';
  const dragHandleBg = isDark ? 'bg-neutral-700' : 'bg-gray-300';
  const closeButtonBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  const closeIconColor = isDark ? '#a1a1aa' : '#6b7280';
  const iconBg = isDark ? 'bg-blue-500/10' : 'bg-blue-100';
  const iconColor = '#3b82f6';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-500' : 'text-gray-500';
  const textTertiary = isDark ? 'text-neutral-600' : 'text-gray-400';
  const inputBg = isDark ? 'bg-neutral-900' : 'bg-gray-100';
  const inputBorder = isDark ? 'border-neutral-800' : 'border-gray-200';
  const inputText = isDark ? 'text-white' : 'text-black';
  const placeholderColor = isDark ? '#737373' : '#9ca3af';
  const buttonBg = isDark ? 'bg-blue-600' : 'bg-blue-500';
  const buttonDisabled = isDark ? 'bg-blue-600/50' : 'bg-blue-500/50';
  const successIconBg = isDark ? 'bg-green-500/10' : 'bg-green-100';
  const successIconColor = '#10b981';
  const linkText = isDark ? 'text-blue-500' : 'text-blue-600';

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 5,
      }).start();
    } else {
      translateY.setValue(MODAL_HEIGHT);
    }
  }, [visible]);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        setEmailSent(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert('Error', error?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: MODAL_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setEmail('');
      setEmailSent(false);
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      {/* Overlay */}
      <TouchableOpacity
        className={`flex-1 ${overlayBg}`}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Modal Content */}
      <Animated.View
        style={{
          transform: [{ translateY }],
          height: MODAL_HEIGHT,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
        className={`rounded-t-3xl ${modalBg}`}
      >
        {/* Drag Handle */}
        <View {...panResponder.panHandlers} className="items-center pt-3 pb-2">
          <View className={`w-12 h-1.5 ${dragHandleBg} rounded-full`} />
        </View>

        {/* Close Button */}
        <TouchableOpacity
          onPress={handleClose}
          className={`absolute top-4 right-5 z-10 w-10 h-10 rounded-full ${closeButtonBg} items-center justify-center`}
        >
          <Ionicons name="close" size={20} color={closeIconColor} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 px-6 pt-6 pb-8">
            {/* Icon */}
            <View className="items-center mb-6">
              <View className={`w-20 h-20 ${iconBg} rounded-full items-center justify-center`}>
                <Ionicons name="key-outline" size={32} color={iconColor} />
              </View>
            </View>

            {/* Title */}
            <Text className={`${textPrimary} text-2xl font-bold text-center mb-2`}>
              Reset Password
            </Text>
            <Text className={`${textSecondary} text-center text-sm mb-8`}>
              Enter your email address and we'll send you a link to reset your password
            </Text>

            {/* Email Input */}
            {!emailSent ? (
              <>
                <View className={`flex-row items-center ${inputBg} rounded-xl px-4 border ${inputBorder} mb-4`}>
                  <Ionicons name="mail-outline" size={20} color="#737373" />
                  <TextInput
                    className={`flex-1 ${inputText} py-4 ml-3 text-base`}
                    placeholder="Email address"
                    placeholderTextColor={placeholderColor}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  {email.length > 0 && (
                    <TouchableOpacity onPress={() => setEmail('')}>
                      <Ionicons name="close-circle" size={18} color="#737373" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Reset Button */}
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={loading}
                  className={`py-4 rounded-xl mb-4 ${loading ? buttonDisabled : buttonBg}`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white text-center font-semibold text-base">
                      Send Reset Link
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Back to Sign In */}
                <TouchableOpacity onPress={handleClose}>
                  <Text className={`${textSecondary} text-center text-sm`}>
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // Success State
              <>
                <View className="items-center mb-6">
                  <View className={`w-20 h-20 ${successIconBg} rounded-full items-center justify-center`}>
                    <Ionicons name="checkmark-circle" size={40} color={successIconColor} />
                  </View>
                </View>

                <Text className={`${textPrimary} text-xl font-semibold text-center mb-2`}>
                  Check your email
                </Text>
                <Text className={`${textSecondary} text-center text-sm mb-8`}>
                  We've sent a password reset link to {email}
                </Text>

                {/* Done Button */}
                <TouchableOpacity
                  onPress={handleClose}
                  className="py-4 rounded-xl bg-blue-600 mb-4"
                >
                  <Text className="text-white text-center font-semibold text-base">
                    Done
                  </Text>
                </TouchableOpacity>

                {/* Resend Option */}
                <TouchableOpacity onPress={() => setEmailSent(false)}>
                  <Text className={`${linkText} text-center text-sm`}>
                    Wrong email? Edit
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Footer Note */}
            <Text className={`${textTertiary} text-xs text-center mt-8`}>
              We'll never share your email with anyone else
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

export default ForgotPassword;