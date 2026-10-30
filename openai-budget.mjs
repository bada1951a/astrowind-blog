import { Buffer } from 'node:buffer';

export const MONTHLY_BUDGET_KRW = 30_000;
// FX buffer is intentionally much higher than the October 2026 spot rate.
export const CONSERVATIVE_USD_TO_KRW = 2_500;
export const MAX_INPUT_BYTES = 24_000;
export const INPUT_TOKEN_OVERHEAD = 2_048;
export const MAX_OUTPUT_TOKENS = 4_096;
export const MAX_API_ATTEMPTS_PER_RUN = 72;
export const MODEL_INPUT_USD_PER_MILLION = 0.1;
export const MODEL_OUTPUT_USD_PER_MILLION = 0.5;
export const LEDGER_PATH = '.github/openai-budget/ledger.json';

export function kstMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  if (!year || !month) throw new Error('KST 월을 확인할 수 없습니다.');
  return `${year}-${month}`;
}

export function requestCeilingKrw({ inputBytes, maxOutputTokens = MAX_OUTPUT_TOKENS }) {
  if (!Number.isSafeInteger(inputBytes) || inputBytes < 0 || inputBytes > MAX_INPUT_BYTES) {
    throw new Error(`API 요청 본문이 예산 보호 상한(${MAX_INPUT_BYTES} UTF-8 bytes)을 초과했습니다.`);
  }
  if (!Number.isSafeInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > MAX_OUTPUT_TOKENS) {
    throw new Error(`max_output_tokens는 ${MAX_OUTPUT_TOKENS} 이하로 제한됩니다.`);
  }
  const maximumInputTokens = inputBytes + INPUT_TOKEN_OVERHEAD;
  const usd =
    (maximumInputTokens * MODEL_INPUT_USD_PER_MILLION + maxOutputTokens * MODEL_OUTPUT_USD_PER_MILLION) / 1_000_000;
  return Math.ceil(usd * CONSERVATIVE_USD_TO_KRW);
}

export function observedUsageCeilingKrw({ inputTokens, outputTokens }) {
  if (!Number.isSafeInteger(inputTokens) || inputTokens < 0) throw new Error('API input_tokens가 올바르지 않습니다.');
  if (!Number.isSafeInteger(outputTokens) || outputTokens < 0)
    throw new Error('API output_tokens가 올바르지 않습니다.');
  const usd = (inputTokens * MODEL_INPUT_USD_PER_MILLION + outputTokens * MODEL_OUTPUT_USD_PER_MILLION) / 1_000_000;
  return Math.ceil(usd * CONSERVATIVE_USD_TO_KRW);
}

function committedForMonth(monthRecord) {
  return Object.values(monthRecord.requests || {}).reduce((sum, request) => {
    return sum + (request.status === 'settled' ? request.actualKrw : request.reservedKrw);
  }, 0);
}

export class GitHubBudgetLedger {
  constructor({ repository, token, branch, fetchImpl = fetch, monthProvider = kstMonth }) {
    if (!repository || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
      throw new Error('예산 원장용 GitHub 저장소가 없거나 잘못되었습니다.');
    }
    if (!token) throw new Error('예산 원장용 GITHUB_TOKEN이 없어 유료 API 호출을 차단했습니다.');
    if (!branch) throw new Error('예산 원장 브랜치가 없어 유료 API 호출을 차단했습니다.');
    this.repository = repository;
    this.token = token;
    this.branch = branch;
    this.fetchImpl = fetchImpl;
    this.monthProvider = monthProvider;
  }

