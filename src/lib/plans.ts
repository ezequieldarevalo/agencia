export type PlanId = "V6" | "V12" | "V12_PRO" | "V12_PREMIUM";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number;
  description: string;
  features: string[];
  // Which sidebar routes are available
  routes: string[];
}

// Hierarchy: V6 < V12 < V12_PRO < V12_PREMIUM
const PLAN_HIERARCHY: PlanId[] = ["V6", "V12", "V12_PRO", "V12_PREMIUM"];

export const PLANS: Record<PlanId, PlanDefinition> = {
  V6: {
    id: "V6",
    name: "Plan V6",
    price: 70000,
    description: "Ideal para arrancar",
    features: [
      "Inventario",
      "Catálogo web básico",
      "Conexión a Mercado Libre",
      "Conexión a Meta (Facebook e Instagram)",
      "Conexión a WhatsApp para sincronizar catálogo",
      "Usuarios ilimitados",
    ],
    routes: [
      "/dashboard",
      "/dashboard/vehicles",
      "/dashboard/employees",
      "/dashboard/integrations",
      "/dashboard/settings",
    ],
  },
  V12: {
    id: "V12",
    name: "Plan V12",
    price: 130000,
    description: "Para agencias en crecimiento",
    features: [
      "Todo lo del Plan V6",
      "Página web avanzada",
      "Registro de compra y proveedor",
      "Registro de gastos",
      "Registro de venta y cliente",
      "Tablero con registro de operaciones y rentabilidades mensuales",
    ],
    routes: [
      "/dashboard",
      "/dashboard/vehicles",
      "/dashboard/employees",
      "/dashboard/clients",
      "/dashboard/suppliers",
      "/dashboard/operations",
      "/dashboard/tasks",
      "/dashboard/documents",
      "/dashboard/calendar",
      "/dashboard/reports",
      "/dashboard/integrations",
      "/dashboard/settings",
    ],
  },
  V12_PRO: {
    id: "V12_PRO",
    name: "Plan V12 Pro",
    price: 160000,
    description: "Gestión completa con caja y prospectos",
    features: [
      "Todo lo del Plan V12",
      "Módulo de caja",
      "Módulo de seguimiento de consultas de prospectos",
    ],
    routes: [
      "/dashboard",
      "/dashboard/vehicles",
      "/dashboard/employees",
      "/dashboard/clients",
      "/dashboard/suppliers",
      "/dashboard/cash",
      "/dashboard/operations",
      "/dashboard/tasks",
      "/dashboard/documents",
      "/dashboard/leads",
      "/dashboard/pipeline",
      "/dashboard/calendar",
      "/dashboard/reports",
      "/dashboard/integrations",
      "/dashboard/settings",
    ],
  },
  V12_PREMIUM: {
    id: "V12_PREMIUM",
    name: "Plan V12 Premium",
    price: 180000,
    description: "El pack completo",
    features: [
      "Todo lo del Plan V12 Pro",
      "Módulo de deudas",
    ],
    routes: [
      "/dashboard",
      "/dashboard/vehicles",
      "/dashboard/employees",
      "/dashboard/clients",
      "/dashboard/suppliers",
      "/dashboard/cash",
      "/dashboard/debts",
      "/dashboard/operations",
      "/dashboard/tasks",
      "/dashboard/documents",
      "/dashboard/leads",
      "/dashboard/pipeline",
      "/dashboard/calendar",
      "/dashboard/reports",
      "/dashboard/integrations",
      "/dashboard/settings",
    ],
  },
};

export function getPlan(planId: string): PlanDefinition {
  return PLANS[planId as PlanId] || PLANS.V12_PREMIUM;
}

export function isRouteAllowed(planId: string, route: string): boolean {
  const plan = getPlan(planId);
  // Exact match or sub-route match (e.g. /dashboard/vehicles/[id])
  return plan.routes.some(
    (r) => route === r || route.startsWith(r + "/")
  );
}

export function isPlanAtLeast(currentPlan: string, requiredPlan: PlanId): boolean {
  const currentIdx = PLAN_HIERARCHY.indexOf(currentPlan as PlanId);
  const requiredIdx = PLAN_HIERARCHY.indexOf(requiredPlan);
  if (currentIdx === -1) return true; // unknown plan = full access
  return currentIdx >= requiredIdx;
}

export function formatPlanPrice(price: number): string {
  return "$" + price.toLocaleString("es-AR");
}
