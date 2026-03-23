import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPlanAccess } from "@/lib/plan-check";

export async function GET() {
  const blocked = await checkPlanAccess("/api/debts");
  if (blocked) return blocked;
  const debts = await prisma.debt.findMany({
    include: {
      client: { select: { firstName: true, lastName: true } },
      vehicle: { select: { name: true } },
    },
    orderBy: { nextPayment: "asc" },
  });
  return NextResponse.json(debts);
}

export async function POST(req: Request) {
  const blocked = await checkPlanAccess("/api/debts");
  if (blocked) return blocked;
  const body = await req.json();
  const debt = await prisma.debt.create({
    data: {
      category: body.category,
      paymentMethod: body.paymentMethod,
      totalAmount: body.totalAmount,
      paidAmount: body.paidAmount || 0,
      currency: body.currency,
      status: body.status || "PENDIENTE",
      nextPayment: body.nextPayment ? new Date(body.nextPayment) : null,
      clientId: body.clientId,
      vehicleId: body.vehicleId || null,
      concept: body.concept || null,
    },
  });
  return NextResponse.json(debt, { status: 201 });
}
