import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const role = (session.user as { role: string }).role;
  if (role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }
  return null;
}

// GET /api/admin/dealerships - List all dealerships
export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const dealerships = await prisma.dealership.findMany({
    include: {
      users: { select: { id: true, email: true, name: true, role: true } },
      _count: { select: { planRequests: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(dealerships);
}

// PUT /api/admin/dealerships - Update dealership plan
export async function PUT(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const { dealershipId, plan } = await req.json();
  if (!dealershipId || !plan) {
    return NextResponse.json({ error: "dealershipId y plan requeridos" }, { status: 400 });
  }

  const validPlans = ["V6", "V12", "V12_PRO", "V12_PREMIUM"];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  const dealership = await prisma.dealership.update({
    where: { id: dealershipId },
    data: { plan },
  });

  return NextResponse.json(dealership);
}
