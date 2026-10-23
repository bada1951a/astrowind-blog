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

  // 2. [핵심 복원 1] 앞서 잘못 잘린 단어 끝 '\n\na.' 원상태로 복원
  // 예: "sistem \n\n a." -> "sistema.", "koelpast \n\n a." -> "koelpasta."
  cleaned = cleaned.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]+)\s*\n+\s*a\.\s*/g, '$1a. ');

  // 3. [핵심 복원 2] 번호(1., 2.) 바로 밑으로 떨어져 버린 스페인어 질문(¿...)을 번호 옆으로 한 줄 복구
  // 예: "1.\n\n¿Qué" -> "1. ¿Qué"
  cleaned = cleaned.replace(/([0-9]+\.)\s*\n+\s*([¿¡])/g, '$1 $2');

  // 4. 문장 끝 부호 뒤에 붙어버린 스페인어 부호(¿, ¡) 분리 (단, 숫자 뒤 마침표 제외)
  cleaned = cleaned.replace(/([^0-9][.?!])\s*([¿¡])/g, '$1\n\n$2');

  // 5. 물음표 뒤 띄어쓰기 누락 보정 (?단어 -> ? 단어)
  cleaned = cleaned.replace(/\?([A-Za-z\u00C0-\u024F\u1EA0-\u1EF9가-힣])/g, '? $1');

  // 6. 물음표(?) 뒤 대문자 Q/A(Q:, A:, Q1: 등) 강제 2줄 개행
  cleaned = cleaned.replace(/\?\s*([QA][0-9]*\s*[:.])/g, '?\n\n$1');

  // 7. 문장 부호(.!) 뒤 대문자 Q/A 또는 번호 목록(1., 2.) 강제 2줄 개행
  cleaned = cleaned.replace(/([.!])\s*([QA][0-9]*\s*[:.]|[0-9]+\.\s+)/g, '$1\n\n$2');

  // 8. 독립된 대문자 Q/A 및 다국어 머리말 개행 확보
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
  console.log("🛠️ 기존 포스트 마크다운/스페인어 개행 일괄 복구 시작");
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
      console.log(`✅ [복구 완료] ${relativePath}`);
    }
  }

  console.log("\n==================================================");
  console.log(`🎉 총 ${files.length}개 중 ${modifiedCount}개 파일 완벽 수정 완료`);
  console.log("==================================================");
}

runFix();
