import type { IAnalyticsProvider } from "./IAnalyticsProvider";
import { ConsoleProvider } from "./providers/ConsoleProvider";

let cached: IAnalyticsProvider | null = null;

export function getAnalytics(): IAnalyticsProvider {
  if (cached) return cached;

  if (typeof window !== "undefined") {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) {
      // dynamic import כדי לא לגרור posthog ל-SSR
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PostHogProvider } = require("./providers/PostHogProvider") as typeof import("./providers/PostHogProvider");
      const provider = new PostHogProvider();
      provider.init(key, process.env.NEXT_PUBLIC_POSTHOG_HOST);
      cached = provider;
      return cached;
    }
  }

  cached = new ConsoleProvider();
  return cached;
}

export function track(
  event: Parameters<IAnalyticsProvider["track"]>[0],
  props?: Parameters<IAnalyticsProvider["track"]>[1],
) {
  getAnalytics().track(event, props);
}

export function identify(props: Record<string, unknown>) {
  const a = getAnalytics();
  if (a.identify) a.identify(props);
}
