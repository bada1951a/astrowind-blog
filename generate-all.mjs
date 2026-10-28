// =========================================================================
// 📌 [고정 식별자] 이 파일은 '1호기' 전용 스크립트입니다. (2호기/3호기/4호기/2-1호기 아님!)
// ⚠️ [영구 고정 규칙]
// 1. 카테고리는 대표님의 지시 전까지 'tech'로 영구 고정한다.
// 2. 이미지 경로는 'public/images/tech-photo'로 영구 고정한다.
// 3. LifeWebLab(2-1호기) 명칭 및 설정을 절대 혼용하지 않는다.
// 4. 대표님과의 모든 설명 및 작업 안내는 반드시 100% 한국어로만 진행한다.
// =========================================================================

import fs from 'fs';
import path from 'path';


const DRY_RUN = process.argv.includes('--dry-run');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!DRY_RUN && !OPENAI_API_KEY) throw new Error('OPENAI_API_KEY secret is required.');
const POSTS_BASE_DIR = path.resolve('src/data/post');
const TOPICS_FILE = path.resolve('topics.txt');
const PHOTO_DIR = path.resolve('public/images/tech-photo');

// =========================================================================
// [1호기 전용] public/images/tech-photo 로컬 이미지 자동 셔플
// =========================================================================
const IMAGE_EXTS = /\.(jpe?g|png|webp|gif|avif)$/i;

if (!DRY_RUN && !fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true });

const localFiles = fs.existsSync(PHOTO_DIR) ? fs.readdirSync(PHOTO_DIR).filter(file => IMAGE_EXTS.test(file)) : [];
let localImages = localFiles.map(file => encodeURI(`/images/tech-photo/${file}`));

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
// 한국 시간(KST) 기준 당일 발행 날짜 생성
// =========================================================================
function getKstPublishDateIso(index) {
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kstTime.getUTCFullYear();
  const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getUTCDate()).padStart(2, '0');
  const minute = String((index * 5) % 60).padStart(2, '0');
  return `${year}-${month}-${day}T03:${minute}:00.000Z`;
}

