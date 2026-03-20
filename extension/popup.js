import { classify, loadModel } from "./model.mjs";

const textarea = document.getElementById("query");
const browserSelect = document.getElementById("browser-select");
const browserCustomInput = document.getElementById("browser-custom");
const llmSelect = document.getElementById("llm-select");
const llmCustomInput = document.getElementById("llm-custom");

// Auto-resize the textarea as the user types
textarea.addEventListener("input", () => {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
});

// Default routing configuration
const DEFAULT_SETTINGS = {
  searchEngine: "google",
  llm: "openai",
  customSearchUrl: "",
  customLlmUrl: "",
};

let settings = { ...DEFAULT_SETTINGS };

function applySettingsToUI() {
  browserSelect.value = settings.searchEngine || DEFAULT_SETTINGS.searchEngine;
  llmSelect.value = settings.llm || DEFAULT_SETTINGS.llm;

  // Show/hide custom URL inputs and populate them
  browserCustomInput.style.display =
    browserSelect.value === "custom" ? "block" : "none";
  llmCustomInput.style.display =
    llmSelect.value === "custom" ? "block" : "none";

  browserCustomInput.value = settings.customSearchUrl || "";
  llmCustomInput.value = settings.customLlmUrl || "";
}

function saveSettings() {
  settings = {
    searchEngine: browserSelect.value,
    llm: llmSelect.value,
    customSearchUrl: browserCustomInput.value.trim(),
    customLlmUrl: llmCustomInput.value.trim(),
  };

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.set({ routingSettings: settings });
  }
}

function loadSettings() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get("routingSettings", (data) => {
      if (data && data.routingSettings) {
        settings = { ...DEFAULT_SETTINGS, ...data.routingSettings };
      }
      applySettingsToUI();
    });
  } else {
    applySettingsToUI();
  }
}

browserSelect.addEventListener("change", () => {
  browserCustomInput.style.display =
    browserSelect.value === "custom" ? "block" : "none";
  saveSettings();
});

browserCustomInput.addEventListener("input", () => {
  saveSettings();
});

llmSelect.addEventListener("change", () => {
  llmCustomInput.style.display =
    llmSelect.value === "custom" ? "block" : "none";
  saveSettings();
});

llmCustomInput.addEventListener("input", () => {
  saveSettings();
});

// Load settings when popup opens
loadSettings();

function getSearchUrl(query) {
  const encoded = encodeURIComponent(query);

  switch (settings.searchEngine) {
    case "duckduckgo":
      return `https://duckduckgo.com/?q=${encoded}`;
    case "bing":
      return `https://www.bing.com/search?q=${encoded}`;
    case "custom":
      return (settings.customSearchUrl || "").replace("{q}", encoded) ||
        (settings.customSearchUrl || "") + encoded;
    case "google":
    default:
      return `https://www.google.com/search?q=${encoded}`;
  }
}

function getLlmUrl(query) {
  const encoded = encodeURIComponent(query);

  switch (settings.llm) {
    case "claude":
      // Most hosted LLM UIs don't support query via URL; this opens a new chat page
      return "https://claude.ai/new";
    case "localhost":
      return `http://localhost:8000/?q=${encoded}`;
    case "custom":
      return (settings.customLlmUrl || "").replace("{q", encoded).replace("{q}", encoded) ||
        (settings.customLlmUrl || "") + encoded;
    case "openai":
    default:
      return "https://chat.openai.com/";
  }
}

document.getElementById("submit").addEventListener("click", async () => {
  const queryInput = document.getElementById("query");
  const resultContainer = document.getElementById("result");

  const query = queryInput.value.trim();
  if (!query) {
    resultContainer.innerHTML = "Please enter a query.";
    return;
  }

  try {
    // Ensure the model is loaded before classifying
    await loadModel();

    const result = classify(query);
    console.log("classification result", result);

    if (
      !result ||
      typeof result.route !== "string" ||
      typeof result.confidence !== "number"
    ) {
      resultContainer.innerHTML = "Error: Invalid classification result.";
      return;
    }

    resultContainer.innerHTML =
      `Routed to: <b>${result.route}</b><br>` +
      `Confidence: ${result.confidence.toFixed(2)}<br>`;
    // Energy Saved: ${result.energy_saved_estimate} kWh`;

    const targetUrl =
      result.route === "search" ? getSearchUrl(query) : getLlmUrl(query);
    if (targetUrl) {
      window.open(targetUrl);
    }
  } catch (error) {
    console.error("Error during classification:", error);
    resultContainer.innerHTML =
      "An error occurred while routing your query." + error;
  }
});