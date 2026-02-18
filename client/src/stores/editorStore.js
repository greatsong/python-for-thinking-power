import { create } from 'zustand';
import { runPython } from '../lib/pyodide.js';
import { runTestCases } from '../lib/testRunner.js';

const useEditorStore = create((set, get) => ({
  code: '',
  output: null,
  error: null,
  elapsed: null,
  isRunning: false,
  testResults: null,
  pyodideReady: false,

  setCode: (code) => set({ code }),

  setPyodideReady: (ready) => set({ pyodideReady: ready }),

  // 코드 실행 (단순 실행)
  run: async (stdinInput = '') => {
    const { code } = get();
    set({ isRunning: true, output: null, error: null, testResults: null, elapsed: null });

    const result = await runPython(code, stdinInput);
    set({
      isRunning: false,
      output: result.output,
      error: result.error,
      elapsed: result.elapsed,
    });
    return result;
  },

  // 테스트케이스 실행
  runTests: async (testCases) => {
    const { code } = get();
    set({ isRunning: true, output: null, error: null, testResults: null, elapsed: null });

    const results = await runTestCases(code, testCases);
    set({
      isRunning: false,
      testResults: results,
      output: results.results[0]?.actual || null,
      error: results.results[0]?.error || null,
    });
    return results;
  },

  // 초기화
  reset: (starterCode = '') => set({
    code: starterCode,
    output: null,
    error: null,
    elapsed: null,
    testResults: null,
  }),
}));

export default useEditorStore;
