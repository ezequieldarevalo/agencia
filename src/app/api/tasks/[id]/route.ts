import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.status !== undefined) data.status = body.status;
  if (body.rating !== undefined) data.rating = body.rating;
  if (body.supplierId !== undefined) data.supplierId = body.supplierId || null;

  const task = await prisma.intakeTask.update({
    where: { id: params.id },
    data,
    include: { check: true },
  });

  // If task completed, check if all tasks for the check are done -> auto-check
  if (body.status === "FINALIZADA" && task.checkId) {
    const siblingTasks = await prisma.intakeTask.findMany({
      where: { checkId: task.checkId },
    });
    const allDone = siblingTasks.every((t) => t.status === "FINALIZADA");
    if (allDone) {
      await prisma.intakeCheck.update({
        where: { id: task.checkId },
        data: { checked: true },
      });
    }
  }

  return NextResponse.json(task);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.intakeTask.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
