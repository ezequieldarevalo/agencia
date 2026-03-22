"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowLeft,
  UserCircle,
  Car,
  Phone,
  Mail,
  DollarSign,
  Star,
  Eye,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
} from "lucide-react";

interface Interaction {
  id: string;
  date: string;
  status: string;
  origin: string | null;
  score: number;
  notes: string | null;
  searchCategory: string | null;
  searchInterest: string | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  saleCompleted: boolean;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  };
  vehicle: {
    id: string;
    name: string;
    domain: string | null;
    salePrice: number | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const COLUMNS = [
  {
    id: "CONSULTA_ABIERTA",
    title: "Consulta Abierta",
    color: "#3b82f6",
    bgColor: "bg-blue-500/5",
    borderColor: "border-blue-500/30",
    icon: "💬",
  },
  {
    id: "PRESUPUESTADO",
    title: "Presupuestado",
    color: "#f59e0b",
    bgColor: "bg-yellow-500/5",
    borderColor: "border-yellow-500/30",
    icon: "📋",
  },
  {
    id: "VENTA_CERRADA",
    title: "Venta Cerrada",
    color: "#22c55e",
    bgColor: "bg-green-500/5",
    borderColor: "border-green-500/30",
    icon: "✅",
  },
  {
    id: "NO_INTERESADO",
    title: "No Interesado",
    color: "#ef4444",
    bgColor: "bg-red-500/5",
    borderColor: "border-red-500/30",
    icon: "❌",
  },
];

const ORIGINS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  MERCADOLIBRE: "MercadoLibre",
  TELEFONO: "Teléfono",
  PRESENCIAL: "Presencial",
  WEB: "Web",
  REFERIDO: "Referido",
  OTRO: "Otro",
};

function formatCurrency(amount: number | null, currency?: string | null) {
  if (!amount) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={10}
          className={s <= score ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}
        />
      ))}
    </div>
  );
}

export default function PipelinePage() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [filterOrigin, setFilterOrigin] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/interactions");
      const data = await res.json();
      if (Array.isArray(data)) setInteractions(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const moveCard = async (id: string, newStatus: string) => {
    try {
      await fetch("/api/interactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      setInteractions((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
      );
    } catch {}
  };

  const getColumnItems = (columnId: string) => {
    return interactions
      .filter((i) => {
        const matchStatus = i.status === columnId;
        const matchOrigin = !filterOrigin || i.origin === filterOrigin;
        return matchStatus && matchOrigin;
      })
      .sort((a, b) => b.score - a.score);
  };

  const getNextStatus = (current: string) => {
    const idx = COLUMNS.findIndex((c) => c.id === current);
    if (idx < COLUMNS.length - 2) return COLUMNS[idx + 1].id; // Don't auto-move to NO_INTERESADO
    return null;
  };

  const getPrevStatus = (current: string) => {
    const idx = COLUMNS.findIndex((c) => c.id === current);
    if (idx > 0) return COLUMNS[idx - 1].id;
    return null;
  };

  const totalLeads = interactions.length;
  const conversionRate = totalLeads
    ? ((interactions.filter((i) => i.status === "VENTA_CERRADA").length / totalLeads) * 100).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de Ventas</h1>
          <p className="text-sm text-gray-400 mt-1">
            {totalLeads} leads · Tasa de conversión: {conversionRate}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <select
              value={filterOrigin}
              onChange={(e) => setFilterOrigin(e.target.value)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="">Todos los orígenes</option>
              {Object.entries(ORIGINS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <Button variant="ghost" onClick={refresh}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4 min-h-[70vh]">
        {COLUMNS.map((col) => {
          const items = getColumnItems(col.id);
          return (
            <div key={col.id} className={`rounded-xl ${col.bgColor} border ${col.borderColor} flex flex-col`}>
              {/* Column Header */}
              <div className="p-3 border-b border-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{col.icon}</span>
                    <h3 className="font-semibold text-sm">{col.title}</h3>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: col.color + "20", color: col.color }}
                  >
                    {items.length}
                  </span>
                </div>
              </div>

              {/* Column Body */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-8">Sin leads</p>
                ) : (
                  items.map((item) => {
                    const isExpanded = expandedCard === item.id;
                    const nextStatus = getNextStatus(item.status);
                    const prevStatus = getPrevStatus(item.status);

                    return (
                      <div
                        key={item.id}
                        className="bg-gray-900/80 border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-all"
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                              <UserCircle size={14} className="text-gray-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {item.client.firstName} {item.client.lastName}
                              </p>
                              <ScoreStars score={item.score} />
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedCard(isExpanded ? null : item.id)}
                            className="text-gray-500 hover:text-gray-300 p-1"
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>

                        {/* Vehicle */}
                        {item.vehicle && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                            <Car size={11} />
                            <span className="truncate">{item.vehicle.name}</span>
                          </div>
                        )}

                        {/* Budget */}
                        {item.budgetAmount && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            <DollarSign size={11} className="text-green-400" />
                            <span className="text-green-400 font-medium">
                              {formatCurrency(item.budgetAmount, item.budgetCurrency)}
                            </span>
                          </div>
                        )}

                        {/* Origin + Date */}
                        <div className="flex items-center justify-between mt-2">
                          {item.origin && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                              {ORIGINS[item.origin] || item.origin}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-600">
                            {new Date(item.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                          </span>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                            {item.client.phone && (
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Phone size={10} />
                                <span>{item.client.phone}</span>
                              </div>
                            )}
                            {item.client.email && (
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Mail size={10} />
                                <span className="truncate">{item.client.email}</span>
                              </div>
                            )}
                            {item.notes && (
                              <p className="text-xs text-gray-500 italic">&ldquo;{item.notes}&rdquo;</p>
                            )}
                            {item.searchInterest && (
                              <p className="text-[10px] text-gray-500">Busca: {item.searchInterest}</p>
                            )}

                            {/* Move Actions */}
                            <div className="flex gap-1.5 pt-1">
                              {prevStatus && (
                                <button
                                  onClick={() => moveCard(item.id, prevStatus)}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                                >
                                  <ArrowLeft size={10} />
                                  {COLUMNS.find((c) => c.id === prevStatus)?.title}
                                </button>
                              )}
                              {nextStatus && (
                                <button
                                  onClick={() => moveCard(item.id, nextStatus)}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded text-white transition-colors"
                                  style={{ backgroundColor: COLUMNS.find((c) => c.id === nextStatus)?.color + "60" }}
                                >
                                  {COLUMNS.find((c) => c.id === nextStatus)?.title}
                                  <ArrowRight size={10} />
                                </button>
                              )}
                              {item.status !== "NO_INTERESADO" && item.status !== "VENTA_CERRADA" && (
                                <button
                                  onClick={() => moveCard(item.id, "NO_INTERESADO")}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors ml-auto"
                                >
                                  ❌ Descartar
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
