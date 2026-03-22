import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const client = await prisma.client.update({
    where: { id: params.id },
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
  return NextResponse.json(client);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
