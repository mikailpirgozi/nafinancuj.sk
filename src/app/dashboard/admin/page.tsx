"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, FileBarChart, AlertCircle, Database, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    checkSuperAdmin();
    fetchAdminStats();
  }, []);

  const checkSuperAdmin = async () => {
    if (user?.primaryEmailAddress?.emailAddress !== "pirgozi1@gmail.com") {
      toast.error("Prístup zamietnutý - nie ste super admin");
    }
  };

  const fetchAdminStats = async () => {
    try {
      const [loansRes, clientsRes, appsRes] = await Promise.all([
        fetch("/api/loans"),
        fetch("/api/clients"),
        fetch("/api/applications"),
      ]);

      const loans = await loansRes.json();
      const clients = await clientsRes.json();
      const apps = await appsRes.json();

      setStats({
        totalLoans: loans.data?.length || 0,
        totalClients: clients.data?.length || 0,
        totalApplications: apps.data?.length || 0,
        totalLoansAmount: (loans.data || []).reduce((sum: number, l: any) => sum + (l.amount || 0), 0),
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      toast.error("Chyba pri načítaní štatistík");
    }
  };

  if (!mounted) return null;

  if (user?.primaryEmailAddress?.emailAddress !== "pirgozi1@gmail.com") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Pristup zamietnuty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Len super admin ma pristup k tejto stranke.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-900">Nafinancuj.sk - Super Admin</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Super Admin Panel</h2>
              <p className="text-gray-600 mt-1">Vitajte, {user?.firstName}! Spravujte celý systém.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Celkové úvery</CardTitle>
              <FileBarChart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLoans || 0}</div>
              <p className="text-xs text-slate-600">€{((stats?.totalLoansAmount || 0) / 100).toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Klienti</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Žiadosti</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Database className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <Badge className="bg-green-100 text-green-800">Online</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Admin Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Návigácia</CardTitle>
              <CardDescription>Rýchly prístup k jednotlivým sekciám</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-start">
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/clients">
                <Button variant="outline" className="w-full justify-start">
                  Klienti
                </Button>
              </Link>
              <Link href="/dashboard/loans">
                <Button variant="outline" className="w-full justify-start">
                  Úvery
                </Button>
              </Link>
              <Link href="/dashboard/applications">
                <Button variant="outline" className="w-full justify-start">
                  Žiadosti
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Administrácia</CardTitle>
              <CardDescription>Ovládacie prvky pre správu systému</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  fetchAdminStats();
                  toast.success("Štatistiky obnovené");
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Obnoviť štatistiky
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Spravovať užívateľov
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Informácie o Super Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>✅ Super Admin prístup: <strong>pirgozi1@gmail.com</strong></p>
            <p>✅ Všetka administrácia systému je dostupná</p>
            <p>✅ Možnosť správy užívateľov a nastavení</p>
            <p>✅ Monitoring všetkých transakcií</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
