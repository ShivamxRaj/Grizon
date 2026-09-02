import os
import io
import base64
import httpx
from typing import Optional, Dict, Any

try:
    from sarvamai import SarvamAI
except ImportError:
    SarvamAI = None


class SarvamService:
    def __init__(self):
        self.api_key = os.getenv("SARVAM_API_KEY", "").strip()
        self.client = None
        if self.api_key and SarvamAI:
            try:
                self.client = SarvamAI(api_subscription_key=self.api_key)
            except Exception as e:
                print("Failed to initialize SarvamAI SDK client:", e)

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def translate_text(
        self,
        text: str,
        target_language_code: str = "en-IN",
        source_language_code: str = "auto",
    ) -> str:
        """
        Translates text from regional Indian language (Hindi, Tamil, Telugu, Marathi, Bengali, etc.)
        to target language (e.g. English 'en-IN' or Hindi 'hi-IN').
        """
        if not self.api_key or not text.strip():
            return text

        # Limit chunk size per Sarvam API limits (max 1500 chars per call)
        chunks = [text[i : i + 1500] for i in range(0, len(text), 1500)]
        translated_chunks = []

        # Try SDK first
        if self.client:
            try:
                for chunk in chunks:
                    res = self.client.text.translate(
                        input=chunk,
                        source_language_code=source_language_code,
                        target_language_code=target_language_code,
                    )
                    translated_chunks.append(getattr(res, "translated_text", str(res)))
                return " ".join(translated_chunks)
            except Exception as e:
                print("Sarvam SDK translate failed, trying REST API fallback:", e)

        # Fallback to direct HTTP REST call
        try:
            async with httpx.AsyncClient(timeout=15) as http_client:
                headers = {"api-subscription-key": self.api_key}
                for chunk in chunks:
                    resp = await http_client.post(
                        "https://api.sarvam.ai/translate",
                        headers=headers,
                        json={
                            "input": chunk,
                            "source_language_code": source_language_code,
                            "target_language_code": target_language_code,
                            "mode": "formal",
                        },
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        translated_chunks.append(data.get("translated_text", chunk))
                    else:
                        translated_chunks.append(chunk)
                return " ".join(translated_chunks)
        except Exception as e:
            print("Sarvam REST translate exception:", e)
            return text

    async def ocr_document(
        self,
        file_bytes: bytes,
        file_name: str = "document.pdf",
        language: str = "hi-IN",
    ) -> str:
        """
        Digitizes scanned PDFs, handwritten legal documents, and images using Sarvam Document Intelligence / OCR.
        Returns clean extracted text or Markdown.
        """
        if not self.api_key:
            return ""

        # Determine MIME type from filename extension
        ext = file_name.lower().split('.')[-1] if '.' in file_name else 'pdf'
        mime_type = "application/pdf"
        if ext in ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff']:
            mime_type = f"image/{ext if ext != 'jpg' else 'jpeg'}"

        # Direct REST endpoint for Sarvam OCR / Document Intelligence
        try:
            async with httpx.AsyncClient(timeout=30) as http_client:
                headers = {"api-subscription-key": self.api_key}
                files = {"file": (file_name, file_bytes, mime_type)}
                data = {"language_code": language, "output_format": "md"}

                resp = await http_client.post(
                    "https://api.sarvam.ai/ocr",
                    headers=headers,
                    files=files,
                    data=data,
                )
                if resp.status_code == 200:
                    result = resp.json()
                    extracted = result.get("text", result.get("extracted_text", ""))
                    if extracted and len(extracted.strip()) > 5:
                        return extracted
        except Exception as e:
            print("Sarvam OCR REST exception:", e)

        # SDK Fallback if available
        if self.client:
            try:
                res = self.client.doc_ai.digitise(
                    file=[(file_name, file_bytes)],
                    language=language,
                    output_format="md",
                )
                if hasattr(res, "text") and getattr(res, "text", ""):
                    return res.text
            except Exception as e:
                print("Sarvam SDK digitise exception:", e)

        return ""


# Singleton instance
sarvam_service = SarvamService()
