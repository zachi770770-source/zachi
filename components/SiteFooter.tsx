export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-cream-300/60 bg-cream-50/50">
      <div className="container-wide py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="font-display text-lg text-burgundy-700">מדייטים לאהבה</div>
          <p className="mt-1 text-sm text-ink-500">דייטינג הוא חיפוש. אהבה היא בנייה.</p>
        </div>
        <p className="text-xs text-ink-400">
          מבוסס על הספר והשיטה. המידע כאן הוא חינוכי ואינו מחליף ייעוץ מקצועי.
        </p>
      </div>
    </footer>
  );
}
