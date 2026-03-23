"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users, Building2, FileText, AlertCircle } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, dealerships: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/dealerships").then((r) => r.json()),
      fetch("/api/admin/plan-requests").then((r) => r.json()),
    ])
      .then(([users, dealerships, requests]) => {
        setStats({
          users: Array.isArray(users) ? users.length : 0,
          dealerships: Array.isArray(dealerships) ? dealerships.length : 0,
          pendingRequests: Array.isArray(requests)
            ? requests.filter((r: { status: string }) => r.status === "PENDING").length
            : 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{loading ? "..." : stats.users}</p>
              <p className="text-sm text-gray-400">Usuarios totales</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
              <Building2 size={24} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{loading ? "..." : stats.dealerships}</p>
              <p className="text-sm text-gray-400">Agencias</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
              {stats.pendingRequests > 0 ? (
                <AlertCircle size={24} className="text-yellow-400" />
              ) : (
                <FileText size={24} className="text-yellow-400" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{loading ? "..." : stats.pendingRequests}</p>
              <p className="text-sm text-gray-400">Solicitudes pendientes</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
