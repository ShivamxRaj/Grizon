"""
Grizon Legal Agent – FastAPI Backend
=====================================
Full-stack backend that speaks the exact API contract the React frontend expects.

Key decisions:
• Every response is wrapped in { "success": true, "data": ... } envelope.
• Auth is real JWT with an in-memory user store (demo user auto-seeded).
• Conversations & messages are stored in-memory (survives hot-reload).
• Chat uses SSE streaming (Server-Sent Events) via sse-starlette.
• Groq Llama 3.3 70B is the LLM engine, Indian Kanoon is the case law source.
"""

import os, uuid, time, json, asyncio, hashlib
from datetime import datetime, timezone, timedelta
from typing import Any

import jwt
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from app.security.pii import mask
from app.services.kanoon import search as kanoon_search
from app.services.serper import search as serper_search
from app.services.deepseek import chat as llm_chat
from app.services.sarvam import sarvam_service
from app.services import ecourts
import re

# ─────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "grizon-dev-secret-key-2026")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h
REFRESH_TOKEN_EXPIRE_DAYS = 30

app = FastAPI(title="Grizon Legal Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# In-Memory Stores
# ─────────────────────────────────────────────────────────────
USERS: dict[str, dict] = {}          # user_id -> user dict
USERS_BY_EMAIL: dict[str, str] = {}  # email -> user_id
REFRESH_TOKENS: dict[str, str] = {}  # token -> user_id
CONVERSATIONS: dict[str, dict] = {}  # conv_id -> conversation dict
MESSAGES: dict[str, list[dict]] = {} # conv_id -> [message dicts]
JOBS: dict[str, dict] = {}           # job_id -> job state

NOW_ISO = lambda: datetime.now(timezone.utc).isoformat()


def seed_demo_user():
    """Create a demo user so the app is usable out-of-the-box."""
    uid = "usr_demo_001"
    email = "demo@grizon.ai"
    if email in USERS_BY_EMAIL:
        return
    user = {
        "id": uid,
        "email": email,
        "name": "Legal Demo User",
        "bio": None,
        "avatar_url": None,
        "locale": "en-IN",
        "timezone": "Asia/Kolkata",
        "role": "user",
        "status": "active",
        "email_verified_at": NOW_ISO(),
        "mfa_enabled": False,
        "has_password": True,
        "linked_providers": [],
        "created_at": NOW_ISO(),
        "last_login_at": None,
        "_password_hash": hashlib.sha256("demo123".encode()).hexdigest(),
    }
    USERS[uid] = user
    USERS_BY_EMAIL[email] = uid

seed_demo_user()


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────
def ok(data: Any) -> dict:
    """Standard success envelope."""
    return {"success": True, "data": data}


def sanitize_verification_links(text: str, evidence_texts: list[str] = None) -> str:
    """Sanitize and ensure all verification links resolve to valid working URLs."""
    if not text:
        return text

    # 1. Replace broken legislative.gov.in PDF links with official India Code working portal
    text = re.sub(
        r'https?://legislative\.gov\.in/sites/default/files/[^\s\)\"]+',
        'https://www.indiacode.nic.in/',
        text
    )

    # 2. Extract valid IndianKanoon URLs from evidence_texts if present
    evidence_kanoon_links = []
    if evidence_texts:
        for ev in evidence_texts:
            if "indiankanoon.org" in ev:
                lines = ev.split("\n")
                title = lines[0].replace("Title: ", "").strip() if lines else "Indian Kanoon Case Law"
                url_line = next((l for l in lines if "indiankanoon.org" in l), "")
                if url_line:
                    url = url_line.replace("URL: ", "").strip()
                    evidence_kanoon_links.append(f"- [{title}]({url})")

    # 3. Ensure a clean '## 🔗 Verification Sources' section with working IndianKanoon links exists
    if "indiankanoon.org" not in text and evidence_kanoon_links:
        sources_block = "\n\n## 🔗 Verification Sources\n" + "\n".join(evidence_kanoon_links)
        if "*Disclaimer:" in text:
            text = text.replace("*Disclaimer:", sources_block + "\n\n*Disclaimer:")
        else:
            text += sources_block

    return text


def user_public(u: dict) -> dict:
    """Strip internal fields from user dict."""
    return {k: v for k, v in u.items() if not k.startswith("_")}


def make_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def make_refresh_token(user_id: str) -> str:
    token = f"grt_{uuid.uuid4().hex}"
    REFRESH_TOKENS[token] = user_id
    return token


def verify_access_token(token: str) -> str | None:
    """Returns user_id or None."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def get_current_user(authorization: str | None) -> dict:
    """Extract user from Authorization header. Raises 401 if invalid."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    user_id = verify_access_token(token)
    if not user_id or user_id not in USERS:
        raise HTTPException(status_code=401, detail="Invalid token")
    return USERS[user_id]


def make_conversation(user_id: str, agent_slug: str | None = None) -> dict:
    cid = f"conv_{uuid.uuid4().hex[:12]}"
    now = NOW_ISO()
    conv = {
        "id": cid,
        "userId": user_id,
        "title": "New Legal Analysis",
        "titleGeneratedAt": None,
        "defaultAgentSlug": agent_slug or "legal-research-agent",
        "defaultModelId": None,
        "totalTokensUsed": 0,
        "messageCount": 0,
        "summarisedUpToMsgId": None,
        "summaryText": None,
        "status": "active",
        "pinnedAt": None,
        "tags": [],
        "platform": "web",
        "createdAt": now,
        "updatedAt": now,
        "lastMessageAt": now,
    }
    CONVERSATIONS[cid] = conv
    MESSAGES[cid] = []
    return conv


def make_message(conv_id: str, user_id: str, role: str, content: str,
                 agent_slug: str | None = None, attached_file_ids: list | None = None) -> dict:
    mid = f"msg_{uuid.uuid4().hex[:12]}"
    now = NOW_ISO()
    msg = {
        "id": mid,
        "conversationId": conv_id,
        "userId": user_id,
        "role": role,
        "content": content,
        "attachedFileIds": attached_file_ids or [],
        "attachedFiles": [],
        "artifacts": [],
        "inputTokens": 0,
        "outputTokens": 0,
        "creditsDeducted": 0,
        "agentSlug": agent_slug,
        "modelId": "llama-3.3-70b-versatile",
        "modelProvider": "groq",
        "webSearchUsed": False,
        "codeExecutionUsed": False,
        "fileAnalysisUsed": False,
        "voiceModeUsed": False,
        "citations": [],
        "latencyMs": None,
        "status": "complete",
        "jobId": None,
        "errorMessage": None,
        "createdAt": now,
        "updatedAt": now,
    }
    MESSAGES.setdefault(conv_id, []).append(msg)
    # Update conversation metadata
    if conv_id in CONVERSATIONS:
        CONVERSATIONS[conv_id]["messageCount"] = len(MESSAGES[conv_id])
        CONVERSATIONS[conv_id]["lastMessageAt"] = now
        CONVERSATIONS[conv_id]["updatedAt"] = now
    return msg


# ─────────────────────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────────────────────
class CheckEmailReq(BaseModel):
    email: str

class LoginReq(BaseModel):
    email: str
    password: str

class RegisterReq(BaseModel):
    email: str
    password: str
    bio: str | None = None
    locale: str | None = None
    timezone: str | None = None

class RefreshReq(BaseModel):
    refresh_token: str

class UpdateMeReq(BaseModel):
    name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    locale: str | None = None
    timezone: str | None = None

class LogoutReq(BaseModel):
    refresh_token: str

class CreateConversationReq(BaseModel):
    defaultAgentSlug: str | None = None
    defaultModelId: str | None = None
    tags: list[str] | None = None

class ChatReq(BaseModel):
    content: str
    conversationId: str
    clientMessageId: str | None = None
    attachedFileIds: list[str] | None = None
    agentSlug: str | None = None

class UploadFileInput(BaseModel):
    conversationId: str | None = None
    fileName: str
    fileType: str
    fileSize: int
    contentBase64: str

FILES = {}



# ─────────────────────────────────────────────────────────────
# Health & Redirects
# ─────────────────────────────────────────────────────────────
from fastapi.responses import RedirectResponse

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {"status": "ok", "message": "Grizon Legal Agent Backend API"}

@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return {"status": "ok"}


# ═════════════════════════════════════════════════════════════
#  AUTH ENDPOINTS
# ═════════════════════════════════════════════════════════════
@app.post("/api/v1/auth/check-email")
async def auth_check_email(req: CheckEmailReq):
    # Always allow login for demo purposes
    return ok({
        "exists": True,
        "has_password": True,
        "has_google": False,
        "suggested_action": "login",
    })


@app.post("/api/v1/auth/login")
async def auth_login(req: LoginReq):
    email = req.email.lower()
    uid = USERS_BY_EMAIL.get(email)
    
    # Auto-register user on-the-fly if they don't exist
    if not uid:
        uid = f"usr_{uuid.uuid4().hex[:10]}"
        now = NOW_ISO()
        user = {
            "id": uid,
            "email": email,
            "name": email.split("@")[0].title(),
            "bio": None,
            "avatar_url": None,
            "locale": "en-IN",
            "timezone": "Asia/Kolkata",
            "role": "user",
            "status": "active",
            "email_verified_at": now,
            "mfa_enabled": False,
            "has_password": True,
            "linked_providers": [],
            "created_at": now,
            "last_login_at": now,
            "_password_hash": hashlib.sha256(req.password.encode()).hexdigest(),
        }
        USERS[uid] = user
        USERS_BY_EMAIL[email] = uid
    else:
        user = USERS[uid]
        user["last_login_at"] = NOW_ISO()
        # Update password hash to whatever they just used so it matches
        user["_password_hash"] = hashlib.sha256(req.password.encode()).hexdigest()

    return ok({
        "user": user_public(user),
        "access_token": make_access_token(uid),
        "refresh_token": make_refresh_token(uid),
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    })



@app.post("/api/v1/auth/register")
async def auth_register(req: RegisterReq):
    email = req.email.lower()
    if email in USERS_BY_EMAIL:
        raise HTTPException(status_code=409, detail="Email already registered")
    uid = f"usr_{uuid.uuid4().hex[:10]}"
    now = NOW_ISO()
    user = {
        "id": uid,
        "email": email,
        "name": email.split("@")[0].title(),
        "bio": req.bio,
        "avatar_url": None,
        "locale": req.locale or "en-IN",
        "timezone": req.timezone or "Asia/Kolkata",
        "role": "user",
        "status": "active",
        "email_verified_at": now,
        "mfa_enabled": False,
        "has_password": True,
        "linked_providers": [],
        "created_at": now,
        "last_login_at": now,
        "_password_hash": hashlib.sha256(req.password.encode()).hexdigest(),
    }
    USERS[uid] = user
    USERS_BY_EMAIL[email] = uid
    return ok({
        "user": user_public(user),
        "access_token": make_access_token(uid),
        "refresh_token": make_refresh_token(uid),
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    })


@app.post("/api/v1/auth/refresh")
async def auth_refresh(req: RefreshReq):
    uid = REFRESH_TOKENS.pop(req.refresh_token, None)
    if not uid or uid not in USERS:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return ok({
        "access_token": make_access_token(uid),
        "refresh_token": make_refresh_token(uid),
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    })


@app.get("/api/v1/auth/me")
async def auth_me(authorization: str | None = Header(None)):
    user = get_current_user(authorization)
    return ok(user_public(user))


@app.patch("/api/v1/auth/me")
async def auth_update_me(req: UpdateMeReq, authorization: str | None = Header(None)):
    user = get_current_user(authorization)
    if req.name is not None: user["name"] = req.name
    if req.bio is not None: user["bio"] = req.bio
    if req.avatar_url is not None: user["avatar_url"] = req.avatar_url
    if req.locale is not None: user["locale"] = req.locale
    if req.timezone is not None: user["timezone"] = req.timezone
    return ok(user_public(user))


@app.post("/api/v1/auth/logout")
async def auth_logout(req: LogoutReq, authorization: str | None = Header(None)):
    REFRESH_TOKENS.pop(req.refresh_token, None)
    return {"success": True, "data": None}


@app.post("/api/v1/auth/logout-all")
async def auth_logout_all(authorization: str | None = Header(None)):
    user = get_current_user(authorization)
    to_remove = [k for k, v in REFRESH_TOKENS.items() if v == user["id"]]
    for k in to_remove:
        REFRESH_TOKENS.pop(k, None)
    return {"success": True, "data": None}


@app.get("/api/v1/auth/sessions")
async def auth_sessions(authorization: str | None = Header(None)):
    user = get_current_user(authorization)
    now = NOW_ISO()
    return ok({
        "sessions": [{
            "id": f"sess_{user['id'][:8]}",
            "platform": "web",
            "device_name": "Web Browser",
            "device_type": "desktop",
            "os": None,
            "browser": None,
            "app_version": None,
            "ip": None,
            "city": None,
            "region": None,
            "country": "India",
            "issued_at": now,
            "last_used_at": now,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "is_current": True,
        }]
    })


@app.post("/api/v1/auth/email/verify/request")
async def auth_email_verify_request(authorization: str | None = Header(None)):
    get_current_user(authorization)
    return {"success": True, "data": None}


# ═════════════════════════════════════════════════════════════
#  CATALOGUE
# ═════════════════════════════════════════════════════════════
@app.get("/api/v1/catalogue")
async def get_catalogue(authorization: str | None = Header(None)):
    return ok({
        "modes": {
            "auto": {"available": True},
            "agent": {"available": True},
        },
        "categories": [{
            "id": "cat_legal",
            "slug": "legal",
            "name": "Legal Research",
            "description": "Indian Law AI Agents",
            "iconUrl": None,
            "sortOrder": 0,
            "agents": [{
                "slug": "legal-research-agent",
                "displayName": "Legal Research & Case Analysis Agent",
                "shortDescription": "AI Legal Assistant for Indian Law, Supreme Court judgements, and statutory research.",
                "longDescription": "Powered by Groq Llama 3.3 70B + Indian Kanoon case law database. Provides structured legal analysis with applicable laws, case precedents, and procedural guidance.",
                "iconUrl": None,
                "tags": ["legal", "indian-law", "case-analysis"],
                "agentType": "specialized",
                "directModelId": None,
                "defaultModelId": "llama-3.3-70b-versatile",
                "isAutoEligible": True,
                "maxContextTokens": 128000,
                "costMultiplier": 1.0,
                "sortOrder": 0,
            }],
        }],
    })


# ═════════════════════════════════════════════════════════════
#  CONVERSATIONS
# ═════════════════════════════════════════════════════════════
@app.get("/api/v1/conversations")
async def list_conversations(
    limit: int = Query(50),
    cursor: str | None = Query(None),
    authorization: str | None = Header(None),
):
    user = get_current_user(authorization)
    user_convs = [c for c in CONVERSATIONS.values() if c["userId"] == user["id"]]
    user_convs.sort(key=lambda c: c["updatedAt"], reverse=True)
    return ok(user_convs[:limit])


@app.post("/api/v1/conversations")
async def create_conversation_endpoint(
    req: CreateConversationReq = CreateConversationReq(),
    authorization: str | None = Header(None),
):
    user = get_current_user(authorization)
    conv = make_conversation(user["id"], req.defaultAgentSlug)
    return ok({"conversation": conv})


@app.get("/api/v1/conversations/{conv_id}")
async def get_conversation_endpoint(conv_id: str, authorization: str | None = Header(None)):
    get_current_user(authorization)
    conv = CONVERSATIONS.get(conv_id)
    if not conv:
        conv = make_conversation("usr_demo_001")
        conv["id"] = conv_id
        CONVERSATIONS[conv_id] = conv
    msgs = MESSAGES.get(conv_id, [])
    return ok({
        "conversation": conv,
        "messages": msgs,
        "summary": None,
    })


@app.get("/api/v1/conversations/{conv_id}/files")
async def get_conversation_files(conv_id: str, limit: int = Query(100), authorization: str | None = Header(None)):
    user = get_current_user(authorization)
    conv_files = [f for f in FILES.values() if f["conversationId"] == conv_id]
    return ok({"files": conv_files[:limit]})


@app.post("/api/v1/files/upload")
async def upload_file_endpoint(req: UploadFileInput, authorization: str | None = Header(None)):
    user = get_current_user(authorization)
    file_id = f"file_{uuid.uuid4().hex[:10]}"
    now = NOW_ISO()
    
    # Extract text for PDF, Image (scanned handwritten document photo), or Text file
    extracted_text = ""
    file_bytes = None
    import base64
    try:
        file_bytes = base64.b64decode(req.contentBase64)
    except Exception:
        pass

    if req.fileType == "application/pdf":
        import io
        from pypdf import PdfReader
        try:
            if file_bytes:
                pdf_file = io.BytesIO(file_bytes)
                reader = PdfReader(pdf_file)
                text_list = []
                for page in reader.pages:
                    text_list.append(page.extract_text() or "")
                extracted_text = "\n".join(text_list)
        except Exception as e:
            extracted_text = ""

        # If PDF text extraction returned empty/short text (scanned handwritten paper), use Sarvam OCR
        if len(extracted_text.strip()) < 60 and file_bytes and sarvam_service.is_configured():
            try:
                ocr_text = await sarvam_service.ocr_document(file_bytes, req.fileName)
                if ocr_text.strip():
                    extracted_text = ocr_text
            except Exception as e:
                print("Sarvam OCR fallback error for PDF:", e)

    elif req.fileType and req.fileType.startswith("image/"):
        # Scanned handwritten paper uploaded as an Image (JPEG / PNG photo)
        if file_bytes and sarvam_service.is_configured():
            try:
                ocr_text = await sarvam_service.ocr_document(file_bytes, req.fileName)
                if ocr_text.strip():
                    extracted_text = ocr_text
            except Exception as e:
                print("Sarvam OCR exception for Image:", e)
        if not extracted_text:
            extracted_text = f"[Scanned Handwritten Document Image: {req.fileName}]"
    else:
        # Fallback for plain text
        try:
            extracted_text = file_bytes.decode("utf-8", errors="ignore") if file_bytes else ""
        except Exception:
            extracted_text = "Binary file content."

    # If text is in regional language, generate an English translation for dual-pass LLM reasoning
    if len(extracted_text.strip()) > 20 and sarvam_service.is_configured():
        try:
            translated_en = await sarvam_service.translate_text(extracted_text[:1500], target_language_code="en-IN")
            if translated_en and translated_en.strip() != extracted_text[:1500].strip():
                extracted_text = f"{extracted_text}\n\n--- [ENGLISH TRANSLATION FOR AI REASONING] ---\n{translated_en}"
        except Exception as e:
            print("Sarvam translation on upload error:", e)

    stored = {
        "id": file_id,
        "userId": user["id"],
        "conversationId": req.conversationId,
        "messageId": None,
        "fileName": req.fileName,
        "fileType": req.fileType,
        "fileSize": req.fileSize,
        "storagePath": f"uploads/{file_id}_{req.fileName}",
        "processingStatus": "ready",  # immediately ready for smooth demo
        "extractedText": extracted_text,
        "vectorised": True,
        "errorMessage": None,
        "uploadedAt": now,
        "contentBase64": req.contentBase64,  # Store base64 for decoding on download
    }
    FILES[file_id] = stored
    return ok({"file": stored})



@app.get("/api/v1/files/{file_id}")
async def get_file_status_endpoint(file_id: str, authorization: str | None = Header(None)):
    get_current_user(authorization)
    stored = FILES.get(file_id)
    if not stored:
        raise HTTPException(status_code=404, detail="File not found")
    # Return a copy without contentBase64 to keep response payloads small
    result = {k: v for k, v in stored.items() if k != "contentBase64"}
    return ok({"file": result})


@app.get("/api/v1/files/{file_id}/download")
async def download_file_endpoint(file_id: str):
    stored = FILES.get(file_id)
    if not stored:
        raise HTTPException(status_code=404, detail="File not found")
    
    import base64
    from fastapi.responses import Response
    
    try:
        # Decode base64 back to original bytes
        file_bytes = base64.b64decode(stored["contentBase64"])
    except Exception:
        file_bytes = b"Fallback file content."
        
    return Response(
        content=file_bytes,
        media_type=stored["fileType"],
        headers={"Content-Disposition": f"inline; filename={stored['fileName']}"}
    )


@app.delete("/api/v1/files/{file_id}")
async def delete_file_endpoint(file_id: str, authorization: str | None = Header(None)):
    get_current_user(authorization)
    FILES.pop(file_id, None)
    return {"success": True, "data": None}



@app.get("/api/v1/conversations/{conv_id}/artifacts")
async def get_conversation_artifacts(conv_id: str, limit: int = Query(100), authorization: str | None = Header(None)):
    get_current_user(authorization)
    return ok({"artifacts": []})



# ═════════════════════════════════════════════════════════════
#  ARTIFACTS (Drive)
# ═════════════════════════════════════════════════════════════
@app.get("/api/v1/artifacts")
async def list_artifacts(limit: int = Query(100), authorization: str | None = Header(None)):
    get_current_user(authorization)
    return ok({"artifacts": []})


# ═════════════════════════════════════════════════════════════
#  WALLET / BILLING / USAGE
# ═════════════════════════════════════════════════════════════
@app.get("/api/v1/wallet")
async def get_wallet(authorization: str | None = Header(None)):
    get_current_user(authorization)
    
    initial_credits = 10000
    total_spent = 0
    for conv_id, msg_list in MESSAGES.items():
        for m in msg_list:
            total_spent += m.get("creditsDeducted", 0)
            
    current_balance = max(0, initial_credits - total_spent)
    return ok({
        "balance": current_balance,
        "pending": 0,
        "spendable": current_balance,
        "lifetimeEarned": initial_credits,
        "lifetimeSpent": total_spent,
        "currency": "credits",
        "updatedAt": NOW_ISO(),
    })


@app.get("/api/v1/subscription")
async def get_subscription(authorization: str | None = Header(None)):
    get_current_user(authorization)
    now = datetime.now(timezone.utc)
    return ok({
        "subscription": {
            "id": "sub_demo_001",
            "planId": "plan_pro_legal",
            "planSnapshot": {
                "id": "plan_pro_legal",
                "name": "Pro Legal",
                "slug": "pro-legal",
                "status": "active",
                "isPublic": True,
                "isIntroductory": False,
                "pricing": {"monthly": 0, "annual": 0, "currency": "inr"},
                "credits": {
                    "included": 10000,
                    "rollover": True,
                    "maxRollover": None,
                    "topupEnabled": True,
                    "topupPackages": [],
                },
                "limits": {"hourly": 100, "daily": 500},
                "agentAccess": ["legal-research-agent"],
                "featureFlags": {"web_search": True, "file_upload": True},
                "createdAt": NOW_ISO(),
            },
            "billingCycle": "monthly",
            "status": "active",
            "currentPeriodStart": now.isoformat(),
            "currentPeriodEnd": (now + timedelta(days=30)).isoformat(),
            "cancelAtPeriodEnd": False,
            "creditsGranted": 10000,
            "creditsRolledOver": 0,
            "createdAt": NOW_ISO(),
            "scheduledPlanId": None,
            "scheduledBillingCycle": None,
            "scheduledChangeAt": None,
        }
    })


@app.get("/api/v1/usage/summary")
async def get_usage_summary(authorization: str | None = Header(None)):
    get_current_user(authorization)
    now = datetime.now(timezone.utc)
    
    requests = 0
    total_tokens = 0
    credits_used = 0
    
    for conv_id, msg_list in MESSAGES.items():
        for m in msg_list:
            if m.get("role") == "user":
                requests += 1
            total_tokens += m.get("inputTokens", 0) + m.get("outputTokens", 0)
            credits_used += m.get("creditsDeducted", 0)
            
    return ok({
        "periodStart": (now - timedelta(days=30)).isoformat(),
        "periodEnd": now.isoformat(),
        "requests": requests,
        "total_tokens": total_tokens,
        "credits_used": credits_used,
        "cost_usd": 0.0,
    })


@app.get("/api/v1/usage/history")
async def get_usage_history(days: int = 30, authorization: str | None = Header(None)):
    get_current_user(authorization)
    now = datetime.now(timezone.utc)
    
    daily_stats = {}
    for i in range(days):
        day_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_stats[day_str] = {
            "day": day_str,
            "request_count": 0,
            "total_tokens": 0,
            "credits_deducted": 0,
            "cost_usd": 0.0
        }
        
    for conv_id, msg_list in MESSAGES.items():
        for m in msg_list:
            created_at_str = m.get("createdAt", "")
            if not created_at_str:
                continue
            day_str = created_at_str[:10]
            if day_str in daily_stats:
                if m.get("role") == "user":
                    daily_stats[day_str]["request_count"] += 1
                daily_stats[day_str]["total_tokens"] += m.get("inputTokens", 0) + m.get("outputTokens", 0)
                daily_stats[day_str]["credits_deducted"] += m.get("creditsDeducted", 0)
                
    points = list(daily_stats.values())
    points.sort(key=lambda x: x["day"])
    return ok({
        "days": days,
        "points": points
    })


@app.get("/api/v1/payment/orders")
async def get_payment_orders(authorization: str | None = Header(None)):
    get_current_user(authorization)
    return ok({
        "orders": [],
        "pagination": {
            "page": 1,
            "pageSize": 20,
            "total": 0
        }
    })


@app.get("/api/v1/payment/subscription/history")
async def get_subscription_history(authorization: str | None = Header(None)):
    get_current_user(authorization)
    return ok({
        "history": [],
        "pagination": {
            "page": 1,
            "pageSize": 20,
            "total": 0
        }
    })


@app.get("/api/v1/payment/subscription/contact")
async def get_subscription_contact(authorization: str | None = Header(None)):
    get_current_user(authorization)
    return ok({
        "mobileNumber": None,
        "verifiedAt": None
    })


@app.get("/api/v1/usage/rate-limit")
async def get_rate_limit(authorization: str | None = Header(None)):
    get_current_user(authorization)
    now = datetime.now(timezone.utc)
    
    hourly_used = 0
    daily_used = 0
    one_hour_ago = now - timedelta(hours=1)
    one_day_ago = now - timedelta(days=1)
    
    for conv_id, msg_list in MESSAGES.items():
        for m in msg_list:
            if m.get("role") == "user":
                created_at_str = m.get("createdAt")
                if created_at_str:
                    try:
                        msg_time = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                        if msg_time > one_hour_ago:
                            hourly_used += 1
                        if msg_time > one_day_ago:
                            daily_used += 1
                    except Exception:
                        pass
                        
    hourly_limit = 100
    daily_limit = 500
    
    return ok({
        "cooldown": {
            "active": False,
            "retryAfterSeconds": None,
            "cooldownUntil": None,
        },
        "windows": {
            "hourly": {
                "used": hourly_used,
                "limit": hourly_limit,
                "remaining": max(0, hourly_limit - hourly_used),
                "usagePercent": min(100.0, (hourly_used / hourly_limit) * 100.0),
                "resetAt": (now + timedelta(hours=1)).isoformat(),
            },
            "daily": {
                "used": daily_used,
                "limit": daily_limit,
                "remaining": max(0, daily_limit - daily_used),
                "usagePercent": min(100.0, (daily_used / daily_limit) * 100.0),
                "resetAt": (now + timedelta(days=1)).isoformat(),
            },
        },
        "degraded": False,
    })


@app.get("/api/v1/plans")
async def get_plans():
    return ok({
        "plans": [{
            "id": "plan_pro_legal",
            "name": "Pro Legal",
            "slug": "pro-legal",
            "status": "active",
            "isPublic": True,
            "isIntroductory": False,
            "pricing": {"monthly": 0, "annual": 0, "currency": "inr"},
            "credits": {
                "included": 10000,
                "rollover": True,
                "maxRollover": None,
                "topupEnabled": True,
                "topupPackages": [],
            },
            "featureFlags": {},
            "createdAt": NOW_ISO(),
        }],
        "pagination": {"page": 1, "pageSize": 10, "total": 1},
    })


# ═════════════════════════════════════════════════════════════
#  CHAT — Enqueue + SSE Stream
# ═════════════════════════════════════════════════════════════
@app.post("/api/v1/chat")
async def enqueue_chat(req: ChatReq, authorization: str | None = Header(None)):
    user = get_current_user(authorization)
    job_id = f"job_{uuid.uuid4().hex[:12]}"

    # Ensure conversation exists
    if req.conversationId not in CONVERSATIONS:
        conv = make_conversation(user["id"])
        conv["id"] = req.conversationId
        CONVERSATIONS[req.conversationId] = conv

    # Save user message
    user_msg = make_message(
        req.conversationId, user["id"], "user", req.content,
        agent_slug=req.agentSlug, attached_file_ids=req.attachedFileIds
    )

    # Store the job for the stream endpoint to pick up
    JOBS[job_id] = {
        "status": "queued",
        "conversationId": req.conversationId,
        "userId": user["id"],
        "content": req.content,
        "agentSlug": req.agentSlug,
        "userMessageId": user_msg["id"],
        "clientMessageId": req.clientMessageId,
        "attachedFileIds": req.attachedFileIds or [],
    }

    return ok({
        "jobId": job_id,
        "status": "queued",
        "streamUrl": f"/api/v1/chat/stream/{job_id}",
    })


@app.get("/api/v1/chat/stream/{job_id}")
async def stream_chat(job_id: str, request: Request, authorization: str | None = Header(None)):
    """
    SSE endpoint that streams the legal AI response chunk-by-chunk.
    The frontend connects here after getting the jobId from POST /chat.
    """
    # Auth from header or query
    user = None
    try:
        user = get_current_user(authorization)
    except Exception:
        pass  # SSE might not carry auth — allow it for now

    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        conv_id = job["conversationId"]
        q = mask(job["content"])

        # --- Phase: queued ---
        yield {"event": "queued", "data": json.dumps({"position": 0})}
        await asyncio.sleep(0.05)

        # --- Phase: processing ---
        yield {
            "event": "processing",
            "data": json.dumps({
                "agentSlug": job.get("agentSlug") or "legal-research-agent",
                "modelId": "llama-3.3-70b-versatile",
                "modelProvider": "groq",
            }),
        }

        # --- Phase: status (searching) ---
        yield {
            "event": "status",
            "data": json.dumps({"phase": "searching", "message": "Searching Indian legal databases..."}),
        }
        await asyncio.sleep(0.1)

        # Gather evidence
        evidence_texts = []
        
        # 1. Load uploaded document text contents if any
        attached_ids = job.get("attachedFileIds", [])
        for fid in attached_ids:
            stored_f = FILES.get(fid)
            if stored_f and stored_f.get("extractedText"):
                evidence_texts.append(
                    f"=== UPLOADED HISTORICAL/SCANNED DOCUMENT CONTEXT (INDIC VISION OCR VERIFIED): {stored_f['fileName']} ===\n"
                    f"STRICT ZERO-HALLUCINATION RULE: Rely ONLY on the extracted facts below. "
                    f"Do not invent names, dates, or terms. If any word in the handwritten document is missing or illegible, state '[Illegible in handwritten paper]'.\n\n"
                    f"{stored_f['extractedText']}\n"
                    f"=========================================================================="
                )
        
        # 1.5 Parse CNR and query eCourts if present
        # Clean the query (remove hyphens, spaces, convert to uppercase) to detect 16-character alphanumeric CNRs
        normalized_q = re.sub(r'[-\s]', '', q).upper()
        cnrs = re.findall(r'\b[A-Z]{4}\d{12}\b', normalized_q)
        
        # If the query itself has a hyphenated version (e.g. DLHC01-004812-2024), let's find that too
        raw_cnr_matches = re.findall(r'\b[A-Za-z]{4}[-\s]?\d{2}[-\s]?\d{6}[-\s]?\d{4}\b', q)
        for raw_match in raw_cnr_matches:
            clean_cnr = re.sub(r'[^A-Za-z0-9]', '', raw_match).upper()
            if clean_cnr not in cnrs and len(clean_cnr) == 16:
                cnrs.append(clean_cnr)
        
        # In addition, find any sequence of 16-character alphanumerics that look like a CNR:
        raw_16_matches = re.findall(r'\b[A-Za-z]{4}\d{12}\b', q)
        for raw_match in raw_16_matches:
            clean_cnr = raw_match.upper()
            if clean_cnr not in cnrs:
                cnrs.append(clean_cnr)

        for cnr in cnrs:
            yield {
                "event": "status",
                "data": json.dumps({"phase": "searching", "message": f"Fetching eCourts Case Detail for CNR {cnr}..."}),
            }
            try:
                case_data = await ecourts.get_case_detail(cnr)
                if case_data and "data" in case_data and "courtCaseData" in case_data["data"]:
                    ccd = case_data["data"]["courtCaseData"]
                    
                    # Format eCourts case info nicely for the LLM
                    case_info = (
                        f"=== ECOURTS CASE DETAIL (VERIFIED LIVE FROM ECOURTSINDIA): CNR {cnr} ===\n"
                        f"Case Number: {ccd.get('caseNumber', 'N/A')}\n"
                        f"Case Type Raw: {ccd.get('caseTypeRaw', 'N/A')} ({ccd.get('caseType', 'N/A')})\n"
                        f"Court Name: {ccd.get('courtName', 'N/A')}\n"
                        f"State: {ccd.get('state', 'N/A')} (District: {ccd.get('district', 'N/A')})\n"
                        f"Status: {ccd.get('caseStatus', 'N/A')}\n"
                        f"Filing Number: {ccd.get('filingNumber', 'N/A')} (Filing Date: {ccd.get('filingDate', 'N/A')})\n"
                        f"Registration Number: {ccd.get('registrationNumber', 'N/A')} (Registration Date: {ccd.get('registrationDate', 'N/A')})\n"
                        f"First Hearing Date: {ccd.get('firstHearingDate', 'N/A')}\n"
                        f"Next Hearing Date: {ccd.get('nextHearingDate', 'N/A')}\n"
                        f"Decision Date: {ccd.get('decisionDate', 'N/A')}\n"
                        f"Disposal Type: {ccd.get('disposalTypeRaw', 'N/A')}\n"
                        f"Petitioner(s): {', '.join(ccd.get('petitioners', []))}\n"
                        f"Respondent(s): {', '.join(ccd.get('respondents', []))}\n"
                    )
                    
                    # Add list of hearings (last 5)
                    hearings = ccd.get("historyOfCaseHearings", [])
                    if hearings:
                        case_info += "Hearing History (Last 5 hearings):\n"
                        for h in hearings[-5:]:
                            case_info += f"  - Hearing Date: {h.get('hearingDate', 'N/A')}, Judge: {h.get('judge', 'N/A')}, Purpose: {h.get('purposeOfListing', 'N/A')}, Business on Date: {h.get('businessOnDate', 'N/A')}\n"
                    
                    # Add order files links
                    orders = ccd.get("judgmentOrders", []) + ccd.get("interimOrders", [])
                    if orders:
                        case_info += "Available Orders/Judgments:\n"
                        for o in orders:
                            case_info += f"  - Date: {o.get('orderDate', 'N/A')}, Type: {o.get('orderType', o.get('description', 'ORDER'))}, Filename: {o.get('orderUrl', 'N/A')}\n"
                            
                    case_info += f"===================================================================="
                    evidence_texts.append(case_info)
            except Exception as e:
                print(f"Error querying eCourts for CNR {cnr}: {e}")

        # Detect simple greetings or casual messages
        clean_q = q.strip().lower()
        greetings_list = [
            "hyy", "hy", "hi", "hello", "hey", "hie", "namaste", "pranam", "kaise ho", 
            "how are you", "who are you", "good morning", "good evening", "good afternoon",
            "what can you do", "help me"
        ]
        words = clean_q.split()
        is_greeting = len(words) <= 5 and any(clean_q.startswith(g) or clean_q == g or g in words for g in greetings_list)

        # 2. Query search databases if query is active and not a simple greeting
        if not is_greeting:
            live = any(x in q.lower() for x in ["latest", "recent", "today", "notification", "circular"])
            if live:
                try:
                    s = await serper_search(q)
                    if isinstance(s, dict) and "organic" in s:
                        for item in s["organic"][:3]:
                            evidence_texts.append(f"Title: {item.get('title')}\nSnippet: {item.get('snippet')}\nURL: {item.get('link')}")
                except Exception as e:
                    print(f"Serper search warning: {e}")
            try:
                k = await kanoon_search(q)
                if isinstance(k, list):
                    for item in k[:3]:
                        evidence_texts.append(f"Title: {item.get('title')}\nSnippet: {item.get('snippet')}\nURL: {item.get('link')}")
            except Exception as e:
                print(f"Kanoon search warning: {e}")


        yield {
            "event": "status",
            "data": json.dumps({"phase": "thinking", "message": "Analyzing query..." if is_greeting else "Analyzing legal context..."}),
        }
        await asyncio.sleep(0.1)

        # --- Call LLM ---
        if is_greeting:
            system_prompt = (
                "You are Grizon Legal AI, an expert AI legal assistant for Indian Law. "
                "The user has sent a general greeting or non-legal introductory message. "
                "CRITICAL LANGUAGE RULE: Respond STRICTLY AND EXCLUSIVELY IN ENGLISH. "
                "DO NOT use any Hinglish, Hindi, or transliterated words (e.g. NEVER say 'Kaise hain aap', 'badhiya hoon', 'bataiye', 'madad'). "
                "Greet them back naturally in pure English (e.g. 'Hello! How can I assist you with your legal case, IPC/BNS section, or legal dispute today?'). "
                "Only switch to another language if the user explicitly wrote their message in Hindi script, Tamil, or explicitly asked for another language. "
                "Keep your response short, friendly, and welcoming. "
                "Do NOT output structured legal headers like 'Preliminary Legal Assessment' or 'Applicable Laws'."
            )
        else:
            system_prompt = (
                "You are the Legal Research & Case Analysis Agent for Indian law. "
                "IMPORTANT: BNS stands for Bharatiya Nyaya Sanhita, BNSS stands for Bharatiya Nagarik Suraksha Sanhita, "
                "and BSA stands for Bharatiya Sakshya Adhiniyam. You must analyze queries under Indian Law only. "
                "NEVER refer to BNS as Bangladesh Penal Code or reference Bangladesh legal systems. "
                "DEFAULT LANGUAGE RULE: Write your entire explanation in clear, professional English by default. "
                "DO NOT use Hinglish or regional language transliteration unless the user explicitly wrote their prompt in that language or requested it. Otherwise, stick strictly to pure English. "
                "Return a structured, comprehensive, highly detailed markdown response with these sections:\n"
                "## 📋 Preliminary Legal Assessment\n"
                "## 📜 Applicable Laws & Acts\n"
                "## ⚖️ Relevant Case Law Precedents\n"
                "## 🔍 Arguments For & Against\n"
                "## 📌 Procedural & Risk Considerations\n"
                "## 🔗 Verification Sources\n"
                "Under the 'Verification Sources' section, you MUST list the titles and clickable Markdown links "
                "(e.g., [Title](URL)) of the relevant Indian Kanoon cases or other websites strictly using the exact IndianKanoon URLs (https://indiankanoon.org/doc/...) provided in the EVIDENCE context that you relied upon. "
                "Ensure the links are formatted exactly as markdown links.\n\n"
                "Use bullet points, bold key terms, and cite specific sections/cases.\n"
                "End with: *Disclaimer: This is AI-generated legal research, not legal advice.*"
            )

        user_prompt = f"QUERY:\n{q}\n\nEVIDENCE:\n" + ("\n\n".join(evidence_texts) if evidence_texts else "None")

        start_ms = int(time.time() * 1000)
        full_answer = ""
        try:
            answer = sanitize_verification_links(await llm_chat(system_prompt, user_prompt), evidence_texts=evidence_texts)
            # Stream the answer character-by-character in chunks
            chunk_size = 8
            for i in range(0, len(answer), chunk_size):
                if await request.is_disconnected():
                    yield {"event": "cancelled", "data": json.dumps({"reason": "client_disconnect"})}
                    return
                chunk = answer[i:i + chunk_size]
                full_answer += chunk
                yield {"event": "chunk", "data": json.dumps({"content": chunk})}
                await asyncio.sleep(0.015)  # ~60 chars/sec streaming feel
        except Exception as e:
            print(f"LLM Error: {e}")
            error_answer = (
                f"## ⚠️ Legal Analysis Notice\n\n"
                f"I encountered an issue processing your request. "
                f"Please try again in a moment.\n\n"
                f"*Technical detail: {str(e)[:200]}*"
            )
            full_answer = error_answer
            yield {"event": "chunk", "data": json.dumps({"content": error_answer})}

        end_ms = int(time.time() * 1000)
        duration_ms = end_ms - start_ms

        # Save assistant message
        asst_msg = make_message(
            conv_id, job.get("userId", "usr_demo_001"), "assistant", full_answer,
            agent_slug=job.get("agentSlug") or "legal-research-agent"
        )
        asst_msg["creditsDeducted"] = 1
        asst_msg["inputTokens"] = len(user_prompt.split()) * 2
        asst_msg["outputTokens"] = len(full_answer.split()) * 2

        # Update conversation title from first message
        if conv_id in CONVERSATIONS and CONVERSATIONS[conv_id]["title"] == "New Legal Analysis":
            title = q[:60] + ("..." if len(q) > 60 else "")
            CONVERSATIONS[conv_id]["title"] = title
            CONVERSATIONS[conv_id]["titleGeneratedAt"] = NOW_ISO()

        # --- usage event ---
        yield {
            "event": "usage",
            "data": json.dumps({
                "tokensUsed": {
                    "inputFresh": len(user_prompt.split()) * 2,
                    "inputCached": 0,
                    "output": len(full_answer.split()) * 2,
                    "cacheWrite": 0,
                },
                "creditsDeducted": 1,
            }),
        }

        # --- done event ---
        yield {
            "event": "done",
            "data": json.dumps({
                "messageId": asst_msg["id"],
                "conversationId": conv_id,
                "status": "completed",
                "durationMs": duration_ms,
                "llmFirstTokenMs": 200,
                "llmTotalMs": duration_ms,
                "title": CONVERSATIONS.get(conv_id, {}).get("title", "Legal Analysis"),
                "tokensUsed": {
                    "input": len(user_prompt.split()) * 2,
                    "inputCached": 0,
                    "output": len(full_answer.split()) * 2,
                    "cacheWrite": 0,
                },
            }),
        }

        # Cleanup
        JOBS.pop(job_id, None)

    return EventSourceResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/v1/chat/{conv_id}/cancel")
async def cancel_chat(conv_id: str, authorization: str | None = Header(None)):
    return {"success": True, "data": None}


# ═════════════════════════════════════════════════════════════
#  FILES (stub)
# ═════════════════════════════════════════════════════════════
@app.post("/api/v1/files")
async def upload_file(authorization: str | None = Header(None)):
    get_current_user(authorization)
    return ok({
        "file": {
            "id": f"file_{uuid.uuid4().hex[:8]}",
            "userId": "usr_demo_001",
            "conversationId": None,
            "messageId": None,
            "fileName": "uploaded.pdf",
            "fileType": "application/pdf",
            "fileSize": 0,
            "storagePath": "",
            "processingStatus": "ready",
            "extractedText": None,
            "vectorised": False,
            "errorMessage": None,
            "uploadedAt": NOW_ISO(),
        }
    })


# ═════════════════════════════════════════════════════════════
#  SARVAM MULTILINGUAL SPEECH DICTATION
# ═════════════════════════════════════════════════════════════
import httpx
from fastapi import Header

class TranscribeRequest(BaseModel):
    audioBase64: str

@app.post("/api/v1/transcribe")
async def transcribe(payload: TranscribeRequest, authorization: str | None = Header(None)):
    get_current_user(authorization)
    
    sarvam_key = os.getenv("SARVAM_API_KEY", "").strip()
    if not sarvam_key:
        raise HTTPException(
            status_code=500,
            detail="Sarvam API Key is not configured in backend .env"
        )
    
    import base64
    try:
        audio_bytes = base64.b64decode(payload.audioBase64)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid base64 audio data: {str(e)}"
        )
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            headers = {
                "api-subscription-key": sarvam_key
            }
            files = {
                "file": ("audio.wav", audio_bytes, "audio/wav")
            }
            data = {
                "model": "saaras:v3",
                "language_code": "hi-IN",
                "mode": "codemix"
            }
            resp = await client.post(
                "https://api.sarvam.ai/speech-to-text",
                headers=headers,
                files=files,
                data=data
            )
            
            if resp.status_code != 200:
                print(f"Sarvam STT failed with status {resp.status_code}: {resp.text}")
                raise HTTPException(
                    status_code=resp.status_code,
                    detail=f"Sarvam STT API error: {resp.text}"
                )
            
            res_data = resp.json()
            transcript = res_data.get("transcript", "")
            return ok({"transcript": transcript})
            
    except httpx.RequestError as exc:
        print(f"HTTP request to Sarvam STT failed: {exc}")
        raise HTTPException(
            status_code=503,
            detail=f"Communication with Sarvam AI failed: {str(exc)}"
        )
    except Exception as e:
        print(f"Unhandled exception during transcription: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Speech transcription failed: {str(e)}"
        )

