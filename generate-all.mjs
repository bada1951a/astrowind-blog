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
const PHOTO_DIR = path.resolve('public/images/tech-photo');

// =========================================================================
// [1호기 전용] public/images/tech-photo 로컬 이미지 자동 셔플 풀 구축
// =========================================================================
const IMAGE_EXTS = /\.(jpe?g|png|webp|gif|avif)$/i;

if (!fs.existsSync(PHOTO_DIR)) {
  fs.mkdirSync(PHOTO_DIR, { recursive: true });
}

const localFiles = fs.readdirSync(PHOTO_DIR).filter(file => IMAGE_EXTS.test(file));
let localImages = localFiles.map(file => `/images/tech-photo/${file}`);

// 폴더에 사진이 없을 경우를 대비한 안전 대체 경로
if (localImages.length === 0) {
  console.warn("⚠️ public/images/tech-photo 에 이미지가 없습니다. 기본 이미지를 사용합니다.");
  localImages = ['/images/default-tech.jpg'];
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const shuffledPool = shuffleArray(localImages);

function getPostImages(index) {
  const coverUrl = shuffledPool[(index * 2) % shuffledPool.length];
  const bodyUrl = shuffledPool[(index * 2 + 1) % shuffledPool.length];
  return { coverUrl, bodyUrl };
}

// =========================================================================
// 주제 확인
// =========================================================================
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
console.log(`📌 오늘 처리할 주제 (1호기 메인 IT/Tech): "${currentTopic}"`);

// 30가지 고유 시각 스타일 및 글 구조 테마 프리셋
const THEME_PRESETS = [
  { id: 1, name: "Cyberpunk Terminal", primaryColor: "#00ffcc", bgColor: "#111827", layout: "CLI/터미널 스타일, 자동화 단축 경로 최상단 배치" },
  { id: 2, name: "Modern Minimalist Slate", primaryColor: "#3b82f6", bgColor: "#f8fafc", layout: "미니멀 가이드 스타일, 여백 중심의 깔끔한 단계별 넘버링, 직관적 핵심 요약" },
  { id: 3, name: "Industrial Blueprint", primaryColor: "#f59e0b", bgColor: "#1e293b", layout: "엔지니어링 청사진 스타일, 워크플로우 병목 원인 시각화, 쉬운 3단 비교표 포함" },
  { id: 4, name: "Retro Monokai", primaryColor: "#a6e22e", bgColor: "#272822", layout: "개발자 에디터 스타일, 실전 프롬프트 코드 박스 중심 전개, 디버깅 팁" },
  { id: 5, name: "Nordic Clean Ice", primaryColor: "#0284c7", bgColor: "#f0f9ff", layout: "북유럽 감성 클린 레이아웃, 인용구 중심 도입부, 실무 체크리스트" },
  { id: 6, name: "Dark Velvet Obsidian", primaryColor: "#a855f7", bgColor: "#0f172a", layout: "고급 다크 모드, 전문가 독점 자동화 팁 배너, 단계별 문제 해결 타임라인" },
  { id: 7, name: "Crimson Emergency Field", primaryColor: "#ef4444", bgColor: "#fff1f2", layout: "긴급 오류 복구 매뉴얼 스타일, 위험 경고 박스 최우선 강조, FAQ 아코디언형" },
  { id: 8, name: "Forest Emerald Bio", primaryColor: "#10b981", bgColor: "#f0fdf4", layout: "칼퇴 효율 가이드 스타일, 시간 절약 지표 박스, 친절하고 명쾌한 어조" },
  { id: 9, name: "Solarized Amber Warm", primaryColor: "#d97706", bgColor: "#fef3c7", layout: "실무 공방 노트 스타일, 실측 작업시간 단축 분석표, 초보자 세팅 팁" },
  { id: 10, name: "Deep Ocean Cobalt", primaryColor: "#2563eb", bgColor: "#eff6ff", layout: "표준 소프트웨어 매뉴얼 지침서, 원인 분석 심층 다이어그램 텍스트, 권장 설정 안내" },
  { id: 11, name: "Tokyo Neon Violet", primaryColor: "#8b5cf6", bgColor: "#2e1065", layout: "파워유저 최적화 스타일, 실행 속도 및 단축키 비교, 커스텀 세팅 팁" },
  { id: 12, name: "Graphite Technical Paper", primaryColor: "#475569", bgColor: "#f1f5f9", layout: "깔끔한 기술 백서 스타일, 수식/코드 원인 가설 및 검증 절차, 표준화된 결론" },
  { id: 13, name: "High-Contrast Charcoal", primaryColor: "#e11d48", bgColor: "#18181b", layout: "고대비 경보 스타일, 데이터 손실 방지 수칙, 긴급 롤백 팁 박스" },
  { id: 14, name: "Warm Coffee Latte", primaryColor: "#78350f", bgColor: "#fefae0", layout: "초보자를 위한 친절한 오피스 수필 가이드, 쉬운 비유법, 차근차근 따라하기" },
  { id: 15, name: "Steel Silver Metallic", primaryColor: "#64748b", bgColor: "#e2e8f0", layout: "공식 기술지원 티켓 스타일, 증상 체크리스트, 사전 자가진단표" },
  { id: 16, name: "Sunset Horizon Coral", primaryColor: "#f97316", bgColor: "#fff7ed", layout: "생산성 꿀팁 세팅 스타일, 전후 비교 표, 추천 프롬프트 모음 배너" },
  { id: 17, name: "Mint Fresh Engineering", primaryColor: "#059669", bgColor: "#ecfdf5", layout: "가벼운 워크플로우 최적화 매뉴얼, 불필요한 단계 정리 팁, 명쾌한 솔루션" },
  { id: 18, name: "Midnight Navy Royal", primaryColor: "#1d4ed8", bgColor: "#172554", layout: "야간 배포 로그 스타일, 치명적 수식 에러 극복 타임스탬프, 재발 방지책" },
  { id: 19, name: "Matte Black stealth", primaryColor: "#ffffff", bgColor: "#09090b", layout: "전문 실무 가이드 스타일, 불필요한 서술 배제, 직관적인 단계별 설명" },
  { id: 20, name: "Teal Matrix Digital", primaryColor: "#14b8a6", bgColor: "#042f2e", layout: "API 및 데이터 연동 분석 스타일, 웹훅 신호 및 트리거 점검 체크리스트" },
  { id: 21, name: "Pastel Lavender Tech", primaryColor: "#7c3aed", bgColor: "#faf5ff", layout: "사용자 경험 중심 가이드, 실무자가 가장 자주 묻는 질문 5선 최상단 요약 배치" },
  { id: 22, name: "Bronze Artisan Workshop", primaryColor: "#b45309", bgColor: "#fffbeb", layout: "스프레드시트 튜닝 가이드, 대량 데이터 처리 시 주의 박스, 준비물 목록" },
  { id: 23, name: "Cobalt Enterprise Lab", primaryColor: "#1e40af", bgColor: "#dbeafe", layout: "엔터프라이즈 실사용 생산성 리포트 형식, 비용 및 시간 절감 수치 인용" },
  { id: 24, name: "Rosewood Hardware Guide", primaryColor: "#be123c", bgColor: "#ffe4e6", layout: "생산성 툴 매니아 분석기, 버전별/플랫폼별 기능 차이점 설명, 설정 기준표" },
  { id: 25, name: "Deep Indigo System", primaryColor: "#4338ca", bgColor: "#e0e7ff", layout: "시스템 자동화 파이프라인 분석 형식, 불필요한 수작업 병목 식별법" },
  { id: 26, name: "Acid Lime Hacker Space", primaryColor: "#84cc16", bgColor: "#14532d", layout: "유용한 무료 노코드 툴 가이드, 안전한 데이터 연동 안내" },
  { id: 27, name: "Sandstone Desert Minimal", primaryColor: "#a16207", bgColor: "#fefce8", layout: "깔끔한 실무 매뉴얼 스타일, 소제목 하단 1줄 핵심 팁 강조 배너" },
  { id: 28, name: "Dracula Purple Dev", primaryColor: "#bd93f9", bgColor: "#282a36", layout: "전통 드라큘라 테마 스타일, 필수 단축키 및 복구 함수 하이라이트" },
  { id: 29, name: "Electric Cyan Speed", primaryColor: "#06b6d4", bgColor: "#ecfeff", layout: "초고속 1분 해결 가이드 형식, 빠른 조치법 -> 심층 세팅 2단계 분리" },
  { id: 30, name: "Pure Titanium Clean", primaryColor: "#334155", bgColor: "#ffffff", layout: "초고화질 매뉴얼 스타일, 볼드 타이포그래피 강조, 깔끔한 구분선" }
];

// 글로벌 12개국 페르소나 및 실무 환경
const TARGET_LANGS = [
  { code: 'ko', name: 'Korean', persona: '친절하고 경험 많은 PC/IT 하드웨어 트러블슈팅 전문가 (현직 테크 엔지니어)', osUi: '작업 관리자, 제어판, 장치 관리자, 이벤트 뷰어, 설정', localeContext: '서울/수도권 IT 사무실, 중요한 프레젠테이션 직전 PC 오류로 식은땀 나는 상황' },
  { code: 'en', name: 'English', persona: 'Senior IT systems engineer and enterprise tech troubleshooter', osUi: 'Task Manager, Control Panel, Device Manager, Event Viewer, Settings', localeContext: 'Silicon Valley tech HQ / NYC office, 20 minutes before a company-wide board meeting' },
  { code: 'ja', name: 'Japanese', persona: '現場経験豊富な日本のITサポートエンジニア・PCハードウェア専門家', osUi: 'タスクマネージャー, コントロールパネル, デバイスマネージャー, イベントビューアー, 設定', localeContext: '東京・丸の内のオフィス、月次報告書の送信直前にPCがフリーズした危機的状況' },
  { code: 'de', name: 'German', persona: 'Erfahrener IT-Systemadministrator und Hardware-Diagnostiker', osUi: 'Task-Manager, Systemsteuerung, Geräte-Manager, Ereignisanzeige, Einstellungen', localeContext: 'Frankfurter Bankenviertel, dringende Systemwiederherstellung vor Kundenpräsentation' },
  { code: 'fr', name: 'French', persona: 'Ingénieur support informatique et spécialiste de la maintenance PC', osUi: 'Gestionnaire des tâches, Panneau de configuration, Gestionnaire de périphériques, Paramètres', localeContext: 'Bureau à Paris La Défense, panne subite de poste de travail avant clôture des dossiers' },
  { code: 'es', name: 'Spanish', persona: 'Técnico especialista en sistemas informáticos y soporte de hardware', osUi: 'Administrador de tareas, Panel de control, Administrador de dispositivos, Configuración', localeContext: 'Oficina corporativa en Madrid, fallo crítico del equipo en plena entrega de proyecto' },
  { code: 'it', name: 'Italian', persona: 'Tecnico informatico sistemista con ampia esperienza sul campo', osUi: 'Gestione attività, Pannello di controllo, Gestione dispositivi, Impostazioni', localeContext: 'Centro direzionale di Milano, blocco improvviso del sistema prima dell\'invio report' },
  { code: 'pt', name: 'Portuguese', persona: 'Especialista em manutenção de TI, redes e hardware computacional', osUi: 'Gerenciador de Tarefas, Painel de Controle, Gerenciador de Dispositivos, Configurações', localeContext: 'Ambiente empresarial em São Paulo, pane de máquina minutos antes da reunião de diretoria' },
  { code: 'nl', name: 'Dutch', persona: 'Allround IT-systeembeheerder en computer hardware specialist', osUi: 'Taakbeheer, Configuratiescherm, Apparaatbeheer, Instellingen', localeContext: 'Zuidas zakendistrict Amsterdam, acute computerstoring voor een grote presentatie' },
  { code: 'pl', name: 'Polish', persona: 'Inżynier wsparcia IT i serwisant sprzętu komputerowego', osUi: 'Menedżer zadań, Panel sterowania, Menedżer urządzeń, Ustawienia', localeContext: 'Warszawskie centrum biznesowe, awaria stacji roboczej przed kluczowym spotkaniem' },
  { code: 'id', name: 'Indonesian', persona: 'Teknisi senior infrastruktur IT dan troubleshoot hardware komputer', osUi: 'Task Manager, Control Panel, Device Manager, Pengaturan', localeContext: 'Kawasan Sudirman Jakarta, kepanikan mendadak saat PC crash jelang tenggat laporan' },
  { code: 'vi', name: 'Vietnamese', persona: 'Kỹ sư công nghệ thông tin chuyên xử lý sự cố máy tính và phần cứng', osUi: 'Task Manager, Control Panel, Device Manager, Cài đặt', localeContext: 'Văn phòng trung tâm TP.HCM, máy tính gặp sự cố nghiêm trọng ngay trước giờ nộp báo cáo' }
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const fileSlug = `post-${Date.now().toString(36)}`;

async function fetchWithRetry(prompt, maxRetries = 15, delayMs = 20000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.warn(`⚠️ [호출 지연/에러] 시도 ${attempt}/${maxRetries}: ${error.message}`);
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`⏳ ${delayMs / 1000}초 동안 대기 후 다시 시도합니다...`);
      await delay(delayMs);
    }
  }
}

