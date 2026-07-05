import urllib.parse

DEFAULT_PREFERENCES = {
    "search_engine": "google",
    "llm": "openai",
}

VALID_SEARCH_ENGINES = {"google", "duckduckgo", "bing", "firefox"}
VALID_LLMS = {"openai", "claude"}


def preferences_from_params(
    se: str = "google",
    llm: str = "openai",
    csu: str = "",  # legacy, ignored
    clu: str = "",  # legacy, ignored
) -> dict:
    search_engine = se or DEFAULT_PREFERENCES["search_engine"]
    if search_engine not in VALID_SEARCH_ENGINES:
        search_engine = DEFAULT_PREFERENCES["search_engine"]

    llm_choice = llm or DEFAULT_PREFERENCES["llm"]
    if llm_choice not in VALID_LLMS:
        llm_choice = DEFAULT_PREFERENCES["llm"]

    return {
        "search_engine": search_engine,
        "llm": llm_choice,
    }


def build_search_url(query: str, preferences: dict) -> str:
    encoded = urllib.parse.quote(query)
    engine = preferences.get("search_engine", "google")

    if engine == "duckduckgo":
        return f"https://duckduckgo.com/?q={encoded}"
    if engine == "bing":
        return f"https://www.bing.com/search?q={encoded}"
    if engine == "firefox":
        return f"https://www.google.com/search?client=firefox-b-d&q={encoded}"

    return f"https://www.google.com/search?q={encoded}"


def build_llm_url(query: str, preferences: dict) -> str:
    llm = preferences.get("llm", "openai")

    if llm == "claude":
        return "https://claude.ai/new"

    return "https://chat.openai.com/"


def build_handoff_params(preferences: dict, log_queries: bool = True) -> str:
    params = {
        "se": preferences["search_engine"],
        "llm": preferences["llm"],
    }
    if not log_queries:
        params["log"] = "0"
    return urllib.parse.urlencode(params)
