import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPlanAccess } from "@/lib/plan-check";

export async function GET(request: Request) {
  const blocked = await checkPlanAccess("/api/calendar");
  if (blocked) return blocked;
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let where = {};
    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where = { date: { gte: start, lte: end } };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        client: { select: { firstName: true, lastName: true, phone: true } },
        vehicle: { select: { name: true, domain: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(events);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  const blocked = await checkPlanAccess("/api/calendar");
  if (blocked) return blocked;
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create": {
        const event = await prisma.calendarEvent.create({
          data: {
            title: body.title,
            type: body.type || "SEGUIMIENTO",
            date: new Date(body.date),
            endDate: body.endDate ? new Date(body.endDate) : null,
            allDay: body.allDay || false,
            description: body.description || null,
            clientId: body.clientId || null,
            vehicleId: body.vehicleId || null,
            color: body.color || null,
          },
        });
        return NextResponse.json(event);
      }
      case "update": {
        const event = await prisma.calendarEvent.update({
          where: { id: body.id },
          data: {
            ...(body.title && { title: body.title }),
            ...(body.type && { type: body.type }),
            ...(body.date && { date: new Date(body.date) }),
            ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
            ...(body.allDay !== undefined && { allDay: body.allDay }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.clientId !== undefined && { clientId: body.clientId || null }),
            ...(body.vehicleId !== undefined && { vehicleId: body.vehicleId || null }),
            ...(body.completed !== undefined && { completed: body.completed }),
            ...(body.color !== undefined && { color: body.color }),
          },
        });
        return NextResponse.json(event);
      }
      case "delete": {
        await prisma.calendarEvent.delete({ where: { id: body.id } });
        return NextResponse.json({ success: true });
      }
      case "toggle-complete": {
        const existing = await prisma.calendarEvent.findUnique({ where: { id: body.id } });
        if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
        const event = await prisma.calendarEvent.update({
          where: { id: body.id },
          data: { completed: !existing.completed },
        });
        return NextResponse.json(event);
      }
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