// =========================================================================
// 1호기 12개국 100% 현지어 섹션 제목 및 치환 딕셔너리 (영구 고정)
// =========================================================================
const I18N_SECTIONS = {
  ko: {
    s1: "1. 직장인 식은땀 나는 돌발 상황",
    s2: "2. 오류와 병목의 진짜 핵심 원인 분석",
    s3: "3. 1분 만에 끝내는 단계별 실무 해결법",
    s4: "4. 현직 엔지니어의 핵심 주의사항 및 실무 팁",
    s5: "5. 자주 묻는 질문 (FAQ)",
    tags: ["테크팁", "하드웨어", "트러블슈팅", "PC해결"]
  },
  en: {
    s1: "1. Workplace Emergency Situation",
    s2: "2. Root Cause Breakdown",
    s3: "3. Step-by-Step Practical Resolution",
    s4: "4. Professional Engineer Precautions & Tips",
    s5: "5. Frequently Asked Questions (FAQ)",
    tags: ["Tech Tips", "Hardware", "Troubleshooting", "PC Fix"]
  },
  ja: {
    s1: "1. 職場で冷や汗をかいた緊急トラブル",
    s2: "2. エラーとボトルネックの根本原因",
    s3: "3. 1分で完了する実践的な解決手順",
    s4: "4. 現役エンジニアが教える注意点とコツ",
    s5: "5. よくある質問 (FAQ)",
    tags: ["テックのヒント", "ハードウェア", "トラブルシューティング", "PC解決"]
  },
  de: {
    s1: "1. Kritische Fehlersituation am Arbeitsplatz",
    s2: "2. Detaillierte Ursachenanalyse",
    s3: "3. Schritt-für-Schritt-Lösungsanleitung",
    s4: "4. Praxistipps und Warnungen vom System-Admin",
    s5: "5. Häufig gestellte Fragen (FAQ)",
    tags: ["Tech-Tipps", "Hardware", "Fehlerbehebung", "PC-Reparatur"]
  },
  fr: {
    s1: "1. Situation d'urgence critique au bureau",
    s2: "2. Analyse des causes principales de l'erreur",
    s3: "3. Guide de résolution étape par étape",
    s4: "4. Conseils et précautions d'un expert système",
    s5: "5. Foire Aux Questions (FAQ)",
    tags: ["Astuces Tech", "Matériel", "Dépannage", "Réparation PC"]
  },
  es: {
    s1: "1. Emergencia crítica en el trabajo",
    s2: "2. Análisis detallado de la causa raíz",
    s3: "3. Solución práctica paso a paso",
    s4: "4. Advertencias y consejos de un técnico",
    s5: "5. Preguntas Frecuentes (FAQ)",
    tags: ["Consejos Tech", "Hardware", "Solución de Problemas", "Reparación PC"]
  },
  it: {
    s1: "1. Emergenza improvvisa sul posto di lavoro",
    s2: "2. Analisi approfondita della causa principale",
    s3: "3. Soluzione pratica passo dopo passo",
    s4: "4. Avvertenze e suggerimenti dell'esperto",
    s5: "5. Domande Frequenti (FAQ)",
    tags: ["Consigli Tech", "Hardware", "Risoluzione Problemi", "Assistenza PC"]
  },
  pt: {
    s1: "1. Situação de emergência no trabalho",
    s2: "2. Análise da causa raiz do problema",
    s3: "3. Guia prático de resolução passo a passo",
    s4: "4. Recomendações e alertas de especialistas",
    s5: "5. Perguntas Frequentes (FAQ)",
    tags: ["Dicas Tech", "Hardware", "Solução de Problemas", "Manutenção PC"]
  },
  nl: {
    s1: "1. Noodsituatie op de werkvloer",
    s2: "2. Grondige analyse van de hoofdoorzaak",
    s3: "3. Stapsgewijze praktische oplossing",
    s4: "4. Belangrijke waarschuwingen van IT-specialisten",
    s5: "5. Veelgestelde Vragen (FAQ)",
    tags: ["Tech Tips", "Hardware", "Probleemoplossing", "PC Herstel"]
  },
  pl: {
    s1: "1. Nagła awaria w miejscu pracy",
    s2: "2. Szczegółowa analiza przyczyn źródłowych",
    s3: "3. Praktyczne rozwiązanie krok po kroku",
    s4: "4. Wskazówki i ostrzeżenia eksperta IT",
    s5: "5. Najczęściej zadawane pytania (FAQ)",
    tags: ["Porady Tech", "Sprzęt", "Rozwiązywanie Problemów", "Naprawa PC"]
  },
  id: {
    s1: "1. Situasi Darurat Kritis di Tempat Kerja",
    s2: "2. Analisis Mendalam Akar Masalah",
    s3: "3. Panduan Langkah demi Langkah Penyelesaian Masalah",
    s4: "4. Tips & Peringatan Penting Teknisi IT",
    s5: "5. Pertanyaan yang Sering Diajukan (FAQ)",
    tags: ["Tips Teknologi", "Perangkat Keras", "Troubleshooting", "Perbaikan PC"]
  },
  vi: {
    s1: "1. Tình huống sự cố khẩn cấp tại văn phòng",
    s2: "2. Phân tích nguyên nhân gốc rễ chi tiết",
    s3: "3. Các bước khắc phục sự cố thực tế",
    s4: "4. Lời khuyên và lưu ý quan trọng từ kỹ sư IT",
    s5: "5. Các câu hỏi thường gặp (FAQ)",
    tags: ["Mẹo Công Nghệ", "Phần Cứng", "Khắc Phục Sự Cố", "Sửa Máy Tính"]
  }
};

