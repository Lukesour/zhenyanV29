import progressEngine from '../../services/ProgressEngine';

describe('Performance: Progress Engine (Task 8.3)', () => {
  afterEach(() => {
    progressEngine.stop();
    progressEngine.reset();
  });

  test('update interval is respected (~100ms default)', (done) => {
    const samples: number[] = [];
    let last = performance.now();

    progressEngine.setProgressCallback(() => {
      const now = performance.now();
      samples.push(now - last);
      last = now;
      if (samples.length >= 5) {
        progressEngine.stop();
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        expect(avg).toBeGreaterThanOrEqual(80);
        expect(avg).toBeLessThan(200);
        done();
      }
    });

    progressEngine.start();
  });
});






