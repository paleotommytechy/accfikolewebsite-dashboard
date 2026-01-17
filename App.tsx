
import React, { Suspense, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation, useNavigate } = ReactRouterDOM;
import { AppProvider, useAppContext } from './context/AppContext';
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
import DeveloperSettings from './pages/DeveloperSettings';
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
import GameCenter from './pages/GameCenter';

const FullPageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-light dark:bg-secondary">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
  </div>
);

const Router = window.location.hostname.endsWith('vercel.app') 
  ? BrowserRouter 
  : HashRouter;

/**
 * Persists the user's route so they leave and return to the same spot.
 */
const RoutePersistence: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isLoading } = useAppContext();

  // Save route on change
  useEffect(() => {
    if (!isLoading && currentUser && !location.pathname.startsWith('/auth')) {
      localStorage.setItem('last_path', location.pathname);
    }
  }, [location, currentUser, isLoading]);

  // Restore route on first load if on landing or auth while logged in
  useEffect(() => {
    const lastPath = localStorage.getItem('last_path');
    if (!isLoading && currentUser && lastPath && (location.pathname === '/' || location.pathname === '/auth')) {
      navigate(lastPath, { replace: true });
    }
  }, [isLoading, currentUser]);

  return null;
};

function AppContent(): React.ReactNode {
  return (
    <>
      <RoutePersistence />
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          
          <Route element={<ProtectedRoute adminOnly={true}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/task-management" element={<TaskManagement />} />
            <Route path="/resource-management" element={<ResourceManagement />} />
            <Route path="/developer-settings" element={<DeveloperSettings />} />
            <Route path="/task-management/quiz-editor/:quizId" element={<QuizEditor />} />
          </Route>
          
          <Route element={<ProtectedRoute proOnly={true}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/event-management" element={<EventManagement />} />
          </Route>
          
          <Route element={<ProtectedRoute financeOnly={true}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/financial-management" element={<FinancialManagement />} />
          </Route>

          <Route element={<ProtectedRoute bloggerOnly={true}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/blog-management" element={<BlogManagement />} />
            <Route path="/blog-management/editor" element={<PostEditor />} />
            <Route path="/blog-management/editor/:postId" element={<PostEditor />} />
          </Route>

          <Route element={<ProtectedRoute mediaOnly={true}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/media-management" element={<MediaManagement />} />
          </Route>
          
          <Route element={<ProtectedRoute academicsOnly={true}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/academics-management" element={<AcademicsManagement />} />
          </Route>

          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
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
            <Route path="/messages" element={<ChatHistory />}>
               <Route path=":userId" element={<ChatConversation />} />
            </Route>
            <Route path="/store" element={<Store />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/giving" element={<Giving />} />
            <Route path="/sponsorships" element={<Sponsorships />} />
            <Route path="/help" element={<Help />} />
            <Route path="/game" element={<GameCenter />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

function App(): React.ReactNode {
  return (
    <AppProvider>
      <NotificationProvider>
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </AppProvider>
  );
}

export default App;
