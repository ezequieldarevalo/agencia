import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OPERATION_STEPS, resolveSteps } from "@/lib/operation-steps";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  const where: Record<string, string> = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const operations = await prisma.operation.findMany({
    where,
    include: {
      vehicle: { select: { id: true, name: true, brand: true, model: true, year: true, domain: true, status: true, priceARS: true, priceUSD: true, currency: true } },
      client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, dni: true } },
      supplier: { select: { id: true, firstName: true, lastName: true, phone: true } },
      steps: { orderBy: { order: "asc" }, include: { checkItems: { orderBy: { order: "asc" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(operations);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { type, vehicleId, clientId, supplierId, totalAmount, currency, notes,
    includesTransfer, hasDeposit, depositAmount, isFinanced, paymentMethod } = body;

  if (!type || !OPERATION_STEPS[type]) {
    return NextResponse.json({ error: "Tipo de operación inválido" }, { status: 400 });
  }

  // Resolve steps based on context flags
  const context = { includesTransfer: !!includesTransfer, hasDeposit: !!hasDeposit, isFinanced: !!isFinanced, paymentMethod };
  const steps = resolveSteps(type, context);

  // Load custom step config from dealership (override default checks)
  const dealership = await prisma.dealership.findFirst({ select: { stepConfig: true } });
  const customConfig = (dealership?.stepConfig as Record<string, Record<string, string[]>> | null) || {};
  const typeConfig = customConfig[type] || {};

  const operation = await prisma.operation.create({
    data: {
      type,
      status: "EN_CURSO",
      vehicleId: vehicleId || null,
      clientId: clientId || null,
      supplierId: supplierId || null,
      totalAmount: totalAmount ? parseFloat(totalAmount) : null,
      currency: currency || "ARS",
      notes: notes || null,
      includesTransfer: !!includesTransfer,
      hasDeposit: !!hasDeposit,
      depositAmount: depositAmount ? parseFloat(depositAmount) : null,
      isFinanced: !!isFinanced,
      paymentMethod: paymentMethod || null,
      steps: {
        create: steps.map((s) => {
          // Use custom checks if configured, else default
          const checks = typeConfig[s.title] || s.defaultChecks || [];
          return {
            title: s.title,
            description: s.description,
            order: s.order,
            status: "PENDIENTE",
            optional: s.optional || false,
            category: s.category,
            condition: s.condition || null,
            checkItems: checks.length ? {
              create: checks.map((label: string, idx: number) => ({ label, order: idx })),
            } : undefined,
          };
        }),
      },
    },
    include: {
      vehicle: { select: { id: true, name: true, brand: true, model: true, year: true, domain: true } },
      client: { select: { id: true, firstName: true, lastName: true } },
      supplier: { select: { id: true, firstName: true, lastName: true } },
      steps: { orderBy: { order: "asc" }, include: { checkItems: { orderBy: { order: "asc" } } } },
    },
  });

  return NextResponse.json(operation, { status: 201 });
}
