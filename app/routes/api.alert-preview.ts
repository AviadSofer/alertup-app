import type { ActionFunctionArgs } from "react-router";

import { authenticate } from "app/shopify.server";
import { getLivePreview } from "app/services/alert-rules/preview.service.server";

interface AlertPreviewRequest {
  scopeType?: string;
  scopeValue?: string | null;
  threshold?: number;
  locationId?: string | null;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("[api.alert-preview] POST request received");

  try {
    const { session, admin } = await authenticate.admin(request);
    const payload = (await request.json()) as AlertPreviewRequest;
    const threshold = Number(payload.threshold);
    console.log(`[api.alert-preview] Shop: ${session.shop}, scopeType: ${payload.scopeType}, threshold: ${threshold}`);

    if (!Number.isFinite(threshold)) {
      console.warn("[api.alert-preview] Invalid threshold, returning empty result");
      return Response.json({ totalMatching: 0, belowThreshold: 0 });
    }

    const result = await getLivePreview(
      admin,
      session.shop,
      payload.scopeType || "all",
      payload.scopeValue || null,
      threshold,
      payload.locationId || null
    );
    console.log(`[api.alert-preview] Result: totalMatching=${result.totalMatching}, belowThreshold=${result.belowThreshold}`);

    return Response.json(result);
  } catch (error) {
    console.error("[api.alert-preview] Error:", error);
    return Response.json({ error: "Failed to get preview" }, { status: 500 });
  }
};
