const STORAGE_KEY = "svllm_query_history";
const MAX_HISTORY = 50;

function saveQueryToHistory(entry) {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
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
