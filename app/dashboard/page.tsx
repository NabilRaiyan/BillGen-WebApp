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
  due_date: string;
  status: string | null;
  client_name: string;
}

interface PurchaseOrder {
  id: string;
  quotation_id: string;
  po_number: string;
  po_date: string;
  total_amount: number;
  client_name: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingQuotations, setLoadingQuotations] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(true);

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

  // Fetch latest quotations (limit 3)
  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await fetch('/api/project-quotation?limit=3');
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

  // Fetch latest purchase orders
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        const res = await fetch('/api/purchase-order?limit=3'); // your API endpoint
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch purchase orders');
        setPurchaseOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPurchaseOrders(false);
      }
    };

    fetchPurchaseOrders();
  }, []);

  return (
    <RouteGuard requireAuth={true}>
      <div className="p-6 space-y-8">

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
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">Latest Quotations</h2>

        {loadingQuotations && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-gray-200 rounded-2xl animate-pulse"
              />
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
                className="p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow flex flex-col space-y-2"
              >
                {/* Quotation Number */}
                <div>
                  <span className="text-teal-600 font-bold text-base">Quotation Id:</span>{' '}
                  <span className="text-gray-900 font-medium text-base">{q.quotation_number}</span>
                </div>

                {/* Title */}
                <div>
                  <span className="text-gray-500 font-semibold">Title:</span>{' '}
                  <span className="text-teal-700">{q.title || 'N/A'}</span>
                </div>

                {/* Client */}
                <div>
                  <span className="text-gray-500 font-semibold">Client:</span>{' '}
                  <span className="text-teal-700">{q.client_name || 'N/A'}</span>
                </div>

                {/* Due Date */}
                <div>
                  <span className="text-red-500 font-semibold">Due Date:</span>{' '}
                  <span className="text-red-500">
                    {q.due_date ? new Date(q.due_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                {/* Status */}
                {q.status && (
                  <div>
                    <span className="text-gray-500 font-semibold">Status:</span>{' '}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        q.status.toLowerCase() === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : q.status.toLowerCase() === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                )}

                {/* Total Amount */}
                <div>
                  <span className="text-gray-500 font-semibold">Total:</span>{' '}
                  <span className="text-gray-900 font-bold text-lg">
                    ${Number(q.total_amount).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Latest Purchase Orders */}
<div className="mt-8">
  <h2 className="text-2xl font-semibold mb-6 text-gray-900">Latest Purchase Orders</h2>

  {loadingPurchaseOrders && (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-28 bg-gray-200 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  )}

  {!loadingPurchaseOrders && purchaseOrders.length === 0 && (
    <p className="text-gray-600">No purchase orders found.</p>
  )}

  {!loadingPurchaseOrders && purchaseOrders.length > 0 && (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {purchaseOrders.map((po: PurchaseOrder) => (
        <li
          key={po.id}
          className="p-5 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow flex flex-col space-y-2"
        >
          {/* PO Number */}
          <div>
            <span className="text-teal-600 font-bold text-base">PO Number:</span>{' '}
            <span className="text-gray-900 font-medium">{po.po_number}</span>
          </div>

          {/* Related Quotation */}
          <div>
            <span className="text-gray-500 font-semibold">Quotation ID:</span>{' '}
            <span className="text-teal-700">{po.quotation_id}</span>
          </div>

          {/* Client Name */}
          <div>
            <span className="text-gray-500 font-semibold">Client:</span>{' '}
            <span className="text-teal-700">{po.client_name || 'N/A'}</span>
          </div>

          {/* PO Date */}
          <div>
            <span className="text-red-500 font-semibold">PO Date:</span>{' '}
            <span className="text-red-500">
              {po.po_date ? new Date(po.po_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>

          {/* Total Amount */}
          <div>
            <span className="text-gray-500 font-semibold">Total:</span>{' '}
            <span className="text-gray-900 font-bold text-lg">
              ${Number(po.total_amount).toLocaleString()}
            </span>
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
