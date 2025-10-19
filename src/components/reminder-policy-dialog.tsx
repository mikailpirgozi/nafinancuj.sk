"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ReminderPolicy {
  id?: string;
  daysAfterDue: number;
  reminderType: "EMAIL" | "SMS";
  feeType: "FIXED" | "PERCENTAGE";
  feeAmount: string;
  messageTemplate: string;
  createdAt?: string;
}

interface ReminderPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: ReminderPolicy;
  onSuccess: () => void;
}

const DEFAULT_TEMPLATE = `Dobrý deň {{client_name}},

upozorňujeme Vás, že splátka úveru VS {{variable_symbol}} vo výške {{installment_amount}} € je po splatnosti {{days_overdue}} dní.

Splatnosť bola: {{due_date}}

Za omeškanie sme Vám pripočítali poplatok {{fee_amount}} €.

Prosím uhraďte čo najskôr.

S pozdravom,
Nafinancuj.sk`;

const AVAILABLE_VARIABLES = [
  { key: "{{client_name}}", label: "Názov klienta" },
  { key: "{{loan_amount}}", label: "Výška úveru" },
  { key: "{{installment_amount}}", label: "Výška splátky" },
  { key: "{{due_date}}", label: "Dátum splatnosti" },
  { key: "{{days_overdue}}", label: "Počet dní omeškania" },
  { key: "{{fee_amount}}", label: "Výška poplatku" },
  { key: "{{variable_symbol}}", label: "Variabilný symbol" },
];

const DEMO_VARIABLES = {
  client_name: "ABC Trading s.r.o.",
  loan_amount: "5000.00",
  installment_amount: "500.00",
  due_date: "15.10.2025",
  days_overdue: "7",
  fee_amount: "10.00",
  variable_symbol: "123456789",
};

export function ReminderPolicyDialog({
  open,
  onOpenChange,
  policy,
  onSuccess,
}: ReminderPolicyDialogProps) {
  const [formData, setFormData] = useState<ReminderPolicy>({
    daysAfterDue: 0,
    reminderType: "EMAIL",
    feeType: "FIXED",
    feeAmount: "0.00",
    messageTemplate: DEFAULT_TEMPLATE,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMessage, setPreviewMessage] = useState(DEFAULT_TEMPLATE);

  useEffect(() => {
    if (policy) {
      setFormData(policy);
      generatePreview(policy.messageTemplate);
    } else {
      setFormData({
        daysAfterDue: 0,
        reminderType: "EMAIL",
        feeType: "FIXED",
        feeAmount: "0.00",
        messageTemplate: DEFAULT_TEMPLATE,
      });
      generatePreview(DEFAULT_TEMPLATE);
    }
  }, [policy, open]);

  const generatePreview = (template: string) => {
    let preview = template;
    Object.entries(DEMO_VARIABLES).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    setPreviewMessage(preview);
  };

  const handleTemplateChange = (value: string) => {
    setFormData({ ...formData, messageTemplate: value });
    generatePreview(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (formData.daysAfterDue < 0 || formData.daysAfterDue > 365) {
        toast.error("Počet dní musí byť medzi 0 a 365");
        setIsSubmitting(false);
        return;
      }

      const feeAmount = parseFloat(formData.feeAmount);
      if (isNaN(feeAmount) || feeAmount < 0) {
        toast.error("Výška poplatku musí byť kladné číslo");
        setIsSubmitting(false);
        return;
      }

      if (formData.messageTemplate.length < 10 || formData.messageTemplate.length > 1000) {
        toast.error("Šablóna správy musí obsahovať 10-1000 znakov");
        setIsSubmitting(false);
        return;
      }

      const method = policy?.id ? "PATCH" : "POST";
      const url = policy?.id
        ? `/api/reminders/policies/${policy.id}`
        : "/api/reminders/policies";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri uložení politiky");
      }

      toast.success(
        policy?.id
          ? "Politika úspešne aktualizovaná"
          : "Politika úspešne vytvorená"
      );

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri uložení politiky");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {policy?.id ? "Upraviť politiku upomienok" : "Nová politika upomienok"}
          </DialogTitle>
          <DialogDescription>
            Nakonfigurujte pravidlá pre automatické odosielanie upomienok
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="days">Počet dní po splatnosti *</Label>
              <Input
                id="days"
                type="number"
                min="0"
                max="365"
                value={formData.daysAfterDue}
                onChange={(e) =>
                  setFormData({ ...formData, daysAfterDue: parseInt(e.target.value) })
                }
                placeholder="7"
                required
              />
              <p className="text-xs text-slate-500">Po koľkých dňoch omeškania odoslať upomienku</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Typ upomienky *</Label>
              <Select
                value={formData.reminderType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    reminderType: value as "EMAIL" | "SMS",
                  })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feeType">Typ poplatku *</Label>
              <Select
                value={formData.feeType}
                onValueChange={(value) =>
                  setFormData({ ...formData, feeType: value as "FIXED" | "PERCENTAGE" })
                }
              >
                <SelectTrigger id="feeType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Pevná suma (€)</SelectItem>
                  <SelectItem value="PERCENTAGE">Percento (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feeAmount">Výška poplatku *</Label>
              <div className="flex gap-2">
                <Input
                  id="feeAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.feeAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, feeAmount: e.target.value })
                  }
                  placeholder="10.00"
                  required
                />
                <span className="flex items-center px-3 py-2 bg-slate-100 rounded text-sm font-medium text-slate-600">
                  {formData.feeType === "FIXED" ? "€" : "%"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="template">Šablóna správy *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData({ ...formData, messageTemplate: DEFAULT_TEMPLATE });
                  generatePreview(DEFAULT_TEMPLATE);
                  toast.success("Šablóna resetovaná na predvolené");
                }}
              >
                Resetovať
              </Button>
            </div>
            <Textarea
              id="template"
              value={formData.messageTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              placeholder="Napíšte šablónu správy..."
              rows={6}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-slate-500">Minimálne 10 a maximálne 1000 znakov</p>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs font-semibold text-blue-900 mb-2">Dostupné premenné:</p>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_VARIABLES.map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById("template") as HTMLTextAreaElement;
                      textarea.value += variable.key;
                      handleTemplateChange(textarea.value);
                    }}
                    className="text-left px-2 py-1 bg-white border border-blue-200 rounded text-xs hover:bg-blue-100 transition-colors"
                  >
                    <code className="text-blue-600">{variable.key}</code>
                    <span className="text-slate-600 ml-1">({variable.label})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Náhľad správy</Label>
            <Card className="bg-slate-50">
              <CardContent className="pt-6">
                <div className="bg-white p-4 rounded border border-slate-200 text-sm whitespace-pre-wrap font-mono text-slate-700">
                  {previewMessage}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  (Toto je náhľad s demo dátami)
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Poznámka:</p>
              <p>Poplatok sa automaticky pripočíta k sume splátky. Upomienka sa odošle len raz za kombináciu splátky a politiky.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {policy?.id ? "Aktualizovať politiku" : "Vytvoriť politiku"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
