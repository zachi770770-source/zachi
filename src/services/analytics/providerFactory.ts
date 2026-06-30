import type { IAnalyticsProvider } from "./IAnalyticsProvider";
import { ConsoleProvider } from "./providers/ConsoleProvider";

let cached: IAnalyticsProvider | null = null;

export function getAnalytics(): IAnalyticsProvider {
  if (cached) return cached;
  // Phase 3: switch on NEXT_PUBLIC_ANALYTICS_PROVIDER to PostHogProvider.
  cached = new ConsoleProvider();
  return cached;
}

export function track(
  event: Parameters<IAnalyticsProvider["track"]>[0],
  props?: Parameters<IAnalyticsProvider["track"]>[1],
) {
  getAnalytics().track(event, props);
}
