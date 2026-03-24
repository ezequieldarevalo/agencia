import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.id },
    include: {
      supplier: { select: { id: true, firstName: true, lastName: true } },
      buyer: { select: { id: true, firstName: true, lastName: true } },
      photos: { orderBy: { order: "asc" } },
      movements: { orderBy: { date: "desc" }, take: 10, include: { cashAccount: { select: { name: true } } } },
      debts: { include: { client: { select: { firstName: true, lastName: true } } } },
      interactions: { orderBy: { createdAt: "desc" }, take: 10, include: { client: { select: { firstName: true, lastName: true } } } },
      metaPublications: { orderBy: { createdAt: "desc" } },
      mlListings: { orderBy: { createdAt: "desc" } },
      calendarEvents: { orderBy: { date: "desc" }, take: 5, include: { client: { select: { firstName: true, lastName: true } } } },
    },
  });
  if (!vehicle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(vehicle);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  const allowed = ["name", "status", "category", "kilometers", "brand", "model", "year", "version", "priceARS", "priceUSD", "currency", "exchangeRate", "fuel", "color", "doors", "bodyType", "transmission", "engine", "domain", "engineNumber", "chassisNumber", "description", "locationProvince", "locationCity", "contactPhone", "notes", "published", "supplierId"];
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }
  const vehicle = await prisma.vehicle.update({
    where: { id: params.id },
    data,
    include: { photos: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(vehicle);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const vehicle = await prisma.vehicle.update({
    where: { id: params.id },
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
      published: body.published,
      supplierId: body.supplierId || null,
    },
  });
  return NextResponse.json(vehicle);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.vehicle.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
