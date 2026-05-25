import DashboardWrapper from '@/components/wrapper/dashboard-wrapper';
import {
  TestimonialFormData,
  testimonialService,
} from '@/config/firebase/services/testimonials/service';
import { useAppTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function TestimonialsScreen() {
  const { isDark } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    about: '',
    review: '',
    rating: 5,
  });
  const [imageUri, setImageUri] = useState<string | null>(null);

  const nameInputRef = useRef<TextInput>(null);
  const roleInputRef = useRef<TextInput>(null);
  const reviewInputRef = useRef<TextInput>(null);

  // Theme-aware colors
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const cardBg = isDark ? 'bg-neutral-900' : 'bg-gray-100';
  const borderColor = isDark ? 'border-neutral-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-500' : 'text-gray-500';
  const textTertiary = isDark ? 'text-neutral-600' : 'text-gray-400';
  const inputBg = isDark ? 'bg-neutral-900' : 'bg-gray-100';
  const placeholderColor = isDark ? '#525252' : '#9ca3af';
  const avatarBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  const iconColor = isDark ? '#737373' : '#9ca3af';
  const removeText = isDark ? 'text-red-400' : 'text-red-600';
  const starInactive = isDark ? '#404040' : '#d1d5db';

  const handleImagePick = async () => {
    Keyboard.dismiss();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selected = result.assets[0];

      if (selected.fileSize && selected.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Error', 'Image size should be less than 5MB');
        return;
      }

      setImageUri(selected.uri);
    }
  };

  const removeImage = () => setImageUri(null);

  const handleSubmit = async () => {
    Keyboard.dismiss();

    const testimonialData: TestimonialFormData = {
      name: formData.name,
      about: formData.about,
      review: formData.review,
      rating: formData.rating,
      imageUri: imageUri || undefined,
    };

    const error = testimonialService.validateTestimonialData(testimonialData);
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setLoading(true);

    try {
      await testimonialService.submitTestimonial(testimonialData);

      Alert.alert('Thank You!', 'Your testimonial has been submitted.', [
        {
          text: 'OK',
          onPress: () => {
            setFormData({
              name: '',
              about: '',
              review: '',
              rating: 5,
            });
            setImageUri(null);
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => (
    <View className="flex-row gap-1 mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setFormData({ ...formData, rating: star })}
        >
          <Ionicons
            name={star <= formData.rating ? 'star' : 'star-outline'}
            size={24}
            color={star <= formData.rating ? '#fbbf24' : starInactive}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <DashboardWrapper title="Share feedback">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className={`flex-1 ${bgColor}`}>
          <KeyboardAwareScrollView
            enableOnAndroid
            extraScrollHeight={200}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            <View className="px-5 pt-8">
              {/* Header */}
              <View className="items-center mb-8">
                <View className="w-14 h-14 bg-blue-500/10 rounded-full items-center justify-center mb-4">
                  <Ionicons
                    name="chatbubble-outline"
                    size={28}
                    color="#3b82f6"
                  />
                </View>
                <Text className={`${textPrimary} text-2xl font-semibold`}>
                  Share your experience
                </Text>
                <Text className={`${textSecondary} text-sm mt-2 text-center`}>
                  Help us improve Medora by sharing how it has helped you manage your healthcare journey.
                </Text>
              </View>

              {/* Avatar */}
              <View className="items-center mb-8">
                <TouchableOpacity onPress={handleImagePick}>
                  <View className={`w-20 h-20 rounded-full overflow-hidden ${avatarBg} items-center justify-center`}>
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        className="w-full h-full"
                      />
                    ) : (
                      <Ionicons
                        name="person-outline"
                        size={32}
                        color={iconColor}
                      />
                    )}
                  </View>
                </TouchableOpacity>

                {imageUri && (
                  <TouchableOpacity
                    onPress={removeImage}
                    className="mt-2"
                  >
                    <Text className={`${removeText} text-xs`}>
                      Remove photo
                    </Text>
                  </TouchableOpacity>
                )}

                <Text className={`${textTertiary} text-xs mt-2`}>
                  Add photo (optional)
                </Text>
              </View>

              {/* Form */}
              <View className="gap-5 pb-10">
                {/* Name */}
                <View>
                  <Text className={`${textSecondary} text-xs mb-1`}>
                    Name
                  </Text>
                  <TextInput
                    ref={nameInputRef}
                    className={`${inputBg} ${textPrimary} px-4 py-4 rounded-xl border ${borderColor}`}
                    placeholder="John Doe"
                    placeholderTextColor={placeholderColor}
                    value={formData.name}
                    onChangeText={(t) =>
                      setFormData({ ...formData, name: t })
                    }
                    returnKeyType="next"
                    onSubmitEditing={() => roleInputRef.current?.focus()}
                  />
                </View>

                {/* Role */}
                <View>
                  <Text className={`${textSecondary} text-xs mb-1`}>
                    Role
                  </Text>
                  <TextInput
                    ref={roleInputRef}
                    className={`${inputBg} ${textPrimary} px-4 py-4 rounded-xl border ${borderColor}`}
                    placeholder="Patient / Doctor"
                    placeholderTextColor={placeholderColor}
                    value={formData.about}
                    onChangeText={(t) =>
                      setFormData({ ...formData, about: t })
                    }
                    returnKeyType="next"
                    onSubmitEditing={() => reviewInputRef.current?.focus()}
                  />
                </View>

                {/* Review */}
                <View>
                  <Text className={`${textSecondary} text-xs mb-1`}>
                    Review
                  </Text>
                  <TextInput
                    ref={reviewInputRef}
                    className={`${inputBg} ${textPrimary} px-4 py-4 rounded-xl border ${borderColor}`}
                    placeholder="Share your experience..."
                    placeholderTextColor={placeholderColor}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={formData.review}
                    onChangeText={(t) =>
                      setFormData({ ...formData, review: t })
                    }
                  />
                </View>

                {/* Rating */}
                <View>
                  <Text className={`${textSecondary} text-xs mb-1`}>
                    Rating
                  </Text>
                  {renderStars()}
                </View>

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  className={`bg-blue-600 py-3 rounded-xl mt-4 flex-row justify-center items-center ${
                    loading ? 'opacity-50' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator color="white" />
                      <Text className="text-white ml-2">
                        Submitting...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="send-outline"
                        size={18}
                        color="white"
                      />
                      <Text className="text-white ml-2">
                        Submit
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text className={`opacity-50 text-center text-xs font-medium ${textPrimary}`}>
                  Your feedback helps us improve Medora for everyone.
                </Text>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>
    </DashboardWrapper>
  );
}