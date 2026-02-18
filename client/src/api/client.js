const BASE_URL = '/api';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `요청 실패: ${res.status}`);
  }

  return res.json();
}

export async function apiStreamPost(path, body, { onText, onDone, onError }) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `스트리밍 요청 실패: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          onDone?.();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'text') onText?.(parsed.content);
          if (parsed.type === 'error') onError?.(parsed.message);
          if (parsed.type === 'done') onDone?.(parsed);
        } catch {
          // JSON이 아닌 경우 무시
        }
      }
    }
    onDone?.();
  } catch (err) {
    onError?.(err.message);
  }
}
