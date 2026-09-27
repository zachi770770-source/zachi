import { pageMetadata } from "@/lib/seo";
import { guides } from "@/content/guides";
import { GuidePage } from "@/components/guides/GuidePage";

const guide = guides["relationship-doubts"];

export const metadata = pageMetadata({
  // ה-<title> נקבע כאן ולא דרך `guide.metaTitle`, כי metaTitle משמש גם כטקסט
  // גלוי (פירורי-הלחם וכרטיס המדריך בעמוד-התחנה). כך משתנה רק הכותרת בחיפוש
  // ובשיתוף, בלי לגעת בטקסט הגלוי. הנוסח מבחין בין העמוד הזה לבין
  // /guide/fear-of-commitment, שנשא כותרת כמעט זהה („איך יודעים אם זה פחד או
  // חוסר התאמה”), ונשען על ההבחנה שהמדריך עצמו עושה: ספק נקודתי מול דפוס חוזר.
  title: "ספקות בזוגיות: ספק נקודתי או סימן לחוסר התאמה?",
  description: guide.metaDescription,
  path: guide.path,
  ogType: "article",
});

export default function Page() {
  return <GuidePage guide={guide} />;
}
