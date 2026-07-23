import { createHash, timingSafeEqual } from "node:crypto";
import { getSettings } from "./settings";

export type MidtransConfig = {
  serverKey: string;
  clientKey: string;
  production: boolean;
  snapBase: string;
  apiBase: string;
};

export async function getMidtransConfig(): Promise<MidtransConfig> {
  const s = (await getSettings()).integrations.midtrans;
  const serverKey = s.serverKey || process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = s.clientKey || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const production = s.production || process.env.MIDTRANS_IS_PRODUCTION === "true";
  return {
    serverKey,
    clientKey,
    production,
    snapBase: production ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com",
    apiBase: production ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com",
  };
}

export async function isConfigured(): Promise<boolean> {
  return (await getMidtransConfig()).serverKey.length > 0;
}

function authHeader(serverKey: string): string {
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

export async function createSnapTransaction(params: {
  orderId: string;
  amount: number;
  itemTitle: string;
  customer: { name: string; email: string };
}): Promise<{ token: string; redirectUrl: string }> {
  const cfg = await getMidtransConfig();
  const res = await fetch(`${cfg.snapBase}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader(cfg.serverKey),
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      item_details: [
        {
          id: params.orderId,
          price: params.amount,
          quantity: 1,
          name: params.itemTitle.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: params.customer.name,
        email: params.customer.email,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Midtrans Snap ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return { token: data.token, redirectUrl: data.redirect_url };
}

export type MidtransTx = {
  transaction_status?: string;
  fraud_status?: string;
  gross_amount?: string;
  status_code?: string;
  payment_type?: string;
};

export async function getTransactionStatus(orderId: string): Promise<MidtransTx | null> {
  const cfg = await getMidtransConfig();
  const res = await fetch(`${cfg.apiBase}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: {
      Accept: "application/json",
      Authorization: authHeader(cfg.serverKey),
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function verifySignature(payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): Promise<boolean> {
  const cfg = await getMidtransConfig();
  const expected = createHash("sha512")
    .update(payload.order_id + payload.status_code + payload.gross_amount + cfg.serverKey)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(payload.signature_key ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
}
