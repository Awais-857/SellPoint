import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Demo-mode service tests must not require a live backend URL.
vi.stubEnv('VITE_DATA_MODE', 'demo');
vi.stubEnv('VITE_API_URL', '');
