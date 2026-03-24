
import * as Crypto from 'expo-crypto';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { Alert } from 'react-native';
import { db } from '../../config';

export interface ShareSettings {
  isPublic: boolean;
  shareableLink?: string;
  shareId?: string;
  accessLevel: 'view' | 'download' | 'edit' | 'restricted';
  expiresAt?: Timestamp | null;
  password?: string | null;
  requirePassword: boolean;
  sharedWith: SharedUser[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  viewCount: number;
  downloadCount: number;
}

export interface SharedUser {
  email: string;
  accessLevel: 'view' | 'download' | 'edit';
  sharedAt: Timestamp;
}

export interface DocumentMetadata {
  id?: string;
  userId: string;
  userEmail?: string;
  patientId?: string | null;
  documentName: string;
  documentDate: string;
  category: string;
  categoryLabel: string;
  description?: string;
  tags: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    fileTypeCategory: string;
  };
  cloudinary: {
    publicId: string;
    url: string;
    thumbnailUrl?: string;
    format: string;
    bytes: number;
    originalFilename: string;
  };
  uploadedAt: Timestamp;
  updatedAt: Timestamp;
  isStarred: boolean;
  starredAt?: Timestamp;
  isTrashed: boolean;
  trashedAt?: Timestamp;
  shareSettings?: ShareSettings;
}

// Generate unique share ID
const generateShareId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Save document metadata to Firestore
export const saveDocumentMetadata = async (documentData: any): Promise<string> => {
  try {
    console.log('🔍 [DEBUG] saveDocumentMetadata received:', {
      hasIsStarred: 'isStarred' in documentData,
      isStarredValue: documentData.isStarred,
      documentName: documentData.documentName
    });

    const documentsCollection = collection(db, 'documents');
    
    const docData = {
      ...documentData,
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isStarred: documentData.isStarred === true,
      isTrashed: false,
    };

    const docRef = await addDoc(documentsCollection, docData);
    console.log('✅ Document saved with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving document metadata:', error);
    throw error;
  }
};

// Get all documents for a user
export const getUserDocuments = async (userId: string, options?: {
  includeTrashed?: boolean;
  starredOnly?: boolean;
  category?: string;
  patientId?: string;
}) => {
  try {
    const documentsCollection = collection(db, 'documents');
    let constraints: any[] = [where('userId', '==', userId)];
    
    if (options?.includeTrashed) {
      constraints.push(where('isTrashed', '==', true));
    } else {
      constraints.push(where('isTrashed', '==', false));
    }
    
    if (options?.starredOnly) {
      constraints.push(where('isStarred', '==', true));
    }
    
    if (options?.category) {
      constraints.push(where('category', '==', options.category));
    }
    
    if (options?.patientId) {
      constraints.push(where('patientId', '==', options.patientId));
    }
    
    constraints.push(orderBy('uploadedAt', 'desc'));
    
    const q = query(documentsCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user documents:', error);
    throw error;
  }
};

// Get document by ID
export const getDocumentById = async (documentId: string) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

// Toggle star status
export const toggleDocumentStarred = async (documentId: string, starred: boolean) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      isStarred: starred,
      starredAt: starred ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling starred:', error);
    throw error;
  }
};

// Get starred documents
export const getStarredDocuments = async (userId: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('userId', '==', userId),
      where('isTrashed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((doc: any) => doc.isStarred === true);
    
    return docs.sort((a: any, b: any) => {
      if (!a.starredAt) return 1;
      if (!b.starredAt) return -1;
      return b.starredAt.seconds - a.starredAt.seconds;
    });
  } catch (error) {
    console.error('Error getting starred documents:', error);
    throw error;
  }
};

