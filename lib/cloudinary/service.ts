import * as FileSystem from 'expo-file-system/legacy';

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  original_filename?: string;
  created_at?: string;
  etag?: string;
  url: string;
  width?: number;
  height?: number;
  thumbnail_url?: string;
  preview_url?: string;
}

interface UploadOptions {
  onProgress?: (progress: number) => void;
  generateThumbnail?: boolean;
  patientId?: string;
  tags?: string[];
  fileType?: string;
}

// Get file extension from URI
const getFileExtension = (uri: string): string => {
  const parts = uri.split('.');
  return parts[parts.length - 1].toLowerCase();
};

// Get MIME type based on file extension
const getMimeType = (uri: string): string => {
  const ext = getFileExtension(uri);
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Check if file is an image
const isImage = (uri: string): boolean => {
  const mimeType = getMimeType(uri);
  return mimeType.startsWith('image/');
};

// Check if file is a PDF
const isPdf = (uri: string): boolean => {
  return getMimeType(uri) === 'application/pdf';
};

export const uploadToCloudinary = async (
  fileUri: string,
  userId: string,
  options?: UploadOptions
): Promise<CloudinaryUploadResponse | null> => {
  const uploadId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    console.log(`[${uploadId}] 🚀 Cloudinary upload started for user: ${userId}`);
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const fileName = fileUri.split('/').pop() || 'file';
    const fileExt = getFileExtension(fileUri);
    const mimeType = getMimeType(fileUri);
    const isImageFile = isImage(fileUri);
    
    console.log(`[${uploadId}] 📄 File details:`, {
      name: fileName,
      //@ts-ignore
      size: `${(fileInfo.size || 0) / 1024} KB`,
      uri: fileUri,
      mimeType,
      isImage: isImageFile
    });

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Create folder structure
    const baseFolder = `medical_documents`;
    const userFolder = `user_${userId}`;
    const patientFolder = options?.patientId ? `patient_${options.patientId}` : '';
    const timestamp = Date.now();
    const sanitizedFileName = fileName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    
    const folderParts = [baseFolder, userFolder];
    if (patientFolder) {
      folderParts.push(patientFolder);
    }
    
    const publicId = `${folderParts.join('/')}/${timestamp}_${sanitizedFileName}`;
    
    // Create form data
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      throw new Error('Missing Cloudinary configuration');
    }
    
    const uploadData = new FormData();
    
    // For images, use data URL; for other files, use file URI
    if (isImageFile) {
      uploadData.append('file', `data:${mimeType};base64,${base64}`);
    } else {
      // For non-images, we need to create a blob
      const blob = await fetch(fileUri).then(res => res.blob());
      uploadData.append('file', blob, fileName);
    }
    
    uploadData.append('upload_preset', uploadPreset);
    uploadData.append('public_id', publicId);
    
    // Add resource type for non-images
    if (!isImageFile) {
      uploadData.append('resource_type', 'raw');
    }
    
    if (options?.tags?.length) {
      uploadData.append('tags', options.tags.join(','));
    }
    
    // Add context
    const contextData = {
      userId: userId,
      patientId: options?.patientId || '',
      uploadedAt: new Date().toISOString(),
      originalName: fileName,
      fileType: mimeType
    };
    uploadData.append('context', JSON.stringify(contextData));
    
    console.log(`[${uploadId}] 📄 Upload configuration:`, {
      publicId,
      folder: folderParts.join('/'),
      resourceType: isImageFile ? 'image' : 'raw'
    });

    // Upload to Cloudinary
    const resourceType = isImageFile ? 'image' : 'raw';
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: uploadData,
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[${uploadId}] 🚀 Cloudinary response received after ${duration}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${uploadId}] ❌ Upload failed:`, errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Generate thumbnail URL for images
    let thumbnailUrl: string | undefined;
    
    if (isImageFile && options?.generateThumbnail) {
      thumbnailUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_200,h_200,c_fill/${publicId}`;
    } else if (isPdf(fileUri)) {
      // For PDFs, generate a preview
      thumbnailUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_200,h_200,c_fill/${publicId}.jpg`;
    }
    
    const enhancedData = {
      ...data,
      thumbnail_url: thumbnailUrl,
      original_filename: fileName,
    };
    
    console.log(`[${uploadId}] ✅ Upload successful!`, {
      publicId: data.public_id,
      size: `${(data.bytes / 1024).toFixed(2)} KB`,
      format: data.format || fileExt
    });
    
    if (options?.onProgress) {
      options.onProgress(100);
    }

    return enhancedData;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${uploadId}] ❌ Cloudinary upload error:`, error);
    return null;
  }
};

// Get optimized thumbnail
export const getThumbnailUrl = (
  publicId: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): string => {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const sizes = {
    small: { width: 100, height: 100 },
    medium: { width: 200, height: 200 },
    large: { width: 400, height: 400 }
  };
  
  const { width, height: h } = sizes[size];
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${h},c_fill/${publicId}`;
};

// Extract file info
export const extractFileInfo = (cloudinaryResponse: CloudinaryUploadResponse) => {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return {
    publicId: cloudinaryResponse.public_id,
    url: cloudinaryResponse.secure_url,
    thumbnailUrl: cloudinaryResponse.thumbnail_url || 
      `https://res.cloudinary.com/${cloudName}/image/upload/w_200,h_200,c_fill/${cloudinaryResponse.public_id}`,
    format: cloudinaryResponse.format || 'unknown',
    bytes: cloudinaryResponse.bytes,
    originalFilename: cloudinaryResponse.original_filename || 'file',
    width: cloudinaryResponse.width,
    height: cloudinaryResponse.height,
  };
};