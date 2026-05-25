import { toggleDocumentStarred, trashDocument } from '@/config/firebase/services/dashboard/documents';
import { useAppTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height } = Dimensions.get('window');

interface FileDetailsModalProps {
  visible: boolean;
  file: any;
  onClose: () => void;
  onUpdate: () => void;
}

export default function FileDetailsModal({
  visible,
  file,
  onClose,
  onUpdate,
}: FileDetailsModalProps) {
  const { isDark } = useAppTheme();
  const [isStarring, setIsStarring] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const sheetHeight = height * 0.9;
  const slideAnim = useRef(new Animated.Value(sheetHeight)).current;

  // Theme-aware colors
  const modalBg = isDark ? 'bg-neutral-900' : 'bg-white';
  const borderColor = isDark ? 'border-neutral-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-400' : 'text-gray-500';
  const textTertiary = isDark ? 'text-neutral-500' : 'text-gray-400';
  const iconColor = isDark ? '#a1a1aa' : '#6b7280';
  const cardBg = isDark ? 'bg-neutral-800' : 'bg-gray-100';
  const cardText = isDark ? 'text-neutral-400' : 'text-gray-500';
  const buttonBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  const buttonText = isDark ? 'text-red-500' : 'text-red-600';
  const starColor = isDark ? '#fbbf24' : '#eab308';
  const starInactive = isDark ? '#737373' : '#9ca3af';
  const overlayBg = isDark ? 'bg-black/70' : 'bg-black/50';

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: sheetHeight,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!file) return null;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleStarToggle = async () => {
    setIsStarring(true);
    try {
      await toggleDocumentStarred(file.id, !file.isStarred);
      onUpdate();
    } catch (error) {
      console.error('Error toggling star:', error);
    } finally {
      setIsStarring(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${file.documentName}\n${file.categoryLabel}\n${formatDate(
          file.uploadedAt
        )}`,
        url: file.cloudinary?.url,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = async () => {
    if (!file.cloudinary?.url) return;

    setIsDownloading(true);
    try {
      const fileName = file.documentName.replace(/\s+/g, '_');
      const downloadUri = FileSystem.Paths.document + fileName;

      const { uri } = await FileSystem.downloadAsync(
        file.cloudinary.url,
        downloadUri
      );

      Alert.alert('Success', `File downloaded to: ${uri}`);
    } catch (error) {
      console.error('Error downloading:', error);
      Alert.alert('Error', 'Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMoveToTrash = async () => {
    Alert.alert(
      'Move to Trash',
      'This file will be moved to trash. You can restore it within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              await trashDocument(file.id);
              onUpdate();
              handleClose();
            } catch (error) {
              console.error('Error moving to trash:', error);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: sheetHeight,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View className={`flex-1 ${overlayBg} justify-end`}>
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            height: sheetHeight,
          }}
          className={`rounded-t-3xl ${modalBg}`}
        >
          {/* Header */}
          <View className={`flex-row justify-between items-center px-5 pt-5 pb-4 border-b ${borderColor}`}>
            <TouchableOpacity onPress={handleClose} className="p-2 -ml-2">
              <Ionicons name="close" size={24} color={iconColor} />
            </TouchableOpacity>

            <Text className={`${textPrimary} text-base font-medium`}>
              File Details
            </Text>

            <TouchableOpacity onPress={handleShare} className="p-2">
              <Ionicons name="share-outline" size={22} color={iconColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{
              paddingBottom: 40,
            }}
          >
            {/* Thumbnail */}
            <View className="items-center py-6">
              {file.cloudinary?.thumbnailUrl || file.cloudinary?.url ? (
                <Image
                  source={{
                    uri: file.cloudinary?.thumbnailUrl || file.cloudinary?.url,
                  }}
                  className="w-64 h-64 rounded-2xl"
                  resizeMode="contain"
                />
              ) : (
                <View className="w-32 h-32 bg-blue-500/10 rounded-2xl items-center justify-center">
                  <Ionicons
                    name="document-text-outline"
                    size={48}
                    color="#3b82f6"
                  />
                </View>
              )}
            </View>

            <View className="px-5">
              {/* File Info */}
              <View className="flex-row items-start justify-between mb-6">
                <View className="flex-1 mr-4">
                  <Text className={`${textPrimary} text-xl font-semibold`}>
                    {file.documentName}
                  </Text>
                  <Text className={`${textSecondary} text-sm mt-1`}>
                    {formatFileSize(file.cloudinary?.bytes || 0)} •{' '}
                    {formatDate(file.uploadedAt)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleStarToggle}
                  disabled={isStarring}
                  className="p-2"
                >
                  <Ionicons
                    name={file.isStarred ? 'star' : 'star-outline'}
                    size={24}
                    color={file.isStarred ? starColor : starInactive}
                  />
                </TouchableOpacity>
              </View>

              {/* Info Cards */}
              <View className="flex-row gap-3 mb-6">
                <View className={`flex-1 ${cardBg} rounded-xl p-3`}>
                  <Ionicons name="folder-outline" size={18} color="#737373" />
                  <Text className={`${cardText} text-xs mt-2`}>Category</Text>
                  <Text className={`${textPrimary} text-sm font-medium mt-1`}>
                    {file.categoryLabel}
                  </Text>
                </View>

                <View className={`flex-1 ${cardBg} rounded-xl p-3`}>
                  <Ionicons name="calendar-outline" size={18} color="#737373" />
                  <Text className={`${cardText} text-xs mt-2`}>Uploaded</Text>
                  <Text
                    className={`${textPrimary} text-sm font-medium mt-1`}
                    numberOfLines={1}
                  >
                    {formatDate(file.uploadedAt)}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View className="gap-3 mb-4">
                <TouchableOpacity
                  onPress={handleDownload}
                  disabled={isDownloading}
                  className="bg-blue-500 py-3 rounded-xl flex-row items-center justify-center gap-2"
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="download-outline" size={20} color="white" />
                      <Text className="text-white font-semibold text-base">
                        Download
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleMoveToTrash}
                  className={`${buttonBg} py-3 rounded-xl flex-row items-center justify-center gap-2`}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text className={`${buttonText} font-semibold text-base`}>
                    Move to Trash
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}