// Create share link
export const createShareLink = async (
  fileId: string,
  options: {
    accessLevel: 'view' | 'download' | 'edit' | 'restricted';
    expiresAt?: Date | null;
    requirePassword?: boolean;
    password?: string;
    sharedWith?: { email: string; accessLevel: 'view' | 'download' | 'edit' }[];
  }
) => {
  try {
    const shareId = generateShareId();
    const shareableLink = `${shareId}`; // Return just the ID, app will construct full URL
    
    const docRef = doc(db, 'documents', fileId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    
    const documentData = docSnap.data();
    
    // Update original document with share settings
    const shareSettings = {
      shareId,
      shareableLink: `${shareId}`,
      accessLevel: options.accessLevel,
      expiresAt: options.expiresAt ? Timestamp.fromDate(options.expiresAt) : null,
      password: options.requirePassword ? options.password : null,
      requirePassword: options.requirePassword || false,
      sharedWith: options.sharedWith?.map(user => ({
        ...user,
        sharedAt: Timestamp.now()
      })) || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      viewCount: 0,
      downloadCount: 0,
      isPublic: options.accessLevel !== 'restricted'
    };
    
    await updateDoc(docRef, {
      shareSettings,
      updatedAt: Timestamp.now()
    });
    
    // Create public document in 'shares' collection
    const sharesCollection = collection(db, 'shares');
    await addDoc(sharesCollection, {
      fileId,
      shareId,
      shareableLink,
      accessLevel: options.accessLevel,
      expiresAt: options.expiresAt ? Timestamp.fromDate(options.expiresAt) : null,
      requirePassword: options.requirePassword || false,
      hasPassword: !!options.password,
      sharedWith: options.sharedWith?.map(u => u.email) || [],
      createdAt: Timestamp.now(),
      documentName: documentData.documentName,
      description: documentData.description,
      userEmail: documentData.userEmail,
      uploadedAt: documentData.uploadedAt,
      cloudinary: {
        url: documentData.cloudinary.url,
        thumbnailUrl: documentData.cloudinary.thumbnailUrl,
        format: documentData.cloudinary.format,
        bytes: documentData.cloudinary.bytes
      },
      category: documentData.category,
      categoryLabel: documentData.categoryLabel
    });
    
    return shareableLink;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
};

// Get document by share ID
export const getDocumentByShareId = async (shareId: string) => {
  try {
    const sharesCollection = collection(db, 'shares');
    const q = query(sharesCollection, where('shareId', '==', shareId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const shareData = querySnapshot.docs[0].data();
    
    // Check if share link has expired
    if (shareData.expiresAt) {
      const expiresAt = shareData.expiresAt.toDate();
      const now = new Date();
      if (expiresAt < now) {
        return { error: 'Share link has expired', code: 'EXPIRED' };
      }
    }
    
    return {
      id: shareData.fileId,
      documentName: shareData.documentName,
      description: shareData.description,
      userEmail: shareData.userEmail,
      uploadedAt: shareData.uploadedAt,
      cloudinary: shareData.cloudinary,
      shareSettings: {
        accessLevel: shareData.accessLevel,
        requirePassword: shareData.requirePassword,
        expiresAt: shareData.expiresAt,
        shareId: shareData.shareId,
      },
      category: shareData.category,
      categoryLabel: shareData.categoryLabel
    };
  } catch (error) {
    console.error('Error getting document by share ID:', error);
    throw error;
  }
};

// Track share view
export const trackShareView = async (shareId: string) => {
  try {
    const sharesCollection = collection(db, 'shares');
    const q = query(sharesCollection, where('shareId', '==', shareId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const shareDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'shares', shareDoc.id), {
        viewCount: increment(1)
      });
    }
  } catch (error) {
    console.error('Error tracking view:', error);
  }
};

// Track share download
export const trackShareDownload = async (shareId: string) => {
  try {
    const sharesCollection = collection(db, 'shares');
    const q = query(sharesCollection, where('shareId', '==', shareId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const shareDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'shares', shareDoc.id), {
        downloadCount: increment(1)
      });
    }
  } catch (error) {
    console.error('Error tracking download:', error);
  }
};

// Soft delete (move to trash)
export const trashDocument = async (documentId: string) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      isTrashed: true,
      trashedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error trashing document:', error);
    throw error;
  }
};

// Restore from trash
export const restoreDocument = async (documentId: string) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      isTrashed: false,
      trashedAt: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error restoring document:', error);
    throw error;
  }
};

// Permanently delete document
export const permanentlyDeleteDocument = async (documentId: string) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      Alert.alert('Error', 'Document not found');
      return;
    }
    
    const data = docSnap.data();
    const publicId = data.cloudinary?.publicId;
    
    // Delete from Cloudinary directly
    if (publicId) {
      try {
        const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
        const apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;
        
        if (!cloudName || !apiKey || !apiSecret) {
          console.error('Cloudinary credentials missing');
        } else {
          // Generate timestamp and signature
          const timestamp = Math.floor(Date.now() / 1000);
          
          // Create signature string
          const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
          
          // Generate SHA256 signature using Expo Crypto
          const signature = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            signatureString
          );
          
          console.log('Attempting to delete from Cloudinary:', publicId);
          
          // Call Cloudinary destroy API
          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              public_id: publicId,
              api_key: apiKey,
              timestamp: timestamp,
              signature: signature,
            }),
          });
          
          const result = await response.json();
          console.log('Cloudinary deletion result:', result);
          
          if (result.result === 'ok') {
            console.log('✅ Successfully deleted from Cloudinary');
          } else {
            console.error('❌ Cloudinary deletion failed:', result);
          }
        }
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        // Don't throw - we still want to delete from Firestore
      }
    }
    
    // Delete from Firestore
    await deleteDoc(docRef);
    console.log('✅ Document deleted from Firestore');
    
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Get trashed documents
export const getTrashedDocuments = async (userId: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('userId', '==', userId),
      where('isTrashed', '==', true),
      orderBy('trashedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting trashed documents:', error);
    throw error;
  }
};

// Search documents
export const searchDocuments = async (userId: string, searchTerm: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('userId', '==', userId),
      where('isTrashed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const searchLower = searchTerm.toLowerCase();
    return documents.filter((doc: any) => 
      doc.documentName?.toLowerCase().includes(searchLower) ||
      doc.categoryLabel?.toLowerCase().includes(searchLower) ||
      doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
      doc.description?.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

// Get recent uploads
export const getRecentUploads = async (userId: string, limitCount: number = 10) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('userId', '==', userId),
      where('isTrashed', '==', false),
      orderBy('uploadedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return documents.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting recent uploads:', error);
    throw error;
  }
};

// Get document statistics
export const getDocumentStatistics = async (userId: string) => {
  try {
    const documentsCollection = collection(db, 'documents');
    const q = query(
      documentsCollection,
      where('userId', '==', userId),
      where('isTrashed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => doc.data());
    
    return {
      totalDocuments: documents.length,
      starredDocuments: documents.filter(doc => doc.isStarred).length,
      totalSize: documents.reduce((acc, doc) => acc + (doc.cloudinary?.bytes || 0), 0),
      categories: documents.reduce((acc: any, doc) => {
        acc[doc.categoryLabel] = (acc[doc.categoryLabel] || 0) + 1;
        return acc;
      }, {}),
    };
  } catch (error) {
    console.error('Error getting document statistics:', error);
    throw error;
  }
};