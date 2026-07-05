const searchEngineSelect = document.getElementById("search-engine");
const llmSelect = document.getElementById("llm");
const statusEl = document.getElementById("save-status");
const searchUrlInput = document.getElementById("search-url");
const copySearchUrlBtn = document.getElementById("copy-search-url");
const testForm = document.getElementById("test-form");
const testQueryInput = document.getElementById("test-query");
const optOutLoggingCheckbox = document.getElementById("opt-out-logging");

const PREFERENCES_KEY = "nemka_setup_preferences";
const LEGACY_PREFERENCES_KEY = "svllm_setup_preferences";
const VALID_SEARCH_ENGINES = new Set(["google", "duckduckgo", "bing"]);
const VALID_LLMS = new Set(["openai", "claude"]);

const DEFAULT_PREFERENCES = {
  searchEngine: "google",
  llm: "openai",
  optOutLogging: false,
};

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status${type ? ` ${type}` : ""}`;
}

function normalizeSearchEngine(value) {
  return VALID_SEARCH_ENGINES.has(value) ? value : DEFAULT_PREFERENCES.searchEngine;
}

function normalizeLlm(value) {
  return VALID_LLMS.has(value) ? value : DEFAULT_PREFERENCES.llm;
}

function readPreferencesFromUI() {
  return {
    searchEngine: normalizeSearchEngine(searchEngineSelect.value),
    llm: normalizeLlm(llmSelect.value),
    optOutLogging: optOutLoggingCheckbox.checked,
  };
}

function applyPreferencesToUI(preferences) {
  searchEngineSelect.value = normalizeSearchEngine(preferences.searchEngine);
  llmSelect.value = normalizeLlm(preferences.llm);
  optOutLoggingCheckbox.checked = Boolean(preferences.optOutLogging);
}

function savePreferencesToStorage() {
  localStorage.setItem(
    PREFERENCES_KEY,
    JSON.stringify(readPreferencesFromUI())
  );
}

function loadPreferencesFromStorage() {
  try {
    let stored = localStorage.getItem(PREFERENCES_KEY);
    if (!stored) {
      stored = localStorage.getItem(LEGACY_PREFERENCES_KEY);
    }
    if (!stored) {
      return { ...DEFAULT_PREFERENCES };
    }
    const preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    if (!localStorage.getItem(PREFERENCES_KEY)) {
      localStorage.setItem(PREFERENCES_KEY, stored);
    }
    return preferences;
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function syncSetupPage() {
  savePreferencesToStorage();
  updateSearchUrlField();
  updateHistorySectionVisibility();
}

function buildConfigParams() {
  const params = new URLSearchParams({
    se: normalizeSearchEngine(searchEngineSelect.value),
    llm: normalizeLlm(llmSelect.value),
  });

  if (optOutLoggingCheckbox.checked) {
    params.set("log", "0");
  }

  return params.toString();
}

function buildSearchEngineUrl() {
  // `%s` must stay literal — browsers replace it with the user's query.
  // Do not pass it through URLSearchParams or `%` becomes `%25`.
  return `${window.location.origin}/search?q=%s&${buildConfigParams()}`;
}

function updateSearchUrlField() {
  searchUrlInput.value = buildSearchEngineUrl();
}

async function copySearchUrl() {
  await navigator.clipboard.writeText(searchUrlInput.value);
  setStatus("Search URL copied.", "success");
}

function handleTestSubmit(event) {
  event.preventDefault();
  const query = testQueryInput.value.trim();
  if (!query) {
    return;
  }

  const testUrl = `${window.location.origin}/search?q=${encodeURIComponent(query)}&${buildConfigParams()}`;
  window.location.href = testUrl;
}

function autoResizeTestQuery() {
  testQueryInput.style.height = "auto";
  testQueryInput.style.height = `${Math.min(testQueryInput.scrollHeight, 320)}px`;
}

testQueryInput.addEventListener("input", autoResizeTestQuery);

testQueryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    testForm.requestSubmit();
  }
});

[searchEngineSelect, llmSelect, optOutLoggingCheckbox].forEach((element) => {
  element.addEventListener("change", () => {
    savePreferencesToStorage();
    updateSearchUrlField();
    updateHistorySectionVisibility();
  });
});

copySearchUrlBtn.addEventListener("click", copySearchUrl);
testForm.addEventListener("submit", handleTestSubmit);

applyPreferencesToUI(loadPreferencesFromStorage());
updateSearchUrlField();
autoResizeTestQuery();
updateHistorySectionVisibility();
