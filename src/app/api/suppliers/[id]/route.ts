import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPlanAccess } from "@/lib/plan-check";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const blocked = await checkPlanAccess("/api/suppliers");
  if (blocked) return blocked;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  const allowed = ["personType", "supplierType", "supplierSubtype", "firstName", "lastName", "email", "phone", "dni", "cuit", "cuil", "sex", "province", "city", "street", "streetNumber", "observations"];
  for (const key of allowed) {
    if (key in body) data[key] = body[key] || null;
  }
  if (body.firstName) data.firstName = body.firstName;
  if (body.lastName) data.lastName = body.lastName;
  const supplier = await prisma.supplier.update({ where: { id: params.id }, data });
  return NextResponse.json(supplier);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const blocked = await checkPlanAccess("/api/suppliers");
  if (blocked) return blocked;
  const body = await req.json();
  const supplier = await prisma.supplier.update({
    where: { id: params.id },
    data: {
      personType: body.personType,
      supplierType: body.supplierType,
      supplierSubtype: body.supplierSubtype || null,
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
  return NextResponse.json(supplier);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.supplier.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
