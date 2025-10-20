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

const collateralSchema = z.object({
  type: z.enum(["REAL_ESTATE", "VEHICLE", "EQUIPMENT", "OTHER"]),
  description: z.string().min(1).max(500),
  estimatedValue: z.number().min(0),
  notes: z.string().optional(),
});

interface CollateralFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  onSuccess: () => void;
}

export function CollateralFormDialog({
  open,
  onOpenChange,
  loanId,
  onSuccess,
}: CollateralFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "REAL_ESTATE",
    description: "",
    estimatedValue: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const estimatedValue = parseFloat(formData.estimatedValue);
      if (isNaN(estimatedValue) || estimatedValue < 0) {
        toast.error("Odhadovaná hodnota musí byť kladné číslo");
        setIsSubmitting(false);
        return;
      }

      const validation = collateralSchema.safeParse({
        type: formData.type,
        description: formData.description,
        estimatedValue,
        notes: formData.notes,
      });

      if (!validation.success) {
        toast.error("Validačná chyba v údajoch");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/collaterals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId,
          type: formData.type,
          description: formData.description,
          estimatedValue: Math.round(estimatedValue * 100), // Convert to cents
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba pri vytváraní kolaterála");
      }

      toast.success("Kolaterál úspešne pridaný!");
      setFormData({
        type: "REAL_ESTATE",
        description: "",
        estimatedValue: "",
        notes: "",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri vytváraní kolaterála");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pridať kolaterál</DialogTitle>
          <DialogDescription>
            Zaznamenajte nový kolaterál (zabezpečenie)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Typ kolaterála *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REAL_ESTATE">Nehnuteľnosť</SelectItem>
                <SelectItem value="VEHICLE">Vozidlo</SelectItem>
                <SelectItem value="EQUIPMENT">Zariadenie</SelectItem>
                <SelectItem value="OTHER">Iné</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Popis *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Napr. Byt 3+1 v Bratislave"
              rows={3}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Odhadovaná hodnota (€) *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={formData.estimatedValue}
              onChange={(e) =>
                setFormData({ ...formData, estimatedValue: e.target.value })
              }
              placeholder="0.00"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Poznámka</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Dodatočné informácie"
              rows={2}
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
              "Pridať kolaterál"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

