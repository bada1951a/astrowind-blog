// Read-only Markdown QA: node scripts/audit-posts.mjs
// Does not modify articles. Flags are candidates for human review, not proof of defects.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
const root = 'src/data/post';
const findings = [];
const totals = {};
const languages = await readdir(root, { withFileTypes: true });
for (const dir of languages.filter(x => x.isDirectory())) {
  const lang = dir.name;
  const files = (await readdir(path.join(root, lang))).filter(x => /\.mdx?$/.test(x));
  totals[lang] = files.length;
  for (const file of files) {
    const filePath = path.join(root, lang, file);
    const text = await readFile(filePath, 'utf8');
    const lines = text.split(/\r?\n/);
    let front = false, frontEnd = false, fenced = false;
    const headings = new Map();
    const add = (line, code, excerpt) => findings.push({ file: filePath, line, code, excerpt: excerpt.trim().slice(0, 170) });
    for (let i = 0; i < lines.length; i++) {
      const s = lines[i];
      if (i === 0 && s.trim() === '---') { front = true; continue; }
      if (front && !frontEnd) { if (s.trim() === '---') frontEnd = true; continue; }
      if (/^\s*(```|~~~)/.test(s)) { fenced = !fenced; continue; }
      if (fenced) continue;
      const n = i + 1;
      if ((s.match(/(?<!\\)\*\*/g) || []).length % 2) add(n, 'unpaired-bold-on-line', s);
      if (/^#{1,6}\s+.*\*\*/.test(s)) add(n, 'bold-markers-in-heading', s);
      if (/^#{1,6}\s+/.test(s)) {
        const h = s.replace(/^#{1,6}\s+/, '').replace(/\*\*/g, '').trim().toLocaleLowerCase();
        if (headings.has(h)) add(n, 'duplicate-heading', s);
        else headings.set(h, n);
      }
      if (lang !== 'ko' && /[가-힣]{3,}/.test(s)) add(n, 'korean-in-non-korean', s);
      if (lang === 'ko' && /[가-힣]\*\*[^*]+\*\*[가-힣]|[가-힣][A-Za-z]{4,}[가-힣]/.test(s)) add(n, 'suspect-korean-spacing', s);
      if (/^#{1,6}\s+.*(?:Q\d+\.|A\d+\.).*(?:Q\d+\.|A\d+\.)/.test(s)) add(n, 'faq-question-answer-joined', s);
    }
    const title = text.match(/^title:\s*['"]?(.+?)['"]?\s*$/m)?.[1]?.replace(/['"]$/, '').trim().toLocaleLowerCase();
    if (title && headings.has(title)) add(headings.get(title), 'title-repeated-in-body', title);
    if (fenced) add(lines.length, 'unclosed-code-fence', lines.at(-1) || '');
  }
}
const byCode = Object.fromEntries([...new Set(findings.map(x => x.code))].map(k => [k, findings.filter(x => x.code === k).length]));
console.log(JSON.stringify({ totalFiles: Object.values(totals).reduce((a,b)=>a+b,0), byLanguage: totals, totalFlags: findings.length, byCode, findings }, null, 2));
