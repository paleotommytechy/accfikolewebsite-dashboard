

import React from 'react';
import { HomeIcon, UserIcon, ClipboardListIcon, TrendingUpIcon, CalendarIcon, ChatIcon, ChartBarIcon, ShoppingCartIcon, CodeIcon, UsersIcon, BellIcon, GiftIcon, HeartIcon, SparklesIcon, BookOpenIcon, PencilAltIcon, CameraIcon } from './components/ui/Icons';

export const NAV_LINKS = [
  { name: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
  { name: 'My Profile', href: '/profile', icon: <UserIcon /> },
  { name: 'Fellowship Blog', href: '/blog', icon: <BookOpenIcon /> },
  { name: 'Tasks & Challenges', href: '/tasks', icon: <ClipboardListIcon /> },
  { name: 'Leaderboard', href: '/leaderboard', icon: <TrendingUpIcon /> },
  { name: 'Events', href: '/events', icon: <CalendarIcon /> },
  { name: 'Gallery', href: '/gallery', icon: <CameraIcon /> },
  { name: 'Resource Library', href: '/resources', icon: <BookOpenIcon /> },
  { name: 'Prayer Wall', href: '/prayers', icon: <SparklesIcon /> },
  { name: 'Chats', href: '/messages', icon: <ChatIcon /> },
  { name: 'Notifications', href: '/notifications', icon: <BellIcon /> },
  { name: 'Coin Store', href: '/store', icon: <ShoppingCartIcon /> },
  { name: 'Giving', href: '/giving', icon: <GiftIcon /> },
  { name: 'Sponsorships', href: '/sponsorships', icon: <HeartIcon /> },
];

export const BLOG_LINKS = [
  { name: 'Blog Management', href: '/blog-management', icon: <PencilAltIcon /> },
];

export const MEDIA_LINKS = [
  { name: 'Media Management', href: '/media-management', icon: <CameraIcon /> },
];

export const ADMIN_LINKS = [
  { name: 'Leader Analytics', href: '/analytics', icon: <ChartBarIcon /> },
  { name: 'User Management', href: '/user-management', icon: <UsersIcon /> },
  { name: 'Developer Settings', href: '/developer-settings', icon: <CodeIcon /> },
];