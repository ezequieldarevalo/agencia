"use client";

import { usePlan } from "@/components/plan-provider";
import { Card } from "@/components/ui/card";
import { Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PlanGate({ children }: { children: React.ReactNode }) {
  const { plan, loading } = usePlan();
  const pathname = usePathname();

  if (loading) return <>{children}</>;

  const isAllowed = plan.routes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  if (!isAllowed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-gray-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Función no disponible</h2>
          <p className="text-gray-400 text-sm mb-6">
            Esta funcionalidad no está incluida en tu <strong>{plan.name}</strong>.
            Actualizá tu plan para acceder a este módulo.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Ver planes <ArrowRight size={16} />
          </Link>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
