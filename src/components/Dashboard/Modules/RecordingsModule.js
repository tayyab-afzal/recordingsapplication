"use client";

import { useEffect, useState } from "react";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PhoneArrowDownLeftIcon,
  PhoneArrowUpRightIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

export default function RecordingsModule() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [countLoading, setCountLoading] = useState(false);

  const [ani, setAni] = useState("");
  const [dnisCode, setDnisCode] = useState("");
  const [localStartTime, setLocalStartTime] = useState("");
  const [localEndTime, setLocalEndTime] = useState("");
  const [goToPage, setGoToPage] = useState("");

  const fetchTotalCount = async () => {
    try {
      setCountLoading(true);
      const params = new URLSearchParams();

      if (ani) params.append("ani", ani);
      if (dnisCode) params.append("dnis_code", dnisCode);
      if (localStartTime) params.append("local_start_time", localStartTime);
      if (localEndTime) params.append("local_end_time", localEndTime);

      const res = await fetch(`/api/auth/recordings/count?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch count");
      }

      const data = await res.json();
      const count = data.totalCount || 0;
      setTotalCount(count);
      // Calculate total pages: Math.ceil(count / 50)
      const calculatedTotalPages = Math.ceil(count / 50) || 1;
      setTotalPages(calculatedTotalPages);
    } catch (err) {
      console.error("Error fetching count:", err);
      // Don't set error state, just log it
    } finally {
      setCountLoading(false);
    }
  };

  const fetchRecordings = async (page = 1, startKey = null) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (startKey) {
        params.append("lastKey", startKey);
      }

      if (ani) params.append("ani", ani);
      if (dnisCode) params.append("dnis_code", dnisCode);
      if (localStartTime) params.append("local_start_time", localStartTime);
      if (localEndTime) params.append("local_end_time", localEndTime);

      const res = await fetch(`/api/auth/recordings?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Failed to fetch recordings");
      }

      const data = await res.json();
      console.log(data);
      setRecordings(data.recordings || []);
      setCurrentPage(data.pagination.currentPage);
      setHasMore(data.pagination.hasMore);
      setLastEvaluatedKey(data.pagination.lastEvaluatedKey);
      // Don't update totalPages from pagination response, use calculated value
    } catch (err) {
      setError(err.message || "Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchTotalCount();
      await fetchRecordings(1);
    };
    loadData();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    setLastEvaluatedKey(null);
    fetchTotalCount();
    fetchRecordings(1, null);
  };

  const handlePageChange = (newPage, useLastKey = false) => {
    if (newPage >= 1) {
      setCurrentPage(newPage);
      fetchRecordings(newPage, useLastKey ? lastEvaluatedKey : null);
    }
  };

  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage, 10);
    if (pageNum >= 1 && !isNaN(pageNum) && pageNum <= totalPages) {
      // Reset lastEvaluatedKey when jumping to a specific page
      setLastEvaluatedKey(null);
      handlePageChange(pageNum, false);
      setGoToPage("");
    } else {
      // Show error or reset if invalid input
      if (pageNum > totalPages) {
        alert(`Page number cannot exceed ${totalPages}`);
      }
      setGoToPage("");
    }
  };

  const getDirectionIcon = (direction) => {
    switch (direction) {
      case "1":
        return (
          <PhoneArrowDownLeftIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
        );
      case "2":
        return (
          <PhoneArrowUpRightIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        );
      case "3":
        return (
          <PhoneIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        );
      default:
        return (
          <PhoneIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    try {
      return new Date(dateTime).toLocaleString();
    } catch {
      return dateTime;
    }
  };

  return (
    <div className="flex justify-center w-full">
      <div className="w-full">
        <div className="dashboard-card w-full">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search by ANI..."
                value={ani}
                onChange={(e) => setAni(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="form-input input-with-icon"
              />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search by DNIS Code..."
                value={dnisCode}
                onChange={(e) => setDnisCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="form-input input-with-icon"
              />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search by Start Time..."
                value={localStartTime}
                onChange={(e) => setLocalStartTime(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="form-input input-with-icon"
              />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search by End Time..."
                value={localEndTime}
                onChange={(e) => setLocalEndTime(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="form-input input-with-icon"
              />
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSearch}
                className="btn-primary px-5 py-2 text-sm h-[40px]"
              >
                Search
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-300 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="error-text">
              <span>{error}</span>
              <button
                onClick={() => fetchRecordings(currentPage)}
                className="btn-primary px-4 py-2 text-sm"
              >
                Retry
              </button>
            </div>
          ) : recordings.length === 0 ? (
            <p className="body-text text-gray-600 dark:text-gray-400 text-center py-8">
              No recordings found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        Contact ID
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        Agent ID
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        CLI
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        ANI
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        DNIS Code
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        Org ID
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        Duration
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        Direction
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        Local Start Time
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">
                        Local End Time
                      </th>
                      <th className="text-center py-3 px-4 text-gray-900 dark:text-gray-100">
                        Download
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordings.map((recording, index) => (
                      <tr
                        key={recording.contactId || index}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 body-text text-gray-900 dark:text-gray-100">
                          {recording.contactId || "N/A"}
                        </td>
                        <td className="py-3 px-4 body-text text-gray-600 dark:text-gray-400">
                          {recording.agent_id || "N/A"}
                        </td>
                        <td className="py-3 px-4 body-text text-gray-600 dark:text-gray-400">
                          {recording.cli || "N/A"}
                        </td>
                        <td className="py-3 px-4 body-text text-gray-600 dark:text-gray-400">
                          {recording.ani || "N/A"}
                        </td>
                        <td className="py-3 px-4 body-text text-gray-600 dark:text-gray-400">
                          {recording.dnis_code || "N/A"}
                        </td>
                        <td className="py-3 px-4 body-text text-gray-600 dark:text-gray-400">
                          {recording.org_id || "N/A"}
                        </td>
                        <td className="py-3 px-4 body-text text-gray-600 dark:text-gray-400 text-center">
                          {formatDuration(recording.duration)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center">
                            {getDirectionIcon(recording.direction)}
                          </div>
                        </td>

                        <td className="py-3 px-4 body-text text-gray-600 dark:text-gray-400">
                          {formatDateTime(recording.local_start_time)}
                        </td>
                        <td className="py-3 px-4 body-text text-gray-600 dark:text-gray-400">
                          {formatDateTime(recording.local_end_time)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {recording.downloadUrl || recording.filepath ? (
                            <a
                              href={recording.downloadUrl || recording.filepath}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="inline-flex items-center justify-center text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                              title="Download recording"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </a>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">
                              N/A
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
               <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                 <div className="body-text text-gray-600 dark:text-gray-400">
                   Page {currentPage} of {totalPages}
                   {totalCount > 0 && (
                     <span className="ml-2 text-xs">
                       ({totalCount.toLocaleString()} rows)
                     </span>
                   )}
                 </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1, false)}
                    disabled={currentPage === 1}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={goToPage}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseInt(val, 10);
                        if (val === "" || (!isNaN(num) && num >= 1 && num <= totalPages)) {
                          setGoToPage(val);
                        }
                      }}
                      placeholder="Page"
                      className="form-input w-20 text-center"
                      onKeyDown={(e) => e.key === "Enter" && handleGoToPage()}
                    />
                    <button
                      onClick={handleGoToPage}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      Go
                    </button>
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1, true)}
                    disabled={!hasMore}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>{" "}
    </div>
  );
}
