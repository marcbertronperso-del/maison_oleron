import { env } from "~/env.js";

const PAYPAL_BASE =
  env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`PayPal token error: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(depositCents: number): Promise<string> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: (depositCents / 100).toFixed(2),
          },
          description: "Acompte réservation Maison Oléron (30%)",
        },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`PayPal createOrder error: ${res.status}`);
  const data = await res.json() as { id: string };
  return data.id;
}

interface WebhookVerifyParams {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookBody: unknown;
}

export async function verifyPayPalWebhook(params: WebhookVerifyParams): Promise<boolean> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        transmission_id: params.transmissionId,
        transmission_time: params.transmissionTime,
        cert_url: params.certUrl,
        auth_algo: params.authAlgo,
        transmission_sig: params.transmissionSig,
        webhook_id: env.PAYPAL_WEBHOOK_ID,
        webhook_event: params.webhookBody,
      }),
      cache: "no-store",
    },
  );

  if (!res.ok) throw new Error(`PayPal verify-webhook-signature error: ${res.status}`);
  const data = await res.json() as { verification_status: string };
  return data.verification_status === "SUCCESS";
}

interface CaptureResult {
  success: boolean;
  captureId: string;
}

export async function capturePayPalOrder(orderId: string): Promise<CaptureResult> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!res.ok) throw new Error(`PayPal capture error: ${res.status}`);

  const data = await res.json() as {
    status: string;
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{ id: string }>;
      };
    }>;
  };

  const captureId =
    data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? "";

  return { success: data.status === "COMPLETED", captureId };
}
