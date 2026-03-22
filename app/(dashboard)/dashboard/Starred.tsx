import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
  findNodeHandle,
} from "react-native";

import {
  getUserDocuments,
  toggleDocumentStarred,
  trashDocument,
} from "@/config/firebase/services/documents";
import { useAuth } from "@/hooks/auth/useAuth";

export default function StarredScreen() {
  const { user } = useAuth();

  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownFile, setDropdownFile] = useState<any>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 16,
  });

  const sortOptions = [
    { id: "date", label: "Date", icon: "calendar-outline" },
    { id: "name", label: "Name", icon: "text-outline" },
    { id: "size", label: "Size", icon: "resize-outline" },
  ];

  useEffect(() => {
    if (!user?.uid) return;

    const fetchDocs = async () => {
      const docs = await getUserDocuments(user.uid);
      const starred = docs.filter((doc: any) => doc.isStarred);
      setFiles(starred);
    };

    fetchDocs();
  }, [user]);

  const filteredFiles = files
    .filter((file) =>
      file.documentName?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
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

  const handleStarToggle = async (fileId: string, currentStarred: boolean) => {
    try {
      await toggleDocumentStarred(fileId, !currentStarred);

      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, isStarred: !currentStarred } : file,
        ),
      );
    } catch (error) {
      console.log("Star error:", error);
    }
  };

  const handleDelete = async (fileId: string) => {
    Alert.alert("Move to Trash", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await trashDocument(fileId);
          setFiles((prev) => prev.filter((f) => f.id !== fileId));
        },
      },
    ]);
  };

  const measureButtonPosition = (ref: any) => {
    const handle = findNodeHandle(ref);
    if (handle) {
      UIManager.measure(handle, (x, y, w, h, px, py) => {
        setDropdownPosition({ top: py + h + 5, right: 16 });
      });
    }
  };

  const getFileIcon = (file: any) => {
    if (file.category === "image") return "image-outline";
    if (file.category === "pdf") return "document-text-outline";
    return "folder-outline";
  };

  return (
    <ScrollView className="flex-1 bg-black px-3 pt-4">
      {/* SEARCH */}
      <View className="flex-row items-center bg-neutral-900 rounded-xl px-3 py-2 mb-5 border border-neutral-800">
        <Ionicons name="search-outline" size={18} color="#737373" />
        <TextInput
          className="flex-1 text-white ml-2 text-sm"
          placeholder="Search files..."
          placeholderTextColor="#737373"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* SORT */}
      <View className="flex-row justify-between mb-5">
        <Text className="text-neutral-400 text-sm">Sort by:</Text>

        <View className="flex-row gap-2">
          {sortOptions.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setSortBy(opt.id)}
              className={`flex-row px-3 py-1.5 rounded-lg ${
                sortBy === opt.id ? "bg-blue-500/20" : "bg-neutral-900"
              }`}
            >
              <Ionicons
                name={opt.icon as any}
                size={14}
                color={sortBy === opt.id ? "#3b82f6" : "#737373"}
              />

              <Text
                className={`ml-1 text-xs ${
                  sortBy === opt.id ? "text-blue-500" : "text-neutral-400"
                }`}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* FILES */}
      {filteredFiles.map((file) => {
        let btn: any;

        return (
          <View key={file.id} className="mb-3">
            <TouchableOpacity className="flex-row items-center p-3 bg-neutral-900 rounded-xl border border-neutral-800">
              {file.cloudinary?.thumbnailUrl ? (
                <Image
                  source={{ uri: file.cloudinary.thumbnailUrl }}
                  className="w-12 h-12 rounded-xl"
                />
              ) : (
                <View className="w-12 h-12 bg-blue-500/10 rounded-xl items-center justify-center">
                  <Ionicons
                    name={getFileIcon(file)}
                    size={24}
                    color="#3b82f6"
                  />
                </View>
              )}

              <View className="flex-1 ml-3">
                <Text className="text-white">{file.documentName}</Text>
                <Text className="text-neutral-500 text-xs mt-1">
                  {file.categoryLabel}
                </Text>
              </View>

              {/* STAR */}
              <TouchableOpacity
                onPress={() => handleStarToggle(file.id, file.isStarred)}
                className="p-2"
              >
                <Ionicons
                  name={file.isStarred ? "star" : "star-outline"}
                  size={20}
                  color="#fbbf24"
                />
              </TouchableOpacity>

              {/* MENU */}
              <TouchableOpacity
                ref={(r: any) => {
                  btn = r;
                }}
                onPress={() => {
                  measureButtonPosition(btn);
                  setDropdownFile(file);
                  setDropdownVisible(true);
                }}
                className="p-2"
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#737373" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* DROPDOWN */}
      <Modal visible={dropdownVisible} transparent>
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View className="flex-1 bg-black/50">
            <View
              style={{
                position: "absolute",
                top: dropdownPosition.top,
                right: dropdownPosition.right,
              }}
              className="bg-neutral-800 rounded-xl w-48"
            >
              <TouchableOpacity className="px-4 py-3 border-b border-neutral-700">
                <Text className="text-white">View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity className="px-4 py-3 border-b border-neutral-700">
                <Text className="text-white">Share</Text>
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
                  color="#fbbf24"
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
                  setDropdownVisible(false);
                }}
                className="flex-row items-center px-4 py-3"
              >
                <Text className="text-red-500">Move to Trash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}
