import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase() || "";
    if (!q || q.length < 2) return NextResponse.json([]);

    const [vehicles, clients, suppliers] = await Promise.all([
      prisma.vehicle.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { brand: { contains: q } },
            { model: { contains: q } },
            { domain: { contains: q } },
          ],
        },
        select: { id: true, name: true, domain: true, status: true, priceARS: true },
        take: 5,
      }),
      prisma.client.findMany({
        where: {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, phone: true, clientType: true },
        take: 5,
      }),
      prisma.supplier.findMany({
        where: {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, supplierType: true },
        take: 5,
      }),
    ]);

    const results = [
      ...vehicles.map((v) => ({
        id: `v-${v.id}`,
        type: "vehicle" as const,
        title: v.name,
        subtitle: `${v.domain || "Sin dominio"} · ${v.status} · $${(v.priceARS || 0).toLocaleString("es-AR")}`,
        href: `/dashboard/vehicles/${v.id}`,
      })),
      ...clients.map((c) => ({
        id: `c-${c.id}`,
        type: "client" as const,
        title: `${c.firstName} ${c.lastName}`,
        subtitle: `${c.clientType} · ${c.phone || "Sin teléfono"}`,
        href: `/dashboard/clients`,
      })),
      ...suppliers.map((s) => ({
        id: `s-${s.id}`,
        type: "supplier" as const,
        title: `${s.firstName} ${s.lastName}`,
        subtitle: `${s.supplierType}`,
        href: `/dashboard/suppliers`,
      })),
    ];

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
