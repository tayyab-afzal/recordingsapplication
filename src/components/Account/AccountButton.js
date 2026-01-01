"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

export default function AccountButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/sign-in");
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="account-button"
        aria-label="Account menu"
      >
        <UserCircleIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
          {session.user.name || session.user.email?.split("@")[0]}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-700 dark:text-gray-300 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="account-dropdown">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {session.user.name || "User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session.user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
