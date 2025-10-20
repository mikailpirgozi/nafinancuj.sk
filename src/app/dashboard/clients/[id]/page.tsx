"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowLeft,
  Mail,
  MapPin,
  Building2,
  FileText,
  Plus,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

// Safe date parsing utility
const safeParseDate = (dateValue: unknown): Date | null => {
  if (!dateValue) return null;
  try {
    const date = new Date(dateValue as string | number);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
};

// Safe date formatter
const formatDateSafe = (dateValue: unknown, formatStr: string = "dd.MM.yyyy"): string => {
  const date = safeParseDate(dateValue);
  if (!date) return "N/A";
  return format(date, formatStr, { locale: sk });
};

interface Client {
  id: string;
  companyName: string | null;
  contactPerson: string;
  ico: string;
  dic: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  createdAt: string;
}

interface Loan {
  id: string;
  variableSymbol: string;
  amount: number;
  status: string;
  startDate: string;
  endDate: string;
}

interface Application {
  id: string;
  loanAmount: number;
  status: string;
  createdAt: string;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

interface Stats {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  overdueInstallments: number;
  totalVolume: number;
  totalPaid: number;
  overdueAmount: number;
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [clientRes, loansRes, applicationsRes, statsRes, notesRes] = await Promise.all([
        fetch(`/api/clients/${clientId}`),
        fetch(`/api/loans?clientId=${clientId}`),
        fetch(`/api/applications?clientId=${clientId}`),
        fetch(`/api/clients/${clientId}/stats`),
        fetch(`/api/clients/${clientId}/notes`),
      ]);

      if (!clientRes.ok) throw new Error("Chyba pri načítaní klienta");

      const clientData = await clientRes.json();
      setClient(clientData.data);

      if (loansRes.ok) {
        const loansData = await loansRes.json();
        setLoans(loansData.data || []);
      }

      if (applicationsRes.ok) {
        const appData = await applicationsRes.json();
        setApplications(appData.data || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.data || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri načítaní dát");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    setMounted(true);
    fetchClientData();
  }, [fetchClientData]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Poznámka nemôže byť prázdna");
      return;
    }

    try {
      setIsAddingNote(true);
      const response = await fetch(`/api/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });

      if (!response.ok) throw new Error("Chyba pri pridaní poznámky");

      toast.success("Poznámka pridaná");
      setNewNote("");
      await fetchClientData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri pridaní poznámky");
    } finally {
      setIsAddingNote(false);
    }
  };

  if (!mounted || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Načítavam klienta...</p>
        </div>
      </div>
    );
  }

  const clientName = client.companyName || client.contactPerson;
  const totalLoans = stats?.totalLoans || 0;
  const activeLoans = stats?.activeLoans || 0;
  const completedLoans = stats?.completedLoans || 0;
  const overdueInstallments = stats?.overdueInstallments || 0;
  const totalVolume = stats?.totalVolume || 0;
  const totalPaid = stats?.totalPaid || 0;
  const overdueAmount = stats?.overdueAmount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/clients">
              <Button variant="outline" size="sm" className="border-slate-200 hover:border-blue-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Späť
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-1">{clientName}</h1>
              <p className="text-slate-600">IČO: {client.ico}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchClientData} variant="outline" disabled={loading} className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30">
              <Plus className="mr-2 h-4 w-4" />
              Nový úver
            </Button>
          </div>
        </div>

        {/* Client Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Firemné údaje */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="border-b border-slate-200/60">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Firemné údaje
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {client.companyName && (
                <div>
                  <p className="text-sm text-slate-500">Spoločnosť</p>
                  <p className="font-medium text-slate-900">{client.companyName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">IČO</p>
                <p className="font-mono text-slate-900">{client.ico}</p>
              </div>
              {client.dic && (
                <div>
                  <p className="text-sm text-slate-500">DIČ</p>
                  <p className="font-mono text-slate-900">{client.dic}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">Kontakt</p>
                <p className="font-medium text-slate-900">{client.contactPerson}</p>
              </div>
            </CardContent>
          </Card>

          {/* Kontakt */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="border-b border-slate-200/60">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-600" />
                Kontakt
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {client.email && (
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div>
                  <p className="text-sm text-slate-500">Telefón</p>
                  <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {client.address && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Adresa</p>
                  <div className="flex gap-2 items-start">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-600">
                      {client.address}
                      {client.city && `, ${client.city}`}
                      {client.postalCode && ` ${client.postalCode}`}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">Vytvorený</p>
                <p className="text-sm text-slate-600">{formatDateSafe(client.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Finančné údaje */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="border-b border-slate-200/60">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                Finančné údaje
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <p className="text-sm text-slate-500">Celkový objem</p>
                <p className="text-2xl font-bold text-slate-900">€{(totalVolume / 100).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Celkové splátky</p>
                <p className="text-lg font-semibold text-emerald-600">€{(totalPaid / 100).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Omeškané</p>
                <p className="text-lg font-semibold text-red-600">€{(overdueAmount / 100).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Úvery celkem</CardTitle>
              <Briefcase className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{totalLoans}</div>
              <p className="text-white/80 text-sm">Všetky úvery</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Aktívne úvery</CardTitle>
              <TrendingUp className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{activeLoans}</div>
              <p className="text-white/80 text-sm">V procese splácania</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-pink-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Splatené úvery</CardTitle>
              <DollarSign className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{completedLoans}</div>
              <p className="text-white/80 text-sm">Úspešne spláacené</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-600 to-orange-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Omeškané</CardTitle>
              <AlertCircle className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{overdueInstallments}</div>
              <p className="text-white/80 text-sm">Omeškajúcich splátok</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="loans" className="mb-8">
          <TabsList className="bg-white/60 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="loans" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Úvery ({loans.length})
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Žiadosti ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Dokumenty
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Poznámky ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              História
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Loans */}
          <TabsContent value="loans" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Úvery klienta</CardTitle>
                <CardDescription>Všetky úvery s detailami</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loans.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Žiadne úvery</h3>
                    <p className="text-slate-600">Klient nemá zatiaľ žiadne úvery</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/60 hover:bg-transparent">
                        <TableHead>VS</TableHead>
                        <TableHead>Suma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Začiatok</TableHead>
                        <TableHead>Koniec</TableHead>
                        <TableHead>Akcie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loans.map((loan) => (
                        <TableRow key={loan.id} className="border-slate-200/60 hover:bg-slate-50/60">
                          <TableCell className="font-mono font-semibold">{loan.variableSymbol}</TableCell>
                          <TableCell className="font-bold">€{(loan.amount / 100).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={
                              loan.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : loan.status === "LATE"
                                ? "bg-red-100 text-red-800"
                                : "bg-slate-100 text-slate-800"
                            }>
                              {loan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateSafe(loan.startDate)}</TableCell>
                          <TableCell>{formatDateSafe(loan.endDate)}</TableCell>
                          <TableCell>
                            <Link href={`/dashboard/loans/${loan.id}`}>
                              <Button size="sm" variant="outline" className="border-slate-200 hover:border-blue-300">
                                Detail
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Applications */}
          <TabsContent value="applications" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Žiadosti o úver</CardTitle>
                <CardDescription>Všetky žiadosti klienta</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Žiadne žiadosti</h3>
                    <p className="text-slate-600">Klient nemá žiadne žiadosti</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/60 hover:bg-transparent">
                        <TableHead>Dátum</TableHead>
                        <TableHead>Suma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Akcie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id} className="border-slate-200/60 hover:bg-slate-50/60">
                          <TableCell>{formatDateSafe(app.createdAt)}</TableCell>
                          <TableCell className="font-bold">€{(app.loanAmount / 100).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">{app.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/applications/${app.id}`}>
                              <Button size="sm" variant="outline" className="border-slate-200 hover:border-blue-300">
                                Detail
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Documents */}
          <TabsContent value="documents" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dokumenty</CardTitle>
                    <CardDescription>Dokumenty klienta</CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Žiadne dokumenty</h3>
                  <p className="text-slate-600">Zatiaľ nie sú nahrané žiadne dokumenty</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Notes */}
          <TabsContent value="notes" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Poznámky</CardTitle>
                <CardDescription>Interné poznámky o klientovi</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nová poznámka</label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Napíšte poznámku..."
                    className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows={3}
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={isAddingNote || !newNote.trim()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isAddingNote ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Ukladám...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Pridať poznámku
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-3 mt-6">
                  {notes.length === 0 ? (
                    <p className="text-center text-slate-600 py-8">Žiadne poznámky</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-slate-700">{note.content}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              {note.createdBy} • {formatDateSafe(note.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: History */}
          <TabsContent value="history" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>História zmien</CardTitle>
                <CardDescription>Chronologický prehľad všetkých zmien</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative">
                      <div className="absolute left-0 top-0 w-4 h-4 bg-blue-600 rounded-full"></div>
                      <div className="absolute left-2 top-4 w-0.5 h-16 bg-slate-200"></div>
                    </div>
                    <div className="pb-8">
                      <p className="font-semibold text-slate-900">Klient vytvorený</p>
                      <p className="text-sm text-slate-600">{formatDateSafe(client.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

