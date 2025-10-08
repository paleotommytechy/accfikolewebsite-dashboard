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
  created_at: string;
  updated_at: string | null;
  coin_reward: number;
  time_gate_minutes?: number | null;
}

export interface TaskAssignment {
    id: string;
    task_id: string;
    assignee_id: string;
    status: 'assigned' | 'done';
    completed_at: string | null;
    created_at: string;
    due_date: string | null;
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
  has_quiz: boolean;
}

export interface WeeklyParticipant {
    id: string;
    challenge_id: string;
    user_id: string;
    progress: number;
    streak: number;
    joined_at: string;
    profiles?: { full_name: string | null; avatar_url: string | null; }; // For accountability feature
}

export interface CoinTransaction {
  id: number;
  user_id: string;
  source_type: 'task' | 'challenge' | 'admin_adjustment' | 'quiz';
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
  // NEW: Add 'like' to support notifications for post likes.
  type: 'new_user' | 'task_assigned' | 'task_completed' | 'coin_approved' | 'new_message' | 'custom' | 'new_post' | 'comment' | 'like';
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

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  url: string;
  thumbnail_url: string | null;
  created_at: string;
}

export interface ResourceCategory {
  id: string;
  name: string;
  created_at: string;
}

// --- NEW: Blog System Types ---
export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: 'Devotional' | 'Bible Study' | 'Announcement' | 'Other';
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  status: 'published' | 'draft';
  created_at: string;
  profiles: Pick<UserProfile, 'full_name' | 'avatar_url'>; // For author details
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  comment: string;
  created_at: string;
  profiles: Pick<UserProfile, 'full_name' | 'avatar_url'>; // For commenter details
}

export interface PostLike {
  post_id: string;
  user_id: string;
}

export interface PostBookmark {
  post_id: string;
  user_id: string;
}

// --- NEW: Gallery System Types ---
export interface GalleryPost {
  id: string;
  title: string;
  category: string;
  image_urls: string[];
  more_images_url?: string;
  author_id: string;
  created_at: string;
  profiles: Pick<UserProfile, 'full_name' | 'avatar_url'>;
}

// --- NEW: Academics System Types ---
export interface Faculty {
  id: string;
  name: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  faculty_id: string;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  level: number;
  department_id: string | null; // Can be null for general courses
  faculty_id: string | null; // For faculty-wide general courses
  is_general: boolean;
  created_at: string;
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  type: 'pdf_link' | 'drive_folder' | 'video_link' | 'text';
  url: string;
  description: string | null;
  created_at: string;
}

// --- NEW: Community-Uploaded Materials ---
export interface UserCourseMaterial {
  id: string;
  uploader_id: string;
  course_id: string;
  title: string;
  file_url: string;
  file_path: string;
  description: string | null;
  created_at: string;
  profiles?: Pick<UserProfile, 'full_name' | 'avatar_url'>; // For uploader details
}

export interface CourseBorrower {
    id: string;
    course_id: string;
    department_id: string;
}

// --- NEW: Gamification Types ---
export interface Verse {
  id: number;
  verse_reference: string;
  verse_text: string;
}

export interface UserVerseReward {
    id: number;
    user_id: string;
    verse_id: number;
    unlocked_at: string;
}

export interface Quiz {
    id: string;
    challenge_id: string;
    title: string;
    coin_reward: number;
    pass_threshold: number;
    created_at: string;
}

export interface QuizQuestion {
    id: string;
    quiz_id: string;
    question_text: string;
    options: string[];
    correct_option_index: number;
}

export interface QuizAttempt {
    id: string;
    user_id: string;
    quiz_id: string;
    score: number;
    passed: boolean;
    created_at: string;
}

// --- NEW: Giving/Donation System ---
export interface Donation {
  id: string;
  user_id: string;
  amount: number;
  fund_name: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  confirmed_at: string | null;
  profiles?: Pick<UserProfile, 'full_name' | 'avatar_url' | 'whatsapp'>;
}