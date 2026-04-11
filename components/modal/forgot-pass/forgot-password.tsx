import { resetPassword } from '@/config/firebase/services/auth/auth';
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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;

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
        className="flex-1 bg-black/50"
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
        className="bg-black rounded-t-3xl"
      >
        {/* Drag Handle */}
        <View {...panResponder.panHandlers} className="items-center pt-3 pb-2">
          <View className="w-12 h-1.5 bg-neutral-700 rounded-full" />
        </View>

        {/* Close Button */}
        <TouchableOpacity
          onPress={handleClose}
          className="absolute top-4 right-5 z-10 w-10 h-10 rounded-full bg-neutral-800 items-center justify-center"
        >
          <Ionicons name="close" size={20} color="#a1a1aa" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 px-6 pt-6 pb-8">
            {/* Icon */}
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-blue-500/10 rounded-full items-center justify-center">
                <Ionicons name="key-outline" size={32} color="#3b82f6" />
              </View>
            </View>

            {/* Title */}
            <Text className="text-white text-2xl font-bold text-center mb-2">
              Reset Password
            </Text>
            <Text className="text-neutral-500 text-center text-sm mb-8">
              Enter your email address and we'll send you a link to reset your password
            </Text>

            {/* Email Input */}
            {!emailSent ? (
              <>
                <View className="flex-row items-center bg-neutral-900 rounded-xl px-4 border border-neutral-800 mb-4">
                  <Ionicons name="mail-outline" size={20} color="#737373" />
                  <TextInput
                    className="flex-1 text-white py-4 ml-3 text-base"
                    placeholder="Email address"
                    placeholderTextColor="#737373"
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
                  className={`py-4 rounded-xl mb-4 ${loading ? 'bg-blue-600/50' : 'bg-blue-600'}`}
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
                  <Text className="text-neutral-500 text-center text-sm">
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // Success State
              <>
                <View className="items-center mb-6">
                  <View className="w-20 h-20 bg-green-500/10 rounded-full items-center justify-center">
                    <Ionicons name="checkmark-circle" size={40} color="#10b981" />
                  </View>
                </View>

                <Text className="text-white text-xl font-semibold text-center mb-2">
                  Check your email
                </Text>
                <Text className="text-neutral-500 text-center text-sm mb-8">
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
                  <Text className="text-blue-500 text-center text-sm">
                    Wrong email? Edit
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Footer Note */}
            <Text className="text-neutral-600 text-xs text-center mt-8">
              We'll never share your email with anyone else
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

export default ForgotPassword;