import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(suppliers);
}

export async function POST(req: Request) {
  const body = await req.json();
  const supplier = await prisma.supplier.create({
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
  return NextResponse.json(supplier, { status: 201 });
}
