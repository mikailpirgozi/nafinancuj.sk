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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  Search,
  X,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard-header";
import { exportApplicationsToCSV } from "@/lib/csv-export";
import { ApplicationFormDialog } from "@/components/application-form-dialog";

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchApplications();
  }, []);

  useEffect(() => {
    let filtered = applications;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (agentFilter !== "ALL") {
      if (agentFilter === "UNASSIGNED") {
        filtered = filtered.filter((app) => !app.assignedToUserId);
      } else {
        filtered = filtered.filter((app) => app.assignedToUserId === agentFilter);
      }
    }

    if (dateFrom) {
      filtered = filtered.filter((app) => new Date(app.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((app) => new Date(app.createdAt) <= endDate);
    }

    if (amountFrom) {
      const minAmount = parseFloat(amountFrom) * 100;
      filtered = filtered.filter((app) => app.amount >= minAmount);
    }
    if (amountTo) {
      const maxAmount = parseFloat(amountTo) * 100;
      filtered = filtered.filter((app) => app.amount <= maxAmount);
    }

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
  }, [searchQuery, statusFilter, agentFilter, dateFrom, dateTo, amountFrom, amountTo, applications]);

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
        return null;
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

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardHeader currentPage="applications" />

      <div className="container mx-auto py-8 px-6 max-w-7xl">
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
                <h2 className="text-4xl font-bold text-slate-900 mb-2">Žiadosti o úver</h2>
                <p className="text-slate-600 text-lg">CRM systém pre správu žiadostí</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={fetchApplications} variant="outline" disabled={loading} className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
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
                  className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nová žiadosť
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-xl mb-6">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Pokročilé vyhľadávanie a filtrovanie</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-slate-600 hover:text-blue-600"
                  >
                    {showFilters ? "Skryť" : "Zobraziť"} filtre
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Hľadať žiadosť (klient, účel, ID)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 border-slate-200"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-slate-200">
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

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-200/60">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Dátum od</label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="border-slate-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Dátum do</label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="border-slate-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Agent</label>
                      <Select value={agentFilter} onValueChange={setAgentFilter}>
                        <SelectTrigger className="border-slate-200">
                          <SelectValue placeholder="Všetci agenti" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Všetci agenti</SelectItem>
                          <SelectItem value="UNASSIGNED">Nepriradené</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Suma od (€)</label>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="0"
                        value={amountFrom}
                        onChange={(e) => setAmountFrom(e.target.value)}
                        className="border-slate-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Suma do (€)</label>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="100000"
                        value={amountTo}
                        onChange={(e) => setAmountTo(e.target.value)}
                        className="border-slate-200"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        className="w-full border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("ALL");
                          setAgentFilter("ALL");
                          setDateFrom("");
                          setDateTo("");
                          setAmountFrom("");
                          setAmountTo("");
                          toast.success("Filtre vymazané");
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Vymazať filtre
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-4 text-sm text-slate-600">
                  Zobrazených <span className="font-bold text-blue-600">{filteredApplications.length}</span> z{" "}
                  <span className="font-bold">{applications.length}</span> žiadostí
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Nové</CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{statusCounts.NEW}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">V kontrole</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{statusCounts.REVIEWING}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Schválené</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{statusCounts.APPROVED}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-red-100 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Zamietnuté</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{statusCounts.REJECTED}</div>
                </CardContent>
              </Card>
            </div>

            {/* Applications Table */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Zoznam žiadostí</CardTitle>
                <CardDescription>
                  {statusFilter !== "ALL"
                    ? `Zobrazených ${filteredApplications.length} z ${applications.length} žiadostí`
                    : `Celkovo ${applications.length} žiadostí`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/60 hover:bg-transparent">
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
                        className="hover:bg-slate-50/60 border-slate-200/60"
                        onClick={() => (window.location.href = `/dashboard/applications/${app.id}`)}
                      >
                        <TableCell className="font-semibold text-slate-900">
                          {app.client?.companyName || app.client?.contactPerson || "N/A"}
                        </TableCell>
                        <TableCell className="text-slate-700">{app.purpose}</TableCell>
                        <TableCell className="font-semibold text-slate-900">€{(app.amount / 100).toLocaleString()}</TableCell>
                        <TableCell className="text-slate-700">{app.durationMonths} mesiacov</TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_COLORS[app.status as keyof typeof STATUS_COLORS]}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(app.status)}
                              {STATUS_LABELS[app.status as keyof typeof STATUS_LABELS]}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-700">{new Date(app.createdAt).toLocaleDateString("sk-SK")}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={app.status}
                            onValueChange={(value) => handleStatusChange(app.id, value)}
                          >
                            <SelectTrigger className="w-[180px] border-slate-200">
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
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Žiadne žiadosti</h3>
                    <p className="text-slate-600 mb-4">
                      {searchQuery || statusFilter !== "ALL"
                        ? "Nenašli sa žiadne žiadosti pre zadané filtre"
                        : "Zatiaľ neboli vytvorené žiadne žiadosti"}
                    </p>
                    {(searchQuery || statusFilter !== "ALL") && (
                      <Button
                        variant="outline"
                        className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
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

      <ApplicationFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchApplications}
      />
    </div>
  );
}
