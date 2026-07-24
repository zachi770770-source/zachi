"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle } from "lucide-react";

import { siteConfig } from "@/config/site";
import { checkoutFormSchema } from "@/lib/validation/checkout";
import type { ProductFormat } from "@/lib/pricing";
import { trackEvent } from "@/lib/analytics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type FormValues = z.infer<typeof checkoutFormSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-danger">
      {message}
    </p>
  );
}

export function CheckoutForm({
  quantity,
  format,
}: {
  quantity: number;
  format: ProductFormat;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const idempotencyKeyRef = React.useRef<string>("");

  const requiresShipping = siteConfig.products.formats[format].requiresShipping;

  React.useEffect(() => {
    idempotencyKeyRef.current = crypto.randomUUID();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      format,
      marketingConsent: false,
      giftDedication: "",
      phone: "",
      city: "",
      street: "",
      houseNumber: "",
      apartment: "",
      zip: "",
      courierNotes: "",
    },
  });

  const onSubmit = React.useCallback(
    async (values: FormValues) => {
      setSubmitError(null);
      trackEvent("begin_checkout", { quantity, format });

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }

      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            format,
            quantity,
            idempotencyKey: idempotencyKeyRef.current,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          trackEvent("checkout_error", { reason: data?.error ?? "unknown" });
          setSubmitError(
            data?.error ?? "אירעה שגיאה בעת יצירת ההזמנה. נסו שוב."
          );
          return;
        }

        router.push(data.redirectUrl);
      } catch {
        trackEvent("checkout_error", { reason: "network" });
        setSubmitError("בעיית תקשורת. בדקו את החיבור לאינטרנט ונסו שוב.");
      }
    },
    [quantity, format, router]
  );

  const onFormSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => handleSubmit(onSubmit)(event),
    [handleSubmit, onSubmit]
  );

  return (
    <form onSubmit={onFormSubmit} noValidate className="flex flex-col gap-6">
      {submitError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-foreground px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {submitError}
        </div>
      ) : null}

      <input type="hidden" {...register("format")} />

      {requiresShipping ? (
        <div className="rounded-xl bg-surface-muted p-4 text-[14px] leading-relaxed text-foreground-muted">
          בחרתם מהדורה מודפסת. נזדקק לפרטי המשלוח שלכם וכן לכתובת מייל
          למעקב אחר ההזמנה.
        </div>
      ) : (
        <div className="rounded-xl bg-surface-muted p-4 text-[14px] leading-relaxed text-foreground-muted">
          זוהי מהדורה דיגיטלית. אנחנו צריכים רק שם וכתובת מייל — הגישה
          לספר תישלח לכתובת שתזינו כאן. אין צורך בכתובת למשלוח.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">שם מלא</Label>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
          <FieldError message={errors.fullName?.message} />
        </div>

        <div>
          <Label htmlFor="email">
            אימייל {requiresShipping ? "(למעקב אחר ההזמנה)" : "(לקבלת הגישה)"}
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        {requiresShipping ? (
          <>
            <div>
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              <FieldError message={errors.phone?.message} />
            </div>

            <div>
              <Label htmlFor="city">יישוב</Label>
              <Input
                id="city"
                autoComplete="address-level2"
                aria-invalid={!!errors.city}
                {...register("city")}
              />
              <FieldError message={errors.city?.message} />
            </div>

            <div>
              <Label htmlFor="street">רחוב</Label>
              <Input
                id="street"
                autoComplete="address-line1"
                aria-invalid={!!errors.street}
                {...register("street")}
              />
              <FieldError message={errors.street?.message} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="houseNumber">מספר בית</Label>
                <Input
                  id="houseNumber"
                  aria-invalid={!!errors.houseNumber}
                  {...register("houseNumber")}
                />
                <FieldError message={errors.houseNumber?.message} />
              </div>
              <div>
                <Label htmlFor="apartment">דירה (אופציונלי)</Label>
                <Input id="apartment" {...register("apartment")} />
              </div>
            </div>

            <div>
              <Label htmlFor="zip">מיקוד (אופציונלי)</Label>
              <Input
                id="zip"
                autoComplete="postal-code"
                inputMode="numeric"
                {...register("zip")}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="courierNotes">הערות לשליח (אופציונלי)</Label>
              <Textarea id="courierNotes" rows={2} {...register("courierNotes")} />
            </div>
          </>
        ) : null}

        {siteConfig.commerce.giftDedicationEnabled ? (
          <div className="sm:col-span-2">
            <Label htmlFor="giftDedication">הקדשה אישית (אופציונלי)</Label>
            <Textarea id="giftDedication" rows={2} {...register("giftDedication")} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-5">
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="agreeToTerms"
            render={({ field }) => (
              <Checkbox
                id="agreeToTerms"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={!!errors.agreeToTerms}
              />
            )}
          />
          <Label htmlFor="agreeToTerms" className="font-normal leading-relaxed">
            קראתי ואני מסכים/ה ל
            <Link href="/terms" className="text-brand underline underline-offset-2">
              תקנון האתר
            </Link>
            {" "}ול
            <Link href="/privacy" className="text-brand underline underline-offset-2">
              מדיניות הפרטיות
            </Link>
          </Label>
        </div>
        <FieldError message={errors.agreeToTerms?.message} />

        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="marketingConsent"
            render={({ field }) => (
              <Checkbox
                id="marketingConsent"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <Label htmlFor="marketingConsent" className="font-normal leading-relaxed">
            אשמח לקבל עדכונים ותוכן בדיוור (לא הכרחי לביצוע ההזמנה)
          </Label>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            מעבד הזמנה...
          </>
        ) : (
          "מעבר לתשלום"
        )}
      </Button>
    </form>
  );
}
