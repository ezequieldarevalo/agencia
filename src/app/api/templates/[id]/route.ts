import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const template = await prisma.documentTemplate.findUnique({ where: { id: params.id } });
  if (!template) {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
  }
  return NextResponse.json(template);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.type !== undefined) data.type = body.type;
  if (body.content !== undefined) data.content = body.content;
  if (body.isDefault !== undefined) {
    data.isDefault = body.isDefault;
    // Unset other defaults of same type
    if (body.isDefault) {
      const current = await prisma.documentTemplate.findUnique({ where: { id: params.id } });
      if (current) {
        await prisma.documentTemplate.updateMany({
          where: { type: current.type, isDefault: true, id: { not: params.id } },
          data: { isDefault: false },
        });
      }
    }
  }

  const template = await prisma.documentTemplate.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(template);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.documentTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
