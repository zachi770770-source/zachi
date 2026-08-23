import { siteConfig } from "@/config/site";

/**
 * תוכן עמוד הנחיתה האנגלי (/en) למהדורה האנגלית של הספר.
 *
 * גבול עובדתי — כל משפט כאן נשען על אחד משלושה מקורות בלבד:
 *   1. כותרת-המשנה הרשמית של המהדורה האנגלית (siteConfig.englishEdition) —
 *      „choosing the right partner”, „red flags”, „building a healthy
 *      relationship”. אלה הנושאים שהמהדורה עצמה מצהירה עליהם.
 *   2. המיצוב הציבורי שכבר מופיע באתר העברי החי: „דייטינג הוא חיפוש, אהבה
 *      היא בנייה”, ושלוש התחנות (רווקים / מתחילים מחדש / זוגות).
 *   3. מה שהאתר כבר אומר על המחבר: כלים מעשיים וגישה אנושית — לא טיפול
 *      ולא אבחון.
 *
 * מה שאין כאן, במכוון: אין דירוגים, אין ביקורות, אין המלצות, אין תארים,
 * אין הסמכות, אין טענות מקצועיות, ואין שמות של כלים מהמהדורה העברית — אלה
 * לא אושרו כקיימים במהדורה האנגלית תחת אותם שמות, והשערה אינה עובדה.
 */
export const en = {
  meta: {
    title: `${siteConfig.englishEdition.title}: ${siteConfig.englishEdition.subtitle}`,
    description:
      "Dating is a search. Love is built. A practical guide by Zachi Hen to choosing the right partner, recognising red flags, and building a relationship that lasts. Available on Amazon.",
  },

  hero: {
    kicker: "The English edition",
    title: siteConfig.englishEdition.title,
    subtitle: siteConfig.englishEdition.subtitle,
    byline: `by ${siteConfig.englishEdition.author}`,
    lead: "Dating is a search. Love is built. Those are two different skills, and most of the pain comes from treating the second like the first.",
    intro:
      "This is a practical guide for people who are tired of dating that goes nowhere, and who would rather understand what keeps repeating than collect more advice.",
    availability: `${siteConfig.englishEdition.format} · on Amazon`,
  },

  about: {
    title: "What the book is about",
    body: [
      "Finding someone and building something with them are not the same process. Dating asks you to search and choose. A relationship asks you to build, repeatedly, with one person. The book separates the two and treats each one on its own terms.",
      "It works through what the edition itself sets out: how to choose a partner with clarity rather than hope, how to tell a genuine red flag from ordinary discomfort, and what actually goes into building a healthy relationship once the early intensity settles.",
    ],
  },

  audience: {
    title: "Who this book is for",
    items: [
      {
        title: "You are dating and it keeps going nowhere",
        body: "Another date that started well and led to nothing, and the same feeling you have had before.",
      },
      {
        title: "You are starting over",
        body: "Coming back to dating after a relationship that mattered, and wanting to do it differently this time.",
      },
      {
        title: "You are in something and unsure",
        body: "There is something real here, and you still cannot tell where it is going.",
      },
    ],
  },

  themes: {
    title: "What the book works on",
    items: [
      {
        title: "Choosing a partner",
        body: "How to make a choice you can stand behind, instead of waiting for certainty that never arrives.",
      },
      {
        title: "Red flags, honestly read",
        body: "Telling the difference between a real reason to stop and a discomfort worth sitting with.",
      },
      {
        title: "Building a healthy relationship",
        body: "What holds a relationship together after the first excitement quiets down.",
      },
      {
        title: "Communication that goes somewhere",
        body: "Saying what you need and setting a boundary without blame, and without apologising for it.",
      },
    ],
  },

  author: {
    title: `About ${siteConfig.englishEdition.author}`,
    body: [
      `${siteConfig.englishEdition.author} writes about dating, choosing a partner and building a relationship. His approach is practical and human: tools you can use, not therapy and not diagnosis.`,
      "zachi.co.il is the official site for the author and the book. The Hebrew edition of the book, and a longer library of guides in Hebrew, live there too.",
    ],
    hebrewSiteLabel: "The Hebrew site",
  },

  cta: {
    title: "Read the book",
    body: `${siteConfig.englishEdition.title} is available on Amazon as a ${siteConfig.englishEdition.format.toLowerCase()}.`,
    button: siteConfig.englishEdition.buyLabel,
  },

  languageSwitch: {
    toHebrew: "עברית",
    toHebrewAria: "עבור לאתר בעברית",
  },
} as const;
