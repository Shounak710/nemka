const searchEngineSelect = document.getElementById("search-engine");
const customSearchUrlInput = document.getElementById("custom-search-url");
const llmSelect = document.getElementById("llm");
const customLlmUrlInput = document.getElementById("custom-llm-url");
const statusEl = document.getElementById("save-status");
const searchUrlInput = document.getElementById("search-url");
const copySearchUrlBtn = document.getElementById("copy-search-url");
const testForm = document.getElementById("test-form");
const testQueryInput = document.getElementById("test-query");
const optOutLoggingCheckbox = document.getElementById("opt-out-logging");

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status${type ? ` ${type}` : ""}`;
}

function toggleCustomFields() {
  customSearchUrlInput.classList.toggle(
    "hidden",
    searchEngineSelect.value !== "custom"
  );
  customLlmUrlInput.classList.toggle("hidden", llmSelect.value !== "custom");
}

function buildConfigParams() {
  const params = new URLSearchParams({
    se: searchEngineSelect.value,
    llm: llmSelect.value,
  });

  const customSearchUrl = customSearchUrlInput.value.trim();
  const customLlmUrl = customLlmUrlInput.value.trim();

  if (searchEngineSelect.value === "custom" && customSearchUrl) {
    params.set("csu", customSearchUrl);
  }
  if (llmSelect.value === "custom" && customLlmUrl) {
    params.set("clu", customLlmUrl);
  }
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

[
  searchEngineSelect,
  customSearchUrlInput,
  llmSelect,
  customLlmUrlInput,
  optOutLoggingCheckbox,
].forEach((element) => {
  element.addEventListener("change", () => {
    updateSearchUrlField();
    updateHistorySectionVisibility();
  });
  element.addEventListener("input", () => {
    updateSearchUrlField();
    updateHistorySectionVisibility();
  });
});

copySearchUrlBtn.addEventListener("click", copySearchUrl);
testForm.addEventListener("submit", handleTestSubmit);

toggleCustomFields();
updateSearchUrlField();
autoResizeTestQuery();
updateHistorySectionVisibility();
