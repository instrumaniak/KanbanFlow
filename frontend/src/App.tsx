import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/use-auth';
import { ToastProvider } from './components/ui/use-toast';
import { RegisterForm } from './features/auth/register-form';
import { LoginForm } from './features/auth/login-form';
import { ProjectList } from './features/projects/project-list';
import { BoardList } from './features/boards/board-list';
import { ArchivedBoards } from './features/boards/archived-boards';
import { BoardView } from './features/boards/board-view/board-view';
import { useProjects } from './features/projects/use-projects';
import { AppLayout } from './layouts/app-layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  },
});

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

function AppLayoutRoute() {
  const { data: projectsData } = useProjects();
  return <AppLayout projectsData={projectsData} />;
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

              <Route element={<AppLayoutRoute />}>
                <Route path="/" element={<BoardList />} />
                <Route path="/archived-boards" element={<ArchivedBoards />} />
                <Route path="/projects" element={<ProjectList />} />
                <Route
                  path="/board/:boardId"
                  element={<BoardView />}
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
