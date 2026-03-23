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

// GET /api/admin/users - List all users with dealership info
export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const users = await prisma.user.findMany({
    include: {
      dealership: { select: { id: true, name: true, plan: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// PUT /api/admin/users - Update user role
export async function PUT(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const { userId, role } = await req.json();
  if (!userId || !role) {
    return NextResponse.json({ error: "userId y role son requeridos" }, { status: 400 });
  }

  const validRoles = ["USER", "ADMIN", "SUPERADMIN"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json(user);
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  }

  // Don't allow deleting yourself
  const session = await getServerSession(authOptions);
  if ((session?.user as { id: string })?.id === userId) {
    return NextResponse.json({ error: "No podés eliminar tu propio usuario" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
