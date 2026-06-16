import Razorpay from "razorpay";
import crypto from "crypto";

// Lazily instantiate the client so module import doesn't throw at build time
// (env vars are absent during static analysis / page-data collection).
let _client: Razorpay | null = null;
export function getRazorpay(): Razorpay {
  if (!_client) {
    _client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return _client;
}

export const RAZORPAY_PLAN_ID = process.env.RAZORPAY_PLAN_ID!;

// Verifies the signature Razorpay Checkout returns for a subscription payment.
export function verifySubscriptionSignature(params: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}): boolean {
  const body = `${params.razorpay_payment_id}|${params.razorpay_subscription_id}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expected === params.razorpay_signature;
}

// Verifies the X-Razorpay-Signature header on incoming webhooks.
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}
