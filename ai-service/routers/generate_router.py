"""
Generation router — converts text to handwritten pages.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import base64
import logging

from services.generator import HandwritingGenerator

router = APIRouter()
logger = logging.getLogger(__name__)
generator = HandwritingGenerator()


class GenerateRequest(BaseModel):
    text: str
    generationId: Optional[str] = None
    profileId: Optional[str] = None
    modelId: Optional[str] = None
    styleMetrics: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None


class GenerateResponse(BaseModel):
    success: bool
    pdfBase64: Optional[str] = None
    pngBase64Array: Optional[List[str]] = None
    pageCount: int = 0
    processingTimeMs: Optional[int] = None


@router.post("/generate", response_model=GenerateResponse)
async def generate_handwriting(request: GenerateRequest):
    """Generate handwritten pages from text input."""
    import time
    start = time.time()

    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        settings = request.settings or {}
        style_metrics = request.styleMetrics

        # Generate pages
        pages = generator.generate(
            text=request.text,
            settings=settings,
            style_metrics=style_metrics,
        )

        if not pages:
            raise HTTPException(status_code=500, detail="Failed to generate pages")

        # Convert to bytes
        pdf_bytes = generator.pages_to_pdf_bytes(pages)
        png_b64_list = generator.pages_to_png_b64_list(pages)

        pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8') if pdf_bytes else None

        elapsed_ms = int((time.time() - start) * 1000)
        logger.info(f"Generated {len(pages)} pages in {elapsed_ms}ms")

        return GenerateResponse(
            success=True,
            pdfBase64=pdf_b64,
            pngBase64Array=png_b64_list,
            pageCount=len(pages),
            processingTimeMs=elapsed_ms,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/preview")
async def generate_preview(request: GenerateRequest):
    """Generate a single-page preview (faster response)."""
    try:
        # Only generate first 200 chars for preview
        preview_text = request.text[:200] if request.text else "Preview"
        settings = request.settings or {}

        pages = generator.generate(
            text=preview_text,
            settings=settings,
            style_metrics=request.styleMetrics,
        )

        if pages:
            import io
            buf = io.BytesIO()
            pages[0].save(buf, format='PNG', optimize=True)
            png_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            return {'success': True, 'previewB64': png_b64}

        return {'success': False, 'previewB64': None}

    except Exception as e:
        logger.error(f"Preview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
