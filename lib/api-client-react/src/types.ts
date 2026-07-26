export interface User {
  id: string;
  email: string;
  name: string;
  role: "creator" | "editor";
  inviteCode?: string;
  plan?: "free" | "starter" | "pro";
  planActivatedAt?: string;
  solanaWalletAddress?: string;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  tags: string[];
  videoUrl: string;
  hasFile?: boolean;
  thumbnailUrl?: string;
  status: "pending" | "approved" | "rejected" | "uploaded";
  creatorId: string;
  editorId: string;
  rejectionFeedback?: string;
  fileSize?: number;
  duration?: number;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  // Solana editor payment
  editorBountyLamports?: number;
  editorPaymentTxSig?: string;
  editorPaymentStatus?: "none" | "pending" | "paid" | "failed";
  // Solana approval receipt (SPL Memo)
  approvalTxSig?: string;
  approvalVideoHash?: string;
  approvalReceiptStatus?: "pending" | "confirmed" | "failed";
  createdAt: string;
  updatedAt: string;
  creator?: Pick<User, "id" | "email" | "name" | "role" | "createdAt">;
  editor?: Pick<User, "id" | "email" | "name" | "role" | "createdAt">;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  videoId?: string;
  read: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: "creator" | "editor";
}

export interface AuthResponse {
  user: User;
  token: string;
}
