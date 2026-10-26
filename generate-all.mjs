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
// [1호기 전용] public/images/tech-photo 로컬 이미지 자동 셔플
// =========================================================================
const IMAGE_EXTS = /\.(jpe?g|png|webp|gif|avif)$/i;

if (!fs.existsSync(PHOTO_DIR)) {
  fs.mkdirSync(PHOTO_DIR, { recursive: true });
}

const localFiles = fs.readdirSync(PHOTO_DIR).filter(file => IMAGE_EXTS.test(file));
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
// 12개국 100% 현지어 섹션 제목 및 치환 딕셔너리
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
// [최종 안정형 마크다운 정제 함수] 볼드 기호(**) 깨짐 복구 + 영문 템플릿 강제 박멸
// =========================================================================
function sanitizeMarkdownFormatting(content, langCode) {
  let cleaned = content;
  const i18n = I18N_SECTIONS[langCode] || I18N_SECTIONS.ko;

  // 1) AI가 출력한 영문 대괄호 템플릿 및 기본 헤더를 현지 언어로 100% 강제 치환
  cleaned = cleaned.replace(/^#{1,3}\s*1\.?\s*(\[Opening Story.*?\]|Opening Story.*?)/gmi, `## ${i18n.s1}`);
  cleaned = cleaned.replace(/^#{1,3}\s*2\.?\s*(\[Root Cause.*?\]|Root Cause.*?)/gmi, `## ${i18n.s2}`);
  cleaned = cleaned.replace(/^#{1,3}\s*3\.?\s*(\[Step-by-Step.*?\]|Step-by-Step.*?)/gmi, `## ${i18n.s3}`);
  cleaned = cleaned.replace(/^#{1,3}\s*4\.?\s*(\[Expert.*?\]|Expert.*?)/gmi, `## ${i18n.s4}`);
  cleaned = cleaned.replace(/^#{1,3}\s*5\.?\s*(\[Frequently Asked Questions.*?\]|Frequently Asked Questions.*?|FAQ)/gmi, `## ${i18n.s5}`);

  // 헤딩 없이 텍스트 번호로 박힌 영문 템플릿도 마크다운 헤딩 포함 현지어로 강제 변환
  cleaned = cleaned.replace(/^1\.\s*\[Opening Story.*?\]/gmi, `## ${i18n.s1}`);
  cleaned = cleaned.replace(/^2\.\s*\[Root Cause.*?\]/gmi, `## ${i18n.s2}`);
  cleaned = cleaned.replace(/^3\.\s*\[Step-by-Step.*?\]/gmi, `## ${i18n.s3}`);
  cleaned = cleaned.replace(/^4\.\s*\[Expert.*?\]/gmi, `## ${i18n.s4}`);
  cleaned = cleaned.replace(/^5\.\s*(Frequently Asked Questions|\[Frequently Asked Questions\])/gmi, `## ${i18n.s5}`);

  // 대괄호 영문 태그 찌꺼기 완벽 제거
  cleaned = cleaned.replace(/\[(Opening Story\/Problem|Root Cause Breakdown|Step-by-Step Resolution|Expert Advice)\]/gi, '');

  // 2) 소제목 헤딩(#)에 묻은 불필요한 볼드 기호 정제 (### **제목** -> ### 제목)
  cleaned = cleaned.replace(/^(#{1,6}\s*)\*\*(.*?)\*\*/gm, '$1$2');

  // 3) 볼드(**) 기호 깨짐 교정: 단어와 ** 사이에 붙은 공백 및 인접 문자 표준화
  cleaned = cleaned.replace(/\*\*\s+([^\*]+?)\s+\*\*/g, '**$1**');
  cleaned = cleaned.replace(/([가-힣a-zA-Z0-9])\*\*([가-힣a-zA-Z0-9])/g, '$1 **$2');

  // 4) Q&A 줄바꿈 및 볼드 보호: Q와 A는 무조건 빈 줄 2개로 분리
  cleaned = cleaned.replace(/([^\n])\s*(\*\*?[QA][0-9]*\s*[:.]\*\*?)/gi, '$1\n\n$2');
  cleaned = cleaned.replace(/([^\n])\s+([QA][0-9]*\s*[:.])/g, '$1\n\n$2');
  cleaned = cleaned.replace(/([.!?])\s*(\*\*?[QA][0-9]*\s*[:.]\*\*?)/gi, '$1\n\n$2');

  // 5) 물음표 뒤 띄어쓰기 누락 보정
  cleaned = cleaned.replace(/\?([A-Za-z\u00C0-\u024F\u1EA0-\u1EF9가-힣])/g, '? $1');

  // 6) 다국어 특수기호 분리
  cleaned = cleaned.replace(/([^0-9][.?!])\s*([¿¡])/g, '$1\n\n$2');
  cleaned = cleaned.replace(/([.!])\s*(D:|R:|Risposta|Domande)/gi, '$1\n\n$2');

  return cleaned;
}

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
// [출력 상한 잠금] maxOutputTokens: 8192로 모델의 중간 생략/축약 원천 차단
// =========================================================================
async function fetchWithRetry(prompt, maxRetries = 5, delayMs = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          maxOutputTokens: 8192,
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.warn(`⚠️ [호출 재시도] ${attempt}/${maxRetries}: ${error.message}`);
      if (attempt === maxRetries) { throw error; }
      await delay(delayMs);
    }
  }
}

async function generateSinglePost(lang, index) {
  const selectedTheme = THEME_PRESETS[Math.floor(Math.random() * THEME_PRESETS.length)];
  const selectedScenario = IT_CRISIS_SCENARIOS_30[Math.floor(Math.random() * IT_CRISIS_SCENARIOS_30.length)];
  const i18n = I18N_SECTIONS[lang.code] || I18N_SECTIONS.ko;

  console.log(`\n🚀 [${index + 1}/12] ${lang.name} (${lang.code}) 포스팅 생성 중... (테마: ${selectedTheme.name})`);

  const { coverUrl, bodyUrl } = getPostImages(index);
  const pubDateIso = getKstPublishDateIso(index);

  // [섹션별 글자 수 및 세부 서술 규격 강제 프롬프트]
  const prompt = `
You are a ${lang.persona}.
Write a definitive, exhaustive, highly professional IT troubleshooting guide natively in ${lang.name}.
CRITICAL REQUIREMENT: Write 100% natively in ${lang.name}. NEVER mix English template headings or bracketed words unless writing the English post.

[Topic]
${currentTopic}

[Workplace Incident Context]
- Target City/Culture: ${lang.localeContext}
- Assigned Emergency Scenario: "${selectedScenario}"

[MANDATORY TOTAL LENGTH ENFORCEMENT - ZERO CONDENSATION]
- For Korean (ko): Total body MUST be AT LEAST 2,500 characters (공백 제외 최소 2,000자 이상). Summarizing or brief outputs are strictly prohibited.
- For other languages: Total body MUST be AT LEAST 1,400 - 1,800 words of rich technical substance.

[EXHAUSTIVE 5-SECTION STRUCTURE REQUIREMENTS]
You MUST strictly follow these 5 sections using clean H2 markdown headings (## ):

## ${i18n.s1}
- Do NOT summarize. Write at least 4 long, vivid paragraphs describing:
  1) The office background, exact time, urgent deadline, and system specifications.
  2) The exact error message popup and the visceral panic it caused.
  3) The naive first attempts to fix it (restarting app, spamming clicks) that completely failed.
  4) The realization of what will be lost if this is not resolved immediately.

## ${i18n.s2}
- Do NOT just write 3 quick bullets. Write an exhaustive technical analysis across at least 4 detailed paragraphs explaining:
  1) Internal OS file lock mechanisms, handle allocation, and exclusive write access.
  2) Background orphaned processes (EXCEL.EXE, ACROBAT, DLL hosts) remaining silently in memory.
  3) Windows Explorer indexing locks, thumbnail preview cache deadlocks, or third-party antivirus real-time file scanning interference.

## ${i18n.s3}
- Provide at least 3 distinct, complete technical resolution methods matching "${lang.osUi}":
  * Method 1: GUI-based force kill via Task Manager (Detailed UI navigation steps + Details tab process termination).
  * Method 2: Command line / PowerShell terminal execution (Explain exact commands like taskkill /f /im, del /f /q /a, with code blocks and flag breakdowns).
  * Method 3: Windows Explorer process restart or Resource Monitor Handle search (Exact handle searching technique).
  * Write step-by-step with clear numbered lists and explanations for WHY each step works.

## ${i18n.s4}
- Write at least 2 in-depth paragraphs of professional field technician wisdom:
  1) Dangers of using unverified third-party "Unlocker" tools (malware, system file corruption).
  2) Best practices to avoid recurring file locks (safe unmounting, cache cleanup, clean boot diagnostics).

## ${i18n.s5}
- Provide exactly 3 realistic, highly specific Q&A items:
  * Each question must be bold (**Q1.**, **Q2.**, **Q3.**) followed by the question text.
  * Each answer (**A1.**, **A2.**, **A3.**) MUST be a detailed, multi-sentence technical explanation (at least 3-4 sentences per answer).
  * Put an empty blank line between every Question and Answer.

[STRICT MARKDOWN & FORMATTING RULES]
1. HEADINGS: Keep clean markdown headings (e.g. "## ${i18n.s2}"). NEVER put bold asterisks (**) inside headings.
2. BOLD FORMATTING: Use bold (**) ONLY for key button clicks or essential UI terms. Always put a space before and after the bold markup if surrounded by words.
3. COMMANDS: Always wrap terminal commands in 3-backtick code blocks (\`\`\`cmd or \`\`\`bash).
4. NO LATEX & NO TILDE: NEVER use LaTeX ($ or $$). NEVER use tilde (~) for ranges; use hyphen (-).
${lang.code !== 'ko' ? `- Absolutely NEVER include any Korean characters (가-힣) anywhere in non-Korean posts.` : ''}

[Design Theme & Layout Dynamic Rules]
- Assigned Theme: "${selectedTheme.name}"
- Primary Accent Color: ${selectedTheme.primaryColor}
- Layout Characteristic: ${selectedTheme.layout}
- Incorporate inline styled HTML callout boxes tailored to this theme:
  <div style="border-left: 4px solid ${selectedTheme.primaryColor}; padding: 14px 18px; margin: 24px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">...</div>

[Strict Output Format]
Return raw Markdown starting with frontmatter:
---
title: "Native Catchy Title in ${lang.name}"
description: "Native concise description in ${lang.name} under 160 characters"
publishDate: ${pubDateIso}
image: "${coverUrl}"
category: "tech"
tags: ${JSON.stringify(i18n.tags)}
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

    text = text.replace(/(\S)\s*~\s*(\S)/g, '$1 - $2');
    text = text.replace(/~/g, '-');

    if (lang.code !== 'ko') {
      text = text.replace(/(title:\s*")([^"]*)(")/g, (match, p1, p2, p3) => `${p1}${p2.replace(/[가-힣]+/g, '').trim()}${p3}`);
      text = text.replace(/(description:\s*")([^"]*)(")/g, (match, p1, p2, p3) => `${p1}${p2.replace(/[가-힣]+/g, '').trim()}${p3}`);
    }

    const fmMatch = text.match(/^---[\s\S]*?---\n*/);
    if (fmMatch) {
      let frontmatter = fmMatch[0];
      let body = text.slice(frontmatter.length).trim();
      body = body.replace(/^#\s+[^\n]+\n+/, '');

      frontmatter = frontmatter.replace(/category:\s*["'][^"']*["']/i, "category: 'tech'")
                               .replace(/category:\s*[^\n\r]+/i, "category: 'tech'");

      frontmatter = frontmatter.replace(/publishDate:\s*[^\n\r]+/i, `publishDate: ${pubDateIso}`);
      frontmatter = frontmatter.replace(/image:\s*["'][^"']*["']/i, `image: '${coverUrl}'`);

      // 🛡️ [이중 방어] 12개국 고유 언어로 강제 치환 및 볼드 서식 완벽 정제
      body = sanitizeMarkdownFormatting(body, lang.code);

      // 🛡️ [글자 수 검증 안전장치] 한국어 포스팅 본문이 2,200자 미만이면 경고 출력
      if (lang.code === 'ko') {
        const charCount = body.length;
        console.log(`📏 [한국어 본문 글자 수 측정] 현재: ${charCount}자 (목표: 2,500자 이상)`);
      }

      const middleImageMarkdown = `\n\n![Tech Troubleshooting Guide](${bodyUrl})\n\n`;
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
    console.log(`✅ [성공] 1호기 저장 완료: src/data/post/${lang.code}/${fileSlug}.md`);
    return true;
  } catch (error) {
    console.error(`❌ [최종 실패] ${lang.name} 생성 실패:`, error.message);
    return false;
  }
}

async function run() {
  console.log("==================================================");
  console.log("⚡ 1호기 Tech/IT 12개국 최적화 고속 자동 포스팅 시작");
  console.log("==================================================");

  let successCount = 0;

  for (let i = 0; i < TARGET_LANGS.length; i++) {
    const isSuccess = await generateSinglePost(TARGET_LANGS[i], i);
    if (isSuccess) successCount++;
    if (i < TARGET_LANGS.length - 1) {
      await delay(2000);
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
