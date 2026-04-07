// config/firebase/services/reminder/service.ts
import { db } from "@/config/firebase/config";
import { notificationService } from "@/config/firebase/services/notification/service";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

// Helper to get user's selected sound
const getUserSelectedSound = async (): Promise<string> => {
  try {
    const savedSound = await AsyncStorage.getItem('notification_sound');
    return savedSound || 'default';
  } catch (error) {
    return 'default';
  }
};

export const markReminderNotified = async (id: string) => {
  try {
    await updateDoc(doc(db, "reminders", id), {
      notified: true,
      notifiedAt: new Date(),
    });
  } catch (error) {
    console.error("Error marking reminder notified:", error);
  }
};

// 📌 CREATE - with sound support
export const createReminder = async (data: any, customSound?: string) => {
  try {
    const ref = collection(db, "reminders");
    const docRef = await addDoc(ref, {
      ...data,
      status: "active",
      notified: false,
      createdAt: new Date(),
    });

    // Schedule push notification if sendAt exists
    if (data.sendAt) {
      const sendAtDate = data.sendAt.toDate ? data.sendAt.toDate() : new Date(data.sendAt);
      
      // Get user's selected sound (priority: customSound > saved preference > default)
      let soundFile = customSound;
      if (!soundFile || soundFile === 'default') {
        soundFile = await getUserSelectedSound();
      }
      
      const notificationId = await notificationService.scheduleNotification(
        data.title,
        `🔔 ${data.title}${data.doctor ? ` with Dr. ${data.doctor}` : ''}`,
        sendAtDate,
        { reminderId: docRef.id, type: 'reminder' },
        soundFile
      );

      // Save notification ID to reminder
      await updateDoc(doc(db, "reminders", docRef.id), {
        notificationId,
      });
    }

    return docRef.id;
  } catch (error) {
    console.error("Error creating reminder:", error);
    throw error;
  }
};

// 📌 GET USER REMINDERS
export const getUserReminders = async (userId: string) => {
  if (!userId) {
    console.log('getUserReminders: No userId provided, returning empty array');
    return [];
  }
  
  try {
    const ref = collection(db, "reminders");
    const q = query(ref, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return [];
  }
};

// 📌 UPDATE STATUS
export const updateReminderStatus = async (id: string, status: string) => {
  try {
    const ref = doc(db, "reminders", id);
    await updateDoc(ref, { status });
  } catch (error) {
    console.error("Error updating reminder status:", error);
  }
};

// 📌 DELETE
export const deleteReminder = async (id: string) => {
  try {
    const ref = doc(db, "reminders", id);
    const reminderDoc = await getDoc(ref);
    const notificationId = reminderDoc.data()?.notificationId;

    // Cancel scheduled notification
    if (notificationId) {
      await notificationService.cancelScheduledNotification(notificationId);
    }

    await deleteDoc(ref);
  } catch (error) {
    console.error("Error deleting reminder:", error);
  }
};