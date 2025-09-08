// components/ScrollableList.tsx
"use client";
import { ReactNode } from "react";

interface ScrollableListProps {
  headers: string[];
  children: ReactNode;
  height?: string; // make it configurable
}

export default function ScrollableList({ headers, children, height = "500px" }: ScrollableListProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <div className="overflow-y-auto" style={{ maxHeight: height }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
