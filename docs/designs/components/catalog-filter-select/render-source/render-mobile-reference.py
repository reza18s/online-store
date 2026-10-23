from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "03-Clean-Reference-Mobile.png"
WIDTH, HEIGHT = 390, 844
COLORS = {
    "page": "#F7F4F0",
    "surface": "#FFFCF9",
    "soft": "#F1ECE7",
    "ink": "#302B29",
    "muted": "#6F6560",
    "wine": "#7B4B59",
    "wine_dark": "#633D49",
    "wine_soft": "#F2E8EB",
    "line": "#E4DCD5",
    "disabled": "#A79B91",
}
FONT_DIR = Path(r"C:\Windows\Fonts")
FONT_REGULAR = FONT_DIR / "tahoma.ttf"
FONT_BOLD = FONT_DIR / "tahomabd.ttf"

def font(size, bold=False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size, layout_engine=ImageFont.Layout.RAQM)

def rtl(draw, text, x, y, size=12, color=None, bold=False):
    draw.text((x, y), text, font=font(size, bold), fill=color or COLORS["ink"], anchor="rm", direction="rtl", language="fa")

def ltr(draw, text, x, y, size=10, color=None, bold=False):
    draw.text((x, y), text, font=font(size, bold), fill=color or COLORS["muted"], anchor="lm")

def chevron(draw, x, y, color=None, up=False):
    color = color or COLORS["muted"]
    if up:
        draw.line((x-4,y+2,x,y-2,x+4,y+2), fill=color, width=1)
    else:
        draw.line((x-4,y-2,x,y+2,x+4,y-2), fill=color, width=1)

def radio(draw, y, selected=False):
    x1, y1, x2, y2 = 338, y+12, 358, y+32
    if selected:
        draw.rounded_rectangle((x1,y1,x2,y2), radius=4, fill=COLORS["wine"], outline=COLORS["wine"], width=1)
        draw.line((x1+5,y+22,x1+8,y+25,x1+14,y+18), fill="#FFFFFF", width=2)
    else:
        draw.rounded_rectangle((x1,y1,x2,y2), radius=4, fill=COLORS["surface"], outline=COLORS["line"], width=1)

# The storefront background is intentionally quiet so the sheet is the focus.
base = Image.new("RGBA", (WIDTH, HEIGHT), COLORS["page"])
bg = ImageDraw.Draw(base)
bg.rectangle((0, 0, WIDTH, 44), fill="#FFFCF9")
bg.line((0, 43, WIDTH, 43), fill=COLORS["line"], width=1)
bg.line((24, 17, 36, 17), fill=COLORS["ink"], width=1)
bg.line((24, 22, 36, 22), fill=COLORS["ink"], width=1)
bg.line((24, 27, 36, 27), fill=COLORS["ink"], width=1)
ltr(bg, "NOVA", 178, 22, 12, COLORS["ink"], True)
bg.ellipse((350, 14, 366, 30), outline=COLORS["ink"], width=1)
bg.rounded_rectangle((14, 72, 188, 330), radius=12, fill="#E4DDD6")
bg.rounded_rectangle((198, 72, 376, 330), radius=12, fill="#DED5CD")
bg.rounded_rectangle((14, 342, 188, 598), radius=12, fill="#E8E1DB")
bg.rounded_rectangle((198, 342, 376, 598), radius=12, fill="#E2D9D2")
overlay = Image.new("RGBA", (WIDTH, HEIGHT), (48, 43, 41, 108))
base = Image.alpha_composite(base, overlay)

# Soft shadow and the 358 × 756 sheet at x=16, y=44.
shadow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
shadow_draw = ImageDraw.Draw(shadow)
shadow_draw.rounded_rectangle((13, 42, 377, 803), radius=19, fill=(41, 32, 28, 54))
shadow = shadow.filter(ImageFilter.GaussianBlur(10))
base = Image.alpha_composite(base, shadow)
draw = ImageDraw.Draw(base)
draw.rounded_rectangle((16, 44, 374, 800), radius=17, fill=COLORS["surface"], outline=COLORS["line"], width=1)

# Sheet heading.
rtl(draw, "فیلترها", 358, 82, 17, COLORS["ink"], True)
draw.line((43, 78, 53, 88), fill=COLORS["ink"], width=1)
draw.line((53, 78, 43, 88), fill=COLORS["ink"], width=1)

# Category trigger and seven 44px option targets.
rtl(draw, "دسته‌بندی", 358, 125, 13, COLORS["wine_dark"], True)
rtl(draw, "همه", 72, 125, 11, COLORS["muted"])
chevron(draw, 47, 125, COLORS["wine"], up=True)
draw.line((32, 151, 358, 151), fill=COLORS["line"], width=1)

options = ["همه", "اکسسوری", "بافت", "پیراهن", "شلوار", "مانتو و رویه", "لباس کودک"]
start_y = 152
for i, label in enumerate(options):
    y = start_y + i*44
    selected = i == 0
    rtl(draw, label, 328, y+22, 12, COLORS["wine_dark"] if selected else "#574C45", selected)
    radio(draw, y, selected)
draw.line((32, 460, 358, 460), fill=COLORS["line"], width=1)
rtl(draw, "مشاهدهٔ بیشتر", 347, 482, 11, COLORS["wine"], True)
chevron(draw, 333, 482, COLORS["wine"], up=False)

# Collapsed facets.
facets = [("اندازه", 504), ("رنگ", 550), ("متریال", 596)]
for label, y in facets:
    draw.line((32, y, 358, y), fill=COLORS["line"], width=1)
    rtl(draw, label, 358, y+23, 13, COLORS["ink"], True)
    chevron(draw, 47, y+23, COLORS["ink"], up=False)
draw.line((32, 642, 358, 642), fill=COLORS["line"], width=1)

# Availability switches use 34px rows; the primary action remains 46px high here.
rtl(draw, "فقط موجود", 322, 666, 11, COLORS["ink"])
rtl(draw, "تخفیف ویژه", 322, 700, 11, COLORS["ink"])
for y in (657, 691):
    draw.rounded_rectangle((340, y, 358, y+18), radius=3, fill="#FFFFFF", outline="#BDB3AC", width=1)

draw.rounded_rectangle((32, 725, 358, 771), radius=10, fill=COLORS["wine"])
rtl(draw, "نمایش نتایج", 195, 748, 13, "#FFFFFF", True)

base.convert("RGB").save(OUTPUT, optimize=True)
print(f"Saved {OUTPUT} at {WIDTH}x{HEIGHT}")
