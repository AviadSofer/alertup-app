import type { LoaderFunctionArgs } from "react-router";

import { processScheduledAlerts } from "../services/alert-rules/scheduled-alerts.service.server";
import { sendAlertDigestEmail } from "../services/resend/resend.service";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await processScheduledAlerts(sendAlertDigestEmail, new Date());

  return new Response(JSON.stringify({ ok: true, result }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
