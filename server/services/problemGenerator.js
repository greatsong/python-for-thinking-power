import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `당신은 고등학생을 위한 파이썬 문제를 만드는 전문가입니다.

[문제 설계 원칙]
1. 하나의 정답이 있지만, 최소 3가지 이상의 풀이 방법이 가능해야 합니다.
2. 각 풀이 방법에 대한 예상 접근법(tag)을 명시합니다.
3. 친근하고 재미있는 톤으로 문제를 작성합니다 (이모지 사용 가능).
4. 테스트케이스는 기본 케이스 + 엣지 케이스를 포함합니다.
5. 단계적 힌트 3개를 포함합니다 (점점 더 구체적으로).

[해설 작성 원칙 — explanation 필드 요청 시]
- 친절한 반말 톤으로 작성 ("~해봐!", "~이야!", "~거든!")
- 핵심 개념을 먼저 쉽게 설명
- 대표 풀이를 코드와 함께 단계별로 설명
- 다른 창의적 풀이 방법도 코드와 함께 소개 (expected_approaches에 대응)
- 흔한 실수와 주의할 점을 포함
- 난이도 4~5는 시간복잡도 분석도 포함

[출력 형식]
반드시 JSON 배열로만 응답하세요. 마크다운 코드블록이나 다른 텍스트 없이 순수 JSON만 출력하세요.

각 문제 객체의 구조:
{
  "title": "문제 제목",
  "description": "문제 설명 (마크다운 지원, 입출력 예시 포함)",
  "difficulty": 1~5 사이 정수,
  "category": "output|logic|loop|string|list|function|algorithm",
  "starter_code": "# 여기에 코드를 작성하세요\\n",
  "test_cases": [
    {"input": "입력값", "expected_output": "기대 출력", "description": "테스트 설명"}
  ],
  "hints": ["힌트1 (방향 제시)", "힌트2 (개념 설명)", "힌트3 (구체적 접근)"],
  "expected_approaches": [
    {"tag": "접근법 태그", "description": "접근법 설명"}
  ]
}

[난이도 기준 — 학생 페르소나 기반]
1: 입문자 - 코딩을 처음 시작하는 학생. print, 변수, 기초 연산
2: 초보자 - 문법이 아직 어려운 학생. 조건문, 간단한 반복
3: 도전자 - 문법은 알지만 문제해결이 어려운 학생. 중첩 반복, 문자열 처리, 리스트 기초
4: 문제해결자 - 문제해결을 즐기는 학생. 함수, 리스트 활용, 복합 로직
5: 코딩대마왕 - 어떤 문제든 풀어내는 학생. 탐색, 정렬, 최적화, 알고리즘 설계

[카테고리]
output: 출력 / logic: 조건·논리 / loop: 반복 / string: 문자열 / list: 리스트 / function: 함수 / algorithm: 알고리즘`;

export async function generateProblems({ prompt, count = 3, difficulty, category, referenceProblem, includeExplanation }, { onProblem, onDone, onError }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    onError?.('ANTHROPIC_API_KEY가 설정되지 않았습니다');
    return;
  }

  const client = new Anthropic();

  let userMessage = `다음 요구사항에 맞는 파이썬 문제를 ${count}개 만들어주세요.\n\n요구사항: ${prompt}`;

  if (difficulty) {
    userMessage += `\n난이도: ${difficulty}`;
  }
  if (category) {
    userMessage += `\n카테고리: ${category}`;
  }
  if (referenceProblem) {
    userMessage += `\n\n[참고 문제 — 이 문제의 스타일과 형식을 참고하여 새로운 문제를 만들어주세요]\n${referenceProblem}`;
  }
  if (includeExplanation) {
    userMessage += `\n\n각 문제에 "explanation" 필드를 추가하여 상세한 풀이 해설을 포함해주세요. 해설에는 핵심 개념, 단계별 풀이 과정, 주의할 점을 포함합니다.`;
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: includeExplanation ? 8192 : 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].text;

    // JSON 배열 파싱 (코드블록 안에 있을 수도 있으므로 추출)
    let jsonStr = text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const problems = JSON.parse(jsonStr);

    if (!Array.isArray(problems)) {
      onError?.('AI 응답을 파싱할 수 없습니다');
      return;
    }

    // 각 문제를 개별적으로 콜백
    for (const problem of problems) {
      onProblem?.(problem);
    }

    onDone?.(problems);
  } catch (err) {
    console.error('[ProblemGenerator] 생성 실패:', err.message);
    onError?.(err.message);
  }
}

export async function reviseProblem({ problem, feedback }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다');
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `당신은 고등학생을 위한 파이썬 문제를 수정하는 전문가입니다.
기존 문제를 피드백에 맞게 수정해주세요.
반드시 수정된 문제 하나를 JSON 객체로만 응답하세요 (배열이 아닌 단일 객체).
마크다운 코드블록이나 다른 텍스트 없이 순수 JSON만 출력하세요.

JSON 구조:
{
  "title": "문제 제목",
  "description": "문제 설명",
  "difficulty": 1~5,
  "category": "카테고리",
  "starter_code": "시작 코드",
  "test_cases": [{"input": "", "expected_output": "", "description": ""}],
  "hints": ["힌트1", "힌트2", "힌트3"],
  "expected_approaches": [{"tag": "태그", "description": "설명"}]
}`,
      messages: [{
        role: 'user',
        content: `다음 문제를 피드백에 맞게 수정해주세요.

[기존 문제]
${JSON.stringify(problem, null, 2)}

[피드백]
${feedback}`,
      }],
    });

    const text = response.content[0].text;

    // JSON 객체 파싱
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const revised = JSON.parse(jsonStr);
    return revised;
  } catch (err) {
    console.error('[ProblemGenerator] 수정 실패:', err.message);
    throw new Error('문제 수정에 실패했습니다: ' + err.message);
  }
}
