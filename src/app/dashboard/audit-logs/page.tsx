"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/pagination";
import { Download, Filter } from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  changes?: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

  useEffect(() => {
    fetchAuditLogs();
  }, [page, limit, entityTypeFilter, actionFilter]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (entityTypeFilter) params.append("entityType", entityTypeFilter);
      if (actionFilter) params.append("action", actionFilter);
      if (dateFromFilter) params.append("from", dateFromFilter);
      if (dateToFilter) params.append("to", dateToFilter);

      const response = await fetch(`/api/audit-logs?${params}`);
      if (!response.ok) throw new Error("Chyba pri načítavaní audit logov");

      const data = await response.json();
      setLogs(data.data || []);
      setTotalPages(Math.ceil((data.pagination?.total || 0) / limit));
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri načítavaní audit logov");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ["Dátum", "Užívateľ", "Akcia", "Entita", "ID Entity", "Opis"];
      const rows = logs.map((log) => [
        new Date(log.timestamp).toLocaleString("sk-SK"),
        log.userId,
        log.action,
        log.entityType,
        log.entityId,
        log.description || "",
      ]);

      const csv = [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `audit-logs-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Audit logy boli exportované");
    } catch (error) {
      toast.error("Chyba pri exporte");
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-100 text-emerald-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      LOAN: "Úver",
      APPLICATION: "Žiadosť",
      CLIENT: "Klient",
      PAYMENT: "Platba",
      INSTALLMENT: "Splátka",
      REMINDER: "Pripomenutie",
      USER: "Užívateľ",
      ORGANIZATION: "Organizácia",
    };
    return labels[entityType] || entityType;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Audit Logy</h1>
        <p className="text-slate-600 mt-2">
          Prehľad všetkých zmien a akcií v systéme
        </p>
      </div>

      {/* Filters Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Filtre</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entityType">Typ entity</Label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger id="entityType">
                  <SelectValue placeholder="Vyberte typ..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Všetky</SelectItem>
                  <SelectItem value="LOAN">Úver</SelectItem>
                  <SelectItem value="APPLICATION">Žiadosť</SelectItem>
                  <SelectItem value="CLIENT">Klient</SelectItem>
                  <SelectItem value="PAYMENT">Platba</SelectItem>
                  <SelectItem value="INSTALLMENT">Splátka</SelectItem>
                  <SelectItem value="REMINDER">Pripomenutie</SelectItem>
                  <SelectItem value="USER">Užívateľ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Akcia</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="Vyberte akciu..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Všetky</SelectItem>
                  <SelectItem value="CREATE">Vytvorenie</SelectItem>
                  <SelectItem value="UPDATE">Úprava</SelectItem>
                  <SelectItem value="DELETE">Odstránenie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Od dátumu</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Do dátumu</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEntityTypeFilter("");
                setActionFilter("");
                setDateFromFilter("");
                setDateToFilter("");
                setPage(1);
              }}
            >
              Vyčistiť filtre
            </Button>
            <Button onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Exportovať CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="p-6">
        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-slate-600">Načítavám...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-600">Žiadne audit logy</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dátum a čas</TableHead>
                    <TableHead>Akcia</TableHead>
                    <TableHead>Entita</TableHead>
                    <TableHead>ID Entity</TableHead>
                    <TableHead>Opis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString("sk-SK")}
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getEntityTypeLabel(log.entityType)}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {log.entityId.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                        {log.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-center">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

