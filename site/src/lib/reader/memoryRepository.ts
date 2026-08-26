import type {
  ReaderClaim,
  ReaderClaimAddInput,
  ReaderClaimRepository,
  ReaderClaimStatus,
} from "@/lib/reader/types";

type Row = ReaderClaimAddInput & {
  status: ReaderClaimStatus;
  accessToken: string | null;
};

/**
 * מימוש בזיכרון — לבדיקות/פיתוח בלבד (מופעל רק כאשר READER_ALLOW_MEMORY=true,
 * לעולם לא ב-Vercel Preview/Production). אינו מתמיד.
 */
export class InMemoryReaderClaimRepository implements ReaderClaimRepository {
  readonly rows = new Map<string, Row>();

  async createPending(input: ReaderClaimAddInput): Promise<void> {
    this.rows.set(input.emailNormalized, {
      ...input,
      status: "pending",
      accessToken: null,
    });
  }

  async approve(
    emailNormalized: string,
    accessToken: string,
  ): Promise<ReaderClaim | null> {
    const row = this.rows.get(emailNormalized);
    if (!row) return null;
    row.status = "approved";
    row.accessToken = row.accessToken ?? accessToken;
    return {
      emailNormalized,
      status: row.status,
      accessToken: row.accessToken,
    };
  }

  async reject(emailNormalized: string): Promise<void> {
    const row = this.rows.get(emailNormalized);
    if (row) {
      row.status = "rejected";
      row.accessToken = null;
    }
  }

  async findByAccessToken(accessToken: string): Promise<ReaderClaim | null> {
    for (const [emailNormalized, row] of this.rows) {
      if (row.status === "approved" && row.accessToken === accessToken) {
        return { emailNormalized, status: row.status, accessToken: row.accessToken };
      }
    }
    return null;
  }
}
