import { NextResponse } from "next/server";
import { connectWithCode } from "@/lib/integrations/mercadolibre";

// MercadoLibre OAuth callback handler
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/dashboard/integrations/mercadolibre?error=no_code", request.url));
    }

    await connectWithCode(code);
    return NextResponse.redirect(new URL("/dashboard/integrations/mercadolibre?connected=true", request.url));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.redirect(
      new URL(`/dashboard/integrations/mercadolibre?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
