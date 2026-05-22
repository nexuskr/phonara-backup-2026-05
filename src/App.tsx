import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy loaded pages
const Home = React.lazy(() => import('./pages/Home'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Missions = React.lazy(() => import('./pages/Missions'));
const Auth = React.lazy(() => import('./pages/Auth'));
const SecureAuth = React.lazy(() => import('./pages/SecureAuth'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));

// Fallback component for lazy loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-sm text-muted-foreground">Loading PHONARA...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary scope="app">
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/missions" element={<Missions />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/secure-auth" element={<SecureAuth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
