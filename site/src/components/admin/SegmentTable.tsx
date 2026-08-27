import { Ga4Notice, fmtNumber, fmtPercent } from "@/components/admin/primitives";
import type { Ga4Block, Ga4PageRow, Ga4SegmentRow } from "@/lib/admin/dashboard";

function ctrPct(clicks: number, sessions: number): string {
  return sessions > 0 ? fmtPercent((clicks / sessions) * 100) : "—";
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0) {
    return <p className="rounded-2xl border border-border bg-surface p-4 text-[13px] text-foreground-muted">אין נתונים בטווח.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[32rem] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border text-foreground-muted">
            {head.map((h, i) => (
              <th key={h} className={`px-3 py-2.5 font-semibold ${i === 0 ? "text-start" : "text-end"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-border/60 last:border-0">
              {r.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2.5 ${ci === 0 ? "text-start font-medium text-foreground" : "text-end tabular-nums text-foreground/90"} ${
                    ci === 0 ? "max-w-[18rem] truncate" : ""
                  }`}
                  title={ci === 0 ? String(cell) : undefined}
                >
                  {typeof cell === "number" ? fmtNumber(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SegmentTable({
  block,
  keyHeader,
}: {
  block: Ga4Block<Ga4SegmentRow[]>;
  keyHeader: string;
}) {
  if (block.status === "unconfigured") return <Ga4Notice kind="unconfigured" />;
  if (block.status === "error") return <Ga4Notice kind="error" />;
  return (
    <Table
      head={[keyHeader, "Sessions", "Amazon clicks", "Amazon CTR"]}
      rows={block.data.map((r) => [r.key, r.sessions, r.amazonClicks, ctrPct(r.amazonClicks, r.sessions)])}
    />
  );
}

export function PagesTable({ block }: { block: Ga4Block<Ga4PageRow[]> }) {
  if (block.status === "unconfigured") return <Ga4Notice kind="unconfigured" />;
  if (block.status === "error") return <Ga4Notice kind="error" />;
  return (
    <Table
      head={["עמוד", "Page views", "משתמשים", "Amazon clicks", "Amazon CTR"]}
      rows={block.data.map((r) => [r.path, r.views, r.users, r.amazonClicks, ctrPct(r.amazonClicks, r.users)])}
    />
  );
}
