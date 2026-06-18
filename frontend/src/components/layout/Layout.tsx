import type { ReactNode } from 'react';
import { Header } from './Header';
import { TabBar } from './TabBar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 pb-24 sm:pb-6">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
