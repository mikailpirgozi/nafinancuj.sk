"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const paymentSchema = z.object({
  amount: z.number().min(0.01),
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "CARD", "OTHER"]),
  notes: z.string().optional(),
});

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  variableSymbol: string;
  onSuccess: () => void;
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  loanId,
  variableSymbol,
  onSuccess,
}: PaymentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "BANK_TRANSFER",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Suma musí byť kladné číslo");
        setIsSubmitting(false);
        return;
      }

      const validation = paymentSchema.safeParse({
        amount,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      });

      if (!validation.success) {
        toast.error("Validačná chyba v údajoch");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId,
          variableSymbol,
          amount: amount * 100, // Convert to cents
          paymentMethod: formData.paymentMethod,
          paidAt: new Date().toISOString().split("T")[0],
          notes: formData.notes,
          status: "COMPLETED",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri vytváraní platby");
      }

      toast.success("Platba úspešne zaznamenána!");
      setFormData({ amount: "", paymentMethod: "BANK_TRANSFER", notes: "" });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri vytváraní platby");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pridať platbu</DialogTitle>
          <DialogDescription>
            Zaznamenajte novú platbu na úver
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Suma (€) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Metóda platby *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentMethod: value })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Bankový prevod</SelectItem>
                <SelectItem value="CASH">Hotovosť</SelectItem>
                <SelectItem value="CARD">Platobná karta</SelectItem>
                <SelectItem value="OTHER">Iné</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Poznámka</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Napr. Platba za splátku č. 3"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </form>

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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Ukladám...
              </>
            ) : (
              "Potvrdiť platbu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

