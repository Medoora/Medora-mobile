import { View, Text, Animated, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';

export default function TrashScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedFiles, setDeletedFiles] = useState([
    { id: 1, name: 'MRI_Scan_2024.pdf', size: '2.4 MB', deletedAt: '2024-03-20', icon: 'document-text' },
    { id: 2, name: 'CT_Scan_Results.pdf', size: '1.8 MB', deletedAt: '2024-03-19', icon: 'document-text' },
    { id: 3, name: 'XRay_Image_001.dcm', size: '5.2 MB', deletedAt: '2024-03-18', icon: 'image' },
    { id: 4, name: 'Ultrasound_Report.pdf', size: '0.9 MB', deletedAt: '2024-03-15', icon: 'document-text' },
    { id: 5, name: 'MRI_Sequence_002.dcm', size: '8.1 MB', deletedAt: '2024-03-14', icon: 'image' },
  ]);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleRestore = (id: number) => {
    Alert.alert(
      'Restore File',
      'Are you sure you want to restore this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restore', 
          onPress: () => {
            setDeletedFiles(deletedFiles.filter(file => file.id !== id));
            Alert.alert('Success', 'File restored successfully');
          }
        }
      ]
    );
  };

  const handleDeleteAll = () => {
    if (deletedFiles.length === 0) return;
    
    Alert.alert(
      'Delete All',
      `Are you sure you want to permanently delete all ${deletedFiles.length} files? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: () => {
            setDeletedFiles([]);
            Alert.alert('Success', 'All files deleted permanently');
          }
        }
      ]
    );
  };

  const filteredFiles = deletedFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const FileCard = ({ file }: { file: any }) => (
    <View className="flex-row items-center p-4 bg-neutral-900 rounded-xl mb-3 border border-neutral-800">
      <View className="w-10 h-10 bg-red-500/10 rounded-lg items-center justify-center">
        <Ionicons name={file.icon === 'image' ? 'image-outline' : 'document-text-outline'} size={20} color="#ef4444" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-white font-medium text-sm" numberOfLines={1}>{file.name}</Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-neutral-500 text-xs">{file.size}</Text>
          <Text className="text-neutral-600 text-xs mx-1">•</Text>
          <Text className="text-neutral-500 text-xs">Deleted {file.deletedAt}</Text>
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => handleRestore(file.id)}
        className="bg-neutral-800 px-3 py-2 rounded-lg"
      >
        <Ionicons name="refresh-outline" size={18} color="#3b82f6" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.ScrollView 
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      className="flex-1 bg-black"
    >
      <View className="pb-20 h-screen px-2 pt-2">
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
           {deletedFiles.length > 0 && (
        
            <View className="flex-row items-center gap-2 py-2 mb-5">
              <Ionicons name="information-circle-outline" size={16} color="#737373" />
              <Text className="text-neutral-500 text-xs flex-1">
                Files in trash are automatically deleted after 30 days
              </Text>
            </View>
          
        )}
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
          <View className="items-center py-16">
            <Ionicons name="trash-outline" size={64} color="#4b5563" />
            <Text className="text-neutral-400 text-lg font-medium mt-4">Trash is empty</Text>
            <Text className="text-neutral-500 text-center mt-2">
              {searchQuery ? 'No matching files found' : 'Deleted files will appear here'}
            </Text>
          </View>
        )}

        {/* Info Note */}
       
      </View>
    </Animated.ScrollView>
  );
}