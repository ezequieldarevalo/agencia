"use client";

import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, DollarSign, Car } from "lucide-react";
import { useState, useEffect } from "react";
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

export default function DashboardPage() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [showSales, setShowSales] = useState(true);
  const [showUSD, setShowUSD] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

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
