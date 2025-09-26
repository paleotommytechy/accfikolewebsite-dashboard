import React from 'react';

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
  role: string;
}

export interface Task {
  id: string;
  title: string;
  frequency: 'daily' | 'once' | 'weekly';
  details: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
  coin_reward: number;
}

export interface TaskAssignment {
    id: string;
    task_id: string;
    assignee_id: string;
    status: 'assigned' | 'done';
    completed_at: string | null;
    created_at: string;
    tasks?: Task; // for joins
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  details: string | null;
  start_date: string | null;
  due_date: string | null;
  rules: string | null;
  created_at: string;
  coin_reward: number;
}

export interface WeeklyParticipant {
    id: string;
    challenge_id: string;
    user_id: string;
    progress: number;
    streak: number;
    joined_at: string;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  source_type: 'task' | 'challenge' | 'admin_adjustment';
  source_id: string;
  coin_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reason?: string | null;
  tasks?: { title: string };
  weekly_challenges?: { title: string };
  profiles?: { full_name: string | null; avatar_url?: string | null };
}

// FIX: Add DetailedNotification interface to resolve import error in mockData.ts
export interface DetailedNotification {
  id: string;
  type: 'system' | 'follow' | 'comment' | 'like' | 'invite';
  user: {
    name: string;
    avatarUrl: string;
  };
  time: string;
  ago: string;
  isRead: boolean;
  comment?: string;
  postTitle?: string;
  dashboardName?: string;
  category: 'all' | 'followers' | 'mentions' | 'invites';
}

export interface Notification {
  id: string;
  user_id: string;
  // FIX: Add 'new_post' and 'comment' to the type union to allow for more notification types used in mock data.
  type: 'new_user' | 'task_assigned' | 'task_completed' | 'coin_approved' | 'new_message' | 'custom' | 'new_post' | 'comment';
  message: string;
  metadata: Record<string, any> | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Event {
  id:string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image_url?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string | null;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
  is_read?: boolean;
  message_type?: 'text' | 'audio';
  media_url?: string | null;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export interface Scripture {
  id: string;
  verse_reference: string;
  verse_text: string;
  date_for: string; // YYYY-MM-DD
  set_by?: string;
  created_at: string;
}

// FIX: Add missing PrayerRequest interface.
export interface PrayerRequest {
  id: string;
  request: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  prayers: number;
}

// FIX: Add missing StudyProgress interface.
export interface StudyProgress {
  book: string;
  chapters: number;
  total_chapters: number;
}

export interface ChatHistoryItem {
  other_user_id: string;
  other_user_name: string | null;
  other_user_avatar: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count: number;
}