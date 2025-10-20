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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Installment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

interface MatchPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  paymentAmount: number;
  paymentDate: string;
  loanId: string;
  variableSymbol: string;
  installments: Installment[];
  onSuccess: () => void;
}

export function MatchPaymentDialog({
  open,
  onOpenChange,
  paymentId,
  paymentAmount,
  paymentDate,
  loanId,
  variableSymbol,
  installments,
  onSuccess,
}: MatchPaymentDialogProps) {
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter unpaid or partially paid installments
  const availableInstallments = installments.filter(
    (inst) => inst.status === "UNPAID" || inst.status === "PARTIALLY_PAID"
  );

  const selectedInstallment = availableInstallments.find(
    (inst) => inst.id === selectedInstallmentId
  );

  const handleMatch = async () => {
    if (!selectedInstallmentId) {
      toast.error("Vyberte splátku");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/payments/${paymentId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installmentId: selectedInstallmentId,
          loanId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri párovaní platby");
      }

      toast.success("Platba úspešne spárovaná!");
      setSelectedInstallmentId("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri párovaní");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Spárovať platbu</DialogTitle>
          <DialogDescription>
            Priraďte nepárovú platbu k splátke
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-blue-600">Suma platby:</span>
                <span className="font-semibold text-blue-900">
                  €{(paymentAmount / 100).toLocaleString("sk-SK", { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-600">Dátum platby:</span>
                <span className="text-sm text-blue-900">{paymentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-600">Variabilný symbol:</span>
                <span className="text-sm font-mono text-blue-900">{variableSymbol}</span>
              </div>
            </div>
          </div>

          {/* Available Installments */}
          <div className="space-y-2">
            <Label htmlFor="installment">Vyberte splátku *</Label>
            <Select
              value={selectedInstallmentId}
              onValueChange={setSelectedInstallmentId}
              disabled={isSubmitting}
            >
              <SelectTrigger id="installment">
                <SelectValue placeholder="Vyberte splátku..." />
              </SelectTrigger>
              <SelectContent>
                {availableInstallments.length === 0 ? (
                  <div className="p-2 text-center text-slate-500">
                    Žiadne dostupné splátky
                  </div>
                ) : (
                  availableInstallments.map((inst) => {
                    const remaining = inst.totalAmount - inst.paidAmount;
                    return (
                      <SelectItem key={inst.id} value={inst.id}>
                        <div className="flex gap-4">
                          <span>Splátka {inst.installmentNumber}</span>
                          <span className="text-slate-500">
                            Splatnosť: {inst.dueDate}
                          </span>
                          <span className="font-semibold">
                            €{(remaining / 100).toLocaleString("sk-SK", { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Installment Details */}
          {selectedInstallment && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Celková suma splátky:</span>
                  <span className="font-semibold text-slate-900">
                    €{(selectedInstallment.totalAmount / 100).toLocaleString("sk-SK", { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Už splatené:</span>
                  <span className="font-semibold text-slate-900">
                    €{(selectedInstallment.paidAmount / 100).toLocaleString("sk-SK", { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-600">Zostáva:</span>
                  <span className="font-semibold text-slate-900">
                    €{((selectedInstallment.totalAmount - selectedInstallment.paidAmount) / 100).toLocaleString("sk-SK", { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mismatch Warning */}
          {selectedInstallment &&
            paymentAmount !== selectedInstallment.totalAmount - selectedInstallment.paidAmount && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Suma platby sa nezhoduje so zvyškom splátky. Bude spárovaná čiastočne.
                </AlertDescription>
              </Alert>
            )}

          {availableInstallments.length === 0 && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                K tomuto úveru nie sú žiadne nesplatené splátky.
              </AlertDescription>
            </Alert>
          )}
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
            onClick={handleMatch}
            disabled={isSubmitting || !selectedInstallmentId}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Spracovávam...
              </>
            ) : (
              "Spárovať platbu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

