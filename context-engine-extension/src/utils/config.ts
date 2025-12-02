export interface AppConfig {
    geminiApiKey?: string;
}

// No default API key - users must provide their own
const DEFAULT_API_KEY = '';

export const getAppConfig = async (): Promise<AppConfig> => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
        // Fallback for development/testing outside extension context
        if (typeof window !== 'undefined' && window.localStorage) {
            const key = localStorage.getItem('ce_gemini_api_key');
            return { geminiApiKey: key || DEFAULT_API_KEY };
        }
        return { geminiApiKey: DEFAULT_API_KEY };
    }

    return new Promise((resolve) => {
        chrome.storage.local.get(['geminiApiKey'], (result) => {
            resolve({
                geminiApiKey: result.geminiApiKey || DEFAULT_API_KEY
            });
        });
    });
};

export const saveAppConfig = async (config: AppConfig): Promise<void> => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
        if (typeof window !== 'undefined' && window.localStorage) {
            if (config.geminiApiKey) {
                localStorage.setItem('ce_gemini_api_key', config.geminiApiKey);
            } else {
                localStorage.removeItem('ce_gemini_api_key');
            }
        }
        return;
    }

    return new Promise((resolve) => {
        chrome.storage.local.set(config, () => {
            resolve();
        });
    });
};
