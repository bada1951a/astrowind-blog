import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

if (!fs.existsSync(POSTS_BASE_DIR)) {
  console.error(`❌ 포스트 디렉터리를 찾을 수 없습니다: ${POSTS_BASE_DIR}`);
  process.exit(1);
}

// =========================================================================
// 모든 예외 케이스(숫자 유무, 마침표, 콜론, 다국어 헤더 전체) 종결 처리 함수
// =========================================================================
function sanitizeMarkdownFormatting(content) {
  let cleaned = content;

  // 1. 마크다운 볼드(**) 기호 일괄 제거
  cleaned = cleaned.replace(/\*\*/g, '');

  // 2. 물음표(?) 뒤에 공백 없이 바로 일반 글자가 오면 강제 띄어쓰기 (?단어 -> ? 단어)
  cleaned = cleaned.replace(/\?([A-Za-z\u00C0-\u024F\u1EA0-\u1EF9가-힣])/g, '? $1');

  // 3. 물음표(?) 바로 뒤에 질문/답변(A:, A1:, A., Q:, Q1: 등)이 붙어 있으면 강제 두 줄 개행
  cleaned = cleaned.replace(/\?\s*([QA][0-9]*\s*[:.])/gi, '?\n\n$1');

  // 4. 마침표(.)나 느낌표(!) 뒤에 질문/답변(Q:, A:, Q1:, A1: 등) 또는 번호 목록(1., 2.)이 붙어 있으면 강제 두 줄 개행
  cleaned = cleaned.replace(/([.!])\s*([QA][0-9]*\s*[:.]|[0-9]+\.\s+)/gi, '$1\n\n$2');

  // 5. 문장 중간에 줄바꿈 없이 섞여 들어간 모든 형태의 Q/A 및 다국어 머리말 강제 분리
  cleaned = cleaned.replace(/([^\n])\s*([QA][0-9]*\s*[:.])/gi, '$1\n\n$2');
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
  console.log("🛠️ 모든 언어/패턴 마크다운 완전 정제 시작");
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
