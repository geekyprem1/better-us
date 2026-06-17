"use client";

import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
  initialized = true;
}

// Canonical event names tracked across the funnel.
export const EVENTS = {
  LANDING_VIEW: "landing_page_view",
  ASSESSMENT_START: "assessment_start",
  ASSESSMENT_COMPLETE: "assessment_complete",
  UPGRADE_VIEW: "upgrade_view",
  PAYWALL_VIEW: "paywall_view",
  UPGRADE_CLICK: "upgrade_click",
  SUBSCRIPTION_PURCHASE: "subscription_purchase",
  COACH_MESSAGE: "coach_message_sent",
  PDF_DOWNLOAD: "pdf_download",
  COUPLE_INVITE: "couple_invite_sent",
  SHARE_RESULTS: "share_results",
} as const;

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    // analytics must never break the app
  }
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    posthog.identify(userId, props);
  } catch {
    /* noop */
  }
}
