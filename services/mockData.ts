
import type { UserProfile, Task, Challenge, Notification, PrayerRequest, StudyProgress, Event, Message, Badge, StoreItem } from '../types';

export const mockBadges: Badge[] = [
    { id: '1', name: 'Early Bird', icon: '☀️', description: 'Completed a task before 8 AM.' },
    { id: '2', name: 'Prayer Warrior', icon: '🙏', description: 'Prayed for 10 requests.' },
    { id: '3', name: 'Bible Scholar', icon: '📖', description: 'Completed the book of John.' },
    { id: '4', name: 'Community Pillar', icon: '🤝', description: 'Attended 5 fellowship events.' },
];

export const mockUserProfile: UserProfile = {
  id: 'user-123',
  name: 'John Doe',
  avatarUrl: 'https://picsum.photos/seed/johndoe/200',
  fellowshipPosition: 'Member',
  level: 12,
  department: 'University Fellowship',
  gender: 'Male',
  dob: '10-25',
  whatsapp: '+1 234 567 8900',
  hotline: '+1 987 654 3210',
  email: 'john.doe@example.com',
  coins: 1250,
  badges: mockBadges,
};

export const mockDailyTasks: Task[] = [
  { id: 'task-1', title: 'Morning Devotion', description: 'Read Proverbs 1 and pray.', status: 'completed', dueDate: 'Today', coins: 10 },
  { id: 'task-2', title: 'Reach out to a friend', description: 'Call or text someone from the fellowship.', status: 'pending', dueDate: 'Today', coins: 15 },
  { id: 'task-3', title: 'Scripture Memorization', description: 'Memorize John 3:16.', status: 'pending', dueDate: 'Today', coins: 20 },
];

export const mockWeeklyChallenge: Challenge = {
  id: 'challenge-1',
  title: 'Book of Psalms Reading Challenge',
  description: 'Read 5 chapters of Psalms this week.',
  endDate: 'In 4 days',
  progress: 60,
  totalParticipants: 45,
};

export const mockLeaderboard: (Omit<UserProfile, 'badges' | 'dob' | 'email' | 'whatsapp' | 'hotline' | 'gender' | 'department' | 'fellowshipPosition'>)[] = [
  { id: 'user-1', name: 'Sarah Lee', avatarUrl: 'https://picsum.photos/seed/sarah/100', level: 15, coins: 2100 },
  { id: 'user-2', name: 'Michael Chen', avatarUrl: 'https://picsum.photos/seed/michael/100', level: 14, coins: 1850 },
  { id: 'user-123', name: 'John Doe', avatarUrl: 'https://picsum.photos/seed/johndoe/100', level: 12, coins: 1250 },
  { id: 'user-4', name: 'Emily White', avatarUrl: 'https://picsum.photos/seed/emily/100', level: 11, coins: 1100 },
  { id: 'user-5', name: 'David Kim', avatarUrl: 'https://picsum.photos/seed/david/100', level: 10, coins: 950 },
];

export const mockNotifications: Notification[] = [
  { id: 'notif-1', type: 'new_post', message: 'A new event "Worship Night" has been posted.', timestamp: '2 hours ago', read: false },
  { id: 'notif-2', type: 'task', message: 'Your daily tasks have been assigned.', timestamp: '8 hours ago', read: false },
  { id: 'notif-3', type: 'comment', message: 'Sarah commented on your prayer request.', timestamp: '1 day ago', read: true },
  { id: 'notif-4', type: 'custom', message: 'Reminder: Small group meeting tonight at 7 PM.', timestamp: '2 days ago', read: true },
];

export const mockPrayerRequests: PrayerRequest[] = [
  { id: 'pray-1', author: 'Anna Smith', authorAvatar: 'https://picsum.photos/seed/anna/100', request: 'Please pray for my upcoming exams, that I may have wisdom and peace.', timestamp: '5 hours ago', prayers: 12 },
  { id: 'pray-2', author: 'Mark Johnson', authorAvatar: 'https://picsum.photos/seed/mark/100', request: 'Praying for my family\'s health and protection.', timestamp: '1 day ago', prayers: 34 },
  { id: 'pray-3', author: 'You', authorAvatar: mockUserProfile.avatarUrl, request: 'Strength to overcome challenges this week.', timestamp: '3 days ago', prayers: 22 },
];

export const mockStudyProgress: StudyProgress[] = [
  { book: 'Genesis', chapters: 50, totalChapters: 50 },
  { book: 'John', chapters: 21, totalChapters: 21 },
  { book: 'Romans', chapters: 8, totalChapters: 16 },
  { book: 'Psalms', chapters: 75, totalChapters: 150 },
];

export const mockEvents: Event[] = [
  { id: 'event-1', title: 'Worship Night', date: '2024-07-28', time: '7:00 PM', location: 'Main Sanctuary', description: 'Join us for a night of worship and praise.' },
  { id: 'event-2', title: 'Small Group Leaders Meeting', date: '2024-08-02', time: '6:30 PM', location: 'Room 101', description: 'Planning for the upcoming month.' },
  { id: 'event-3', title: 'Community Outreach', date: '2024-08-10', time: '9:00 AM', location: 'Downtown Park', description: 'Serving the local community together.' },
];

export const mockMessages: Message[] = [
    { id: 'msg-1', senderId: 'user-2', senderName: 'Michael Chen', senderAvatar: 'https://picsum.photos/seed/michael/100', text: 'Hey John, are you going to the worship night this Friday?', timestamp: '10:30 AM' },
    { id: 'msg-2', senderId: 'user-123', senderName: 'John Doe', senderAvatar: mockUserProfile.avatarUrl, text: 'Yeah, I plan to! Looking forward to it. You?', timestamp: '10:31 AM' },
    { id: 'msg-3', senderId: 'user-2', senderName: 'Michael Chen', senderAvatar: 'https://picsum.photos/seed/michael/100', text: 'Definitely! See you there.', timestamp: '10:32 AM' },
];

export const mockStoreItems: StoreItem[] = [
    { id: 'item-1', name: 'Coffee with a Leader', description: 'Get a 30-minute coffee session with a fellowship leader.', cost: 500, icon: '☕' },
    { id: 'item-2', name: 'Fellowship T-Shirt', description: 'A custom-designed fellowship T-shirt.', cost: 1500, icon: '👕' },
    { id: 'item-3', name: 'Donate to Mission Fund', description: 'Contribute your coins to the mission fund.', cost: 100, icon: '❤️' },
    { id: 'item-4', name: 'Bookstore Voucher', description: 'A $5 voucher for the church bookstore.', cost: 750, icon: '📚' },
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
