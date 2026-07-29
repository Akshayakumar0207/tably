"""
Generates attractive, distinctive placeholder restaurant photos as inline
SVG data URIs (gradient + icon + name). Fully self-contained - no external
image service, no API key, no network call, so it can never break, rate-limit,
or cost anything. Each restaurant gets a visually distinct banner based on
its name, so the app doesn't look repetitive across 200 restaurants.
"""
import base64
import hashlib
from xml.sax.saxutils import escape as xml_escape

# Warm, appetizing gradient palettes that match the app's restaurant theme
PALETTES = [
    ("#B23A2D", "#7A241A"),  # brick red
    ("#C98A28", "#8C5D14"),  # amber
    ("#3D8052", "#245432"),  # forest green
    ("#2E5F8A", "#1B3C58"),  # deep blue
    ("#8A4B8A", "#5C2E5C"),  # plum
    ("#B2622D", "#7A3F17"),  # burnt orange
    ("#4A6B5A", "#2E4438"),  # sage
    ("#7A3B3B", "#4E2323"),  # maroon
    ("#2F6B6B", "#1C4444"),  # teal
    ("#8A6B2D", "#5C4718"),  # gold
]

# Simple decorative icon paths (fork+knife, plate, chair, lamp) as line art
ICONS = {
    "fork_knife": '<path d="M-40,-50 L-40,10 M-46,-50 L-46,-25 M-34,-50 L-34,-25 M-40,10 L-40,50 M40,-50 C48,-50 48,-25 40,-15 L40,50" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.55"/>',
    "plate": '<circle cx="0" cy="0" r="55" stroke="white" stroke-width="4" fill="none" opacity="0.5"/><circle cx="0" cy="0" r="38" stroke="white" stroke-width="2.5" fill="none" opacity="0.4"/>',
    "chair": '<path d="M-30,-50 L-30,20 M30,-50 L30,50 M-30,20 L30,20 M-30,-50 L30,-50" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.5"/>',
    "lamp": '<path d="M0,-50 L0,-15 M-35,-15 L35,-15 L20,30 L-20,30 Z" stroke="white" stroke-width="4" fill="none" stroke-linejoin="round" opacity="0.5"/>',
}
ICON_KEYS = list(ICONS.keys())


def _palette_for(seed_text: str):
    h = int(hashlib.md5(seed_text.encode()).hexdigest(), 16)
    return PALETTES[h % len(PALETTES)], h


def _svg_to_data_url(svg: str) -> str:
    encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"


def generate_banner(name: str, cuisine: str) -> str:
    """800x450 hero banner: gradient + large decorative icon + name + cuisine badge."""
    (c1, c2), h = _palette_for(name)
    icon_key = ICON_KEYS[h % len(ICON_KEYS)]
    icon_svg = ICONS[icon_key]
    grad_id = f"g{h % 100000}"
    safe_name = xml_escape((name[:28] + "…") if len(name) > 28 else name)
    safe_cuisine = xml_escape(cuisine)

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="{grad_id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#{grad_id})"/>
  <circle cx="680" cy="90" r="140" fill="white" opacity="0.06"/>
  <circle cx="90" cy="380" r="110" fill="white" opacity="0.05"/>
  <g transform="translate(400,190) scale(1.6)">{icon_svg}</g>
  <rect x="32" y="32" width="{86 + len(cuisine) * 7}" height="34" rx="17" fill="black" opacity="0.28"/>
  <text x="50" y="55" font-family="Georgia, 'Times New Roman', serif" font-size="15" fill="white" opacity="0.95">{safe_cuisine}</text>
  <text x="32" y="405" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="700" fill="white">{safe_name}</text>
</svg>'''
    return _svg_to_data_url(svg)


def generate_interior(name: str, variant: int) -> str:
    """600x450 interior-style photo placeholder, visually distinct per variant."""
    (c1, c2), h = _palette_for(f"{name}-interior-{variant}")
    icon_key = ICON_KEYS[(h + variant) % len(ICON_KEYS)]
    icon_svg = ICONS[icon_key]
    grad_id = f"gi{(h + variant) % 100000}"

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450">
  <defs>
    <linearGradient id="{grad_id}" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{c2}"/>
      <stop offset="100%" stop-color="{c1}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="450" fill="url(#{grad_id})"/>
  <rect x="0" y="0" width="600" height="450" fill="black" opacity="0.08"/>
  <g transform="translate(300,225) scale(2.1)">{icon_svg}</g>
</svg>'''
    return _svg_to_data_url(svg)
