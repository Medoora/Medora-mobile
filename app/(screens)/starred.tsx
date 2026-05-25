import FileDetailsModal from "@/components/modal/filedetails-modal";
import DashboardWrapper from "@/components/wrapper/dashboard-wrapper";
import {
  getUserDocuments,
  toggleDocumentStarred,
  trashDocument,
} from "@/config/firebase/services/dashboard/documents";
import { useAuth } from "@/context/auth-context";
import { useAppTheme } from "@/context/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
  findNodeHandle,
} from "react-native";

// For Android layout measurements
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function StarredScreen() {
  const { user } = useAuth();
  const { isDark } = useAppTheme();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownFile, setDropdownFile] = useState<any>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 16,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Theme-aware colors
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const cardBg = isDark ? 'bg-neutral-900' : 'bg-gray-100';
  const borderColor = isDark ? 'border-neutral-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-400' : 'text-gray-500';
  const textTertiary = isDark ? 'text-neutral-500' : 'text-gray-400';
  const inputBg = isDark ? 'bg-neutral-900' : 'bg-gray-100';
  const iconColor = isDark ? '#737373' : '#9ca3af';
  const skeletonBg = isDark ? 'bg-neutral-800/50' : 'bg-gray-200';
  const skeletonInner = isDark ? 'bg-neutral-700/50' : 'bg-gray-300';

  const sortOptions = [
    { id: "date", label: "Date", icon: "calendar-outline" },
    { id: "name", label: "Name", icon: "text-outline" },
    { id: "size", label: "Size", icon: "resize-outline" },
  ];

  // Fetch documents from Firebase
  const fetchDocuments = useCallback(
    async (showLoading = true) => {
      if (!user?.uid) return;

      try {
        if (showLoading) setLoading(true);
        const documents = await getUserDocuments(user.uid);

        const starredDocs = documents.filter(
          (doc: any) => doc.isStarred === true,
        );

        setFiles(starredDocs);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsUploading(false);
        setIsDeleting(false);
      }
    },
    [user?.uid],
  );

  useEffect(() => {
    fetchDocuments(true);
  }, [fetchDocuments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocuments(false);
  }, [fetchDocuments]);

  const handleStarToggle = async (fileId: string, currentStarred: boolean) => {
    try {
      await toggleDocumentStarred(fileId, !currentStarred);
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId ? { ...file, isStarred: !currentStarred } : file,
        ),
      );
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const handleFilePress = (file: any) => {
    setSelectedFile(file);
    setShowDetailsModal(true);
  };

  const handleDelete = async (fileId: string) => {
    Alert.alert(
      "Move to Trash",
      "This file will be moved to trash",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Move to Trash",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await trashDocument(fileId);
              await fetchDocuments(false);
              setDropdownVisible(false);
            } catch (error) {
              console.error("Error deleting file:", error);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleShare = async (file: any) => {
    console.log("Share:", file.id);
    setDropdownVisible(false);
  };

  const measureButtonPosition = (buttonRef: any | null) => {
    if (!buttonRef) return;

    const handle = findNodeHandle(buttonRef);
    if (handle) {
      UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
        setDropdownPosition({
          top: pageY + height + 8,
          right: 20,
        });
      });
    }
  };

  const getFileIcon = (file: any) => {
    const fileType = file.fileInfo?.fileTypeCategory || file.category;
    if (fileType === "image") return "image-outline";
    if (fileType === "pdf") return "document-text-outline";
    return "folder-outline";
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(0)} ${sizes[i]}`;
  };

  const filteredFiles = files
    .filter((file) => {
      const matchesSearch =
        file.documentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.categoryLabel?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "name")
        return a.documentName?.localeCompare(b.documentName || "");
      if (sortBy === "size")
        return (b.cloudinary?.bytes || 0) - (a.cloudinary?.bytes || 0);

      const dateA = a.uploadedAt?.toDate
        ? a.uploadedAt.toDate()
        : new Date(a.uploadedAt);
      const dateB = b.uploadedAt?.toDate
        ? b.uploadedAt.toDate()
        : new Date(b.uploadedAt);

      return dateB.getTime() - dateA.getTime();
    });

  // Skeleton Loader Component with theme support
  const SkeletonLoader = () => (
    <View className="px-4 pt-4">
      <View className={`${skeletonBg} rounded-xl h-11 mb-6`} />
      <View className="flex-row justify-between mb-6">
        <View className={`${skeletonBg} rounded-lg h-8 w-20`} />
        <View className="flex-row gap-3">
          {[1, 2, 3].map((i) => (
            <View key={i} className={`${skeletonBg} rounded-lg h-8 w-16`} />
          ))}
        </View>
      </View>
      <View className={`${skeletonBg} rounded h-4 w-32 mb-6`} />
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          className={`flex-row items-center p-4 ${skeletonBg} rounded-xl mb-3`}
        >
          <View className={`w-10 h-10 ${skeletonInner} rounded-lg`} />
          <View className="flex-1 ml-3">
            <View className={`${skeletonInner} rounded h-4 w-40 mb-2`} />
            <View className={`${skeletonInner} rounded h-3 w-24`} />
          </View>
          <View className={`w-6 h-6 ${skeletonInner} rounded-full`} />
        </View>
      ))}
    </View>
  );

  const FileCard = ({ file }: { file: any }) => {
    const buttonRef = useRef<any>(null);

    return (
      <TouchableOpacity
        onPress={() => handleFilePress(file)}
        activeOpacity={0.7}
        className={`flex-row items-center px-4 py-3 ${cardBg} rounded-xl mb-2`}
      >
        {file.cloudinary?.thumbnailUrl ? (
          <Image
            source={{ uri: file.cloudinary.thumbnailUrl }}
            className="w-10 h-10 rounded-lg"
            resizeMode="cover"
          />
        ) : (
          <View className="w-10 h-10 bg-blue-500/10 rounded-lg items-center justify-center">
            <Ionicons name={getFileIcon(file)} size={20} color="#3b82f6" />
          </View>
        )}

        <View className="flex-1 ml-3">
          <Text className={`${textPrimary} text-sm font-medium`} numberOfLines={1}>
            {file.documentName}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className={`${textTertiary} text-xs`}>
              {formatFileSize(file.cloudinary?.bytes || 0)}
            </Text>
            <Text className="text-neutral-600 text-xs mx-1">•</Text>
            <Text className={`${textTertiary} text-xs`}>
              {formatDate(file.uploadedAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          ref={buttonRef}
          onPress={() => {
            if (buttonRef.current) {
              measureButtonPosition(buttonRef.current);
              setDropdownFile(file);
              setDropdownVisible(true);
            }
          }}
          className="p-2"
        >
          <Ionicons name="ellipsis-vertical" size={18} color={iconColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const totalStorageUsed = files.reduce(
    (total, file) => total + (file.cloudinary?.bytes || 0),
    0,
  );

  const shouldShowSkeleton = loading || refreshing || isUploading || isDeleting;

  return (
    <DashboardWrapper
      title="Starred"
      rightIconName="search-outline"
      onRightIconPress={() => console.log('Search pressed')}
    >
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        className={`flex-1 ${bgColor}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
      >
        <View className={`px-4 pt-4 pb-24 ${bgColor}`}>
          {/* Search Bar */}
          <View className={`flex-row items-center ${inputBg} rounded-xl px-4 mb-6 border ${borderColor}`}>
            <Ionicons name="search-outline" size={18} color={iconColor} />
            <TextInput
              className={`flex-1 ${textPrimary} py-3 ml-2`}
              placeholder="Search starred files..."
              placeholderTextColor={iconColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color={iconColor} />
              </TouchableOpacity>
            )}
          </View>

          {shouldShowSkeleton ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* Sort Options */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className={`${textSecondary} text-xs`}>Sort by</Text>
                <View className="flex-row gap-3">
                  {sortOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setSortBy(option.id)}
                      className={`px-3 py-1.5 rounded-lg ${
                        sortBy === option.id ? "bg-blue-500/20" : ""
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          sortBy === option.id
                            ? "text-blue-500"
                            : textTertiary
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Stats Bar */}
              <View className={`flex-row justify-between items-center mb-5 pb-2 border-b ${borderColor}`}>
                <Text className={`${textTertiary} text-xs`}>
                  {filteredFiles.length}{" "}
                  {filteredFiles.length === 1 ? "item" : "items"}
                </Text>
                <Text className={`${textTertiary} text-xs`}>
                  {formatFileSize(totalStorageUsed)}
                </Text>
              </View>

              {/* Files List */}
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))
              ) : (
                <View className="items-center py-16">
                  <Ionicons name="star-outline" size={48} color="#4b5563" />
                  <Text className={`${textSecondary} text-base font-medium mt-4`}>
                    No starred files
                  </Text>
                  <Text className={`${textTertiary} text-sm text-center mt-2`}>
                    {searchQuery
                      ? "No matching files found"
                      : "Star important files to see them here"}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </Animated.ScrollView>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View className="flex-1 bg-black/50">
            <View
              style={{
                position: "absolute",
                top: dropdownPosition.top,
                right: dropdownPosition.right,
                zIndex: 1000,
              }}
              className="bg-neutral-800 rounded-xl w-44 overflow-hidden"
            >
              <TouchableOpacity
                onPress={() => {
                  if (dropdownFile) {
                    handleFilePress(dropdownFile);
                    setDropdownVisible(false);
                  }
                }}
                className="flex-row items-center px-4 py-3 border-b border-neutral-700"
              >
                <Ionicons name="information-circle-outline" size={18} color="#a1a1aa" />
                <Text className="text-white ml-3 text-sm">View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (dropdownFile) {
                    handleShare(dropdownFile);
                  }
                }}
                className="flex-row items-center px-4 py-3 border-b border-neutral-700"
              >
                <Ionicons name="share-outline" size={18} color="#a1a1aa" />
                <Text className="text-white ml-3 text-sm">Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (dropdownFile) {
                    handleStarToggle(dropdownFile.id, dropdownFile.isStarred);
                    setDropdownVisible(false);
                  }
                }}
                className="flex-row items-center px-4 py-3 border-b border-neutral-700"
              >
                <Ionicons
                  name={dropdownFile?.isStarred ? "star" : "star-outline"}
                  size={18}
                  color={dropdownFile?.isStarred ? "#fbbf24" : "#a1a1aa"}
                />
                <Text className="text-white ml-3 text-sm">
                  {dropdownFile?.isStarred ? "Remove Star" : "Star"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (dropdownFile) {
                    handleDelete(dropdownFile.id);
                  }
                }}
                className="flex-row items-center px-4 py-3"
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text className="text-red-500 ml-3 text-sm">Move to Trash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* File Details Modal */}
      <FileDetailsModal
        visible={showDetailsModal}
        file={selectedFile}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedFile(null);
        }}
        onUpdate={fetchDocuments}
      />
    </DashboardWrapper>
  );
}