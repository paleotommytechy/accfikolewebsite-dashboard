// FIX: Import StudyProgress type
import type { UserProfile, Notification, Event, Message, StoreItem, StudyProgress, ChatHistoryItem, DetailedNotification } from '../types';

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

// FIX: Added missing user_id to mock notifications to satisfy the Notification interface.
export const mockNotifications: Notification[] = [
  { id: 'notif-1', user_id: 'user-123', type: 'new_post', message: 'A new event "Worship Night" has been posted.', created_at: '2024-07-28T10:00:00Z', read: false },
  { id: 'notif-2', user_id: 'user-123', type: 'task', message: 'Your daily tasks have been assigned.', created_at: '2024-07-28T02:00:00Z', read: false },
  { id: 'notif-3', user_id: 'user-123', type: 'comment', message: 'Sarah commented on your prayer request.', created_at: '2024-07-27T14:30:00Z', read: true },
  { id: 'notif-4', user_id: 'user-123', type: 'custom', message: 'Reminder: Small group meeting tonight at 7 PM.', created_at: '2024-07-26T09:00:00Z', read: true },
];

export const mockDetailedNotifications: DetailedNotification[] = [
  {
    id: '1', type: 'system',
    user: { name: 'ACCF Ikole', avatarUrl: 'https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg' },
    time: 'Thursday 4:21pm', ago: '1 hour ago', isRead: false,
    comment: 'Welcome to the ACCF Ikole family! We are glad to have you here.',
    category: 'all',
  },
  {
    id: '2', type: 'follow',
    user: { name: 'frankiesullivan', avatarUrl: 'https://i.pravatar.cc/150?u=frankie' },
    time: 'Thursday 4:20pm', ago: '2 hours ago', isRead: false,
    category: 'followers',
  },
  {
    id: '3', type: 'system',
    user: { name: 'System', avatarUrl: 'https://cdn-icons-png.flaticon.com/512/818/818434.png' },
    time: 'Thursday 3:15pm', ago: '3 hours ago', isRead: false,
    comment: 'Congratulations! 100 coins has been added to your coin store. You are on your way to level 2 properly winning a giveaway.',
    category: 'all',
  },
  {
    id: '4', type: 'comment',
    user: { name: 'eleanor_mac', avatarUrl: 'https://i.pravatar.cc/150?u=eleanor' },
    postTitle: 'your post',
    time: 'Thursday 3:12pm', ago: '3 hours ago', isRead: false,
    comment: 'Love the background on this! Would love to learn how you created the mesh gradient effect.',
    category: 'mentions',
  },
  {
    id: '5', type: 'like',
    user: { name: 'eleanor_mac', avatarUrl: 'https://i.pravatar.cc/150?u=eleanor' },
    postTitle: 'your post',
    time: 'Thursday 3:11pm', ago: '3 hours ago', isRead: true,
    category: 'mentions',
  },
  {
    id: '6', type: 'system',
    user: { name: 'System', avatarUrl: 'https://cdn-icons-png.flaticon.com/512/2928/2928853.png' },
    time: 'Thursday 3:00pm', ago: '3 hours ago', isRead: true,
    comment: 'Your weekly challenges have been assigned. Check them out now!',
    category: 'all',
  },
  {
    id: '7', type: 'invite',
    user: { name: 'ollie_diggs', avatarUrl: 'https://i.pravatar.cc/150?u=ollie' },
    dashboardName: 'Sisyphus Dashboard',
    time: 'Thursday 2:44pm', ago: '4 hours ago', isRead: true,
    category: 'invites',
  },
   {
    id: '8', type: 'system',
    user: { name: 'System', avatarUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135679.png' },
    time: 'Thursday 9:00am', ago: '7 hours ago', isRead: true,
    comment: 'Your daily tasks have been assigned. Keep up the good work!',
    category: 'all',
  },
];


export const mockEvents: Event[] = [
  { id: 'event-1', title: 'Worship Night', date: '2024-07-28', time: '7:00 PM', location: 'Main Sanctuary', description: 'Join us for a night of worship and praise.' },
  { id: 'event-2', title: 'Small Group Leaders Meeting', date: '2024-08-02', time: '6:30 PM', location: 'Room 101', description: 'Planning for the upcoming month.' },
  { id: 'event-3', title: 'Community Outreach', date: '2024-08-10', time: '9:00 AM', location: 'Downtown Park', description: 'Serving the local community together.' },
];

export const mockMessages: Message[] = [
    { id: 'msg-1', sender_id: 'user-2', receiver_id: 'user-123', sender_name: 'Michael Chen', sender_avatar: 'https://picsum.photos/seed/michael/100', text: 'Hey John, are you going to the worship night this Friday?', created_at: new Date(new Date().setHours(10, 30, 0, 0)).toISOString() },
    { id: 'msg-2', sender_id: 'user-123', receiver_id: 'user-2', sender_name: 'John Doe', sender_avatar: mockUserProfile.avatar_url, text: 'Yeah, I plan to! Looking forward to it. You?', created_at: new Date(new Date().setHours(10, 31, 0, 0)).toISOString() },
    { id: 'msg-3', sender_id: 'user-2', receiver_id: 'user-123', sender_name: 'Michael Chen', sender_avatar: 'https://picsum.photos/seed/michael/100', text: 'Definitely! See you there.', created_at: new Date(new Date().setHours(10, 32, 0, 0)).toISOString() },
];

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

export const mockChatHistory: ChatHistoryItem[] = [
    { other_user_id: 'user-ifeoluwa', other_user_name: 'Ifeoluwa (President)', other_user_avatar: 'https://picsum.photos/seed/ifeoluwa/100', last_message_text: 'The slides for the presentation are ready.', last_message_at: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(), unread_count: 0 },
    { other_user_id: 'user-ariyo', other_user_name: 'Pastor Ariyo', other_user_avatar: 'https://picsum.photos/seed/ariyo/100', last_message_text: 'Can we meet tomorrow to discuss the outreach?', last_message_at: yesterday.toISOString(), unread_count: 2 },
    { other_user_id: 'user-daniel', other_user_name: 'Daniel (Alumni-President)', other_user_avatar: 'https://picsum.photos/seed/daniel/100', last_message_text: 'Thanks for sending over the documents!', last_message_at: twoDaysAgo.toISOString(), unread_count: 0 },
    { other_user_id: 'user-gift', other_user_name: 'Gift (Worker)', other_user_avatar: 'https://picsum.photos/seed/gift/100', last_message_text: 'I have a question about the task assigned.', last_message_at: twoDaysAgo.toISOString(), unread_count: 0 },
    { other_user_id: 'user-toluwanimi', other_user_name: 'Toluwanimi', other_user_avatar: 'https://picsum.photos/seed/toluwanimi/100', last_message_text: 'Great job on the evangelism plan.', last_message_at: new Date('2024-03-15T10:00:00Z').toISOString(), unread_count: 0 },
];


export const mockStoreItems: StoreItem[] = [
    { id: 'item-1', name: 'Coffee with a Leader', description: 'Get a 30-minute coffee session with a fellowship leader.', cost: 500, icon: '☕' },
    { id: 'item-2', name: 'Fellowship T-Shirt', description: 'A custom-designed fellowship T-shirt.', cost: 1500, icon: '👕' },
    { id: 'item-3', name: 'Donate to Mission Fund', description: 'Contribute your coins to the mission fund.', cost: 100, icon: '❤️' },
    { id: 'item-4', name: 'Bookstore Voucher', description: 'A $5 voucher for the church bookstore.', cost: 750, icon: '📚' },
];

// FIX: Add missing mockStudyProgress data.
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
        { name: 'Messages', value: 200 },
        { name: 'Challenges', value: 250 },
    ],
};