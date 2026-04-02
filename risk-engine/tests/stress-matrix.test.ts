import { buildReport, buildScenarios, evaluateScenario } from '../src/tools/stress-matrix';

describe('Stress Matrix Regression', () => {
  it('should keep all guarded scenarios within expected gate behavior', () => {
    const report = buildReport(buildScenarios().map(evaluateScenario));
    const mismatches = report.results.filter((result) => result.gateStatus === 'mismatch');

    expect(mismatches).toEqual([]);
  });
});
