import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import ChatMessage from '@/components/bot/message/chat-message';

export default function HealthBotScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Simple simulation response
  const getSimulatedResponse = (userMessage: string): string => {
    const responses = [
      `I understand you're asking about "${userMessage.slice(0, 40)}". Let me help you with that.`,
      `Based on your medical records, I can assist you with this.`,
      `Great question! Let me look into that for you.`,
      `I'll help you with your medical information. Give me a moment.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    // Simulate API delay
    setTimeout(() => {
      const response = getSimulatedResponse(userMsg.content);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantId ? { ...msg, content: response } : msg
        )
      );
      setIsLoading(false);
    }, 800);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 90}
      

    >
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        
        {isLoading && (
          <View className="flex-row justify-start mb-4">
            <View className="bg-neutral-800 rounded-2xl px-4 py-2">
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View className="px-3  bg-black  border-neutral-800" style={{ paddingBottom: 0 || 12 }}>
        <View className="flex-row items-center gap-2 bg-neutral-900 rounded-full px-4 py-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={user ? "Message..." : "Please log in"}
            placeholderTextColor="#6b7280"
            multiline
            className="flex-1 text-white  text-base py-2 max-h-24"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            className={`w-8 h-8 rounded-full items-center justify-center ${
              input.trim() ? 'bg-white' : 'bg-neutral-700'
            }`}
          >
            <Ionicons
              name="arrow-up"
              size={16}
              color={input.trim() ? 'black' : '#6b7280'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}