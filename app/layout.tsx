import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';
import { AppHeader } from '@/components/AppHeader';
import './globals.css';

export const metadata: Metadata = {
  title: 'WTFXAI Intelligence OS | Financial Research & SKORE Terminal',
  description: 'Enterprise AI financial intelligence terminal, event-driven triggers, and quantitative consensus modeling.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-grid">
          <Navigation />
          <main className="main">
            <AppHeader />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

