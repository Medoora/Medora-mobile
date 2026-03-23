import FileDetailsModal from "@/components/modal/filedetails-modal";
import DashboardWrapper from "@/components/wrapper/dashboard-wrapper";
import {
  getUserDocuments,
  toggleDocumentStarred,
  trashDocument,
} from "@/config/firebase/services/documents";
import { useAuth } from "@/context/auth-context";
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

export default function MyDriveScreen() {
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
  const { user } = useAuth();

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
      "Are you sure you want to move this file to trash?",
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
    // Implement share functionality
    console.log("Share:", file.id);
    setDropdownVisible(false);
  };

  const measureButtonPosition = (buttonRef: any | null) => {
    if (!buttonRef) return;

    const handle = findNodeHandle(buttonRef);
    if (handle) {
      UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
        setDropdownPosition({
          top: pageY + height + 5,
          right: 16,
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
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };
  const filteredFiles = files
    .filter((file) => {
      const matchesSearch =
        file.documentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.categoryLabel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags?.some((tag: string) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

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

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <View className="px-2 pt-2">
      <View className="bg-neutral-800 rounded-xl h-12 mb-4" />
      <View className="flex-row gap-2 mb-5">
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-neutral-800 rounded-full h-10 w-20" />
        ))}
      </View>
      <View className="flex-row justify-between mb-4">
        <View className="bg-neutral-800 rounded-lg h-8 w-20" />
        <View className="flex-row gap-2">
          {[1, 2, 3].map((i) => (
            <View key={i} className="bg-neutral-800 rounded-lg h-8 w-16" />
          ))}
        </View>
      </View>
      <View className="flex-row justify-between mb-4 pb-2">
        <View className="bg-neutral-800 rounded h-5 w-32" />
        <View className="bg-neutral-800 rounded h-5 w-24" />
      </View>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="flex-row items-center p-4 bg-neutral-800/50 rounded-xl mb-3"
        >
          <View className="w-12 h-12 bg-neutral-700 rounded-xl" />
          <View className="flex-1 ml-3">
            <View className="bg-neutral-700 rounded h-5 w-40 mb-2" />
            <View className="bg-neutral-700 rounded h-3 w-32" />
          </View>
          <View className="w-8 h-8 bg-neutral-700 rounded-full" />
        </View>
      ))}
    </View>
  );

  const FileCard = ({ file, index }: { file: any; index: number }) => {
    const buttonRef = useRef<any>(null);

    return (
      <View className="mb-3">
        <TouchableOpacity
          onPress={() => handleFilePress(file)}
          className="flex-row items-center p-4 bg-neutral-900 rounded-xl border border-neutral-800"
        >
          {file.cloudinary?.thumbnailUrl ? (
            <Image
              source={{ uri: file.cloudinary.thumbnailUrl }}
              className="w-12 h-12 rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 bg-blue-500/10 rounded-xl items-center justify-center">
              <Ionicons name={getFileIcon(file)} size={24} color="#3b82f6" />
            </View>
          )}

          <View className="flex-1 ml-3">
            <Text
              className="text-white font-medium text-base"
              numberOfLines={1}
            >
              {file.documentName}
            </Text>
            <View className="flex-row items-center mt-1 flex-wrap">
              <Text className="text-neutral-500 text-xs">
                {formatFileSize(file.cloudinary?.bytes || 0)}
              </Text>
              <Text className="text-neutral-600 text-xs mx-1">•</Text>
              <Text className="text-neutral-500 text-xs">
                {formatDate(file.uploadedAt)}
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
            {file.tags && file.tags.length > 0 && (
              <View className="flex-row mt-1">
                {file.tags.slice(0, 2).map((tag: string, tagIndex: number) => (
                  <View
                    key={tagIndex}
                    className="bg-neutral-800 px-2 py-0.5 rounded-full mr-2"
                  >
                    <Text className="text-neutral-400 text-xs">{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => handleStarToggle(file.id, file.isStarred)}
              className="p-2"
            >
              <Ionicons
                name={file.isStarred ? "star" : "star-outline"}
                size={18}
                color={file.isStarred ? "#fbbf24" : "#737373"}
              />
            </TouchableOpacity>

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
              <Ionicons name="ellipsis-vertical" size={18} color="#737373" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Calculate total storage used
  const totalStorageUsed = files.reduce(
    (total, file) => total + (file.cloudinary?.bytes || 0),
    0,
  );

  // Show skeleton during loading, refreshing, uploading, or deleting
  const shouldShowSkeleton = loading || refreshing || isUploading || isDeleting;

  return (
    <>
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
        className="flex-1 bg-black"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
      >
        <View className="pb-20 bg-black px-3 pt-2">
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
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#737373" />
              </TouchableOpacity>
            )}
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
                    sortBy === option.id ? "bg-blue-500/20" : "bg-neutral-900"
                  }`}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={14}
                    color={sortBy === option.id ? "#3b82f6" : "#737373"}
                  />
                  <Text
                    className={`ml-1 text-xs ${
                      sortBy === option.id
                        ? "text-blue-500"
                        : "text-neutral-400"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stats Bar */}
          <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-neutral-800">
            <Text className="text-neutral-400 text-sm">
              {filteredFiles.length}{" "}
              {filteredFiles.length === 1 ? "file" : "files"}
            </Text>
            <Text className="text-neutral-500 text-xs">
              Storage: {formatFileSize(totalStorageUsed)}
            </Text>
          </View>

          {/* Files List */}
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, index) => (
              <FileCard key={file.id} file={file} index={index} />
            ))
          ) : (
            <View className="items-center py-12">
              <Ionicons name="folder-open-outline" size={64} color="#4b5563" />
              <Text className="text-neutral-400 text-lg font-medium mt-4">
                No files found
              </Text>
              <Text className="text-neutral-500 text-center mt-2">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Upload your first file to get started"}
              </Text>
            </View>
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
              className="bg-neutral-800 rounded-xl w-48 overflow-hidden shadow-lg"
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
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#a1a1aa"
                />
                <Text className="text-white ml-3">View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (dropdownFile) {
                    handleShare(dropdownFile);
                  }
                }}
                className="flex-row items-center px-4 py-3 border-b border-neutral-700"
              >
                <Ionicons name="share-outline" size={20} color="#a1a1aa" />
                <Text className="text-white ml-3">Share</Text>
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
                  size={20}
                  color={dropdownFile?.isStarred ? "#fbbf24" : "#a1a1aa"}
                />
                <Text className="text-white ml-3">
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
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text className="text-red-500 ml-3">Move to Trash</Text>
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
    </>
  );
}
