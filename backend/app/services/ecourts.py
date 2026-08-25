import os
import re
import httpx

ECOURTS_API_KEY = os.getenv("ECOURTS_API_KEY", "").strip()
ECOURTS_BASE_URL = os.getenv("ECOURTS_BASE_URL", "https://webapi.ecourtsindia.com").strip().rstrip('/')

def normalize_cnr(cnr: str) -> str:
    """Strip all spaces, hyphens, and convert to uppercase."""
    return re.sub(r'[^A-Za-z0-9]', '', cnr).upper()

async def get_case_detail(cnr: str):
    """
    Fetch complete case details from eCourts API using the CNR number.
    """
    clean_cnr = normalize_cnr(cnr)
    if not clean_cnr or len(clean_cnr) != 16:
        print(f"Invalid CNR format (must be 16 alphanumeric characters): {cnr} -> {clean_cnr}")
        return None

    if not ECOURTS_API_KEY:
        print("eCourts API Key is not configured.")
        return None

    url = f"{ECOURTS_BASE_URL}/api/partner/case/{clean_cnr}"
    headers = {
        "Authorization": f"Bearer {ECOURTS_API_KEY}"
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                return resp.json()
            else:
                print(f"eCourts API error: {resp.status_code} - {resp.text}")
                return None
    except Exception as e:
        print(f"Failed to fetch case details from eCourts: {e}")
        return None

async def get_order_ai(cnr: str, filename: str):
    """
    Fetch AI analysis of a specific order file.
    """
    clean_cnr = normalize_cnr(cnr)
    if not ECOURTS_API_KEY:
        return None

    url = f"{ECOURTS_BASE_URL}/api/partner/case/{clean_cnr}/order-ai/{filename}"
    headers = {
        "Authorization": f"Bearer {ECOURTS_API_KEY}"
    }

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        print(f"Failed to fetch order AI analysis: {e}")
    return None
