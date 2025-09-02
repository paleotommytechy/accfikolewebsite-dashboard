
import React from 'react';
// FIX: Changed to namespace import to fix module resolution issues with react-router-dom.
import * as ReactRouterDOM from 'react-router-dom';
import { AppProvider } from './context/AppContext';
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

function App(): React.ReactNode {
  return (
    <AppProvider>
      <ReactRouterDOM.HashRouter>
        <ReactRouterDOM.Routes>
          <ReactRouterDOM.Route path="/auth" element={<Auth />} />
          
          {/* Protected Routes using Layout Route pattern */}
          <ReactRouterDOM.Route 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <ReactRouterDOM.Route path="/dashboard" element={<Dashboard />} />
            <ReactRouterDOM.Route path="/profile" element={<Profile />} />
            <ReactRouterDOM.Route path="/tasks" element={<Tasks />} />
            <ReactRouterDOM.Route path="/leaderboard" element={<Leaderboard />} />
            <ReactRouterDOM.Route path="/events" element={<Events />} />
            <ReactRouterDOM.Route path="/messages" element={<ChatHistory />} />
            <ReactRouterDOM.Route path="/compose" element={<Messages />} />
            <ReactRouterDOM.Route path="/store" element={<Store />} />
            <ReactRouterDOM.Route
              path="/analytics"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <ReactRouterDOM.Route
              path="/developer-settings"
              element={
                <ProtectedRoute adminOnly={true}>
                  <DeveloperSettings />
                </ProtectedRoute>
              }
            />
            
            {/* Redirect from root and any other unmatched protected route to dashboard */}
            <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="/dashboard" replace />} />
            <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/dashboard" replace />} />
          </ReactRouterDOM.Route>
        </ReactRouterDOM.Routes>
      </ReactRouterDOM.HashRouter>
    </AppProvider>
  );
}

export default App;