"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";

interface PlanRequest {
  id: string;
  currentPlan: string;
  requestedPlan: string;
  status: string;
  paymentAlias: string | null;
  notes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  dealership: { id: string; name: string; plan: string; email: string | null };
}

export default function AdminPlanRequestsPage() {
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadRequests = () => {
    fetch("/api/admin/plan-requests")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRequests(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAction = async (requestId: string, action: "APPROVED" | "REJECTED") => {
    setProcessing(requestId);
    await fetch("/api/admin/plan-requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    setProcessing(null);
    loadRequests();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return "warning" as const;
      case "APPROVED": return "success" as const;
      case "REJECTED": return "danger" as const;
      default: return "default" as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "Pendiente";
      case "APPROVED": return "Aprobada";
      case "REJECTED": return "Rechazada";
      default: return status;
    }
  };

  const planName = (plan: string) => PLANS[plan as PlanId]?.name || plan;

  const pending = requests.filter((r) => r.status === "PENDING");
  const processed = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <FileText size={24} /> Solicitudes de Cambio de Plan
      </h1>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-yellow-400">
                Pendientes ({pending.length})
              </h2>
              {pending.map((req) => (
                <Card key={req.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-white font-medium">{req.dealership.name}</p>
                      <p className="text-sm text-gray-400">{req.dealership.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="default">{planName(req.currentPlan)}</Badge>
                        <span className="text-gray-500">→</span>
                        <Badge variant="info">{planName(req.requestedPlan)}</Badge>
                      </div>
                      {req.paymentAlias && (
                        <p className="text-xs text-gray-500 mt-1">
                          Alias de pago: <span className="text-gray-300">{req.paymentAlias}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Solicitado: {new Date(req.createdAt).toLocaleString("es-AR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleAction(req.id, "APPROVED")}
                        disabled={processing === req.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleAction(req.id, "REJECTED")}
                        disabled={processing === req.id}
                        className="text-red-400 hover:bg-red-900/20"
                      >
                        <XCircle size={16} className="mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {pending.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <FileText size={40} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">No hay solicitudes pendientes</p>
              </div>
            </Card>
          )}

          {/* History */}
          {processed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-300">Historial</h2>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Agencia</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">De</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">A</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Estado</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processed.map((req) => (
                        <tr key={req.id} className="border-b border-gray-800">
                          <td className="py-3 px-4 text-white">{req.dealership.name}</td>
                          <td className="py-3 px-4"><Badge variant="default">{planName(req.currentPlan)}</Badge></td>
                          <td className="py-3 px-4"><Badge variant="info">{planName(req.requestedPlan)}</Badge></td>
                          <td className="py-3 px-4"><Badge variant={statusBadge(req.status)}>{statusLabel(req.status)}</Badge></td>
                          <td className="py-3 px-4 text-gray-400">{new Date(req.createdAt).toLocaleDateString("es-AR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
