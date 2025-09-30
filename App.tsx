

import React from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { BrowserRouter, HashRouter, Routes, Route, Navigate } = ReactRouterDOM;
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './components/ui/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import Leaderboard from './pages/Leaderboard';
import Events from './pages/Events';
import PrayerRequests from './pages/PrayerRequests';
import Analytics from './pages/Analytics';
import DeveloperSettings from './pages/DeveloperSettings';
import Store from './pages/Store';
import ChatHistory from './pages/ChatHistory';
import UserManagement from './pages/UserManagement';
import ChatConversation from './pages/ChatConversation';
import Notifications from './pages/Notifications';
import Giving from './pages/Giving';
import Sponsorships from './pages/Sponsorships';
import ResourceLibrary from './pages/ResourceLibrary';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogManagement from './pages/BlogManagement';
import PostEditor from './pages/PostEditor';

// Dynamically choose the router based on the environment.
// Vercel deployments support BrowserRouter thanks to vercel.json rewrites.
// Other environments (like AI Studio preview) need HashRouter for compatibility.
const Router = window.location.hostname.endsWith('vercel.app') 
  ? BrowserRouter 
  : HashRouter;

function App(): React.ReactNode {
  return (
    <AppProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* FIX: Use a dedicated layout route for admin pages to resolve errors from nested ProtectedRoutes. */}
            {/* Admin-only protected routes are defined first to ensure they are matched before the general user routes. */}
            <Route 
              element={
                <ProtectedRoute adminOnly={true}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/developer-settings" element={<DeveloperSettings />} />
            </Route>
            
            {/* Blog manager protected routes */}
            <Route 
              element={
                <ProtectedRoute bloggerOnly={true}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/blog-management" element={<BlogManagement />} />
              <Route path="/blog-management/editor" element={<PostEditor />} />
              <Route path="/blog-management/editor/:postId" element={<PostEditor />} />
            </Route>

            {/* General protected routes for all authenticated users */}
            <Route 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile/:userId?" element={<Profile />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/prayers" element={<PrayerRequests />} />
              <Route path="/resources" element={<ResourceLibrary />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:postId" element={<BlogPost />} />
              <Route path="/messages" element={<ChatHistory />} />
              <Route path="/messages/:userId" element={<ChatConversation />} />
              <Route path="/store" element={<Store />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/giving" element={<Giving />} />
              <Route path="/sponsorships" element={<Sponsorships />} />
              
              {/* Redirect from root and any other unmatched protected route to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </AppProvider>
  );
}

export default App;
