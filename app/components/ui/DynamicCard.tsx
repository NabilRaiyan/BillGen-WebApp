"use client";

import { FC } from "react";
import { FaFileInvoice, FaFileAlt, FaShoppingCart, FaClipboardList } from "react-icons/fa";

interface DynamicCardProps {
  title: string;
  count: number;
  type: "invoice" | "bill" | "po" | "quotation";
}

const typeConfig = {
  invoice: { icon: FaFileInvoice, gradient: "from-teal-400 to-teal-600" },
  bill: { icon: FaFileAlt, gradient: "from-indigo-400 to-indigo-600" },
  po: { icon: FaShoppingCart, gradient: "from-purple-400 to-purple-600" },
  quotation: { icon: FaClipboardList, gradient: "from-amber-400 to-yellow-600" },
};

const DynamicCard: FC<DynamicCardProps> = ({ title, count, type }) => {
  const Icon = typeConfig[type].icon;
  const gradient = typeConfig[type].gradient;

  return (
    <div
      className={`flex items-center justify-between p-6 rounded-2xl shadow-lg transform transition-all hover:scale-105 hover:shadow-2xl bg-gradient-to-r ${gradient} text-white`}
    >
      <div className="flex flex-col">
        <span className="text-3xl font-bold">{count}</span>
        <span className="text-sm uppercase tracking-wide">{title}</span>
      </div>
      <div className="text-4xl opacity-80">
        <Icon />
      </div>
    </div>
  );
};

export default DynamicCard;
