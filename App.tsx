import React, { lazy, Suspense } from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { BrowserRouter, HashRouter, Routes, Route, Navigate } = ReactRouterDOM;
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './components/ui/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// --- LAZY-LOADED PAGES ---
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Events = lazy(() => import('./pages/Events'));
const PrayerRequests = lazy(() => import('./pages/PrayerRequests'));
const Analytics = lazy(() => import('./pages/Analytics'));
const DeveloperSettings = lazy(() => import('./pages/DeveloperSettings'));
const Store = lazy(() => import('./pages/Store'));
const ChatHistory = lazy(() => import('./pages/ChatHistory'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const ChatConversation = lazy(() => import('./pages/ChatConversation'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Giving = lazy(() => import('./pages/Giving'));
const Sponsorships = lazy(() => import('./pages/Sponsorships'));
const ResourceLibrary = lazy(() => import('./pages/ResourceLibrary'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const BlogManagement = lazy(() => import('./pages/BlogManagement'));
const PostEditor = lazy(() => import('./pages/PostEditor'));
const Gallery = lazy(() => import('./pages/Gallery'));
const MediaManagement = lazy(() => import('./pages/MediaManagement'));
const EventManagement = lazy(() => import('./pages/EventManagement'));
const Academics = lazy(() => import('./pages/Academics'));
const AcademicsManagement = lazy(() => import('./pages/AcademicsManagement'));
const Hymns = lazy(() => import('./pages/Hymns'));


// --- SUSPENSE FALLBACK LOADER ---
const FullPageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-light dark:bg-secondary">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
  </div>
);


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
          <Suspense fallback={<FullPageLoader />}>
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
              
              {/* Pro & Admin protected routes */}
              <Route 
                element={
                  <ProtectedRoute proOnly={true}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/event-management" element={<EventManagement />} />
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

              {/* Media manager protected routes */}
              <Route 
                element={
                  <ProtectedRoute mediaOnly={true}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/media-management" element={<MediaManagement />} />
              </Route>
              
              {/* Academics manager protected routes */}
              <Route 
                element={
                  <ProtectedRoute academicsOnly={true}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/academics-management" element={<AcademicsManagement />} />
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
                <Route path="/academics" element={<Academics />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:postId" element={<BlogPost />} />
                <Route path="/hymns" element={<Hymns />} />
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
          </Suspense>
        </Router>
      </NotificationProvider>
    </AppProvider>
  );
}

export default App;