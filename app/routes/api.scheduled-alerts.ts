import type { LoaderFunctionArgs } from "react-router";

import { processScheduledAlerts } from "../services/alert-rules/scheduled-alerts.service.server";
import { sendAlertDigestEmail } from "../services/resend/resend.service";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("[api.scheduled-alerts] GET request received");

  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[api.scheduled-alerts] Unauthorized request");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await processScheduledAlerts(sendAlertDigestEmail, new Date());
    console.log("[api.scheduled-alerts] Processed scheduled alerts:", JSON.stringify(result));

    return Response.json({ ok: true, result });
  } catch (error) {
    console.error("[api.scheduled-alerts] Error:", error);
    return Response.json({ error: "Failed to process scheduled alerts" }, { status: 500 });
  }
};
