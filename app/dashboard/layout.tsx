'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Sidebar from "../components/ui/Sidebar";
import TopBar from '@/app/components/ui/Topbar';
import { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";


interface Profile {
  id: string;
  full_name: string;
  user_role: string;
  avatar_url?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // e.g. /dashboard/invoices
  // derive a nice page title
  const pageTitle = pathname
    .split("/")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" > ") || "Dashboard";
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const fetchProfileServerSide = async (userId: string, accessToken: string): Promise<{data: Profile | null, error: string | null}> => {
    try {
      // Call your own API route that uses service role
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: { profile: Profile } = await response.json();
      return { data: data.profile, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { data: null, error: errorMessage };
    }
  };

  useEffect(() => {
    const loadUserAndProfile = async () => {
      try {
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error("Session error:", sessionError);
          setError("User not logged in.");
          setLoading(false);
          window.location.href = "/login";
          return;
        }

        const authUser = session.user;
        setUser(authUser);

        console.log("✅ Session found for user:", authUser.id);

        // Try server-side profile fetch first
        const { data: serverProfile, error: serverError } = await fetchProfileServerSide(
          authUser.id, 
          session.access_token
        );

        if (serverProfile) {
          console.log("✅ Profile loaded via server-side:", serverProfile);
          setProfile(serverProfile);
        } else {
          console.log("❌ Server-side failed, trying direct approach:", serverError);
          
          // Fallback: Try direct database query with service role approach
          // We'll temporarily disable RLS and query directly
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();

          if (profileError) {
            console.error("❌ Direct query failed:", profileError);
            
            // Last resort: Check if profile exists at all
            const { data: checkProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", authUser.id);
              
            if (!checkProfile || checkProfile.length === 0) {
              // Profile doesn't exist, let's create it
              console.log("🔧 Profile doesn't exist, creating...");
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert({
                  id: authUser.id,
                  full_name: authUser.email?.split('@')[0] || 'User',
                  user_role: 'user'
                })
                .select()
                .single();

              if (createError) {
                setError(`Failed to create profile: ${createError.message}`);
              } else {
                console.log("✅ Profile created:", newProfile);
                setProfile(newProfile);
              }
            } else {
              setError(`Profile query failed: ${profileError.message}`);
            }
          } else {
            console.log("✅ Profile loaded via direct query:", profileData);
            setProfile(profileData);
          }
        }

      } catch (err) {
        console.error("❌ Unexpected error:", err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Unexpected error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        window.location.href = "/login";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar className="fixed left-0 top-0 h-full z-10" />
        <div className="flex-1 flex flex-col ml-64 p-6 bg-gray-50">
          <div className="p-4 bg-blue-100 text-blue-800 rounded mb-4">
            <div className="animate-pulse">Loading user profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar className="fixed left-0 top-0 h-full z-10" />
        <div className="flex-1 flex flex-col ml-64 p-6 bg-gray-50">
          <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
            <h3 className="font-semibold mb-2">Profile Loading Error</h3>
            <p className="mb-4">{error}</p>
            <div className="space-x-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar className="fixed left-0 top-0 h-full z-10" />
      <div className="flex-1 flex flex-col ml-64">
        {user && profile && (
          <div className="sticky rounded-2xl top-0 z-20 shadow-sm bg-white">
            <TopBar
              user={user}
              full_name={profile.full_name}
              user_role={profile.user_role}
              avatarUrl={profile.avatar_url}
              onLogout={handleLogout}
              pageTitle={pageTitle}
              

            />
          </div>
        )}
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}