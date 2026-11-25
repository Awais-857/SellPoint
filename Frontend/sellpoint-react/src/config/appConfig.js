// Application-wide configuration for SellPoint.
// API mode remains the default so existing deployments keep their current mode,
// but API mode now requires an explicit backend URL.

const configuredMode = (process.env.REACT_APP_DATA_MODE || 'api').trim().toLowerCase();

if (!['api', 'demo'].includes(configuredMode)) {
    throw new Error(
        `Invalid REACT_APP_DATA_MODE "${configuredMode}". Use "api" or "demo".`
    );
}

const isDemoMode = configuredMode === 'demo';
const configuredApiUrl = (process.env.REACT_APP_API_URL || '').trim();

if (!isDemoMode && !configuredApiUrl) {
    throw new Error(
        'REACT_APP_API_URL must be configured when REACT_APP_DATA_MODE is "api".'
    );
}

if (!isDemoMode) {
    let parsedApiUrl;

    try {
        parsedApiUrl = new URL(configuredApiUrl);
    } catch {
        throw new Error('REACT_APP_API_URL must be a valid absolute HTTP or HTTPS URL.');
    }

    if (!['http:', 'https:'].includes(parsedApiUrl.protocol)) {
        throw new Error('REACT_APP_API_URL must use HTTP or HTTPS.');
    }
}

export const APP_MODE = configuredMode;
export const IS_DEMO_MODE = isDemoMode;
export const API_BASE_URL = isDemoMode ? null : configuredApiUrl;
