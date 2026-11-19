"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  FileText,
  CalendarDays,
  Bell,
  Search,
  Menu,
  Scale,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bot,
  RefreshCw,
  Languages,
  X,
  Gavel,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

interface DashboardStats {
  total_cases: number;
  pending_cases: number;
  under_review_cases: number;
  disposed_cases: number;
  total_documents: number;
  upcoming_hearings: number;
  todays_hearings: number;
}

interface CaseItem {
  id: number;
  case_number: string;
  case_title: string;
  case_type: string;
  case_category: string;
  court_name: string;
  petitioner: string;
  respondent: string;
  filing_date: string;
  status: string;
  description: string;
}

interface HearingItem {
  activity_id: number;
  case_id: number;
  case_number: string;
  case_title: string;
  case_status: string;
  activity_title: string;
  next_hearing_date: string;
  description: string;
}

const emptyStats: DashboardStats = {
  total_cases: 0,
  pending_cases: 0,
  under_review_cases: 0,
  disposed_cases: 0,
  total_documents: 0,
  upcoming_hearings: 0,
  todays_hearings: 0,
};

function formatDate(date: string) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${monthNames[Number(month) - 1] ?? ""} ${year}`;
}

function statusStyle(status: string) {
  const value = status.toLowerCase();

  if (value === "pending") {
    return "bg-amber-50 text-amber-700";
  }

  if (value === "disposed") {
    return "bg-green-100 text-green-800";
  }

  if (value === "under review") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default function Home() {
  const pathname = usePathname();
  const [language, setLanguage] = useState<"EN" | "HI">("EN");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [hearings, setHearings] = useState<HearingItem[]>([]);

  const [statsLoading, setStatsLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(true);
  const [hearingsLoading, setHearingsLoading] = useState(true);

  const [statsError, setStatsError] = useState("");
  const [casesError, setCasesError] = useState("");
  const [hearingsError, setHearingsError] = useState("");

  const hindi = language === "HI";

  const loadDashboard = useCallback(async () => {
    setStatsLoading(true);
    setCasesLoading(true);
    setHearingsLoading(true);

    setStatsError("");
    setCasesError("");
    setHearingsError("");

    const headers = {
      Accept: "application/json",
    };

    // Dashboard statistics
    const loadStats = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/dashboard/statistics`,
          { headers, cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: DashboardStats = await response.json();
        setStats(data);
      } catch {
        setStatsError(
          "Unable to load dashboard statistics. Please check the backend."
        );
      } finally {
        setStatsLoading(false);
      }
    };

    // Registered cases
    const loadCases = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/cases/`, {
          headers,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: CaseItem[] = await response.json();
        setCases(Array.isArray(data) ? data : []);
      } catch {
        setCasesError("Unable to load registered cases.");
      } finally {
        setCasesLoading(false);
      }
    };

    // Upcoming hearings
    const loadHearings = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/hearings/upcoming?days=30`,
          { headers, cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: HearingItem[] = await response.json();
        setHearings(Array.isArray(data) ? data : []);
      } catch {
        setHearingsError("Unable to load upcoming hearings.");
      } finally {
        setHearingsLoading(false);
      }
    };

    await Promise.all([loadStats(), loadCases(), loadHearings()]);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  const filteredCases = cases.filter((item) => {
    const query = search.toLowerCase();

    return (
      item.case_number.toLowerCase().includes(query) ||
      item.case_title.toLowerCase().includes(query) ||
      item.court_name.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query)
    );
  });

  const navigation = [
    { href: "/", label: hindi ? "डैशबोर्ड" : "Dashboard", icon: LayoutDashboard },
    { href: "/cases", label: hindi ? "सभी मामले" : "Case Management", icon: BriefcaseBusiness },
    { href: "/documents", label: hindi ? "दस्तावेज़" : "Document Management", icon: FileText },
    { href: "/activities", label: hindi ? "केस गतिविधियाँ" : "Case Activities", icon: Clock },
    { href: "/hearings", label: hindi ? "सुनवाई कैलेंडर" : "Hearing Calendar", icon: CalendarDays },
  ];

  const statisticCards = [
    {
      title: hindi ? "कुल मामले" : "Total Cases",
      value: stats.total_cases,
      description: hindi ? "कुल पंजीकृत मामले" : "All registered cases",
      icon: BriefcaseBusiness,
      iconStyle: "bg-green-50 text-green-800",
    },
    {
      title: hindi ? "लंबित मामले" : "Pending Cases",
      value: stats.pending_cases,
      description: hindi ? "कार्रवाई अपेक्षित" : "Require attention",
      icon: Clock,
      iconStyle: "bg-amber-50 text-amber-700",
    },
    {
      title: hindi ? "समीक्षाधीन" : "Under Review",
      value: stats.under_review_cases,
      description: hindi ? "समीक्षा जारी है" : "Currently under review",
      icon: AlertCircle,
      iconStyle: "bg-blue-50 text-blue-700",
    },
    {
      title: hindi ? "निस्तारित मामले" : "Disposed Cases",
      value: stats.disposed_cases,
      description: hindi ? "निस्तारित मामले" : "Successfully disposed",
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9f7] text-slate-800">
      <div className="flex min-h-screen">

        {/* Mobile overlay */}
        {mobileMenu && (
          <button
            aria-label="Close navigation"
            onClick={() => setMobileMenu(false)}
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#174b35] text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileMenu ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-20 items-center gap-3 border-b border-white/15 px-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#174b35]">
              <Scale size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-wide">
                NyayaDesk
              </h1>
              <p className="text-xs text-green-100">
                Legal Case Intelligence
              </p>
            </div>

            <button
              onClick={() => setMobileMenu(false)}
              className="ml-auto rounded-lg p-1 hover:bg-white/10 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-4 py-7">
            <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-green-200">
              {hindi ? "मुख्य मेनू" : "Main Menu"}
            </p>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenu(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? "bg-white font-semibold text-[#174b35] shadow-sm"
                        : "text-green-50 hover:bg-white/10"
                    }`}
                  >
                    <Icon size={19} className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-xl border border-white/20 bg-[#103d2b] p-4">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-green-200" />
                <p className="text-sm font-semibold">NyayaDesk AI</p>
              </div>

              <p className="mt-2 text-xs leading-5 text-green-100">
                {hindi
                  ? "AI आधारित कानूनी सहायता और केस विश्लेषण"
                  : "AI-powered legal assistance and case analysis"}
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs text-green-200">
                <span className="h-2 w-2 rounded-full bg-green-300" />
                {hindi ? "सिस्टम तैयार" : "System Ready"}
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-green-200">
              Version 1.0.0
            </p>
          </div>
        </aside>

        {/* Main area */}
        <main className="min-w-0 flex-1">

          {/* Header */}
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3 sm:h-20 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenu(true)}
                className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              >
                <Menu size={22} />
              </button>

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {hindi ? "डैशबोर्ड" : "Dashboard"}
                </h2>

                <p className="hidden text-xs text-slate-500 sm:block">
                  {hindi
                    ? "विभागीय कानूनी मामलों का अवलोकन"
                    : "Departmental legal case overview"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-5">
              <Link
                href="/assistant"
                className="flex items-center gap-2 rounded-lg border border-green-200 px-2 py-2 text-xs font-semibold text-green-800 hover:bg-green-50 sm:px-3 sm:text-sm"
              >
                <Bot size={17} />
                <span className="hidden sm:inline">AI Assistant</span>
              </Link>

              <button
                onClick={() => setRefreshKey((value) => value + 1)}
                title="Refresh dashboard"
                className="rounded-lg p-2 text-slate-600 hover:bg-green-50 hover:text-green-800"
              >
                <RefreshCw size={19} />
              </button>

              <button
                onClick={() => setLanguage(hindi ? "EN" : "HI")}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold hover:bg-green-50 sm:gap-2 sm:px-3 sm:text-sm"
              >
                <Languages size={17} />
                {language}
              </button>

              <button
                aria-label="Notifications"
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              >
                <Bell size={21} />
              </button>

              <div className="hidden items-center gap-3 border-l border-slate-200 pl-5 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 font-bold text-green-800">
                  A
                </div>
                <div>
                  <p className="text-sm font-semibold">Admin User</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-6 p-3 sm:space-y-7 sm:p-8">

            {/* Welcome section */}
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-green-800">
                  {hindi ? "नमस्कार, एडमिन" : "Welcome back, Admin"}
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {hindi
                    ? "कानूनी मामलों का डैशबोर्ड"
                    : "Legal Case Dashboard"}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  {hindi
                    ? "अपने विभाग के सभी कानूनी मामलों और गतिविधियों पर नज़र रखें।"
                    : "Monitor your department's cases, documents and legal activities."}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-800">
                <CheckCircle2 size={18} />
                {hindi ? "लाइव डेटाबेस कनेक्शन" : "Live Database"}
              </div>
            </section>

            {/* Statistics */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              {statisticCards.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.title}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-500">
                        {stat.title}
                      </p>

                      <div className={`rounded-lg p-3 ${stat.iconStyle}`}>
                        <Icon size={21} />
                      </div>
                    </div>

                    <h3 className="mt-4 text-3xl font-bold text-slate-900">
                      {statsLoading ? "..." : stat.value}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {stat.description}
                    </p>
                  </div>
                );
              })}
            </section>

            {statsError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {statsError}
              </div>
            )}

            {/* Additional statistics */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
                <div className="rounded-lg bg-green-50 p-3 text-green-800">
                  <FileText size={22} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    {hindi ? "कुल दस्तावेज़" : "Total Documents"}
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {statsLoading ? "..." : stats.total_documents}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
                <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    {hindi ? "आगामी सुनवाई" : "Upcoming Hearings"}
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {statsLoading ? "..." : stats.upcoming_hearings}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
                <div className="rounded-lg bg-amber-50 p-3 text-amber-700">
                  <Gavel size={22} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    {hindi ? "आज की सुनवाई" : "Today's Hearings"}
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {statsLoading ? "..." : stats.todays_hearings}
                  </p>
                </div>
              </div>
            </section>

            {/* Cases and Hearings */}
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

              {/* Recent Cases */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white xl:col-span-2">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {hindi ? "पंजीकृत मामले" : "Registered Cases"}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {hindi
                        ? "डेटाबेस में उपलब्ध मामले"
                        : "Cases retrieved from the database"}
                    </p>
                  </div>

                  <span className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-800">
                    {cases.length} {hindi ? "मामले" : "Records"}
                  </span>
                </div>

                {/* Search */}
                <div className="border-b border-slate-100 p-4">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={
                        hindi
                          ? "केस नंबर, नाम या कोर्ट से खोजें..."
                          : "Search by case number, title or court..."
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-[#f7f9f7] text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">
                          Case Details
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Court
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Status
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Filing Date
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {casesLoading ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-5 py-10 text-center text-slate-500"
                          >
                            Loading cases...
                          </td>
                        </tr>
                      ) : casesError ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-5 py-10 text-center text-red-600"
                          >
                            {casesError}
                          </td>
                        </tr>
                      ) : filteredCases.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-5 py-12 text-center"
                          >
                            <BriefcaseBusiness
                              size={30}
                              className="mx-auto mb-3 text-slate-300"
                            />
                            <p className="font-medium text-slate-600">
                              {search
                                ? "No matching cases found."
                                : "No cases have been registered yet."}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredCases.map((item) => (
                          <tr
                            key={item.id}
                            className="transition hover:bg-green-50/40"
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-800">
                                {item.case_title}
                              </p>
                              <p className="mt-1 text-xs text-green-800">
                                {item.case_number}
                              </p>
                            </td>

                            <td className="max-w-[190px] px-5 py-4 text-slate-600">
                              {item.court_name || "—"}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${statusStyle(item.status)}`}
                              >
                                {item.status}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                              {formatDate(item.filing_date)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Upcoming Hearings */}
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 p-5">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {hindi ? "आगामी सुनवाई" : "Upcoming Hearings"}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {hindi
                        ? "अगले 30 दिनों की सुनवाई"
                        : "Hearings scheduled for next 30 days"}
                    </p>
                  </div>

                  <CalendarDays size={21} className="text-green-800" />
                </div>

                <div className="space-y-5 p-5">
                  {hearingsLoading ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Loading hearings...
                    </p>
                  ) : hearingsError ? (
                    <p className="py-8 text-center text-sm text-red-600">
                      {hearingsError}
                    </p>
                  ) : hearings.length === 0 ? (
                    <div className="py-8 text-center">
                      <CalendarDays
                        size={30}
                        className="mx-auto mb-3 text-slate-300"
                      />
                      <p className="text-sm font-medium text-slate-600">
                        No upcoming hearings.
                      </p>
                    </div>
                  ) : (
                    hearings.map((hearing) => {
                      const [, month, day] = hearing.next_hearing_date.split("-");
                      const monthNames = [
                        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                      ];

                      return (
                        <div
                          key={hearing.activity_id}
                          className="flex min-w-0 gap-3"
                        >
                          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-green-50 text-green-900">
                            <span className="text-xl font-bold leading-none">
                              {day || "—"}
                            </span>

                            <span className="mt-1 text-[10px] font-bold uppercase">
                              {monthNames[Number(month) - 1] ?? "—"}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">
                              {hearing.case_title}
                            </p>

                            <p className="mt-1 text-xs text-green-800">
                              {hearing.case_number}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(hearing.next_hearing_date)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-100 p-4">
                  <p className="text-center text-xs text-slate-500">
                    {hindi
                      ? "आगामी 30 दिनों का डेटा"
                      : "Showing upcoming 30-day schedule"}
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-500">
              NyayaDesk · Legal Case Intelligence System
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
