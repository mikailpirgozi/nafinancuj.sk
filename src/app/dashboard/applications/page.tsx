"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Users,
  FileBarChart,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { exportApplicationsToCSV } from "@/lib/csv-export";
import { ApplicationFormDialog } from "@/components/application-form-dialog";
import { Plus } from "lucide-react";

interface Application {
  id: string;
  clientId: string;
  amount: number;
  purpose: string;
  status: string;
  durationMonths: number;
  assignedToUserId: string | null;
  createdAt: string;
  client: {
    companyName: string | null;
    contactPerson: string | null;
  } | null;
}

const STATUS_COLORS = {
  NEW: "bg-blue-100 text-blue-800 border-blue-200",
  REVIEWING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DOCUMENTS_REQUESTED: "bg-purple-100 text-purple-800 border-purple-200",
  PENDING_APPROVAL: "bg-orange-100 text-orange-800 border-orange-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS = {
  NEW: "Nová",
  REVIEWING: "V kontrole",
  DOCUMENTS_REQUESTED: "Dokumenty požadované",
  PENDING_APPROVAL: "Čaká na schválenie",
  APPROVED: "Schválená",
  REJECTED: "Zamietnutá",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchApplications();
  }, []);

  useEffect(() => {
    let filtered = applications;

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.client?.companyName?.toLowerCase().includes(query) ||
          app.client?.contactPerson?.toLowerCase().includes(query) ||
          app.purpose.toLowerCase().includes(query) ||
          app.id.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  }, [searchQuery, statusFilter, applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/applications");
      const data = await response.json();
      setApplications(data.data || []);
      setFilteredApplications(data.data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Chyba pri načítaní žiadostí");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Chyba pri zmene statusu");
      }

      toast.success("Status úspešne zmenený");
      await fetchApplications();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Chyba pri zmene statusu");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NEW":
        return <FileText className="h-4 w-4" />;
      case "REVIEWING":
        return <Clock className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const statusCounts = {
    ALL: applications.length,
    NEW: applications.filter((a) => a.status === "NEW").length,
    REVIEWING: applications.filter((a) => a.status === "REVIEWING").length,
    DOCUMENTS_REQUESTED: applications.filter((a) => a.status === "DOCUMENTS_REQUESTED").length,
    PENDING_APPROVAL: applications.filter((a) => a.status === "PENDING_APPROVAL").length,
    APPROVED: applications.filter((a) => a.status === "APPROVED").length,
    REJECTED: applications.filter((a) => a.status === "REJECTED").length,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-orange-600 bg-clip-text text-transparent">
              Nafinancuj.sk
            </h1>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-900 transition">
                Dashboard
              </Link>
              <Link href="/dashboard/clients" className="text-gray-600 hover:text-blue-900 transition">
                <Users className="inline h-4 w-4 mr-1" />
                Klienti
              </Link>
              <Link href="/dashboard/loans" className="text-gray-600 hover:text-blue-900 transition">
                <FileBarChart className="inline h-4 w-4 mr-1" />
                Úvery
              </Link>
              <Link href="/dashboard/applications" className="text-blue-900 font-semibold border-b-2 border-blue-900 pb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                Žiadosti
              </Link>
              <Link href="/dashboard/reminders" className="text-gray-600 hover:text-blue-900 transition">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                Upomienky
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Nastavenia
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Načítavam žiadosti...</p>
            </div>
          </div>
        ) : (
          <>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Žiadosti o úver</h2>
            <p className="text-gray-600 mt-2">CRM systém pre správu žiadostí</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchApplications} variant="outline" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button
              onClick={() => {
                try {
                  exportApplicationsToCSV(applications);
                  toast.success(`Exportovaných ${applications.length} žiadostí do CSV`);
                } catch {
                  toast.error("Chyba pri exporte");
                }
              }}
              variant="outline"
              disabled={applications.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-blue-900 to-blue-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nová žiadosť
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Hľadať žiadosť (klient, účel, ID)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrovať podľa statusu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Všetky ({statusCounts.ALL})</SelectItem>
              <SelectItem value="NEW">Nové ({statusCounts.NEW})</SelectItem>
              <SelectItem value="REVIEWING">V kontrole ({statusCounts.REVIEWING})</SelectItem>
              <SelectItem value="DOCUMENTS_REQUESTED">
                Dokumenty požadované ({statusCounts.DOCUMENTS_REQUESTED})
              </SelectItem>
              <SelectItem value="PENDING_APPROVAL">
                Čaká na schválenie ({statusCounts.PENDING_APPROVAL})
              </SelectItem>
              <SelectItem value="APPROVED">Schválené ({statusCounts.APPROVED})</SelectItem>
              <SelectItem value="REJECTED">Zamietnuté ({statusCounts.REJECTED})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nové</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.NEW}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">V kontrole</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.REVIEWING}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Schválené</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.APPROVED}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zamietnuté</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.REJECTED}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Zoznam žiadostí</CardTitle>
            <CardDescription>
              {statusFilter !== "ALL"
                ? `Zobrazených ${filteredApplications.length} z ${applications.length} žiadostí`
                : `Celkovo ${applications.length} žiadostí`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klient</TableHead>
                  <TableHead>Účel</TableHead>
                  <TableHead>Suma</TableHead>
                  <TableHead>Trvanie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vytvorené</TableHead>
                  <TableHead>Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow 
                    key={app.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => window.location.href = `/dashboard/applications/${app.id}`}
                  >
                    <TableCell className="font-semibold">
                      {app.client?.companyName || app.client?.contactPerson || "N/A"}
                    </TableCell>
                    <TableCell>{app.purpose}</TableCell>
                    <TableCell className="font-semibold">€{(app.amount / 100).toLocaleString()}</TableCell>
                    <TableCell>{app.durationMonths} mesiacov</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[app.status as keyof typeof STATUS_COLORS]}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(app.status)}
                          {STATUS_LABELS[app.status as keyof typeof STATUS_LABELS]}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(app.createdAt).toLocaleDateString("sk-SK")}</TableCell>
                    <TableCell>
                      <Select
                        value={app.status}
                        onValueChange={(value) => handleStatusChange(app.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">Nová</SelectItem>
                          <SelectItem value="REVIEWING">V kontrole</SelectItem>
                          <SelectItem value="DOCUMENTS_REQUESTED">Dokumenty požadované</SelectItem>
                          <SelectItem value="PENDING_APPROVAL">Čaká na schválenie</SelectItem>
                          <SelectItem value="APPROVED">Schválená</SelectItem>
                          <SelectItem value="REJECTED">Zamietnutá</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredApplications.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Žiadne žiadosti</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || statusFilter !== "ALL"
                    ? "Nenašli sa žiadne žiadosti pre zadané filtre"
                    : "Zatiaľ neboli vytvorené žiadne žiadosti"}
                </p>
                {(searchQuery || statusFilter !== "ALL") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("ALL");
                    }}
                  >
                    Vymazať filtre
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </>
        )}
      </div>

      {/* Application Form Dialog */}
      <ApplicationFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchApplications}
      />
    </div>
  );
}

