import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string; stepId: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "COMPLETADO") {
      data.completedAt = new Date();
    } else {
      data.completedAt = null;
    }
  }

  const step = await prisma.operationStep.update({
    where: { id: params.stepId },
    data,
  });

  // Smart auto-completion: check if all required (non-optional) steps are done
  const [allSteps, operation] = await Promise.all([
    prisma.operationStep.findMany({ where: { operationId: params.id } }),
    prisma.operation.findUnique({ where: { id: params.id }, select: { type: true, vehicleId: true, clientId: true, supplierId: true, totalAmount: true } }),
  ]);

  const requiredSteps = allSteps.filter((s) => !s.optional);
  const allRequiredDone = requiredSteps.every((s) => s.status === "COMPLETADO" || s.status === "OMITIDO");
  const allStepsDone = allSteps.every((s) => s.status === "COMPLETADO" || s.status === "OMITIDO");

  if (allRequiredDone) {
    // Check for critical missing data before auto-completing
    const risks: string[] = [];
    if (operation?.type === "VENTA" || operation?.type === "COMPRA_VENTA") {
      if (!operation.clientId) risks.push("Sin comprador vinculado");
      if (!operation.vehicleId) risks.push("Sin vehículo vinculado");
      if (!operation.totalAmount) risks.push("Sin monto definido");
    }
    if (operation?.type === "COMPRA" || operation?.type === "COMPRA_VENTA") {
      if (!operation.vehicleId) risks.push("Sin vehículo vinculado");
      if (!operation.supplierId) risks.push("Sin proveedor vinculado");
    }

    if (allStepsDone && risks.length === 0) {
      // All steps done + no risks → auto-complete
      await prisma.operation.update({
        where: { id: params.id },
        data: { status: "COMPLETADA" },
      });
      // Handle vehicle status on VENTA completion
      if ((operation?.type === "VENTA" || operation?.type === "COMPRA_VENTA") && operation.vehicleId && operation.clientId) {
        await prisma.vehicle.update({
          where: { id: operation.vehicleId },
          data: { status: "VENDIDO", buyerId: operation.clientId },
        });
      }
    } else if (allRequiredDone && !allStepsDone) {
      // Required steps done but optional remain — keep EN_CURSO, client can finalize
    }
  }

  // If a step was reverted and the operation was already completed, reopen it
  if (body.status === "PENDIENTE" || body.status === "EN_CURSO") {
    const currentOp = await prisma.operation.findUnique({ where: { id: params.id }, select: { status: true } });
    if (currentOp?.status === "COMPLETADA") {
      await prisma.operation.update({
        where: { id: params.id },
        data: { status: "EN_CURSO" },
      });
    }
  }

  return NextResponse.json(step);
}
