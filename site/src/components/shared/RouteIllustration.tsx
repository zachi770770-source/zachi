import type { RouteIllustrationData } from "@/content/routeIllustrations";

/**
 * רכיב תצוגה לאיור המסלול של „שאל את הספר”. משתמש ב-<picture> עם AVIF/WebP/JPG
 * (כמו שאר האיורים באתר), עם width/height מפורשים כדי למנוע קפיצת פריסה (CLS),
 * טעינה עצלה, ו-object-contain כך שהאיור מוצג בשלמותו — בלי חיתוך דמויות, בלי
 * מסגרת ובלי צל. הרקע השמנתי של האיור משתלב ברקע האתר.
 *
 * ל„אחרי פרידה” יש גרסת-מובייל נגזרת (חיתוך שוליים ריקים בלבד): מוצגת עד סף
 * ה-sm, והגרסה המלאה מוצגת מעליו — כל אחת עם היחס שלה, כדי שלא תיווצר קפיצת פריסה.
 */

const DIR = "/images/illustrations";
const IMG_CLASS = "block h-auto w-full rounded-2xl object-contain";

function Picture({
  base,
  widths,
  width,
  height,
  alt,
  sizes,
}: {
  base: string;
  widths: number[];
  width: number;
  height: number;
  alt: string;
  sizes: string;
}) {
  const srcSet = (ext: string) =>
    widths.map((w) => `${DIR}/${base}-${w}.${ext} ${w}w`).join(", ");
  return (
    <picture>
      <source type="image/avif" sizes={sizes} srcSet={srcSet("avif")} />
      <source type="image/webp" sizes={sizes} srcSet={srcSet("webp")} />
      <img
        src={`${DIR}/${base}.jpg`}
        width={width}
        height={height}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={IMG_CLASS}
      />
    </picture>
  );
}

export function RouteIllustration({
  illustration,
  className = "",
}: {
  illustration: RouteIllustrationData;
  className?: string;
}) {
  const sizes = "(min-width: 768px) 42rem, 92vw";

  if (illustration.mobile) {
    return (
      <figure className={`mx-auto ${className}`}>
        {/* מובייל: גרסה נגזרת עם שוליים ריקים חתוכים (הדמות גדולה יותר). */}
        <div className="sm:hidden">
          <Picture
            base={illustration.mobile.base}
            widths={[640, 820]}
            width={illustration.mobile.width}
            height={illustration.mobile.height}
            alt={illustration.alt}
            sizes="92vw"
          />
        </div>
        {/* דסקטופ/טאבלט: האיור המלא. */}
        <div className="hidden sm:block">
          <Picture
            base={illustration.base}
            widths={[640, 1024]}
            width={illustration.width}
            height={illustration.height}
            alt={illustration.alt}
            sizes={sizes}
          />
        </div>
      </figure>
    );
  }

  return (
    <figure className={`mx-auto ${className}`}>
      <Picture
        base={illustration.base}
        widths={[640, 1024]}
        width={illustration.width}
        height={illustration.height}
        alt={illustration.alt}
        sizes={sizes}
      />
    </figure>
  );
}
