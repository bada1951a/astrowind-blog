import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const POSTS_BASE_DIR = path.resolve('src/data/post');
const TOPICS_FILE = path.resolve('topics.txt');

if (!fs.existsSync(TOPICS_FILE)) {
  console.error("❌ topics.txt 파일이 존재하지 않습니다.");
  process.exit(1);
}

const fileContent = fs.readFileSync(TOPICS_FILE, 'utf-8');
const lines = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

if (lines.length === 0) {
  console.log("⚠️ topics.txt에 남은 주제가 없습니다. 생성을 건너뜁니다.");
  process.exit(0);
}

const currentTopic = lines[0];
console.log(`📌 오늘 처리할 주제: "${currentTopic}"`);

const TARGET_LANGS = [
  { code: 'ko', name: 'Korean', persona: '한국 IT 인프라/하드웨어 엔지니어', osUi: '장치 관리자, 디스크 관리, 명령 프롬프트' },
  { code: 'en', name: 'English', persona: 'Silicon Valley Senior Systems Engineer', osUi: 'Device Manager, Disk Management, Command Prompt' },
  { code: 'ja', name: 'Japanese', persona: '日本のITインフラエンジニア', osUi: 'デバイス マネージャー, ディスクの管理, コマンド プロンプト' },
  { code: 'de', name: 'German', persona: 'Deutscher IT-Systemadministrator', osUi: 'Geräte-Manager, Datenträgerverwaltung, Eingabeaufforderung' },
  { code: 'fr', name: 'French', persona: 'Ingénieur système informatique français', osUi: 'Gestionnaire de périphériques, Gestion des disques, Invite de commandes' },
  { code: 'es', name: 'Spanish', persona: 'Ingeniero de soporte de infraestructura TI español', osUi: 'Administrador de dispositivos, Administración de discos, Símbolo del sistema' },
  { code: 'it', name: 'Italian', persona: 'Ingegnere sistemista hardware italiano', osUi: 'Gestione dispositivi, Gestione disco, Prompt dei comandi' },
  { code: 'pt', name: 'Portuguese', persona: 'Especialista em infraestrutura e hardware de TI brasileiro', osUi: 'Gerenciador de Dispositivos, Gerenciamento de Disco, Prompt de Comando' },
  { code: 'nl', name: 'Dutch', persona: 'Nederlandse IT-infrastructuurspecialist', osUi: 'Apparaatbeheer, Schijfbeheer, Opdrachtprompt' },
  { code: 'pl', name: 'Polish', persona: 'Polski inżynier wsparcia IT i systemów operacyjnych', osUi: 'Menedżer urządzeń, Zarządzanie dyskami, Wiersz polecenia' },
  { code: 'id', name: 'Indonesian', persona: 'Spesialis teknisi IT dan perangkat keras Indonesia', osUi: 'Device Manager, Manajemen Disk, Command Prompt' },
  { code: 'vi', name: 'Vietnamese', persona: 'Kỹ sư phần cứng 및 hỗ trợ IT doanh nghiệp Việt Nam', osUi: 'Device Manager, Disk Management, Command Prompt' }
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const fileSlug = `tech-${Date.now().toString(36)}`;

// 5분 동안 재시도하며 API 호출하는 핵심 함수
async function fetchWithRetry(prompt, maxRetries = 15, delayMs = 20000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.warn(`⚠️ [호출 지연/에러] 시도 ${attempt}/${maxRetries}: ${error.message}`);
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`⏳ ${delayMs / 1000}초 동안 대기 후 다시 시도합니다... (최대 5분 대기 로직)`);
      await delay(delayMs);
    }
  }
}

async function generateSinglePost(lang, index) {
  console.log(`\n🚀 [${index + 1}/12] ${lang.name} (${lang.code}) 포스팅 생성 중...`);

  const postDate = new Date();
  const baseMinutes = 8 * 60 + 30 + Math.floor(index * 75);
  postDate.setHours(Math.floor(baseMinutes / 60), baseMinutes % 60, 0, 0);
  const pubDateIso = postDate.toISOString();

  const prompt = `
You are a ${lang.persona}.
Write a highly practical, authoritative, first-person technical troubleshooting guide natively in ${lang.name}.
CRITICAL: DO NOT translate literally. Write from scratch using authentic local industry tone, idioms, and native OS terminology.

[Topic]
${currentTopic}

[Mandatory Writing Structure (AdSense E-E-A-T Compliant)]
1. Introduction: Realistic 1st-person work experience solving this exact issue in an office or field environment.
2. Root Cause Breakdown: Clearly explain 3 realistic root causes.
3. Step-by-Step Resolution:
   - Use official local OS terminology matching: "${lang.osUi}".
   - Provide exact diagnostic and repair steps with relevant commands if applicable.
4. Expert Warning / Advice: Practical precautions to prevent hardware or data loss.
5. Frequently Asked Questions (FAQ): Exactly 3 realistic, high-value Q&As.

[Length & Quality Rules]
- Korean (ko): Minimum 2,500 characters of rich, deep text.
- Other languages: 1,200 to 1,500 words of thorough technical explanation.

[Strict Output Format]
Return ONLY raw Markdown. DO NOT wrap the output in markdown code fences. Begin immediately with the frontmatter:

---
title: "Native Catchy Title in ${lang.name}"
description: "Native concise description in ${lang.name} under 160 characters"
publishDate: ${pubDateIso}
category: "Hardware"
tags: ["Tech", "Troubleshooting", "Hardware"]
---

# Title
(Body starts here)
`;

  try {
    let rawText = await fetchWithRetry(prompt);
    let text = rawText.trim();
    if (text.startsWith('```markdown')) text = text.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

    const targetDir = path.join(POSTS_BASE_DIR, lang.code);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, `${fileSlug}.md`);
    fs.writeFileSync(filePath, text, 'utf-8');
    console.log(`✅ [성공] 저장 완료: src/data/post/${lang.code}/${fileSlug}.md`);
    return true;
  } catch (error) {
    console.error(`❌ [최종 실패] ${lang.name} 생성 실패:`, error.message);
    return false;
  }
}

async function run() {
  console.log("==================================================");
  console.log("🌍 12개국 자동 포스팅 파이프라인 시작 (대기열 자동 복구 탑재)");
  console.log("==================================================");

  let successCount = 0;

  for (let i = 0; i < TARGET_LANGS.length; i++) {
    const isSuccess = await generateSinglePost(TARGET_LANGS[i], i);
    if (isSuccess) successCount++;
    if (i < TARGET_LANGS.length - 1) {
      await delay(5000);
    }
  }

  // 최소 1개 이상이라도 성공했을 때만 주제 삭제
  if (successCount > 0) {
    lines.shift();
    fs.writeFileSync(TOPICS_FILE, lines.join('\n'), 'utf-8');
    console.log(`\n🧹 총 ${successCount}개국 발행 완료. topics.txt에서 주제를 삭제했습니다.`);
    console.log(`📊 남은 주제 수: ${lines.length}개`);
  } else {
    console.error("\n❌ 모든 언어 생성이 실패하여 topics.txt를 유지합니다.");
    process.exit(1);
  }
}

run();
