import fs from 'node:fs';
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY is not registered or available to this workflow');
const topic = '윈도우 11에서 와이파이 연결됨 표시가 뜨지만 인터넷이 안 될 때 해결 방법';
const prompt = `Write a high-quality original Korean tech troubleshooting article about: ${topic}.
Do not invent firsthand experiences, diagnoses, guaranteed fixes, or nonexistent settings.
Produce exactly five numbered topic-specific Markdown H2 sections: 1 symptoms and first checks, 2 likely causes, 3 precise ordered fixes, 4 verification and exceptions, 5 FAQ.
FAQ must contain three clearly separated **Q1.**/**A1.** through **Q3.**/**A3.** pairs.
Target 2400-2600 Korean characters excluding whitespace, Markdown syntax, and frontmatter. Avoid filler and generic paragraphs.
Include complete valid YAML frontmatter with title, description, publishDate: 2026-10-28, image: /images/tech-photo/sample.jpg, category: tech, theme: sky, tags: [native topic-specific Korean tags].
Output only the complete Markdown document. No markdown outer code fences.`;
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'gpt-6-luna', input: prompt, max_output_tokens: 6500 })
});
const data = await response.json();
if (!response.ok) throw new Error('OpenAI HTTP ' + response.status + ': ' + JSON.stringify(data.error || {}).slice(0,300));
const text = (data.output || []).flatMap(item => item.content || []).filter(p => p.type === 'output_text').map(p => p.text).join('\n');
if (!text.trim()) throw new Error('Empty output; response status: ' + data.status);
fs.mkdirSync('tmp-luna-quality-review', { recursive: true });
fs.writeFileSync('tmp-luna-quality-review/ko-sample.md', text);
const body = text.replace(/^---[\s\S]*?---\s*/, '');
const chars = [...body.replace(/\s|[#*_\x60>]/g,'')].length;
const h2 = (body.match(/^##\s+/gm) || []).length;
const questions = (body.match(/\*\*Q[1-3]\.\*\*/g) || []).length;
const answers = (body.match(/\*\*A[1-3]\.\*\*/g) || []).length;
console.log(JSON.stringify({ model: 'gpt-6-luna', status: data.status, characters_excluding_whitespace: chars, h2_count: h2, faq_questions: questions, faq_answers: answers, usage: data.usage, published: false }));
if (!text.startsWith('---') || h2 !== 5 || questions !== 3 || answers !== 3 || chars < 1900) throw new Error('Sample quality gate failed; inspect saved artifact');
