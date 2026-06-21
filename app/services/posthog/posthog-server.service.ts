import { PostHog } from "posthog-node";
import { POSTHOG_API_KEY, POSTHOG_API_HOST } from "../../constants";

const posthog = new PostHog(POSTHOG_API_KEY, { host: POSTHOG_API_HOST });

export async function posthogServerCaptureEvent({
  distinctId,
  event,
  properties = {},
  timestamp,
}: {
  distinctId: string;
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}) {
  posthog.capture({
    distinctId,
    event,
    properties,
    timestamp,
  });
  await posthog.shutdown();
}
