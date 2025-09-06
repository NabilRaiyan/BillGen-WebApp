'use client';

import { useEffect, useState } from 'react';
import DynamicCard from '@/app/components/ui/DynamicCard';
import { RouteGuard } from '@/app/components/RouteGuard';

interface Stats {
  invoices: number;
  bills: number;
  pos: number;
  quotations: number;
}

interface Quotation {
  id: string;
  quotation_number: string;
  title: string;
  total_amount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingQuotations, setLoadingQuotations] = useState(true);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch latest quotations (limit 5)
  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await fetch('/api/project-quotation?limit=5');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch quotations');
        setQuotations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingQuotations(false);
      }
    };
    fetchQuotations();
  }, []);

  return (
    <RouteGuard requireAuth={true}>
      <div className="p-6 space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loadingStats
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-gray-200 animate-pulse"
                />
              ))
            : stats && (
                <>
                  <DynamicCard title="Invoices" count={stats.invoices} type="invoice" />
                  <DynamicCard title="Bills" count={stats.bills} type="bill" />
                  <DynamicCard title="Purchase Orders" count={stats.pos} type="po" />
                  <DynamicCard title="Quotations" count={stats.quotations} type="quotation" />
                </>
              )}
        </div>

        {/* Latest Quotations List */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Latest Quotations</h2>

          {loadingQuotations && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {!loadingQuotations && quotations.length === 0 && (
            <p className="text-gray-600">No quotations found.</p>
          )}

          {!loadingQuotations && quotations.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quotations.map((q) => (
                <li
                  key={q.id}
                  className="p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-teal-600 font-bold text-lg">{q.quotation_number}</span>
                    <span className="text-gray-500 text-sm">{q.title}</span>
                  </div>
                  <div className="text-right text-gray-900 font-semibold text-lg">
                    ${q.total_amount.toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
