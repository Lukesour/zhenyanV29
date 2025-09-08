import { ErrorHandler } from '../../services/ErrorHandler';

describe('ErrorHandler', () => {
  const handler = new ErrorHandler();

  test('classify should infer NETWORK_ERROR and be retryable', () => {
    const info = handler.classify(new Error('Network error occurred'), {
      component: 'UserForm',
      action: 'loadData'
    });
    expect(info.code).toBe('NETWORK_ERROR');
    expect(info.retryable).toBe(true);
  });

  test('localize should return zh messages by default', () => {
    const info = handler.classify(new Error('timeout exceeded'));
    const msg = handler.localize(info);
    expect(msg.title.length).toBeGreaterThan(0);
    expect(['分析超时', 'Analysis timeout']).toContain(msg.title);
  });

  test('getRecoveryAction returns expected action', () => {
    const info = handler.classify(new Error('state inconsistency'));
    expect(handler.getRecoveryAction(info)).toBe('returnToForm');
  });

  test('buildUserFacingError returns cohesive result', () => {
    const result = handler.buildUserFacingError('file not found', {
      component: 'DataLoaderService',
      action: 'loadUniversities'
    }, 'en');

    expect(result.info.code).toBe('FILE_NOT_FOUND');
    expect(result.userMessage.title).toBeTruthy();
    expect(result.action).toBe('reload');
  });
});


