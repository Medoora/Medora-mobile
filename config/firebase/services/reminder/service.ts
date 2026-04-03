import { db } from "@/config/firebase/config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

export const markReminderNotified = async (id: string) => {
  try {
    await updateDoc(doc(db, "reminders", id), {
      notified: true,
    });
  } catch (error) {
    console.error("Error marking reminder notified:", error);
  }
};

// 📌 CREATE
export const createReminder = async (data: any) => {
  try {
    const ref = collection(db, "reminders");
    await addDoc(ref, {
      ...data,
      status: "active",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error creating reminder:", error);
    throw error;
  }
};

// 📌 GET USER REMINDERS
export const getUserReminders = async (userId: string) => {
  // ✅ Add validation - return empty array if no userId
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
    return []; // ✅ Return empty array on error instead of throwing
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
    await deleteDoc(ref);
  } catch (error) {
    console.error("Error deleting reminder:", error);
  }
};