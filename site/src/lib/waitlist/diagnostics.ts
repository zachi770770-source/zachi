/**
 * סיווג מאובטח של שגיאות DB לצורך אבחון בלוגים.
 *
 * מדפיסים אך ורק מטא-נתונים לא-רגישים: name, code, cause?.code, שלב הפעולה
 * וסיווג מילולי של קודים מוכרים. לעולם לא message / stack / DATABASE_URL /
 * host / user / password / connection string.
 */

export type WaitlistErrorStage = "connection" | "upsert" | "unknown";

export type WaitlistErrorDiagnosis = {
  name: string;
  code: string;
  causeCode: string;
  stage: WaitlistErrorStage;
  classification: string;
};

/** קודים מוכרים → סיווג + שלב שבו הם מתרחשים. */
const KNOWN: Record<string, { classification: string; stage: WaitlistErrorStage }> = {
  // Postgres SQLSTATE
  "28P01": { classification: "authentication_failed", stage: "connection" },
  "42P01": { classification: "relation_missing", stage: "upsert" },
  "42501": { classification: "permission_denied", stage: "upsert" },
  // Node system / network
  ENOTFOUND: { classification: "host_not_found", stage: "connection" },
  ECONNREFUSED: { classification: "connection_refused", stage: "connection" },
  ETIMEDOUT: { classification: "connection_timeout", stage: "connection" },
  // TLS / אישורים
  SELF_SIGNED_CERT_IN_CHAIN: { classification: "ssl_error", stage: "connection" },
  DEPTH_ZERO_SELF_SIGNED_CERT: { classification: "ssl_error", stage: "connection" },
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: { classification: "ssl_error", stage: "connection" },
  CERT_HAS_EXPIRED: { classification: "ssl_error", stage: "connection" },
};

function readString(value: unknown): string {
  return typeof value === "string" && value.length > 0 ? value : "";
}

/**
 * מחלץ מהשגיאה רק שדות בטוחים ומסווג אותה. אינו נוגע ב-message או ב-stack.
 */
export function classifyWaitlistDbError(err: unknown): WaitlistErrorDiagnosis {
  const e = (err ?? {}) as { name?: unknown; code?: unknown; cause?: { code?: unknown } };
  const name = readString(e.name) || "unknown";
  const code = readString(e.code);
  const causeCode = readString(e.cause?.code);
  const effective = code || causeCode;

  let classification = "unknown";
  let stage: WaitlistErrorStage = "unknown";

  if (effective && KNOWN[effective]) {
    classification = KNOWN[effective].classification;
    stage = KNOWN[effective].stage;
  } else if (effective && effective.includes("CERT")) {
    // כל שגיאת אישור אחרת → ssl_error
    classification = "ssl_error";
    stage = "connection";
  }

  return {
    name,
    code: code || "none",
    causeCode: causeCode || "none",
    stage,
    classification,
  };
}

/** שורת לוג אבחון אחת, מטא-נתונים בלבד. */
export function formatWaitlistDbErrorLog(d: WaitlistErrorDiagnosis): string {
  return `[waitlist] persistence error name=${d.name} code=${d.code} causeCode=${d.causeCode} stage=${d.stage} classification=${d.classification}`;
}
