// Analytics provider interface.
// ב־MVP: ConsoleProvider (no-op בייצור, log ב־dev).
// ב־Phase 3: PostHogProvider אמיתי.

export type AnalyticsEvent =
  | "app_opened"
  | "onboarding_started"
  | "onboarding_segment_chosen"
  | "onboarding_completed"
  | "diagnosis_started"
  | "diagnosis_question_answered"
  | "diagnosis_completed"
  | "diagnosis_abandoned"
  | "dominant_voice_detected"
  | "tool_viewed"
  | "tool_started"
  | "tool_completed"
  | "tool_abandoned"
  | "catch_logged"
  | "coach_chat_opened"
  | "coach_intent_chosen"
  | "coach_message_sent"
  | "coach_tool_suggested"
  | "coach_tool_followed"
  | "learn_chapter_opened"
  | "learn_chapter_completed"
  | "maintenance_session_started"
  | "maintenance_session_completed"
  | "emergency_kit_opened"
  | "safety_triggered"
  | "safety_resources_viewed"
  | "premium_intent_shown"
  | "premium_intent_clicked"
  | "memory_viewed"
  | "memory_item_deleted";

export interface IAnalyticsProvider {
  track(event: AnalyticsEvent, properties?: Record<string, unknown>): void;
  identify?(props: Record<string, unknown>): void;
}
