import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Timestamp } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/hooks/auth/useAuth";

import {
  createReminder,
  deleteReminder,
  getUserReminders,
  updateReminderStatus,
} from "@/config/firebase/services/reminder/service";

export default function ReminderScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const { user } = useAuth();

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

  // 🔥 FETCH
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const data = await getUserReminders(user.uid);
      setReminders(data);
    };

    load();
  }, [user]);

  // 🔥 SAVE
  const handleSave = async () => {
    if (!user || !title || !doctor || !date || !time) return;

    setLoading(true);

    const appointmentDate = new Date(
      date.setHours(time.getHours(), time.getMinutes()),
    );

    const sendAt = new Date(
      appointmentDate.getTime() - Number(reminderBefore) * 60000,
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

    setTitle("");
    setDoctor("");
    setNotes("");
    setReminderBefore("30");

    setLoading(false);
  };

  const filtered = reminders.filter((r) => {
    if (activeTab === "active") return r.status === "active";
    if (activeTab === "completed") return r.status === "completed";
    if (activeTab === "missed") return r.status === "missed";
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
        { useNativeDriver: true },
      )}
      className="flex-1 bg-black"
    >
      <View className="pb-24 px-4 pt-4">
        {/* HEADER */}
        <View className="mb-6">
          <Text className="text-white text-2xl font-semibold">
            Appointment Alerts
          </Text>
          <Text className="text-neutral-400 mt-1">
            Schedule reminders for your medical appointments.
          </Text>
        </View>

        {/* FORM */}
        <View className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 mb-6">
          <Text className="text-white font-semibold text-lg mb-1">
            Create Reminder
          </Text>
          <Text className="text-neutral-400 text-sm mb-5">
            Set your next appointment alert.
          </Text>

          <Text className="text-neutral-300 text-sm mb-1">Title *</Text>
          <TextInput
            placeholder="e.g. MRI Scan"
            placeholderTextColor="#6b7280"
            value={title}
            onChangeText={setTitle}
            className="bg-neutral-800 text-white px-4 py-3 rounded-xl mb-4"
          />

          <Text className="text-neutral-300 text-sm mb-1">
            Doctor / Hospital *
          </Text>
          <TextInput
            placeholder="Dr. Rao"
            placeholderTextColor="#6b7280"
            value={doctor}
            onChangeText={setDoctor}
            className="bg-neutral-800 text-white px-4 py-3 rounded-xl mb-4"
          />

          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => setShowDate(true)}
              className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <Text className="text-white">{formatDate(date)}</Text>
              <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTime(true)}
              className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <Text className="text-white">{formatTime(time)}</Text>
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

          <Text className="text-neutral-300 text-sm mb-1">
            Reminder Before (minutes) *
          </Text>
          <TextInput
            value={reminderBefore}
            onChangeText={setReminderBefore}
            keyboardType="numeric"
            className="bg-neutral-800 text-white px-4 py-3 rounded-xl mb-4"
          />

          <Text className="text-neutral-300 text-sm mb-1">
            Notes (Optional)
          </Text>
          <TextInput
            placeholder="Preparation instructions..."
            placeholderTextColor="#6b7280"
            value={notes}
            onChangeText={setNotes}
            multiline
            className="bg-neutral-800 text-white px-4 py-3 rounded-xl mb-5"
          />

          <TouchableOpacity
            onPress={handleSave}
            className="bg-white py-3 rounded-xl items-center"
          >
            <Text className="text-black font-medium">
              {loading ? "Saving..." : "Save Reminder"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View className="flex-row bg-neutral-900 p-1 rounded-xl border border-neutral-800 mb-4">
          {["active", "completed", "missed"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === tab ? "bg-neutral-800" : ""
              }`}
            >
              <Text className="text-center text-neutral-300 capitalize">
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST */}
        <View className="mt-2">
          {filtered.length === 0 ? (
            <View className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 items-center">
              <Ionicons
                name="notifications-off-outline"
                size={44}
                color="#4b5563"
              />
              <Text className="text-neutral-300 mt-4 text-base font-medium">
                No reminders yet
              </Text>
              <Text className="text-neutral-500 text-sm mt-1 text-center">
                Create your first reminder to stay on track
              </Text>
            </View>
          ) : (
            filtered.map((item) => {
              const date = item?.appointmentDate?.toDate?.();

              const isToday =
                date && new Date().toDateString() === date.toDateString();

              const isTomorrow =
                date &&
                new Date(Date.now() + 86400000).toDateString() ===
                  date.toDateString();

              const borderColor = isToday
                ? "border-red-500"
                : isTomorrow
                  ? "border-yellow-500"
                  : "border-neutral-800";

              const badgeColor = isToday
                ? "bg-red-500/20 text-red-400"
                : isTomorrow
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-neutral-800 text-neutral-400";

              return (
                <View
                  key={item.id}
                  className={`bg-neutral-900 p-5 rounded-2xl border ${borderColor} mb-4`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-semibold text-base">
                        {item.title}
                      </Text>

                      {item.doctor && (
                        <Text className="text-neutral-400 text-xs mt-1">
                          {item.doctor}
                        </Text>
                      )}
                    </View>

                    <View className={`px-2 py-1 rounded-md ${badgeColor}`}>
                      <Text className="text-xs font-medium">
                        {isToday
                          ? "Today"
                          : isTomorrow
                            ? "Tomorrow"
                            : "Upcoming"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mt-3">
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#9ca3af"
                    />
                    <Text className="text-neutral-400 text-xs ml-2">
                      {date?.toLocaleString()}
                    </Text>
                  </View>

                  {item.notes && (
                    <Text className="text-neutral-500 text-xs mt-3">
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
                      className="flex-1 border border-neutral-700 py-2 rounded-lg mr-2 items-center"
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={16}
                          color="#9ca3af"
                        />
                        <Text className="text-neutral-300 text-xs ml-1">
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
