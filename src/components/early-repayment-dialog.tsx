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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, DollarSign, TrendingDown, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { calculateEarlyRepayment } from "@/lib/services/loan-calculator";

interface Installment {
  id: string;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

interface EarlyRepaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  variableSymbol: string;
  installments: Installment[];
  onSuccess: () => void;
}

export function EarlyRepaymentDialog({
  open,
  onOpenChange,
  loanId,
  variableSymbol,
  installments,
  onSuccess,
}: EarlyRepaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculation, setCalculation] = useState<{
    principal: number;
    interest: number;
    discount: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (open && installments.length > 0) {
      calculateRepayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, installments]);

  const calculateRepayment = () => {
    // Find unpaid and partially paid installments
    const remainingInstallments = installments.filter(
      (inst) => inst.status === "UNPAID" || inst.status === "PARTIALLY_PAID"
    );

    if (remainingInstallments.length === 0) {
      setCalculation(null);
      return;
    }

    // Calculate remaining principal and interest
    const remainingPrincipal = remainingInstallments.reduce(
      (sum, inst) => sum + (inst.principalAmount - Math.min(inst.paidAmount, inst.principalAmount)),
      0
    );

    const remainingInterest = remainingInstallments.reduce(
      (sum, inst) => {
        const principalPaid = Math.min(inst.paidAmount, inst.principalAmount);
        const interestPaid = Math.max(0, inst.paidAmount - principalPaid);
        return sum + (inst.interestAmount - interestPaid);
      },
      0
    );

    // Calculate early repayment with 50% discount on interest
    const result = calculateEarlyRepayment(remainingPrincipal, remainingInterest);
    setCalculation(result);
  };

  const handleConfirm = async () => {
    if (!calculation) return;

    setIsSubmitting(true);

    try {
      // Create payment for early repayment
      const payload = {
        loanId,
        amount: calculation.total,
        paymentMethod: "BANK_TRANSFER",
        variableSymbol,
        paidAt: new Date().toISOString(),
        notes: `Predčasné splatenie úveru. Zľava na úrok: €${(calculation.discount / 100).toFixed(2)}`,
      };

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri vytváraní platby");
      }

      toast.success("Predčasné splatenie úspešne zaznamenané!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating early repayment:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri vytváraní platby");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!calculation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Predčasné splatenie</DialogTitle>
            <DialogDescription>Žiadne nesplatené splátky</DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600">Tento úver je už kompletne splatený.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Zavrieť
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-600" />
            Predčasné splatenie úveru
          </DialogTitle>
          <DialogDescription>
            Výpočet sumy pre predčasné splatenie so zľavou 50% na zostávajúci úrok
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Calculation Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Zostávajúca istina</p>
                <p className="text-2xl font-bold text-slate-900">
                  €{(calculation.principal / 100).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline" className="text-slate-700">
                Plná suma
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div>
                <p className="text-sm text-orange-600">Zostávajúci úrok (pôvodný)</p>
                <p className="text-xl font-semibold text-orange-700 line-through">
                  €{(calculation.interest + calculation.discount).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div>
                <p className="text-sm text-emerald-600">Zľava na úrok (50%)</p>
                <p className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  -€{(calculation.discount / 100).toLocaleString()}
                </p>
              </div>
              <Badge className="bg-emerald-600">50% zľava</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div>
                <p className="text-sm text-blue-600">Úrok po zľave</p>
                <p className="text-xl font-semibold text-blue-700">
                  €{(calculation.interest / 100).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1">Celková suma na splatenie</p>
                <p className="text-4xl font-bold">€{(calculation.total / 100).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80">Ušetríte</p>
                <p className="text-2xl font-bold text-emerald-300">
                  €{(calculation.discount / 100).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="text-blue-900 font-semibold mb-2">ℹ️ Informácia</p>
            <ul className="text-blue-800 space-y-1 list-disc list-inside">
              <li>Pri predčasnom splatení získate 50% zľavu na zostávajúci úrok</li>
              <li>Istina sa musí zaplatiť v plnej výške</li>
              <li>Po potvrdení bude vytvorená platba a úver bude uzavretý</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Zrušiť
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Spracovávam...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Potvrdiť predčasné splatenie
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

