"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";

interface DealershipAdmin {
  id: string;
  name: string;
  email: string | null;
  plan: string;
  phone: string | null;
  province: string | null;
  city: string | null;
  createdAt: string;
  users: { id: string; email: string; name: string | null; role: string }[];
  _count: { planRequests: number };
}

const PLAN_OPTIONS = Object.values(PLANS).map((p) => ({
  value: p.id,
  label: p.name,
}));

export default function AdminDealershipsPage() {
  const [dealerships, setDealerships] = useState<DealershipAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDealerships = () => {
    fetch("/api/admin/dealerships")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDealerships(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDealerships(); }, []);

  const handlePlanChange = async (dealershipId: string, plan: string) => {
    await fetch("/api/admin/dealerships", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealershipId, plan }),
    });
    loadDealerships();
  };

  const planColor = (plan: string) => {
    switch (plan) {
      case "V12_PREMIUM": return "danger" as const;
      case "V12_PRO": return "warning" as const;
      case "V12": return "info" as const;
      default: return "default" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 size={24} /> Agencias
        </h1>
        <p className="text-sm text-gray-400">{dealerships.length} agencias</p>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dealerships.map((d) => (
            <Card key={d.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{d.name}</h3>
                  <p className="text-sm text-gray-400">{d.email || "Sin email"}</p>
                  {d.province && (
                    <p className="text-xs text-gray-500">{d.city}, {d.province}</p>
                  )}
                </div>
                <Badge variant={planColor(d.plan)}>
                  {PLANS[d.plan as PlanId]?.name || d.plan}
                </Badge>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Usuarios ({d.users.length})</p>
                <div className="space-y-1">
                  {d.users.map((u) => (
                    <div key={u.id} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-300">{u.email}</span>
                      <Badge variant={u.role === "ADMIN" ? "info" : "default"} className="text-xs">
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                  {d.users.length === 0 && (
                    <p className="text-xs text-gray-600">Sin usuarios asignados</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <span className="text-xs text-gray-500">
                  Creada: {new Date(d.createdAt).toLocaleDateString("es-AR")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Cambiar plan:</span>
                  <Select
                    value={d.plan}
                    onChange={(e) => handlePlanChange(d.id, e.target.value)}
                    options={PLAN_OPTIONS}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
