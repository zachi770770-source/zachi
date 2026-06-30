import type { IAnalyticsProvider, AnalyticsEvent } from "../IAnalyticsProvider";

export class ConsoleProvider implements IAnalyticsProvider {
  track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "production") return;
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, properties ?? {});
  }
}
