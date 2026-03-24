import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateMlTitle,
  generateMlDescription,
  generateFacebookPost,
  generateInstagramCaption,
  generateBoleto,
  generatePresupuesto,
  generateContratoVenta,
} from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const dealership = await prisma.dealership.findFirst();
    if (!dealership) {
      return NextResponse.json({ error: "Dealership no encontrado" }, { status: 404 });
    }

    const dealershipData = {
      name: dealership.name,
      phone: dealership.phone,
      city: dealership.city,
      province: dealership.province,
      cuit: dealership.cuit,
      street: dealership.street,
      streetNumber: dealership.streetNumber,
    };

    switch (action) {
      // ─── Publication content generation ─────────────
      case "ml-title":
      case "ml-description":
      case "facebook-post":
      case "instagram-caption": {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: body.vehicleId },
          include: { photos: { orderBy: { order: "asc" } } },
        });
        if (!vehicle) return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });

        let content: string;
        switch (action) {
          case "ml-title":
            content = await generateMlTitle(vehicle);
            break;
          case "ml-description":
            content = await generateMlDescription(vehicle, dealershipData);
            break;
          case "facebook-post":
            content = await generateFacebookPost(vehicle, dealershipData);
            break;
          case "instagram-caption":
            content = await generateInstagramCaption(vehicle, dealershipData);
            break;
          default:
            content = "";
        }

        return NextResponse.json({ content });
      }

      // ─── Document generation ─────────────
      case "boleto":
      case "presupuesto":
      case "contrato": {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
        if (!vehicle) return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });

        const client = await prisma.client.findUnique({ where: { id: body.clientId } });
        if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

        let document: string;
        switch (action) {
          case "boleto":
            document = await generateBoleto(vehicle, client, dealershipData, {
              price: body.price,
              currency: body.currency || "ARS",
              paymentMethod: body.paymentMethod,
              date: body.date,
            });
            break;
          case "presupuesto":
            document = await generatePresupuesto(vehicle, client, dealershipData, {
              price: body.price,
              currency: body.currency || "ARS",
              includesTransfer: body.includesTransfer,
              exchangeRate: body.exchangeRate,
              validDays: body.validDays,
              notes: body.notes,
            });
            break;
          case "contrato":
            document = await generateContratoVenta(vehicle, client, dealershipData, {
              price: body.price,
              currency: body.currency || "ARS",
              paymentMethod: body.paymentMethod,
              date: body.date,
              depositAmount: body.depositAmount,
            });
            break;
          default:
            document = "";
        }

        return NextResponse.json({ content: document });
      }

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
