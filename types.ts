
export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  fellowship_position: string | null;
  level: number;
  department: string | null;
  gender: 'Male' | 'Female' | 'Other' | null;
  dob: string | null; // MM-DD format
  whatsapp: string | null;
  hotline: string | null;
  email: string;
  coins: number;
  badges: Badge[]; // In a real app, this would be a join from a separate table
  role: 'admin' | 'member';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  due_date: string;
  coins: number;
  assigned_to: string; // The user ID this task is for.
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  end_date: string;
  progress: number; // 0-100
  total_participants: number;
}

export interface Notification {
  id: string;
  type: 'new_post' | 'comment' | 'custom' | 'task';
  message: string;
  created_at: string;
  read: boolean;
}

export interface PrayerRequest {
  id: string;
  author_id: string;
  author_name: string; // denormalized for easier display
  author_avatar: string | null; // denormalized for easier display
  request: string;
  created_at: string;
  prayers: number;
}

export interface StudyProgress {
  id: string;
  user_id: string;
  book: string;
  chapters: number;
  total_chapters: number;
}

export interface Event {
  id:string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
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

// Types for Developer Settings
export interface AppSettings {
  id: number;
  scripture_of_the_day: string | null;
  created_at: string;
}

export interface GroupChallenge {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MasterTask {
    id: string;
    title: string;
    description: string | null;
    created_by: string | null;
    created_at: string;
}
