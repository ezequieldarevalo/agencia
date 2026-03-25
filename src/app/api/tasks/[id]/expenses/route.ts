import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const expense = await prisma.taskExpense.create({
    data: {
      taskId: params.id,
      concept: body.concept,
      amount: body.amount || 0,
      currency: body.currency || "ARS",
      supplierId: body.supplierId || null,
      cashAccountId: body.cashAccountId || null,
    },
  });

  // Create cash movement if account selected
  if (body.cashAccountId && body.amount > 0) {
    const task = await prisma.intakeTask.findUnique({
      where: { id: params.id },
      include: { intake: { select: { vehicleId: true } } },
    });

    await prisma.cashMovement.create({
      data: {
        type: "EGRESO",
        concept: `Tarea: ${body.concept}`,
        category: "TAREA",
        amountARS: body.currency === "ARS" ? body.amount : 0,
        amountUSD: body.currency === "USD" ? body.amount : 0,
        currency: body.currency || "ARS",
        cashAccountId: body.cashAccountId,
        vehicleId: task?.intake?.vehicleId || null,
      },
    });

    await prisma.cashAccount.update({
      where: { id: body.cashAccountId },
      data: { currentBalance: { decrement: body.amount } },
    });
  }

  return NextResponse.json(expense, { status: 201 });
}
