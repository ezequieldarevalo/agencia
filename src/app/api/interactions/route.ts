import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPlanAccess } from "@/lib/plan-check";

export async function GET() {
  const blocked = await checkPlanAccess("/api/interactions");
  if (blocked) return blocked;
  const interactions = await prisma.interaction.findMany({
    include: {
      client: { select: { firstName: true, lastName: true } },
      vehicle: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(interactions);
}

export async function POST(req: Request) {
  const blocked = await checkPlanAccess("/api/interactions");
  if (blocked) return blocked;
  const body = await req.json();

  // Create or find client
  let clientId = body.clientId;
  if (!clientId && body.clientFirstName) {
    const client = await prisma.client.create({
      data: {
        firstName: body.clientFirstName,
        lastName: body.clientLastName || "",
        email: body.clientEmail || null,
        phone: body.clientPhone || null,
        clientType: "PROSPECTO",
      },
    });
    clientId = client.id;
  }

  const interaction = await prisma.interaction.create({
    data: {
      status: body.status,
      origin: body.origin || null,
      notes: body.notes || null,
      searchCategory: body.searchCategory || null,
      searchInterest: body.searchInterest || null,
      searchBodyType: body.searchBodyType || null,
      searchCurrency: body.searchCurrency || null,
      searchPriceMin: body.searchPriceMin,
      searchPriceMax: body.searchPriceMax,
      searchYearMin: body.searchYearMin,
      searchYearMax: body.searchYearMax,
      searchColor: body.searchColor || null,
      clientId,
      vehicleId: body.vehicleId || null,
    },
  });
  return NextResponse.json(interaction, { status: 201 });
}
