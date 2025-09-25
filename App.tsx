
import React from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate } = ReactRouterDOM;
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
import Analytics from './pages/Analytics';
import DeveloperSettings from './pages/DeveloperSettings';
import Store from './pages/Store';
import ChatHistory from './pages/ChatHistory';
import UserManagement from './pages/UserManagement';
import ChatConversation from './pages/ChatConversation';
import Notifications from './pages/Notifications';

function App(): React.ReactNode {
  return (
    <AppProvider>
      <NotificationProvider>
        <HashRouter>
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

            {/* General protected routes for all authenticated users */}
            <Route 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/messages" element={<ChatHistory />} />
              <Route path="/messages/:userId" element={<ChatConversation />} />
              <Route path="/store" element={<Store />} />
              <Route path="/notifications" element={<Notifications />} />
              
              {/* Redirect from root and any other unmatched protected route to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </NotificationProvider>
    </AppProvider>
  );
}

export default App;