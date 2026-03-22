import { NextResponse } from "next/server";
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppStatus,
  sendTextMessage,
  sendVehicleCard,
  sendTemplateMessage,
  sendPaymentReminder,
  getConversation,
  getConversations,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  processInboundMessage,
} from "@/lib/integrations/whatsapp";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "conversations": {
        const convos = await getConversations();
        return NextResponse.json(convos);
      }
      case "conversation": {
        const phone = searchParams.get("phone") || undefined;
        const clientId = searchParams.get("clientId") || undefined;
        const messages = await getConversation({ phone, clientId });
        return NextResponse.json(messages);
      }
      case "templates": {
        const templates = await getTemplates();
        return NextResponse.json(templates);
      }
      default: {
        const status = await getWhatsAppStatus();
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
        const result = await connectWhatsApp({
          phoneNumberId: body.phoneNumberId,
          businessId: body.businessId,
          accessToken: body.accessToken,
          phoneDisplay: body.phoneDisplay,
        });
        return NextResponse.json(result);
      }
      case "disconnect": {
        await disconnectWhatsApp();
        return NextResponse.json({ success: true });
      }
      case "send-text": {
        const msg = await sendTextMessage(body.phone, body.text, body.clientId, body.vehicleId);
        return NextResponse.json(msg);
      }
      case "send-vehicle": {
        const msg = await sendVehicleCard(body.phone, body.vehicleId, body.clientId);
        return NextResponse.json(msg);
      }
      case "send-template": {
        const msg = await sendTemplateMessage(
          body.phone,
          body.templateSlug,
          body.variables || {},
          body.clientId,
          body.vehicleId
        );
        return NextResponse.json(msg);
      }
      case "send-reminder": {
        const msg = await sendPaymentReminder(body.debtId);
        return NextResponse.json(msg);
      }
      case "create-template": {
        const tpl = await createTemplate(body.template);
        return NextResponse.json(tpl);
      }
      case "update-template": {
        const tpl = await updateTemplate(body.templateId, body.data);
        return NextResponse.json(tpl);
      }
      case "delete-template": {
        await deleteTemplate(body.templateId);
        return NextResponse.json({ success: true });
      }
      case "webhook": {
        // Process inbound message from WhatsApp webhook
        const msg = await processInboundMessage(body);
        return NextResponse.json(msg);
      }
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
