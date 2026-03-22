import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unread") === "true";

    const notifications = await prisma.notification.findMany({
      where: unreadOnly ? { read: false } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "mark-read": {
        await prisma.notification.update({
          where: { id: body.id },
          data: { read: true },
        });
        return NextResponse.json({ success: true });
      }
      case "mark-all-read": {
        await prisma.notification.updateMany({
          where: { read: false },
          data: { read: true },
        });
        return NextResponse.json({ success: true });
      }
      case "create": {
        const notif = await prisma.notification.create({
          data: {
            type: body.type || "SYSTEM",
            title: body.title,
            message: body.message,
            link: body.link || null,
          },
        });
        return NextResponse.json(notif);
      }
      case "clear-all": {
        await prisma.notification.deleteMany({
          where: { read: true },
        });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
