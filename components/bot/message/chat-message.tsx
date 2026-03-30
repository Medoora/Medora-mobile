import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  onDownloadPDF?: (message: Message) => void;
  isStreaming?: boolean;
}

export default function ChatMessage({ message, onDownloadPDF, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for streaming/loading state
    if (isStreaming && !isUser) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    // Show actions with fade animation when streaming completes
    if (!isUser && !isStreaming && message.content) {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        setShowActions(true);
      }, 500);
    } else if (isStreaming) {
      setShowActions(false);
      fadeAnim.setValue(0);
    }
  }, [isStreaming, message.content]);

  const formatTime = (date?: string | Date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    // User message - simple bubble
    return (
      <View className="flex-row justify-end mb-4">
        <View className="bg-neutral-800 rounded-2xl rounded-br-sm px-4 py-2 max-w-[85%]">
          <Text className="text-white text-base leading-5">{message.content}</Text>
          <Text className="text-blue-200/60 text-[10px] mt-1 text-right">
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  }

  // Assistant message - ChatGPT style
  return (
    <View className="flex-row justify-start mb-6">
      {/* Avatar */}
      <View className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-1">
        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#3b82f6" />
      </View>

      {/* Content */}
      <View className="flex-1">
        {/* Loading Pulse Animation */}
        {isStreaming && !message.content && (
          <Animated.View 
            style={{ opacity: pulseAnim }}
            className="flex-row items-center gap-1 mt-4"
          >
            <View className="w-2 h-2 bg-white rounded-full" />
            <View className="w-2 h-2 bg-white rounded-full" />
            <View className="w-2 h-2 bg-white rounded-full" />
           
          </Animated.View>
        )}

        {/* Message Content */}
        {message.content ? (
          <>
            <Markdown
              style={{
                body: { color: '#e5e5e5', fontSize: 15, lineHeight: 24 },
                heading1: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
                heading2: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 14, marginBottom: 6 },
                heading3: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
                paragraph: { marginBottom: 12 },
                list_item: { marginVertical: 4 },
                code_block: { 
                  backgroundColor: '#1e1e1e', 
                  padding: 12, 
                  borderRadius: 8,
                  marginVertical: 10,
                },
                code_inline: { 
                  backgroundColor: '#1e1e1e', 
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  fontSize: 13,
                },
                table: { borderWidth: 1, borderColor: '#404040', marginVertical: 12 },
                th: { 
                  borderWidth: 1, 
                  borderColor: '#404040', 
                  padding: 10, 
                  backgroundColor: '#2d2d2d',
                  fontWeight: 'bold',
                },
                td: { borderWidth: 1, borderColor: '#404040', padding: 10 },
                blockquote: {
                  borderLeftWidth: 3,
                  borderLeftColor: '#3b82f6',
                  paddingLeft: 14,
                  marginVertical: 10,
                  color: '#9ca3af',
                },
              }}
            >
              {message.content}
            </Markdown>

            {/* Timestamp */}
            <Text className="text-neutral-500 text-[10px]">
              {formatTime(message.timestamp)}
            </Text>

            {/* Action Buttons - Copy & Download */}
            {showActions && (
              <Animated.View style={{ opacity: fadeAnim }} className="flex-row gap-4 mt-2">
                <TouchableOpacity
                  onPress={handleCopy}
                  className="flex-row items-center gap-1 py-1"
                >
                  <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color="#9ca3af" />
                 
                </TouchableOpacity>

                {onDownloadPDF && (
                  <TouchableOpacity
                    onPress={() => onDownloadPDF(message)}
                    className="flex-row items-center gap-1 py-1"
                  >
                    <Ionicons name="download-outline" size={14} color="#9ca3af" />
                   
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
}