async function generateSinglePost(lang, index) {
  const selectedTheme = THEME_PRESETS[Math.floor(Math.random() * THEME_PRESETS.length)];

  console.log(`\n🚀 [${index + 1}/12] ${lang.name} (${lang.code}) 1호기 메인 IT 포스팅 생성 중... (적용 테마: ${selectedTheme.name})`);

  // 로컬 사진 셔플 풀에서 이미지 배정
  const { coverUrl, bodyUrl } = getPostImages(index);

  const postDate = new Date();
  const baseMinutes = 8 * 60 + 30 + Math.floor(index * 75);
  postDate.setHours(Math.floor(baseMinutes / 60), baseMinutes % 60, 0, 0);
  const pubDateIso = postDate.toISOString();

  const prompt = `
You are a ${lang.persona}.
Write a highly practical, conversational, 1st-person IT hardware troubleshooting guide natively in ${lang.name}.
CRITICAL: DO NOT translate literally from Korean. Write completely from scratch as an authentic native technician.

[Topic]
${currentTopic}

[Workplace Scenario]
Context: "${lang.localeContext}"

[CRITICAL OUTPUT LANGUAGE INTEGRITY - ZERO HANGUL IN GLOBAL POSTS]
- If target language is NOT Korean (ko):
  * Absolutely NEVER include any Korean Hangul characters (가-힣) anywhere in the title, description, tags, or body.
  * Every single character in the title and description MUST strictly be in native ${lang.name}.

[WRITING STYLE: PLAIN & PRACTICAL FOR EVERYDAY PROFESSIONALS]
1. Plain & Easy Explanations:
    - Avoid overly abstract academic theory.
    - Write in warm, friendly, everyday language that any desk worker or technician can immediately follow.
    - Give concrete steps and clear clicks matching: "${lang.osUi}".
2. Laser-Focused Narrative:
    - The opening emergency story MUST be 100% strictly about the assigned [Topic] (${currentTopic}).

[TECHNICAL TEXT FORMATTING RULE (STRICT NO LATEX)]
- ABSOLUTELY FORBIDDEN: NEVER use LaTeX math delimiters or academic math symbols (DO NOT use $, $$, \\times, \\approx, \\degree).
- Always use plain, human-readable numbers, formulas, and units:
  * Write "42°C" instead of "$42^{\\circ}C$"
- Clean 2-column key-value lists or bulleted cards instead of overly wide 4-column tables that break on mobile screens.

[Design Theme & Layout Dynamic Rules (MANDATORY)]
- Assigned Theme: "${selectedTheme.name}"
- Primary Accent Color: ${selectedTheme.primaryColor}
- Layout Characteristic: ${selectedTheme.layout}
- You MUST incorporate native Markdown and inline styled HTML callouts tailored to this theme.
- Use custom styled tip/warning boxes (e.g., <div style="border-left: 4px solid ${selectedTheme.primaryColor}; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">...</div>).
  * CRITICAL: All text inside callout/tip/warning boxes MUST be crisp dark charcoal/black (color: #111827) so it is 100% legible against any background.

[Tone & Writing Style Rules (STRICT - NO AI VIBE)]
1. Mandatory Opening:
    - Absolutely FORBIDDEN: Boring textbook intros like "Hello", "In this post", "Today we will explore".
    - Start immediately with an intense, relatable workplace emergency scenario strictly about [Topic].
2. Tone & Voice:
    - Write like a real colleague sharing an honest, battle-tested solution on a professional community.
3. Fast-Paced 3-Step Narrative:
    - Step 1: Sudden workflow panic regarding [Topic] set in ${lang.localeContext}.
    - Step 2: Wasted manual effort and trial-and-error.
    - Step 3: The breakthrough actionable tip & clear step-by-step setup.

[Content & Structure (AdSense E-E-A-T Compliant)]
1. Opening Story: Intense real workplace incident strictly regarding this topic.
2. Root Cause Breakdown: Clearly explain 3 realistic root causes behind the bottleneck or error.
3. Step-by-Step Resolution:
    - Provide exact clicks matching "${lang.osUi}".
4. Expert Warning / Advice: Practical precautions regarding hardware, power, or data safety.
5. Frequently Asked Questions (FAQ): Exactly 3 realistic, high-value Q&As that everyday users would ask.

[Length & Richness Rules]
- Korean (ko): Minimum 2,500 characters of rich, deep, non-repetitive text.
- Other languages: 1,200 to 1,500 words of thorough practical explanation.

[Strict Output Format]
Return raw Markdown starting with frontmatter:
---
title: "Native Catchy Title in ${lang.name}"
description: "Native concise description in ${lang.name} under 160 characters"
publishDate: ${pubDateIso}
image: "${coverUrl}"
category: "tech"
tags: ["Tech Tips", "Hardware", "Troubleshooting", "PC Fix"]
theme: "${selectedTheme.name}"
---
(Body starts directly here without H1 header)
`;

  try {
    let rawText = await fetchWithRetry(prompt);
    let text = rawText.trim();
    if (text.startsWith('```markdown')) text = text.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

    text = text.replace(/\$([^$]+)\$/g, '$1')
               .replace(/\\times/g, 'x')
               .replace(/\\circ/g, '°')
               .replace(/\\approx/g, '≈');

    if (lang.code !== 'ko') {
      text = text.replace(/(title:\s*")([^"]*)(")/g, (match, p1, p2, p3) => `${p1}${p2.replace(/[가-힣]+/g, '').trim()}${p3}`);
      text = text.replace(/(description:\s*")([^"]*)(")/g, (match, p1, p2, p3) => `${p1}${p2.replace(/[가-힣]+/g, '').trim()}${p3}`);
    }

    const fmMatch = text.match(/^---[\s\S]*?---\n*/);
    if (fmMatch) {
      let frontmatter = fmMatch[0];
      let body = text.slice(frontmatter.length).trim();
      body = body.replace(/^#\s+[^\n]+\n+/, '');

      // 1호기 영구 고정 규칙: category: 'tech'
      frontmatter = frontmatter.replace(/category:\s*["'][^"']*["']/i, "category: 'tech'")
                               .replace(/category:\s*[^\n\r]+/i, "category: 'tech'");

      // Cloudflare 빌드 실패 방지: publishDate 따옴표 제거
      frontmatter = frontmatter.replace(/publishDate:\s*["']([^"']+)["']/i, "publishDate: $1");

      // 대표 이미지 경로 강제 동기화
      frontmatter = frontmatter.replace(/image:\s*["'][^"']*["']/i, `image: '${coverUrl}'`);

      const middleImageMarkdown = `\n\n![${currentTopic} Tech Guide](${bodyUrl})\n\n`;
      if (body.includes('## 2.') || body.includes('### 2.')) {
        body = body.replace(/(#{2,3}\s*2\.[^\n]+)/, `${middleImageMarkdown}$1`);
      } else {
        const paragraphs = body.split('\n\n');
        if (paragraphs.length >= 3) {
          paragraphs.splice(2, 0, middleImageMarkdown.trim());
          body = paragraphs.join('\n\n');
        } else {
          body = `${middleImageMarkdown}${body}`;
        }
      }

      text = `${frontmatter}\n${body}\n`;
    }

    const targetDir = path.join(POSTS_BASE_DIR, lang.code);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, `${fileSlug}.md`);
    fs.writeFileSync(filePath, text, 'utf-8');
    console.log(`✅ [성공] 1호기 저장 완료: src/data/post/${lang.code}/${fileSlug}.md (로컬 사진 적용 완료)`);
    return true;
  } catch (error) {
    console.error(`❌ [최종 실패] ${lang.name} 생성 실패:`, error.message);
    return false;
  }
}

async function run() {
  console.log("==================================================");
  console.log("⚡ 1호기 Tech/IT 12개국 로컬 사진 기반 자동 포스팅 파이프라인 시작");
  console.log("==================================================");

  let successCount = 0;

  for (let i = 0; i < TARGET_LANGS.length; i++) {
    const isSuccess = await generateSinglePost(TARGET_LANGS[i], i);
    if (isSuccess) successCount++;
    if (i < TARGET_LANGS.length - 1) {
      await delay(5000);
    }
  }

  if (successCount > 0) {
    lines.shift();
    fs.writeFileSync(TOPICS_FILE, lines.join('\n'), 'utf-8');
    console.log(`\n🧹 총 ${successCount}개국 포스팅 완료. topics.txt에서 주제를 삭제했습니다.`);
    console.log(`📊 남은 주제 수: ${lines.length}개`);
  } else {
    console.error("\n❌ 모든 언어 생성이 실패하여 topics.txt를 유지합니다.");
    process.exit(1);
  }
}

run();
