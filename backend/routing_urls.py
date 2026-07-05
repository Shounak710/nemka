import urllib.parse

DEFAULT_PREFERENCES = {
    "search_engine": "google",
    "llm": "openai",
    "custom_search_url": "",
    "custom_llm_url": "",
}


def preferences_from_params(
    se: str = "google",
    llm: str = "openai",
    csu: str = "",
    clu: str = "",
) -> dict:
    return {
        "search_engine": se or DEFAULT_PREFERENCES["search_engine"],
        "llm": llm or DEFAULT_PREFERENCES["llm"],
        "custom_search_url": csu,
        "custom_llm_url": clu,
    }


def build_search_url(query: str, preferences: dict) -> str:
    encoded = urllib.parse.quote(query)
    engine = preferences.get("search_engine", "google")

    if engine == "duckduckgo":
        return f"https://duckduckgo.com/?q={encoded}"
    if engine == "bing":
        return f"https://www.bing.com/search?q={encoded}"
    if engine == "custom":
        template = preferences.get("custom_search_url", "")
        return template.replace("{q}", encoded) or f"{template}{encoded}"

    return f"https://www.google.com/search?q={encoded}"


def build_llm_url(query: str, preferences: dict) -> str:
    encoded = urllib.parse.quote(query)
    llm = preferences.get("llm", "openai")

    if llm == "claude":
        return "https://claude.ai/new"
    if llm == "custom":
        template = preferences.get("custom_llm_url", "")
        return template.replace("{q}", encoded) or f"{template}{encoded}"

    return "https://chat.openai.com/"


def build_handoff_params(preferences: dict, log_queries: bool = True) -> str:
    params = {
        "se": preferences["search_engine"],
        "llm": preferences["llm"],
    }
    if preferences.get("custom_search_url"):
        params["csu"] = preferences["custom_search_url"]
    if preferences.get("custom_llm_url"):
        params["clu"] = preferences["custom_llm_url"]
    if not log_queries:
        params["log"] = "0"
    return urllib.parse.urlencode(params)
