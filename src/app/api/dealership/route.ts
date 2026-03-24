import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dealerships = await prisma.dealership.findMany({ take: 1 });
  if (dealerships.length === 0) {
    // Create default dealership
    const d = await prisma.dealership.create({
      data: { name: "Mi Agencia" },
    });
    return NextResponse.json(d);
  }
  return NextResponse.json(dealerships[0]);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const dealerships = await prisma.dealership.findMany({ take: 1 });

  let dealership;
  if (dealerships.length === 0) {
    dealership = await prisma.dealership.create({
      data: {
        name: body.name || "Mi Agencia",
        email: body.email || null,
        cuit: body.cuit || null,
        phone: body.phone || null,
        province: body.province || null,
        city: body.city || null,
        street: body.street || null,
        streetNumber: body.streetNumber || null,
        schedule: body.schedule || null,
        videoUrl: body.videoUrl || null,
        description: body.description || null,
        saleContract: body.saleContract || null,
        depositReceipt: body.depositReceipt || null,
        consignmentContract: body.consignmentContract || null,
      },
    });
  } else {
    dealership = await prisma.dealership.update({
      where: { id: dealerships[0].id },
      data: {
        name: body.name,
        email: body.email || null,
        cuit: body.cuit || null,
        phone: body.phone || null,
        province: body.province || null,
        city: body.city || null,
        street: body.street || null,
        streetNumber: body.streetNumber || null,
        schedule: body.schedule || null,
        videoUrl: body.videoUrl || null,
        description: body.description || null,
        saleContract: body.saleContract || null,
        depositReceipt: body.depositReceipt || null,
        consignmentContract: body.consignmentContract || null,
      },
    });
  }

  return NextResponse.json(dealership);
}
