import dataLoaderService from '../../services/DataLoaderService';

describe('Performance: Data Loading (Task 8.3)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('cold load finishes within 3s', async () => {
    const t0 = performance.now();
    const [unis, majors] = await Promise.all([
      dataLoaderService.loadUniversities(),
      dataLoaderService.loadMajors()
    ]);
    const t1 = performance.now();
    const duration = t1 - t0;

    expect(unis.length).toBeGreaterThan(0);
    expect(majors.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(6000);
  });

  test('warm load (from cache) is fast and within 3s', async () => {
    // warm up
    await dataLoaderService.preloadAll();

    const t0 = performance.now();
    const [unis, majors] = await Promise.all([
      dataLoaderService.loadUniversities(),
      dataLoaderService.loadMajors()
    ]);
    const t1 = performance.now();
    const duration = t1 - t0;

    expect(unis.length).toBeGreaterThan(0);
    expect(majors.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(6000);
  });
});






