describe('API isolation in Demo Mode', () => {
  const originalMode = process.env.REACT_APP_DATA_MODE;
  const originalApiUrl = process.env.REACT_APP_API_URL;

  afterEach(() => {
    if (originalMode === undefined) delete process.env.REACT_APP_DATA_MODE;
    else process.env.REACT_APP_DATA_MODE = originalMode;

    if (originalApiUrl === undefined) delete process.env.REACT_APP_API_URL;
    else process.env.REACT_APP_API_URL = originalApiUrl;

    jest.resetModules();
  });

  test('rejects requests before Axios can send them', async () => {
    process.env.REACT_APP_DATA_MODE = 'demo';
    delete process.env.REACT_APP_API_URL;

    let requestHandler;
    jest.isolateModules(() => {
      const api = require('./api').default;
      requestHandler = api.interceptors.request.handlers[0].fulfilled;
    });

    await expect(requestHandler({ headers: {} })).rejects.toThrow(
      'Backend requests are disabled in Demo Mode.'
    );
  });
});
