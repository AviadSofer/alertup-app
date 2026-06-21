import posthog from "posthog-js";

export function posthogCaptureEvent({
  distinctId,
  event,
  properties = {},
}: {
  distinctId?: string;
  event: string;
  properties?: Record<string, any>;
}) {
  posthog.capture(event, {
    ...(distinctId ? { distinct_id: distinctId } : {}),
    ...properties,
  });
}
