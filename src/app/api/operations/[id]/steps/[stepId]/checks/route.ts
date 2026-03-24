import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Toggle a check item or add a new one */
export async function POST(req: Request, { params }: { params: { id: string; stepId: string } }) {
  const body = await req.json();

  // Add new check item
  if (body.label) {
    const maxOrder = await prisma.stepCheckItem.aggregate({
      where: { stepId: params.stepId },
      _max: { order: true },
    });
    const item = await prisma.stepCheckItem.create({
      data: {
        stepId: params.stepId,
        label: body.label,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
    return NextResponse.json(item, { status: 201 });
  }

  // Toggle existing check item
  if (body.checkItemId) {
    const item = await prisma.stepCheckItem.findUnique({ where: { id: body.checkItemId } });
    if (!item) return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });

    const updated = await prisma.stepCheckItem.update({
      where: { id: body.checkItemId },
      data: { checked: !item.checked },
    });
    return NextResponse.json(updated);
  }

  // Delete a check item
  if (body.deleteItemId) {
    await prisma.stepCheckItem.delete({ where: { id: body.deleteItemId } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Enviar label, checkItemId o deleteItemId" }, { status: 400 });
}
