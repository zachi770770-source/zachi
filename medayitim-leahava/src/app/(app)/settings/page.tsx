import { SettingsForm } from "./SettingsForm";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">הגדרות</h1>
        <p className="text-ink-700">פרטי הפרופיל וההעדפות שלך.</p>
      </header>
      <SettingsForm />
    </div>
  );
}
