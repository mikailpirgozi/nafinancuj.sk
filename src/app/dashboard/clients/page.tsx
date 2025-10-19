"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
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
} from "lucide-react";
import { toast } from "sonner";

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
    fetchClients();
  }, []);

  useEffect(() => {
    // Filter clients based on search query
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
      setClients(data.clients || []);
      setFilteredClients(data.clients || []);
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
      // Convert form data to API format
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
        annualRevenue: formData.annualRevenue ? parseInt(formData.annualRevenue) * 100 : null, // Convert to cents
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-900" />
      </div>
    );
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
              <a href="/dashboard" className="text-gray-600 hover:text-blue-900 transition">
                Dashboard
              </a>
              <a href="/dashboard/clients" className="text-blue-900 font-semibold border-b-2 border-blue-900 pb-1">
                <Users className="inline h-4 w-4 mr-1" />
                Klienti
              </a>
              <a href="/dashboard/loans" className="text-gray-600 hover:text-blue-900 transition">
                <FileBarChart className="inline h-4 w-4 mr-1" />
                Úvery
              </a>
              <a href="/dashboard/reminders" className="text-gray-600 hover:text-blue-900 transition">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                Upomienky
              </a>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Klienti</h2>
            <p className="text-gray-600 mt-2">Správa vašich klientov a ich údajov</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchClients} variant="outline" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-blue-900 to-blue-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nový klient
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Hľadať klienta (názov, IČO, kontakt, email, telefón)..."
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Celkový počet klientov</CardTitle>
              <Users className="h-4 w-4 text-blue-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Výsledky vyhľadávania</CardTitle>
              <Search className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredClients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nový tento mesiac</CardTitle>
              <Plus className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  clients.filter((c) => {
                    const created = new Date(c.createdAt);
                    const now = new Date();
                    return (
                      created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Zoznam klientov</CardTitle>
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
                  <TableHead>Firma / Meno</TableHead>
                  <TableHead>IČO</TableHead>
                  <TableHead>Kontaktná osoba</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefón</TableHead>
                  <TableHead>Zamestnanci</TableHead>
                  <TableHead>Ročný obrat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-semibold">
                      {client.companyName || client.contactPerson}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{client.ico || "-"}</TableCell>
                    <TableCell>{client.contactPerson}</TableCell>
                    <TableCell>
                      {client.email ? (
                        <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {client.phone ? (
                        <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{client.employeesCount || "-"}</TableCell>
                    <TableCell>
                      {client.annualRevenue ? `€${(client.annualRevenue / 100).toLocaleString()}` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                {searchQuery ? (
                  <>
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Žiadne výsledky</h3>
                    <p className="text-gray-600 mb-4">
                      Nenašli sa žiadni klienti pre &quot;{searchQuery}&quot;
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Vymazať filter
                    </Button>
                  </>
                ) : (
                  <>
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Žiadni klienti</h3>
                    <p className="text-gray-600 mb-4">Začnite pridaním vášho prvého klienta</p>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-900 to-blue-800"
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
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Nový klient</DialogTitle>
            <DialogDescription>
              Zadajte údaje o novom klientovi. Povinné polia sú označené hviezdičkou (*).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              {/* Company Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
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
                <h3 className="font-semibold text-lg">Kontaktné údaje</h3>
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
                  <div className="space-y-2">
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
                <h3 className="font-semibold text-lg">Adresa</h3>
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
                <h3 className="font-semibold text-lg">Finančné údaje</h3>
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
                className="bg-gradient-to-r from-blue-900 to-blue-800"
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
