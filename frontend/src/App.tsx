import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/authStore';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const TodoPage = lazy(() =>
  import('@/pages/TodoPage').then((m) => ({ default: m.TodoPage }))
);
const ProcessPage = lazy(() =>
  import('@/pages/ProcessPage').then((m) => ({ default: m.ProcessPage }))
);
const MemoPage = lazy(() =>
  import('@/pages/MemoPage').then((m) => ({ default: m.MemoPage }))
);
const ItemFormPage = lazy(() =>
  import('@/pages/ItemFormPage').then((m) => ({ default: m.ItemFormPage }))
);
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Loading...</span>
      </div>
    </div>
  );
}

export function App() {
  useTheme();

  useEffect(() => {
    // Only hydrate if we have a persisted auth token — avoids 401 → redirect loop on /login
    const { token } = useAuthStore.getState();
    if (token) {
      useAppStore.getState().hydrate();
    }
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
          {/* Login page — no Layout wrapper, full-page standalone */}
          <Route path="/login" element={<LoginPage />} />

          {/* All other routes — wrapped in Layout + authentication guard */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/todo" element={<TodoPage />} />
                      <Route path="/process" element={<ProcessPage />} />
                      <Route path="/memo" element={<MemoPage />} />
                      <Route path="/items/new" element={<ItemFormPage />} />
                      <Route path="/items/:id/edit" element={<ItemFormPage />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
