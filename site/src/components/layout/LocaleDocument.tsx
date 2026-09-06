"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { isEnglishPath } from "@/lib/language";

/**
 * מסנכרן את `lang`/`dir` של `<html>` עם שפת-המסלול. ה-root layout מרנדר
 * `<html lang="he" dir="rtl">` (ברירת-המחדל של האתר), אך „/en” הוא עמוד אנגלי
 * ל-LTR — וקורא-מסך, בורר-טקסט ופריסת-הדפדפן חייבים לדעת זאת ברמת-המסמך, לא רק
 * על עטיפת-התוכן. אין סגמנט-שפה במסלול (ראו ההחלטה ב-`/en/page.tsx`), ולכן
 * הנתיב הוא מקור-האמת. סקריפט קטן ב-`<head>` כבר קובע זאת טרם-הצביעה בטעינה
 * ישירה של „/en” (ללא הבהוב); כאן שומרים על הסנכרון גם בניווט צד-לקוח.
 */
export function LocaleDocument() {
  const pathname = usePathname();
  React.useEffect(() => {
    const english = isEnglishPath(pathname);
    const el = document.documentElement;
    el.lang = english ? "en" : "he";
    el.dir = english ? "ltr" : "rtl";
  }, [pathname]);
  return null;
}
