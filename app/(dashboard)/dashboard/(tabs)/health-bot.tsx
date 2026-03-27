import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import ChatMessage from '@/components/bot/message/chat-message';
import { useChatHistory } from '@/hooks/meditalk/use-chathistory';
import { LinearGradient } from 'expo-linear-gradient';

export default function HealthBotScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isSending, setIsSending] = useState(false);

  const { saveConversation, loadRecentMessages } = useChatHistory();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ FIX: scroll when keyboard opens
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', scrollToBottom);
    return () => showSub.remove();
  }, []);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      try {
        const history = await loadRecentMessages(30, 'asc');
        const formatted = history.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content
        }));
        setMessages(formatted);
      } catch (error) {
        console.error('Error loading history:', error);
      }
    };
    loadHistory();
  }, [user]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !user || isSending) return;

    const userText = input.trim();
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsSending(true);

    const assistantId = (Date.now() + 1).toString();

    try {
      const apiMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          userId: user.uid,
          model: 'gpt-4o'
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantText = data.text || 'No response';

      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: assistantText
        }
      ]);

      await saveConversation(userText, assistantText, {
        model: 'gpt-4o',
        processingTime: 0,
        tokens: Math.ceil((userText.length + assistantText.length) / 4)
      });

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsSending(false);
    }
  }, [input, user, messages, isSending]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // ✅ FIX
      style={{ flex: 1, backgroundColor: 'black' }}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} // ✅ FIX
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <Text style={{ color: '#6b7280', marginBottom: 10, textAlign: 'center' }}>
            👋 Welcome to Meditalk
          </Text>
        )}

        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            <View
              style={{
                backgroundColor: '#1f1f1f',
                padding: 12,
                borderRadius: 16,
                alignSelf: 'flex-start'
              }}
            >
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          </View>
        )}
      </ScrollView>
      <LinearGradient
  colors={['black', 'transparent']}
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    pointerEvents: 'none',
  }}
/>
<LinearGradient
  colors={['transparent', 'black']}
  style={{
    position: 'absolute',
    bottom: 70, // sits above input bar
    left: 0,
    right: 0,
    height: 60,
    pointerEvents: 'none',
  }}
/>

      {/* Input Bar */}
      <View
        style={{
          padding: 12,
          borderTopColor: '#1f1f1f',
          backgroundColor: 'black',
          paddingBottom: 0 || 20 // ✅ FIX
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#191919',
            borderRadius: 30,
            paddingHorizontal: 16,
            paddingVertical: 6
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={user ? "Message Meditalk..." : "Login required"}
            placeholderTextColor="#666"
            multiline
            style={{
              flex: 1,
              color: 'white',
              paddingVertical: 10,
              maxHeight: 100,
              fontSize: 16
            }}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isLoading || isSending}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: input.trim() && !isLoading ? 'white' : '#2a2a2a'
            }}
          >
            <Ionicons
              name="arrow-up"
              size={16}
              color={input.trim() && !isLoading ? 'black' : '#666'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}