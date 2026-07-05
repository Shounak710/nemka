import json
import urllib.error
import urllib.request
from ipaddress import ip_address

_COUNTRY_HEADERS = (
    "CF-IPCountry",
    "CloudFront-Viewer-Country",
    "X-AppEngine-Country",
    "X-Country-Code",
)

_geo_cache: dict[str, str] = {}
_GEO_CACHE_MAX = 2048


def client_ip(request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def country_from_headers(request) -> str | None:
    for header in _COUNTRY_HEADERS:
        value = request.headers.get(header)
        if not value:
            continue
        code = value.strip().upper()
        if code and code not in {"XX", "T1"}:
            return code[:2]
    return None


def is_local_ip(ip: str) -> bool:
    try:
        addr = ip_address(ip)
    except ValueError:
        return True
    return addr.is_loopback or addr.is_private or addr.is_link_local


def lookup_country(ip: str) -> str:
    if ip in _geo_cache:
        return _geo_cache[ip]

    country = "unknown"
    try:
        url = f"http://ip-api.com/json/{ip}?fields=status,countryCode"
        req = urllib.request.Request(url, headers={"User-Agent": "nemka-router/1.0"})
        with urllib.request.urlopen(req, timeout=0.8) as response:
            data = json.loads(response.read())
        if data.get("status") == "success" and data.get("countryCode"):
            country = data["countryCode"]
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, KeyError):
        pass

    if len(_geo_cache) >= _GEO_CACHE_MAX:
        _geo_cache.clear()
    _geo_cache[ip] = country
    return country


def resolve_country(request) -> str:
    header_country = country_from_headers(request)
    if header_country:
        return header_country

    ip = client_ip(request)
    if is_local_ip(ip) or ip == "unknown":
        return "local"

    return lookup_country(ip)
