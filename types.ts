
export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  fellowshipPosition: string;
  level: number;
  department: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string; // MM-DD format
  whatsapp: string;
  hotline: string;
  email: string;
  coins: number;
  badges: Badge[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  dueDate: string;
  coins: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  endDate: string;
  progress: number; // 0-100
  totalParticipants: number;
}

export interface Notification {
  id: string;
  type: 'new_post' | 'comment' | 'custom' | 'task';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface PrayerRequest {
  id: string;
  author: string;
  authorAvatar: string;
  request: string;
  timestamp: string;
  prayers: number;
}

export interface StudyProgress {
  book: string;
  chapters: number;
  totalChapters: number;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string; // emoji or component name
  description: string;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}
