
import React from 'react';
// FIX: Upgraded to react-router-dom v6 syntax to resolve module export errors.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import DashboardLayout from './components/ui/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Auth from './context/Auth';
import AuthCallback from './context/AuthCallback';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import Leaderboard from './pages/Leaderboard';
import Events from './pages/Events';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import DeveloperSettings from './pages/DeveloperSettings';
import Store from './pages/Store';

function App(): React.ReactNode {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="leaderboard" element={<Leaderboard />} />
                    <Route path="events" element={<Events />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="store" element={<Store />} />
                    <Route
                      path="analytics"
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <Analytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="developer-settings"
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <DeveloperSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

export default App;