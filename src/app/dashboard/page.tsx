"use client";

import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, DollarSign, Car, AlertCircle, Clock, CheckCircle2, ArrowRight, AlertTriangle, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface DashboardData {
  monthlyOps: { month: string; compras: number; ventas: number }[];
  profitability: { month: string; actual: number; anterior: number }[];
  details: { vehicle: string; cost: number; income: number; profit: number }[];
  stats: { totalOps: number; totalProfit: number; vehicles: number; todayIncome: number };
}

interface TodayOperation {
  id: string;
  type: string;
  vehicleName: string;
  clientName: string;
  progress: number;
  nextStep: string | null;
  alertCount: number;
  topAlert: string | null;
  topAlertType: string | null;
}

interface TodayData {
  summary: { enCurso: number; bloqueadas: number; urgentes: number; porCerrar: number; pagosPendientes: number };
  global: { totalToCollect: number; opsAtRisk: number; vehiclesNotPublished: number; nearCompletion: number };
  sections: {
    urgent: TodayOperation[];
    blocked: TodayOperation[];
    nearCompletion: TodayOperation[];
    pendingActions: TodayOperation[];
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [showSales, setShowSales] = useState(true);
  const [showUSD, setShowUSD] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [today, setToday] = useState<TodayData | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard?year=${year}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {
        // Set demo data if API fails
        setData({
          monthlyOps: months.map((m) => ({
            month: m,
            compras: Math.floor(Math.random() * 10),
            ventas: Math.floor(Math.random() * 8),
          })),
          profitability: months.map((m) => ({
            month: m,
            actual: Math.floor(Math.random() * 5000000),
            anterior: Math.floor(Math.random() * 4000000),
          })),
          details: [
            { vehicle: "Toyota Corolla 2022", cost: 8500000, income: 9800000, profit: 1300000 },
            { vehicle: "VW Gol Trend 2019", cost: 4200000, income: 5100000, profit: 900000 },
            { vehicle: "Ford Ranger 2021", cost: 15000000, income: 17500000, profit: 2500000 },
          ],
          stats: { totalOps: 24, totalProfit: 4700000, vehicles: 12, todayIncome: 1500000 },
        });
      });
  }, [year]);

  useEffect(() => {
    fetch("/api/operations/today")
      .then((r) => r.json())
      .then(setToday)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Agency Status + Today's Operations */}
      {today && (
        <>
          {/* Global Status Bar */}
          {(today.global.totalToCollect > 0 || today.global.opsAtRisk > 0 || today.global.vehiclesNotPublished > 0 || today.global.nearCompletion > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} className="text-blue-400" />
                  <p className="text-[11px] text-blue-400 font-medium uppercase tracking-wide">Por cobrar</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(today.global.totalToCollect)}</p>
              </div>
              <button onClick={() => router.push("/dashboard/operations")} className="px-4 py-3 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 text-left hover:border-red-500/40 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className="text-red-400" />
                  <p className="text-[11px] text-red-400 font-medium uppercase tracking-wide">En riesgo</p>
                </div>
                <p className="text-lg font-bold text-white">{today.global.opsAtRisk} <span className="text-xs font-normal text-gray-400">operaciones</span></p>
              </button>
              <button onClick={() => router.push("/dashboard/operations")} className="px-4 py-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 text-left hover:border-green-500/40 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={14} className="text-green-400" />
                  <p className="text-[11px] text-green-400 font-medium uppercase tracking-wide">Por cerrar</p>
                </div>
                <p className="text-lg font-bold text-white">{today.global.nearCompletion} <span className="text-xs font-normal text-gray-400">operaciones</span></p>
              </button>
              <button onClick={() => router.push("/dashboard/vehicles")} className="px-4 py-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 text-left hover:border-purple-500/40 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Car size={14} className="text-purple-400" />
                  <p className="text-[11px] text-purple-400 font-medium uppercase tracking-wide">Sin publicar</p>
                </div>
                <p className="text-lg font-bold text-white">{today.global.vehiclesNotPublished} <span className="text-xs font-normal text-gray-400">vehículos</span></p>
              </button>
            </div>
          )}

          {/* Today's Action Items */}
          {(today.summary.urgentes > 0 || today.summary.porCerrar > 0 || today.sections.urgent.length > 0 || today.sections.nearCompletion.length > 0) && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Clock size={16} className="text-blue-400" /> Hoy
                </h2>
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/operations")}>
                  Ver operaciones <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs text-blue-400">En Curso</p>
                  <p className="text-lg font-bold text-blue-300">{today.summary.enCurso}</p>
                </div>
                {today.summary.urgentes > 0 && (
                  <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-xs text-red-400">Urgentes</p>
                    <p className="text-lg font-bold text-red-300">{today.summary.urgentes}</p>
                  </div>
                )}
                {today.summary.bloqueadas > 0 && (
                  <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs text-yellow-400">Bloqueadas</p>
                    <p className="text-lg font-bold text-yellow-300">{today.summary.bloqueadas}</p>
                  </div>
                )}
                {today.summary.porCerrar > 0 && (
                  <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-xs text-green-400">Por Cerrar</p>
                    <p className="text-lg font-bold text-green-300">{today.summary.porCerrar}</p>
                  </div>
                )}
              </div>
              {/* Urgent + near-completion items */}
              {(today.sections.urgent.length > 0 || today.sections.nearCompletion.length > 0) && (
                <div className="space-y-1.5">
                  {today.sections.urgent.slice(0, 3).map((op) => (
                    <button key={op.id} onClick={() => router.push("/dashboard/operations")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors text-left">
                      <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300 truncate flex-1">
                        {op.type === "COMPRA" ? "📥" : op.type === "VENTA" ? "📤" : "🤝"} {op.vehicleName}
                        {op.clientName && ` · ${op.clientName}`}
                      </span>
                      <Badge variant="danger">Urgente</Badge>
                    </button>
                  ))}
                  {today.sections.nearCompletion.slice(0, 3).map((op) => (
                    <button key={op.id} onClick={() => router.push("/dashboard/operations")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors text-left">
                      <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300 truncate flex-1">
                        {op.type === "COMPRA" ? "📥" : op.type === "VENTA" ? "📤" : "🤝"} {op.vehicleName}
                      </span>
                      <span className="text-xs text-green-400 font-medium">{op.progress}%</span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Operaciones del mes"
          value={data.stats.totalOps.toString()}
          icon={<BarChart3 size={24} />}
        />
        <StatCard
          title="Rentabilidad del mes"
          value={formatCurrency(data.stats.totalProfit)}
          icon={<TrendingUp size={24} />}
        />
        <StatCard
          title="Vehículos en stock"
          value={data.stats.vehicles.toString()}
          icon={<Car size={24} />}
        />
        <StatCard
          title="Ingresos hoy"
          value={formatCurrency(data.stats.todayIncome)}
          icon={<DollarSign size={24} />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Operaciones Mensuales */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Operaciones Mensuales</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={showSales ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowSales(!showSales)}
              >
                Ventas
              </Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.monthlyOps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="compras" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Compras" />
              {showSales && (
                <Bar dataKey="ventas" fill="#10B981" radius={[4, 4, 0, 0]} name="Ventas" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Rentabilidad Mensual */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Rentabilidad Mensual</h2>
            <Button
              variant={showUSD ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowUSD(!showUSD)}
            >
              USD
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.profitability}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value) => formatCurrency(Number(value ?? 0), showUSD ? "USD" : "ARS")}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Año actual"
                dot={{ fill: "#3B82F6" }}
              />
              <Line
                type="monotone"
                dataKey="anterior"
                stroke="#6B7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Año anterior"
                dot={{ fill: "#6B7280" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Detalle del mes</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Vehículo</th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Costo</th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Ingreso</th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Utilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.details.map((d, i) => (
                <tr key={i} className="hover:bg-gray-800/50">
                  <td className="px-3 sm:px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{d.vehicle}</td>
                  <td className="px-3 sm:px-4 py-3 text-sm text-gray-300 text-right whitespace-nowrap">{formatCurrency(d.cost)}</td>
                  <td className="px-3 sm:px-4 py-3 text-sm text-gray-300 text-right whitespace-nowrap">{formatCurrency(d.income)}</td>
                  <td className="px-3 sm:px-4 py-3 text-sm text-green-400 text-right font-medium whitespace-nowrap">
                    {formatCurrency(d.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
