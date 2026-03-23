import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPlanAccess } from "@/lib/plan-check";

export async function GET() {
  const blocked = await checkPlanAccess("/api/clients");
  if (blocked) return blocked;
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const blocked = await checkPlanAccess("/api/clients");
  if (blocked) return blocked;
  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      personType: body.personType,
      clientType: body.clientType,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      phone: body.phone || null,
      dni: body.dni || null,
      cuit: body.cuit || null,
      cuil: body.cuil || null,
      sex: body.sex || null,
      province: body.province || null,
      city: body.city || null,
      street: body.street || null,
      streetNumber: body.streetNumber || null,
      observations: body.observations || null,
    },
  });
  return NextResponse.json(client, { status: 201 });
}
