import { runPython } from './pyodide.js';

export async function runTestCases(code, testCases) {
  const results = [];

  for (const tc of testCases) {
    const result = await runPython(code, tc.input || '');

    let passed = false;
    if (result.success) {
      const actual = result.output.trimEnd();
      const expected = tc.expected_output.trimEnd();

      if (tc.check_type === 'contains') {
        passed = actual.includes(expected);
      } else {
        passed = actual === expected;
      }
    }

    results.push({
      description: tc.description || '',
      input: tc.input || '',
      expected: tc.expected_output,
      actual: result.output,
      passed,
      error: result.error,
      elapsed: result.elapsed,
    });
  }

  return {
    results,
    allPassed: results.every(r => r.passed),
    passCount: results.filter(r => r.passed).length,
    totalCount: results.length,
  };
}
