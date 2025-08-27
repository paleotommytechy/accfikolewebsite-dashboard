
// FIX: Add StudyProgress to the type import to support mockStudyProgress.
import type { UserProfile, Notification, Event, Message, StoreItem, StudyProgress } from '../types';

export const mockUserProfile: UserProfile = {
  id: 'user-123',
  full_name: 'John Doe',
  avatar_url: 'https://picsum.photos/seed/johndoe/200',
  fellowship_position: 'Member',
  level: 12,
  department: 'ACCF Ikole Campus',
  gender: 'Male',
  dob: '10-25',
  whatsapp: '+1 234 567 8900',
  hotline: '+1 987 654 3210',
  email: 'john.doe@example.com',
  coins: 1250,
  role: 'member',
};


export const mockLeaderboard: (Omit<UserProfile, 'badges' | 'dob' | 'email' | 'whatsapp' | 'hotline' | 'gender' | 'department' | 'fellowship_position' | 'role'>)[] = [
  { id: 'user-1', full_name: 'Sarah Lee', avatar_url: 'https://picsum.photos/seed/sarah/100', level: 15, coins: 2100 },
  { id: 'user-2', full_name: 'Michael Chen', avatar_url: 'https://picsum.photos/seed/michael/100', level: 14, coins: 1850 },
  { id: 'user-123', full_name: 'John Doe', avatar_url: 'https://picsum.photos/seed/johndoe/100', level: 12, coins: 1250 },
  { id: 'user-4', full_name: 'Emily White', avatar_url: 'https://picsum.photos/seed/emily/100', level: 11, coins: 1100 },
  { id: 'user-5', full_name: 'David Kim', avatar_url: 'https://picsum.photos/seed/david/100', level: 10, coins: 950 },
];

export const mockNotifications: Notification[] = [
  { id: 'notif-1', type: 'new_post', message: 'A new event "Worship Night" has been posted.', created_at: '2 hours ago', read: false },
  { id: 'notif-2', type: 'task', message: 'Your daily tasks have been assigned.', created_at: '8 hours ago', read: false },
  { id: 'notif-3', type: 'comment', message: 'Sarah commented on your prayer request.', created_at: '1 day ago', read: true },
  { id: 'notif-4', type: 'custom', message: 'Reminder: Small group meeting tonight at 7 PM.', created_at: '2 days ago', read: true },
];

export const mockEvents: Event[] = [
  { id: 'event-1', title: 'Worship Night', date: '2024-07-28', time: '7:00 PM', location: 'Main Sanctuary', description: 'Join us for a night of worship and praise.' },
  { id: 'event-2', title: 'Small Group Leaders Meeting', date: '2024-08-02', time: '6:30 PM', location: 'Room 101', description: 'Planning for the upcoming month.' },
  { id: 'event-3', title: 'Community Outreach', date: '2024-08-10', time: '9:00 AM', location: 'Downtown Park', description: 'Serving the local community together.' },
];

export const mockMessages: Message[] = [
    { id: 'msg-1', sender_id: 'user-2', receiver_id: 'user-123', sender_name: 'Michael Chen', sender_avatar: 'https://picsum.photos/seed/michael/100', text: 'Hey John, are you going to the worship night this Friday?', created_at: '10:30 AM' },
    { id: 'msg-2', sender_id: 'user-123', receiver_id: 'user-2', sender_name: 'John Doe', sender_avatar: mockUserProfile.avatar_url, text: 'Yeah, I plan to! Looking forward to it. You?', created_at: '10:31 AM' },
    { id: 'msg-3', sender_id: 'user-2', receiver_id: 'user-123', sender_name: 'Michael Chen', sender_avatar: 'https://picsum.photos/seed/michael/100', text: 'Definitely! See you there.', created_at: '10:32 AM' },
];

export const mockStoreItems: StoreItem[] = [
    { id: 'item-1', name: 'Coffee with a Leader', description: 'Get a 30-minute coffee session with a fellowship leader.', cost: 500, icon: '☕' },
    { id: 'item-2', name: 'Fellowship T-Shirt', description: 'A custom-designed fellowship T-shirt.', cost: 1500, icon: '👕' },
    { id: 'item-3', name: 'Donate to Mission Fund', description: 'Contribute your coins to the mission fund.', cost: 100, icon: '❤️' },
    { id: 'item-4', name: 'Bookstore Voucher', description: 'A $5 voucher for the church bookstore.', cost: 750, icon: '📚' },
];

// FIX: Added missing mockStudyProgress to resolve import error in pages/BibleStudy.tsx.
export const mockStudyProgress: StudyProgress[] = [
    { book: 'Genesis', chapters: 25, total_chapters: 50 },
    { book: 'Psalms', chapters: 90, total_chapters: 150 },
    { book: 'John', chapters: 15, total_chapters: 21 },
    { book: 'Romans', chapters: 8, total_chapters: 16 },
];

export const mockAnalyticsData = {
    taskCompletion: [
        { name: 'Week 1', completed: 35, assigned: 50 },
        { name: 'Week 2', completed: 42, assigned: 50 },
        { name: 'Week 3', completed: 38, assigned: 50 },
        { name: 'Week 4', completed: 45, assigned: 50 },
    ],
    engagement: [
        { name: 'Tasks', value: 400 },
        { name: 'Events', value: 300 },
        { name: 'Prayers', value: 300 },
        { name: 'Messages', value: 200 },
    ],
};
