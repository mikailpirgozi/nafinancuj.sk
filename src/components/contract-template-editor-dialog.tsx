"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Eye, Code, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const TEMPLATE_VARIABLES = {
  client_name: "Názov klienta",
  client_ico: "IČO klienta",
  client_dic: "DIČ klienta",
  client_address: "Adresa klienta",
  client_contact_person: "Kontaktná osoba",
  loan_amount: "Suma úveru (EUR)",
  loan_currency: "Mena (EUR)",
  loan_interest_rate: "Úroková sadzba (%)",
  loan_duration_months: "Trvanie (mesiacov)",
  loan_start_date: "Dátum začiatku",
  loan_end_date: "Dátum konca",
  loan_variable_symbol: "Variabilný symbol",
  organization_name: "Názov organizácie",
  organization_ico: "IČO organizácie",
  organization_address: "Adresa organizácie",
  current_date: "Dnešný dátum",
};

const templateSchema = z.object({
  name: z.string().min(1, "Názov je povinný"),
  type: z.enum(["LOAN_AGREEMENT", "COLLATERAL_AGREEMENT", "PAYMENT_PLAN", "OTHER"]),
  content: z.string().min(1, "Obsah je povinný"),
  isDefault: z.boolean().optional(),
});

type TemplateData = z.infer<typeof templateSchema>;

interface ContractTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TemplateData & { id?: string };
  onSave: (data: TemplateData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ContractTemplateEditor({
  open,
  onOpenChange,
  initialData,
  onSave,
  isSubmitting = false,
}: ContractTemplateEditorProps) {
  const [formData, setFormData] = useState<TemplateData>(
    initialData || {
      name: "",
      type: "LOAN_AGREEMENT",
      content: "",
      isDefault: false,
    }
  );

  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);

  const handleInsertVariable = (variable: string) => {
    const textarea = document.getElementById("template-content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeText = formData.content.substring(0, start);
    const afterText = formData.content.substring(end);
    const newContent = `${beforeText}{{${variable}}}${afterText}`;

    setFormData({ ...formData, content: newContent });
    setSelectedVariable(null);

    setTimeout(() => {
      textarea.selectionStart = start + variable.length + 4;
      textarea.selectionEnd = start + variable.length + 4;
      textarea.focus();
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = templateSchema.safeParse(formData);
    if (!validation.success) {
      toast.error("Validačná chyba v údajoch");
      return;
    }

    try {
      await onSave(validation.data);
      toast.success(initialData?.id ? "Šablóna aktualizovaná!" : "Šablóna vytvorená!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri ukladaní šablóny");
    }
  };

  const typeLabels: Record<string, string> = {
    LOAN_AGREEMENT: "Úverová zmluva",
    COLLATERAL_AGREEMENT: "Zmluva o zábezpeke",
    PAYMENT_PLAN: "Splátková dohoda",
    OTHER: "Iná šablóna",
  };

  // Demo data for preview
  const demoData = {
    client_name: "Acme Corporation s.r.o.",
    client_ico: "12345678",
    client_dic: "SK2012345678",
    client_address: "Hlavná 123, Bratislava",
    client_contact_person: "Ján Horvát",
    loan_amount: "50,000.00",
    loan_currency: "EUR",
    loan_interest_rate: "8.5",
    loan_duration_months: "36",
    loan_start_date: new Date().toLocaleDateString("sk-SK"),
    loan_end_date: new Date(Date.now() + 36 * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("sk-SK"),
    loan_variable_symbol: "123000456",
    organization_name: "Nafinancuj.sk s.r.o.",
    organization_ico: "87654321",
    organization_address: "Jesenná 789, Bratislava",
    current_date: new Date().toLocaleDateString("sk-SK"),
  };

  const getPreviewContent = () => {
    let content = formData.content;
    Object.entries(demoData).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return content;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Upraviť šablónu" : "Vytvoriť šablónu"}</DialogTitle>
          <DialogDescription>
            Vytvorte alebo upravte šablónu zmluvy s podporou premenných
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Názov šablóny *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Napr. Štandardná úverová zmluva"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Typ šablóny *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
                  <SelectTrigger id="type" disabled={isSubmitting}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                disabled={isSubmitting}
                className="rounded"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Nastaviť ako predvolené
              </Label>
            </div>
          </div>

          {/* Editor */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="template-content">Obsah šablóny *</Label>
              <Select value={selectedVariable || ""} onValueChange={(val) => val && handleInsertVariable(val)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Vložiť premennú..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_VARIABLES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label} ({`{{${key}}}`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor" className="gap-2">
                  <Code className="h-4 w-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Náhľad
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-2">
                <Textarea
                  id="template-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Napíšte obsah šablóny. Použite {{premenná}} pre dynamické údaje..."
                  rows={15}
                  disabled={isSubmitting}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-slate-500">
                  💡 Tip: Kliknite na "Vložiť premennú" aby ste vložili premenné automaticky.
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-2">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 min-h-[400px] max-h-[400px] overflow-y-auto whitespace-pre-wrap text-sm">
                  {getPreviewContent() || "Náhľad sa zobrazí tu..."}
                </div>
                <div className="text-xs text-slate-500">
                  ℹ️ Náhľad s demo dátami (hodnoty sa nahradia pri generovaní zmluvy)
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Variables Reference */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Dostupné premenné:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(TEMPLATE_VARIABLES).map(([key, label]) => (
                <Badge key={key} variant="secondary" className="justify-start text-xs cursor-pointer hover:bg-blue-100" onClick={() => handleInsertVariable(key)}>
                  <code className="text-xs">{{"{{"}{key}{"}}"}</code>
                </Badge>
              ))}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Ukladám...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {initialData?.id ? "Aktualizovať šablónu" : "Vytvoriť šablónu"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
