const QUERY_HISTORY_KEY = "nemka_query_history";
const LEGACY_QUERY_HISTORY_KEY = "svllm_query_history";

function loadQueryHistory() {
  const stored =
    localStorage.getItem(QUERY_HISTORY_KEY) ||
    localStorage.getItem(LEGACY_QUERY_HISTORY_KEY);
  return JSON.parse(stored || "[]");
}

function saveQueryHistory(history) {
  localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(history));
}

function updateHistorySectionVisibility() {
  const historySection = document.getElementById("history-section");
  if (!historySection) {
    return;
  }

  historySection.classList.remove("hidden");
  renderQueryHistory();
}

function renderQueryHistory() {
  const container = document.getElementById("query-history");
  if (!container) {
    return;
  }

  const history = loadQueryHistory();
  if (history.length === 0) {
    container.innerHTML =
      '<p class="history-empty">No logged queries yet. Run a search with logging enabled.</p>';
    return;
  }

  container.innerHTML = history
    .map((entry) => {
      const rated = entry.usefulRoute;
      const queryPreview =
        entry.query.length > 120
          ? `${entry.query.slice(0, 117)}…`
          : entry.query;

      return `
        <article class="history-item" data-log-id="${entry.id}">
          <div class="history-item-header">
            <span class="history-route ${entry.predictedRoute}">${entry.predictedRoute}</span>
            <time class="history-time">${formatTimestamp(entry.timestamp)}</time>
          </div>
          <p class="history-query">${escapeHtml(queryPreview)}</p>
          <div class="history-actions">
            <button
              type="button"
              class="btn btn-history ${rated === "search" ? "selected" : ""}"
              data-useful="search"
              data-log-id="${entry.id}"
              ${rated ? "disabled" : ""}
            >
              Search worked
            </button>
            <button
              type="button"
              class="btn btn-history ${rated === "llm" ? "selected" : ""}"
              data-useful="llm"
              data-log-id="${entry.id}"
              ${rated ? "disabled" : ""}
            >
              Needed LLM
            </button>
          </div>
          ${
            rated
              ? `<p class="history-rated">Rated: ${rated === "search" ? "Search worked" : "Needed LLM"}</p>`
              : ""
          }
        </article>
      `;
    })
    .join("");

  container.querySelectorAll("[data-useful]").forEach((button) => {
    button.addEventListener("click", () => {
      rateQuery(button.dataset.logId, button.dataset.useful);
    });
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function rateQuery(logId, usefulRoute) {
  const history = loadQueryHistory();
  const entry = history.find((item) => item.id === logId);
  if (!entry || entry.usefulRoute) {
    return;
  }

  try {
    const response = await fetch("/api/log-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        log_id: logId,
        useful_route: usefulRoute,
        query: entry.query,
        predicted_route: entry.predictedRoute,
      }),
    });

    if (!response.ok) {
      throw new Error("Could not save rating");
    }

    entry.usefulRoute = usefulRoute;
    saveQueryHistory(history);
    renderQueryHistory();
  } catch (error) {
    setStatus("Could not save rating.", "error");
  }
}
