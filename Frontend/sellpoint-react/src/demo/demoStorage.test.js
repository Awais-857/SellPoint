import {
  DEMO_SESSION_STORAGE_KEY,
  DEMO_STATE_STORAGE_KEY,
  clearDemoSession,
  getDemoSession,
  getDemoState,
  resetDemoState,
  saveDemoSession,
  saveDemoState,
  startDemoSession
} from './demoStorage';

describe('demoStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('creates and persists the baseline demo data on first access', () => {
    const state = getDemoState();
    const stored = JSON.parse(window.localStorage.getItem(DEMO_STATE_STORAGE_KEY));

    expect(state.products.length).toBeGreaterThan(0);
    expect(stored.version).toBe(1);
    expect(stored.data.products).toHaveLength(state.products.length);
  });

  test('recovers from malformed or unsupported stored state', () => {
    window.localStorage.setItem(DEMO_STATE_STORAGE_KEY, '{not valid json');
    const recovered = getDemoState();

    expect(recovered.products.length).toBeGreaterThan(0);
    expect(JSON.parse(window.localStorage.getItem(DEMO_STATE_STORAGE_KEY)).version).toBe(1);

    saveDemoState({ products: [] });
    const unsupported = getDemoState();
    expect(unsupported.products.length).toBeGreaterThan(0);
  });

  test('reset restores the original baseline dataset', () => {
    const initial = getDemoState();
    saveDemoState({ ...initial, products: [] });

    const reset = resetDemoState();
    expect(reset.products).toHaveLength(initial.products.length);
  });

  test('creates and restores a valid role-specific demo session', () => {
    const session = startDemoSession('Customer');

    expect(session.role).toBe('Customer');
    expect(getDemoSession().userId).toBe(session.userId);
    expect(JSON.parse(window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY)).role).toBe('Customer');
  });

  test('rejects invalid roles and clears the current demo session', () => {
    expect(() => startDemoSession('SuperUser')).toThrow();
    saveDemoSession({ role: 'Vendor', userId: 201 });
    clearDemoSession();

    expect(getDemoSession()).toBeNull();
    expect(window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY)).toBeNull();
  });
});
