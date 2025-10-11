
import React from 'react';
import { HomeIcon, UserIcon, ClipboardListIcon, TrendingUpIcon, CalendarIcon, ChatIcon, ChartBarIcon, ShoppingCartIcon, CodeIcon, UsersIcon, BellIcon, GiftIcon, HeartIcon, SparklesIcon, BookOpenIcon, PencilAltIcon, CameraIcon, ArchiveIcon, MusicNoteIcon, QuestionMarkCircleIcon } from './components/ui/Icons';

export const NAV_LINKS = [
  { name: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
  { name: 'My Profile', href: '/profile', icon: <UserIcon /> },
  { name: 'Fellowship Blog', href: '/blog', icon: <BookOpenIcon /> },
  { name: 'Hymns', href: '/hymns', icon: <MusicNoteIcon /> },
  { name: 'Tasks & Challenges', href: '/tasks', icon: <ClipboardListIcon /> },
  { name: 'Leaderboard', href: '/leaderboard', icon: <TrendingUpIcon /> },
  { name: 'Events', href: '/events', icon: <CalendarIcon /> },
  { name: 'Gallery', href: '/gallery', icon: <CameraIcon /> },
  { name: 'Resource Library', href: '/resources', icon: <ArchiveIcon /> },
  { name: 'Academics', href: '/academics', icon: <BookOpenIcon /> },
  { name: 'Prayer Wall', href: '/prayers', icon: <SparklesIcon /> },
  { name: 'Chats', href: '/messages', icon: <ChatIcon /> },
  { name: 'Notifications', href: '/notifications', icon: <BellIcon /> },
  { name: 'Coin Store', href: '/store', icon: <ShoppingCartIcon /> },
  { name: 'Giving', href: '/giving', icon: <GiftIcon /> },
  { name: 'Help & Support', href: '/help', icon: <QuestionMarkCircleIcon /> },
];

export const BLOG_LINKS = [
  { name: 'Blog Management', href: '/blog-management', icon: <PencilAltIcon /> },
];

export const MEDIA_LINKS = [
  { name: 'Media Management', href: '/media-management', icon: <CameraIcon /> },
];

export const ACADEMICS_LINKS = [
  { name: 'Academics Mgt.', href: '/academics-management', icon: <PencilAltIcon /> },
];

export const ADMIN_LINKS = [
  { name: 'Leader Analytics', href: '/analytics', icon: <ChartBarIcon /> },
  { name: 'User Management', href: '/user-management', icon: <UsersIcon /> },
  { name: 'Event Management', href: '/event-management', icon: <CalendarIcon /> },
  { name: 'Financial Mgt.', href: '/financial-management', icon: <GiftIcon /> },
  { name: 'Developer Settings', href: '/developer-settings', icon: <CodeIcon /> },
];
