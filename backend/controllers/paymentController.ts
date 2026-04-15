import { Request, Response } from "express";
import Stripe from "stripe";

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
};

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const isHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const buildSuccessUrl = (baseUrl: string) =>
  `${baseUrl}/booking?stripe=success&session_id={CHECKOUT_SESSION_ID}`;

const buildCancelUrl = (baseUrl: string) => `${baseUrl}/booking?stripe=cancelled`;

const resolveBaseFrontendUrl = (req: Request) => {
  const envBase = process.env.FRONTEND_URL || process.env.CLIENT_URL;
  const originHeader = req.headers.origin;

  if (envBase && isHttpUrl(envBase)) return normalizeBaseUrl(envBase);
  if (typeof originHeader === "string" && isHttpUrl(originHeader)) {
    return normalizeBaseUrl(originHeader);
  }

  return "http://localhost:5173";
};

const resolveSuccessUrl = (requestedUrl: unknown, fallbackBaseUrl: string) => {
  if (typeof requestedUrl === "string" && isHttpUrl(requestedUrl)) {
    if (requestedUrl.includes("{CHECKOUT_SESSION_ID}")) {
      return requestedUrl;
    }

    const separator = requestedUrl.includes("?") ? "&" : "?";
    return `${requestedUrl}${separator}session_id={CHECKOUT_SESSION_ID}`;
  }

  return buildSuccessUrl(fallbackBaseUrl);
};

const resolveCancelUrl = (requestedUrl: unknown, fallbackBaseUrl: string) => {
  if (typeof requestedUrl === "string" && isHttpUrl(requestedUrl)) {
    return requestedUrl;
  }
  return buildCancelUrl(fallbackBaseUrl);
};

const safeMetadataValue = (value: unknown) => {
  if (value == null) return "";
  return String(value).slice(0, 500);
};

export const createStripeCheckoutSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(503).json({
        error: "Stripe is not configured. Please set STRIPE_SECRET_KEY on the backend.",
      });
    }

    const {
      amount,
      total_price,
      currency,
      bookingTitle,
      bookingDescription,
      success_url,
      cancel_url,
      customer_email,
      property_id,
      service_type,
      service_name,
      checkin,
    } = req.body || {};

    const parsedAmount = Number(amount ?? total_price);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount. Please provide a positive value." });
    }

    const unitAmount = Math.round(parsedAmount * 100);
    if (unitAmount < 50) {
      return res.status(400).json({ error: "Amount is below the minimum supported by Stripe." });
    }

    const selectedCurrency = String(currency || "php").toLowerCase();

    const baseUrl = resolveBaseFrontendUrl(req);
    const successUrl = resolveSuccessUrl(success_url, baseUrl);
    const cancelUrl = resolveCancelUrl(cancel_url, baseUrl);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      payment_intent_data: {
        metadata: {
          user_id: safeMetadataValue(userId),
          property_id: safeMetadataValue(property_id),
          service_type: safeMetadataValue(service_type),
          service_name: safeMetadataValue(service_name),
          checkin: safeMetadataValue(checkin),
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: selectedCurrency,
            unit_amount: unitAmount,
            product_data: {
              name: String(bookingTitle || service_name || "PawStay Booking"),
              description:
                typeof bookingDescription === "string"
                  ? bookingDescription
                  : `Booking payment${service_type ? ` • ${service_type}` : ""}`,
            },
          },
        },
      ],
      customer_email: typeof customer_email === "string" ? customer_email : undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: safeMetadataValue(userId),
        property_id: safeMetadataValue(property_id),
        service_type: safeMetadataValue(service_type),
        service_name: safeMetadataValue(service_name),
        checkin: safeMetadataValue(checkin),
      },
    });

    if (!session.url) {
      return res.status(500).json({ error: "Stripe session created without redirect URL." });
    }

    return res.status(201).json({
      sessionId: session.id,
      url: session.url,
      expiresAt: session.expires_at,
    });
  } catch (err: any) {
    console.error("createStripeCheckoutSession error:", err);
    return res.status(500).json({
      error: "Failed to create Stripe checkout session.",
      details: err?.message || err,
    });
  }
};

export const verifyStripeCheckoutSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(503).json({
        error: "Stripe is not configured. Please set STRIPE_SECRET_KEY on the backend.",
      });
    }

    const sessionId =
      typeof req.query.session_id === "string"
        ? req.query.session_id
        : typeof req.body?.session_id === "string"
          ? req.body.session_id
          : "";

    if (!sessionId) {
      return res.status(400).json({ error: "Missing session_id." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (!session) {
      return res.status(404).json({ error: "Stripe checkout session not found." });
    }

    const sessionUserId = session.metadata?.user_id;
    if (sessionUserId && sessionUserId !== String(userId)) {
      return res.status(403).json({ error: "This Stripe session does not belong to the current user." });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

    const amountTotal =
      typeof session.amount_total === "number"
        ? Math.round((session.amount_total / 100) * 100) / 100
        : null;

    return res.json({
      verified: session.payment_status === "paid",
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      paymentIntentId,
      amountTotal,
      currency: session.currency,
      customerEmail: session.customer_details?.email || session.customer_email || null,
    });
  } catch (err: any) {
    console.error("verifyStripeCheckoutSession error:", err);
    return res.status(500).json({
      error: "Failed to verify Stripe checkout session.",
      details: err?.message || err,
    });
  }
};
