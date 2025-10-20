"use client";

import { useState, useRef } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Upload, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  onSuccess: () => void;
}

interface UploadedFile {
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  loanId,
  onSuccess,
}: DocumentUploadDialogProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Nepovolený typ súboru. Povolené: PDF, JPG, PNG, DOC, DOCX";
    }
    if (file.size > MAX_SIZE) {
      return "Súbor je príliš veľký. Maximum je 10MB";
    }
    return null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const validatedFiles: UploadedFile[] = newFiles.map((file) => ({
      name: file.name,
      size: file.size,
      progress: 0,
      status: "pending" as const,
      error: validateFile(file) || undefined,
    }));

    setFiles((prev) => [...prev, ...validatedFiles]);
  };

  const handleUpload = async () => {
    const filesToUpload = files.filter((f) => !f.error);
    
    if (filesToUpload.length === 0) {
      toast.error("Nie sú žiadne platné súbory na nahratie");
      return;
    }

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.error) continue;

        // Update progress
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "uploading" as const } : f
          )
        );

        // Get signed upload URL
        const urlResponse = await fetch("/api/documents/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.name.split(".").pop()?.toLowerCase(),
          }),
        });

        if (!urlResponse.ok) {
          throw new Error("Chyba pri získavaní upload URL");
        }

        const { uploadUrl, fileUrl } = await urlResponse.json();

        // Upload to Supabase
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/octet-stream" },
          body: file as any,
        });

        if (!uploadResponse.ok) {
          throw new Error("Chyba pri nahrávaní súboru");
        }

        // Create document record
        const docResponse = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loanId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.name.split(".").pop()?.toLowerCase(),
            fileUrl,
          }),
        });

        if (!docResponse.ok) {
          throw new Error("Chyba pri vytváraní záznamu dokumentu");
        }

        // Update progress to success
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "success" as const, progress: 100 } : f
          )
        );
      }

      toast.success("Všetky súbory boli úspešne nahrané!");
      setFiles([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error(error instanceof Error ? error.message : "Chyba pri nahrávaní");
      
      // Mark failed files
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "error" as const, error: "Chyba pri nahrávaní" }
            : f
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nahrať dokumenty</DialogTitle>
          <DialogDescription>
            Nahrávajte maximálne 10MB súbory (PDF, JPG, PNG, DOC, DOCX)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-2" />
            <p className="font-medium text-slate-900 mb-1">
              Pretiahnite súbory sem alebo kliknite
            </p>
            <p className="text-sm text-slate-600">Podporované formáty: PDF, JPG, PNG, DOC, DOCX (max 10MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-4"
            >
              Vybrať súbory
            </Button>
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Nahraté súbory ({files.length})</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {file.name}
                        </span>
                        {file.status === "success" && (
                          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </span>
                        {file.error && (
                          <span className="text-xs text-red-600">{file.error}</span>
                        )}
                      </div>
                      {file.status === "uploading" && (
                        <Progress value={file.progress} className="h-1 mt-2" />
                      )}
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      className="flex-shrink-0 p-1 hover:bg-slate-200 rounded"
                    >
                      <X className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Zrušiť
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.filter((f) => !f.error).length === 0}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isUploading ? "Nahrávám..." : "Nahrať súbory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

