"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Users,
  FileBarChart,
  AlertCircle,
  FileText,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface DashboardHeaderProps {
  currentPage?: "dashboard" | "clients" | "loans" | "applications" | "reports" | "reminders" | "overdue";
}

export function DashboardHeader({ currentPage = "dashboard" }: DashboardHeaderProps) {
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: null, id: "dashboard" },
    { href: "/dashboard/clients", label: "Klienti", icon: Users, id: "clients" },
    { href: "/dashboard/loans", label: "Úvery", icon: FileBarChart, id: "loans" },
    { href: "/dashboard/applications", label: "Žiadosti", icon: FileText, id: "applications" },
    { href: "/dashboard/reports", label: "Reporty", icon: TrendingUp, id: "reports" },
    { href: "/dashboard/reminders", label: "Upomienky", icon: AlertCircle, id: "reminders" },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
                Nafinancuj.sk
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                const Icon = item.icon;
                return (
                  <Link key={item.id} href={item.href}>
                    <div
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                          : "text-slate-600 hover:bg-white/60 hover:text-blue-600"
                      }`}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm" className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                <Settings className="h-4 w-4 mr-2" />
                Nastavenia
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}
