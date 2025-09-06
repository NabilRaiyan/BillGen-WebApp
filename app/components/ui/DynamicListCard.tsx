'use client';

import { FC, useEffect, useState } from 'react';
import { FaFileInvoice, FaFileAlt, FaShoppingCart, FaClipboardList } from 'react-icons/fa';

interface DynamicListCardProps {
  title: string;
  type: 'invoice' | 'bill' | 'po' | 'quotation';
  apiEndpoint: string; // API route to fetch list
}

interface Item extends Record<string, unknown> {
  id: string;
  title?: string;
  name?: string;
  quotation_number?: string;
  client?: string; // added client field
  total_amount?: number;
}

const typeConfig = {
  invoice: { icon: FaFileInvoice, gradient: 'from-teal-400 to-teal-600' },
  bill: { icon: FaFileAlt, gradient: 'from-indigo-400 to-indigo-600' },
  po: { icon: FaShoppingCart, gradient: 'from-purple-400 to-purple-600' },
  quotation: { icon: FaClipboardList, gradient: 'from-yellow-400 to-yellow-600' },
};

const DynamicListCard: FC<DynamicListCardProps> = ({ title, type, apiEndpoint }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const Icon = typeConfig[type].icon;
  const gradient = typeConfig[type].gradient;

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(apiEndpoint);
        const data = (await res.json()) as Item[] | Record<string, unknown>;

        if (!res.ok) {
          const errorMsg =
            (data as Record<string, unknown>).error as string | undefined;
          throw new Error(errorMsg || 'Failed to fetch data');
        }

        setItems(data as Item[]);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('Unexpected error');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [apiEndpoint]);

  return (
    <div
      className={`p-6 rounded-2xl shadow-lg bg-gradient-to-r ${gradient} text-white flex flex-col`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        <Icon className="text-3xl opacity-80" />
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto max-h-72 pr-2">
        {loading && <p className="text-sm opacity-70">Loading...</p>}
        {error && <p className="text-sm text-red-200">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="text-sm opacity-70">No {title.toLowerCase()} found.</p>
        )}
        {!loading && items.length > 0 && (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="bg-white/20 rounded-lg px-4 py-3 flex flex-col hover:bg-white/30 transition"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium truncate max-w-[70%]">
                    {item.title || item.name || item.quotation_number || 'N/A'}
                  </span>
                  {item.total_amount && (
                    <span className="text-sm font-semibold text-right">
                      ${Number(item.total_amount).toLocaleString()}
                    </span>
                  )}
                </div>
                {item.client && (
                  <span className="text-xs text-white/70 mt-1 truncate">
                    Client: {item.client}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DynamicListCard;
