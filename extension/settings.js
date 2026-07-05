export const DEFAULT_SETTINGS = {
  apiBaseUrl: "http://127.0.0.1:5000",
  searchEngine: "google",
  llm: "openai",
  feedbackDelayMinutes: 3,
};

const VALID_SEARCH_ENGINES = new Set(["google", "duckduckgo", "bing", "firefox"]);
const VALID_LLMS = new Set(["openai", "claude"]);

export function normalizeSearchEngine(value) {
  return VALID_SEARCH_ENGINES.has(value) ? value : DEFAULT_SETTINGS.searchEngine;
}

export function normalizeLlm(value) {
  return VALID_LLMS.has(value) ? value : DEFAULT_SETTINGS.llm;
}

export async function loadSettings() {
  if (typeof chrome === "undefined" || !chrome.storage?.sync) {
    return { ...DEFAULT_SETTINGS };
  }

  const data = await chrome.storage.sync.get("routingSettings");
  const stored = data.routingSettings || {};
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    searchEngine: normalizeSearchEngine(stored.searchEngine),
    llm: normalizeLlm(stored.llm),
  };
}

export async function saveSettings(settings) {
  if (typeof chrome === "undefined" || !chrome.storage?.sync) {
    return;
  }

  await chrome.storage.sync.set({ routingSettings: settings });
}

export function getSearchUrl(query, settings) {
  const encoded = encodeURIComponent(query);

  switch (normalizeSearchEngine(settings.searchEngine)) {
    case "duckduckgo":
      return `https://duckduckgo.com/?q=${encoded}`;
    case "bing":
      return `https://www.bing.com/search?q=${encoded}`;
    case "firefox":
      return `https://www.google.com/search?client=firefox-b-d&q=${encoded}`;
    case "google":
    default:
      return `https://www.google.com/search?q=${encoded}`;
  }
}

export function getLlmUrl(query, settings) {
  switch (normalizeLlm(settings.llm)) {
    case "claude":
      return "https://claude.ai/new";
    case "openai":
    default:
      return "https://chat.openai.com/";
  }
}
