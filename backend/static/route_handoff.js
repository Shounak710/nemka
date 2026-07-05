const STORAGE_KEY = "nemka_query_history";
const LEGACY_STORAGE_KEY = "svllm_query_history";
const MAX_HISTORY = 50;

function loadQueryHistoryEntries() {
  const stored =
    localStorage.getItem(STORAGE_KEY) ||
    localStorage.getItem(LEGACY_STORAGE_KEY);
  return JSON.parse(stored || "[]");
}

function saveQueryToHistory(entry) {
  const history = loadQueryHistoryEntries();
  const withoutDuplicate = history.filter((item) => item.id !== entry.id);
  withoutDuplicate.unshift(entry);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(withoutDuplicate.slice(0, MAX_HISTORY))
  );
}

const params = new URLSearchParams(window.location.search);
const logId = params.get("log_id");
const dest = params.get("dest");

if (logId) {
  saveQueryToHistory({
    id: logId,
    query: params.get("q") || "",
    predictedRoute: params.get("route") || "",
    source: params.get("source") || "",
    timestamp: params.get("ts") || new Date().toISOString(),
    usefulRoute: null,
  });
}

if (dest) {
  window.location.replace(dest);
}
