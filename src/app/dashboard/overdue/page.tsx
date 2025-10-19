"use client";

import { useState, useEffect } from "react";
import {} from "@clerk/nextjs";
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
  Users,
  RefreshCw,
  AlertTriangle,
  Calendar,
  DollarSign,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard-header";

interface OverdueInstallment {
  id: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  loanId: string;
  loan: {
    id: string;
    variableSymbol: string;
    amount: number;
    clientId: string;
    client: {
      companyName: string | null;
      contactPerson: string | null;
      email: string | null;
      phone: string | null;
    } | null;
  };
}

export default function OverduePage() {
  const [overdueInstallments, setOverdueInstallments] = useState<OverdueInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchOverdueInstallments();
  }, []);

  const fetchOverdueInstallments = async () => {
    try {
      setLoading(true);
      // Fetch all installments with their loans and clients in one query
      const response = await fetch("/api/installments/overdue");
      const data = await response.json();
      
      if (data.success) {
        // Sort by due date (oldest first)
        const sorted = (data.data || []).sort((a: OverdueInstallment, b: OverdueInstallment) => 
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        setOverdueInstallments(sorted);
      } else {
        toast.error(data.error || "Chyba pri načítaní omeškaných splátok");
      }
    } catch (error) {
      console.error("Error fetching overdue installments:", error);
      toast.error("Chyba pri načítaní omeškaných splátok");
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const days = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const totalOverdueAmount = overdueInstallments.reduce(
    (sum, inst) => sum + (inst.totalAmount - inst.paidAmount),
    0
  );

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Navigation */}
      <DashboardHeader currentPage="overdue" />

      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Načítavam omeškané splátky...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  Omeškané splátky
                </h2>
                <p className="text-gray-600 mt-2">Prehľad všetkých omeškaných splátok</p>
              </div>
              <Button onClick={fetchOverdueInstallments} variant="outline" disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Obnoviť
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Počet omeškaných splátok</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{overdueInstallments.length}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Celková dlžná suma</CardTitle>
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    €{(totalOverdueAmount / 100).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ovplyvnených klientov</CardTitle>
                  <Users className="h-5 w-5 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {new Set(overdueInstallments.map((inst) => inst.loan.clientId)).size}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overdue Table */}
            <Card>
              <CardHeader>
                <CardTitle>Zoznam omeškaných splátok</CardTitle>
                <CardDescription>
                  Splátky zoradené podľa dátumu splatnosti (najstaršie prvé)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overdueInstallments.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Žiadne omeškané splátky! 🎉
                    </h3>
                    <p className="text-slate-600">Všetky splátky sú zaplatené včas</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Klient</TableHead>
                        <TableHead>Úver (VS)</TableHead>
                        <TableHead>Splatnosť</TableHead>
                        <TableHead>Omeškanie</TableHead>
                        <TableHead className="text-right">Dlžná suma</TableHead>
                        <TableHead>Kontakt</TableHead>
                        <TableHead className="text-center">Akcia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueInstallments.map((installment) => {
                        const daysOverdue = calculateDaysOverdue(installment.dueDate);
                        const remainingAmount = installment.totalAmount - installment.paidAmount;
                        const client = installment.loan.client;

                        return (
                          <TableRow key={installment.id} className="hover:bg-red-50">
                            <TableCell>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {client?.companyName || client?.contactPerson || "—"}
                                </div>
                                {client?.companyName && client?.contactPerson && (
                                  <div className="text-sm text-slate-600">{client.contactPerson}</div>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <Link
                                href={`/dashboard/loans/${installment.loanId}`}
                                className="text-blue-600 hover:text-blue-800 font-medium underline"
                              >
                                {installment.loan.variableSymbol}
                              </Link>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">
                                  {new Date(installment.dueDate).toLocaleDateString("sk-SK")}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                className={`${
                                  daysOverdue > 30
                                    ? "bg-red-600"
                                    : daysOverdue > 14
                                    ? "bg-orange-600"
                                    : "bg-yellow-600"
                                } text-white`}
                              >
                                {daysOverdue} {daysOverdue === 1 ? "deň" : daysOverdue < 5 ? "dni" : "dní"}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="font-bold text-red-600 text-lg">
                                €{(remainingAmount / 100).toLocaleString()}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                {client?.email && (
                                  <a
                                    href={`mailto:${client.email}`}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    <Mail className="h-3 w-3" />
                                    {client.email}
                                  </a>
                                )}
                                {client?.phone && (
                                  <a
                                    href={`tel:${client.phone}`}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    <Phone className="h-3 w-3" />
                                    {client.phone}
                                  </a>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-center">
                              <Link href={`/dashboard/loans/${installment.loanId}`}>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  Detail úveru
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

