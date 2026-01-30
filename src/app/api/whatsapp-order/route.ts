import { NextResponse } from "next/server";
import { buildWhatsAppOrderMessage } from "@/lib/utils";

const WHAPI_BASE = "https://gate.whapi.cloud";

function toWhatsAppChatId(e164: string) {
  const digits = e164.replace(/[^\d]/g, "");
  return `${digits}@c.us`;
}

export async function POST(req: Request) {
  try {
    const { items, subtotal, deliveryFee, settings, customer } = await req.json();

    const body = buildWhatsAppOrderMessage(
      items,
      subtotal,
      deliveryFee,
      settings,
      customer
    );

    const to = toWhatsAppChatId(process.env.OWNER_WHATSAPP_NUMBER!);

    const r = await fetch(`${WHAPI_BASE}/messages/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHAPI_TOKEN!}`,
      },
      body: JSON.stringify({ to, body }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json({ ok: false, whapi: data }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
