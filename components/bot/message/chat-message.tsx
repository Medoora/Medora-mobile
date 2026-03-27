import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
}

export default function ChatMessage({ message, onDownloadPDF }: ChatMessageProps) {
  const isUser = message.role === 'user';

 const formatTime = (date?: string | Date) => {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

  return (
    <View className={`flex-row mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser ? 'bg-blue-600' : 'bg-neutral-800'
        }`}
      >
        {isUser ? (
          <Text className="text-white text-base leading-5">{message.content}</Text>
        ) : (
          <>
            <Markdown
              style={{
                body: { color: '#e5e5e5', fontSize: 15, lineHeight: 22 },
                heading1: { color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
                heading2: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
                heading3: { color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 8, marginBottom: 3 },
                paragraph: { marginBottom: 8 },
                list_item: { marginVertical: 2 },
                code_block: { 
                  backgroundColor: '#1e1e1e', 
                  padding: 10, 
                  borderRadius: 8,
                  marginVertical: 8,
                },
                code_inline: { 
                  backgroundColor: '#1e1e1e', 
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  fontSize: 13,
                },
                table: { borderWidth: 1, borderColor: '#404040', marginVertical: 8 },
                th: { 
                  borderWidth: 1, 
                  borderColor: '#404040', 
                  padding: 8, 
                  backgroundColor: '#2d2d2d',
                  fontWeight: 'bold',
                },
                td: { borderWidth: 1, borderColor: '#404040', padding: 8 },
                blockquote: {
                  borderLeftWidth: 3,
                  borderLeftColor: '#3b82f6',
                  paddingLeft: 12,
                  marginVertical: 8,
                  color: '#9ca3af',
                },
              }}
            >
              {message.content}
            </Markdown>
            
            {/* Download button - subtle and minimal */}
            {onDownloadPDF && (
              <TouchableOpacity
                onPress={() => onDownloadPDF(message)}
                className="absolute -bottom-6 right-0 bg-neutral-700/50 rounded-full p-1"
              >
                <Ionicons name="download-outline" size={12} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </>
        )}
        
        {/* Timestamp */}
        <Text
          className={`text-[10px] mt-1.5 ${isUser ? 'text-blue-200/70' : 'text-neutral-500'}`}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}