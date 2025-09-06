"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Users,
  Settings,
  Boxes,
  type LucideIcon, // Import the type
} from "lucide-react";
import Image from "next/image";


interface SidebarProps {
  className?: string;
}

const navItems: { name: string; href: string; icon: LucideIcon }[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Quotations", href: "/dashboard/quotations", icon: FileText },
  { name: "Purchase Order", href: "/dashboard/purchase-order", icon: ShoppingCart },
  { name: "Invoice", href: "/dashboard/invoice", icon: Receipt },
  { name: "Bill", href: "/dashboard/bill", icon: CreditCard },
  { name: "Product Inventory", href: "/dashboard/inventory", icon: Boxes },
];

const quickManageItems: { name: string; href: string; icon: LucideIcon }[] = [
  { name: "Role Management", href: "/dashboard/roles", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  const renderLink = (item: { name: string; href: string; icon: LucideIcon }) => {
    const Icon = item.icon;
    const active = pathname === item.href;

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all duration-300
          ${
            active
              ? "bg-teal-500 text-white shadow-lg shadow-teal-300/50 scale-105"
              : "text-gray-700 hover:bg-gray-100 hover:shadow-md hover:scale-[1.02]"
          }`}
      >
        <Icon className={`w-5 h-5 ${active ? "text-white drop-shadow-md" : ""}`} />
        <span className="font-bold text-sm">{item.name}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-white/70 backdrop-blur-lg border-r border-gray-100 shadow-xl flex flex-col p-6 rounded-r-3xl">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="TechMak Logo"
          width={70}
          height={70}
          className="object-contain rounded-full shadow-lg"
        />
        <span className="mt-3 text-lg font-medium text-gray-800 text-center">
          Techmak Technology Ltd.
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-300 scrollbar-track-transparent">
        {navItems.map(renderLink)}

        {/* Quick Manage Section */}
        <div className="mt-6">
          <hr className="border-gray-300 mb-2" />
          <span className="text-xs font-semibold text-gray-400 px-5 uppercase mb-2 block">
            Quick Manage
          </span>
          <div className="flex flex-col gap-3">
            {quickManageItems.map(renderLink)}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="pt-4">
        <p className="text-xs text-gray-500 text-center">
          &copy; {currentYear} <span className="font-semibold">Techmak Technologies</span>
        </p>
      </div>

      {/* Decorative Teal Glow */}
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-teal-300/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-teal-200/20 rounded-full blur-3xl pointer-events-none"></div>
    </aside>
  );
}
