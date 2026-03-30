import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../config';

// types of chat
export interface ChatMessageMetadata {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
  processingTime?: number;
  feedback?: 'positive' | 'negative' | null;
}

export interface ChatSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  model: string;
  summary?: string;
}

export interface ChatHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  role?: 'user' | 'assistant';
  model?: string;
  limit?: number;
  orderBy?: 'asc' | 'desc';
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessageMetadata[];
  createdAt: Date;
  updatedAt: Date;
}

class ChatHistoryService {
  private getChatCollection(userId: string) {
    return collection(db, 'users', userId, 'chatHistory');
  }

  private getSessionsCollection(userId: string) {
    return collection(db, 'users', userId, 'chatSessions');
  }

  private getConversationsCollection(userId: string) {
    return collection(db, 'users', userId, 'conversations');
  }

  // ========== CONVERSATION MANAGEMENT ==========

  /**
   * Create a new conversation
   */
// In chat/service.ts

async createConversation(userId: string, title?: string): Promise<string> {
  try {
    // Generate a unique ID
    const conversationId = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const convRef = doc(this.getConversationsCollection(userId), conversationId);
    
    await setDoc(convRef, {
      id: conversationId,
      title: title || 'New Chat',
      messages: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    console.log('Conversation created with ID:', conversationId);
    return conversationId;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}
  /**
   * Get a specific conversation by ID
   */
  async getConversation(userId: string, conversationId: string): Promise<Conversation | null> {
    try {
      const convRef = doc(this.getConversationsCollection(userId), conversationId);
      const convDoc = await getDoc(convRef);
      
      if (convDoc.exists()) {
        const data = convDoc.data();
        return {
          id: convDoc.id,
          title: data.title,
          messages: (data.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate() || new Date(),
          })),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const convRef = this.getConversationsCollection(userId);
      const q = query(convRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const conversations: Conversation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          title: data.title,
          messages: (data.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate() || new Date(),
          })),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      
      return conversations;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  /**
   * Update a conversation with new messages
   */
 // In chat/service.ts
async updateConversation(
  userId: string, 
  conversationId: string, 
  messages: ChatMessageMetadata[],
  title?: string
): Promise<void> {
  try {
    const convRef = doc(this.getConversationsCollection(userId), conversationId);
    
    // First check if document exists
    const convDoc = await getDoc(convRef);
    
    const updateData: any = {
      messages: messages.map(msg => ({
        ...msg,
        timestamp: Timestamp.fromDate(msg.timestamp),
      })),
      updatedAt: Timestamp.now(),
    };
    
    if (title) {
      updateData.title = title;
    } else if (messages.length > 0 && messages[0].content) {
      updateData.title = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '');
    }
    
    if (convDoc.exists()) {
      // Update existing document
      await updateDoc(convRef, updateData);
    } else {
      // Create new document with initial data
      await setDoc(convRef, {
        id: conversationId,
        title: updateData.title || 'New Chat',
        messages: updateData.messages,
        createdAt: Timestamp.now(),
        updatedAt: updateData.updatedAt,
      });
    }
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
}
  /**
   * Add a single message to a conversation
   */
  async addMessageToConversation(
    userId: string,
    conversationId: string,
    message: Omit<ChatMessageMetadata, 'id'>
  ): Promise<void> {
    try {
      const conv = await this.getConversation(userId, conversationId);
      if (!conv) {
        throw new Error('Conversation not found');
      }
      
      const newMessage: ChatMessageMetadata = {
        ...message,
        id: Date.now().toString(),
      };
      
      const updatedMessages = [...conv.messages, newMessage];
      await this.updateConversation(userId, conversationId, updatedMessages);
    } catch (error) {
      console.error('Error adding message to conversation:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    try {
      const convRef = doc(this.getConversationsCollection(userId), conversationId);
      await deleteDoc(convRef);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Rename a conversation
   */
  async renameConversation(userId: string, conversationId: string, newTitle: string): Promise<void> {
    try {
      const convRef = doc(this.getConversationsCollection(userId), conversationId);
      await updateDoc(convRef, {
        title: newTitle,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error renaming conversation:', error);
      throw error;
    }
  }

  // ========== EXISTING CHAT METHODS ==========

  /**
   * Save a single chat message
   */
  async saveMessage(
    userId: string, 
    message: Omit<ChatMessageMetadata, 'id' | 'timestamp'>
  ): Promise<string> {
    try {
      const chatRef = this.getChatCollection(userId);
      const docRef = await addDoc(chatRef, {
        ...message,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      
      await this.incrementSessionMessageCount(userId, message.model || 'default');
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }
  }

  /**
   * Save multiple messages in a batch (for conversation pairs)
   */
  async saveMessageBatch(
    userId: string,
    messages: Array<Omit<ChatMessageMetadata, 'id' | 'timestamp'>>
  ): Promise<string[]> {
    try {
      const batch = writeBatch(db);
      const chatRef = this.getChatCollection(userId);
      const ids: string[] = [];

      messages.forEach(message => {
        const docRef = doc(chatRef);
        batch.set(docRef, {
          ...message,
          timestamp: Timestamp.now(),
          createdAt: Timestamp.now()
        });
        ids.push(docRef.id);
      });

      await batch.commit();
      
      if (messages.length > 0) {
        await this.incrementSessionMessageCount(
          userId, 
          messages[0].model || 'default',
          messages.length
        );
      }

      return ids;
    } catch (error) {
      console.error('Error saving message batch:', error);
      throw error;
    }
  }

  /**
   * Save a conversation pair (user message + assistant response)
   */
  async saveConversation(
    userId: string,
    userMessage: string,
    assistantMessage: string,
    metadata: {
      model: string;
      tokens?: number;
      processingTime?: number;
    }
  ): Promise<{ userId: string; assistantId: string }> {
    try {
      const batch = writeBatch(db);
      const chatRef = this.getChatCollection(userId);
      const timestamp = Timestamp.now();

      // Save user message
      const userDocRef = doc(chatRef);
      batch.set(userDocRef, {
        role: 'user',
        content: userMessage,
        model: metadata.model,
        timestamp,
        createdAt: timestamp,
        metadata: {
          tokens: metadata.tokens,
          processingTime: metadata.processingTime
        }
      });

      // Save assistant message
      const assistantDocRef = doc(chatRef);
      batch.set(assistantDocRef, {
        role: 'assistant',
        content: assistantMessage,
        model: metadata.model,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
        metadata: {
          tokens: metadata.tokens,
          processingTime: metadata.processingTime
        }
      });

      await batch.commit();

      await this.incrementSessionMessageCount(userId, metadata.model, 2);

      return {
        userId: userDocRef.id,
        assistantId: assistantDocRef.id
      };
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  /**
   * Get chat history for a user with filters
   */
  async getChatHistory(
    userId: string,
    filters: ChatHistoryFilters = {}
  ): Promise<ChatMessageMetadata[]> {
    try {
      let constraints = [];

      if (filters.startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters.endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
      }
      if (filters.role) {
        constraints.push(where('role', '==', filters.role));
      }
      if (filters.model) {
        constraints.push(where('model', '==', filters.model));
      }

      constraints.push(orderBy('timestamp', filters.orderBy === 'asc' ? 'asc' : 'desc'));

      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      const q = query(this.getChatCollection(userId), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as ChatMessageMetadata[];
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * Get today's chat history
   */
  async getTodayChatHistory(userId: string): Promise<ChatMessageMetadata[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    try {
      const q = query(
        this.getChatCollection(userId),
        where('timestamp', '>=', Timestamp.fromDate(today)),
        where('timestamp', '<', Timestamp.fromDate(tomorrow)),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as ChatMessageMetadata[];
    } catch (error) {
      console.error('Error getting today chat history:', error);
      throw error;
    }
  }

  /**
   * Get recent chat messages (last N messages)
   */
  async getRecentMessages(
    userId: string, 
    messageCount: number = 50
  ): Promise<ChatMessageMetadata[]> {
    try {
      const q = query(
        this.getChatCollection(userId),
        orderBy('timestamp', 'desc'),
        limit(messageCount)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }))
        .reverse() as ChatMessageMetadata[];
    } catch (error) {
      console.error('Error getting recent messages:', error);
      throw error;
    }
  }

  /**
   * Start a new chat session
   */
  async startSession(userId: string, model: string): Promise<string> {
    try {
      const sessionsRef = this.getSessionsCollection(userId);
      const docRef = await addDoc(sessionsRef, {
        startTime: Timestamp.now(),
        messageCount: 0,
        model,
        status: 'active',
        createdAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error starting chat session:', error);
      throw error;
    }
  }

  /**
   * End a chat session
   */
  async endSession(userId: string, sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(this.getSessionsCollection(userId), sessionId);
      await updateDoc(sessionRef, {
        endTime: Timestamp.now(),
        status: 'completed'
      });
    } catch (error) {
      console.error('Error ending chat session:', error);
      throw error;
    }
  }

  /**
   * Increment message count for current session
   */
  private async incrementSessionMessageCount(
    userId: string, 
    model: string,
    count: number = 1
  ): Promise<void> {
    try {
      const sessionsRef = this.getSessionsCollection(userId);
      const q = query(
        sessionsRef,
        where('status', '==', 'active'),
        orderBy('startTime', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        const sessionRef = doc(sessionsRef, sessionDoc.id);
        const currentCount = sessionDoc.data().messageCount || 0;
        await updateDoc(sessionRef, {
          messageCount: currentCount + count
        });
      } else {
        await addDoc(sessionsRef, {
          startTime: Timestamp.now(),
          messageCount: count,
          model,
          status: 'active',
          createdAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error incrementing session count:', error);
    }
  }

  /**
   * Add feedback to a message
   */
  async addFeedback(
    userId: string, 
    messageId: string, 
    feedback: 'positive' | 'negative'
  ): Promise<void> {
    try {
      const messageRef = doc(this.getChatCollection(userId), messageId);
      await updateDoc(messageRef, {
        feedback,
        feedbackTime: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding feedback:', error);
      throw error;
    }
  }

  /**
   * Delete chat history (with optional date range)
   */
  async deleteHistory(
    userId: string, 
    filters: { before?: Date; after?: Date } = {}
  ): Promise<void> {
    try {
      let constraints = [];

      if (filters.before) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.before)));
      }
      if (filters.after) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.after)));
      }

      const q = query(this.getChatCollection(userId), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting chat history:', error);
      throw error;
    }
  }

  /**
   * Get chat statistics
   */
  async getChatStats(userId: string): Promise<{
    totalMessages: number;
    totalSessions: number;
    averageResponseTime?: number;
    topModels: Array<{ model: string; count: number }>;
  }> {
    try {
      const messagesRef = this.getChatCollection(userId);
      const messagesSnapshot = await getDocs(messagesRef);
      const totalMessages = messagesSnapshot.size;

      const sessionsRef = this.getSessionsCollection(userId);
      const sessionsSnapshot = await getDocs(sessionsRef);
      const totalSessions = sessionsSnapshot.size;

      const modelCount: Record<string, number> = {};
      messagesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.model) {
          modelCount[data.model] = (modelCount[data.model] || 0) + 1;
        }
      });

      const topModels = Object.entries(modelCount)
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalMessages,
        totalSessions,
        topModels
      };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      throw error;
    }
  }
}

export const chatHistoryService = new ChatHistoryService();