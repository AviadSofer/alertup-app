import type { LoaderFunctionArgs } from "react-router";

import { processScheduledAlerts } from "../services/alert-rules/scheduled-alerts.service.server";
import { sendAlertDigestEmail } from "../services/resend/resend.service";
import { log } from "app/lib/logger.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  log({ message: "[api.scheduled-alerts] GET request received" });

  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log({ level: "warn", message: "[api.scheduled-alerts] Unauthorized request" });
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await processScheduledAlerts(sendAlertDigestEmail, new Date());
    log({ message: "[api.scheduled-alerts] Processed scheduled alerts:", result: JSON.stringify(result) });

    return Response.json({ ok: true, result });
  } catch (error) {
    log({ level: "error", message: "[api.scheduled-alerts] Error:", error });
    return Response.json({ error: "Failed to process scheduled alerts" }, { status: 500 });
  }
};
