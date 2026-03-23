import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { PlanId } from "@/lib/plans";

const PLAN_ORDER: PlanId[] = ["V6", "V12", "V12_PRO", "V12_PREMIUM"];

// Map API route prefixes to minimum plan required
const ROUTE_PLAN_MAP: Record<string, PlanId> = {
  "/api/clients": "V12",
  "/api/suppliers": "V12",
  "/api/reports": "V12",
  "/api/calendar": "V12",
  "/api/cash": "V12_PRO",
  "/api/interactions": "V12_PRO",
  "/api/debts": "V12_PREMIUM",
};

export async function checkPlanAccess(routePath: string): Promise<NextResponse | null> {
  // Find which plan is required for this route
  let requiredPlan: PlanId | null = null;
  for (const [prefix, plan] of Object.entries(ROUTE_PLAN_MAP)) {
    if (routePath.startsWith(prefix)) {
      requiredPlan = plan;
      break;
    }
  }

  // No restriction for this route
  if (!requiredPlan) return null;

  const dealership = await prisma.dealership.findFirst();
  const currentPlan = (dealership?.plan || "V12_PREMIUM") as PlanId;

  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const requiredIdx = PLAN_ORDER.indexOf(requiredPlan);

  if (currentIdx === -1 || currentIdx >= requiredIdx) return null;

  return NextResponse.json(
    { error: "Tu plan actual no incluye esta funcionalidad. Actualizá tu plan para acceder." },
    { status: 403 }
  );
}
