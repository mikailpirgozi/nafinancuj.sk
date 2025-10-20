"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { sk } from "date-fns/locale";
import { AlertCircle } from "lucide-react";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  description?: string;
}

interface AuditHistoryTabProps {
  entityType: string;
  entityId: string;
}

export function AuditHistoryTab({ entityType, entityId }: AuditHistoryTabProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [entityType, entityId]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/audit-logs?entityType=${entityType}&entityId=${entityId}`);

      if (!response.ok) {
        throw new Error("Chyba pri načítavaní história zmien");
      }

      const data = await response.json();
      setLogs(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznáma chyba");
      console.error("Error fetching audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-100 text-emerald-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "CREATE":
        return "Vytvorené";
      case "UPDATE":
        return "Upravené";
      case "DELETE":
        return "Odstránené";
      default:
        return action;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-900">Chyba pri načítavaní</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Žiadne zmeny na zázname</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {logs.map((log, index) => (
            <div key={log.id} className="relative pl-16">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-9 h-9 bg-white border-4 border-slate-200 rounded-full flex items-center justify-center">
                {index === 0 && <div className="w-2 h-2 bg-slate-400 rounded-full"></div>}
              </div>

              {/* Content */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge className={`${getActionColor(log.action)}`}>{getActionLabel(log.action)}</Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(log.timestamp), {
                      addSuffix: true,
                      locale: sk,
                    })}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {log.description && (
                    <p className="text-slate-700 font-medium">{log.description}</p>
                  )}

                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="bg-white rounded p-3 mt-3 space-y-2 border border-slate-100">
                      <p className="font-semibold text-xs text-slate-600">Zmené polia:</p>
                      {Object.entries(log.changes).map(([field, change]) => (
                        <div key={field} className="flex gap-2 text-xs">
                          <span className="text-slate-600 font-mono min-w-fit">{field}:</span>
                          <div className="flex-1 flex gap-2 items-center">
                            {change.old !== undefined && (
                              <span className="line-through text-red-600">
                                {JSON.stringify(change.old)}
                              </span>
                            )}
                            {change.new !== undefined && (
                              <span className="text-emerald-600 font-semibold">
                                {JSON.stringify(change.new)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>ID: <code className="text-xs">{log.userId.substring(0, 8)}...</code></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
