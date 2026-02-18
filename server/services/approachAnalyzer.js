import Anthropic from '@anthropic-ai/sdk';

export async function analyzeSolutions(submissions, problemTitle) {
  if (!process.env.ANTHROPIC_API_KEY || submissions.length < 2) return null;

  const client = new Anthropic();

  const solutionsText = submissions.map((s, i) =>
    `### 풀이 ${i + 1}\n\`\`\`python\n${s.code}\n\`\`\``
  ).join('\n\n');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `다음은 "${problemTitle}" 문제에 대한 ${submissions.length}명의 학생 풀이입니다.

${solutionsText}

다음 형식으로 분석해주세요 (한국어, 고등학생 수준):

## 접근 방식 분류
(각 풀이의 접근법을 간단히 분류하고, 몇 명이 어떤 방식을 사용했는지 요약)

## 비교 포인트
(학생들이 배울 수 있는 주요 차이점 2-3가지)

## 토론 질문
(학생들끼리 토론할 수 있는 질문 2개)`,
      }],
    });

    return response.content[0].text;
  } catch (err) {
    console.error('[ApproachAnalyzer] 분석 실패:', err.message);
    return null;
  }
}
