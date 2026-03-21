import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/use-auth';
import { ToastProvider } from './components/ui/use-toast';
import { RegisterForm } from './features/auth/register-form';
import { LoginForm } from './features/auth/login-form';
import { AppLayout } from './layouts/app-layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  },
});

function ProjectsPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Forgot Password</h1>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route element={<AppLayout />}>
                <Route path="/" element={<ProjectsPage />} />
                <Route
                  path="/projects/:projectId"
                  element={<ProjectsPage />}
                />
                <Route
                  path="/projects/:projectId/boards/:boardId"
                  element={<ProjectsPage />}
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
