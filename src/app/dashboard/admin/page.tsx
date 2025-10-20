"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Users, Database, RefreshCw, TrendingUp, Building2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard-header";

interface Organization {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users?: number;
    loans?: number;
  };
}

interface AdminStats {
  totalLoans: number;
  totalClients: number;
  totalApplications: number;
  totalLoansAmount: number;
  totalOrganizations: number;
  totalUsers: number;
}

export default function AdminPage() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAdmin = () => {
      if (user?.primaryEmailAddress?.emailAddress !== "pirgozi1@gmail.com") {
        toast.error("Prístup zamietnutý - nie ste super admin");
      }
    };
    checkAdmin();
    fetchAdminStats();
    fetchOrganizations();
  }, [user?.primaryEmailAddress?.emailAddress]);

  const fetchAdminStats = async () => {
    try {
      const [loansRes, clientsRes, appsRes, orgsRes] = await Promise.all([
        fetch("/api/loans"),
        fetch("/api/clients"),
        fetch("/api/applications"),
        fetch("/api/organizations"),
      ]);

      const loans = await loansRes.json();
      const clients = await clientsRes.json();
      const apps = await appsRes.json();
      const orgs = await orgsRes.json();

      setStats({
        totalLoans: loans.data?.length || 0,
        totalClients: clients.data?.length || 0,
        totalApplications: apps.data?.length || 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        totalLoansAmount: (loans.data || []).reduce((sum: number, l: any) => sum + (l.amount || 0), 0),
        totalOrganizations: orgs.data?.length || 0,
        totalUsers: (orgs.data || []).reduce((sum: number, o: Organization) => sum + (o._count?.users || 0), 0),
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      toast.error("Chyba pri načítaní štatistík");
    }
  };

  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const response = await fetch("/api/organizations");
      const data = await response.json();
      setOrganizations(data.data || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Chyba pri načítaní organizácií");
    } finally {
      setLoadingOrgs(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardHeader currentPage="dashboard" />

      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Super Admin Panel</h2>
              <p className="text-gray-600 mt-1">Vitajte, {user?.firstName}! Spravujte celý systém.</p>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizácie</CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrganizations || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Používatelia</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Úvery</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLoans || 0}</div>
              <p className="text-xs text-slate-600">€{((stats?.totalLoansAmount || 0) / 100).toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Klienti</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
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

        {/* Organizations Table */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Organizácie</CardTitle>
                <CardDescription>Prehľad všetkých organizácií v systéme</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  fetchAdminStats();
                  fetchOrganizations();
                  toast.success("Údaje obnovené");
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingOrgs ? (
              <div className="text-center py-8 text-slate-500">Načítavam organizácie...</div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Žiadne organizácie</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Názov</TableHead>
                      <TableHead className="text-right">Používatelia</TableHead>
                      <TableHead className="text-right">Úvery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vytvorené</TableHead>
                      <TableHead className="text-right">Akcie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell className="text-right">{org._count?.users || 0}</TableCell>
                        <TableCell className="text-right">{org._count?.loans || 0}</TableCell>
                        <TableCell>
                          <Badge className={org.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {org.isActive ? "Aktívna" : "Neaktívna"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {new Date(org.createdAt).toLocaleDateString("sk-SK")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/organizations/${org.id}`}>
                            <Button variant="ghost" size="sm">
                              Detail
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
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
                  fetchOrganizations();
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
      </div>
    </div>
  );
}
