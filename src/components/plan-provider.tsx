"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getPlan, type PlanDefinition, type PlanId } from "@/lib/plans";

interface PlanContextValue {
  plan: PlanDefinition;
  planId: PlanId;
  loading: boolean;
}

const PlanContext = createContext<PlanContextValue>({
  plan: getPlan("V12_PREMIUM"),
  planId: "V12_PREMIUM",
  loading: true,
});

export function usePlan() {
  return useContext(PlanContext);
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const [planId, setPlanId] = useState<PlanId>("V12_PREMIUM");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dealership")
      .then((r) => r.json())
      .then((data) => {
        if (data?.plan) {
          setPlanId(data.plan as PlanId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const plan = getPlan(planId);

  return (
    <PlanContext.Provider value={{ plan, planId, loading }}>
      {children}
    </PlanContext.Provider>
  );
}
