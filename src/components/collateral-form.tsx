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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface Collateral {
  id: string;
  loanId: string;
  type: "REAL_ESTATE" | "VEHICLE" | "EQUIPMENT" | "INVENTORY" | "OTHER";
  description: string;
  estimatedValue: number;
  notes: string;
  documentUrls: string[];
  createdAt: string;
}

interface CollateralFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  collateral?: Collateral;
  onSuccess: () => void;
}

const COLLATERAL_TYPES = [
  { value: "REAL_ESTATE", label: "Nehnuteľnosť" },
  { value: "VEHICLE", label: "Vozidlo" },
  { value: "EQUIPMENT", label: "Zariadenie" },
  { value: "INVENTORY", label: "Zásoby" },
  { value: "OTHER", label: "Iné" },
];

export default function CollateralFormDialog({
  open,
  onOpenChange,
  loanId,
  collateral,
  onSuccess,
}: CollateralFormDialogProps) {
  const [type, setType] = useState<string>(collateral?.type || "REAL_ESTATE");
  const [description, setDescription] = useState(collateral?.description || "");
  const [estimatedValue, setEstimatedValue] = useState(
    collateral?.estimatedValue ? String(collateral.estimatedValue / 100) : ""
  );
  const [notes, setNotes] = useState(collateral?.notes || "");
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments([...documents, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setDocuments([...documents, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type || !description || !estimatedValue) {
      toast.error("Vyplňte všetky povinné polia");
      return;
    }

    if (Number(estimatedValue) <= 0) {
      toast.error("Hodnota musí byť väčšia ako 0");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("loanId", loanId);
      formData.append("type", type);
      formData.append("description", description);
      formData.append("estimatedValue", String(Math.round(Number(estimatedValue) * 100)));
      formData.append("notes", notes);

      documents.forEach((doc) => {
        formData.append("documents", doc);
      });

      const endpoint = collateral
        ? `/api/collaterals/${collateral.id}`
        : `/api/collaterals`;
      const method = collateral ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to save collateral");

      toast.success(
        collateral ? "Kolaterál aktualizovaný" : "Kolaterál vytvorený"
      );
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri ukladaní kolaterálu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {collateral ? "Upraviť kolaterál" : "Nový kolaterál"}
          </DialogTitle>
          <DialogDescription>
            Vyplňte informácie o kolaterále pre úver
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Typ kolaterálu <span className="text-red-500">*</span>
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLLATERAL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Popis <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Napr. Bytovka 3+1, Bratislava..."
              className="min-h-24"
              required
            />
          </div>

          {/* Estimated Value */}
          <div className="space-y-2">
            <Label htmlFor="value">
              Odhadovaná hodnota (€) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="50000.00"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dodatočné informácie o kolaterále..."
              className="min-h-20"
            />
          </div>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dokumenty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-200 rounded-lg p-8 transition text-center cursor-pointer hover:border-slate-300"
              >
                <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 mb-2">
                  Pretiahnite súbory sem alebo kliknite na výber
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>Vybrať súbory</span>
                  </Button>
                </label>
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Vybrané súbory ({documents.length}):
                  </p>
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-50 p-2 rounded"
                    >
                      <span className="text-sm text-slate-700">{doc.name}</span>
                      <button
                        type="button"
                        onClick={() => removeDocument(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {collateral ? "Uložiť zmeny" : "Vytvoriť kolaterál"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