  async read() {
    const url = `https://api.github.com/repos/${this.repository}/contents/${LEDGER_PATH}?ref=${encodeURIComponent(this.branch)}`;
    const response = await this.fetchImpl(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (response.status === 404) throw new Error('예산 원장 파일/브랜치가 없어 유료 API 호출을 차단했습니다.');
    if (!response.ok) throw new Error(`예산 원장 조회 실패 (HTTP ${response.status}); 유료 API 호출을 차단했습니다.`);
    const file = await response.json();
    if (!file.sha || !file.content) throw new Error('예산 원장 응답이 올바르지 않아 유료 API 호출을 차단했습니다.');
    let ledger;
    try {
      ledger = JSON.parse(Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8'));
    } catch {
      throw new Error('예산 원장 JSON을 읽을 수 없어 유료 API 호출을 차단했습니다.');
    }
    if (ledger.version !== 1 || ledger.currency !== 'KRW' || ledger.monthlyLimitKrw !== MONTHLY_BUDGET_KRW) {
      throw new Error('예산 원장의 형식 또는 30,000원 한도가 예상과 달라 유료 API 호출을 차단했습니다.');
    }
    return { ledger, sha: file.sha };
  }

  async write({ ledger, sha, message }) {
    const url = `https://api.github.com/repos/${this.repository}/contents/${LEDGER_PATH}`;
    const response = await this.fetchImpl(url, {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify(ledger, null, 2) + '\n', 'utf8').toString('base64'),
        sha,
        branch: this.branch,
      }),
    });
    if (!response.ok) throw new Error(`예산 원장 저장 실패 (HTTP ${response.status}); 유료 API 호출을 차단했습니다.`);
  }

  async reserve({ requestId, inputBytes, maxOutputTokens = MAX_OUTPUT_TOKENS }) {
    if (!requestId || typeof requestId !== 'string')
      throw new Error('예산 요청 ID가 없어 유료 API 호출을 차단했습니다.');
    const reservationKrw = requestCeilingKrw({ inputBytes, maxOutputTokens });
    const month = this.monthProvider();
    const { ledger, sha } = await this.read();
    ledger.months ||= {};
    ledger.months[month] ||= { requests: {} };
    const record = ledger.months[month];
    record.requests ||= {};
    if (record.requests[requestId]) throw new Error('중복 API 요청 ID가 있어 유료 API 호출을 차단했습니다.');
    const committedKrw = committedForMonth(record);
    if (committedKrw + reservationKrw > MONTHLY_BUDGET_KRW) {
      throw new Error(
        `월 API 예산 한도 도달: ${committedKrw}/${MONTHLY_BUDGET_KRW}원 예약됨. 추가 호출을 차단했습니다.`
      );
    }
    record.requests[requestId] = { status: 'reserved', reservedKrw: reservationKrw };
    record.committedKrw = committedKrw + reservationKrw;
    record.updatedAt = new Date().toISOString();
    await this.write({ ledger, sha, message: `budget reserve ${requestId}` });
    return { requestId, month, reservationKrw, committedKrw: record.committedKrw };
  }

  async settle({ requestId, month = this.monthProvider(), inputTokens, outputTokens }) {
    const { ledger, sha } = await this.read();
    const record = ledger.months?.[month];
    const entry = record?.requests?.[requestId];
    if (!entry) throw new Error('API 요청 예약을 찾지 못해 생성 작업을 중단했습니다.');
    if (entry.status === 'settled') return entry.actualKrw;
    const actualKrw = observedUsageCeilingKrw({ inputTokens, outputTokens });
    if (actualKrw > entry.reservedKrw) {
      entry.overrunKrw = actualKrw - entry.reservedKrw;
      entry.actualKrw = actualKrw;
    } else {
      entry.actualKrw = actualKrw;
    }
    entry.status = 'settled';
    entry.inputTokens = inputTokens;
    entry.outputTokens = outputTokens;
    entry.settledAt = new Date().toISOString();
    record.committedKrw = committedForMonth(record);
    record.updatedAt = new Date().toISOString();
    await this.write({ ledger, sha, message: `budget settle ${requestId}` });
    if (entry.overrunKrw) throw new Error('실제 API 사용량이 보수적 요청 예약을 넘어 추가 호출을 중단했습니다.');
    return actualKrw;
  }

  async summary() {
    const { ledger } = await this.read();
    const month = this.monthProvider();
    const record = ledger.months?.[month] || { requests: {} };
    const committedKrw = committedForMonth(record);
    const settled = Object.values(record.requests || {}).filter((request) => request.status === 'settled');
    const actualKrw = settled.reduce((sum, request) => sum + request.actualKrw, 0);
    const pendingKrw = committedKrw - actualKrw;
    return { month, committedKrw, actualKrw, pendingKrw, remainingKrw: Math.max(0, MONTHLY_BUDGET_KRW - committedKrw) };
  }
}

export function budgetRequestId({ runId, runAttempt, ordinal }) {
  if (!runId || !runAttempt || !ordinal) throw new Error('GitHub Actions 실행 ID가 없어 유료 API 호출을 차단했습니다.');
  return `${runId}-${runAttempt}-${ordinal}`;
}

if (process.argv[2] === 'summary') {
  try {
    const ledger = new GitHubBudgetLedger({
      repository: process.env.GITHUB_REPOSITORY,
      token: process.env.GITHUB_TOKEN,
      branch: process.env.OPENAI_BUDGET_LEDGER_BRANCH,
    });
    const summary = await ledger.summary();
    console.log(`# 1호기 OpenAI API 예산 (${summary.month})`);
    console.log(
      `- 예약/실제 비용 상한: ${summary.committedKrw.toLocaleString('ko-KR')}원 / ${MONTHLY_BUDGET_KRW.toLocaleString('ko-KR')}원`
    );
    console.log(`- 사용량 확인 완료: ${summary.actualKrw.toLocaleString('ko-KR')}원`);
    console.log(`- API 응답이 불명확해 상한으로 보유 중: ${summary.pendingKrw.toLocaleString('ko-KR')}원`);
    console.log(`- 남은 예약 가능액: ${summary.remainingKrw.toLocaleString('ko-KR')}원`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
