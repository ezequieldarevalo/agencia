import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPlanAccess } from "@/lib/plan-check";

export async function GET() {
  const blocked = await checkPlanAccess("/api/cash");
  if (blocked) return blocked;
  const movements = await prisma.cashMovement.findMany({
    include: { cashAccount: { select: { name: true } }, vehicle: { select: { name: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(movements);
}

export async function POST(req: Request) {
  const blocked = await checkPlanAccess("/api/cash");
  if (blocked) return blocked;
  const body = await req.json();
  const amount = body.currency === "USD" ? body.amountUSD : body.amountARS;

  const movement = await prisma.cashMovement.create({
    data: {
      date: new Date(body.date),
      type: body.type,
      concept: body.concept,
      category: body.category || null,
      amountARS: body.amountARS || 0,
      amountUSD: body.amountUSD || 0,
      exchangeRate: body.exchangeRate || null,
      currency: body.currency,
      cashAccountId: body.cashAccountId,
      vehicleId: body.vehicleId || null,
      operationId: body.operationId || null,
    },
  });

  // Update account balance
  const balanceChange = body.type === "INGRESO" ? amount : -amount;
  await prisma.cashAccount.update({
    where: { id: body.cashAccountId },
    data: { currentBalance: { increment: balanceChange } },
  });

  // If linked to operation AND is a payment (not expense), update paidAmount
  if (body.operationId && body.isPayment) {
    const paymentAmount = body.currency === "ARS" ? (body.amountARS || 0) : (body.amountUSD || 0);
    await prisma.operation.update({
      where: { id: body.operationId },
      data: { paidAmount: { increment: paymentAmount } },
    });
  }

  return NextResponse.json(movement, { status: 201 });
}
