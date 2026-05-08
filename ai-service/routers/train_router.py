"""
Training router — handles handwriting style extraction from samples.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging
import uuid

from services.extractor import HandwritingExtractor

router = APIRouter()
logger = logging.getLogger(__name__)
extractor = HandwritingExtractor()

# In-memory job store (use Redis in production)
training_jobs: Dict[str, Dict] = {}


class TrainRequest(BaseModel):
    profileId: str
    userId: str
    sampleUrls: List[str]


class TrainResponse(BaseModel):
    success: bool
    modelId: str
    styleMetrics: Optional[Dict] = None
    message: str = "Training completed"


def do_training(job_id: str, profile_id: str, sample_urls: List[str]):
    """Background training task."""
    try:
        training_jobs[job_id] = {'status': 'processing', 'progress': 10}

        # Extract style metrics from all samples
        style_metrics = extractor.extract_from_urls(sample_urls)

        training_jobs[job_id] = {
            'status': 'ready',
            'progress': 100,
            'modelId': job_id,
            'styleMetrics': style_metrics,
        }
        logger.info(f"Training complete for profile {profile_id}")

    except Exception as e:
        logger.error(f"Training failed for {profile_id}: {e}")
        training_jobs[job_id] = {'status': 'failed', 'error': str(e)}


@router.post("/train")
async def train_model(request: TrainRequest, background_tasks: BackgroundTasks):
    """Start handwriting style extraction in background."""
    if not request.sampleUrls:
        raise HTTPException(status_code=400, detail="No sample URLs provided")

    model_id = str(uuid.uuid4())
    training_jobs[model_id] = {'status': 'queued', 'progress': 0}

    background_tasks.add_task(do_training, model_id, request.profileId, request.sampleUrls)

    return {
        "success": True,
        "modelId": model_id,
        "message": "Training started in background",
        "styleMetrics": None,
    }


@router.get("/train/{model_id}/status")
async def get_training_status(model_id: str):
    """Poll training job status."""
    job = training_jobs.get(model_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/train/sync")
async def train_model_sync(request: TrainRequest):
    """Synchronous training for small sample sets."""
    if not request.sampleUrls:
        raise HTTPException(status_code=400, detail="No sample URLs provided")

    try:
        style_metrics = extractor.extract_from_urls(request.sampleUrls)
        model_id = str(uuid.uuid4())

        return TrainResponse(
            success=True,
            modelId=model_id,
            styleMetrics=style_metrics,
            message="Training completed",
        )
    except Exception as e:
        logger.error(f"Sync training failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
