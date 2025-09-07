
import React from 'react';
import { HomeIcon, UserIcon, ClipboardListIcon, TrendingUpIcon, CalendarIcon, ChatIcon, ChartBarIcon, ShoppingCartIcon, CodeIcon, UsersIcon } from './components/ui/Icons';

export const NAV_LINKS = [
  { name: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
  { name: 'My Profile', href: '/profile', icon: <UserIcon /> },
  { name: 'Tasks & Challenges', href: '/tasks', icon: <ClipboardListIcon /> },
  { name: 'Leaderboard', href: '/leaderboard', icon: <TrendingUpIcon /> },
  { name: 'Events', href: '/events', icon: <CalendarIcon /> },
  { name: 'Chats', href: '/messages', icon: <ChatIcon /> },
  { name: 'Coin Store', href: '/store', icon: <ShoppingCartIcon /> },
];

export const ADMIN_LINKS = [
  { name: 'Leader Analytics', href: '/analytics', icon: <ChartBarIcon /> },
  { name: 'User Management', href: '/user-management', icon: <UsersIcon /> },
  { name: 'Developer Settings', href: '/developer-settings', icon: <CodeIcon /> },
];