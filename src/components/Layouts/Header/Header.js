"use client";

import ThemeToggle from "@/components/Theme/ThemeToggle";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/sign-in");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-8 sm:px-8 lg:px-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Recordings Application
        </h1>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 p-2"
          >
            <ArrowRightStartOnRectangleIcon className="w-6 h-6 text-red-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
