import { NextResponse } from "next/server";
import {
  connectMeta,
  disconnectMeta,
  getMetaStatus,
  publishToFacebook,
  publishToInstagram,
  removeMetaPublication,
  getMetaPublications,
} from "@/lib/integrations/meta";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "publications") {
      const vehicleId = searchParams.get("vehicleId") || undefined;
      const pubs = await getMetaPublications(vehicleId);
      return NextResponse.json(pubs);
    }

    const status = await getMetaStatus();
    return NextResponse.json(status);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "connect": {
        const result = await connectMeta(body.accessToken);
        return NextResponse.json(result);
      }
      case "disconnect": {
        await disconnectMeta();
        return NextResponse.json({ success: true });
      }
      case "publish-facebook": {
        const pub = await publishToFacebook(body.vehicleId, body.message);
        return NextResponse.json(pub);
      }
      case "publish-instagram": {
        const pub = await publishToInstagram(body.vehicleId, body.message);
        return NextResponse.json(pub);
      }
      case "remove": {
        const pub = await removeMetaPublication(body.publicationId);
        return NextResponse.json(pub);
      }
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
