import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { photos } = body as { photos: string[] };

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    // Validate: each photo must be a data URL
    for (const p of photos) {
      if (typeof p !== "string" || !p.startsWith("data:image/")) {
        return NextResponse.json({ error: "Invalid photo format" }, { status: 400 });
      }
      // Limit ~5MB per photo
      if (p.length > 5 * 1024 * 1024 * 1.37) {
        return NextResponse.json({ error: "Photo too large (max 5MB)" }, { status: 400 });
      }
    }

    // Get current max order
    const lastPhoto = await prisma.vehiclePhoto.findFirst({
      where: { vehicleId: id },
      orderBy: { order: "desc" },
    });
    const startOrder = (lastPhoto?.order ?? -1) + 1;

    const created = await prisma.$transaction(
      photos.map((url, i) =>
        prisma.vehiclePhoto.create({
          data: { url, vehicleId: id, order: startOrder + i },
        })
      )
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: "Failed to upload photos" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json({ error: "photoId required" }, { status: 400 });
    }

    await prisma.vehiclePhoto.delete({
      where: { id: photoId, vehicleId: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Photo delete error:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