// =========================================================================
// 🛡️ [1호기 자가 검수 및 치유 엔진: Self-Healing Inspector]
// =========================================================================
function inspectAndHealMarkdown(body) {
  return body.trim()
    .replace(/^(#{1,6}\\s+)\\*\\*([^\\n]*?)\\*\\*/gm, '$1$2')
    .replace(/\\*\\*\\s+([^*\\n]+?)\\s+\\*\\*/g, '**$1**')
    .replace(/\\n{3,}/g, '\\n\\n');
}
function validateGeneratedPost(text, langCode) {
  const errors = [];
  const fm = text.match(/^---\\s*\\r?\\n([\\s\\S]*?)\\r?\\n---\\s*\\r?\\n/);
  if (!fm) return ['frontmatter missing'];
  const meta = fm[1], body = text.slice(fm[0].length);
  for (const field of ['title', 'description', 'publishDate', 'image', 'theme'])
    if (!new RegExp('^' + field + ':\\\\s*\\\\S', 'm').test(meta)) errors.push(field + ' missing');
  if (!/^category:\\s*['"]?tech['"]?\\s*$/m.test(meta)) errors.push('category must be tech');
  const readable = body.replace(/!\\[[^\\]]*\\]\\([^)]*\\)/g,'').replace(/[#*_\\x60>]/g,'');
  const count = langCode === 'ko' ? [...readable.replace(/\\s/g,'')].length : (readable.match(/\\S+/g)||[]).length;
  if (count < (langCode==='ko'?1900:700) || count > (langCode==='ko'?3100:1400)) errors.push('body length '+count);
  const headings = body.match(/^##\\s+[^\\n]+/gm)||[];
  if (headings.length !== 5) errors.push('exactly 5 H2 headings required');
  for(let n=1;n<=5;n++) if(!headings[n-1]?.startsWith('## '+n+'. ')) errors.push('H2 order '+n);
  for(let n=1;n<=3;n++){
    if((body.match(new RegExp('\\\\*\\\\*Q'+n+'\\\\.\\\\*\\\\*','gi'))||[]).length!==1) errors.push('Q'+n+' missing or duplicated');
    if((body.match(new RegExp('\\\\*\\\\*A'+n+'\\\\.\\\\*\\\\*','gi'))||[]).length!==1) errors.push('A'+n+' missing or duplicated');
  }
  if((body.match(/^\\x60\\x60\\x60/gm)||[]).length%2) errors.push('unclosed code fence');
  if(langCode!=='ko' && /[가-힣]/.test(body)) errors.push('Korean in non-Korean article');
  return errors;
}

if (!DRY_RUN && !fs.existsSync(TOPICS_FILE)) {
  console.error("❌ topics.txt 파일이 존재하지 않습니다.");
  process.exit(1);
}

const fileContent = DRY_RUN ? 'offline test topic' : fs.readFileSync(TOPICS_FILE, 'utf-8');
const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

if (lines.length === 0) {
  console.log("⚠️ topics.txt에 남은 주제가 없습니다. 생성을 건너뜁니다.");
  process.exit(0);
}

const currentTopic = lines[0];
console.log(`📌 오늘 처리할 주제: "${currentTopic}"`);

const IT_CRISIS_SCENARIOS_30 = [
  "금요일 퇴근 15분 전, 팀장님과 임원진에게 주간 최종 결산 보고서를 메일로 막 발송하려던 순간",
  "월요일 출근 직후 오전 9시, 전사 주간 정례 킥오프 회의 시작을 앞두고 PC를 켠 순간",
  "야간에 사무실에 홀로 남아 내일 배포할 핵심 시스템 및 데이터 마이그레이션 작업을 진행하던 새벽 1시",
  "점심시간 직후 커피를 들고 자리에 복귀해 오후 첫 업무 창을 띄우는 순간",
  "급한 프로젝트 마감을 위해 밤샘 작업을 이어가던 새벽 4시경 피로가 극에 달한 순간",
  "나른한 목요일 오후 4시, 집중해서 작성하던 중간 납품 검수 문서를 정리하던 순간",
  "휴일 직전 연휴 시작 30분 전, 남은 사내 결재 문서를 모두 승인 처리하려던 타이밍",
  "주말 당직 근무 중 예기치 못한 사내 시스템 에러 알림을 받고 긴급히 PC에 로그인한 상황",
  "해외 출장지 호텔 로비에서 노트북 배터리가 18% 남은 상태로 급히 본사 공유 문서를 열람하던 상황",
  "카페에서 스마트폰 핫스팟(테더링)을 연결해 외부 고객 미팅용 견적서와 설계 도면을 수정하던 오후",
  "재택근무 중 사내 VPN 보안 연결을 걸고 중요한 화상회의(Zoom/Teams) 접속 5분 전",
  "KTX/기차 안에서 이동하며 불안정한 무선 와이파이 상태로 긴급 수정 요청 메일을 확인하던 순간",
  "지방 지사로 출장을 가 현장 회의실 낯선 모니터와 프로젝터에 노트북을 연결하던 상황",
  "고객사 본사 회의실에 방문하여 현장 실무진과 실시간 시스템 화면을 공유하며 시연하기 직전",
  "공항 출국장 라운지에서 탑승 직전 20분을 남겨두고 최종 승인 문서를 전송해야 하는 급박한 상황",
  "스마트오피스 자율좌석에서 처음 연결해 보는 도킹 스테이션과 듀얼 모니터를 세팅하던 아침",
  "월간 데이터 백업을 위해 2TB 분량의 핵심 업무 파일을 외장 SSD와 나스(NAS)로 전송하던 중",
  "사내 IT 보안 감사팀의 분기별 PC 점검 마감 30분 전, 자체 진단 리포트를 생성해 제출해야 하는 상황",
  "새로 지급받은 고사양 개발 및 그래픽 작업용 PC에 필수 사내 라이선스 툴들을 처음 세팅하던 날",
  "수백 명의 직원이 접속하는 사내 인트라넷 게시판에 전사 공지 파일과 첨부 자료를 업로드하던 순간",
  "회계 연도 마감을 앞두고 1년 치 결산 엑셀 시트와 전산 시스템을 교차 검증하던 중요한 시점",
  "대규모 고객 데이터베이스(DB) 쿼리를 실행해 두고 모니터링 창을 지켜보던 긴박한 순간",
  "사내 메신저로 급한 오류 수정 요청이 쏟아져 동시에 5개의 실무 툴을 띄워놓고 멀티태스킹을 하던 중",
  "외부 협력업체에서 보내온 압축 파일과 도면 데이터를 다운로드받아 사내 검사를 진행하려던 찰나",
  "어젯밤 진행된 윈도우 대규모 누적 보안 업데이트 이후 첫 부팅을 마치고 업무를 시작하려던 아침",
  "메인보드 바이오스(BIOS) 펌웨어를 최신 버전으로 올린 뒤 윈도우 진입 화면에서 평소와 다른 증상을 마주한 순간",
  "작업 도중 원인 모를 블루스크린(BSOD)이 스쳐 지나가며 강제 재부팅된 직후의 당혹스러운 상황",
  "백신 실시간 감시 프로그램이 갑자기 시스템 리소스를 100% 점유하며 전체 화면이 멈칫거리던 순간",
  "그래픽카드 드라이버 자동 업데이트가 완료된 후 작업표시줄과 해상도가 비정상적으로 흔들리던 시점",
  "중요한 화상 발표 도중 마이크와 웹캠이 간헐적으로 끊기며 시스템 지연(DPC Latency)이 발생하던 상황"
];

const THEME_PRESETS = [
  { id: 1, name: "Cyberpunk Terminal", primaryColor: "#00ffcc", bgColor: "#111827", layout: "CLI/터미널 스타일, 자동화 단축 경로 최상단 배치" },
  { id: 2, name: "Modern Minimalist Slate", primaryColor: "#3b82f6", bgColor: "#f8fafc", layout: "미니멀 가이드 스타일, 여백 중심의 깔끔한 단계별 넘버링, 직관적 핵심 요약" },
  { id: 3, name: "Industrial Blueprint", primaryColor: "#f59e0b", bgColor: "#1e293b", layout: "엔지니어링 청사진 스타일, 워크플로우 병목 원인 시각화, 쉬운 3단 비교표 포함" },
  { id: 4, name: "Retro Monokai", primaryColor: "#a6e22e", bgColor: "#272822", layout: "개발자 에디터 스타일, 실전 프롬프트 코드 박스 중심 전개, 디버깅 팁" },
  { id: 5, name: "Nordic Clean Ice", primaryColor: "#0284c7", bgColor: "#f0f9ff", layout: "북유럽 감성 클린 레이아웃, 인용구 중심 도입부, 실무 체크리스트" }
];

const TARGET_LANGS = [
  { code: 'ko', name: 'Korean', persona: '친절하고 경험 많은 PC/IT 하드웨어 트러블슈팅 전문가 (현직 테크 엔지니어)', osUi: '작업 관리자, 제어판, 장치 관리자, 이벤트 뷰어, 설정', localeContext: '서울/수도권 IT 및 기업 오피스' },
  { code: 'en', name: 'English', persona: 'Senior IT systems engineer and enterprise tech troubleshooter', osUi: 'Task Manager, Control Panel, Device Manager, Event Viewer, Settings', localeContext: 'Silicon Valley tech enterprise / New York corporate finance office' },
  { code: 'ja', name: 'Japanese', persona: '現場経験豊富な日本のITサポートエンジニア・PCハードウェア専門家', osUi: 'タスクマネージャー, コントロールパネル, デバイスマネージャー, イベントビューアー, 設定', localeContext: '東京・丸の内および品川のビジネスオフィス' },
  { code: 'de', name: 'German', persona: 'Erfahrener IT-Systemadministrator und Hardware-Diagnostiker', osUi: 'Task-Manager, Systemsteuerung, Geräte-Manager, Ereignisanzeige, Einstellungen', localeContext: 'Frankfurter Bankenviertel und Münchner Technologie-Campus' },
  { code: 'fr', name: 'French', persona: 'Ingénieur support informatique et spécialiste de la maintenance PC', osUi: 'Gestionnaire des tâches, Panneau de configuration, Gestionnaire de périphériques, Paramètres', localeContext: 'Siège d\'entreprise à Paris La Défense' },
  { code: 'es', name: 'Spanish', persona: 'Técnico especialista en sistemas informáticos y soporte de hardware', osUi: 'Administrador de tareas, Panel de control, Administrador de dispositivos, Configuración', localeContext: 'Distrito financiero y corporativo en Madrid' },
  { code: 'it', name: 'Italian', persona: 'Tecnico informatico sistemista con ampia experiencia sul campo', osUi: 'Gestione attività, Pannello di controllo, Gestione dispositivi, Impostazioni', localeContext: 'Centro direzionale e poli produttivi a Milano' },
  { code: 'pt', name: 'Portuguese', persona: 'Especialista em manutenção de TI, redes e hardware computacional', osUi: 'Gerenciador de Tarefas, Painel de Controle, Gerenciador de Dispositivos, Configurações', localeContext: 'Avenida Paulista e centros empresariais em São Paulo' },
  { code: 'nl', name: 'Dutch', persona: 'Allround IT-systeembeheerder en computer hardware specialist', osUi: 'Taakbeheer, Configuratiescherm, Apparaatbeheer, Instellingen', localeContext: 'Zuidas zakendistrict in Amsterdam' },
  { code: 'pl', name: 'Polish', persona: 'Inżynier wsparcia IT i serwisant sprzętu komputerowego', osUi: 'Menedżer zadań, Panel sterowania, Menedżer urządzeń, Ustawienia', localeContext: 'Warszawskie centrum biznesowe i technologiczne' },
  { code: 'id', name: 'Indonesian', persona: 'Teknisi senior infrastruktur IT dan troubleshoot hardware komputer', osUi: 'Task Manager, Control Panel, Device Manager, Pengaturan', localeContext: 'Kawasan bisnis Sudirman Central Business District (SCBD) Jakarta' },
  { code: 'vi', name: 'Vietnamese', persona: 'Kỹ sư công nghệ thông tin chuyên xử lý sự cố máy tính và phần cứng', osUi: 'Task Manager, Control Panel, Device Manager, Cài đặt', localeContext: 'Tòa nhà văn phòng trung tâm Quận 1, TP. Hồ Chí Minh' }
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const fileSlug = `post-${Date.now().toString(36)}`;

// =========================================================================
// [호출 함수] maxOutputTokens: 4096 (2,500자 정량 생성 최적화)
// =========================================================================
async function fetchWithRetry(prompt, maxRetries = 3, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-6-luna', input: prompt, max_output_tokens: 6500 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}: ${JSON.stringify(result.error || result).slice(0, 400)}`);
      const output = (result.output || []).flatMap((item) => item.content || [])
        .filter((part) => part.type === 'output_text').map((part) => part.text).join('\n');
      if (!output.trim()) throw new Error('No text in GPT response: ' + (result.status || 'unknown'));
      return output;
    } catch (error) {
      console.warn(`GPT retry ${attempt}/${maxRetries}: ${error.message}`);
      if (attempt === maxRetries) throw error;
      await delay(delayMs * attempt);
    }
  }
}

async function generateSinglePost(lang, index) {
  const selectedTheme = THEME_PRESETS[Math.floor(Math.random() * THEME_PRESETS.length)];
  const selectedScenario = IT_CRISIS_SCENARIOS_30[Math.floor(Math.random() * IT_CRISIS_SCENARIOS_30.length)];
  const i18n = I18N_SECTIONS[lang.code] || I18N_SECTIONS.ko;

  console.log(`\n🚀 [${index + 1}/12] ${lang.name} (${lang.code}) 1호기 본진 애드센스 표준 생성 중... (테마: ${selectedTheme.name})`);

  const { coverUrl, bodyUrl } = getPostImages(index);
  const pubDateIso = getKstPublishDateIso(index);

  // 🎯 [애드센스 승인 최적화 프롬프트: 2,400~2,600자 정량화]
  const prompt = `
You are a ${lang.persona}.
Write a high-quality, practical IT/tech troubleshooting guide natively in ${lang.name}.
Target Culture: "${lang.localeContext}"
Optional illustrative situation (only if directly relevant; never present as a real experience): "${selectedScenario}"
Topic: "${currentTopic}"

[ADSENSE QUALITY & LENGTH REQUIREMENT]
- For Korean (ko): Target 2,400 - 2,600 characters excluding whitespace and Markdown markers, adding helpful diagnosis and edge cases rather than filler.
- For other languages: Write exactly 900 - 1,100 words.
- Tone: Highly informative, professional, practical workplace advice.

[STRUCTURE - STRICT 5 H2 HEADINGS]
Write five native-language, topic-specific H2 headings numbered 1 through 5, without generic unrelated wording:

## ${i18n.s1}
Describe topic-specific symptoms and safe initial checks. Do not fabricate emergencies, personal experiences, professional credentials or guarantees.

## ${i18n.s2}
Explain plausible causes that are specifically relevant to the topic; separate established facts from possible causes.

## ${i18n.s3}
Give three practical, accurate and ordered troubleshooting steps; only use UI labels in "${lang.osUi}" or commands when actually applicable.

## ${i18n.s4}
Give topic-specific checks to verify resolution, realistic exceptions, precautions, and escalation steps.

## ${i18n.s5}
Provide exactly 3 practical Q&A items. You MUST put an empty line between Question and Answer:

**Q1.** Question text

**A1.** Detailed answer (3-4 sentences).

**Q2.** Question text

**A2.** Detailed answer (3-4 sentences).

**Q3.** Question text

**A3.** Detailed answer (3-4 sentences).

[FORMATTING RULES]
1. Never put asterisks (**) inside H2 headings.
2. Bold keywords with strict syntax: **keyword** (no space inside asterisks).
3. Put commands, file paths, or registry keys in inline backticks (e.g. \`taskkill\`, \`devmgmt.msc\`).
${lang.code !== 'ko' ? `- Absolutely NO Korean characters in non-Korean posts.` : ''}

[Strict Output Format]
Return ONLY raw Markdown starting directly with frontmatter:
---
title: "Native Clear Title in ${lang.name}"
description: "Native concise description in ${lang.name} under 160 characters"
publishDate: ${pubDateIso}
image: "${coverUrl}"
category: "tech"
tags: ["replace with 3-5 actual topic-specific native-language tags"]
theme: "${selectedTheme.name}"
---
`;

  try {
    let rawText = await fetchWithRetry(prompt);
    let text = rawText.trim();
    if (text.startsWith('```markdown')) text = text.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

    const fmMatch = text.match(/^---[\s\S]*?---\n*/);
    if (fmMatch) {
      let frontmatter = fmMatch[0].trim();
      let body = text.slice(fmMatch[0].length).trim();
      body = body.replace(/^#\s+[^\n]+\n+/, '');

      // ⚠️ 1호기 카테고리 'tech' 영구 보존 강제 검증
      frontmatter = frontmatter.replace(/category:\s*["'][^"']*["']/i, "category: 'tech'")
                               .replace(/category:\s*[^\n\r]+/i, "category: 'tech'");

      // 🩺 [자가 검수 및 치유 엔진 가동]
      body = inspectAndHealMarkdown(body);

      if (lang.code === 'ko') {
        console.log(`   📏 [1호기 본문 최종 글자 수] ${body.length}자 (애드센스 표준: 2,400~2,600자)`);
      }

      // 본문 중간 이미지 배치 (2번 섹션 직전)
      const middleImageMarkdown = `\n\n![Tech Troubleshooting Guide](${bodyUrl})\n\n`;
      if (body.includes('## 2.')) {
        body = body.replace(/(##\s*2\.[^\n]+)/, `${middleImageMarkdown}$1`);
      } else {
        body = `${middleImageMarkdown}${body}`;
      }

      text = `${frontmatter}\n\n${body}\n`;
    }

    const validationErrors = validateGeneratedPost(text, lang.code);
    if (validationErrors.length) throw new Error('Publishing blocked: ' + validationErrors.join(', '));

    const targetDir = path.join(POSTS_BASE_DIR, lang.code);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, `${fileSlug}.md`);
    fs.writeFileSync(filePath, text, 'utf-8');
    console.log(`   ✅ [성공] 1호기 저장 완료: src/data/post/${lang.code}/${fileSlug}.md`);
    return true;
  } catch (error) {
    console.error(`❌ [최종 실패] ${lang.name} 생성 실패:`, error.message);
    return false;
  }
}

async function run() {
  if (DRY_RUN) {
    console.log('SAFE DRY RUN: no API calls, no files changed, no publishing');
    const sample = '---\\ntitle: sample\\ndescription: sample\\npublishDate: 2026-10-28\\nimage: /images/tech-photo/test.jpg\\ncategory: tech\\ntheme: test\\n---\\n\\n## 1. Test\\nshort';
    if (!validateGeneratedPost(sample,'ko').some(e=>e.startsWith('body length'))) throw new Error('Validation smoke test failed');
    console.log('PASS: short malformed article blocked');
    return;
  }
  console.log("==================================================");
  console.log("⚡ [1호기 본진] (카테고리: tech) 12개국 고속 자동 포스팅 시작");
  console.log("==================================================");

  let successCount = 0;

  for (let i = 0; i < TARGET_LANGS.length; i++) {
    const isSuccess = await generateSinglePost(TARGET_LANGS[i], i);
    if (isSuccess) successCount++;
    if (i < TARGET_LANGS.length - 1) {
      await delay(2000);
    }
  }

  if (successCount === TARGET_LANGS.length) {
    lines.shift();
    fs.writeFileSync(TOPICS_FILE, lines.join('\n'), 'utf-8');
    console.log(`\n🧹 총 ${successCount}개국 포스팅 완료. topics.txt에서 주제를 제거했습니다.`);
    console.log(`📊 남은 주제 수: ${lines.length}개`);
  } else {
    console.error(`\n❌ ${TARGET_LANGS.length - successCount}개 언어 실패. topics.txt 주제를 보존합니다.`);
    process.exit(1);
  }
}

run();
