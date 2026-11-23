"""Generate frontend/public/sitemap.xml + robots.txt for every public page and route page.

Run after deploying to a new domain:
    cd /app/backend && python scripts/generate_sitemap.py https://your-domain.com
Defaults to APP_URL from backend/.env.
"""

import os
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv  # noqa: E402

from lib import data  # noqa: E402

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

PUBLIC = Path(__file__).resolve().parents[2] / "frontend" / "public"

STATIC_PAGES = [
    ("/", "daily", "1.0"),
    ("/book", "weekly", "0.9"),
    ("/tariff", "weekly", "0.9"),
    ("/routes", "weekly", "0.9"),
    ("/services", "monthly", "0.7"),
    ("/contact", "monthly", "0.6"),
]


def main() -> None:
    base = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get("APP_URL", "")).rstrip("/")
    if not base.startswith("http"):
        raise SystemExit("Pass the site URL, e.g. python scripts/generate_sitemap.py https://droptaxiexpress.in")
    today = date.today().isoformat()
    entries = list(STATIC_PAGES) + [
        (f"/routes/{data.route_slug(a, b)}", "weekly", "0.8") for a, b in data.sitemap_route_pairs()
    ]
    urls = "\n".join(
        f"  <url>\n    <loc>{base}{path}</loc>\n    <lastmod>{today}</lastmod>\n"
        f"    <changefreq>{freq}</changefreq>\n    <priority>{prio}</priority>\n  </url>"
        for path, freq, prio in entries
    )
    (PUBLIC / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "\n</urlset>\n"
    )
    (PUBLIC / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /review\n\nSitemap: {base}/sitemap.xml\n"
    )
    print(f"wrote {len(entries)} urls for {base}")


main()
