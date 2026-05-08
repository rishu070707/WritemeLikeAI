"""
Handwriting style extraction from uploaded samples.
Uses OpenCV for image processing and character segmentation.
"""

import cv2
import numpy as np
from PIL import Image, ImageFilter
import io
import requests
import base64
from typing import List, Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class HandwritingExtractor:
    """
    Extracts handwriting style features from sample images.
    Performs background removal, noise reduction, line segmentation,
    character isolation, and stroke analysis.
    """

    def __init__(self):
        self.min_char_area = 50
        self.max_char_area = 5000
        self.line_gap_threshold = 20

    def load_image_from_url(self, url: str) -> Optional[np.ndarray]:
        """Download and load image from URL."""
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            img_array = np.frombuffer(response.content, np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            logger.error(f"Failed to load image from {url}: {e}")
            return None

    def preprocess_image(self, img: np.ndarray) -> np.ndarray:
        """
        Clean handwriting image:
        1. Convert to grayscale
        2. Remove background noise
        3. Adaptive thresholding for binarization
        4. Morphological cleanup
        """
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Denoise
        denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

        # Adaptive threshold - handles uneven lighting
        binary = cv2.adaptiveThreshold(
            denoised, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            blockSize=25, C=10
        )

        # Morphological operations to clean up
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

        return cleaned

    def segment_lines(self, binary: np.ndarray) -> List[np.ndarray]:
        """Segment handwritten text into individual lines."""
        # Horizontal projection profile
        h_proj = np.sum(binary, axis=1)

        # Find line boundaries
        in_line = False
        lines = []
        line_start = 0

        for i, val in enumerate(h_proj):
            if val > 50 and not in_line:
                in_line = True
                line_start = max(0, i - 5)
            elif val <= 20 and in_line:
                in_line = False
                line_end = min(binary.shape[0], i + 5)
                if line_end - line_start > 15:
                    lines.append(binary[line_start:line_end, :])

        return lines

    def extract_characters(self, line: np.ndarray) -> List[np.ndarray]:
        """Extract individual characters from a line using connected components."""
        contours, _ = cv2.findContours(line, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        chars = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if self.min_char_area < area < self.max_char_area:
                x, y, w, h = cv2.boundingRect(contour)
                if h > 10 and w > 5:
                    char_img = line[y:y+h, x:x+w]
                    # Normalize to consistent size
                    char_normalized = self._normalize_char(char_img)
                    chars.append({
                        'image': char_normalized,
                        'bbox': (x, y, w, h),
                        'aspect_ratio': w / h,
                    })

        # Sort by x position
        chars.sort(key=lambda c: c['bbox'][0])
        return chars

    def _normalize_char(self, char_img: np.ndarray, size: int = 64) -> np.ndarray:
        """Normalize character to consistent size with padding."""
        h, w = char_img.shape[:2]
        # Add padding
        pad = max(w, h) // 10 + 2
        padded = cv2.copyMakeBorder(char_img, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
        # Resize maintaining aspect ratio
        resized = cv2.resize(padded, (size, size), interpolation=cv2.INTER_AREA)
        return resized

    def analyze_style_metrics(self, img: np.ndarray, binary: np.ndarray) -> Dict:
        """Extract handwriting style metrics."""
        lines = self.segment_lines(binary)

        if not lines:
            return self._default_metrics()

        # Analyze slant angle using Hough transform
        slant_angle = self._estimate_slant(binary)

        # Analyze stroke width
        avg_stroke_width = self._estimate_stroke_width(binary)

        # Analyze letter spacing
        spacing_metrics = self._analyze_spacing(lines)

        # Analyze baseline variance
        baseline_variance = self._analyze_baseline(lines)

        # Estimate ink pressure (stroke width variance)
        ink_variance = self._analyze_ink_variance(binary)

        return {
            'avgSlant': float(slant_angle),
            'avgSize': float(avg_stroke_width),
            'avgSpacing': float(spacing_metrics['avg_spacing']),
            'strokeStyle': self._classify_stroke(avg_stroke_width),
            'inkFlowVariance': float(ink_variance),
            'baselineVariance': float(baseline_variance),
            'letterSpacingVariance': float(spacing_metrics['variance']),
            'wordSpacingVariance': float(spacing_metrics.get('word_spacing', 2.0)),
        }

    def _estimate_slant(self, binary: np.ndarray) -> float:
        """Estimate writing slant angle."""
        try:
            edges = cv2.Canny(binary, 50, 150)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=30,
                                    minLineLength=20, maxLineGap=5)
            if lines is None:
                return 0.0
            angles = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                if x2 - x1 != 0:
                    angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
                    if -45 < angle < 45:
                        angles.append(angle)
            return float(np.median(angles)) if angles else 0.0
        except Exception:
            return 0.0

    def _estimate_stroke_width(self, binary: np.ndarray) -> float:
        """Estimate average stroke width using distance transform."""
        dist = cv2.distanceTransform(binary, cv2.DIST_L2, 3)
        nonzero = dist[dist > 0]
        if len(nonzero) == 0:
            return 2.0
        return float(np.mean(nonzero) * 2)

    def _analyze_spacing(self, lines: List[np.ndarray]) -> Dict:
        """Analyze character and word spacing."""
        spacings = []
        for line in lines[:3]:  # Sample first 3 lines
            v_proj = np.sum(line, axis=0)
            gaps = []
            in_gap = False
            gap_start = 0
            for i, v in enumerate(v_proj):
                if v == 0 and not in_gap:
                    in_gap = True
                    gap_start = i
                elif v > 0 and in_gap:
                    in_gap = False
                    gap_size = i - gap_start
                    if 1 < gap_size < 50:
                        gaps.append(gap_size)
            spacings.extend(gaps)

        if not spacings:
            return {'avg_spacing': 3.0, 'variance': 1.0, 'word_spacing': 8.0}

        return {
            'avg_spacing': float(np.mean(spacings)),
            'variance': float(np.std(spacings)),
            'word_spacing': float(np.percentile(spacings, 75)) if spacings else 8.0,
        }

    def _analyze_baseline(self, lines: List[np.ndarray]) -> float:
        """Measure baseline consistency across lines."""
        baselines = []
        for line in lines:
            h_proj = np.sum(line, axis=1)
            nonzero = np.where(h_proj > 0)[0]
            if len(nonzero) > 0:
                baselines.append(float(nonzero[-1]))
        if len(baselines) < 2:
            return 2.0
        return float(np.std(np.diff(baselines)))

    def _analyze_ink_variance(self, binary: np.ndarray) -> float:
        """Analyze ink flow variance from stroke width changes."""
        dist = cv2.distanceTransform(binary, cv2.DIST_L2, 3)
        nonzero = dist[dist > 0]
        if len(nonzero) == 0:
            return 0.1
        return float(min(np.std(nonzero) / (np.mean(nonzero) + 1e-6), 1.0))

    def _classify_stroke(self, stroke_width: float) -> str:
        if stroke_width < 1.5:
            return 'fine'
        elif stroke_width < 3.0:
            return 'medium'
        else:
            return 'bold'

    def _default_metrics(self) -> Dict:
        return {
            'avgSlant': 0.0,
            'avgSize': 2.0,
            'avgSpacing': 3.0,
            'strokeStyle': 'medium',
            'inkFlowVariance': 0.1,
            'baselineVariance': 2.0,
            'letterSpacingVariance': 1.0,
            'wordSpacingVariance': 2.0,
        }

    def extract_from_urls(self, urls: List[str]) -> Dict:
        """Process multiple sample images and aggregate style metrics."""
        all_metrics = []

        for url in urls:
            try:
                img = self.load_image_from_url(url)
                if img is None:
                    continue
                binary = self.preprocess_image(img)
                metrics = self.analyze_style_metrics(img, binary)
                all_metrics.append(metrics)
            except Exception as e:
                logger.error(f"Error processing {url}: {e}")
                continue

        if not all_metrics:
            return self._default_metrics()

        # Average all metrics
        averaged = {}
        for key in all_metrics[0]:
            if key == 'strokeStyle':
                # Most common stroke style
                styles = [m[key] for m in all_metrics]
                averaged[key] = max(set(styles), key=styles.count)
            else:
                averaged[key] = float(np.mean([m[key] for m in all_metrics]))

        return averaged
