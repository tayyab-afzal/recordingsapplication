"use client";

export default function OverviewModule() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="dashboard-card">
          <h2 className="heading text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Recordings Table here
          </h2>
          <p className="body-text text-gray-600 dark:text-gray-400">
            Your dashboard overview content goes here.
          </p>
        </div>
      </div>
    </div>
  );
}
