import { afterEach, describe, expect, test, vi } from 'vitest';

describe('API isolation in Demo Mode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  test('rejects requests before Axios can send them', async () => {
    vi.stubEnv('VITE_DATA_MODE', 'demo');
    vi.stubEnv('VITE_API_URL', '');

    vi.resetModules();
    const { default: api } = await import('./api');
    const requestHandler = api.interceptors.request.handlers[0].fulfilled;

    await expect(requestHandler({ headers: {} })).rejects.toThrow(
      'Backend requests are disabled in Demo Mode.'
    );
  });
});
