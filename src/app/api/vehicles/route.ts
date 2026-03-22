import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    include: { supplier: { select: { firstName: true, lastName: true } }, photos: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(vehicles);
}

export async function POST(req: Request) {
  const body = await req.json();
  const vehicle = await prisma.vehicle.create({
    data: {
      name: body.name,
      status: body.status,
      category: body.category,
      kilometers: body.kilometers,
      brand: body.brand || null,
      model: body.model || null,
      year: body.year,
      version: body.version || null,
      priceARS: body.priceARS,
      priceUSD: body.priceUSD,
      currency: body.currency,
      exchangeRate: body.exchangeRate,
      fuel: body.fuel || null,
      color: body.color || null,
      doors: body.doors,
      bodyType: body.bodyType || null,
      transmission: body.transmission || null,
      engine: body.engine || null,
      domain: body.domain || null,
      engineNumber: body.engineNumber || null,
      chassisNumber: body.chassisNumber || null,
      description: body.description || null,
      locationProvince: body.locationProvince || null,
      locationCity: body.locationCity || null,
      contactPhone: body.contactPhone || null,
      notes: body.notes || null,
      published: body.published || false,
      supplierId: body.supplierId || null,
    },
  });
  return NextResponse.json(vehicle, { status: 201 });
}
