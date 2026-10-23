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

  // 2. [가장 중요] 앞서 잘못 쪼개져 저장된 모든 단어 끝 '\n\na.' 강제 원상복구
  //    (sistem \n\n a. -> sistema. / limpi \n\n a. -> limpia. / koelpast \n\n a. -> koelpasta.)
  cleaned = cleaned.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]+)\s*\n+\s*a\.\s*/g, '$1a. ');

  // 3. 스페인어 특수 물음표(¿) 및 느낌표(¡) 앞 뭉침 분리 (예: intactos.¿Qué -> intactos.\n\n¿Qué)
  cleaned = cleaned.replace(/([.?!])\s*([¿¡])/g, '$1\n\n$2');

  // 4. 일반 물음표(?) 뒤에 공백 없이 글자가 붙은 경우 띄어쓰기 (?단어 -> ? 단어)
  cleaned = cleaned.replace(/\?([A-Za-z\u00C0-\u024F\u1EA0-\u1EF9가-힣])/g, '? $1');

  // 5. 물음표(?) 뒤에 오직 '대문자' Q/A가 오는 경우만 두 줄 개행 (소문자 절대 건드리지 않음)
  cleaned = cleaned.replace(/\?\s*([QA][0-9]*\s*[:.])/g, '?\n\n$1');

  // 6. 마침표(.)나 느낌표(!) 뒤에 '대문자' Q/A 또는 번호 목록(1., 2.)이 올 때 두 줄 개행
  cleaned = cleaned.replace(/([.!])\s*([QA][0-9]*\s*[:.]|[0-9]+\.\s+)/g, '$1\n\n$2');

  // 7. 다국어 헤더 줄바꿈
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
  console.log("🛠️ 단어 쪼개짐 복원 및 마크다운 최종 종결 정제 시작");
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
      console.log(`✅ [복원/교정 완료] ${relativePath}`);
    }
  }

  console.log("\n==================================================");
  console.log(`🎉 총 ${files.length}개 중 ${modifiedCount}개 파일 복원 및 수정 완료`);
  console.log("==================================================");
}

runFix();
