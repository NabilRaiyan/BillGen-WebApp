'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function RouteGuard({ children, requireAuth = true }: RouteGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setIsAuthenticated(false);
          return;
        }

        const hasValidSession = !!session?.user;
        console.log('Auth check result:', { hasValidSession, requireAuth });
        
        setIsAuthenticated(hasValidSession);

        // Handle redirects
        if (requireAuth && !hasValidSession) {
          console.log('Redirecting to login - no valid session');
          router.replace('/login');
        } else if (!requireAuth && hasValidSession) {
          console.log('Redirecting to dashboard - already authenticated');
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        if (requireAuth) {
          router.replace('/login');
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      const hasValidSession = !!session?.user;
      setIsAuthenticated(hasValidSession);

      if (event === 'SIGNED_OUT' && requireAuth) {
        router.replace('/login');
      } else if (event === 'SIGNED_IN' && !requireAuth) {
        router.replace('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, requireAuth]);

  // Still checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Block access if authentication requirement not met
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-600">Access denied. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Block access for login page if already authenticated
  if (!requireAuth && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-600">Already logged in. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Render children only if auth requirements are satisfied
  return <>{children}</>;
}