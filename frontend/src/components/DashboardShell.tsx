"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  FileText,
  LayoutDashboard,
  Menu,
  Scale,
  X,
} from "lucide-react";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Case Management", icon: BriefcaseBusiness },
  { href: "/documents", label: "Document Management", icon: FileText },
  { href: "/activities", label: "Case Activities", icon: Clock },
  { href: "/hearings", label: "Hearing Calendar", icon: CalendarDays },
];

type DashboardShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function DashboardShell({
  title,
  subtitle,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f9f7] text-slate-800">
      <div className="flex min-h-screen">
        {mobileMenu && (
          <button
            aria-label="Close navigation"
            onClick={() => setMobileMenu(false)}
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          />
        )}

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
              <h1 className="text-xl font-bold tracking-wide">NyayaDesk</h1>
              <p className="text-xs text-green-100">Legal Case Intelligence</p>
            </div>
            <button
              onClick={() => setMobileMenu(false)}
              aria-label="Close navigation"
              className="ml-auto rounded-lg p-1 hover:bg-white/10 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-4 py-7">
            <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-green-200">
              Main Menu
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
                AI-powered legal assistance and case analysis
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-green-200">
                <span className="h-2 w-2 rounded-full bg-green-300" />
                System Ready
              </div>
            </div>
            <p className="mt-5 text-center text-xs text-green-200">Version 1.0.0</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex min-h-16 items-center border-b border-slate-200 bg-white px-3 py-3 sm:h-20 sm:px-8">
            <button
              onClick={() => setMobileMenu(true)}
              aria-label="Open navigation"
              className="mr-3 rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              <p className="hidden text-xs text-slate-500 sm:block">{subtitle}</p>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
