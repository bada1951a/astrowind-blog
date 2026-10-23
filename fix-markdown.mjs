import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

if (!fs.existsSync(POSTS_BASE_DIR)) {
  console.error(`❌ 포스트 디렉터리를 찾을 수 없습니다: ${POSTS_BASE_DIR}`);
  process.exit(1);
}

function sanitizeMarkdownFormatting(content) {
  let cleaned = content.replace(/\*\*/g, '');

  cleaned = cleaned.replace(/([.?!])\s*([0-9]+\.\s+|[QA][1-9]\s*[:.])/gi, '$1\n\n$2');
  cleaned = cleaned.replace(/([?])\s*([QA][1-9]\s*[:.])/gi, '$1\n\n$2');
  cleaned = cleaned.replace(/\?([A-Za-z\u00C0-\u024F\u1EA0-\u1EF9])/g, '? $1');
  cleaned = cleaned.replace(/([^\n])\s*([QA][1-9]\s*[:.])/gi, '$1\n\n$2');
  cleaned = cleaned.replace(/([.?!])\s*(D:|R:|Risposta|Domande)/gi, '$1\n\n$2');

  return cleaned;
}

function getAllMdFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllMdFiles(fullPath, fileList);
    } else if (stat.isFile() && item.endsWith('.md')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function runFix() {
  console.log("==================================================");
  console.log("🛠️ 기존 포스트 전체 일괄 서식 정제 작업 시작");
  console.log("==================================================");

  const files = getAllMdFiles(POSTS_BASE_DIR);
  console.log(`📁 검사 대상 파일: 총 ${files.length}개\n`);

  let modifiedCount = 0;

  for (const filePath of files) {
    const originalContent = fs.readFileSync(filePath, 'utf-8');

    const fmMatch = originalContent.match(/^---[\s\S]*?---\n*/);
    let frontmatter = '';
    let body = originalContent;

    if (fmMatch) {
      frontmatter = fmMatch[0];
      body = originalContent.slice(frontmatter.length);
    }

    const fixedBody = sanitizeMarkdownFormatting(body);
    const newContent = `${frontmatter}${fixedBody}`;

    if (newContent !== originalContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      modifiedCount++;
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`✅ [수정 완료] ${relativePath}`);
    }
  }

  console.log("\n==================================================");
  console.log(`🎉 작업 완료: 총 ${files.length}개 파일 중 ${modifiedCount}개 파일 수정됨`);
  console.log("==================================================");
}

runFix();
