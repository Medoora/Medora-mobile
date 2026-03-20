import { View, Text, Animated, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';

export default function MyDriveScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, images, documents, other
  const [sortBy, setSortBy] = useState('date'); // date, name, size
  const scrollY = useRef(new Animated.Value(0)).current;

  // Mock data for files
  const [files] = useState([
    { id: 1, name: 'MRI_Scan_2024.pdf', type: 'document', size: '2.4 MB', date: '2024-03-20', icon: 'document-text' },
    { id: 2, name: 'CT_Scan_Results.pdf', type: 'document', size: '1.8 MB', date: '2024-03-18', icon: 'document-text' },
    { id: 3, name: 'XRay_Image_001.dcm', type: 'image', size: '5.2 MB', date: '2024-03-15', icon: 'image' },
    { id: 4, name: 'Ultrasound_Report.pdf', type: 'document', size: '0.9 MB', date: '2024-03-12', icon: 'document-text' },
    { id: 5, name: 'MRI_Sequence_002.dcm', type: 'image', size: '8.1 MB', date: '2024-03-10', icon: 'image' },
    { id: 6, name: 'Patient_Data_Export.zip', type: 'other', size: '12.3 MB', date: '2024-03-05', icon: 'archive' },
  ]);

  const filterOptions = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'images', label: 'Images', icon: 'image-outline' },
    { id: 'documents', label: 'Documents', icon: 'document-text-outline' },
    { id: 'xray', label: 'X-Ray', icon: 'apps-outline' },
    { id: 'ct', label: 'CT', icon: 'image-outline' },
    { id: 'ultra', label: 'Ultrasound', icon: 'document-text-outline' },
    { id: 'star', label: 'Star', icon: 'folder-outline' },
  ];

  const sortOptions = [
    { id: 'date', label: 'Date', icon: 'calendar-outline' },
    { id: 'name', label: 'Name', icon: 'text-outline' },
    { id: 'size', label: 'Size', icon: 'resize-outline' },
  ];

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'image':
        return 'image-outline';
      case 'document':
        return 'document-text-outline';
      default:
        return 'folder-outline';
    }
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  const filteredFiles = files
    .filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || file.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return parseFloat(b.size) - parseFloat(a.size);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const FileCard = ({ file }: { file: any }) => (
    <TouchableOpacity className="flex-row items-center p-4 bg-neutral-900 rounded-xl mb-3 border border-neutral-800">
      <View className="w-12 h-12 bg-blue-500/10 rounded-xl items-center justify-center">
        <Ionicons name={getFileIcon(file.type)} size={24} color="#3b82f6" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-white font-medium text-base" numberOfLines={1}>{file.name}</Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-neutral-500 text-xs">{file.size}</Text>
          <Text className="text-neutral-600 text-xs mx-1">•</Text>
          <Text className="text-neutral-500 text-xs">{file.date}</Text>
        </View>
      </View>
      <TouchableOpacity className="p-2">
        <Ionicons name="ellipsis-vertical" size={18} color="#737373" />
      </TouchableOpacity>
    </TouchableOpacity>
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
      <View className="pb-20 bg-black px-2 pt-2">
        {/* Search Bar */}
        <View className="flex-row items-center bg-neutral-900 rounded-xl px-4 py-2 mb-4 border border-neutral-800">
          <Ionicons name="search-outline" size={20} color="#737373" />
          <TextInput
            className="flex-1 text-white ml-2 py-2"
            placeholder="Search files..."
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

        {/* Filter Options */}
        <View className="mb-5">
          <ScrollView
           contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between'}}
          horizontal showsHorizontalScrollIndicator={false} className="flex-row  gap-2">
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setFilterType(option.id)}
                className={`flex-row items-center px-4 py-2  rounded-full mr-2 ${
                  filterType === option.id ? 'bg-blue-200' : 'bg-neutral-900 border border-neutral-800'
                }`}
              >
                <Ionicons 
               
                key={option.id}
                 //@ts-ignore
                 name={option.icon} 
                  size={16} 
                  color={filterType === option.id ? 'black' : '#737373'} 
                />
                <Text className={`ml-2 font-medium  ${filterType === option.id ? 'text-blue-900' : 'text-neutral-400'}`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sort Options */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-neutral-400 text-sm">Sort by:</Text>
          <View className="flex-row gap-2">
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSortBy(option.id)}
                className={`flex-row items-center px-3 py-1.5 rounded-lg ${
                  sortBy === option.id ? 'bg-blue-500/20' : 'bg-neutral-900'
                }`}
              >
                <Ionicons 
                /*   name={option.icon}  */
                  size={14} 
                  color={sortBy === option.id ? '#3b82f6' : '#737373'} 
                />
                <Text className={`ml-1 text-xs ${
                  sortBy === option.id ? 'text-blue-500' : 'text-neutral-400'
                }`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Bar */}
        <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-neutral-800">
          <Text className="text-neutral-400 text-sm">
            {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
          </Text>
          <Text className="text-neutral-500 text-xs">Storage: 0 Bytes used</Text>
        </View>

        {/* Files List */}
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <FileCard key={file.id} file={file} />
          ))
        ) : (
          <View className="items-center py-12">
            <Ionicons name="folder-open-outline" size={64} color="#4b5563" />
            <Text className="text-neutral-400 text-lg font-medium mt-4">No files found</Text>
            <Text className="text-neutral-500 text-center mt-2">
              {searchQuery ? 'Try adjusting your search' : 'Upload your first file to get started'}
            </Text>
          </View>
        )}

      
      </View>
    </Animated.ScrollView>
  );
}