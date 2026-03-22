"use client";

import { useState, useEffect } from "react";
import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Car,
  DollarSign,
  Users,
  AlertTriangle,
  Package,
  Clock,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface ReportData {
  inventory: {
    total: number;
    disponibles: number;
    vendidos: number;
    reservados: number;
    enProceso: number;
    totalInvestment: number;
    avgDaysInStock: number;
  };
  financial: {
    totalRevenue: number;
    totalSales: number;
    ingresos: number;
    egresos: number;
    totalDebt: number;
    overdueDebts: number;
    avgProfit: number;
  };
  monthlySales: { month: string; ventas: number; ingresos: number; egresos: number }[];
  topBrands: { name: string; count: number }[];
  typeDistribution: { name: string; count: number }[];
  topProfitable: { name: string; domain: string | null; profit: number; margin: string }[];
  clients: number;
  leads: number;
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const TYPE_LABELS: Record<string, string> = {
  AUTO: "Auto",
  CAMIONETA: "Camioneta",
  UTILITARIO: "Utilitario",
  CAMION: "Camión",
  MOTO: "Moto",
  OTRO: "Otro",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Mes", "Ventas", "Ingresos", "Egresos"],
      ...data.monthlySales.map((m) => [m.month, m.ventas, m.ingresos, m.egresos]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Error al cargar reportes</p>;

  const { inventory, financial, monthlySales, topBrands, typeDistribution, topProfitable } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Reportes</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            {[
              { value: "month", label: "Este Mes" },
              { value: "year", label: "Este Año" },
              { value: "all", label: "Todo" },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-md text-sm ${
                  period === p.value ? "bg-gray-700 text-white" : "text-gray-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={exportCSV}>
            <Download size={16} className="mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Ganancia Neta"
          value={formatCurrency(financial.totalRevenue)}
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          title="Ventas Totales"
          value={formatCurrency(financial.totalSales)}
          icon={<DollarSign size={20} />}
        />
        <StatCard
          title="Inventario Activo"
          value={inventory.disponibles.toString()}
          icon={<Car size={20} />}
          trend={`de ${inventory.total} vehículos`}
        />
        <StatCard
          title="Inversión en Stock"
          value={formatCurrency(inventory.totalInvestment)}
          icon={<Package size={20} />}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Ingresos de Caja"
          value={formatCurrency(financial.ingresos)}
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          title="Egresos de Caja"
          value={formatCurrency(financial.egresos)}
          icon={<TrendingDown size={20} />}
        />
        <StatCard
          title="Deuda Pendiente"
          value={formatCurrency(financial.totalDebt)}
          icon={<AlertTriangle size={20} />}
          trend={financial.overdueDebts > 0 ? `${financial.overdueDebts} vencidas` : undefined}
        />
        <StatCard
          title="Días Prom. en Stock"
          value={`${inventory.avgDaysInStock} días`}
          icon={<Clock size={20} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue Chart */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Flujo de Caja - Últimos 12 Meses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => formatCurrency(Number(value ?? 0))}
              />
              <Legend />
              <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Sales Line Chart */}
        <Card>
          <h3 className="font-semibold mb-4">Vehículos Vendidos por Mes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
              />
              <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Type Distribution */}
        <Card>
          <h3 className="font-semibold mb-4">Distribución por Tipo</h3>
          {typeDistribution.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Sin datos</p>
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={250}>
                <PieChart>
                  <Pie
                    data={typeDistribution.map((t) => ({ ...t, name: TYPE_LABELS[t.name] || t.name }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {typeDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {typeDistribution.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-300">{TYPE_LABELS[t.name] || t.name}</span>
                    <span className="ml-auto text-gray-500">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Brands */}
        <Card>
          <h3 className="font-semibold mb-4">Marcas Más Frecuentes</h3>
          {topBrands.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {topBrands.map((b, i) => {
                const maxCount = topBrands[0].count;
                const pct = (b.count / maxCount) * 100;
                return (
                  <div key={b.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{b.name}</span>
                      <span className="text-gray-500">{b.count}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Top Profitable */}
        <Card>
          <h3 className="font-semibold mb-4">Vehículos Más Rentables</h3>
          {topProfitable.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Sin ventas en el período</p>
          ) : (
            <div className="space-y-3">
              {topProfitable.map((v, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                  <span className="text-lg font-bold text-gray-600 w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.name}</p>
                    {v.domain && <p className="text-xs text-gray-500">{v.domain}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-400">{formatCurrency(v.profit)}</p>
                    <p className="text-xs text-gray-500">Margen: {v.margin}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.clients}</p>
              <p className="text-sm text-gray-400">Clientes Registrados</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BarChart3 size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.leads}</p>
              <p className="text-sm text-gray-400">Interacciones del Período</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(financial.avgProfit)}</p>
              <p className="text-sm text-gray-400">Ganancia Promedio por Venta</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
