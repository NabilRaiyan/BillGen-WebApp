"use client";

import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { User } from "@supabase/supabase-js";
import { FaUserCircle } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import Image from "next/image";

interface TopbarProps {
  user: User;
  full_name: string;
  user_role: string;
  pageTitle?: string; // NEW: dynamic page title
  avatarUrl?: string;
  onLogout: () => void;
}

// Helper to convert role string to Title Case
const formatRole = (role: string) => {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function Topbar({
  user,
  full_name,
  user_role,
  pageTitle = "", // default empty
  avatarUrl,
  onLogout,
}: TopbarProps) {
  return (
    <div className="flex justify-between items-center px-6 py-4 rounded-b-2xl shadow-lg text-black relative">
      {/* Left side */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">{`Welcome, ${full_name}`}</h2>
        <p className="text-sm text-gray-700">{formatRole(user_role)}</p>
      </div>

      {/* Center - page title */}
      {pageTitle && (
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
        </div>
      )}

      {/* Right side - profile dropdown */}
      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl shadow-md hover:shadow-lg transform transition-all hover:-translate-y-0.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full shadow-sm"
              unoptimized
            />
          ) : (
            <FaUserCircle className="w-10 h-10 text-gray-600" />
          )}
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-gray-900">
              {full_name}
            </span>
            <span className="text-xs text-gray-500">{formatRole(user_role)}</span>
          </div>
          <FiChevronDown className="w-5 h-5 text-gray-600 ml-2" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-150"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-100"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="/profile"
                  className={`block px-4 py-2 text-sm font-medium ${
                    active ? "bg-teal-100 rounded-lg" : ""
                  }`}
                >
                  Profile
                </a>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <a
                  href="/settings"
                  className={`block px-4 py-2 text-sm font-medium ${
                    active ? "bg-teal-100 rounded-lg" : ""
                  }`}
                >
                  Profile Settings
                </a>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onLogout}
                  className={`w-full text-left px-4 py-2 text-sm font-medium ${
                    active ? "bg-teal-100 rounded-lg" : ""
                  }`}
                >
                  Logout
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
