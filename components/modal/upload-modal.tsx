import { saveDocumentMetadata } from "@/config/firebase/services/documents";
import { useAuth } from '@/context/auth-context';
import { extractFileInfo, uploadToCloudinary } from '@/lib/cloudinary/service';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface UploadModalProps {
  visible: boolean; 
  onClose: () => void;
  onUpload?: (type: string, data: any) => void;
  onUploadSuccess?: (document: any) => void;
}

const DOCUMENT_CATEGORIES = [
  // Scan/Imaging Categories
  { value: 'xray', label: 'X-Ray', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'mri', label: 'MRI (Magnetic Resonance Imaging)', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'ct', label: 'CT Scan (Computed Tomography)', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'ultrasound', label: 'Ultrasound', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'mammogram', label: 'Mammogram', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'pet', label: 'PET Scan', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'nuclear', label: 'Nuclear Medicine Scan', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'fluoroscopy', label: 'Fluoroscopy', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'angiogram', label: 'Angiogram', group: 'Scan Reports', fileTypes: ['image'] },
  { value: 'bone_density', label: 'Bone Density Scan (DEXA)', group: 'Scan Reports', fileTypes: ['image'] },
  
  // Document Categories
  { value: 'prescription', label: 'Prescription', group: 'Documents', fileTypes: ['image', 'pdf'] },
  { value: 'lab_report', label: 'Lab Report', group: 'Documents', fileTypes: ['image', 'pdf', 'document'] },
  { value: 'pathology', label: 'Pathology Report', group: 'Documents', fileTypes: ['image', 'pdf', 'document'] },
  { value: 'discharge_summary', label: 'Discharge Summary', group: 'Documents', fileTypes: ['pdf', 'document'] },
  { value: 'operation_note', label: 'Operation Note', group: 'Documents', fileTypes: ['pdf', 'document'] },
  { value: 'consultation', label: 'Consultation Note', group: 'Documents', fileTypes: ['pdf', 'document'] },
  { value: 'vaccination', label: 'Vaccination Record', group: 'Documents', fileTypes: ['image', 'pdf'] },
  { value: 'insurance', label: 'Insurance Document', group: 'Documents', fileTypes: ['image', 'pdf'] },
  { value: 'identification', label: 'Identification Document', group: 'Documents', fileTypes: ['image', 'pdf'] },
  { value: 'other', label: 'Other Medical Document', group: 'Documents', fileTypes: ['image', 'pdf', 'document', 'spreadsheet', 'text'] },
];

