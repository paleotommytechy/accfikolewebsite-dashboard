
import React, { Suspense } from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { BrowserRouter, HashRouter, Routes, Route, Navigate } = ReactRouterDOM;
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './components/ui/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// --- LAZY-LOADED PAGES ---
import Auth from './pages/Auth';
import AuthCallback from './context/AuthCallback';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import Leaderboard from './pages/Leaderboard';
import Events from './pages/Events';
import PrayerRequests from './pages/PrayerRequests';
// Analytics is removed
import DeveloperSettings from './pages/DeveloperSettings'; // Now acts as User/Admin Management
import TaskManagement from './pages/TaskManagement';
import ResourceManagement from './pages/ResourceManagement';
import Store from './pages/Store';
import ChatHistory from './pages/ChatHistory';
import ChatConversation from './pages/ChatConversation';
import Notifications from './pages/Notifications';
import Giving from './pages/Giving';
import ResourceLibrary from './pages/ResourceLibrary';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogManagement from './pages/BlogManagement';
import PostEditor from './pages/PostEditor';
import Gallery from './pages/Gallery';
import MediaManagement from './pages/MediaManagement';
import EventManagement from './pages/EventManagement';
import Academics from './pages/Academics';
import AcademicsManagement from './pages/AcademicsManagement';
import Hymns from './pages/Hymns';
import QuizEditor from './pages/QuizEditor';
import FinancialManagement from './pages/FinancialManagement';
import Help from './pages/Help';
import UpdatePassword from './pages/UpdatePassword';
import Sponsorships from './pages/Sponsorships';


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
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              
              {/* FIX: Use a dedicated layout route for admin pages to resolve errors from nested ProtectedRoutes. */}
              {/* Admin-only protected routes are defined first to ensure they are matched before the general user routes. */}
              <Route 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/task-management" element={<TaskManagement />} />
                <Route path="/resource-management" element={<ResourceManagement />} />
                <Route path="/developer-settings" element={<DeveloperSettings />} />
                <Route path="/task-management/quiz-editor/:quizId" element={<QuizEditor />} />
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
              
              {/* Admin & Finance protected routes */}
              <Route 
                element={
                  <ProtectedRoute financeOnly={true}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/financial-management" element={<FinancialManagement />} />
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
                <Route path="/blog/:postId/:slug" element={<BlogPost />} />
                <Route path="/hymns" element={<Hymns />} />
                <Route path="/messages" element={<ChatHistory />} />
                <Route path="/messages/:userId" element={<ChatConversation />} />
                <Route path="/store" element={<Store />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/giving" element={<Giving />} />
                <Route path="/sponsorships" element={<Sponsorships />} />
                <Route path="/help" element={<Help />} />
                
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
