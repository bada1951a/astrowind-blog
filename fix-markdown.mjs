import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

if (!fs.existsSync(POSTS_BASE_DIR)) {
  console.error(`❌ 포스트 디렉터리를 찾을 수 없습니다: ${POSTS_BASE_DIR}`);
  process.exit(1);
}

function sanitizeMarkdownFormatting(content) {
  let cleaned = content;

  // 1. 마크다운 볼드(**) 기호 제거
  cleaned = cleaned.replace(/\*\*/g, '');

  // 2. [복원] 앞선 스크립트로 인해 잘못 쪼개진 단어 끝 '\n\na.' 원상태로 복원
  // 예: "koelpast\n\na. Zodra" -> "koelpasta. Zodra"
  // 예: "mengatasiny\n\na. Cukup" -> "mengatasinya. Cukup"
  cleaned = cleaned.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]+)\s*\n+\s*a\.\s+([A-Z\u00C0-\u024F\u1EA0-\u1EF9])/g, '$1a. $2');

  // 3. 물음표(?) 뒤에 공백 없이 바로 일반 글자가 오면 띄어쓰기 (?단어 -> ? 단어)
  cleaned = cleaned.replace(/\?([A-Za-z\u00C0-\u024F\u1EA0-\u1EF9가-힣])/g, '? $1');

  // 4. 물음표(?) 뒤에 대문자 Q/A(A:, A1:, Q:, Q1: 등)가 붙은 경우만 두 줄 개행
  cleaned = cleaned.replace(/\?\s*([QA][0-9]*\s*[:.])/g, '?\n\n$1');

  // 5. 문장 부호(.!) 뒤에 대문자 Q/A 또는 번호 목록(1., 2.)이 붙은 경우 두 줄 개행
  cleaned = cleaned.replace(/([.!])\s*([QA][0-9]*\s*[:.]|[0-9]+\.\s+)/g, '$1\n\n$2');

  // 6. 독립된 대문자 Q/A 머리말(앞에 공백이 있는 경우만) 앞 줄바꿈 확보
  cleaned = cleaned.replace(/([^\n])\s+([QA][0-9]*\s*[:.])/g, '$1\n\n$2');
  cleaned = cleaned.replace(/([.!])\s*(D:|R:|Risposta|Domande)/gi, '$1\n\n$2');

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
  console.log("🛠️ 마크다운 서식 정제 및 쪼개진 단어 자동 복원 시작");
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
      console.log(`✅ [복원/수정 완료] ${relativePath}`);
    }
  }

  console.log("\n==================================================");
  console.log(`🎉 작업 완료: 총 ${files.length}개 파일 중 ${modifiedCount}개 파일 수정됨`);
  console.log("==================================================");
}

runFix();
