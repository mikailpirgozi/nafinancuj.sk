"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface PaymentFormProps {
  loanId: string;
  variableSymbol: string;
  onSuccess: () => void;
}

interface PaymentFormData {
  amount: string;
  paymentMethod: "CASH" | "BANK_TRANSFER";
  paidAt: string;
  notes: string;
}

export function PaymentForm({ loanId, variableSymbol, onSuccess }: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: "",
    paymentMethod: "BANK_TRANSFER",
    paidAt: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        loanId,
        amount: Math.round(parseFloat(formData.amount) * 100), // Convert to cents
        paymentMethod: formData.paymentMethod,
        variableSymbol,
        paidAt: new Date(formData.paidAt).toISOString(),
        notes: formData.notes || null,
      };

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri pridávaní platby");
      }

      toast.success("Platba úspešne pridaná!");
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri pridávaní platby");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      paymentMethod: "BANK_TRANSFER",
      paidAt: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          Pridať platbu
        </CardTitle>
        <CardDescription>Zaznamenajte novú platbu pre tento úver</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Suma (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="100.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">
                  Spôsob platby <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: "CASH" | "BANK_TRANSFER") =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_TRANSFER">Bankový prevod</SelectItem>
                    <SelectItem value="CASH">Hotovosť</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidAt">
                  Dátum platby <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="paidAt"
                  type="date"
                  value={formData.paidAt}
                  onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variableSymbol">Variabilný symbol</Label>
                <Input id="variableSymbol" value={variableSymbol} disabled className="bg-slate-100" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Poznámka</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Voliteľná poznámka k platbe..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Zrušiť
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Pridávam...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Pridať platbu
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

