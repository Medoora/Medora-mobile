import { useAppTheme } from '@/context/theme-context';
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
  const { isDark } = useAppTheme();
  const isUser = message.role === 'user';
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Theme-aware colors
  const userBubbleBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';
  const userTextColor = isDark ? 'text-white' : 'text-black';
  const userTimeColor = isDark ? 'text-white/50' : 'text-black/50';
  
  const assistantTextColor = isDark ? '#e5e5e5' : '#333333';
  const assistantHeadingColor = isDark ? 'white' : '#1f2937';
  const assistantCodeBg = isDark ? '#1e1e1e' : '#f3f4f6';
  const assistantTableBorder = isDark ? '#404040' : '#d1d5d5';
  const assistantThBg = isDark ? '#2d2d2d' : '#e5e7eb';
  const assistantBlockquoteBorder = '#3b82f6';
  const assistantBlockquoteColor = isDark ? '#9ca3af' : '#6b7280';
  
  const timestampColor = isDark ? 'text-neutral-500' : 'text-gray-400';
  const actionIconColor = isDark ? '#9ca3af' : '#6b7280';
  const loadingDotColor = isDark ? 'white' : '#3b82f6';

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
    // User message - simple bubble with theme support
    return (
      <View className="flex-row justify-end mb-4">
        <View className={`${userBubbleBg} rounded-2xl rounded-br-sm px-4 py-2 max-w-[85%]`}>
          <Text className={`${userTextColor} text-base leading-5`}>{message.content}</Text>
          <Text className={`${userTimeColor} text-[10px] mt-1 text-right`}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  }

  // Assistant message - ChatGPT style with theme support
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
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: loadingDotColor }} />
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: loadingDotColor }} />
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: loadingDotColor }} />
          </Animated.View>
        )}

        {/* Message Content */}
        {message.content ? (
          <>
            <Markdown
              style={{
                body: { color: assistantTextColor, fontSize: 15, lineHeight: 24 },
                heading1: { color: assistantHeadingColor, fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
                heading2: { color: assistantHeadingColor, fontSize: 20, fontWeight: 'bold', marginTop: 14, marginBottom: 6 },
                heading3: { color: assistantHeadingColor, fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
                paragraph: { marginBottom: 12 },
                list_item: { marginVertical: 4 },
                code_block: { 
                  backgroundColor: assistantCodeBg, 
                  padding: 12, 
                  borderRadius: 8,
                  marginVertical: 10,
                },
                code_inline: { 
                  backgroundColor: assistantCodeBg, 
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  fontSize: 13,
                },
                table: { borderWidth: 1, borderColor: assistantTableBorder, marginVertical: 12 },
                th: { 
                  borderWidth: 1, 
                  borderColor: assistantTableBorder, 
                  padding: 10, 
                  backgroundColor: assistantThBg,
                  fontWeight: 'bold',
                },
                td: { borderWidth: 1, borderColor: assistantTableBorder, padding: 10 },
                blockquote: {
                  borderLeftWidth: 3,
                  borderLeftColor: assistantBlockquoteBorder,
                  paddingLeft: 14,
                  marginVertical: 10,
                  color: assistantBlockquoteColor,
                },
              }}
            >
              {message.content}
            </Markdown>

            {/* Timestamp */}
            <Text className={`${timestampColor} text-[10px]`}>
              {formatTime(message.timestamp)}
            </Text>

            {/* Action Buttons - Copy & Download */}
            {showActions && (
              <Animated.View style={{ opacity: fadeAnim }} className="flex-row gap-4 mt-2">
                <TouchableOpacity
                  onPress={handleCopy}
                  className="flex-row items-center gap-1 py-1"
                >
                  <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color={actionIconColor} />
                </TouchableOpacity>

                {onDownloadPDF && (
                  <TouchableOpacity
                    onPress={() => onDownloadPDF(message)}
                    className="flex-row items-center gap-1 py-1"
                  >
                    <Ionicons name="download-outline" size={14} color={actionIconColor} />
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