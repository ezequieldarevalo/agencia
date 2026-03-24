import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const dealership = await prisma.dealership.findFirst();
  if (!dealership) {
    return NextResponse.json({});
  }
  return NextResponse.json(dealership.stepConfig || {});
}

export async function PUT(req: Request) {
  const body = await req.json();
  const dealership = await prisma.dealership.findFirst();
  if (!dealership) {
    return NextResponse.json({ error: "No dealership found" }, { status: 404 });
  }

  const updated = await prisma.dealership.update({
    where: { id: dealership.id },
    data: { stepConfig: body },
  });

  return NextResponse.json(updated.stepConfig || {});
}
