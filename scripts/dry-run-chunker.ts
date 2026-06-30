// Dry-run: מריץ את ה-chunker על הספר ומדפיס סטטיסטיקות (בלי embeddings, בלי Supabase).
// שימוש: npx tsx scripts/dry-run-chunker.ts

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chunkBook } from "./lib/chunker";

const BOOK_PATH = join(process.cwd(), "content/book/manuscript.txt");

const raw = readFileSync(BOOK_PATH, "utf8");
const chunks = chunkBook(raw);

console.log(`Total chunks: ${chunks.length}`);

const sizes = chunks.map((c) => c.content.length);
sizes.sort((a, b) => a - b);
const median = sizes[Math.floor(sizes.length / 2)];
const min = sizes[0];
const max = sizes[sizes.length - 1];
const avg = Math.round(sizes.reduce((s, n) => s + n, 0) / sizes.length);
console.log(`Sizes — min: ${min}, median: ${median}, avg: ${avg}, max: ${max}`);

const perChapter: Record<string, number> = {};
for (const c of chunks) perChapter[c.chapterKey] = (perChapter[c.chapterKey] ?? 0) + 1;
console.log("\nPer chapter:");
for (const [k, n] of Object.entries(perChapter)) console.log(`  ${k}: ${n}`);

console.log("\nFirst chunk preview:");
console.log(JSON.stringify(chunks[0], null, 2));

console.log("\nA chunk from middle:");
console.log(JSON.stringify(chunks[Math.floor(chunks.length / 2)], null, 2));
