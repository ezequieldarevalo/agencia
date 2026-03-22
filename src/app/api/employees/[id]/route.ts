import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { firstName, lastName, email, phone, area, dni, province, city, street, streetNumber } = body;

  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: {
      firstName, lastName, email, phone: phone || null, area,
      dni: dni || null, province: province || null, city: city || null,
      street: street || null, streetNumber: streetNumber || null,
    },
  });

  return NextResponse.json(employee);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.employee.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
