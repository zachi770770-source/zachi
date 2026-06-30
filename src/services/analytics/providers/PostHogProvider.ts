"use client";

import posthog from "posthog-js";
import type {
  IAnalyticsProvider,
  AnalyticsEvent,
} from "../IAnalyticsProvider";

export class PostHogProvider implements IAnalyticsProvider {
  private inited = false;

  init(key: string, host?: string) {
    if (this.inited) return;
    if (typeof window === "undefined") return;
    posthog.init(key, {
      api_host: host ?? "https://eu.i.posthog.com",
      capture_pageview: true,
      autocapture: false, // אנחנו שולחים אירועים מובנים, לא רוצים noise
      person_profiles: "identified_only",
      // אנונימיזציה: לא לאסוף IP בצד client
      ip: false,
    });
    this.inited = true;
  }

  track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
    if (!this.inited) return;
    if (typeof window === "undefined") return;
    posthog.capture(event, properties);
  }

  identify(props: Record<string, unknown>) {
    if (!this.inited) return;
    if (typeof window === "undefined") return;
    const id = (props.userId as string) ?? null;
    if (!id) return;
    posthog.identify(id, props);
  }
}
