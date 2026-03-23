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

// GET /api/admin/plan-requests - List all plan change requests
export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const requests = await prisma.planChangeRequest.findMany({
    include: {
      dealership: { select: { id: true, name: true, plan: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

// PUT /api/admin/plan-requests - Approve or reject a plan request
export async function PUT(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const session = await getServerSession(authOptions);
  const { requestId, action } = await req.json();

  if (!requestId || !["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "requestId y action (APPROVED/REJECTED) requeridos" }, { status: 400 });
  }

  const request = await prisma.planChangeRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }

  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 400 });
  }

  // Update request status
  const updated = await prisma.planChangeRequest.update({
    where: { id: requestId },
    data: {
      status: action,
      reviewedBy: (session?.user as { id: string })?.id,
      reviewedAt: new Date(),
    },
  });

  // If approved, update the dealership plan
  if (action === "APPROVED") {
    await prisma.dealership.update({
      where: { id: request.dealershipId },
      data: { plan: request.requestedPlan },
    });
  }

  return NextResponse.json(updated);
}
