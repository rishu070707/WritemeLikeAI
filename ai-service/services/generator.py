"""
Handwriting Generation Engine
Converts text to realistic handwritten output using style-aware rendering.
Implements stroke simulation, natural imperfections, slant, baseline drift, and page layout.
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageTransform
import io
import base64
import math
import random
from typing import List, Dict, Tuple, Optional
import logging
import os

logger = logging.getLogger(__name__)

# Page dimensions (A4 at 96 DPI)
A4_WIDTH = 794
A4_HEIGHT = 1123


class HandwritingGenerator:
    """
    Generates realistic handwritten pages from typed text.
    Uses font-based rendering combined with style-aware distortions
    to simulate natural human handwriting including slant, baseline variance,
    ink pressure variation, and per-character transformations.
    """

    def __init__(self):
        self.fonts_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fonts')
        self._font_cache = {}
        self.handwriting_fonts = self._find_handwriting_fonts()

    def _find_handwriting_fonts(self) -> List[str]:
        """Find available handwriting fonts."""
        font_files = []
        if os.path.exists(self.fonts_dir):
            for f in sorted(os.listdir(self.fonts_dir)):
                if f.lower().endswith(('.ttf', '.otf')):
                    font_files.append(os.path.join(self.fonts_dir, f))
        return font_files

    def _get_font(self, size: int) -> ImageFont.ImageFont:
        """Get cached font at given size."""
        if size not in self._font_cache:
            try:
                if not self.handwriting_fonts:
                    self._ensure_default_handwriting_font()

                if self.handwriting_fonts:
                    self._font_cache[size] = ImageFont.truetype(self.handwriting_fonts[0], size)
                else:
                    self._font_cache[size] = ImageFont.load_default()
            except Exception:
                self._font_cache[size] = ImageFont.load_default()
        return self._font_cache[size]

    def _ensure_default_handwriting_font(self):
        """Download multiple default handwriting fonts if none exist."""
        os.makedirs(self.fonts_dir, exist_ok=True)

        fonts_to_download = {
            'Caveat-Regular.ttf': "https://github.com/google/fonts/raw/main/ofl/caveat/Caveat-Regular.ttf",
            'IndieFlower-Regular.ttf': "https://github.com/google/fonts/raw/main/ofl/indieflower/IndieFlower-Regular.ttf",
            'ShadowsIntoLight.ttf': "https://github.com/google/fonts/raw/main/ofl/shadowsintolight/ShadowsIntoLight.ttf",
        }

        import requests
        for name, url in fonts_to_download.items():
            target_path = os.path.join(self.fonts_dir, name)
            if not os.path.exists(target_path):
                try:
                    logger.info(f"Downloading font {name}...")
                    r = requests.get(url, timeout=30)
                    r.raise_for_status()
                    with open(target_path, 'wb') as f:
                        f.write(r.content)
                    logger.info(f"Font {name} downloaded successfully.")
                except Exception as e:
                    logger.error(f"Failed to download {name}: {e}")

        self.handwriting_fonts = self._find_handwriting_fonts()

    def _get_font_for_style(self, size: int, style: Dict) -> ImageFont.ImageFont:
        """Select best matching font based on style metrics."""
        if not self.handwriting_fonts:
            self._ensure_default_handwriting_font()

        if not self.handwriting_fonts:
            return ImageFont.load_default()

        stroke_style = style.get('strokeStyle', 'medium')

        # Map stroke style to available fonts
        if stroke_style == 'bold' and len(self.handwriting_fonts) > 1:
            selected_font_path = self.handwriting_fonts[1]  # IndieFlower — thicker
        elif stroke_style == 'fine' and len(self.handwriting_fonts) > 2:
            selected_font_path = self.handwriting_fonts[2]  # ShadowsIntoLight — light
        else:
            selected_font_path = self.handwriting_fonts[0]  # Caveat — default

        font_key = f"{selected_font_path}_{size}"
        if font_key not in self._font_cache:
            try:
                self._font_cache[font_key] = ImageFont.truetype(selected_font_path, size)
            except Exception:
                return ImageFont.load_default()

        return self._font_cache[font_key]

    def _parse_ink_color(self, color_hex: str) -> Tuple[int, int, int, int]:
        """Parse hex color to RGBA."""
        try:
            color_hex = color_hex.lstrip('#')
            r, g, b = int(color_hex[0:2], 16), int(color_hex[2:4], 16), int(color_hex[4:6], 16)
            return (r, g, b, 255)
        except Exception:
            return (26, 26, 46, 255)

    def _create_page_background(self, settings: Dict) -> Image.Image:
        """Create page background with the selected template."""
        page_type = settings.get('pageType', 'lined')
        width = settings.get('pageWidth', A4_WIDTH)
        height = settings.get('pageHeight', A4_HEIGHT)

        img = Image.new('RGBA', (width, height), (252, 251, 248, 255))
        draw = ImageDraw.Draw(img)

        margin_top = settings.get('marginTop', 60)
        margin_left = settings.get('marginLeft', 60)
        margin_right = settings.get('marginRight', 40)
        font_size = settings.get('fontSize', 24)
        line_spacing_mult = settings.get('lineSpacing', 1.5)
        line_height = int(font_size * line_spacing_mult * 1.4)

        if page_type == 'lined':
            y = margin_top + line_height
            while y < height - 40:
                draw.line([(margin_left - 20, y), (width - margin_right, y)],
                          fill=(180, 200, 220, 100), width=1)
                y += line_height
            draw.line([(margin_left, 0), (margin_left, height)],
                      fill=(220, 100, 100, 80), width=2)

        elif page_type == 'double-lined':
            y = margin_top + line_height
            while y < height - 40:
                draw.line([(margin_left - 20, y), (width - margin_right, y)],
                          fill=(180, 200, 220, 100), width=1)
                draw.line([(margin_left - 20, y + 8), (width - margin_right, y + 8)],
                          fill=(180, 200, 220, 60), width=1)
                y += line_height
            draw.line([(margin_left, 0), (margin_left, height)],
                      fill=(220, 100, 100, 80), width=2)

        elif page_type == 'grid':
            grid_size = max(line_height // 2, 20)
            for x in range(margin_left, width - margin_right, grid_size):
                draw.line([(x, margin_top), (x, height - 40)],
                          fill=(180, 200, 220, 70), width=1)
            for y in range(margin_top, height - 40, grid_size):
                draw.line([(margin_left - 20, y), (width - margin_right, y)],
                          fill=(180, 200, 220, 70), width=1)

        elif page_type == 'ruled':
            y = margin_top + line_height
            while y < height - 40:
                draw.line([(0, y), (width, y)], fill=(160, 180, 220, 80), width=1)
                y += line_height
            draw.line([(margin_left, 0), (margin_left, height)],
                      fill=(220, 100, 100, 80), width=2)
            draw.line([(margin_left + 30, 0), (margin_left + 30, height)],
                      fill=(220, 100, 100, 40), width=1)

        elif page_type == 'blank':
            pass  # No lines

        self._add_paper_texture(img)
        return img

    def _add_paper_texture(self, img: Image.Image):
        """Add subtle grain texture to simulate paper."""
        if not hasattr(self, '_paper_noise'):
            self._paper_noise = np.random.normal(0, 2, (A4_HEIGHT, A4_WIDTH)).astype(np.int16)

        arr = np.array(img)
        h, w = arr.shape[:2]
        noise = self._paper_noise[:h, :w]

        for c in range(3):
            arr[:, :, c] = np.clip(arr[:, :, c].astype(np.int16) + noise, 0, 255).astype(np.uint8)
        img.paste(Image.fromarray(arr.astype(np.uint8)))

    def _draw_char_with_slant(
        self,
        canvas: Image.Image,
        char: str,
        x: float,
        y: float,
        font: ImageFont.ImageFont,
        ink_color: Tuple,
        slant_deg: float,
        jitter_x: float,
        jitter_y: float,
        alpha_scale: float = 1.0,
    ) -> float:
        """
        Draw a single character at (x, y) with applied slant transformation.
        Returns the actual pixel width of the character.
        """
        try:
            bbox = font.getbbox(char)
            char_w = max(bbox[2] - bbox[0], 1)
            char_h = max(bbox[3] - bbox[1], 1)
        except Exception:
            char_w = max(font.size, 8)
            char_h = max(font.size, 8)

        # Draw character onto a small transparent tile
        pad = 8
        tile_w = char_w + pad * 2
        tile_h = char_h + pad * 2 + abs(int(math.tan(math.radians(abs(slant_deg))) * char_h)) + 4
        tile = Image.new('RGBA', (tile_w, tile_h), (0, 0, 0, 0))
        tile_draw = ImageDraw.Draw(tile)

        # Apply alpha variation for ink pressure
        alpha = int(ink_color[3] * alpha_scale)
        char_color = (ink_color[0], ink_color[1], ink_color[2], alpha)
        tile_draw.text((pad, pad), char, font=font, fill=char_color)

        # Apply slant via affine shear if non-zero
        if abs(slant_deg) > 0.5:
            shear = math.tan(math.radians(-slant_deg))  # negative = forward lean (italic)
            # Affine transform: shear X by shear * (y - center)
            # PIL transform uses (a, b, c, d, e, f): new_x = a*x + b*y + c
            a, b, c = 1, shear, 0
            d, e, f = 0, 1, 0
            tile = tile.transform(
                (tile_w, tile_h),
                Image.AFFINE,
                (a, b, c, d, e, f),
                resample=Image.BILINEAR,
            )

        # Composite onto canvas
        paste_x = int(x + jitter_x) - pad
        paste_y = int(y + jitter_y) - pad
        canvas.paste(tile, (paste_x, paste_y), tile)

        return float(char_w)

    def _render_text_to_page(
        self, text: str, settings: Dict, style: Dict, page_bg: Image.Image
    ) -> Tuple[Image.Image, str]:
        """Render text onto page background with full style application."""
        width, height = page_bg.width, page_bg.height
        margin_left = settings.get('marginLeft', 60)
        margin_right = settings.get('marginRight', 40)
        margin_top = settings.get('marginTop', 60)
        font_size = settings.get('fontSize', 24)
        line_spacing = settings.get('lineSpacing', 1.5)
        letter_spacing = settings.get('letterSpacing', 1.0)
        ink_color_hex = settings.get('inkColor', '#1a1a2e')
        imperfection = float(settings.get('imperfectionLevel', 0.5))

        # Slant: user setting overrides profile value if explicitly set
        slant_deg = float(settings.get('slantAngle', style.get('avgSlant', 0.0)))

        ink_color = self._parse_ink_color(ink_color_hex)
        font = self._get_font_for_style(font_size, style)
        line_height = int(font_size * line_spacing * 1.4)

        # Style-derived parameters
        baseline_variance = float(style.get('baselineVariance', 2.0)) * imperfection
        letter_spacing_variance = float(style.get('letterSpacingVariance', 1.0))
        ink_flow_variance = float(style.get('inkFlowVariance', 0.1))

        text_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))

        x, y = float(margin_left), float(margin_top + 10)
        remaining_text = ""
        paragraphs = text.split('\n')
        paragraph_idx = 0
        baseline_drift = 0.0

        # Per-line baseline wobble state
        line_baseline_offsets: List[float] = []

        while paragraph_idx < len(paragraphs):
            paragraph = paragraphs[paragraph_idx]
            words = paragraph.split(' ')
            word_idx = 0
            # New line — new baseline drift target
            baseline_drift += random.gauss(0, baseline_variance * 0.4)
            baseline_drift = float(np.clip(baseline_drift, -baseline_variance, baseline_variance))

            while word_idx < len(words):
                word = words[word_idx]
                if not word:
                    x += font_size * 0.35 * letter_spacing
                    word_idx += 1
                    continue

                word_w = self._measure_word_width(word, font, imperfection, style, settings)

                if x + word_w > width - margin_right and x > margin_left + 5:
                    x = float(margin_left)
                    y += line_height
                    baseline_drift += random.gauss(0, baseline_variance * 0.35)
                    baseline_drift = float(np.clip(baseline_drift, -baseline_variance, baseline_variance))

                    if y + line_height > height - 40:
                        rem_in_para = ' '.join(words[word_idx:])
                        rem_paras = '\n'.join(paragraphs[paragraph_idx + 1:])
                        remaining_text = rem_in_para + ('\n' + rem_paras if rem_paras else '')
                        break

                actual_w = self._draw_word(
                    text_layer, word, x, y + baseline_drift,
                    font, ink_color, imperfection, slant_deg,
                    style, settings, ink_flow_variance,
                )

                space_w = int(font_size * 0.38 * letter_spacing)
                x += actual_w + space_w
                word_idx += 1

            if remaining_text:
                break

            x = float(margin_left)
            y += line_height
            paragraph_idx += 1
            if y + line_height > height - 40 and paragraph_idx < len(paragraphs):
                remaining_text = '\n'.join(paragraphs[paragraph_idx:])
                break

        result = Image.alpha_composite(page_bg.convert('RGBA'), text_layer)
        return result, remaining_text

    def _measure_word_width(self, word: str, font: ImageFont.ImageFont,
                            imperfection: float, style: Dict, settings: Dict) -> float:
        total_w = 0.0
        letter_spacing_mult = float(settings.get('letterSpacing', 1.0))
        for char in word:
            try:
                bbox = font.getbbox(char)
                char_w = max(bbox[2] - bbox[0], 1)
            except Exception:
                char_w = max(font.size * 0.6, 1)
            # Small positive extra spacing only (no negative)
            extra = max(0.0, random.gauss(0, style.get('letterSpacingVariance', 1.0) * imperfection * 0.5))
            total_w += char_w + (letter_spacing_mult - 1.0) * char_w * 0.2 + extra
        return total_w

    def _draw_word(
        self,
        image: Image.Image,
        word: str,
        x: float,
        y: float,
        font: ImageFont.ImageFont,
        ink_color: Tuple,
        imperfection: float,
        slant_deg: float,
        style: Dict,
        settings: Dict,
        ink_flow_variance: float,
    ) -> float:
        """Draw a word character by character with slant and per-char style variation."""
        cur_x = x
        letter_spacing_mult = float(settings.get('letterSpacing', 1.0))
        letter_spacing_variance = float(style.get('letterSpacingVariance', 1.0))

        for char in word:
            # Per-character jitter (position noise)
            jitter_scale = imperfection * 0.8
            jx = random.gauss(0, jitter_scale)
            jy = random.gauss(0, jitter_scale * 0.5)

            # Per-character alpha variation (ink pressure simulation)
            pressure_var = max(0.0, min(1.0, ink_flow_variance * imperfection * 3.0))
            alpha_scale = random.uniform(max(0.75, 1.0 - pressure_var), 1.0)

            char_w = self._draw_char_with_slant(
                image, char, cur_x, y, font, ink_color,
                slant_deg, jx, jy, alpha_scale
            )

            # Advance cursor with subtle letter-spacing variation
            extra_spacing = max(0.0, random.gauss(0, letter_spacing_variance * imperfection * 0.4))
            base_extra = (letter_spacing_mult - 1.0) * char_w * 0.25
            cur_x += char_w + base_extra + extra_spacing

        return cur_x - x

    def _apply_pen_effects(self, page: Image.Image, pen_type: str, imperfection: float) -> Image.Image:
        """Apply pen-type-specific post-processing effects."""
        if pen_type == 'fountain':
            if imperfection > 0.3:
                page = page.filter(ImageFilter.GaussianBlur(0.35))
        elif pen_type == 'pencil':
            arr = np.array(page)
            noise = np.random.normal(0, 9 * imperfection, arr.shape[:2])
            if arr.shape[2] == 4:
                arr[:, :, 3] = np.clip(
                    arr[:, :, 3].astype(np.float32) - np.abs(noise), 0, 255
                ).astype(np.uint8)
            page = Image.fromarray(arr)
        elif pen_type == 'marker':
            if imperfection > 0.2:
                page = page.filter(ImageFilter.GaussianBlur(0.55))
        elif pen_type == 'gel':
            # Gel pens — slightly sharper, higher contrast
            if imperfection > 0.4:
                page = page.filter(ImageFilter.SHARPEN)
        # ballpoint: no extra filter
        return page

    def generate(self, text: str, settings: Dict, style_metrics: Optional[Dict] = None) -> List[Image.Image]:
        """
        Generate handwritten pages for the given text.

        Font size: The 'fontSize' in settings is the user-facing size in pixels (12–48).
        If a style profile provides 'avgSize' (stroke width in pixels, typically 1–6),
        it is used only if fontSize was not explicitly set, mapped to a reasonable range.
        """
        if style_metrics is None:
            style_metrics = {
                'avgSlant': 0.0,
                'avgSize': 2.0,
                'avgSpacing': 3.0,
                'strokeStyle': 'medium',
                'inkFlowVariance': 0.1,
                'baselineVariance': 2.0,
                'letterSpacingVariance': 1.0,
            }

        # Ensure font size is always in a legible range
        font_size = int(settings.get('fontSize', 24))
        font_size = max(14, min(60, font_size))  # clamp to legible range
        settings = dict(settings)
        settings['fontSize'] = font_size

        pages = []
        remaining = text
        pen_type = settings.get('penType', 'ballpoint')
        imperfection = float(settings.get('imperfectionLevel', 0.5))

        max_pages = 30
        while remaining and len(pages) < max_pages:
            page_bg = self._create_page_background(settings)
            page, remaining = self._render_text_to_page(remaining, settings, style_metrics, page_bg)
            page = self._apply_pen_effects(page, pen_type, imperfection)
            page_rgb = Image.new('RGB', page.size, (252, 251, 248))
            page_rgb.paste(page, mask=page.split()[3] if page.mode == 'RGBA' else None)
            pages.append(page_rgb)

        if not pages:
            pages = [Image.new('RGB', (A4_WIDTH, A4_HEIGHT), (252, 251, 248))]

        return pages

    def pages_to_pdf_bytes(self, pages: List[Image.Image]) -> bytes:
        if not pages:
            return b''
        pdf_buffer = io.BytesIO()
        pages[0].save(
            pdf_buffer, format='PDF', save_all=True,
            append_images=pages[1:], resolution=150,
        )
        return pdf_buffer.getvalue()

    def pages_to_png_b64_list(self, pages: List[Image.Image]) -> List[str]:
        result = []
        for page in pages:
            buf = io.BytesIO()
            page.save(buf, format='PNG', optimize=True)
            result.append(base64.b64encode(buf.getvalue()).decode('utf-8'))
        return result