export default function UploadModal({ visible, onClose, onUpload, onUploadSuccess }: UploadModalProps) {
  const [uploadType, setUploadType] = React.useState('file');
  const [fileName, setFileName] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [isStarred, setIsStarred] = React.useState(false);
  const [tags, setTags] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [showCamera, setShowCamera] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<{ uri: string; name: string; type: string; size?: number } | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const modalSlideAnim = React.useRef(new Animated.Value(height)).current;
  const { user } = useAuth();
  
  React.useEffect(() => {
    if (visible) {
      Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalSlideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setShowCamera(false);
      setSelectedFile(null);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      resetForm();
      setShowCamera(false);
      setSelectedFile(null);
    });
  };

  const resetForm = () => {
    setUploadType('file');
    setFileName('');
    setSelectedCategory('');
    setIsStarred(false);
    setTags('');
    setDescription('');
    setIsDropdownOpen(false);
  };

const handleFilePick = async () => {
  try {
    // Show action sheet to choose between Photos and Files
    Alert.alert(
      'Select Source',
      'Choose where to pick your file from',
      [
        {
          text: '📸 Photos Library',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All, // Use MediaTypeOptions instead of MediaType
                allowsEditing: true,
                quality: 1,
                allowsMultipleSelection: false,
              });

              if (!result.canceled) {
                const selected = result.assets[0];
                setSelectedFile({
                  uri: selected.uri,
                  name: selected.fileName || `image_${Date.now()}.jpg`,
                  type: selected.mimeType || 'image/jpeg',
                  size: selected.fileSize,
                });
                
                if (!fileName) {
                  setFileName(selected.fileName || `image_${Date.now()}.jpg`);
                }
              }
            } catch (error) {
              console.error('Photo pick error:', error);
              Alert.alert('Error', 'Failed to pick from photos');
            }
          },
        },
        {
          text: '📄 Files (PDF, DOC, XLS, etc.)',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: [
                  'application/pdf',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'text/plain',
                ],
                copyToCacheDirectory: true,
              });

              if (result.canceled === false) {
                const selected = result.assets[0];
                setSelectedFile({
                  uri: selected.uri,
                  name: selected.name,
                  type: selected.mimeType || 'application/octet-stream',
                  size: selected.size,
                });
                
                if (!fileName) {
                  setFileName(selected.name);
                }
              }
            } catch (error) {
              console.error('File pick error:', error);
              Alert.alert('Error', 'Failed to pick file');
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  } catch (error) {
    console.error('File pick error:', error);
    Alert.alert('Error', 'Failed to pick file');
  }
};

  const handleCameraOpen = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }
    }
    
    if (!mediaPermission?.granted) {
      const permission = await requestMediaPermission();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Media library permission is needed to save photos');
        return;
      }
    }
    
    setShowCamera(true);
  };

  const handleTakePicture = async (cameraRef: any) => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        setSelectedFile({
          uri: photo.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
        setShowCamera(false);
        
        if (!fileName) {
          setFileName(`photo_${Date.now()}.jpg`);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file first');
      return;
    }
    
    if (!selectedCategory) {
      Alert.alert('Missing Info', 'Please select document type');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(selectedFile.uri, user.uid, {
        generateThumbnail: true,
        patientId: user.uid,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        onProgress: (progress) => setUploadProgress(progress),
        fileType: selectedFile.type,
      });

      if (!cloudinaryResponse) {
        throw new Error('Cloudinary upload failed');
      }

      const fileInfo = extractFileInfo(cloudinaryResponse);
      const selectedCategoryData = DOCUMENT_CATEGORIES.find(cat => cat.value === selectedCategory);

      // Save metadata to Firebase
      const documentData = {
        userId: user.uid,
        userEmail: user.email,
        patientId: user.uid,
        documentName: fileName || selectedCategoryData?.label || 'Untitled',
        documentDate: new Date().toISOString().split('T')[0],
        category: selectedCategory,
        categoryLabel: selectedCategoryData?.label || '',
        description: description,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        fileInfo: {
          name: selectedFile.name,
          size: selectedFile.size || fileInfo.bytes,
          type: selectedFile.type,
          fileTypeCategory: selectedCategoryData?.group === 'Scan Reports' ? 'image' : 'document'
        },
        cloudinary: {
          publicId: fileInfo.publicId,
          url: fileInfo.url,
          thumbnailUrl: fileInfo.thumbnailUrl,
          format: fileInfo.format,
          bytes: fileInfo.bytes,
          originalFilename: fileInfo.originalFilename
        },
        isStarred: isStarred
      };

      const documentId = await saveDocumentMetadata(documentData);
      
      if (onUpload) {
        onUpload(uploadType, {
          uri: selectedFile.uri,
          fileName: fileName || selectedFile.name,
          type: selectedFile.type,
          category: selectedCategory,
          categoryLabel: selectedCategoryData?.label,
          group: selectedCategoryData?.group,
          isStarred,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          description,
        });
      }
      
      if (onUploadSuccess) {
        onUploadSuccess({ id: documentId, ...documentData });
      }
      
      Alert.alert('Success', 'File uploaded successfully!');
      handleClose();
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileName('');
  };

  const getGroupedCategories = () => {
    const groups: { [key: string]: typeof DOCUMENT_CATEGORIES } = {};
    DOCUMENT_CATEGORIES.forEach(cat => {
      if (!groups[cat.group]) {
        groups[cat.group] = [];
      }
      groups[cat.group].push(cat);
    });
    return groups;
  };

  const selectedCategoryData = DOCUMENT_CATEGORIES.find(cat => cat.value === selectedCategory);

  // Camera View
  if (showCamera) {
    let cameraRef: any = null;
    
    return (
      <Modal
        transparent={false}
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View className="flex-1 bg-black">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            ref={(ref) => { cameraRef = ref; }}
          >
            <View className="flex-1 bg-transparent">
              <View className="flex-row justify-between items-center p-5 pt-12">
                <TouchableOpacity onPress={() => setShowCamera(false)}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold">Take Photo</Text>
                <View style={{ width: 28 }} />
              </View>
              
              <View className="absolute bottom-10 left-0 right-0 flex-row justify-center items-center gap-8">
                <TouchableOpacity
                  onPress={() => handleTakePicture(cameraRef)}
                  className="w-20 h-20 rounded-full bg-white/30 items-center justify-center"
                >
                  <View className="w-16 h-16 rounded-full bg-white" />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/70">
        <TouchableOpacity 
          className="flex-1" 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <Animated.View 
          style={{
            transform: [{ translateY: modalSlideAnim }],
            maxHeight: height * 0.9,
          }}
          className="bg-neutral-900 rounded-t-3xl"
        >
          <View className="flex-row justify-between items-center p-5 border-b border-neutral-800">
            <Text className="text-white text-xl font-semibold">Upload Medical File</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            className="p-5"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Upload Type Selection */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                onPress={() => setUploadType('file')}
                className={`flex-1 py-3 rounded-xl items-center ${
                  uploadType === 'file' ? 'bg-blue-500' : 'bg-neutral-800'
                }`}
              >
                <Ionicons name="document-outline" size={24} color="white" />
                <Text className="text-white text-sm mt-1">File</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleCameraOpen}
                className={`flex-1 py-3 rounded-xl items-center ${
                  uploadType === 'camera' ? 'bg-blue-500' : 'bg-neutral-800'
                }`}
              >
                <Ionicons name="camera-outline" size={24} color="white" />
                <Text className="text-white text-sm mt-1">Camera</Text>
              </TouchableOpacity>
            </View>

            {/* File Preview Section */}
            {selectedFile ? (
              <View className="mb-5">
                <Text className="text-neutral-400 text-sm mb-2">Selected File</Text>
                <View className="relative bg-neutral-800 rounded-xl p-4 flex-row items-center">
                  <Ionicons 
                    name={selectedFile.type?.startsWith('image/') ? "image-outline" : "document-text-outline"} 
                    size={32} 
                    color="#3b82f6" 
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium" numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text className="text-neutral-400 text-xs">
                      {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'Unknown size'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={removeSelectedFile}
                    className="bg-black/50 rounded-full p-2"
                  >
                    <Ionicons name="close" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={uploadType === 'file' ? handleFilePick : handleCameraOpen}
                className="mb-5 bg-neutral-800 rounded-xl p-8 items-center justify-center border border-neutral-700 border-dashed"
              >
                <Ionicons 
                  name={uploadType === 'file' ? "cloud-upload-outline" : "camera-outline"} 
                  size={48} 
                  color="#737373" 
                />
                <Text className="text-neutral-400 mt-2 text-center">
                  {uploadType === 'file' ? 'Tap to select a file' : 'Tap to take a photo'}
                </Text>
                <Text className="text-neutral-500 text-xs mt-1">
                  {uploadType === 'file' ? 'Supports images, PDFs, Word, Excel, and more' : 'Take a photo of your medical document'}
                </Text>
              </TouchableOpacity>
            )}

            {/* File Name Input */}
            <View className="mb-5">
              <Text className="text-neutral-400 text-sm mb-2">File Name</Text>
              <TextInput
                className="bg-neutral-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter file name"
                placeholderTextColor="#737373"
                value={fileName}
                onChangeText={setFileName}
              />
            </View>

            {/* Document Type Dropdown */}
            <View className="mb-5">
              <Text className="text-neutral-400 text-sm mb-2">Document Type</Text>
              <Pressable
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-neutral-800 rounded-xl px-4 py-3 flex-row justify-between items-center"
              >
                <Text className={selectedCategory ? 'text-white' : 'text-neutral-500'}>
                  {selectedCategoryData?.label || 'Select document type'}
                </Text>
                <Ionicons 
                  name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#737373" 
                />
              </Pressable>

              {isDropdownOpen && (
                <View className="bg-neutral-800 rounded-xl mt-2 max-h-80">
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {Object.entries(getGroupedCategories()).map(([group, categories]) => (
                      <View key={group}>
                        <Text className="text-neutral-500 text-xs uppercase px-4 pt-3 pb-1">
                          {group}
                        </Text>
                        {categories.map((category) => (
                          <TouchableOpacity
                            key={category.value}
                            onPress={() => {
                              setSelectedCategory(category.value);
                              setIsDropdownOpen(false);
                            }}
                            className={`px-4 py-3 ${
                              selectedCategory === category.value ? 'bg-blue-500/20' : ''
                            }`}
                          >
                            <Text className={`text-sm ${
                              selectedCategory === category.value ? 'text-blue-500' : 'text-white'
                            }`}>
                              {category.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Star Option */}
            <TouchableOpacity
              onPress={() => setIsStarred(!isStarred)}
              className="flex-row items-center gap-3 mb-5 p-3 bg-neutral-800 rounded-xl"
            >
              <Ionicons 
                name={isStarred ? "star" : "star-outline"} 
                size={22} 
                color={isStarred ? "#fbbf24" : "#737373"} 
              />
              <Text className="text-white flex-1">Star this file</Text>
              {isStarred && (
                <Text className="text-neutral-400 text-xs">Important</Text>
              )}
            </TouchableOpacity>

            {/* Tags Input */}
            <View className="mb-5">
              <Text className="text-neutral-400 text-sm mb-2">Tags (comma separated)</Text>
              <TextInput
                className="bg-neutral-800 rounded-xl px-4 py-3 text-white"
                placeholder="e.g., urgent, follow-up, cardiology"
                placeholderTextColor="#737373"
                value={tags}
                onChangeText={setTags}
              />
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-neutral-400 text-sm mb-2">Description (Optional)</Text>
              <TextInput
                className="bg-neutral-800 rounded-xl px-4 py-3 text-white"
                placeholder="Add description..."
                placeholderTextColor="#737373"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Upload Progress */}
            {isUploading && (
              <View className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-neutral-400 text-sm">Uploading to Cloud...</Text>
                  <Text className="text-blue-500 text-sm">{Math.round(uploadProgress)}%</Text>
                </View>
                <View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <View className="h-full bg-blue-500 rounded-full" style={{ width: `${uploadProgress}%` }} />
                </View>
              </View>
            )}

            {/* Upload Button */}
            <TouchableOpacity
              onPress={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`py-4 rounded-xl mb-3 ${selectedFile && !isUploading ? 'bg-blue-500' : 'bg-neutral-700'}`}
            >
              {isUploading ? (
                <View className="flex-row items-center justify-center gap-2">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white text-center font-semibold text-base">
                    Uploading...
                  </Text>
                </View>
              ) : (
                <Text className={`text-center font-semibold text-base ${selectedFile ? 'text-white' : 'text-neutral-500'}`}>
                  Upload to Cloud
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={handleClose}
              className="py-3 rounded-xl mb-4"
              disabled={isUploading}
            >
              <Text className="text-neutral-400 text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}