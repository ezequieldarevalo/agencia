import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const accounts = await prisma.cashAccount.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const account = await prisma.cashAccount.create({
    data: {
      name: body.name,
      type: body.type,
      currency: body.currency,
      identifier: body.identifier || null,
      initialBalance: body.initialBalance || 0,
      currentBalance: body.initialBalance || 0,
    },
  });
  return NextResponse.json(account, { status: 201 });
}
