import { Axiom } from "@axiomhq/js";

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN!,
  orgId: "aviad-nzfh",
});

const DATASET = "alertup";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  message: string;
  level?: LogLevel;
  shop?: string;
  [key: string]: unknown;
}

export function log(payload: LogPayload) {
  const level = payload.level ?? "info";
  const entry = {
    ...payload,
    level,
    timestamp: new Date().toISOString(),
    app: "alertup",
  };

  axiom.ingest(DATASET, [entry]);

  // Also log to console
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
    `[${level.toUpperCase()}]`,
    payload.message,
    payload,
  );
}

export async function flushLogs() {
  await axiom.flush();
}
