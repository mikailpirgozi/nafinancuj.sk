"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, TrendingUp, Download, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";

interface Organization {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users: number;
    loans: number;
  };
}

interface DashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalLoans: number;
  totalLoanVolume: number;
}

const COLORS = ["#1e3a8a", "#ea580c", "#059669", "#dc2626", "#7c3aed"];

export default function SuperAdminDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    totalLoans: 0,
    totalLoanVolume: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/organizations");
      const data = await res.json();
      
      if (data.organizations) {
        setOrganizations(data.organizations);
        
        // Calculate stats
        const totalOrgs = data.organizations.length;
        const activeOrgs = data.organizations.filter((o: Organization) => o.isActive).length;
        const totalUsers = data.organizations.reduce((sum: number, o: Organization) => sum + (o._count?.users || 0), 0);
        const totalLoans = data.organizations.reduce((sum: number, o: Organization) => sum + (o._count?.loans || 0), 0);
        
        setStats({
          totalOrganizations: totalOrgs,
          activeOrganizations: activeOrgs,
          totalUsers,
          totalLoans,
          totalLoanVolume: 0, // Would need additional API call
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      organizations.map((org) => ({
        Názov: org.name,
        "Kontaktná osoba": org.contactPerson,
        Email: org.email,
        Telefón: org.phone || "N/A",
        Status: org.isActive ? "Aktívny" : "Neaktívny",
        "Počet používateľov": org._count?.users || 0,
        "Počet úverov": org._count?.loans || 0,
        "Dátum vytvorenia": new Date(org.createdAt).toLocaleDateString("sk-SK"),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Organizácie");
    XLSX.writeFile(workbook, `organizacie_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const chartData = organizations.slice(0, 10).map((org) => ({
    name: org.name.length > 20 ? org.name.substring(0, 20) + "..." : org.name,
    users: org._count?.users || 0,
    loans: org._count?.loans || 0,
  }));

  const pieData = [
    { name: "Aktívne", value: stats.activeOrganizations },
    { name: "Neaktívne", value: stats.totalOrganizations - stats.activeOrganizations },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-orange-600 bg-clip-text text-transparent">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Prehľad všetkých organizácií a systémové štatistiky</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Obnoviť
          </Button>
          <Button onClick={exportToExcel} className="bg-gradient-to-r from-blue-900 to-blue-800">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-t-4 border-t-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizácie</CardTitle>
            <Building2 className="h-4 w-4 text-blue-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeOrganizations} aktívnych
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-orange-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Používatelia</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Celkovo v systéme</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Úvery</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLoans}</div>
            <p className="text-xs text-gray-500 mt-1">Celkovo poskytnutých</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objem úverov</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalLoanVolume.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Celková hodnota</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 organizácií</CardTitle>
            <CardDescription>Podľa počtu používateľov a úverov</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#1e3a8a" name="Používatelia" />
                <Bar dataKey="loans" fill="#ea580c" name="Úvery" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status organizácií</CardTitle>
            <CardDescription>Aktívne vs. neaktívne</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: unknown) => {
                    const { name, percent } = props as { name: string; percent: number };
                    return `${name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Všetky organizácie</CardTitle>
          <CardDescription>Kompletný zoznam registrovaných organizácií</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Načítavam...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Názov</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Používatelia</TableHead>
                  <TableHead>Úvery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vytvorené</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{org.contactPerson}</div>
                        <div className="text-gray-500">{org.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{org._count?.users || 0}</TableCell>
                    <TableCell>{org._count?.loans || 0}</TableCell>
                    <TableCell>
                      <Badge variant={org.isActive ? "default" : "secondary"}>
                        {org.isActive ? "Aktívny" : "Neaktívny"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(org.createdAt).toLocaleDateString("sk-SK")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

