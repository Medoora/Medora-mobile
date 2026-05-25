import { useAppTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = 300;

interface Conversation {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface BotSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  conversations?: Conversation[];
  currentConversationId?: string | null;
  onSelectConversation?: (conversation: Conversation) => void;
  onNewConversation?: () => void;
  onDeleteConversation?: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
}

export default function BotSidebar({
  isVisible,
  onClose,
  conversations = [],
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
}: BotSidebarProps) {
  const { isDark } = useAppTheme();
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Theme-aware colors
  const bgColor = isDark ? '#0a0a0a' : '#f5f5f5';
  const borderColor = isDark ? 'border-neutral-800' : 'border-gray-200';
  const headerBorder = isDark ? 'border-neutral-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-500' : 'text-gray-500';
  const textTertiary = isDark ? 'text-neutral-600' : 'text-gray-400';
  const iconColor = isDark ? '#a1a1aa' : '#6b7280';
  const buttonBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  const activeBg = isDark ? 'bg-neutral-800' : 'bg-gray-300';
  const editBg = isDark ? 'bg-neutral-700' : 'bg-gray-300';
  const emptyIconBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  const emptyIconColor = isDark ? '#4b5563' : '#9ca3af';
  const overlayBg = isDark ? 'bg-black/50' : 'bg-black/30';

  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameConversation?.(id, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeleteConversation?.(id);
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View className={`flex-1 ${overlayBg}`}>
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={handleClose} />
        
        <Animated.View
          style={{
            transform: [{ translateX: slideAnim }],
            width: SIDEBAR_WIDTH,
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: bgColor,
            borderLeftWidth: 1,
            borderLeftColor: isDark ? '#262626' : '#e5e5e5',
          }}
        >
          <SafeAreaView className="flex-1">
            {/* Header */}
            <View className={`px-4 pt-4 pb-3 border-b ${headerBorder}`}>
              <View className="flex-row justify-between items-center">
                <View className='flex-row items-center'>
                  <Image
                    source={require("@/assets/logo/meditalk.png")}
                    className='w-10 h-10'
                  />
                  <Text className={`text-lg font-semibold ml-1 ${textPrimary}`}>Meditalk</Text> 
                </View>
                <TouchableOpacity 
                  onPress={handleClose} 
                  className={`w-8 h-8 items-center justify-center rounded-full ${buttonBg}`}
                >
                  <Ionicons name="close" size={18} color={iconColor} />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Chat Button */}
            <TouchableOpacity
              onPress={() => {
                onNewConversation?.();
                handleClose();
              }}
              className="flex-row items-center gap-2 mx-4 mt-4 p-3 bg-blue-600 rounded-xl active:bg-blue-700"
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white text-sm font-medium">New Chat</Text>
            </TouchableOpacity>

            {/* Conversations List */}
            <ScrollView 
              className="flex-1 px-3 mt-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {conversations.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  onPress={() => {
                    onSelectConversation?.(conv);
                    handleClose();
                  }}
                  className={`p-3 rounded-xl mb-1 ${
                    currentConversationId === conv.id ? activeBg : ''
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      {editingId === conv.id ? (
                        <TextInput
                          value={editingTitle}
                          onChangeText={setEditingTitle}
                          onBlur={() => handleRename(conv.id)}
                          onSubmitEditing={() => handleRename(conv.id)}
                          autoFocus
                          className={`text-sm ${editBg} rounded-lg px-2 py-1 ${textPrimary}`}
                        />
                      ) : (
                        <Text className={`text-sm font-medium ${textPrimary}`} numberOfLines={1}>
                          {conv.title}
                        </Text>
                      )}
                      <Text className={`${textSecondary} text-xs mt-1`}>
                        {formatDate(conv.updatedAt)}
                      </Text>
                    </View>
                    
                    <View className="flex-row gap-1 ml-2">
                      <TouchableOpacity
                        onPress={() => {
                          setEditingId(conv.id);
                          setEditingTitle(conv.title);
                        }}
                        className="p-1.5 rounded-full active:opacity-70"
                      >
                        <Ionicons name="pencil-outline" size={14} color={iconColor} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(conv.id, conv.title)}
                        className="p-1.5 rounded-full active:opacity-70"
                      >
                        <Ionicons name="trash-outline" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              
              {conversations.length === 0 && (
                <View className="items-center py-12">
                  <View className={`w-16 h-16 ${emptyIconBg} rounded-full items-center justify-center mb-3`}>
                    <Ionicons name="chatbubbles-outline" size={28} color={emptyIconColor} />
                  </View>
                  <Text className={`${textSecondary} text-sm text-center`}>
                    No conversations
                  </Text>
                  <Text className={`${textTertiary} text-xs text-center mt-1`}>
                    Start a new chat to begin
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}