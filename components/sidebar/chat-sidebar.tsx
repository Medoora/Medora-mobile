import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { 
  Animated, 
  Dimensions, 
  Modal, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView,
  TextInput,
  Alert
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
  currentConversationId?: string;
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
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current; // Start from right
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

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
          onPress: () => onDeleteConversation?.(id),
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
      <View className="flex-1 bg-black/50">
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={handleClose} />
        
        <Animated.View
          style={{
            transform: [{ translateX: slideAnim }],
            width: SIDEBAR_WIDTH,
            position: 'absolute',
            right: 0, // Position from right side
            top: 0,
            bottom: 0,
            backgroundColor: '#0a0a0a',
            borderLeftWidth: 1, // Border on left instead of right
            borderLeftColor: '#262626',
          }}
        >
          <SafeAreaView className="flex-1">
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-neutral-800">
              <Text className="text-white text-base font-medium">Chat History</Text>
              <TouchableOpacity 
                onPress={handleClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-neutral-800"
              >
                <Ionicons name="close" size={18} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            {/* New Chat Button */}
            <TouchableOpacity
              onPress={() => {
                onNewConversation?.();
                handleClose();
              }}
              className="flex-row items-center gap-2 mx-4 mt-4 p-3 bg-blue-600 rounded-xl"
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white text-sm font-medium">New Chat</Text>
            </TouchableOpacity>

            {/* Conversations List */}
            <ScrollView 
              className="flex-1 px-3 mt-4"
              showsVerticalScrollIndicator={false}
            >
              {conversations.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  onPress={() => {
                    onSelectConversation?.(conv);
                    handleClose();
                  }}
                  className={`p-3 rounded-xl mb-1 ${
                    currentConversationId === conv.id ? 'bg-neutral-800' : ''
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
                          className="text-white text-sm bg-neutral-700 rounded-lg px-2 py-1"
                        />
                      ) : (
                        <Text className="text-white text-sm font-medium" numberOfLines={1}>
                          {conv.title}
                        </Text>
                      )}
                      <Text className="text-neutral-500 text-xs mt-1">
                        {formatDate(conv.updatedAt)}
                      </Text>
                    </View>
                    
                    <View className="flex-row gap-1 ml-2">
                      <TouchableOpacity
                        onPress={() => {
                          setEditingId(conv.id);
                          setEditingTitle(conv.title);
                        }}
                        className="p-1.5 rounded-full"
                      >
                        <Ionicons name="pencil-outline" size={14} color="#737373" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(conv.id, conv.title)}
                        className="p-1.5 rounded-full"
                      >
                        <Ionicons name="trash-outline" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              
              {conversations.length === 0 && (
                <View className="items-center py-12">
                  <View className="w-16 h-16 bg-neutral-800 rounded-full items-center justify-center mb-3">
                    <Ionicons name="chatbubbles-outline" size={28} color="#4b5563" />
                  </View>
                  <Text className="text-neutral-500 text-sm text-center">
                    No conversations
                  </Text>
                  <Text className="text-neutral-600 text-xs text-center mt-1">
                    Start a new chat
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