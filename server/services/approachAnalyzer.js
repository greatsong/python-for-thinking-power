import Anthropic from '@anthropic-ai/sdk';

export async function analyzeSolutions(submissions, problemTitle, expectedApproaches) {
  if (!process.env.ANTHROPIC_API_KEY || submissions.length < 2) return null;

  const client = new Anthropic();

  const solutionsText = submissions.map((s, i) =>
    `### 풀이 ${i + 1}\n\`\`\`python\n${s.code}\n\`\`\``
  ).join('\n\n');

  let approachRef = '';
  if (expectedApproaches?.length > 0) {
    approachRef = `\n\n[이 문제의 예상 접근법]\n${expectedApproaches.map(a => `- ${a.tag}: ${a.description}`).join('\n')}`;
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `당신은 "사고력을 위한 파이썬" 플랫폼의 풀이 분석 전문가입니다.

[핵심 철학] "같은 문제, 다른 생각" — 학생들의 풀이를 접근법별로 분류하고, 아이디어 수준의 차이를 비교합니다.

[분석 원칙]
- 접근법 분류는 문법 차이(for/while, f-string/format)가 아닌 아이디어 차이에 집중합니다
- 7가지 접근법 유형: 완전 탐색, 패턴/규칙 발견, 수학적 사고, 분할 정복, 누적/메모이제이션, 자료구조 활용, 정렬 활용
- 한국어, 고등학생이 이해할 수 있는 수준으로 작성합니다
- 반말 톤으로 친근하게 작성합니다`,
      messages: [{
        role: 'user',
        content: `다음은 "${problemTitle}" 문제에 대한 ${submissions.length}명의 학생 풀이입니다.
${approachRef}

${solutionsText}

다음 형식으로 분석해주세요:

## 접근 방식 분류
(각 풀이가 어떤 접근법 유형에 해당하는지 분류하고, 몇 명이 어떤 방식을 사용했는지 요약. 문법 차이가 아닌 아이디어 차이에 집중!)

## 비교 포인트
(학생들이 배울 수 있는 주요 차이점 2-3가지. "이 접근법은 이런 장단점이 있어" 형태로)

## 토론 질문
(학생들끼리 토론할 수 있는 질문 2개. "왜 이 방법이 더 빠를까?", "데이터가 더 많으면 어떤 방법이 유리할까?" 등)`,
      }],
    });

    return response.content[0].text;
  } catch (err) {
    console.error('[ApproachAnalyzer] 분석 실패:', err.message);
    return null;
  }
}
