
"use client";

import { useCallback, useEffect, useState } from "react";
import { hearingAPI } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import {
  CalendarDays,
  RefreshCw,
  Search,
  Clock,
  Loader2,
} from "lucide-react";

type Hearing = {
  activity_id: number;
  case_id: number;
  case_number: string;
  case_title: string;
  case_status: string;
  activity_title: string;
  next_hearing_date: string;
  description?: string;
};

export default function HearingsPage() {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todayDate, setTodayDate] = useState("");

  // Get today's date after the component mounts
  useEffect(() => {
    const now = new Date();

    const localDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    setTodayDate(localDate);
  }, []);

  // Fetch upcoming hearings
  const loadHearings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await hearingAPI.getUpcoming(days);

      const sorted = [...data].sort((a, b) =>
        a.next_hearing_date.localeCompare(b.next_hearing_date)
      );

      setHearings(sorted);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load hearing records."
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadHearings();
  }, [loadHearings]);

  // Search hearings
  const filteredHearings = hearings.filter((item) =>
    [
      item.case_number,
      item.case_title,
      item.activity_title,
      item.case_status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Format date for display
  const formatDate = (date: string) => {
    if (!date) return "—";

    const [year, month, day] = date.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Calculate hearing statistics
  const todayCount = todayDate
    ? hearings.filter(
        (item) => item.next_hearing_date === todayDate
      ).length
    : 0;

  const upcomingCount = todayDate
    ? hearings.filter(
        (item) => item.next_hearing_date > todayDate
      ).length
    : 0;

  return (
    <DashboardShell
      title="Hearing Calendar"
      subtitle="Track upcoming court hearings and scheduled proceedings."
    >
    <div className="min-h-screen bg-gray-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hearing Calendar
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track upcoming court hearings and scheduled proceedings.
            </p>
          </div>

          <button
            onClick={loadHearings}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">
              Total Scheduled
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {hearings.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">
              Today's Hearings
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-700">
              {todayCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">
              Future Hearings
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {upcomingCount}
            </p>
          </div>

        </div>

        {/* Hearing Records */}
        <div className="rounded-xl border border-gray-200 bg-white">

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 p-5">
            <div>
              <h2 className="font-semibold text-gray-900">
                Scheduled Hearings
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Live records retrieved from the backend.
              </p>
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap gap-2">
              {[7, 15, 30, 90].map((value) => (
                <button
                  key={value}
                  onClick={() => setDays(value)}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    days === value
                      ? "bg-green-800 text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {value} Days
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="border-b border-gray-100 p-4">
            <div className="relative max-w-sm">
              <Search
                size={17}
                className="absolute left-3 top-3 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hearings..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-700"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center gap-2 p-12 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              Loading hearing records...
            </div>

          ) : filteredHearings.length === 0 ? (

            /* Empty State */
            <div className="p-12 text-center">
              <CalendarDays
                size={36}
                className="mx-auto mb-3 text-gray-300"
              />

              <p className="font-medium text-gray-700">
                No upcoming hearings found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try another date range or search term.
              </p>
            </div>

          ) : (

            /* Hearing List */
            <div className="divide-y divide-gray-100">
              {filteredHearings.map((item) => (
                <div
                  key={item.activity_id}
                  className="flex flex-col gap-4 p-5 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-800">
                      <CalendarDays size={22} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.activity_title}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-green-800">
                        {item.case_number}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {item.case_title}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        {item.description ||
                          "No additional details available."}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <span className="flex items-center gap-2 font-semibold text-gray-900">
                      <Clock size={16} className="text-green-700" />
                      {formatDate(item.next_hearing_date)}
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {item.case_status}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
    </DashboardShell>
  );
}
