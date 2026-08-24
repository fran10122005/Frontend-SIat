import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const ALLOWED = new Set(
  "áéíóúñüÁÉÍÓÚÑÜ¿¡’‘“”…–—·°".split("").map((c) => c),
);

function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (/\.(js|jsx|css)$/.test(name)) out.push(p);
  }
  return out;
}

for (const file of walk("src")) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, idx) => {
    for (const ch of line) {
      const cp = ch.codePointAt(0);
      if (cp > 126 && !ALLOWED.has(ch)) {
        const safe = line.replace(
          /[^\x20-\x7EáéíóúñüÁÉÍÓÚÑÜ¿¡]/g,
          (m) => `<U+${m.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}>`,
        );
        console.log(`${file}:${idx + 1} [U+${cp.toString(16).toUpperCase()}] ${safe.slice(0, 140)}`);
        break;
      }
    }
  });
}
console.log("--- scan completo ---");
