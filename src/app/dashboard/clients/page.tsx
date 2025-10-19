"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Users,
  FileBarChart,
  AlertCircle,
  Plus,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  Search,
  X,
  Download,
  FileText,
  TrendingUp,
  Sparkles,
  UserPlus,
  Calendar,
  MapPin,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { exportClientsToCSV } from "@/lib/csv-export";

interface Client {
  id: string;
  companyName: string | null;
  ico: string | null;
  contactPerson: string;
  email: string | null;
  phone: string | null;
  employeesCount: number | null;
  annualRevenue: number | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  createdAt: string;
}

interface ClientFormData {
  companyName: string;
  ico: string;
  dic: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  employeesCount: string;
  annualRevenue: string;
  foundedAt: string;
  notes: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<ClientFormData>({
    companyName: "",
    ico: "",
    dic: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    employeesCount: "",
    annualRevenue: "",
    foundedAt: "",
    notes: "",
  });

  useEffect(() => {
    setMounted(true);
    fetchClients();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.companyName?.toLowerCase().includes(query) ||
        client.ico?.toLowerCase().includes(query) ||
        client.contactPerson.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query)
    );
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clients");
      const data = await response.json();
      setClients(data.data || []);
      setFilteredClients(data.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Chyba pri načítaní klientov");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        companyName: formData.companyName || null,
        ico: formData.ico || null,
        dic: formData.dic || null,
        contactPerson: formData.contactPerson,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        postalCode: formData.postalCode || null,
        employeesCount: formData.employeesCount ? parseInt(formData.employeesCount) : null,
        annualRevenue: formData.annualRevenue ? parseInt(formData.annualRevenue) * 100 : null,
        foundedAt: formData.foundedAt || null,
        notes: formData.notes || null,
      };

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri vytváraní klienta");
      }

      toast.success("Klient úspešne vytvorený!");
      setIsDialogOpen(false);
      resetForm();
      await fetchClients();
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri vytváraní klienta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      ico: "",
      dic: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      employeesCount: "",
      annualRevenue: "",
      foundedAt: "",
      notes: "",
    });
  };

  const thisMonthClients = clients.filter((c) => {
    const created = new Date(c.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Premium Top Navigation */}
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
                <Link href="/dashboard" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  Dashboard
                </Link>
                <Link href="/dashboard/clients" className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:scale-105">
                  <Users className="inline h-4 w-4 mr-2" />
                  Klienti
                </Link>
                <Link href="/dashboard/loans" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <FileBarChart className="inline h-4 w-4 mr-2" />
                  Úvery
                </Link>
                <Link href="/dashboard/applications" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <FileText className="inline h-4 w-4 mr-2" />
                  Žiadosti
                </Link>
                <Link href="/dashboard/reports" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <TrendingUp className="inline h-4 w-4 mr-2" />
                  Reporty
                </Link>
                <Link href="/dashboard/reminders" className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white/60 hover:text-blue-600 transition-all">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  Upomienky
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                <Settings className="h-4 w-4 mr-2" />
                Nastavenia
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-6 max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Načítavam klientov...</p>
            </div>
          </div>
        ) : (
          <>
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <Users className="h-10 w-10 text-blue-600" />
                Klienti
              </h2>
              <p className="text-slate-600 text-lg">Správa vašich klientov a ich údajov</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={fetchClients} variant="outline" disabled={loading} className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Obnoviť
              </Button>
              <Button
                onClick={() => {
                  try {
                    exportClientsToCSV(clients);
                    toast.success(`Exportovaných ${clients.length} klientov do CSV`);
                  } catch {
                    toast.error("Chyba pri exporte");
                  }
                }}
                variant="outline"
                disabled={clients.length === 0}
                className="border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nový klient
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Hľadať klienta (názov, IČO, kontakt, email, telefón)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-12 text-base border-0 shadow-xl bg-white/80 backdrop-blur-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Celkový počet klientov</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{clients.length}</div>
              <Progress value={100} className="h-2 bg-white/20" />
              <p className="text-sm text-white/80 mt-2">Všetci klienti v systéme</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Výsledky vyhľadávania</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Search className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{filteredClients.length}</div>
              <Progress value={(filteredClients.length / clients.length) * 100} className="h-2 bg-white/20" />
              <p className="text-sm text-white/80 mt-2">
                {searchQuery ? "Nájdených klientov" : "Všetci klienti"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white overflow-hidden relative group hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-white/90">Nový tento mesiac</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{thisMonthClients}</div>
              <Progress value={(thisMonthClients / clients.length) * 100} className="h-2 bg-white/20" />
              <p className="text-sm text-white/80 mt-2">Pridaných tento mesiac</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table with Tabs */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="bg-white/60 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Všetci klienti ({filteredClients.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Nedávni ({thisMonthClients})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Zoznam klientov
                </CardTitle>
                <CardDescription>
                  {searchQuery
                    ? `Zobrazených ${filteredClients.length} z ${clients.length} klientov`
                    : `Všetci vaši klienti v jednom prehľade (${clients.length})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Klient</TableHead>
                      <TableHead>IČO</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead>Lokácia</TableHead>
                      <TableHead>Zamestnanci</TableHead>
                      <TableHead>Ročný obrat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow 
                        key={client.id} 
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/clients/${client.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                                {(client.companyName || client.contactPerson).substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-slate-900">
                                {client.companyName || client.contactPerson}
                              </div>
                              <div className="text-sm text-slate-500">{client.contactPerson}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-slate-600">{client.ico || "-"}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </a>
                            )}
                            {client.phone && (
                              <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </a>
                            )}
                            {!client.email && !client.phone && <span className="text-slate-400">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.city ? (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <MapPin className="h-3 w-3" />
                              {client.city}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.employeesCount ? (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Briefcase className="h-3 w-3" />
                              {client.employeesCount}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.annualRevenue ? (
                            <span className="font-semibold text-emerald-600">
                              €{(client.annualRevenue / 100).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredClients.length === 0 && (
                  <div className="text-center py-16">
                    {searchQuery ? (
                      <>
                        <Search className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Žiadne výsledky</h3>
                        <p className="text-slate-600 mb-6">
                          Nenašli sa žiadni klienti pre &quot;{searchQuery}&quot;
                        </p>
                        <Button variant="outline" onClick={() => setSearchQuery("")}>
                          Vymazať filter
                        </Button>
                      </>
                    ) : (
                      <>
                        <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Žiadni klienti</h3>
                        <p className="text-slate-600 mb-6">Začnite pridaním vášho prvého klienta</p>
                        <Button
                          onClick={() => setIsDialogOpen(true)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Pridať klienta
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="mt-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Nedávni klienti
                </CardTitle>
                <CardDescription>Klienti pridaní tento mesiac</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients
                    .filter((c) => {
                      const created = new Date(c.createdAt);
                      const now = new Date();
                      return (
                        created.getMonth() === now.getMonth() &&
                        created.getFullYear() === now.getFullYear()
                      );
                    })
                    .map((client) => (
                      <Card key={client.id} className="border-2 border-slate-100 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white font-bold">
                                {(client.companyName || client.contactPerson).substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900">
                                {client.companyName || client.contactPerson}
                              </h4>
                              <p className="text-sm text-slate-500">{client.contactPerson}</p>
                            </div>
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
                {thisMonthClients === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Žiadni noví klienti tento mesiac</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-blue-600" />
              Nový klient
            </DialogTitle>
            <DialogDescription>
              Zadajte údaje o novom klientovi. Povinné polia sú označené hviezdičkou (*).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              {/* Company Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Firemné údaje
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      Názov firmy <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="ABC Trading s.r.o."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ico">IČO</Label>
                    <Input
                      id="ico"
                      value={formData.ico}
                      onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
                      placeholder="12345678"
                      maxLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dic">DIČ</Label>
                    <Input
                      id="dic"
                      value={formData.dic}
                      onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
                      placeholder="SK1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="foundedAt">Dátum založenia</Label>
                    <Input
                      id="foundedAt"
                      type="date"
                      value={formData.foundedAt}
                      onChange={(e) => setFormData({ ...formData, foundedAt: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  Kontaktné údaje
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">
                      Kontaktná osoba <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="Ján Novák"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jan.novak@firma.sk"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="phone">Telefón</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+421 900 123 456"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Adresa
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Ulica a číslo</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Hlavná 123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Mesto</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Bratislava"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">PSČ</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="81000"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  Finančné údaje
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeesCount">Počet zamestnancov</Label>
                    <Input
                      id="employeesCount"
                      type="number"
                      min="0"
                      value={formData.employeesCount}
                      onChange={(e) => setFormData({ ...formData, employeesCount: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annualRevenue">Ročný obrat (€)</Label>
                    <Input
                      id="annualRevenue"
                      type="number"
                      min="0"
                      value={formData.annualRevenue}
                      onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                      placeholder="500000"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Poznámky</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Doplňujúce informácie o klientovi..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Zrušiť
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Vytváram...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Vytvoriť klienta
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
