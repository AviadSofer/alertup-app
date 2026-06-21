import { posthogServerCaptureEvent } from "../posthog/posthog-server.service";
import type { ShopInfo } from "../graphql/get-shop-info";


// AARRR model
// Acquisition - App Installation
// Activation - Onboarding
// Revenue - Payment

// Not implemented now
// Retention - Main Screen Viewed
// Referral - Trial Converted

enum PosthogEvent {
  AppInstalled = "app_installed",
  OnboardingStarted = "onboarding_started",
  PaymentInitiated = "payment_initiated",
  PaymentCompleted = "payment_completed",
  TrialConverted = "trial_converted",
  AppUninstalled = "app_uninstalled",
}

// Step 1: App Installation (Acquisition)
export async function STEP_1_captureAppInstalled({
  distinctId,
  properties = {},
  shopInfo,
}: {
  distinctId: string;
  properties?: Record<string, any>;
  shopInfo: ShopInfo;
}) {
  const posthogPromise = posthogServerCaptureEvent({
    distinctId,
    event: PosthogEvent.AppInstalled,
    properties: { ...properties, step: 1 },
  });
  return posthogPromise;
}

// Step 2: Onboarding Started (Activation)
export async function STEP_2_captureOnboardingStarted({
  distinctId,
  properties = {},
}: {
  distinctId: string;
  properties?: Record<string, any>;
}) {
  return posthogServerCaptureEvent({
    distinctId,
    event: PosthogEvent.OnboardingStarted,
    properties: { ...properties, step: 2 },
  });
}

// Step 3: Payment Initiated (Revenue - Start)
export async function STEP_3_capturePaymentInitiated({
  distinctId,
  properties = {},
}: {
  distinctId: string;
  properties?: Record<string, any>;
}) {
  return posthogServerCaptureEvent({
    distinctId,
    event: PosthogEvent.PaymentInitiated,
    properties: { ...properties, step: 3 },
  });
}

// Step 4: Payment Completed (Revenue - End)
export async function STEP_4_capturePaymentCompleted({
  distinctId,
  properties = {},
}: {
  distinctId: string;
  properties?: Record<string, any>;
}) {
  return posthogServerCaptureEvent({
    distinctId,
    event: PosthogEvent.PaymentCompleted,
    properties: { ...properties, step: 4 },
  });
}

// Step 5: Trial Converted (Revenue - Trial End)
export async function STEP_5_captureTrialConverted({
  distinctId,
  trialDuration,
  properties = {},
}: {
  distinctId: string;
  trialDuration: number;
  properties?: Record<string, any>;
}) {
  return posthogServerCaptureEvent({
    distinctId,
    event: PosthogEvent.TrialConverted,
    properties: {
      ...properties,
      step: 5,
      trial_duration: `${trialDuration} days`,
    },
    timestamp: new Date(Date.now() + trialDuration * 24 * 60 * 60 * 1000),
  });
}

// Step 6: App Uninstalled (Uninstall)
export async function captureAppUninstalled({
  distinctId,
}: {
  distinctId: string;
}) {
  return posthogServerCaptureEvent({
    distinctId,
    event: PosthogEvent.AppUninstalled,
  });
}
