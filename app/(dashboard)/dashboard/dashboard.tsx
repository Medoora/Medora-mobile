import { useState } from "react";
import {
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import {
  Clock,
  FileText,
  HardDrive,
  Search,
  Star,
  Upload,
} from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";
import { AnimatedCircularProgress } from "react-native-circular-progress";

const screenWidth = Dimensions.get("window").width;

type DashboardStats = {
  totalDocuments: number;
  starredDocuments: number;
  totalSize: number;
  categories: Record<string, number>;
  fileTypes: Record<string, number>;
};

type RecentUpload = {
  id: string;
  documentName: string;
  uploadedAt: string;
};

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const stats: DashboardStats = {
    totalDocuments: 0,
    starredDocuments: 0,
    totalSize: 0,
    categories: {},
    fileTypes: {},
  };

  const recentUploads: RecentUpload[] = [];
  const uploadsThisMonth = 0;

  const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];

  const storageLimit = 500 * 1024 * 1024;
  const storagePercent = (stats.totalSize / storageLimit) * 100;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const chartData = {
    labels: ["M", "T", "W", "T", "F", "S", "S"],
    datasets: [
      {
        data: weeklyActivity.length ? weeklyActivity : [0, 0, 0, 0, 0, 0, 0],
      },
    ],
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* LOGO */}

        <View className="items-center mt-6 mb-6">
          <Image
            source={require("@/assets/logo/Medora-full-l.png")}
            className="w-56 h-12"
            resizeMode="contain"
          />
        </View>

        {/* SEARCH BAR */}

        <View className="flex-row items-center bg-[#F4F4F5] rounded-xl px-4 py-3 mb-8">
          <Search size={18} color="#6B7280" />
          <TextInput
            placeholder="Search records..."
            className="ml-3 flex-1 text-sm"
          />
        </View>

        {/* HERO STORAGE CARD */}

        <LinearGradient
          colors={["#7C3AED", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl p-6 mb-8"
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-sm opacity-90">
              Storage Overview
            </Text>
            <HardDrive color="white" size={18} />
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-3xl font-bold">
                {formatBytes(stats.totalSize)}
              </Text>
              <Text className="text-white opacity-70 text-xs">
                of 500 MB used
              </Text>
            </View>

            <AnimatedCircularProgress
              size={70}
              width={7}
              fill={storagePercent}
              tintColor="#FFFFFF"
              backgroundColor="rgba(255,255,255,0.3)"
            >
              {(fill: number) => (
                <Text className="text-white text-sm font-bold">
                  {Math.round(fill)}%
                </Text>
              )}
            </AnimatedCircularProgress>
          </View>
        </LinearGradient>

        {/* QUICK ACTIONS */}

        <View className="flex-row justify-between mb-8">
          <TouchableOpacity className="bg-[#FAFAFF] border border-[#E8E8F3] rounded-2xl p-4 w-[30%] items-center shadow-sm">
            <Upload color="#7C3AED" size={20} />
            <Text className="text-xs mt-2 text-gray-600">Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-[#FAFAFF] border border-[#E8E8F3] rounded-2xl p-4 w-[30%] items-center shadow-sm">
            <FileText color="#7C3AED" size={20} />
            <Text className="text-xs mt-2 text-gray-600">Records</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-[#FAFAFF] border border-[#E8E8F3] rounded-2xl p-4 w-[30%] items-center shadow-sm">
            <Star color="#7C3AED" size={20} />
            <Text className="text-xs mt-2 text-gray-600">Starred</Text>
          </TouchableOpacity>
        </View>

        {/* METRIC CARDS */}

        <View className="flex-row justify-between mb-8">
          <View className="bg-[#FAFAFF] border border-[#E8E8F3] rounded-2xl p-5 w-[48%] shadow-sm">
            <Text className="text-xs text-gray-500 uppercase">
              Total Studies
            </Text>

            <Text className="text-3xl font-bold mt-2">
              {stats.totalDocuments}
            </Text>

            <Text className="text-xs text-[#7C3AED] mt-1">
              {stats.starredDocuments} starred
            </Text>
          </View>

          <View className="bg-[#FAFAFF] border border-[#E8E8F3] rounded-2xl p-5 w-[48%] shadow-sm">
            <Text className="text-xs text-gray-500 uppercase">Uploads</Text>

            <Text className="text-3xl font-bold mt-2">{uploadsThisMonth}</Text>

            <View className="flex-row items-center mt-1">
              <Clock size={12} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">Last upload --</Text>
            </View>
          </View>
        </View>

        {/* STUDIES BY TYPE */}

        <View className="bg-[#FAFAFF] border border-[#E8E8F3] rounded-2xl p-6 mb-8 shadow-sm">
          <Text className="text-lg font-semibold mb-4">Studies by Type</Text>

          {Object.entries(stats.categories).length === 0 ? (
            <Text className="text-gray-400">No studies uploaded yet</Text>
          ) : (
            Object.entries(stats.categories).map(([category, count]) => (
              <View key={category} className="mb-4">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm">{category}</Text>
                  <Text className="text-sm text-gray-500">{count}</Text>
                </View>

                <View className="h-2 bg-[#EDE9FE] rounded-full overflow-hidden">
                  <View
                    className="h-2 bg-[#8B5CF6]"
                    style={{
                      width: `${(count / stats.totalDocuments) * 100}%`,
                    }}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* ACTIVITY CHART */}

        <View className="bg-[#FAFAFF] border border-[#E8E8F3] rounded-2xl p-6 mb-8 shadow-sm">
          <Text className="text-lg font-semibold mb-4">Upload Activity</Text>

          <LineChart
            data={chartData}
            width={screenWidth - 80}
            height={180}
            chartConfig={{
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              color: () => "#7C3AED",
              strokeWidth: 3,
            }}
            withDots={true}
            withInnerLines={false}
            withOuterLines={false}
            withShadow={false}
            bezier
          />
        </View>

        {/* RECENT UPLOADS */}

        <View className="bg-[#FAFAFF] border border-[#E8E8F3] rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-semibold mb-4">Recent Uploads</Text>

          {recentUploads.length === 0 ? (
            <Text className="text-gray-400">No uploads yet</Text>
          ) : (
            recentUploads.map((doc) => (
              <View
                key={doc.id}
                className="flex-row items-center justify-between mb-3"
              >
                <View className="flex-row items-center gap-2 flex-1">
                  <View className="w-2 h-2 bg-[#7C3AED] rounded-full" />

                  <Text className="truncate text-sm">{doc.documentName}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FLOATING UPLOAD BUTTON */}

      <TouchableOpacity className="absolute bottom-8 right-6 bg-[#7C3AED] rounded-full p-4 shadow-xl">
        <Upload color="white" size={22} />
      </TouchableOpacity>
    </View>
  );
}
