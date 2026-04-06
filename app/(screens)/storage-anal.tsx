import DashboardWrapper from '@/components/wrapper/dashboard-wrapper';
import { getUserDocuments } from '@/config/firebase/services/dashboard/documents';
import { StorageService, UserStorage } from "@/config/firebase/services/storage-tracker/service";
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface FileTypeStats {
  type: string;
  count: number;
  size: number;
  color: string;
  icon: string;
  gradientStart: string;
  gradientEnd: string;
}

///////////////////////
// 🔥 Skeleton Loader
///////////////////////
const SkeletonLoader = () => {
  return (
    <View className="flex-1 bg-black px-4 pt-10">

      {/* Rings */}
      <View className="items-center mb-10">
        <View className="w-[200px] h-[200px] rounded-full bg-neutral-800/40" />
      </View>

      {/* Card */}
      <View className="bg-neutral-900 rounded-2xl p-4 mb-6 flex-row justify-between">
        {[1,2,3].map(i => (
          <View key={i} className="items-center">
            <View className="w-12 h-4 bg-neutral-800 rounded mb-2" />
            <View className="w-16 h-6 bg-neutral-800 rounded" />
          </View>
        ))}
      </View>

      {/* List */}
      {[1,2,3].map(i => (
        <View key={i} className="flex-row items-center p-4 mb-3 bg-neutral-900 rounded-2xl">
          <View className="w-12 h-12 rounded-xl bg-neutral-800" />
          <View className="ml-4 flex-1">
            <View className="w-32 h-4 bg-neutral-800 rounded mb-2" />
            <View className="w-24 h-3 bg-neutral-800 rounded mb-2" />
            <View className="w-full h-2 bg-neutral-800 rounded-full" />
          </View>
        </View>
      ))}

    </View>
  );
};

///////////////////////
// 🔥 Ring Component
///////////////////////
const Ring = ({ size, strokeWidth, progress, color }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      {/* background */}
      <Circle
        stroke="#1f1f1f"
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />

      {/* progress */}
      <Circle
        stroke={color}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
};

