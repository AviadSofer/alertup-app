import type { ActionFunctionArgs } from "react-router";


import db from "app/db.server";
import { authenticate } from "app/shopify.server";
import { getLivePreview } from "app/services/alert-rules/preview.service.server";

interface AlertPreviewRequest {
  scopeType?: string;
  scopeValue?: string | null;
  threshold?: number;
  locationId?: string | null;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const payload = (await request.json()) as AlertPreviewRequest;
  const threshold = Number(payload.threshold);

  if (!Number.isFinite(threshold)) {
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

  return Response.json(result);
};
