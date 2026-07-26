"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

import { newsletterSchema, type NewsletterInput } from "@/lib/validation/newsletter";
import { trackEvent } from "@/lib/analytics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-danger">
      {message}
    </p>
  );
}

export function NewsletterForm() {
  const [status, setStatus] = React.useState<"idle" | "success" | "error">(
    "idle"
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { contentConsent: false, marketingConsent: false },
  });

  async function onSubmit(values: NewsletterInput) {
    setStatus("idle");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("failed");
      trackEvent("newsletter_signup");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex items-center gap-2 rounded-md border border-success/30 bg-success-foreground px-4 py-3 text-sm text-success"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        נרשמתם לרשימת ההמתנה. נעדכן אתכם ברגע שהספר יוצא.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {status === "error" ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger-foreground px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          ההרשמה נכשלה. נסו שוב.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">שם פרטי</Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            aria-invalid={!!errors.firstName}
            {...register("firstName")}
          />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <Label htmlFor="newsletter-email">אימייל</Label>
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>
      </div>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="newsletter-website">אל תמלאו שדה זה</label>
        <input id="newsletter-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="flex items-start gap-3">
        <Controller
          control={control}
          name="contentConsent"
          render={({ field }) => (
            <Checkbox
              id="contentConsent"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              aria-invalid={!!errors.contentConsent}
            />
          )}
        />
        <Label htmlFor="contentConsent" className="font-normal leading-relaxed">
          אני מסכים/ה שתעדכנו אותי במייל כשהספר יוצא
        </Label>
      </div>
      <FieldError message={errors.contentConsent?.message} />

      <div className="flex items-start gap-3">
        <Controller
          control={control}
          name="marketingConsent"
          render={({ field }) => (
            <Checkbox
              id="newsletter-marketing"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <Label htmlFor="newsletter-marketing" className="font-normal leading-relaxed">
          אשמח לקבל גם עדכונים ותוכן שיווקי נוסף (אופציונלי)
        </Label>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            נרשם/ת...
          </>
        ) : (
          "עדכנו אותי כשהספר יוצא"
        )}
      </Button>

      <p className="text-xs leading-relaxed text-foreground-muted">
        פרטיכם נשמרים לצורך העדכון בלבד. ראו את{" "}
        <a
          href="/privacy"
          className="underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          מדיניות הפרטיות
        </a>
        .
      </p>
    </form>
  );
}
