import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSteps } from "@/lib/operation-steps";
import { getOperationAlerts } from "@/lib/operation-suggestions";
import { getFinancialStatus } from "@/lib/operation-actions";

/** Standard includes + enrichment for consistent operation responses */
const FULL_INCLUDE = {
  vehicle: {
    select: {
      id: true, name: true, brand: true, model: true, year: true, version: true,
      domain: true, status: true, priceARS: true, priceUSD: true, currency: true,
      kilometers: true, fuel: true, color: true, transmission: true,
      photos: { select: { url: true }, take: 1 },
    },
  },
  client: {
    select: { id: true, firstName: true, lastName: true, phone: true, email: true, dni: true, cuit: true, province: true, city: true, street: true, streetNumber: true },
  },
  supplier: {
    select: { id: true, firstName: true, lastName: true, phone: true, email: true, dni: true, cuit: true },
  },
  steps: { orderBy: { order: "asc" } as const, include: { checkItems: { orderBy: { order: "asc" } as const } } },
  payments: {
    select: { id: true, type: true, concept: true, amountARS: true, amountUSD: true, currency: true, date: true },
    orderBy: { date: "desc" } as const,
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichOperation(operation: any) {
  const alerts = getOperationAlerts(operation as Parameters<typeof getOperationAlerts>[0]);
  const financial = getFinancialStatus(operation.totalAmount as number | null, (operation.paidAmount as number) || 0);
  return { ...operation, alerts, financial };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const operation = await prisma.operation.findUnique({
    where: { id: params.id },
    include: FULL_INCLUDE,
  });

  if (!operation) {
    return NextResponse.json({ error: "Operación no encontrada" }, { status: 404 });
  }

  return NextResponse.json(enrichOperation(operation));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.status !== undefined) data.status = body.status;
  if (body.vehicleId !== undefined) data.vehicleId = body.vehicleId || null;
  if (body.clientId !== undefined) data.clientId = body.clientId || null;
  if (body.supplierId !== undefined) data.supplierId = body.supplierId || null;
  if (body.totalAmount !== undefined) data.totalAmount = body.totalAmount ? parseFloat(body.totalAmount) : null;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.includesTransfer !== undefined) data.includesTransfer = !!body.includesTransfer;
  if (body.hasDeposit !== undefined) data.hasDeposit = !!body.hasDeposit;
  if (body.depositAmount !== undefined) data.depositAmount = body.depositAmount ? parseFloat(body.depositAmount) : null;
  if (body.isFinanced !== undefined) data.isFinanced = !!body.isFinanced;
  if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod || null;

  // If completing or cancelling, handle vehicle status
  if (body.status === "COMPLETADA") {
    const op = await prisma.operation.findUnique({ where: { id: params.id } });
    if ((op?.type === "VENTA" || op?.type === "COMPRA_VENTA") && op.vehicleId && op.clientId) {
      await prisma.vehicle.update({
        where: { id: op.vehicleId },
        data: { status: "VENDIDO", buyerId: op.clientId },
      });
    }
  }

  const operation = await prisma.operation.update({
    where: { id: params.id },
    data,
    include: FULL_INCLUDE,
  });

  // If context flags changed, add missing conditional steps
  const contextChanged = body.includesTransfer !== undefined || body.hasDeposit !== undefined || body.isFinanced !== undefined;
  if (contextChanged && operation.status === "EN_CURSO") {
    const context = {
      includesTransfer: operation.includesTransfer,
      hasDeposit: operation.hasDeposit,
      isFinanced: operation.isFinanced,
      paymentMethod: operation.paymentMethod || undefined,
    };
    const expected = resolveSteps(operation.type, context);
    const existingTitles = new Set(operation.steps.map((s: { title: string }) => s.title));
    const maxOrder = Math.max(...operation.steps.map((s: { order: number }) => s.order), 0);

    // Add new conditional steps that don't exist yet
    let nextOrder = maxOrder + 1;
    for (const step of expected) {
      if (!existingTitles.has(step.title)) {
        await prisma.operationStep.create({
          data: {
            operationId: params.id,
            title: step.title,
            description: step.description,
            order: nextOrder++,
            status: "PENDIENTE",
            optional: step.optional || false,
            category: step.category,
            condition: step.condition || null,
            checkItems: step.defaultChecks?.length ? {
              create: step.defaultChecks.map((label, idx) => ({ label, order: idx })),
            } : undefined,
          },
        });
      }
    }

    // Refetch with new steps
    const updated = await prisma.operation.findUnique({
      where: { id: params.id },
      include: FULL_INCLUDE,
    });
    return NextResponse.json(updated ? enrichOperation(updated) : operation);
  }

  return NextResponse.json(enrichOperation(operation));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.operation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
