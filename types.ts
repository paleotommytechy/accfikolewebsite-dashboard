
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
  source_type: 'task' | 'challenge';
  source_id: string;
  coin_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  tasks?: { title: string };
  weekly_challenges?: { title: string };
  profiles?: { full_name: string | null; avatar_url?: string | null };
}

export interface Notification {
  id: string;
  type: 'new_post' | 'comment' | 'custom' | 'task';
  message: string;
  created_at: string;
  read: boolean;
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
  receiver_id: string;
  text: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
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