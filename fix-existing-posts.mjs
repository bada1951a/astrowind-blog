import fs from 'fs';
import path from 'path';

// 포스트 저장 경로 (규격: src/data/post)
const POSTS_DIR = path.resolve('src/data/post');

function cleanBoldIssues(content) {
  let cleaned = content;

  // 1. 80자 이상의 거대 볼드 블록 폭주 해제 (1호기 시커먼 덩어리 정상 복구)
  cleaned = cleaned.replace(/\*\*([^*]{80,})\*\*/g, '$1');

  // 2. 문단 끝 짝 맞지 않는 외톨이 ** 태그 제거 (파싱 붕괴 방지)
  cleaned = cleaned.split('\n').map(line => {
    const boldCount = (line.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) {
      // 짝이 안 맞으면 마지막 덜 닫힌 ** 제거
      return line.replace(/\*\*(?![\s\S]*\*\*)/, '');
    }
    return line;
  }).join('\n');

  // 3. 본문에 볼드가 아예 전멸한 경우 (2호기): 문단당 핵심 키워드 1개씩 선별 강조
  const totalBolds = (cleaned.match(/\*\*[^*]+\*\*/g) || []).length;
  if (totalBolds === 0) {
    cleaned = cleaned.replace(/(###?\s+.+\n\n)([가-힣A-Za-z0-9\s]{10,25})([,\s])/g, '$1**$2**$3');
  }

  return cleaned;
}

function runFix() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`❌ 경로를 찾을 수 없습니다: ${POSTS_DIR}`);
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
  console.log(`🔍 총 ${files.length}개 포스트 검사 시작...`);

  // 오늘 날짜 포스트 또는 최신 파일 위주로 정밀 타격
  files.forEach(file => {
    const filePath = path.join(POSTS_DIR, file);
    const original = fs.readFileSync(filePath, 'utf-8');
    const fixed = cleanBoldIssues(original);

    if (original !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf-8');
      console.log(`✅ 수정 완료: ${file}`);
    } else {
      console.log(`⏺ 정상 통과: ${file}`);
    }
  });

  console.log('🎉 기존 글 볼드/서식 복구 작업이 끝났습니다.');
}

runFix();
