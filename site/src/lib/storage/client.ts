import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { StorageConfig } from "@/lib/storage/config";

/**
 * יוצר Supabase client שרתי בלבד לצורך גישה ל-Storage הפרטי.
 *
 * - persistSession=false      → אין שמירת סשן (אין קבצי אחסון/עוגיות סשן).
 * - autoRefreshToken=false    → אין רענון אוטומטי של טוקן (סביבת שרת חסרת-מצב).
 * - detectSessionInUrl=false  → לא רלוונטי בשרת; מכבים במפורש.
 *
 * המפתח הסודי (SUPABASE_SECRET_KEY) נשאר בצד השרת בלבד ואינו נחשף ללקוח.
 */
export function createStorageClient(config: StorageConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
