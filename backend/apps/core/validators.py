def normalize_url(value: str) -> str:
    """Users naturally type domains without a scheme (e.g. "example.com"),
    but Django's URLField/URLValidator rejects that outright. Prepend
    "https://" when it's missing instead of failing validation."""
    value = (value or "").strip()
    if value and "://" not in value:
        value = f"https://{value}"
    return value
