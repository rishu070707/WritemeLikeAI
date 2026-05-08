"""
Handwriting Generation Engine
Converts text to realistic handwritten output using style-aware rendering.
Implements stroke simulation, natural imperfections, and page layout.
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
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
    to simulate natural human handwriting.
    """

    def __init__(self):
        self.fonts_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fonts')
        self._font_cache = {}
        self.handwriting_fonts = self._find_handwriting_fonts()

    def _find_handwriting_fonts(self) -> List[str]:
        """Find available handwriting fonts."""
        font_files = []
        if os.path.exists(self.fonts_dir):
            for f in os.listdir(self.fonts_dir):
                if f.endswith(('.ttf', '.otf')):
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
            'ShadowsIntoLight.ttf': "https://github.com/google/fonts/raw/main/ofl/shadowsintolight/ShadowsIntoLight.ttf"
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

        # Selection logic based on stroke style (boldness)
        stroke_style = style.get('strokeStyle', 'medium')
        
        # Simple mapping: Caveat for fine/medium, IndieFlower for medium/bold
        selected_font_path = self.handwriting_fonts[0] # Default Caveat
        
        if stroke_style == 'bold' and len(self.handwriting_fonts) > 1:
            selected_font_path = self.handwriting_fonts[1] # IndieFlower
        elif stroke_style == 'fine' and len(self.handwriting_fonts) > 2:
            selected_font_path = self.handwriting_fonts[2] # ShadowsIntoLight
            
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
            return (26, 26, 46, 255)  # Default dark blue-black

    def _create_page_background(self, settings: Dict) -> Image.Image:
        """Create page background with the selected template."""
        page_type = settings.get('pageType', 'lined')
        width = settings.get('pageWidth', A4_WIDTH)
        height = settings.get('pageHeight', A4_HEIGHT)

        # Paper texture: slightly off-white
        img = Image.new('RGBA', (width, height), (252, 251, 248, 255))
        draw = ImageDraw.Draw(img)

        margin_top = settings.get('marginTop', 60)
        margin_left = settings.get('marginLeft', 60)
        margin_right = settings.get('marginRight', 40)
        font_size = settings.get('fontSize', 24)
        line_spacing_mult = settings.get('lineSpacing', 1.5)
        line_height = int(font_size * line_spacing_mult * 1.4)

        if page_type == 'lined':
            # Single ruled lines
            y = margin_top + line_height
            while y < height - 40:
                draw.line([(margin_left - 20, y), (width - margin_right, y)],
                          fill=(180, 200, 220, 100), width=1)
                y += line_height

            # Red margin line
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
            grid_size = line_height // 2
            for x in range(margin_left, width - margin_right, grid_size):
                draw.line([(x, margin_top), (x, height - 40)],
                          fill=(180, 200, 220, 70), width=1)
            for y in range(margin_top, height - 40, grid_size):
                draw.line([(margin_left - 20, y), (width - margin_right, y)],
                          fill=(180, 200, 220, 70), width=1)

        elif page_type == 'ruled':
            # College ruled
            y = margin_top + line_height
            while y < height - 40:
                draw.line([(0, y), (width, y)], fill=(160, 180, 220, 80), width=1)
                y += line_height
            draw.line([(margin_left, 0), (margin_left, height)],
                      fill=(220, 100, 100, 80), width=2)
            draw.line([(margin_left + 30, 0), (margin_left + 30, height)],
                      fill=(220, 100, 100, 40), width=1)

        # Add subtle paper texture noise
        self._add_paper_texture(img)

        return img

    def _add_paper_texture(self, img: Image.Image):
        """Add subtle grain texture to simulate paper."""
        if not hasattr(self, '_paper_noise'):
            # Pre-generate noise for a standard A4 page
            self._paper_noise = np.random.normal(0, 2, (A4_HEIGHT, A4_WIDTH)).astype(np.int16)
            
        arr = np.array(img)
        h, w = arr.shape[:2]
        # Use a slice of the pre-generated noise
        noise = self._paper_noise[:h, :w]
        
        for c in range(3):
            arr[:, :, c] = np.clip(arr[:, :, c].astype(np.int16) + noise, 0, 255).astype(np.uint8)
        img.paste(Image.fromarray(arr.astype(np.uint8)))

    def _apply_character_distortions(
        self, char_img: Image.Image, settings: Dict, style: Dict
    ) -> Image.Image:
        """Apply natural imperfections to a character image."""
        imperfection = settings.get('imperfectionLevel', 0.5)
        slant = settings.get('slantAngle', 0)
        ink_variance = style.get('inkFlowVariance', 0.1)

        if imperfection < 0.1:
            return char_img

        # Random slight rotation (pen pressure variation)
        rotation = random.gauss(slant, imperfection * 5)
        char_img = char_img.rotate(rotation, expand=True, resample=Image.BICUBIC,
                                    fillcolor=(0, 0, 0, 0))

        # Slight scale variation
        if random.random() < imperfection:
            scale = random.uniform(0.95, 1.05)
            new_w = max(1, int(char_img.width * scale))
            new_h = max(1, int(char_img.height * scale))
            char_img = char_img.resize((new_w, new_h), Image.LANCZOS)

        # Ink opacity variation (pressure simulation)
        if ink_variance > 0.05 and char_img.mode == 'RGBA':
            arr = np.array(char_img).astype(np.float32)
            alpha_factor = random.gauss(1.0, ink_variance * 0.3)
            alpha_factor = np.clip(alpha_factor, 0.7, 1.1)
            arr[:, :, 3] = np.clip(arr[:, :, 3] * alpha_factor, 0, 255)
            char_img = Image.fromarray(arr.astype(np.uint8))

        return char_img

    def _render_text_to_page(
        self, text: str, settings: Dict, style: Dict, page_bg: Image.Image
    ) -> Tuple[Image.Image, str]:
        """
        Render text onto page background with realistic handwriting simulation.
        Returns (page_image, remaining_text).
        """
        width = page_bg.width
        height = page_bg.height
        margin_left = settings.get('marginLeft', 60)
        margin_right = settings.get('marginRight', 40)
        margin_top = settings.get('marginTop', 60)
        font_size = settings.get('fontSize', 24)
        line_spacing = settings.get('lineSpacing', 1.5)
        letter_spacing = settings.get('letterSpacing', 1.0)
        ink_color_hex = settings.get('inkColor', '#1a1a2e')
        imperfection = settings.get('imperfectionLevel', 0.5)

        ink_color = self._parse_ink_color(ink_color_hex)
        font = self._get_font_for_style(font_size, style)
        line_height = int(font_size * line_spacing * 1.4)

        # Create text layer
        text_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(text_layer)

        # Text writing state
        x = margin_left
        y = margin_top + 10
        remaining_text = ""
        
        # Split text into paragraphs first, then words, preserving newlines
        paragraphs = text.split('\n')
        paragraph_idx = 0
        
        baseline_drift = 0
        avg_baseline_var = style.get('baselineVariance', 2.0)
        
        while paragraph_idx < len(paragraphs):
            paragraph = paragraphs[paragraph_idx]
            words = paragraph.split(' ')
            word_idx = 0
            
            while word_idx < len(words):
                word = words[word_idx]
                if not word:
                    # Treat multiple spaces as a single large gap
                    x += font_size * 0.4 * letter_spacing
                    word_idx += 1
                    continue

                # Measure actual word width including variations
                word_w = self._measure_word_width(word, font, imperfection, style, settings)
                
                # Check if word fits on line
                if x + word_w > width - margin_right and x > margin_left:
                    # New line
                    x = margin_left
                    y += line_height
                    baseline_drift += random.gauss(0, avg_baseline_var * 0.3)
                    baseline_drift = np.clip(baseline_drift, -avg_baseline_var, avg_baseline_var)
                    
                    # Check if we've exceeded page height
                    if y + line_height > height - 40:
                        # Reconstruct remaining text from current position
                        rem_in_para = ' '.join(words[word_idx:])
                        rem_paras = '\n'.join(paragraphs[paragraph_idx+1:])
                        remaining_text = rem_in_para + ('\n' + rem_paras if rem_paras else '')
                        break

                # Draw word and get exact next position
                actual_w = self._draw_word(draw, word, x, y + baseline_drift,
                                         font, ink_color, imperfection, style, settings)
                
                # Advance cursor by actual width + space
                space_w = int(font_size * 0.45 * letter_spacing)
                x += actual_w + space_w
                word_idx += 1
                
            if remaining_text:
                break
                
            # Paragraph end - move to next line
            x = margin_left
            y += line_height
            paragraph_idx += 1
            
            if y + line_height > height - 40 and paragraph_idx < len(paragraphs):
                remaining_text = '\n'.join(paragraphs[paragraph_idx:])
                break

        # Composite text onto page
        result = Image.alpha_composite(page_bg.convert('RGBA'), text_layer)
        return result, remaining_text

    def _measure_word_width(self, word: str, font: ImageFont.ImageFont, 
                           imperfection: float, style: Dict, settings: Dict) -> float:
        """Estimate word width accounting for spacing variations."""
        total_w = 0
        letter_spacing_mult = settings.get('letterSpacing', 1.0)
        
        for char in word:
            try:
                bbox = font.getbbox(char)
                char_w = bbox[2] - bbox[0]
            except Exception:
                char_w = font.size * 0.6
            
            # Account for average spacing variance
            spacing_var = style.get('letterSpacingVariance', 1.0) * imperfection * 0.5
            total_w += char_w + (letter_spacing_mult * spacing_var)
            
        return total_w

    def _draw_word(self, draw: ImageDraw.Draw, word: str, x: float, y: float,
                   font: ImageFont.ImageFont, ink_color: Tuple, imperfection: float,
                   style: Dict, settings: Dict) -> float:
        """Draw a word character by character and return the total width used."""
        cur_x = x
        baseline_var = style.get('baselineVariance', 2.0)
        ink_variance = style.get('inkFlowVariance', 0.1)
        letter_spacing_mult = settings.get('letterSpacing', 1.0)

        for char in word:
            # Per-character variations
            char_y_offset = random.gauss(0, baseline_var * imperfection * 0.5)
            alpha_var = float(np.clip(random.gauss(1.0, ink_variance * imperfection), 0.6, 1.0))
            char_color = (ink_color[0], ink_color[1], ink_color[2], int(ink_color[3] * alpha_var))
            
            jitter_x = random.gauss(0, imperfection * 0.6)
            jitter_y = char_y_offset + random.gauss(0, imperfection * 0.4)

            try:
                bbox = font.getbbox(char)
                char_w = bbox[2] - bbox[0]
            except Exception:
                char_w = int(font.size * 0.6)

            draw.text(
                (cur_x + jitter_x, y + jitter_y),
                char,
                font=font,
                fill=char_color,
            )

            # Letter spacing with natural variation
            spacing_var = random.gauss(0, style.get('letterSpacingVariance', 1.0) * imperfection)
            cur_x += char_w + int(letter_spacing_mult * spacing_var)
            
        return cur_x - x

    def _apply_pen_effects(self, page: Image.Image, pen_type: str, imperfection: float) -> Image.Image:
        """Apply pen-specific visual effects."""
        if pen_type == 'fountain':
            # Slight ink bleed
            if imperfection > 0.3:
                page = page.filter(ImageFilter.GaussianBlur(0.4))
        elif pen_type == 'pencil':
            # Add grain texture and reduce opacity slightly
            arr = np.array(page)
            noise = np.random.normal(0, 8 * imperfection, arr.shape[:2])
            arr[:, :, 3] = np.clip(arr[:, :, 3].astype(np.float32) - np.abs(noise), 0, 255).astype(np.uint8)
            page = Image.fromarray(arr)
        elif pen_type == 'marker':
            # Enhance darkness, slight bleed
            page = page.filter(ImageFilter.GaussianBlur(0.6)) if imperfection > 0.2 else page
        elif pen_type == 'gel':
            # Smooth and slightly glossy - minimal distortion
            pass

        return page

    def generate(self, text: str, settings: Dict, style_metrics: Optional[Dict] = None) -> List[Image.Image]:
        """
        Generate one or more handwritten pages from input text.
        Returns list of PIL Images.
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
                'wordSpacingVariance': 2.0,
            }

        pages = []
        remaining = text
        pen_type = settings.get('penType', 'ballpoint')
        imperfection = settings.get('imperfectionLevel', 0.5)
        max_pages = 20

        while remaining and len(pages) < max_pages:
            page_bg = self._create_page_background(settings)
            page, remaining = self._render_text_to_page(remaining, settings, style_metrics, page_bg)
            page = self._apply_pen_effects(page, pen_type, imperfection)

            # Convert to RGB for output
            page_rgb = Image.new('RGB', page.size, (252, 251, 248))
            page_rgb.paste(page, mask=page.split()[3] if page.mode == 'RGBA' else None)
            pages.append(page_rgb)

            if not remaining:
                break

        if not pages:
            # Fallback: empty page
            pages = [Image.new('RGB', (A4_WIDTH, A4_HEIGHT), (252, 251, 248))]

        return pages

    def pages_to_pdf_bytes(self, pages: List[Image.Image]) -> bytes:
        """Convert list of PIL Images to multi-page PDF bytes."""
        if not pages:
            return b''

        pdf_buffer = io.BytesIO()
        pages[0].save(
            pdf_buffer,
            format='PDF',
            save_all=True,
            append_images=pages[1:],
            resolution=150,
        )
        return pdf_buffer.getvalue()

    def pages_to_png_b64_list(self, pages: List[Image.Image]) -> List[str]:
        """Convert pages to list of base64-encoded PNG strings."""
        result = []
        for page in pages:
            buf = io.BytesIO()
            page.save(buf, format='PNG', optimize=True)
            result.append(base64.b64encode(buf.getvalue()).decode('utf-8'))
        return result
