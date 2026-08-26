import type {
  ReaderAccessRepository,
  ReaderActivationInput,
  ReaderSession,
} from "@/lib/reader/types";

type Row = {
  emailNormalized: string;
  consentVersion: string;
  consentAt: Date;
  sessionTokenHash: string | null;
  sessionExpiresAt: Date | null;
  sessionRevokedAt: Date | null;
};

/**
 * מימוש בזיכרון — לבדיקות/פיתוח בלבד (מופעל רק כאשר READER_ALLOW_MEMORY=true,
 * לעולם לא ב-Vercel Preview/Production). אינו מתמיד.
 */
export class InMemoryReaderAccessRepository implements ReaderAccessRepository {
  readonly rows = new Map<string, Row>();

  async activate(input: ReaderActivationInput): Promise<void> {
    this.rows.set(input.emailNormalized, {
      emailNormalized: input.emailNormalized,
      consentVersion: input.consentVersion,
      consentAt: new Date(),
      sessionTokenHash: input.sessionTokenHash,
      sessionExpiresAt: input.sessionExpiresAt,
      sessionRevokedAt: null,
    });
  }

  async findValidSession(sessionTokenHash: string): Promise<ReaderSession | null> {
    const now = Date.now();
    for (const row of this.rows.values()) {
      if (
        row.sessionTokenHash === sessionTokenHash &&
        row.sessionRevokedAt === null &&
        row.sessionExpiresAt !== null &&
        row.sessionExpiresAt.getTime() > now
      ) {
        return { emailNormalized: row.emailNormalized };
      }
    }
    return null;
  }

  async revokeSession(sessionTokenHash: string): Promise<void> {
    for (const row of this.rows.values()) {
      if (row.sessionTokenHash === sessionTokenHash) {
        row.sessionRevokedAt = new Date();
      }
    }
  }
}
