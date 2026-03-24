import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOperationAlerts } from "@/lib/operation-suggestions";

export const dynamic = "force-dynamic";

export async function GET() {
  const operations = await prisma.operation.findMany({
    where: { status: { in: ["EN_CURSO", "BLOQUEADA"] } },
    include: {
      vehicle: { select: { id: true, name: true } },
      client: { select: { id: true, firstName: true, lastName: true } },
      supplier: { select: { id: true, firstName: true, lastName: true } },
      steps: { orderBy: { order: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Categorize operations
  interface Item {
    id: string;
    type: string;
    status: string;
    vehicleName: string;
    clientName: string;
    progress: number;
    nextStep: string | null;
    alertCount: number;
    topAlert: string | null;
    topAlertType: string | null;
    totalAmount: number | null;
    paidAmount: number;
  }

  const pendingActions: Item[] = [];
  const blocked: Item[] = [];
  const urgent: Item[] = [];
  const nearCompletion: Item[] = [];

  for (const op of operations) {
    const total = op.steps.length;
    const done = op.steps.filter((s) => s.status === "COMPLETADO" || s.status === "OMITIDO").length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const nextStep = op.steps.find((s) => s.status === "PENDIENTE" && !s.optional);
    const alerts = getOperationAlerts(op);

    const item: Item = {
      id: op.id,
      type: op.type,
      status: op.status,
      vehicleName: op.vehicle?.name || "Sin vehículo",
      clientName: op.client ? `${op.client.firstName} ${op.client.lastName}` : op.supplier ? `${op.supplier.firstName} ${op.supplier.lastName}` : "",
      progress: pct,
      nextStep: nextStep?.title || null,
      alertCount: alerts.length,
      topAlert: alerts[0]?.message || null,
      topAlertType: alerts[0]?.type || null,
      totalAmount: op.totalAmount,
      paidAmount: op.paidAmount,
    };

    if (op.status === "BLOQUEADA") {
      blocked.push(item);
    } else if (alerts.some((a) => a.type === "error")) {
      urgent.push(item);
    } else if (pct >= 75) {
      nearCompletion.push(item);
    } else {
      pendingActions.push(item);
    }
  }

  // Summary counts
  const totalEnCurso = operations.filter((o) => o.status === "EN_CURSO").length;
  const totalBloqueadas = blocked.length;
  const totalUrgent = urgent.length;
  const totalNearCompletion = nearCompletion.length;
  const totalPendingPayments = operations.filter((o) =>
    o.totalAmount && o.totalAmount > 0 && o.paidAmount < o.totalAmount &&
    o.steps.some((s) => (s.title === "Registrar cobro" || s.title === "Registrar pago") && s.status === "PENDIENTE")
  ).length;

  // === Global agency metrics ===
  const totalToCollect = operations
    .filter((o) => o.totalAmount && o.totalAmount > 0 && o.paidAmount < o.totalAmount)
    .reduce((sum, o) => sum + ((o.totalAmount || 0) - o.paidAmount), 0);

  const vehiclesNotPublished = await prisma.vehicle.count({
    where: { status: "DISPONIBLE" },
  });

  const opsAtRisk = urgent.length + blocked.length;

  return NextResponse.json({
    summary: {
      enCurso: totalEnCurso,
      bloqueadas: totalBloqueadas,
      urgentes: totalUrgent,
      porCerrar: totalNearCompletion,
      pagosPendientes: totalPendingPayments,
    },
    global: {
      totalToCollect,
      opsAtRisk,
      vehiclesNotPublished,
      nearCompletion: totalNearCompletion,
    },
    sections: {
      urgent,
      blocked,
      nearCompletion,
      pendingActions: pendingActions.slice(0, 10),
    },
  });
}
