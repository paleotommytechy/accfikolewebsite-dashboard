import React from 'react';
// FIX: Use named imports for react-router-dom to resolve module export errors.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './components/ui/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Auth from './context/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import Leaderboard from './pages/Leaderboard';
import Events from './pages/Events';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import DeveloperSettings from './pages/DeveloperSettings';
import Store from './pages/Store';
import ChatHistory from './pages/ChatHistory';
import UserManagement from './pages/UserManagement';

function App(): React.ReactNode {
  return (
    <AppProvider>
      <NotificationProvider>
        <HashRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Routes using Layout Route pattern */}
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
              <Route path="/compose" element={<Messages />} />
              <Route path="/store" element={<Store />} />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-management"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/developer-settings"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <DeveloperSettings />
                  </ProtectedRoute>
                }
              />
              
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