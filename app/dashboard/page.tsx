// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { RouteGuard } from '@/app/components/RouteGuard';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface Quotation {
  id: string;
  quotation_number: string;
  title: string;
  total_amount: number;
}

function DashboardContent() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check current user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      console.log('Dashboard - Current user:', session?.user);
    };
    checkUser();
  }, []);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await fetch('/api/project-quotation');
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch quotations');
        }

        setQuotations(data);
      } catch (err) {
        // Type-safe error handling
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {user && (
            <p className="text-gray-600 mt-2">Welcome, {user.email}!</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded">
        <p className="text-green-700">
          ✅ You are successfully authenticated and can see this protected content!
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Quotations</h2>

      {loading && <p>Loading quotations...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {quotations.length > 0 && (
        <ul className="space-y-4">
          {quotations.map((q) => (
            <li
              key={q.id}
              className="p-4 bg-white shadow rounded-lg flex justify-between items-center"
            >
              <span className="font-semibold">{q.quotation_number}</span>
              <span>{q.title}</span>
              <span className="font-bold">${q.total_amount}</span>
            </li>
          ))}
        </ul>
      )}

      {quotations.length === 0 && !loading && !error && <p>No quotations found.</p>}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RouteGuard requireAuth={true}>
      <DashboardContent />
    </RouteGuard>
  );
}