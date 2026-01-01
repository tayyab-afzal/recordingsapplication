"use client";

import ThemeToggle from "@/components/Theme/ThemeToggle";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-6">
            <h1 className="heading text-3xl text-heading-gradient mb-2">
              {title}
            </h1>
            {subtitle && <p className="body-text text-para">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
