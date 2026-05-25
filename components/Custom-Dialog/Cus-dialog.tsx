import { useAppTheme } from '@/context/theme-context';
import React from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';

interface CustomDialogBoxProps {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  actionButtonName?: string;
  cancelButtonName?: string;
  actionButtonColor?: 'red' | 'blue' | 'green';
}

const CustomDialogBox = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  actionButtonName,
  cancelButtonName,
  actionButtonColor = 'red'
}: CustomDialogBoxProps) => {
  const { isDark } = useAppTheme();

  // Theme-aware colors
  const bgColor = isDark ? 'bg-neutral-900' : 'bg-white';
  const overlayBg = isDark ? 'bg-black/70' : 'bg-black/50';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-400' : 'text-gray-500';
  const cancelButtonBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  const cancelButtonText = isDark ? 'text-neutral-400' : 'text-gray-600';

  // Action button colors
  const getActionButtonColor = () => {
    if (loading) return 'bg-blue-500/50';
    switch (actionButtonColor) {
      case 'red':
        return 'bg-red-500';
      case 'green':
        return 'bg-green-500';
      case 'blue':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className={`flex-1 ${overlayBg} justify-center items-center px-6`}>
        <View className={`${bgColor} rounded-2xl w-full max-w-sm p-6`}>
          <Text className={`${textPrimary} text-lg font-semibold mb-2`}>
            {title}
          </Text>
          <Text className={`${textSecondary} text-sm mb-6`}>
            {message}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className={`flex-1 py-3 rounded-xl ${cancelButtonBg}`}
            >
              <Text className={`${cancelButtonText} text-center font-medium`}>
                {cancelButtonName || "Cancel"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className={`flex-1 py-3 rounded-xl ${getActionButtonColor()}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-center font-medium">
                  {actionButtonName || "Confirm"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomDialogBox;