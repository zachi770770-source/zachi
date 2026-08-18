"use client";

import * as React from "react";

import { trackEvent } from "@/lib/analytics";
import type { JourneyId } from "@/content/journeyPages";

/** מזהה-המסע ב-Home (mdl_home_path) המקביל לכל עמוד — כדי לשמור הקשר עקבי גם
 *  בכניסה ישירה לעמוד המסלול (לא רק דרך הבית). */
const JOURNEY_TO_HOME: Record<JourneyId, string> = {
  "before-relationship": "dating",
  "building-relationship": "building",
  "inside-relationship": "existing",
  "after-breakup": "breakup",
  "starting-again": "breakup",
};

const STORAGE_KEY = "mdl_home_path";

/**
 * פינג צד-לקוח לעמוד-מסע: אירוע-צפייה אנונימי (מזהה תחנה בלבד) + שמירת הקשר-המסע
 * המקומי (sessionStorage), כדי שהמנוע והבית יישארו עקביים גם בכניסה ישירה.
 * ללא UI, ללא מידע אישי, ללא שרת.
 */
export function JourneyView({ station }: { station: JourneyId }) {
  React.useEffect(() => {
    trackEvent("journey_page_viewed", { station });
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ path: JOURNEY_TO_HOME[station] }),
      );
    } catch {
      /* אחסון חסום — לא קריטי */
    }
  }, [station]);

  return null;
}
