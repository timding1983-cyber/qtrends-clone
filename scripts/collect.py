#!/usr/bin/env python3.14
"""Qtrends-clone: RSS data collector, runs hourly via cron."""
import json, re, os, xml.etree.ElementTree as ET
from datetime import datetime
from urllib.request import urlopen, Request
from html import unescape
import http.client
import ssl

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "news.json")

# Feeds accessible from China without VPN
FEEDS = [
    {"name": "NPR", "url": "https://feeds.npr.org/1001/rss.xml", "category": "热点"},
    {"name": "China Daily", "url": "https://www.chinadaily.com.cn/rss/world_rss.xml", "category": "热点"},
    {"name": "CGTN", "url": "https://www.cgtn.com/subscribe/rss/section/world.xml", "category": "热点"},
    {"name": "NPR Business", "url": "https://feeds.npr.org/1001/rss.xml", "category": "财经"},
    {"name": "China Daily Biz", "url": "https://www.chinadaily.com.cn/rss/business_rss.xml", "category": "财经"},
]

def fetch_rss(url, timeout=15):
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
        resp = urlopen(req, timeout=timeout, context=ctx)
        return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return None

def parse_rss(xml_text, source_name, category):
    articles = []
    try:
        root = ET.fromstring(xml_text)
        for item in root.findall(".//item"):
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            pub_date = item.findtext("pubDate", "")
            desc = item.findtext("description", "")
            if not title:
                continue
            title = unescape(re.sub(r"<[^>]+>", "", title)).strip()
            if desc:
                desc = unescape(re.sub(r"<[^>]+>", "", desc)).strip()[:300]
            articles.append({
                "title": title,
                "source": source_name,
                "url": link,
                "time": pub_date[:25] if pub_date else "",
                "summary": desc if desc else "",
            })
    except:
        pass
    return articles

def categorize_article(title, summary):
    kw_titles = {
        "科技": ["AI", "苹果", "Google", "微软", "芯片", "人工智能", "科技", "华为", "小米", "特斯拉", "数据", "软件", "互联网", "iPhone", "Android", "科技", "Robot", "机器人", "量子", "SpaceX"],
        "财经": ["股市", "A股", "外汇", "美元", "人民币", "比特币", "加密", "期货", "债券", "ETF", "通胀", "GDP", "央行", "利率", "股", "经济", "金融", "市场", "投资", "基金", "保险", "银行"],
        "体育": ["世界杯", "足球", "NBA", "C罗", "梅西", "姆巴佩", "奥运", "冠军", "联赛", "FIFA", "体育", "UFC", "网球", "篮球", "游泳", "冬奥"],
    }
    text = (title + " " + summary).lower()
    scores = {}
    for cat, keywords in kw_titles.items():
        scores[cat] = sum(1 for kw in keywords if kw.lower() in text)
    if max(scores.values()) > 0:
        return max(scores, key=scores.get)
    return "热点"

def collect():
    all_articles = []
    for feed in FEEDS:
        xml = fetch_rss(feed["url"])
        if xml:
            articles = parse_rss(xml, feed["name"], feed["category"])
            all_articles.extend(articles)
    
    # Deduplicate
    seen = set()
    unique = []
    for a in all_articles:
        key = a["title"][:40].lower()
        if key not in seen:
            seen.add(key)
            unique.append(a)
    
    # Auto-categorize
    categorized = {"热点": [], "财经": [], "科技": [], "体育": []}
    for a in unique:
        cat = categorize_article(a["title"], a.get("summary", ""))
        categorized.setdefault(cat, []).append(a)
    
    output = {
        "updated": datetime.now().strftime("%Y-%m-%dT%H:%M:%S+08:00"),
        "categories": categorized,
        "total": len(unique),
    }
    
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"Collected {len(unique)} articles")

if __name__ == "__main__":
    collect()
