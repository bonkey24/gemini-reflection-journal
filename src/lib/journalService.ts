import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import type { JournalEntry, JournalMessage } from "../types";

/**
 * Strips all undefined properties from objects recursively before Firestore ingestion.
 */
function sanitizePayload<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
}

/**
 * Fetches all isolated journal entries for a given user.
 */
export async function getUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];
  
  try {
    const entriesRef = collection(db, "users", userId, "interactions");
    const q = query(entriesRef, orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);

    const entries: JournalEntry[] = [];
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      entries.push({
        id: docSnapshot.id,
        userId: data.userId || userId,
        title: data.title || "Untitled Reflection",
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        mode: data.mode || "deep-reflection",
        summary: data.summary || "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        messages: Array.isArray(data.messages) ? data.messages : []
      });
    });

    return entries;
  } catch (error) {
    console.error(`Error loading journal entries for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Saves or updates a journal entry in Firestore isolated user storage.
 */
export async function saveUserEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId || !entry.id) {
    throw new Error("Cannot save entry without valid userId and entry.id");
  }

  try {
    const entryDocRef = doc(db, "users", userId, "interactions", entry.id);
    const sanitizedData = sanitizePayload({
      ...entry,
      userId,
      updatedAt: new Date().toISOString(),
      firestoreSyncedAt: new Date().toISOString()
    });

    await setDoc(entryDocRef, sanitizedData, { merge: true });
  } catch (error) {
    console.error(`Error saving entry ${entry.id} for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Deletes a journal entry for a user.
 */
export async function deleteUserEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  try {
    const entryDocRef = doc(db, "users", userId, "interactions", entryId);
    await deleteDoc(entryDocRef);
  } catch (error) {
    console.error(`Error deleting entry ${entryId} for user ${userId}:`, error);
    throw error;
  }
}
