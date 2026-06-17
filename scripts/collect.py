#!/usr/bin/env python3.14
import json, re, os, xml.etree.ElementTree as ET
from datetime import datetime
from urllib.request import urlopen, Request
from html import unescape
import ssl

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "news.json")

FEEDS = [
    {"name": "联合早报", "url": "https://www.zaobao.com.sg/realtime/china.rss", "category": ""},
    {"name": "联合早报", "url": "https://www.zaobao.com.sg/realtime/world.rss", "category": ""},
    {"name": "新华网", "url": "https://plink.anyfeeder.com/newscn/whxw", "category": ""},
    {"name": "澎湃新闻", "url": "https://plink.anyfeeder.com/thepaper", "category": ""},
    {"name": "界面新闻", "url": "https://plink.anyfeeder.com/jiemian/news", "category": ""},
    {"name": "人民网", "url": "https://plink.anyfeeder.com/people/politics", "category": ""},
    {"name": "人民网", "url": "https://plink.anyfeeder.com/people/world", "category": ""},
    {"name": "联合早报", "url": "https://www.zaobao.com.sg/realtime/finance.rss", "category": "财经"},
    {"name": "界面金融", "url": "https://plink.anyfeeder.com/jiemian/finance", "category": "财经"},
    {"name": "Solidot", "url": "https://www.solidot.org/index.rss", "category": "科技"},
]

def fetch_rss(url, timeout=15):
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
        resp = urlopen(req, timeout=timeout, context=ctx)
        return resp.read().decode("utf-8", errors="ignore")
    except:
        return None

def parse_rss(xml_text, source_name):
    articles = []
    try:
        root = ET.fromstring(xml_text)
        for item in root.findall(".//item"):
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            pub_date = item.findtext("pubDate", "")
            desc = item.findtext("description", "")
            if not title: continue
            title = unescape(re.sub(r"<[^>]+>", "", title)).strip()
            if desc:
                desc = unescape(re.sub(r"<[^>]+>", "", desc)).strip()[:300]
            articles.append({
                "title": title, "source": source_name, "url": link,
                "time": pub_date[:25] if pub_date else "", "summary": desc if desc else ""
            })
    except:
        pass
    return articles

def classify(title, summary):
    """Classify article into one of 8 categories."""
    text = (title + " " + summary).lower()

    # Category keyword maps - ordered by specificity
    rules = [
        ("国际", ["china", "us", "uk", "russia", "ukraine", "nato", "united states",
                  "foreign", "diplomat", "sanction", "border", "treaty", "alliance",
                  "g7", "nuclear", "military", "war", "conflict", "army", "troop",
                  "weapon", "missile", "navy", "marine", "attack", "strike"]),
        ("政治", ["president", "congress", "senate", "vote", "election", "campaign",
                 "parliament", "minister", "governor", "mayor", "policy", "lawmaker",
                 "republican", "democrat", "party", "legislat", "court", "judge"]),
        ("财经", ["stock", "market", "economy", "trade", "tariff", "bank", "rate",
                 "inflation", "gdp", "dollar", "yuan", "oil", "price", "bond",
                 "investor", "fund", "profit", "revenue", "debt", "crypto",
                 "business", "company", "corp", "merger", "acquisition"]),
        ("科技", ["ai", "artificial intelligence", "robot", "chip", "quantum",
                 "software", "app", "digital", "cyber", "data", "tech",
                 "iphone", "google", "microsoft", "apple", "nvidia", "intel",
                 "space", "nasa", "launch", "satellite", "mars", "moon"]),
        ("气候", ["climate", "weather", "storm", "flood", "drought", "earthquake",
                 "hurricane", "typhoon", "tornado", "wildfire", "emission",
                 "carbon", "solar", "wind", "renewable", "energy", "pollution",
                 "environment", "green", "warming"]),
        ("健康", ["health", "disease", "virus", "covid", "hospital", "doctor",
                 "patient", "drug", "vaccine", "medical", "cancer", "ebola",
                 "pandemic", "treatment"]),
        ("体育", ["sport", "game", "match", "champion", "olympic", "world cup",
                 "fifa", "nba", "soccer", "football", "tennis", "player",
                 "athlete", "medal", "coach", "team", "goal", "score"]),
        ("社会", ["protest", "crime", "police", "shooting", "attack", "refugee",
                 "immigrant", "migrant", "abortion", "rights", "freedom",
                 "education", "school", "university", "poverty", "hunger"]),
    ]

    for cat, keywords in rules:
        for kw in keywords:
            if kw in text:
                return cat

    return "热点"  # General news if nothing specific

def collect():
    all_articles = []
    for feed in FEEDS:
        xml = fetch_rss(feed["url"])
        if xml:
            all_articles.extend(parse_rss(xml, feed["name"]))

    # Deduplicate
    seen = set()
    unique = []
    for a in all_articles:
        key = a["title"][:40].lower()
        if key not in seen:
            seen.add(key)
            unique.append(a)

    # Classify each article
    categories = {
        "热点": [], "国际": [], "政治": [], "财经": [], "科技": [],
        "气候": [], "健康": [], "体育": [], "社会": []
    }
    for a in unique:
        cat = classify(a["title"], a.get("summary", ""))
        categories.setdefault(cat, []).append(a)

    # Sort categories by number of items, put 热点 and 科技 first
    order = ["热点", "国际", "政治", "财经", "科技", "气候", "健康", "体育", "社会"]
    sorted_cats = {}
    for cat in order:
        if cat in categories and categories[cat]:
            sorted_cats[cat] = categories[cat]
    # Any remaining
    for cat in sorted(categories.keys()):
        if cat not in sorted_cats and categories[cat]:
            sorted_cats[cat] = categories[cat]

    output = {
        "updated": datetime.now().strftime("%Y-%m-%dT%H:%M:%S+08:00"),
        "categories": sorted_cats,
        "total": len(unique),
    }

    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"Collected {len(unique)} articles into {len(sorted_cats)} categories")

if __name__ == "__main__":
    collect()
