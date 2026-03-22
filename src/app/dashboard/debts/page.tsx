"use client";

import { useState, useEffect } from "react";
import { Card, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, AlertTriangle } from "lucide-react";

interface Debt {
  id: string;
  category: string;
  paymentMethod: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: string;
  nextPayment: string | null;
  concept: string | null;
  client: { firstName: string; lastName: string };
  vehicle?: { name: string } | null;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/debts").then((r) => r.json()).then(setDebts).catch(() => {});
  }, []);

  const pendingARS = debts
    .filter((d) => d.currency === "ARS" && d.status === "PENDIENTE")
    .reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);
  const pendingUSD = debts
    .filter((d) => d.currency === "USD" && d.status === "PENDIENTE")
    .reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);
  const overdue = debts.filter(
    (d) => d.nextPayment && new Date(d.nextPayment) < new Date() && d.status === "PENDIENTE"
  ).length;

  const filtered = debts.filter((d) => {
    const matchSearch = `${d.client.firstName} ${d.client.lastName} ${d.vehicle?.name || ""} ${d.concept || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    if (activeTab === "efectivo") return matchSearch && d.paymentMethod === "EFECTIVO";
    if (activeTab === "financiamiento") return matchSearch && d.paymentMethod === "FINANCIAMIENTO";
    return matchSearch;
  });

  const tabs = [
    { id: "all", label: "Todo", count: debts.length },
    { id: "efectivo", label: "EFECTIVO", count: debts.filter((d) => d.paymentMethod === "EFECTIVO").length },
    { id: "financiamiento", label: "FINANCIAMIENTO", count: debts.filter((d) => d.paymentMethod === "FINANCIAMIENTO").length },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, "success" | "warning" | "danger"> = {
      PENDIENTE: "warning",
      PAGADA: "success",
      VENCIDA: "danger",
    };
    return <Badge variant={map[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Módulo de Deudas</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Pendiente ARS" value={formatCurrency(pendingARS)} icon={<DollarSign size={24} />} />
        <StatCard title="Pendiente USD" value={formatCurrency(pendingUSD, "USD")} icon={<DollarSign size={24} />} />
        <StatCard title="Vencidas" value={overdue.toString()} icon={<AlertTriangle size={24} className="text-red-500" />} />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Categorías:</span>
          <Badge variant="info">VENTA</Badge>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <Card className="p-0">
        <div className="p-4 border-b border-gray-800">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar deudas..."
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Próximo pago</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Vehículo / Concepto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Categoría</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Pagado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Restante</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">No hay deudas registradas</td></tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm text-gray-300">{d.nextPayment ? formatDate(d.nextPayment) : "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{d.client.firstName} {d.client.lastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{d.vehicle?.name || d.concept || "-"}</td>
                    <td className="px-4 py-3 text-sm"><Badge variant="info">{d.category}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-300 text-right">{formatCurrency(d.totalAmount, d.currency)}</td>
                    <td className="px-4 py-3 text-sm text-green-400 text-right">{formatCurrency(d.paidAmount, d.currency)}</td>
                    <td className="px-4 py-3 text-sm text-yellow-400 text-right font-medium">{formatCurrency(d.totalAmount - d.paidAmount, d.currency)}</td>
                    <td className="px-4 py-3 text-sm">{statusBadge(d.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
