import {
  getDocumentStatistics,
  getRecentUploads,
  getUserDocuments,
} from "@/config/firebase/services/documents";
import { useAuth } from "@/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  RefreshControl,
  Animated as RNAnimated,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function HomeScreen() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    starredDocuments: 0,
    totalSize: 0,
    categories: {} as Record<string, number>,
  });
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();

  // Get day index (0 = Monday, 6 = Sunday)
  const getDayIndex = (date: Date): number => {
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    return day === 0 ? 6 : day - 1; // Convert to Monday-based index
  };

  // Calculate weekly upload counts
  const calculateWeeklyData = (files: any[]) => {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon to Sun

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(
      today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1),
    ); // Get Monday of current week

    files.forEach((file) => {
      if (!file.uploadedAt) return;

      const uploadDate = file.uploadedAt.toDate
        ? file.uploadedAt.toDate()
        : new Date(file.uploadedAt);

      // Only count files from current week
      if (uploadDate >= startOfWeek) {
        const dayIndex = getDayIndex(uploadDate);
        counts[dayIndex]++;
      }
    });

    return counts;
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Fetch statistics
      const statistics = await getDocumentStatistics(user.uid);
      setStats(statistics);

      // Fetch all documents for weekly chart
      const allDocuments = await getUserDocuments(user.uid, {
        includeTrashed: false,
      });
      const weeklyCounts = calculateWeeklyData(allDocuments);
      setWeeklyData(weeklyCounts);

      // Fetch recent uploads (last 5)
      const recent = await getRecentUploads(user.uid, 5);
      setRecentUploads(recent);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStoragePercentage = () => {
    const totalStorageLimit = 500 * 1024 * 1024; // 500 MB in bytes
    return (stats.totalSize / totalStorageLimit) * 100;
  };
  const TOTAL_STORAGE = 500 * 1024 * 1024;

  const usedPercentage = Math.min((stats.totalSize / TOTAL_STORAGE) * 100, 100);

  const getMaxBarHeight = () => {
    const max = Math.max(...weeklyData, 1);
    return Math.min(max * 10, 80); // Max height 80px, each upload = 10px
  };

  const handleFilePress = (file: any) => {
    router.push({
      pathname: "/(dashboard)/dashboard/(tabs)/mydrive",
      params: { id: file.id },
    });
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <View className="pb-20 px-2 pt-2 bg-black">
      <View className="flex-row flex-wrap gap-4">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="bg-neutral-800 p-5 rounded-2xl flex-1 min-w-[150px] h-32"
          />
        ))}
      </View>
      <View className="mt-6 bg-neutral-800 p-5 rounded-2xl h-24" />
      <View className="mt-8">
        <View className="bg-neutral-800 h-6 w-40 mb-4 rounded" />
        <View className="bg-neutral-800 p-5 rounded-2xl h-64" />
      </View>
    </View>
  );

  const animatedValue = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(animatedValue, {
      toValue: usedPercentage,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [usedPercentage]);

  const StorageCircle = () => {
    const size = 160;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // 🎨 Dynamic color
    let strokeColor = "#3b82f6"; // blue
    if (usedPercentage > 85)
      strokeColor = "#ef4444"; // red
    else if (usedPercentage > 60) strokeColor = "#f59e0b"; // yellow

    // 📉 remaining
    const remaining = TOTAL_STORAGE - stats.totalSize;

    // 🧠 smart label
    let label = "Storage Used";
    if (usedPercentage > 80) label = "Almost full";
    else if (usedPercentage > 50) label = "Getting full";

    // 🎬 animated stroke
    const animatedStroke = animatedValue.interpolate({
      inputRange: [0, 100],
      outputRange: [circumference, 0],
    });

    return (
      <View className="items-center justify-center my-6">
        <View>
          <Svg width={size} height={size}>
            {/* Background */}
            <Circle
              stroke="#2a2a2a"
              fill="none"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />

            {/* Animated Progress */}
            <Circle
              stroke={strokeColor}
              fill="none"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference}`}
              strokeDashoffset={
                circumference - (usedPercentage / 100) * circumference
              }
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>

          {/* Center */}
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-white text-2xl font-bold">
              {usedPercentage.toFixed(0)}%
            </Text>
            <Text className="text-neutral-400 text-xs mt-1">{label}</Text>
          </View>
        </View>

        {/* Bottom */}
        <View className="items-center mt-4">
          <Text className="text-neutral-400 text-xs">
            Used {formatFileSize(stats.totalSize)} / 500 MB
          </Text>

          <Text className="text-neutral-500 text-xs mt-1">
            {formatFileSize(remaining)} left
          </Text>
        </View>
      </View>
    );
  };

  return (
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
      {loading && !refreshing ? (
        <SkeletonLoader />
      ) : (
        <View className="pb-20 px-2 pt-2 bg-black">
          <StorageCircle />

          {/* Stats Cards Grid */}
          <View className="flex-row flex-wrap gap-4">
            <View className="bg-neutral-900 p-5 rounded-2xl flex-1 min-w-[150px] border border-neutral-800">
              <Text className="text-neutral-400 text-sm">Total Studies</Text>
              <Text className="text-white text-3xl font-bold mt-1">
                {stats.totalDocuments}
              </Text>
              <View className="flex-row items-center mt-2">
                <Ionicons name="star-outline" size={14} color="#6b7280" />
                <Text className="text-neutral-500 text-xs ml-1">
                  {stats.starredDocuments} starred
                </Text>
              </View>
            </View>

            <View className="bg-neutral-900 p-5 rounded-2xl flex-1 min-w-[150px] border border-neutral-800">
              <Text className="text-neutral-400 text-sm">Storage Used</Text>
              <Text className="text-white text-3xl font-bold mt-1">
                {formatFileSize(stats.totalSize)}
              </Text>
              <Text className="text-neutral-500 text-xs mt-2">
                of 500 MB ({getStoragePercentage().toFixed(1)}%)
              </Text>
            </View>

            <View className="bg-neutral-900 p-5 rounded-2xl flex-1 min-w-[150px] border border-neutral-800">
              <Text className="text-neutral-400 text-sm">Categories</Text>
              <Text className="text-white text-3xl font-bold mt-1">
                {Object.keys(stats.categories).length}
              </Text>
              <Text className="text-neutral-500 text-xs mt-2">
                document types
              </Text>
            </View>
          </View>

          {/* Reminder Card */}
          <TouchableOpacity
            onPress={() =>
              router.push("/(dashboard)/dashboard/(tabs)/reminder")
            }
            className="mt-6 bg-neutral-900 p-5 rounded-2xl border border-neutral-800"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-semibold text-lg">
                  Reminder
                </Text>
                <Text className="text-neutral-300 mt-1">
                  Upcoming appointments and tasks
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#737373" />
            </View>
          </TouchableOpacity>

          {/* Recent Uploads */}
          <View className="mt-8">
            <Text className="text-white text-xl font-semibold mb-4">
              Recent Uploads
            </Text>

            <View className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
              <Text className="text-white mb-4">Files by Type (This Week)</Text>

              {/* Week Days Chart - Dynamic */}
              <View className="flex-row justify-between items-end h-32 mb-6">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, index) => {
                    const count = weeklyData[index];
                    const maxHeight = getMaxBarHeight();
                    const barHeight =
                      count === 0
                        ? 4
                        : Math.max((count / Math.max(...weeklyData)) * 80, 8);

                    return (
                      <View key={day} className="items-center">
                        <View className="items-center">
                          <Text className="text-blue-400 text-xs mb-1">
                            {count > 0 ? count : ""}
                          </Text>
                          <View
                            className="w-8 bg-blue-500 rounded-t-lg"
                            style={{ height: barHeight }}
                          />
                        </View>
                        <Text className="text-neutral-500 text-xs mt-2">
                          {day}
                        </Text>
                      </View>
                    );
                  },
                )}
              </View>

              {/* Summary Stats */}
              <View className="flex-row justify-between mb-4 pb-2 border-b border-neutral-800">
                <Text className="text-neutral-500 text-xs">
                  Total this week: {weeklyData.reduce((a, b) => a + b, 0)} files
                </Text>
                <Text className="text-neutral-500 text-xs">
                  Most active:{" "}
                  {
                    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
                      weeklyData.indexOf(Math.max(...weeklyData))
                    ]
                  }
                </Text>
              </View>

              {/* Recent Files List */}
              {recentUploads.length > 0 ? (
                <View className="mt-2">
                  {recentUploads.map((file) => (
                    <TouchableOpacity
                      key={file.id}
                      onPress={() => handleFilePress(file)}
                      className="flex-row items-center py-3 border-t border-neutral-800 first:border-t-0"
                    >
                      {file.cloudinary?.thumbnailUrl ? (
                        <Image
                          source={{ uri: file.cloudinary.thumbnailUrl }}
                          className="w-10 h-10 rounded-lg"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-10 h-10 bg-blue-500/10 rounded-lg items-center justify-center">
                          <Ionicons
                            name="document-text-outline"
                            size={20}
                            color="#3b82f6"
                          />
                        </View>
                      )}
                      <View className="flex-1 ml-3">
                        <Text
                          className="text-white text-sm font-medium"
                          numberOfLines={1}
                        >
                          {file.documentName}
                        </Text>
                        <Text className="text-neutral-500 text-xs">
                          {formatFileSize(file.cloudinary?.bytes || 0)} •{" "}
                          {formatDate(file.uploadedAt)}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#737373"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="items-center py-8 mt-2 border-t border-neutral-800">
                  <Ionicons
                    name="cloud-upload-outline"
                    size={40}
                    color="#4b5563"
                  />
                  <Text className="text-neutral-400 text-base mt-2">
                    No recent uploads
                  </Text>
                  <Text className="text-neutral-500 text-sm mt-1">
                    Upload your first file to get started
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </Animated.ScrollView>
  );
}
