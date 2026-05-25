import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Timestamp } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  createReminder,
  deleteReminder,
  getUserReminders,
  updateReminderStatus,
} from "@/config/firebase/services/reminder/service";
import { useAppTheme } from "@/context/theme-context";
import { useAuth } from "@/hooks/auth/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ReminderScreen() {
  const { user } = useAuth();
  const { isDark } = useAppTheme();
  
  const scrollY = useRef(new Animated.Value(0)).current;

  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const [title, setTitle] = useState("");
  const [doctor, setDoctor] = useState("");
  const [reminderBefore, setReminderBefore] = useState("30");
  const [notes, setNotes] = useState("");

  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);

  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  // Theme-aware colors
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const cardBg = isDark ? 'bg-neutral-900' : 'bg-gray-100';
  const borderColor = isDark ? 'border-neutral-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-400' : 'text-gray-500';
  const textTertiary = isDark ? 'text-neutral-500' : 'text-gray-400';
  const inputBg = isDark ? 'bg-neutral-800' : 'bg-gray-200';

  // Get user's selected sound preference
  const getUserSelectedSound = async (): Promise<string> => {
    try {
      const savedSound = await AsyncStorage.getItem('notification_sound');
      return savedSound || 'default';
    } catch (error) {
      return 'default';
    }
  };

  // Fetch reminders
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const data = await getUserReminders(user.uid);
      setReminders(data);
    };

    load();
  }, [user]);

  // Save reminder with push notification
  const handleSave = async () => {
    if (!user || !title || !doctor || !date || !time) return;

    setLoading(true);

    const appointmentDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes()
    );

    const sendAt = new Date(
      appointmentDate.getTime() - Number(reminderBefore) * 60000
    );

    await createReminder({
      userId: user.uid,
      userEmail: user.email,
      title,
      doctor,
      notes,
      appointmentDate: Timestamp.fromDate(appointmentDate),
      reminderBeforeMinutes: Number(reminderBefore),
      sendAt: Timestamp.fromDate(sendAt),
    });

    const updated = await getUserReminders(user.uid);
    setReminders(updated);

    // Reset form
    setTitle("");
    setDoctor("");
    setNotes("");
    setReminderBefore("30");
    setDate(null);
    setTime(null);

    setLoading(false);
    Alert.alert('Success', 'Reminder created! You will be notified.');
  };

  const filtered = reminders.filter((r) => {
    if (activeTab === "active") return r.status === "active";
    if (activeTab === "completed") return r.status === "completed";
    if (activeTab === "missed") return r.status === "missed";
    return false;
  });

  const formatDate = (d: Date | null) =>
    d ? d.toLocaleDateString() : "dd-mm-yyyy";

  const formatTime = (t: Date | null) =>
    t
      ? t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--";

  return (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      className={`flex-1 ${bgColor}`}
    >
      <View className={`pb-24 px-4 pt-4 ${bgColor}`}>
        {/* FORM */}
        <View className={`${cardBg} p-5 rounded-2xl border ${borderColor} mb-6`}>
          <Text className={`${textPrimary} font-semibold text-lg mb-1`}>
            Create Reminder
          </Text>
          <Text className={`${textSecondary} text-sm mb-5`}>
            Set your next appointment alert.
          </Text>

          <Text className={`${textSecondary} text-sm mb-1`}>Title *</Text>
          <TextInput
            placeholder="e.g. MRI Scan"
            placeholderTextColor="#6b7280"
            value={title}
            onChangeText={setTitle}
            className={`${inputBg} ${textPrimary} px-4 py-3 rounded-xl mb-4`}
          />

          <Text className={`${textSecondary} text-sm mb-1`}>
            Doctor / Hospital *
          </Text>
          <TextInput
            placeholder="Dr. Rao"
            placeholderTextColor="#6b7280"
            value={doctor}
            onChangeText={setDoctor}
            className={`${inputBg} ${textPrimary} px-4 py-3 rounded-xl mb-4`}
          />

          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => setShowDate(true)}
              className={`flex-1 ${inputBg} rounded-xl px-4 py-3 flex-row items-center justify-between`}
            >
              <Text className={textPrimary}>{formatDate(date)}</Text>
              <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTime(true)}
              className={`flex-1 ${inputBg} rounded-xl px-4 py-3 flex-row items-center justify-between`}
            >
              <Text className={textPrimary}>{formatTime(time)}</Text>
              <Ionicons name="time-outline" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {showDate && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display="default"
              onChange={(e, selected) => {
                setShowDate(false);
                if (selected) setDate(selected);
              }}
            />
          )}

          {showTime && (
            <DateTimePicker
              value={time || new Date()}
              mode="time"
              display="default"
              onChange={(e, selected) => {
                setShowTime(false);
                if (selected) setTime(selected);
              }}
            />
          )}

          <Text className={`${textSecondary} text-sm mb-1`}>
            Reminder Before (minutes) *
          </Text>
          <TextInput
            value={reminderBefore}
            onChangeText={setReminderBefore}
            keyboardType="numeric"
            className={`${inputBg} ${textPrimary} px-4 py-3 rounded-xl mb-4`}
          />

          <Text className={`${textSecondary} text-sm mb-1`}>
            Notes (Optional)
          </Text>
          <TextInput
            placeholder="Preparation instructions..."
            placeholderTextColor="#6b7280"
            value={notes}
            onChangeText={setNotes}
            multiline
            className={`${inputBg} ${textPrimary} px-4 py-3 rounded-xl mb-5`}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className={`py-3 rounded-xl items-center ${loading ? inputBg : 'bg-white'}`}
          >
            <Text className={`font-medium ${loading ? textSecondary : 'text-black'}`}>
              {loading ? "Saving..." : "Save Reminder"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View className={`flex-row ${cardBg} p-1 rounded-xl border ${borderColor} mb-4`}>
          {["active", "completed", "missed"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === tab ? (isDark ? 'bg-neutral-800' : 'bg-gray-300') : ''
              }`}
            >
              <Text className={`text-center ${textSecondary} capitalize`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST */}
        <View className="mt-2">
          {filtered.length === 0 ? (
            <View className={`${cardBg} p-8 rounded-2xl border ${borderColor} items-center`}>
              <Ionicons
                name="notifications-off-outline"
                size={44}
                color="#4b5563"
              />
              <Text className={`${textSecondary} mt-4 text-base font-medium`}>
                No reminders yet
              </Text>
              <Text className={`${textTertiary} text-sm mt-1 text-center`}>
                Create your first reminder to stay on track
              </Text>
            </View>
          ) : (
            filtered.map((item) => {
              const appointmentDate = item?.appointmentDate?.toDate?.();
              const isToday =
                appointmentDate && new Date().toDateString() === appointmentDate.toDateString();
              const isTomorrow =
                appointmentDate &&
                new Date(Date.now() + 86400000).toDateString() === appointmentDate.toDateString();

              const borderColorStyle = isToday
                ? "border-red-500"
                : isTomorrow
                  ? "border-yellow-500"
                  : borderColor;

              const badgeBg = isToday
                ? "bg-red-500/20"
                : isTomorrow
                  ? "bg-yellow-500/20"
                  : (isDark ? "bg-neutral-800" : "bg-gray-300");
              
              const badgeText = isToday
                ? "text-red-400"
                : isTomorrow
                  ? "text-yellow-400"
                  : (isDark ? "text-neutral-400" : "text-gray-600");

              return (
                <View
                  key={item.id}
                  className={`${cardBg} p-5 rounded-2xl border ${borderColorStyle} mb-4`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-3">
                      <Text className={`${textPrimary} font-semibold text-base`}>
                        {item.title}
                      </Text>
                      {item.doctor && (
                        <Text className={`${textSecondary} text-xs mt-1`}>
                          {item.doctor}
                        </Text>
                      )}
                    </View>
                    <View className={`px-2 py-1 rounded-md ${badgeBg}`}>
                      <Text className={`text-xs font-medium ${badgeText}`}>
                        {isToday
                          ? "Today"
                          : isTomorrow
                            ? "Tomorrow"
                            : "Upcoming"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mt-3">
                    <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                    <Text className={`${textSecondary} text-xs ml-2`}>
                      {appointmentDate?.toLocaleString()}
                    </Text>
                  </View>

                  {item.notes && (
                    <Text className={`${textTertiary} text-xs mt-3`}>
                      {item.notes}
                    </Text>
                  )}

                  <View className="flex-row justify-between mt-5">
                    <TouchableOpacity
                      onPress={async () => {
                        if (!user) return;
                        await updateReminderStatus(item.id, "completed");
                        const updated = await getUserReminders(user.uid);
                        setReminders(updated);
                      }}
                      className={`flex-1 border ${borderColor} py-2 rounded-lg mr-2 items-center`}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle-outline" size={16} color="#9ca3af" />
                        <Text className={`${textSecondary} text-xs ml-1`}>
                          Complete
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={async () => {
                        if (!user) return;
                        await deleteReminder(item.id);
                        const updated = await getUserReminders(user.uid);
                        setReminders(updated);
                      }}
                      className="flex-1 bg-red-500 py-2 rounded-lg ml-2 items-center"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                        <Text className="text-white text-xs ml-1">Delete</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </Animated.ScrollView>
  );
}