import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/plan/upgrade - Get current plan and pending requests
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const dealership = await prisma.dealership.findFirst();
  if (!dealership) {
    return NextResponse.json({ error: "Dealership no encontrado" }, { status: 404 });
  }

  const pendingRequest = await prisma.planChangeRequest.findFirst({
    where: { dealershipId: dealership.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  const history = await prisma.planChangeRequest.findMany({
    where: { dealershipId: dealership.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    currentPlan: dealership.plan,
    pendingRequest,
    history,
  });
}

// POST /api/plan/upgrade - Request a plan change
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { requestedPlan } = await req.json();
  const validPlans = ["V6", "V12", "V12_PRO", "V12_PREMIUM"];
  if (!requestedPlan || !validPlans.includes(requestedPlan)) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  const dealership = await prisma.dealership.findFirst();
  if (!dealership) {
    return NextResponse.json({ error: "Dealership no encontrado" }, { status: 404 });
  }

  if (dealership.plan === requestedPlan) {
    return NextResponse.json({ error: "Ya tenés ese plan" }, { status: 400 });
  }

  // Check for pending request
  const existing = await prisma.planChangeRequest.findFirst({
    where: { dealershipId: dealership.id, status: "PENDING" },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ya tenés una solicitud de cambio de plan pendiente" },
      { status: 400 }
    );
  }

  const request = await prisma.planChangeRequest.create({
    data: {
      dealershipId: dealership.id,
      currentPlan: dealership.plan,
      requestedPlan,
      paymentAlias: "total.abundance.cp",
    },
  });

  return NextResponse.json(request);
}
