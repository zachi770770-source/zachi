import { bookMap } from "@/content/sample";
import { Container } from "@/components/shared/Container";

/**
 * „מפת הספר החיה” — שלוש התחנות של הספר, כל אחת עם שם פרק, השאלה שהיא
 * עוזרת לבחון ומשפט קצר. התנועה מבוססת-גלילה היא CSS טהור
 * (animation-timeline: view()) עם fallback מלא: דפדפנים ללא תמיכה ומצב
 * prefers-reduced-motion מציגים את התחנות במלואן, ללא תנועה. אין JS.
 */
export function BookMap() {
  return (
    <section className="book-map py-14 sm:py-16" aria-labelledby="book-map-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="kicker">{bookMap.eyebrow}</span>
          <h2 id="book-map-heading" className="type-h2 mt-4">
            {bookMap.title}
          </h2>
          <p className="type-lead mt-4 text-foreground-muted">{bookMap.intro}</p>
        </div>

        <ol className="book-map__list mx-auto mt-9 max-w-3xl">
          {bookMap.stations.map((station) => (
            <li key={station.order} className="book-map__station">
              <span className="book-map__order" aria-hidden="true">
                {station.order}
              </span>
              <div className="book-map__body">
                <p className="book-map__chapter">{station.chapter}</p>
                <h3 className="book-map__name">{station.name}</h3>
                <p className="book-map__examines">{station.examines}</p>
                <p className="book-map__line">{station.line}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
