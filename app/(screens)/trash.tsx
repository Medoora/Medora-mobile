import DashboardWrapper from '@/components/wrapper/dashboard-wrapper';
import { getTrashedDocuments, permanentlyDeleteDocument, restoreDocument } from '@/config/firebase/services/documents';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Custom Dialog Component
const CustomDialog = ({ visible, title, message, onConfirm, onCancel, loading, confirmText = 'Delete', confirmColor = '#ef4444' }: any) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View className="flex-1 bg-black/70 justify-center items-center px-6">
      <View className="bg-neutral-900 rounded-2xl w-full max-w-sm p-6">
        <Text className="text-white text-lg font-semibold mb-2">{title}</Text>
        <Text className="text-neutral-400 text-sm mb-6">{message}</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onCancel}
            className="flex-1 py-3 rounded-xl bg-neutral-800"
          >
            <Text className="text-neutral-400 text-center font-medium">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl ${loading ? 'bg-red-500/50' : 'bg-red-500'}`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-center font-medium">{confirmText}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// Custom Restore Dialog
const RestoreDialog = ({ visible, title, message, onConfirm, onCancel, loading }: any) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View className="flex-1 bg-black/70 justify-center items-center px-6">
      <View className="bg-neutral-900 rounded-2xl w-full max-w-sm p-6">
        <Text className="text-white text-lg font-semibold mb-2">{title}</Text>
        <Text className="text-neutral-400 text-sm mb-6">{message}</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onCancel}
            className="flex-1 py-3 rounded-xl bg-neutral-800"
          >
            <Text className="text-neutral-400 text-center font-medium">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl ${loading ? 'bg-blue-500/50' : 'bg-blue-500'}`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-center font-medium">Restore</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default function TrashScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedFiles, setDeletedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [restoreDialogVisible, setRestoreDialogVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();

  // Fetch trashed documents from Firebase
  const fetchTrashedDocuments = useCallback(async (showLoading = true) => {
    if (!user?.uid) return;
    
    try {
      if (showLoading) setLoading(true);
      const trashed = await getTrashedDocuments(user.uid);
      setDeletedFiles(trashed);
    } catch (error) {
      console.error('Error fetching trashed documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTrashedDocuments(true);
    }, [fetchTrashedDocuments])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTrashedDocuments(false);
  }, [fetchTrashedDocuments]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleRestore = async (file: any) => {
    setSelectedFile(file);
    setRestoreDialogVisible(true);
  };

  const confirmRestore = async () => {
    if (!selectedFile) return;
    
    setIsRestoring(true);
    try {
      await restoreDocument(selectedFile.id);
      // Immediately remove from local state
      setDeletedFiles(prev => prev.filter(f => f.id !== selectedFile.id));
      setRestoreDialogVisible(false);
      setSelectedFile(null);
      // Show success message
      console.log('File restored successfully');
    } catch (error) {
      console.error('Error restoring file:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePermanentDelete = (file: any) => {
    setSelectedFile(file);
    setDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedFile) return;
    
    setIsDeleting(true);
    try {
      await permanentlyDeleteDocument(selectedFile.id);
      // Immediately remove from local state
      setDeletedFiles(prev => prev.filter(f => f.id !== selectedFile.id));
      setDialogVisible(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = () => {
    if (deletedFiles.length === 0) return;
    setSelectedFile({ all: true, count: deletedFiles.length });
    setDialogVisible(true);
  };

  const confirmDeleteAll = async () => {
    setIsDeleting(true);
    try {
      // Show loading state
      setLoading(true);
      
      // Delete all files
      for (const file of deletedFiles) {
        await permanentlyDeleteDocument(file.id);
      }
      
      // Clear local state
      setDeletedFiles([]);
      setDialogVisible(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error deleting all files:', error);
    } finally {
      setIsDeleting(false);
      setLoading(false);
    }
  };

  const filteredFiles = deletedFiles.filter(file =>
    file.documentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.categoryLabel?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const FileCard = ({ file }: { file: any }) => (
    <View className="flex-row items-center p-4 bg-neutral-900 rounded-xl mb-3 border border-neutral-800">
      <View className="w-10 h-10 bg-red-500/10 rounded-lg items-center justify-center">
        <Ionicons 
          name={file.fileInfo?.fileTypeCategory === 'image' ? 'image-outline' : 'document-text-outline'} 
          size={20} 
          color="#ef4444" 
        />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-white font-medium text-sm" numberOfLines={1}>
          {file.documentName}
        </Text>
        <View className="flex-row items-center mt-1 flex-wrap">
          <Text className="text-neutral-500 text-xs">
            {formatFileSize(file.cloudinary?.bytes || 0)}
          </Text>
          <Text className="text-neutral-600 text-xs mx-1">•</Text>
          <Text className="text-neutral-500 text-xs">
            Deleted {formatDate(file.trashedAt || file.updatedAt)}
          </Text>
          {file.categoryLabel && (
            <>
              <Text className="text-neutral-600 text-xs mx-1">•</Text>
              <Text className="text-neutral-500 text-xs">
                {file.categoryLabel}
              </Text>
            </>
          )}
        </View>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity 
          onPress={() => handleRestore(file)}
          className="bg-neutral-800 px-3 py-2 rounded-lg"
        >
          <Ionicons name="refresh-outline" size={18} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handlePermanentDelete(file)}
          className="bg-neutral-800 px-3 py-2 rounded-lg"
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Skeleton Loader
  const SkeletonLoader = () => (
    <View className="pb-20 px-2 pt-2">
      <View className="bg-neutral-800 rounded-xl h-12 mb-4" />
      <View className="flex-row justify-between items-center mb-4 pb-2">
        <View className="bg-neutral-800 rounded h-5 w-32" />
        <View className="bg-neutral-800 rounded h-8 w-20" />
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} className="flex-row items-center p-4 bg-neutral-800/50 rounded-xl mb-3">
          <View className="w-10 h-10 bg-neutral-700 rounded-lg" />
          <View className="flex-1 ml-3">
            <View className="bg-neutral-700 rounded h-4 w-40 mb-2" />
            <View className="bg-neutral-700 rounded h-3 w-32" />
          </View>
          <View className="w-16 h-8 bg-neutral-700 rounded-lg" />
        </View>
      ))}
    </View>
  );

  // Empty State Component
  const EmptyState = () => (
    <View className="items-center py-16">
      <Ionicons name="trash-outline" size={64} color="#4b5563" />
      <Text className="text-neutral-400 text-lg font-medium mt-4">Trash is empty</Text>
      <Text className="text-neutral-500 text-center mt-2">
        {searchQuery ? 'No matching files found' : 'Deleted files will appear here'}
      </Text>
      <TouchableOpacity 
        onPress={() => router.push('/(dashboard)/dashboard/(tabs)/mydrive')}
        className="mt-6 bg-blue-500 px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-medium">Go to My Drive</Text>
      </TouchableOpacity>
    </View>
  );

  return (
   <DashboardWrapper title='Trash'>
     <>
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        className="flex-1 bg-black"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        <View className="pb-20 min-h-screen px-2 pt-2">
          {/* Search Bar */}
          <View className="flex-row items-center bg-neutral-900 rounded-xl px-4 py-2 mb-4 border border-neutral-800">
            <Ionicons name="search-outline" size={20} color="#737373" />
            <TextInput
              className="flex-1 text-white ml-2 py-2"
              placeholder="Search deleted files..."
              placeholderTextColor="#737373"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#737373" />
              </TouchableOpacity>
            )}
          </View>

          {/* Info Note */}
          {deletedFiles.length > 0 && (
            <View className="flex-row items-center gap-2 py-2 mb-2">
              <Ionicons name="information-circle-outline" size={16} color="#737373" />
              <Text className="text-neutral-500 text-xs flex-1">
                Files in trash are automatically deleted after 30 days
              </Text>
            </View>
          )}

          {/* Loading State - Shows skeleton when loading or during delete/restore actions */}
          {(loading || refreshing || isDeleting || isRestoring) ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* Header with Delete All Button */}
              <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-neutral-800">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text className="text-neutral-400 text-sm">
                    {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'} in trash
                  </Text>
                </View>
                
                {deletedFiles.length > 0 && (
                  <TouchableOpacity 
                    onPress={handleDeleteAll}
                    className="flex-row items-center px-3 py-1.5 rounded-lg bg-red-500/10"
                  >
                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                    <Text className="text-red-500 text-xs ml-1">Delete All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Files List */}
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))
              ) : (
                <EmptyState />
              )}
            </>
          )}
        </View>
      </Animated.ScrollView>

      {/* Custom Delete Dialog */}
      <CustomDialog
        visible={dialogVisible}
        title={selectedFile?.all ? "Delete All Files" : "Permanently Delete"}
        message={selectedFile?.all 
          ? `Are you sure you want to permanently delete all ${selectedFile.count} files? This action cannot be undone.`
          : `Are you sure you want to permanently delete "${selectedFile?.documentName}"? This action cannot be undone.`
        }
        onConfirm={selectedFile?.all ? confirmDeleteAll : confirmDelete}
        onCancel={() => {
          setDialogVisible(false);
          setSelectedFile(null);
        }}
        loading={isDeleting}
        confirmText="Delete"
        confirmColor="#ef4444"
      />

      {/* Custom Restore Dialog */}
      <RestoreDialog
        visible={restoreDialogVisible}
        title="Restore File"
        message={`Are you sure you want to restore "${selectedFile?.documentName}"?`}
        onConfirm={confirmRestore}
        onCancel={() => {
          setRestoreDialogVisible(false);
          setSelectedFile(null);
        }}
        loading={isRestoring}
      />
    </>
   </DashboardWrapper>
  );
}