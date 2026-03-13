'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';

const publicPaths = ['/login', '/register', '/offline', '/forgot-password', '/reset-password'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPath = publicPaths.includes(pathname);
  const isPending = pathname === '/pending';

  useEffect(() => {
    if (status === 'loading') return;

    if (!session && !isPublicPath) {
      router.push('/login');
      return;
    }

    if (session && isPublicPath) {
      router.push('/');
      return;
    }

    if (session && session.user.role === 'pending' && !isPending && !isPublicPath) {
      router.push('/pending');
      return;
    }
  }, [session, status, pathname, router, isPublicPath, isPending]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Public pages or pending - no sidebar
  if (isPublicPath || isPending || !session) {
    return <>{children}</>;
  }

  // Authenticated - show sidebar
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
