export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
}

export interface Workspace {
  id: string; // Document ID in Firestore
  userId: string;
  name: string;
  createdAt: string;
}

export interface DocumentMeta {
  id: string; // Document ID in Firestore
  workspaceId: string;
  name: string;
  size?: number; // bytes
  createdAt: string;
}

export interface Chat {
  id: string;
  userId: string;
  workspaceId: string;
  title: string;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  sources?: string[]; // Array of chunk IDs or content that was referenced
}
