export interface JournalMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string; // ISO string
}

export type ReflectionMode = "deep-reflection" | "executive-summary" | "brainstorming" | "mindful-inquiry" | "action-steps";

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  mode: ReflectionMode;
  summary?: string;
  tags?: string[];
  sentimentScore?: number; // 1-10
  actionableSteps?: string[];
  completedActionSteps?: string[];
  messages: JournalMessage[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export interface GeminiReflectRequest {
  mode: ReflectionMode;
  entryTitle?: string;
  currentMessage: string;
  conversationHistory: Array<{
    role: "user" | "model";
    content: string;
  }>;
}

export interface GeminiReflectResponse {
  reply: string;
  summary?: string;
  entryTitle?: string;
  suggestedTags?: string[];
  suggestedFollowUps?: string[];
  sentimentScore?: number;
  actionableSteps?: string[];
  modelUsed: string;
}
