"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  Copy,
  Edit2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  templateContent: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ContractTemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "LOAN_AGREEMENT",
    templateContent: "",
  });

  useEffect(() => {
    setMounted(true);
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/contracts/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");

      const data = await response.json();
      setTemplates(data.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri načítaní šablón");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: ContractTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        name: template.name,
        type: template.type,
        templateContent: template.templateContent,
      });
    } else {
      setSelectedTemplate(null);
      setFormData({
        name: "",
        type: "LOAN_AGREEMENT",
        templateContent: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.templateContent.trim()) {
      toast.error("Vyplňte všetky povinné polia");
      return;
    }

    setIsSaving(true);
    try {
      const method = selectedTemplate ? "PATCH" : "POST";
      const url = selectedTemplate
        ? `/api/contracts/templates/${selectedTemplate.id}`
        : "/api/contracts/templates";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save template");

      toast.success(
        selectedTemplate ? "Šablóna aktualizovaná" : "Šablóna vytvorená"
      );
      setIsDialogOpen(false);
      await fetchTemplates();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri uložení šablóny");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ste si istí, že chcete zmazať túto šablónu?")) {
      return;
    }

    try {
      const response = await fetch(`/api/contracts/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete template");

      toast.success("Šablóna zmazaná");
      await fetchTemplates();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri mazaní šablóny");
    }
  };

  const handleDuplicate = async (template: ContractTemplate) => {
    setFormData({
      name: `${template.name} (kópia)`,
      type: template.type,
      templateContent: template.templateContent,
    });
    setSelectedTemplate(null);
    setIsDialogOpen(true);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm" className="border-slate-200 hover:border-blue-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Späť
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-1">Šablóny zmlúv</h1>
              <p className="text-slate-600">Správa šablón pre generovanie zmlúv</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchTemplates}
              variant="outline"
              disabled={loading}
              className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nová šablóna
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b border-slate-200/60">
            <CardTitle>Všetky šablóny</CardTitle>
            <CardDescription>
              {templates.length} {templates.length === 1 ? "šablóna" : "šablón"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Žiadne šablóny
                </h3>
                <p className="text-slate-600 mb-4">
                  Zatiaľ nie sú vytvorené žiadne šablóny
                </p>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Vytvoriť prvú šablónu
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/60 hover:bg-transparent">
                    <TableHead>Názov</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Dĺžka</TableHead>
                    <TableHead>Aktívna</TableHead>
                    <TableHead>Vytvorená</TableHead>
                    <TableHead>Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id} className="border-slate-200/60 hover:bg-slate-50/60">
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {template.type === "LOAN_AGREEMENT"
                            ? "Zmluva o pôžičke"
                            : template.type === "COLLATERAL_AGREEMENT"
                            ? "Zmluva o kolaterále"
                            : "Iné"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {template.templateContent.length} znakov
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            template.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-800"
                          }
                        >
                          {template.isActive ? "Áno" : "Nie"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(template.createdAt), "dd.MM.yyyy", { locale: sk })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(template)}
                            className="border-slate-200 hover:border-blue-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicate(template)}
                            className="border-slate-200 hover:border-blue-300"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(template.id)}
                            className="border-slate-200 hover:border-red-300 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedTemplate ? "Upraviť šablónu" : "Nová šablóna"}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate
                  ? "Upravte existujúcu šablónu"
                  : "Vytvorte novú šablónu pre generovanie zmlúv"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Názov šablóny *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Zmluva o pôžičke 2025"
                  className="border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Typ šablóny *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOAN_AGREEMENT">Zmluva o pôžičke</SelectItem>
                    <SelectItem value="COLLATERAL_AGREEMENT">Zmluva o kolaterále</SelectItem>
                    <SelectItem value="OTHER">Iné</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Obsah šablóny *</Label>
                <Textarea
                  id="content"
                  value={formData.templateContent}
                  onChange={(e) => setFormData({ ...formData, templateContent: e.target.value })}
                  placeholder="Napíšte obsah šablóny. Dostupné premenné: {{client_name}}, {{client_ico}}, {{loan_amount}}, {{interest_rate}}, {{start_date}}, {{end_date}}, {{variable_symbol}}, {{monthly_payment}}"
                  rows={12}
                  className="border-slate-200 font-mono text-sm"
                />
                <p className="text-sm text-slate-500">
                  Minimálne 50, maximálne 50 000 znakov
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-900 font-semibold mb-2">Dostupné premenné:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                  <div>
                    <code className="bg-white px-1 py-0.5 rounded">{"{{client_name}}"}</code> - Názov klienta
                  </div>
                  <div>
                    <code className="bg-white px-1 py-0.5 rounded">{"{{client_ico}}"}</code> - IČO
                  </div>
                  <div>
                    <code className="bg-white px-1 py-0.5 rounded">{"{{loan_amount}}"}</code> - Suma úveru
                  </div>
                  <div>
                    <code className="bg-white px-1 py-0.5 rounded">{"{{interest_rate}}"}</code> - Úrok
                  </div>
                  <div>
                    <code className="bg-white px-1 py-0.5 rounded">{"{{start_date}}"}</code> - Začiatok
                  </div>
                  <div>
                    <code className="bg-white px-1 py-0.5 rounded">{"{{end_date}}"}</code> - Koniec
                  </div>
                  <div>
                    <code className="bg-white px-1 py-0.5 rounded">{"{{variable_symbol}}"}</code> - VS
                  </div>
                  <div>
                    <code className="bg-white px-1 py-0.5 rounded">{"{{monthly_payment}}"}</code> - Mesačná splátka
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Zrušiť
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {selectedTemplate ? "Aktualizovať" : "Vytvoriť"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
