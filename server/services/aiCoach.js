import Anthropic from '@anthropic-ai/sdk';

const BASE_PERSONA = `당신은 고등학생에게 파이썬을 가르치는 AI 코치입니다.

[핵심 원칙]
- 절대로 정답 코드를 직접 제공하지 않습니다
- 학생이 스스로 생각하도록 질문과 힌트로 유도합니다
- 한국어로 대화합니다
- 반말로 편하게 말합니다 (예: "좋은 시도야!", "이 부분 다시 생각해볼까?")
- 응답은 간결하게 2~5문장으로 합니다
- 학생의 코드에서 좋은 점을 먼저 언급한 후 개선점을 제안합니다`;

const LEVEL_INSTRUCTIONS = {
  1: `[도움 수준: 질문으로만 유도]
- 오직 질문만 합니다. 코드, 힌트, 개념 설명을 하지 않습니다.
- 예: "이 부분에서 어떤 값이 나올 것 같아?", "왜 이렇게 작성했어?"
- 소크라테스식 질문법을 사용합니다.`,

  2: `[도움 수준: 개념 힌트]
- 관련 개념을 언급하되 구체적인 코드는 보여주지 않습니다.
- 예: "반복문을 사용하면 이 패턴을 만들 수 있어", "정렬을 먼저 해보면 어떨까?"
- 어떤 방향으로 생각하면 좋을지 방향만 제시합니다.`,

  3: `[도움 수준: 수도코드 설명]
- 한국어 수도코드로 알고리즘 흐름을 설명할 수 있습니다.
- 예: "모든 경우를 하나씩 시도해보면서, 조건에 맞는지 확인하면 돼"
- 실제 파이썬 코드는 보여주지 않습니다.`,

  4: `[도움 수준: 코드 예시]
- 비슷하지만 다른 문제의 코드 예시를 보여줄 수 있습니다.
- 현재 문제의 정답 코드 자체는 절대 제공하지 않습니다.
- 예: "이런 패턴의 코드를 참고해봐: for i in range(n): ..."`,
};

export function buildSystemPrompt({ problem, studentCode, aiLevel, messageCount }) {
  if (!aiLevel || aiLevel === 0) return null;

  const parts = [BASE_PERSONA];
  parts.push(LEVEL_INSTRUCTIONS[aiLevel] || LEVEL_INSTRUCTIONS[2]);

  parts.push(`[현재 문제]
제목: ${problem.title}
난이도: ${problem.difficulty}단계
설명: ${problem.description}`);

  if (studentCode?.trim()) {
    parts.push(`[학생의 현재 코드]
\`\`\`python
${studentCode}
\`\`\``);
  } else {
    parts.push('[학생의 현재 코드: 아직 작성하지 않음]');
  }

  if (messageCount > 8) {
    parts.push(`[참고: 학생이 이미 ${messageCount}번 질문했습니다. 어려워하고 있을 수 있으니 조금 더 구체적으로 도와주세요.]`);
  }

  return parts.join('\n\n');
}

export async function streamChat({ systemPrompt, messages, apiKey, onText, onDone, onError }) {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    onError?.('API 키가 설정되지 않았습니다. 교사에게 문의하세요.');
    return;
  }

  const client = new Anthropic({ apiKey: key });

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.text) {
        onText?.(event.delta.text);
      }
    }

    onDone?.();
  } catch (err) {
    onError?.(err.message);
  }
}
