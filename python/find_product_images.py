"""
find_product_images.py
======================
Reads products_brand_model.txt (one product per line) and searches Bing Images
for a product photo URL for each one.

Usage:
    python find_product_images.py

Output:
    - Console: progress + found image URLs
    - products_with_images.csv: Query, Image URL
"""

import re
import time
import random
from typing import List, Optional
import requests
from pathlib import Path

# ─── CONFIG ──────────────────────────────────────────────────────────────────

PRODUCT_LIST_FILE = "products_brand_model.txt"
OUTPUT_CSV        = "products_with_images.csv"

MIN_DELAY = 2.0
MAX_DELAY = 4.5

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

# ─── LOAD PRODUCT LIST ────────────────────────────────────────────────────────

def load_products(path: str) -> List[str]:
    lines = Path(path).read_text().splitlines()
    return [l.strip() for l in lines if l.strip()]

# ─── IMAGE VALIDATION ────────────────────────────────────────────────────────

def is_live_image(url: str) -> bool:
    """HEAD request to confirm URL returns a valid image response."""
    try:
        r = requests.head(url, headers=HEADERS, timeout=6, allow_redirects=True)
        content_type = r.headers.get("Content-Type", "")
        return r.status_code == 200 and "image" in content_type
    except requests.RequestException:
        return False

# ─── IMAGE SEARCH ─────────────────────────────────────────────────────────────

def find_image_url(query: str) -> Optional[str]:
    """
    Fetch the first image URL from DuckDuckGo Images JSON API.
    DDG requires a vqd token obtained from the search page first.
    """
    quoted = requests.utils.quote(query)

    # Step 1: get the vqd token DDG requires for its image API
    try:
        token_resp = requests.get(
            f"https://duckduckgo.com/?q={quoted}&iax=images&ia=images",
            headers=HEADERS, timeout=10,
        )
        token_resp.raise_for_status()
    except requests.RequestException as e:
        print(f"      [HTTP ERROR] {e}")
        return None

    vqd_match = re.search(r'vqd=(["\']?)([^"\'&]+)\1', token_resp.text)
    if not vqd_match:
        return None
    vqd = vqd_match.group(2)

    # Step 2: call the images JSON endpoint
    try:
        img_resp = requests.get(
            f"https://duckduckgo.com/i.js?q={quoted}&o=json&vqd={vqd}",
            headers={**HEADERS, "Referer": "https://duckduckgo.com/"},
            timeout=10,
        )
        img_resp.raise_for_status()
        results = img_resp.json().get("results", [])
        for r in results[:5]:
            url = r.get("image", "")
            if url and is_live_image(url):
                return url
    except (requests.RequestException, ValueError, KeyError) as e:
        print(f"      [API ERROR] {e}")

    return None

# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  PRODUCT IMAGE FINDER")
    print("=" * 60)

    products = load_products(PRODUCT_LIST_FILE)
    print(f"\nLoaded {len(products)} products from {PRODUCT_LIST_FILE}\n")

    results = []
    for i, query in enumerate(products, 1):
        print(f"  [{i}/{len(products)}] {query}")
        url = find_image_url(query)
        if url:
            print(f"      ✓ {url}")
        else:
            print("      ✗ No image found")

        if not url:
            url = f"https://placehold.co/600x600?text={requests.utils.quote(query)}"
        results.append({"Query": query, "Image URL": url})
        time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

    # Write CSV
    import csv
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Query", "Image URL"])
        writer.writeheader()
        writer.writerows(results)

    found = sum(1 for r in results if "placehold.co" not in r["Image URL"])
    print(f"\n{'='*60}")
    print(f"  Done! {found}/{len(products)} images found.")
    print(f"  Results saved to: {OUTPUT_CSV}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
