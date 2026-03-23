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

import { db } from "@/config/firebase/config";

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
  const ref = collection(db, "reminders");

  await addDoc(ref, {
    ...data,
    status: "active",
    createdAt: new Date(),
  });
};

// 📌 GET USER REMINDERS
export const getUserReminders = async (userId: string) => {
  const ref = collection(db, "reminders");

  const q = query(ref, where("userId", "==", userId));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

// 📌 UPDATE STATUS
export const updateReminderStatus = async (id: string, status: string) => {
  const ref = doc(db, "reminders", id);

  await updateDoc(ref, { status });
};

// 📌 DELETE
export const deleteReminder = async (id: string) => {
  const ref = doc(db, "reminders", id);

  await deleteDoc(ref);
};
