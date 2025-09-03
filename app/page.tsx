'use client'; // This is required for client-side components with hooks

import { useState, useEffect } from 'react';

interface Quotation {
  id: number;
  qname: string;
  status: string;
}

export default function Home() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const response = await fetch('/api/project-quotation');
        if (!response.ok) {
          throw new Error('Failed to fetch quotations');
        }
        const data = await response.json();
        setQuotations(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <main className="p-8 bg-white shadow-xl rounded-lg w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          Project Dashboard
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Loading quotations...</p>
        ) : (
          <ul className="space-y-4">
            {quotations.map((quotation) => (
              <li
                key={quotation.id}
                className="p-4 bg-gray-100 text-zinc-800 rounded-md flex justify-between items-center"
              >
                <span className="font-semibold text-gray-700">
                  {quotation.id}.
                </span>
                <span className="font-semibold text-gray-700">
                  {quotation.qname}
                </span>
                <span
                  className={`px-3 py-1 text-xs text-zinc-800 font-bold rounded-full ${
                    quotation.status === 'Completed'
                      ? 'bg-green-200 text-green-800'
                      : quotation.status === 'In Progress'
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-yellow-200 text-yellow-800'
                  }`}
                >
                  {quotation.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}