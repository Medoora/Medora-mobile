import { getDocumentStatistics, getRecentUploads, getUserDocuments } from '@/config/firebase/services/documents';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { fileEvents } from "../../../../utils/events";
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
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();

  // Get day index (0 = Monday, 6 = Sunday)
  const getDayIndex = (date: Date): number => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  };

  // Calculate weekly upload counts
  const calculateWeeklyData = (files: any[]) => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    
    files.forEach(file => {
      if (!file.uploadedAt) return;
      
      const uploadDate = file.uploadedAt.toDate ? file.uploadedAt.toDate() : new Date(file.uploadedAt);
      
      if (uploadDate >= startOfWeek) {
        const dayIndex = getDayIndex(uploadDate);
        counts[dayIndex]++;
      }
    });
    
    return counts;
  };

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (!user?.uid) return;
    
    try {
      if (showLoading) setLoading(true);
      setIsRefreshingData(true);
      
      // Fetch statistics
      const statistics = await getDocumentStatistics(user.uid);
      setStats(statistics);
      
      // Fetch all documents for weekly chart
      const allDocuments = await getUserDocuments(user.uid, { includeTrashed: false });
      const weeklyCounts = calculateWeeklyData(allDocuments);
      setWeeklyData(weeklyCounts);
      
      // Fetch recent uploads (last 5)
      const recent = await getRecentUploads(user.uid, 5);
      setRecentUploads(recent);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsRefreshingData(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Listen for upload events to refresh dashboard
  useEffect(() => {
    const handleUploadComplete = () => {
      console.log('Upload detected, refreshing dashboard...');
      fetchDashboardData(false);
    };
    
    fileEvents.on('uploadComplete', handleUploadComplete);
    
    return () => {
      fileEvents.off('uploadComplete', handleUploadComplete);
    };
  }, [fetchDashboardData]);
  console.log()

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStoragePercentage = () => {
    const totalStorageLimit = 500 * 1024 * 1024;
    return (stats.totalSize / totalStorageLimit) * 100;
  };

  const handleFilePress = (file: any) => {
    router.push({
      pathname: '/(dashboard)/dashboard/(tabs)/mydrive',
      params: { id: file.id }
    });
  };

  // Enhanced Skeleton Loader Component
  const SkeletonLoader = () => (
    <View className="pb-20 px-2 pt-2 bg-black">
      {/* Stats Cards Skeleton - Animated shimmer effect */}
      <View className="flex-row flex-wrap gap-4">
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-neutral-800/50 p-5 rounded-2xl flex-1 min-w-[150px] h-32">
            <View className="bg-neutral-700/50 rounded h-4 w-20 mb-2" />
            <View className="bg-neutral-700/50 rounded h-8 w-16 mt-2" />
            <View className="bg-neutral-700/50 rounded h-3 w-24 mt-4" />
          </View>
        ))}
      </View>
      
      {/* Reminder Card Skeleton */}
      <View className="mt-6 bg-neutral-800/50 p-5 rounded-2xl h-24">
        <View className="bg-neutral-700/50 rounded h-5 w-32 mb-2" />
        <View className="bg-neutral-700/50 rounded h-4 w-48" />
      </View>
      
      {/* Recent Uploads Skeleton */}
      <View className="mt-8">
        <View className="bg-neutral-700/50 rounded h-6 w-40 mb-4" />
        <View className="bg-neutral-800/50 p-5 rounded-2xl">
          <View className="bg-neutral-700/50 rounded h-5 w-32 mb-4" />
          <View className="flex-row justify-between items-end h-32 mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <View key={i} className="items-center">
                <View className="bg-neutral-700/50 rounded-t-lg w-8 h-12" />
                <View className="bg-neutral-700/50 rounded h-3 w-6 mt-2" />
              </View>
            ))}
          </View>
          <View className="bg-neutral-700/50 rounded h-8 w-full mb-4" />
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-center py-3 border-t border-neutral-800">
              <View className="bg-neutral-700/50 rounded-lg w-10 h-10" />
              <View className="flex-1 ml-3">
                <View className="bg-neutral-700/50 rounded h-4 w-32 mb-2" />
                <View className="bg-neutral-700/50 rounded h-3 w-24" />
              </View>
              <View className="bg-neutral-700/50 rounded h-5 w-5" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // Show skeleton during initial loading, refresh, or data refresh
  const shouldShowSkeleton = loading || refreshing || isRefreshingData;

  return (
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
      {shouldShowSkeleton ? (
        <SkeletonLoader />
      ) : (
        <View className="pb-20 px-2 pt-2 bg-black">
          {/* Stats Cards Grid */}
          <View className="flex-row flex-wrap gap-4">
            <View className="bg-neutral-900 p-5 rounded-2xl flex-1 min-w-[150px] border border-neutral-800">
              <Text className="text-neutral-400 text-sm">Total Studies</Text>
              <Text className="text-white text-3xl font-bold mt-1">{stats.totalDocuments}</Text>
              <View className="flex-row items-center mt-2">
                <Ionicons name="star-outline" size={14} color="#6b7280" />
                <Text className="text-neutral-500 text-xs ml-1">
                  {stats.starredDocuments} starred
                </Text>
              </View>
            </View>

            <View className="bg-neutral-900 p-5 rounded-2xl flex-1 min-w-[150px] border border-neutral-800">
              <Text className="text-neutral-400 text-sm">Storage Used</Text>
              <Text className="text-white text-3xl font-bold mt-1">{formatFileSize(stats.totalSize)}</Text>
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
            onPress={() => router.push('/(dashboard)/dashboard/(tabs)/reminder')}
            className="mt-6 bg-neutral-900 p-5 rounded-2xl border border-neutral-800"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-semibold text-lg">Reminder</Text>
                <Text className="text-neutral-300 mt-1">Upcoming appointments and tasks</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#737373" />
            </View>
          </TouchableOpacity>

          {/* Recent Uploads */}
          <View className="mt-8">
            <Text className="text-white text-xl font-semibold mb-4">Recent Uploads</Text>
            
            <View className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
              <Text className="text-white mb-4">Files by Type (This Week)</Text>
              
              {/* Week Days Chart - Dynamic */}
              <View className="flex-row justify-between items-end h-32 mb-6">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const count = weeklyData[index];
                  const maxCount = Math.max(...weeklyData, 1);
                  const barHeight = count === 0 ? 4 : Math.max((count / maxCount) * 80, 8);
                  
                  return (
                    <View key={day} className="items-center">
                      <View className="items-center">
                        <Text className="text-blue-400 text-xs mb-1">{count > 0 ? count : ''}</Text>
                        <View 
                          className="w-8 bg-blue-500 rounded-t-lg"
                          style={{ height: barHeight }}
                        />
                      </View>
                      <Text className="text-neutral-500 text-xs mt-2">{day}</Text>
                    </View>
                  );
                })}
              </View>
              
              {/* Summary Stats */}
              <View className="flex-row justify-between mb-4 pb-2 border-b border-neutral-800">
                <Text className="text-neutral-500 text-xs">
                  Total this week: {weeklyData.reduce((a, b) => a + b, 0)} files
                </Text>
                <Text className="text-neutral-500 text-xs">
                  Most active: {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weeklyData.indexOf(Math.max(...weeklyData))]}
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
                          <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
                        </View>
                      )}
                      <View className="flex-1 ml-3">
                        <Text className="text-white text-sm font-medium" numberOfLines={1}>
                          {file.documentName}
                        </Text>
                        <Text className="text-neutral-500 text-xs">
                          {formatFileSize(file.cloudinary?.bytes || 0)} • {formatDate(file.uploadedAt)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#737373" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="items-center py-8 mt-2 border-t border-neutral-800">
                  <Ionicons name="cloud-upload-outline" size={40} color="#4b5563" />
                  <Text className="text-neutral-400 text-base mt-2">No recent uploads</Text>
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