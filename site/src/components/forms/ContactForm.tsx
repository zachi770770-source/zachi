"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

import Link from "next/link";

import { contactSchema, type ContactInput } from "@/lib/validation/contact";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="form-status mt-1 text-sm text-danger">
      {message}
    </p>
  );
}

export function ContactForm() {
  const [status, setStatus] = React.useState<"idle" | "success" | "error">(
    "idle"
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(values: ContactInput) {
    setStatus("idle");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("failed");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {status === "success" ? (
        <div
          role="status"
          className="form-status flex items-center gap-2 rounded-md border border-success/30 bg-success-foreground px-4 py-3 text-sm text-success"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          ההודעה נשלחה בהצלחה. נחזור אליכם בהקדם.
        </div>
      ) : null}
      {status === "error" ? (
        <div
          role="alert"
          className="form-status flex items-center gap-2 rounded-md border border-danger/30 bg-danger-foreground px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          שליחת ההודעה נכשלה. נסו שוב.
        </div>
      ) : null}

      <div>
        <Label htmlFor="name">שם</Label>
        <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="contact">אימייל או טלפון</Label>
        <Input id="contact" aria-invalid={!!errors.contact} {...register("contact")} />
        <FieldError message={errors.contact?.message} />
      </div>

      <div>
        <Label htmlFor="subject">נושא</Label>
        <Input id="subject" aria-invalid={!!errors.subject} {...register("subject")} />
        <FieldError message={errors.subject?.message} />
      </div>

      <div>
        <Label htmlFor="message">הודעה</Label>
        <Textarea
          id="message"
          rows={5}
          aria-invalid={!!errors.message}
          {...register("message")}
        />
        <FieldError message={errors.message?.message} />
      </div>

      {/* שדה honeypot — מוסתר חזותית (sr-only: 1px + clip, בלי הסטה של 9999px
          שהייתה יוצרת overflow אופקי ב-RTL) ומוסר מעץ הנגישות (aria-hidden),
          כך שאינו נראה, אינו מוקרא לקוראי מסך, ואינו משנה את רוחב העמוד. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">אל תמלאו שדה זה</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <p className="text-sm text-foreground-muted">
        בשליחת הטופס אתם מאשרים את{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">מדיניות הפרטיות</Link>.
      </p>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            שולח...
          </>
        ) : (
          "שליחת הודעה"
        )}
      </Button>
    </form>
  );
}
