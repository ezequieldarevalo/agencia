import { NextResponse } from "next/server";
import {
  connectManual,
  disconnectMercadoLibre,
  getMlStatus,
  getAuthUrl,
  publishListing,
  updateListingStatus,
  updateListingPrice,
  syncListingStats,
  syncQuestions,
  answerQuestion,
  getListings,
  getAllQuestions,
} from "@/lib/integrations/mercadolibre";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "auth-url": {
        const url = getAuthUrl();
        return NextResponse.json({ url });
      }
      case "listings": {
        const vehicleId = searchParams.get("vehicleId") || undefined;
        const listings = await getListings(vehicleId);
        return NextResponse.json(listings);
      }
      case "questions": {
        const questions = await getAllQuestions();
        return NextResponse.json(questions);
      }
      default: {
        const status = await getMlStatus();
        return NextResponse.json(status);
      }
    }
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
        const result = await connectManual(body.accessToken);
        return NextResponse.json(result);
      }
      case "disconnect": {
        await disconnectMercadoLibre();
        return NextResponse.json({ success: true });
      }
      case "publish": {
        const listing = await publishListing(body.vehicleId, {
          title: body.title,
          price: body.price,
          listingType: body.listingType,
        });
        return NextResponse.json(listing);
      }
      case "update-status": {
        const listing = await updateListingStatus(body.listingId, body.status);
        return NextResponse.json(listing);
      }
      case "update-price": {
        const listing = await updateListingPrice(body.listingId, body.price);
        return NextResponse.json(listing);
      }
      case "sync-stats": {
        const listing = await syncListingStats(body.listingId);
        return NextResponse.json(listing);
      }
      case "sync": {
        // Sync all: stats for all listings + questions
        const allListings = await getListings();
        for (const l of allListings) {
          try { await syncListingStats(l.id); } catch {}
          try { await syncQuestions(l.id); } catch {}
        }
        return NextResponse.json({ success: true });
      }
      case "sync-questions": {
        const questions = await syncQuestions(body.listingId);
        return NextResponse.json(questions);
      }
      case "answer-question": {
        const question = await answerQuestion(body.questionId, body.answer);
        return NextResponse.json(question);
      }
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
