"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Star, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/contracts/templates");
      if (!response.ok) throw new Error("Chyba pri načítavaní šablón");

      const data = await response.json();
      setTemplates(data.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri načítavaní šablón");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Zadajte názov šablóny");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/contracts/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          content: "<h1>{{client_name}}</h1><p>Úver: €{{loan_amount}}</p>",
        }),
      });

      if (!response.ok) throw new Error("Chyba pri vytváraní šablóny");

      toast.success("Šablóna vytvorená!");
      setFormData({ name: "", description: "" });
      fetchTemplates();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri vytváraní šablóny");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Naozaj chcete odstrániť túto šablónu?")) return;

    try {
      const response = await fetch(`/api/contracts/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Chyba pri odstránení šablóny");

      toast.success("Šablóna odstránená!");
      fetchTemplates();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri odstránení šablóny");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/contracts/templates/${id}/set-default`, {
        method: "PATCH",
      });

      if (!response.ok) throw new Error("Chyba pri nastavení šablóny");

      toast.success("Šablóna nastavená ako predvolená!");
      fetchTemplates();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri nastavení šablóny");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Šablóny zmlúv</h1>
        <p className="text-slate-600 mt-2">
          Spravujte šablóny pre generovanie PDF zmlúv
        </p>
      </div>

      {/* Create Template Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Vytvoriť novú šablónu
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Názov šablóny *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Napr. Úverová zmluva"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Popis</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Krátky popis šablóny"
              disabled={isCreating}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="gap-2"
          >
            {isCreating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Vytváram...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Vytvoriť šablónu
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Templates Table */}
      <Card className="p-6">
        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-slate-600">Načítavám šablóny...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-600">Žiadne šablóny. Vytvorte novú!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Názov</TableHead>
                  <TableHead>Popis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vytvorená</TableHead>
                  <TableHead className="w-32">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {template.description || "-"}
                    </TableCell>
                    <TableCell>
                      {template.isDefault && (
                        <Badge className="gap-1">
                          <Star className="h-3 w-3" />
                          Predvolená
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(template.createdAt).toLocaleDateString("sk-SK")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(template.id)}
                          disabled={!template.isDefault}
                          title="Upravovať"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(template.id)}
                            title="Nastaviť ako predvolenú"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={template.isDefault}
                          title="Odstrániť"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Dostupné premenné:</strong> {{client_name}}, {{loan_amount}},
          {{loan_currency}}, {{interest_rate}}, {{duration_months}},
          {{start_date}}, {{end_date}}, {{variable_symbol}}
        </p>
      </Card>
    </div>
  );
}