///////////////////////
// 🔥 Main Component
///////////////////////
const StorageAnal = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<UserStorage | null>(null);
  const [fileTypeStats, setFileTypeStats] = useState<FileTypeStats[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);

  useEffect(() => {
    if (user?.uid) loadStorageData();
  }, [user]);

  const loadStorageData = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const storage = await StorageService.getUserStorage(user.uid);
      setStorageInfo(storage);

      const docs = await getUserDocuments(user.uid);
      setTotalFiles(docs.length);

      const map = new Map<string, { count: number; size: number }>();

      const types = ['Images', 'PDF', 'Documents', 'Spreadsheets'];
      types.forEach(t => map.set(t, { count: 0, size: 0 }));

      docs.forEach((doc: any) => {
        const type = doc.fileInfo?.type || doc.cloudinary?.format || '';
        const size = doc.cloudinary?.bytes || 0;

        let category = 'Other';

        if (type.includes('image') || ['jpg','png','jpeg'].includes(type)) category = 'Images';
        else if (type === 'pdf') category = 'PDF';
        else if (['doc','docx'].includes(type)) category = 'Documents';
        else if (['xls','xlsx'].includes(type)) category = 'Spreadsheets';

        if (map.has(category)) {
          const prev = map.get(category)!;
          map.set(category, {
            count: prev.count + 1,
            size: prev.size + size,
          });
        }
      });

      const config: any = {
        Images: { color: '#10b981', icon: 'image-outline', g1: '#10b981', g2: '#34d399' },
        PDF: { color: '#ef4444', icon: 'document-text-outline', g1: '#ef4444', g2: '#f87171' },
        Documents: { color: '#3b82f6', icon: 'document-outline', g1: '#3b82f6', g2: '#60a5fa' },
        Spreadsheets: { color: '#f59e0b', icon: 'grid-outline', g1: '#f59e0b', g2: '#fbbf24' },
      };

      const stats = Array.from(map.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        size: data.size,
        color: config[type].color,
        icon: config[type].icon,
        gradientStart: config[type].g1,
        gradientEnd: config[type].g2,
      }));

      // ✅ REMOVE EMPTY TYPES (FIXED BUG)
      setFileTypeStats(stats.filter(s => s.count > 0));

    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const totalBytes = storageInfo?.totalBytes || 0;
  const quotaBytes = storageInfo?.quotaBytes || 500 * 1024 * 1024;
  const usedPercentage = totalBytes ? (totalBytes / quotaBytes) * 100 : 0;

  // ✅ FIXED LOGIC
  const getPercent = (type: string) => {
    const stat = fileTypeStats.find(s => s.type === type);
    if (!stat || quotaBytes === 0) return 0;
    return (stat.size / quotaBytes) * 100;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  ///////////////////////
  // LOADING UI
  ///////////////////////
  if (loading) {
    return (
      <DashboardWrapper title="Storage Analytics">
        <SkeletonLoader />
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper title="Storage Analytics">
      <ScrollView className="flex-1 bg-black">

        {/* 🔥 RINGS */}
        <View className="items-center mt-10 mb-8">
          <View className="relative items-center justify-center">

            <Ring size={200} strokeWidth={18} progress={usedPercentage} color="#3b82f6" />

            <View className="absolute">
              <Ring size={155} strokeWidth={16} progress={getPercent('Images')} color="#10b981" />
            </View>

            <View className="absolute">
              <Ring size={115} strokeWidth={14} progress={getPercent('PDF')} color="#ef4444" />
            </View>

            <View className="absolute">
              <Ring size={80} strokeWidth={12} progress={getPercent('Documents')} color="#f59e0b" />
            </View>

            {/* CENTER */}
            <View className="absolute items-center">
              <Text className="text-white text-3xl font-bold">
                {Math.round(usedPercentage)}%
              </Text>
              <Text className="text-neutral-500 text-xs">Used</Text>
            </View>

          </View>
        </View>

        {/* 🔥 STORAGE CARD */}
        <View className="mx-4 mb-6 bg-neutral-900 rounded-2xl p-4 flex-row justify-between">

          <View>
            <Text className="text-neutral-400 text-xs">Total Files</Text>
            <Text className="text-white text-lg font-semibold">{totalFiles}</Text>
          </View>

          <View>
            <Text className="text-neutral-400 text-xs">Used</Text>
            <Text className="text-white text-lg font-semibold">
              {formatFileSize(totalBytes)}
            </Text>
          </View>

          <View>
            <Text className="text-neutral-400 text-xs">Free</Text>
            <Text className="text-white text-lg font-semibold">
              {formatFileSize(quotaBytes - totalBytes)}
            </Text>
          </View>

        </View>

        {/* 🔥 LIST */}
        <View className="px-4">
          {fileTypeStats.map(stat => (
            <View key={stat.type} className="flex-row items-center p-4 mb-3 bg-neutral-900 rounded-2xl">

              <LinearGradient
                colors={[stat.gradientStart, stat.gradientEnd] as [string, string]}
                style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name={stat.icon as any} size={20} color="white" />
              </LinearGradient>

              <View className="ml-4 flex-1">
                <Text className="text-white">{stat.type}</Text>

                <Text className="text-neutral-400 text-xs">
                  {stat.count} files • {formatFileSize(stat.size)} • {Math.round(getPercent(stat.type))}%
                </Text>

                <View className="h-2 bg-neutral-800 rounded-full mt-3 overflow-hidden">
                  <LinearGradient
                    colors={[stat.gradientStart, stat.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: `${getPercent(stat.type)}%`,
                      height: '100%',
                      borderRadius: 999,
                    }}
                  />
                </View>
              </View>

            </View>
          ))}
        </View>

      </ScrollView>
    </DashboardWrapper>
  );
};

export default StorageAnal;