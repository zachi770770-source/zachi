import type { ReaderProofMime } from "@/lib/reader/proof";
import type {
  ReaderApprovedClaim,
  ReaderClaimCreateInput,
  ReaderClaimRepository,
  ReaderClaimStats,
  ReaderClaimStatus,
  ReaderPendingClaim,
  ReaderProofBlob,
  StatsRange,
} from "@/lib/reader/types";

type Row = {
  emailNormalized: string;
  consentVersion: string;
  consentAt: Date;
  createdAt: Date;
  status: ReaderClaimStatus;
  proofMime: ReaderProofMime | null;
  proofSize: number | null;
  proofBytes: Buffer | null;
  accessTokenHash: string | null;
  accessTokenExpiresAt: Date | null;
};

/**
 * מימוש בזיכרון — לבדיקות/פיתוח בלבד (מופעל רק כאשר READER_ALLOW_MEMORY=true,
 * לעולם לא ב-Vercel Preview/Production). אינו מתמיד.
 */
export class InMemoryReaderClaimRepository implements ReaderClaimRepository {
  readonly rows = new Map<string, Row>();

  async createPending(input: ReaderClaimCreateInput): Promise<void> {
    this.rows.set(input.emailNormalized, {
      emailNormalized: input.emailNormalized,
      consentVersion: input.consentVersion,
      consentAt: new Date(),
      createdAt: new Date(),
      status: "pending",
      proofMime: input.proof.mime,
      proofSize: input.proof.bytes.length,
      proofBytes: input.proof.bytes,
      accessTokenHash: null,
      accessTokenExpiresAt: null,
    });
  }

  async listPending(limit: number): Promise<ReaderPendingClaim[]> {
    return [...this.rows.values()]
      .filter((r) => r.status === "pending")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limit)
      .map((r) => ({
        emailNormalized: r.emailNormalized,
        status: r.status,
        proofMime: r.proofMime,
        proofSize: r.proofSize,
        createdAt: r.createdAt,
      }));
  }

  async getProof(emailNormalized: string): Promise<ReaderProofBlob | null> {
    const row = this.rows.get(emailNormalized);
    if (!row || !row.proofBytes || !row.proofMime) return null;
    return { mime: row.proofMime, bytes: row.proofBytes };
  }

  async approve(
    emailNormalized: string,
    accessTokenHash: string,
    expiresAt: Date,
  ): Promise<ReaderApprovedClaim | null> {
    const row = this.rows.get(emailNormalized);
    if (!row) return null;
    row.status = "approved";
    row.accessTokenHash = accessTokenHash;
    row.accessTokenExpiresAt = expiresAt;
    row.proofBytes = null; // מינימום PII — ההוכחה כבר לא נחוצה לאחר האישור
    return { emailNormalized };
  }

  async reject(emailNormalized: string): Promise<void> {
    const row = this.rows.get(emailNormalized);
    if (row) {
      row.status = "rejected";
      row.accessTokenHash = null;
      row.accessTokenExpiresAt = null;
      row.proofBytes = null;
    }
  }

  async findApprovedByAccessTokenHash(
    accessTokenHash: string,
  ): Promise<ReaderApprovedClaim | null> {
    const now = Date.now();
    for (const row of this.rows.values()) {
      if (
        row.status === "approved" &&
        row.accessTokenHash === accessTokenHash &&
        row.accessTokenExpiresAt !== null &&
        row.accessTokenExpiresAt.getTime() > now
      ) {
        return { emailNormalized: row.emailNormalized };
      }
    }
    return null;
  }

  async stats(range: StatsRange): Promise<ReaderClaimStats> {
    const now = Date.now();
    const inRange = [...this.rows.values()].filter(
      (r) => r.createdAt >= range.from && r.createdAt < range.to,
    );
    const byDayMap = new Map<string, number>();
    let pending = 0, approved = 0, rejected = 0, approvedWithAccess = 0;
    for (const r of inRange) {
      if (r.status === "pending") pending++;
      else if (r.status === "approved") {
        approved++;
        if (r.accessTokenHash && r.accessTokenExpiresAt && r.accessTokenExpiresAt.getTime() > now) {
          approvedWithAccess++;
        }
      } else if (r.status === "rejected") rejected++;
      const day = r.createdAt.toISOString().slice(0, 10);
      byDayMap.set(day, (byDayMap.get(day) ?? 0) + 1);
    }
    return {
      total: inRange.length,
      pending,
      approved,
      rejected,
      approvedWithAccess,
      byDay: [...byDayMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, submitted]) => ({ day, submitted })),
    };
  }
}
