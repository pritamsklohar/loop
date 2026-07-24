import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { FeedbackList } from './pages/FeedbackList';
import { Themes } from './pages/Themes';
import { Ask } from './pages/Ask';
import { Reports } from './pages/Reports';
import { PublicReport } from './pages/PublicReport';
import { Forbidden } from './pages/Forbidden';
import { NotFound } from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './components/AppLayout';
import { Settings } from './pages/Settings';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/reports/:id/public" element={<PublicReport />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Unified App Layout Wrapper */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="inbox" element={<FeedbackList />} />
              <Route path="trends" element={<Themes />} />
              <Route path="ask" element={<Ask />} />
              <Route path="reports" element={<Reports />} />
              <Route path="members" element={<Members />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Redirect legacy and root routes */}
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/feedback" element={<Navigate to="/app/inbox" replace />} />
            <Route path="/feedback/new" element={<Navigate to="/app/inbox" replace />} />
            <Route path="/feedback/bulk" element={<Navigate to="/app/inbox" replace />} />
            <Route path="/themes" element={<Navigate to="/app/trends" replace />} />
            <Route path="/ask" element={<Navigate to="/app/ask" replace />} />
            <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
            <Route path="/members" element={<Navigate to="/app/members" replace />} />
            
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
