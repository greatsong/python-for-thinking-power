let pyodideInstance = null;
let loadPromise = null;

export function isPyodideReady() {
  return !!pyodideInstance;
}

export async function loadPyodideRuntime() {
  if (pyodideInstance) return pyodideInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // Pyodide CDN에서 동적 로드
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/pyodide.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    pyodideInstance = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/',
    });

    return pyodideInstance;
  })();

  return loadPromise;
}

export async function runPython(code, stdinInput = '') {
  const pyodide = await loadPyodideRuntime();

  // stdout/stderr 캡처 설정
  pyodide.runPython(`
import sys
from io import StringIO
__stdout_capture = StringIO()
__stderr_capture = StringIO()
sys.stdout = __stdout_capture
sys.stderr = __stderr_capture
`);

  // stdin 설정
  if (stdinInput) {
    pyodide.runPython(`
import sys
from io import StringIO
sys.stdin = StringIO(${JSON.stringify(stdinInput)})
`);
  }

  const startTime = performance.now();

  try {
    // 타임아웃 (5초) 설정은 Web Worker에서만 가능하므로,
    // 여기서는 단순 실행
    pyodide.runPython(code);

    const stdout = pyodide.runPython('__stdout_capture.getvalue()');
    const stderr = pyodide.runPython('__stderr_capture.getvalue()');
    const elapsed = performance.now() - startTime;

    return {
      success: true,
      output: stdout.trimEnd(),
      error: stderr || null,
      elapsed: Math.round(elapsed),
    };
  } catch (err) {
    const stderr = pyodide.runPython('__stderr_capture.getvalue()');
    const elapsed = performance.now() - startTime;

    // 에러 메시지에서 유용한 부분만 추출
    let errorMsg = err.message || String(err);
    const lines = errorMsg.split('\n');
    // 마지막 줄이 보통 핵심 에러
    const lastLine = lines[lines.length - 1] || errorMsg;

    return {
      success: false,
      output: stderr || '',
      error: lastLine,
      fullError: errorMsg,
      elapsed: Math.round(elapsed),
    };
  } finally {
    // stdout/stderr 복원
    pyodide.runPython(`
import sys
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);
  }
}
