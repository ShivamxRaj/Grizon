import os, httpx
async def search(query):
    async with httpx.AsyncClient(timeout=30) as c:
        r=await c.post('https://google.serper.dev/search',headers={'X-API-KEY':os.getenv('SERPER_API_KEY',''),'Content-Type':'application/json'},json={'q':query})
        r.raise_for_status(); return r.json()
