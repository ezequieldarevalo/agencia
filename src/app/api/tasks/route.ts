import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tasks = await prisma.intakeTask.findMany({
    include: {
      supplier: { select: { id: true, firstName: true, lastName: true } },
      check: { select: { id: true, label: true, category: true } },
      intake: {
        select: {
          id: true,
          vehicle: { select: { name: true, domain: true } },
        },
      },
      expenses: {
        include: {
          supplier: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks);
}
