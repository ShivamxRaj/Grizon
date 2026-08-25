import os
import httpx
from bs4 import BeautifulSoup

async def search(query: str):
    api_key = os.getenv('KANOON_API_KEY', '').strip()
    base = os.getenv('KANOON_BASE_URL', '').rstrip('/')
    
    # 1. Use Paid API if key is configured
    if api_key and base:
        try:
            headers = {'Authorization': f"Token {api_key}"}
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.post(f'{base}/search/', data={'formInput': query, 'pagenum': 0}, headers=headers)
                if r.status_code == 200:
                    res_data = r.json()
                    normalized_results = []
                    import re
                    for doc in res_data.get("docs", [])[:6]:
                        raw_title = doc.get("title", "")
                        raw_headline = doc.get("headline", "")
                        
                        # Clean up HTML tags (e.g., <b>) from title and snippet
                        title = re.sub(r'<[^>]*>', '', raw_title).strip()
                        snippet = re.sub(r'<[^>]*>', '', raw_headline).strip()
                        tid = doc.get("tid")
                        link = f"https://indiankanoon.org/doc/{tid}/" if tid else ""
                        
                        normalized_results.append({
                            'title': title,
                            'snippet': snippet,
                            'link': link
                        })
                    return normalized_results
        except Exception as e:
            print("Paid Kanoon API Warning, switching to free web scraper:", e)
            
    # 2. Free Alternative: Search IndianKanoon using Google Serper API (Very Reliable)
    results = []
    serper_key = os.getenv("SERPER_API_KEY", "").strip()
    if serper_key:
        try:
            from app.services.serper import search as serper_search
            serper_query = f"site:indiankanoon.org {query}"
            res = await serper_search(serper_query)
            if isinstance(res, dict) and "organic" in res:
                for item in res["organic"][:6]:
                    results.append({
                        'title': item.get('title', '').strip(),
                        'snippet': item.get('snippet', '').strip(),
                        'link': item.get('link', '').strip()
                    })
                if results:
                    return results
        except Exception as e:
            print("Serper alternative for Kanoon failed:", e)

    # 3. FREE Fallback 2: Scrape IndianKanoon results via DuckDuckGo (Zero Cost)
    search_query = f"site:indiankanoon.org {query}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as c:
            resp = await c.post("https://html.duckduckgo.com/html/", data={'q': search_query}, headers=headers)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                for title_elem in soup.find_all('div', class_='result__body', limit=6):
                    title = title_elem.find('a', class_='result__a')
                    snippet = title_elem.find('a', class_='result__snippet')
                    url_elem = title_elem.find('a', class_='result__url')
                    if title:
                        results.append({
                            'title': title.text.strip(),
                            'snippet': snippet.text.strip() if snippet else '',
                            'link': url_elem.get('href', '') if url_elem else ''
                        })
    except Exception as e:
        print("Free Kanoon Search Exception:", e)
        
    return results
