"use client";

import { useEffect, useState, useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function UsersModule() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/users");

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }

    const query = searchQuery.toLowerCase().trim();
    return users.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [users, searchQuery]);

  return (
    <div>
      <div className="dashboard-card w-3/4 mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-300 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="error-text">
            <span>{error}</span>
            <button
              onClick={fetchUsers}
              className="btn-primary px-4 py-2 text-sm"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input input-with-icon"
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <p className="body-text text-gray-600 dark:text-gray-400 text-center py-8">
                {searchQuery
                  ? "No users found matching your search."
                  : "No users found."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        Email
                      </th>
                      <th className="text-center py-3 px-4 text-gray-900 dark:text-gray-100">
                        Role
                      </th>
                      <th className="text-center py-3 px-4 text-gray-900 dark:text-gray-100">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 body-text text-gray-900 dark:text-gray-100">
                          {user.name || "N/A"}
                        </td>
                        <td className="py-3 px-4 body-text text-gray-600 dark:text-gray-400">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {user.role || "user"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {user.status || "active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
