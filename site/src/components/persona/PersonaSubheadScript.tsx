import { personaHooks, PERSONA_QUERY_PARAM } from "@/content/personas";

/**
 * סקריפט קדם-צביעה למניעת „הבזק כותרת-המשנה”.
 *
 * ה-SSR מגיש תמיד את כותרת-המשנה הכללית (הדיפולט) — כך הקרולר וכל מבקר-ללא-JS
 * מקבלים בדיוק את המסר הכללי, בלי אף מילה מהפרסונות בגוף ה-HTML. אבל למבקר חוזר
 * (persona ב-localStorage) או לכניסה ייעודית (?persona=) נרצה שהכותרת המותאמת
 * תופיע כבר בצביעה הראשונה, בלי הבזק של הטקסט הכללי.
 *
 * הסקריפט הזה רץ סינכרונית בזמן פענוח ה-HTML — מיד אחרי אלמנט כותרת-המשנה
 * (#hero-subhead) ולפני הצביעה — פותר את הפרסונה (URL קודם, אחרת localStorage)
 * ומחליף את הטקסט לפני שהמשתמש רואה אותו. מפת ה-hooks יושבת בתוך הסקריפט (JS),
 * לא בגוף העמוד. הפרובайдר מסנכרן את שאר האתר (פילים/CTA/בר דביק) אחרי ה-mount.
 *
 * דפוס זהה ל-JsonLd הקיים: <script> אינליין המרונדר בקומפוננטת-שרת.
 */
export function PersonaSubheadScript({ targetId }: { targetId: string }) {
  const hooks = JSON.stringify(personaHooks());
  const code = `(function(){try{
var el=document.getElementById(${JSON.stringify(targetId)});if(!el)return;
var V={single:1,breakup:1,divorced:1,married:1},p=null;
try{p=new URLSearchParams(location.search).get(${JSON.stringify(
    PERSONA_QUERY_PARAM
  )});}catch(e){}
if(!p||!V[p]){p=null;try{p=localStorage.getItem('mlc.persona.v1');}catch(e){}}
if(!p||!V[p])return;
var H=${hooks};
if(H[p]){el.textContent=H[p];}
document.documentElement.setAttribute('data-persona',p);
}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
