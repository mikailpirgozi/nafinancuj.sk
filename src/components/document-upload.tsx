"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: string;
  status: "UPLOADED" | "VERIFIED" | "REJECTED";
}

interface DocumentUploadProps {
  loanId: string;
  documents?: Document[];
  onDocumentsChange?: (docs: Document[]) => void;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

export function DocumentUpload({ loanId, documents = [], onDocumentsChange }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [localDocs, setLocalDocs] = useState<Document[]>(documents);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;

    setUploading(true);
    const newDocs: Document[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Nepodporovaný formát: ${file.name}`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Súbor je príliš veľký: ${file.name}`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("loanId", loanId);

        const response = await fetch("/api/documents/upload-url", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        newDocs.push({
          id: data.id,
          name: file.name,
          type: file.type,
          url: data.url,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          status: "UPLOADED",
        });

        toast.success(`${file.name} úspešne nahraný`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Chyba pri nahrávaní: ${file.name}`);
      }
    }

    const updated = [...localDocs, ...newDocs];
    setLocalDocs(updated);
    onDocumentsChange?.(updated);
    setUploading(false);
  };

  const removeDocument = (id: string) => {
    const updated = localDocs.filter(d => d.id !== id);
    setLocalDocs(updated);
    onDocumentsChange?.(updated);
    toast.success("Dokument bol odstránený");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5 text-blue-600" />
          Dokumenty
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Zone */}
        <div
          onDrag={handleDrag}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDrop={(e) => {
            handleDrag(e);
            handleUpload(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400"
          }`}
        >
          <Upload className="h-12 w-12 mx-auto mb-2 text-slate-400" />
          <p className="font-semibold text-slate-900">Pretiahnite dokumenty sem</p>
          <p className="text-sm text-slate-600">alebo kliknite na tlačidlo nižšie</p>
          <input
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(",")}
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            id="file-input"
          />
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            disabled={uploading}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            {uploading ? "Nahrávam..." : "Vybrať dokumenty"}
          </Button>
        </div>

        {/* Documents List */}
        {localDocs.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Nahrané dokumenty ({localDocs.length})</p>
            <div className="space-y-2">
              {localDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-4 w-4 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-600">{(doc.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === "VERIFIED" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Overený
                      </Badge>
                    ) : doc.status === "REJECTED" ? (
                      <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Zamietnutý
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">Nahraný</Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
