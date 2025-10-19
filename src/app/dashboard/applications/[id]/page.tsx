"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  FileText,
  Plus,
  RefreshCw,
  Send,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

interface Application {
  id: string;
  clientId: string;
  loanAmount: number;
  purpose: string;
  status: string;
  durationMonths: number;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    companyName: string | null;
    contactPerson: string;
    email: string | null;
    phone: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

const WORKFLOW_STEPS = [
  { id: "NEW", label: "Nová", color: "bg-slate-500" },
  { id: "REVIEWING", label: "V kontrole", color: "bg-blue-500" },
  { id: "DOCUMENTS_REQUESTED", label: "Dokumenty", color: "bg-amber-500" },
  { id: "PENDING_APPROVAL", label: "Na schválenie", color: "bg-purple-500" },
  { id: "APPROVED", label: "Schválená", color: "bg-emerald-500" },
];

const REQUIRED_DOCUMENTS = [
  { id: "register_extract", label: "Výpis z registra", completed: false },
  { id: "income_cert", label: "Potvrdenie o príjmoch", completed: false },
  { id: "balance_sheet", label: "Súvaha a výkaz ziskov", completed: false },
];

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCreatingLoan, setIsCreatingLoan] = useState(false);

  const fetchApplicationData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [appRes, commentsRes] = await Promise.all([
        fetch(`/api/applications/${applicationId}`),
        fetch(`/api/applications/${applicationId}/comments`),
      ]);

      if (!appRes.ok) throw new Error("Chyba pri načítaní žiadosti");

      const appData = await appRes.json();
      setApplication(appData.data);

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.data || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri načítaní dát");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    setMounted(true);
    fetchApplicationData();
  }, [fetchApplicationData]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Komentár nemôže byť prázdny");
      return;
    }

    try {
      setIsSubmittingComment(true);
      const response = await fetch(`/api/applications/${applicationId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error("Chyba pri pridaní komentára");

      toast.success("Komentár pridaný");
      setNewComment("");
      await fetchApplicationData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri pridaní komentára");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCreateLoan = async () => {
    try {
      setIsCreatingLoan(true);
      const response = await fetch(`/api/applications/${applicationId}/create-loan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: application?.loanAmount,
          durationMonths: application?.durationMonths,
          purpose: application?.purpose,
        }),
      });

      if (!response.ok) throw new Error("Chyba pri vytvorení úveru");

      const data = await response.json();
      toast.success("Úver vytvorený");
      window.location.href = `/dashboard/loans/${data.data.id}`;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Chyba pri vytvorení úveru");
    } finally {
      setIsCreatingLoan(false);
    }
  };

  if (!mounted || !application) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Načítavam žiadosť...</p>
        </div>
      </div>
    );
  }

  const clientName = application.client?.companyName || application.client?.contactPerson || "Neznámy klient";
  const currentStepIndex = WORKFLOW_STEPS.findIndex((step) => step.id === application.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/applications">
              <Button variant="outline" size="sm" className="border-slate-200 hover:border-blue-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Späť
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-1">Žiadosť #{applicationId.slice(0, 8).toUpperCase()}</h1>
              <p className="text-slate-600">{clientName}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchApplicationData} variant="outline" disabled={loading} className="border-slate-200 hover:border-blue-300 hover:bg-blue-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Obnoviť
            </Button>
            {application.status === "APPROVED" && (
              <Button onClick={handleCreateLoan} disabled={isCreatingLoan} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30">
                <Plus className="mr-2 h-4 w-4" />
                Vytvoriť úver
              </Button>
            )}
          </div>
        </div>

        {/* Application Info Card */}
        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-sm text-slate-500 mb-2">Klient</p>
                <Link href={`/dashboard/clients/${application.clientId}`} className="text-lg font-semibold text-blue-600 hover:underline">
                  {clientName}
                </Link>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Suma žiadosti</p>
                <p className="text-3xl font-bold text-slate-900">€{(application.loanAmount / 100).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Trvanie</p>
                <p className="text-2xl font-bold text-slate-900">{application.durationMonths} mesiacov</p>
              </div>
            </div>
            {application.purpose && (
              <div className="mt-6 pt-6 border-t border-slate-200/60">
                <p className="text-sm text-slate-500 mb-2">Účel žiadosti</p>
                <p className="text-slate-700">{application.purpose}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Workflow */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Workflow aplikácie</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  {WORKFLOW_STEPS.map((step, index) => (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                          index <= currentStepIndex ? step.color : "bg-slate-300"
                        } ${index === currentStepIndex ? "ring-4 ring-blue-200 scale-110" : ""}`}>
                          {index < currentStepIndex ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <p className={`text-xs mt-2 text-center font-medium ${index <= currentStepIndex ? "text-slate-900" : "text-slate-500"}`}>
                          {step.label}
                        </p>
                      </div>
                      {index < WORKFLOW_STEPS.length - 1 && (
                        <ChevronRight className={`h-5 w-5 mx-2 ${index < currentStepIndex ? "text-emerald-500" : "text-slate-300"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Required Documents */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Požadované dokumenty
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {REQUIRED_DOCUMENTS.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      doc.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                    }`}>
                      {doc.completed && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-slate-700 font-medium flex-1">{doc.label}</span>
                    <Badge variant={doc.completed ? "default" : "outline"} className={doc.completed ? "bg-emerald-100 text-emerald-800" : ""}>
                      {doc.completed ? "Nahraný" : "Chýba"}
                    </Badge>
                  </div>
                ))}
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 mt-3">
                  <Plus className="mr-2 h-4 w-4" />
                  Nahrať dokument
                </Button>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Komentáre a história</CardTitle>
                <CardDescription>Komunikácia a zmeny v žiadosti</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Add Comment */}
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Napíšte komentár..."
                    className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmittingComment ? "Odosielám..." : "Pridať komentár"}
                  </Button>
                </div>

                {/* Comments List */}
                <div className="space-y-3 mt-6">
                  {comments.length === 0 ? (
                    <p className="text-center text-slate-600 py-8">Žiadne komentáre</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-slate-700">{comment.content}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              {comment.createdBy} • {format(new Date(comment.createdAt), "dd.MM.yyyy HH:mm", { locale: sk })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Status */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Badge className={`text-sm px-3 py-2 ${
                  application.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800"
                    : application.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {application.status}
                </Badge>
                <div className="mt-4 space-y-2 text-sm">
                  <div>
                    <p className="text-slate-500">Vytvorená</p>
                    <p className="font-medium text-slate-900">{format(new Date(application.createdAt), "dd.MM.yyyy HH:mm", { locale: sk })}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Posledná zmena</p>
                    <p className="font-medium text-slate-900">{format(new Date(application.updatedAt), "dd.MM.yyyy HH:mm", { locale: sk })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Rýchle akcie</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-2">
                <Button variant="outline" className="w-full border-slate-200 hover:border-blue-300 justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Priradiť agentovi
                </Button>
                <Button variant="outline" className="w-full border-slate-200 hover:border-blue-300 justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Požiadať o dokumenty
                </Button>
                <Button variant="outline" className="w-full border-slate-200 hover:border-blue-300 justify-start text-emerald-600 hover:text-emerald-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Schváliť
                </Button>
                <Button variant="outline" className="w-full border-slate-200 hover:border-red-300 justify-start text-red-600 hover:text-red-700">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Zamietnuť
                </Button>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle>Časová os</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-blue-600 rounded-full mt-1.5"></div>
                      <div className="w-0.5 h-12 bg-slate-200 absolute left-1 top-4 ml-1"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Žiadosť vytvorená</p>
                      <p className="text-sm text-slate-600">{format(new Date(application.createdAt), "dd.MM.yyyy", { locale: sk })}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

