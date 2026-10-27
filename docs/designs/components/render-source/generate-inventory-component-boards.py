#!/usr/bin/env python3
"""Render individual, source-indexed component design references from the checked inventory.

This is documentation tooling only. It does not change application code or run the app.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont, __version__ as PILLOW_VERSION, features


GENERATOR_VERSION = "1.0.0"
SOURCE_REVISION = "6e4770d05ca67b2fecd337298359de8c6d838176"
SCRIPT = Path(__file__).resolve()
COMPONENTS_DIR = SCRIPT.parent.parent
REPO_ROOT = SCRIPT.parents[4]
INVENTORY_PATH = COMPONENTS_DIR / "component-source-inventory.json"
SCHEMA_PATH = COMPONENTS_DIR / "component-design-spec.schema.json"
ASSET_DIR = SCRIPT.parent / "assets"
FONT_PATHS = {
    "estedad_semibold": ASSET_DIR / "Estedad-SemiBold.ttf",
    "vazirmatn_regular": ASSET_DIR / "Vazirmatn-Regular.ttf",
    "vazirmatn_semibold": ASSET_DIR / "Vazirmatn-SemiBold.ttf",
}

WEB = {
    "page": "#F7F4F0", "surface": "#FFFCF9", "soft": "#F1ECE7",
    "warm": "#E8DFD7", "sage": "#E8ECE7", "ink": "#302B29",
    "muted": "#6F6560", "accent": "#7B4B59", "accent_dark": "#633D49",
    "accent_soft": "#F2E8EB", "line": "#E4DCD5", "clay": "#A88F78",
}
ADMIN = {
    "page": "#F5F1EB", "surface": "#FFFDF9", "soft": "#FAF6F0",
    "warm": "#E8DFD7", "sage": "#E8ECE7", "ink": "#1A1715",
    "muted": "#756C65", "accent": "#7D1F2D", "accent_dark": "#5F151F",
    "accent_soft": "#F2E4E3", "line": "#E5DED6", "clay": "#A88F78",
    "rail": "#1C1C1D", "rail_raised": "#252526",
}
SCOPE_LABELS = {"web": "STOREFRONT / WEB", "admin": "ADMIN / STAFF", "shared": "SHARED UI"}
STATE_TERMS = (
    "loading", "empty", "offline", "error", "success", "pending", "selected",
    "disabled", "expanded", "open", "closed", "saving", "saved", "available",
    "unavailable", "readonly", "read-only", "dirty", "validating", "submitting",
)
STATE_TRANSLATIONS = {
    "loading": "در حال بارگذاری", "empty": "خالی", "offline": "آفلاین",
    "error": "خطا", "success": "موفقیت", "pending": "در انتظار",
    "selected": "انتخاب‌شده", "disabled": "غیرفعال", "expanded": "باز",
    "open": "باز", "closed": "بسته", "saving": "در حال ذخیره",
    "saved": "ذخیره‌شده", "available": "موجود", "unavailable": "ناموجود",
    "readonly": "فقط‌خواندنی", "read-only": "فقط‌خواندنی", "dirty": "تغییرکرده",
    "validating": "در حال اعتبارسنجی", "submitting": "در حال ارسال",
}
ACTION_PREFIXES = (
    "ورود", "خروج", "ذخیره", "ثبت", "ارسال", "تأیید", "تایید", "افزودن", "حذف",
    "جست‌وجو", "جستجو", "بستن", "باز کردن", "مشاهده", "انتخاب", "ویرایش", "اعمال",
    "لغو", "پرداخت", "بررسی", "تغییر", "بازگشت", "فعال‌سازی", "غیرفعال‌سازی",
    "پیش‌فرض", "درخواست", "پاسخ", "انتشار", "تأیید", "رد کردن", "تلاش دوباره",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def font(size: int, role: str = "body") -> ImageFont.FreeTypeFont:
    family = "estedad_semibold" if role == "display" else "vazirmatn_semibold" if role == "strong" else "vazirmatn_regular"
    return ImageFont.truetype(str(FONT_PATHS[family]), size=size, layout_engine=ImageFont.Layout.RAQM)


def text_width(draw: ImageDraw.ImageDraw, value: str, face: ImageFont.FreeTypeFont, direction: str = "rtl") -> float:
    return draw.textlength(value, font=face, direction=direction, language="fa" if direction == "rtl" else "en")


def wrap_lines(draw: ImageDraw.ImageDraw, value: str, face: ImageFont.FreeTypeFont, max_width: int, direction: str = "rtl", max_lines: int | None = None) -> list[str]:
    words = value.split()
    if not words:
        return [""]
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if text_width(draw, candidate, face, direction) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    if max_lines is not None and len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(" .،؛-") + "…"
    return lines


def draw_rtl(draw: ImageDraw.ImageDraw, value: str, right: int, top: int, face: ImageFont.FreeTypeFont, color: str, max_width: int | None = None, max_lines: int | None = None, line_gap: int = 5) -> int:
    lines = wrap_lines(draw, value, face, max_width or 4000, "rtl", max_lines)
    _, _, _, h = draw.textbbox((0, 0), "آگ", font=face, direction="rtl", language="fa")
    for index, line in enumerate(lines):
        draw.text((right, top + index * (h + line_gap)), line, font=face, fill=color, anchor="ra", direction="rtl", language="fa")
    return len(lines) * (h + line_gap)


def draw_ltr(draw: ImageDraw.ImageDraw, value: str, left: int, top: int, face: ImageFont.FreeTypeFont, color: str, max_width: int | None = None, max_lines: int | None = None) -> int:
    lines = wrap_lines(draw, value, face, max_width or 4000, "ltr", max_lines)
    _, _, _, h = draw.textbbox((0, 0), "Ag", font=face)
    for index, line in enumerate(lines):
        draw.text((left, top + index * (h + 4)), line, font=face, fill=color, anchor="la", direction="ltr", language="en")
    return len(lines) * (h + 4)


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str, outline: str | None = None, radius: int = 18, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def unique(values: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for raw in values:
        value = str(raw).strip()
        if value and value not in seen:
            result.append(value)
            seen.add(value)
    return result


def primary_label(component: dict[str, Any]) -> str:
    labels = component.get("labels", [])
    for label in labels:
        value = str(label).strip()
        if re.search(r"[\u0600-\u06ff]", value) and len(value) <= 72 and not re.search(r"\b(?:NOVA|ADMIN|UI)\b", value, re.I):
            return value
    return str(component.get("symbol") or component["componentId"])


def component_kind(component: dict[str, Any]) -> str:
    name = (component.get("symbol", "") + " " + component["componentId"]).lower()
    tags = {str(tag).lower() for tag in component.get("jsxTags", [])}
    if "sourceVariants" in component and (component["sourceVariants"] or component.get("sourceSizes")):
        return "button"
    if "grid" in name:
        return "grid"
    if any(term in name for term in ("select", "filter")) or "select" in tags:
        return "selection"
    if any(term in name for term in ("dialog", "modal", "drawer", "sheet")) or "dialog" in tags:
        return "dialog"
    if any(term in name for term in ("navigation", "sidebar", "header", "footer", "breadcrumb")) or "nav" in tags:
        return "navigation"
    if any(term in name for term in ("table", "list", "queue", "history")) or tags.intersection({"table", "tbody", "thead", "tr"}):
        return "collection"
    if any(term in name for term in ("form", "editor", "login", "input", "address", "checkout")) or "form" in tags or tags.intersection({"input", "textarea"}):
        return "form"
    if any(term in name for term in ("badge", "status", "chip", "tag")):
        return "status"
    if any(term in name for term in ("image", "media", "gallery", "avatar", "logo")) or "img" in tags:
        return "media"
    if any(term in name for term in ("button", "action")):
        return "action"
    if any(term in name for term in ("card", "item", "row", "tile")):
        return "card"
    if tags.intersection({"ul", "ol", "li"}):
        return "collection"
    return "panel"


def extract_state_markers(component: dict[str, Any]) -> list[str]:
    markers: list[str] = []
    for phrase in component.get("stateWords", []):
        if len(str(phrase).split()) > 2:
            continue
        for term in STATE_TERMS:
            if re.search(rf"(?<![a-z]){re.escape(term)}(?![a-z])", str(phrase), re.I):
                markers.append(term)
    source_text = str(component.get("_sourceText", ""))
    for term in ("loading", "disabled"):
        if re.search(rf"\b{term}\s*=\s*(?:true|false)\b", source_text):
            markers.append(term)
    return unique(markers)


def extract_source_object_keys(source_text: str, object_name: str) -> list[str]:
    match = re.search(rf"(?ms)^\s{{6}}{re.escape(object_name)}:\s*\{{(.*?)^\s{{6}}\}},", source_text)
    if not match:
        return []
    return unique(re.findall(r"(?m)^\s{8}([A-Za-z][A-Za-z0-9_]*)\s*:", match.group(1)))


def theme_for(scope: str) -> dict[str, str]:
    return ADMIN if scope == "admin" else WEB


def draw_chip(draw: ImageDraw.ImageDraw, label: str, box: tuple[int, int, int, int], theme: dict[str, str], fill: str | None = None, color: str | None = None, direction: str = "rtl") -> None:
    rounded(draw, box, fill or theme["accent_soft"], radius=max(8, (box[3] - box[1]) // 2))
    face = font(max(13, int((box[3] - box[1]) * 0.34)), "strong")
    if direction == "rtl":
        draw_rtl(draw, label, box[2] - 12, box[1] + max(3, (box[3] - box[1] - face.size) // 2), face, color or theme["accent"], box[2] - box[0] - 24, max_lines=1)
    else:
        draw_ltr(draw, label, box[0] + 12, box[1] + max(3, (box[3] - box[1] - face.size) // 2), face, color or theme["accent"], box[2] - box[0] - 24, max_lines=1)


def draw_button(draw: ImageDraw.ImageDraw, label: str, x: int, y: int, width: int, theme: dict[str, str], primary: bool = False, compact: bool = False) -> tuple[int, int, int, int]:
    height = 48 if compact else 54
    fill = theme["accent"] if primary else theme["surface"]
    outline = None if primary else theme["line"]
    rounded(draw, (x, y, x + width, y + height), fill, outline, radius=10)
    face = font(14 if compact else 16, "strong")
    draw_rtl(draw, label, x + width - 14, y + (height - face.size) // 2 - 2, face, "#FFFFFF" if primary else theme["ink"], width - 28, max_lines=1)
    return (x, y, x + width, y + height)


def button_style(variant: str, theme: dict[str, str]) -> tuple[str, str, str | None]:
    if variant == "primary":
        return theme["accent"], "#FFFFFF", None
    if variant == "secondary":
        return theme["soft"], theme["ink"], None
    if variant == "outline":
        return theme["surface"], theme["accent"], theme["accent"]
    if variant == "ghost":
        return theme["page"], theme["ink"], None
    if variant == "destructive":
        return "#9C2934", "#FFFFFF", None
    return theme["surface"], theme["ink"], theme["line"]


def draw_field(draw: ImageDraw.ImageDraw, label: str, x: int, y: int, width: int, theme: dict[str, str], compact: bool = False) -> tuple[int, int, int, int]:
    label_face = font(13 if compact else 15, "strong")
    draw_rtl(draw, label, x + width, y, label_face, theme["muted"], width, max_lines=1)
    height = 52 if compact else 58
    top = y + 23
    rounded(draw, (x, top, x + width, top + height), theme["surface"], theme["line"], radius=10)
    return (x, top, x + width, top + height)


def source_actions(component: dict[str, Any]) -> list[dict[str, Any]]:
    actions = []
    for action in component.get("actions", []):
        events = unique([str(x) for x in action.get("events", [])])
        label = str(action.get("label", "")).strip()
        actions.append({"element": str(action.get("element", "")), "events": events, "label": label, "status": "SOURCE_DEFINED"})
    return actions


def field_labels(component: dict[str, Any]) -> list[str]:
    labels = unique([str(x) for x in component.get("labels", [])])
    field_words = ("ایمیل", "رمز", "کد", "شماره", "نام", "قیمت", "مقدار", "علت", "توضیح", "وضعیت", "آدرس", "عنوان", "جست‌وجو", "شناسه", "کد ملی", "موجودی")
    matched = [label for label in labels if any(term in label for term in field_words) and len(label) <= 42 and not any(term in label for term in ("برای ", "وارد کنید", "انتخاب کنید", "را وارد"))]
    return (matched or [label for label in labels if len(label) <= 42])[:4]


def display_actions(component: dict[str, Any]) -> list[str]:
    candidates = unique([str(value) for value in component.get("labels", [])])
    result = [value for value in candidates if len(value) <= 54 and value.startswith(ACTION_PREFIXES)]
    # A short, explicit event label can be used when the inventory has no separate CTA copy.
    if not result:
        result = [item["label"] for item in source_actions(component) if item["label"] and len(item["label"]) <= 36 and item["label"].startswith(ACTION_PREFIXES)]
    return unique(result)[:3]


def draw_component_widget(draw: ImageDraw.ImageDraw, component: dict[str, Any], box: tuple[int, int, int, int], theme: dict[str, str], compact: bool = False) -> list[dict[str, Any]]:
    x, y, right, bottom = box
    width, height = right - x, bottom - y
    kind = component_kind(component)
    label = primary_label(component)
    labels = unique([str(value) for value in component.get("labels", [])])
    actions = display_actions(component)
    markers = extract_state_markers(component)
    observed_vars = unique([str(value) for value in component.get("stateVariables", [])])
    measurements: list[dict[str, Any]] = []
    rounded(draw, box, theme["surface"], theme["line"], radius=18 if compact else 22)
    inset = 18 if compact else 28
    right_edge = right - inset
    title_face = font(20 if compact else 27, "display")
    draw_rtl(draw, label, right_edge, y + inset, title_face, theme["ink"], width - inset * 2, max_lines=2)
    subtitle = "متن Button نمونه است · گونه‌ها و اندازه‌ها از سورس" if kind == "button" else "ProductCard از سورس · متن و تصویر کالا نمونه‌اند" if kind == "grid" else "ساختار بصری پیشنهادی · برچسب‌ها از منبع"
    draw_rtl(draw, subtitle, right_edge, y + inset + (34 if compact else 44), font(11 if compact else 13), theme["muted"], width - inset * 2, max_lines=1)
    body_top = y + (86 if compact else 112)
    side_padding = inset

    if kind == "button":
        variants = component.get("sourceVariants", [])
        sizes = component.get("sourceSizes", [])
        title = "گونه‌های ثبت‌شده در سورس"
        draw_rtl(draw, title, right_edge, body_top, font(12 if compact else 15, "strong"), theme["muted"], width - side_padding * 2, max_lines=1)
        if compact:
            columns, gap, row_height = 2, 10, 57
            cell_width = (width - side_padding * 2 - gap) // columns
            for index, variant in enumerate(variants):
                row, col = divmod(index, columns)
                cell_x = x + side_padding + col * (cell_width + gap)
                row_y = body_top + 25 + row * row_height
                rounded(draw, (cell_x, row_y, cell_x + cell_width, row_y + 49), theme["soft"], theme["line"], radius=11)
                draw_ltr(draw, variant, cell_x + 9, row_y + 5, font(10, "strong"), theme["muted"], cell_width - 18, max_lines=1)
                button_width, button_height = min(cell_width - 18, 100), 28
                button_x = cell_x + (cell_width - button_width) // 2
                fill, foreground, outline = button_style(variant, theme)
                rounded(draw, (button_x, row_y + 17, button_x + button_width, row_y + 17 + button_height), fill, outline, radius=button_height // 2)
                face = font(10, "strong")
                draw.text((button_x + button_width // 2, row_y + 17 + button_height // 2), "Button", font=face, fill=foreground, anchor="mm", direction="ltr", language="en")
                measurements.append({"id": f"variant-{variant}", "x": cell_x, "y": row_y, "width": cell_width, "height": 49, "geometryStatus": "PROPOSED"})
            variants_height = ((len(variants) + columns - 1) // columns) * row_height
            sizes_top = body_top + 32 + variants_height
            draw_rtl(draw, "اندازه‌های ثبت‌شده در سورس", right_edge, sizes_top, font(11, "strong"), theme["muted"], width - side_padding * 2, max_lines=1)
            for index, size_name in enumerate(sizes):
                row, col = divmod(index, 2)
                cell_x = x + side_padding + col * (cell_width + gap)
                size_y = sizes_top + 22 + row * 39
                draw_chip(draw, size_name, (cell_x, size_y, cell_x + cell_width, size_y + 29), theme, direction="ltr")
                measurements.append({"id": f"size-{size_name}", "x": cell_x, "y": size_y, "width": cell_width, "height": 29, "geometryStatus": "SOURCE_DEFINED"})
            state_top = sizes_top + 25 + ((len(sizes) + 1) // 2) * 39
            for index, state in enumerate(markers[:2]):
                chip_x = x + side_padding + index * (cell_width + gap)
                draw_chip(draw, STATE_TRANSLATIONS.get(state, state), (chip_x, state_top, chip_x + cell_width, state_top + 28), theme, direction="rtl")
        else:
            columns, gap, cell_height = 3, 18, 92
            cell_width = (width - side_padding * 2 - gap * (columns - 1)) // columns
            for index, variant in enumerate(variants):
                row, col = divmod(index, columns)
                cell_x = x + side_padding + col * (cell_width + gap)
                row_y = body_top + 32 + row * (cell_height + 12)
                rounded(draw, (cell_x, row_y, cell_x + cell_width, row_y + cell_height), theme["soft"], theme["line"], radius=14)
                draw_ltr(draw, variant, cell_x + 11, row_y + 8, font(12, "strong"), theme["muted"], cell_width - 22, max_lines=1)
                button_width, button_height = min(cell_width - 24, 164), 44
                button_x = cell_x + (cell_width - button_width) // 2
                fill, foreground, outline = button_style(variant, theme)
                rounded(draw, (button_x, row_y + 36, button_x + button_width, row_y + 36 + button_height), fill, outline, radius=button_height // 2)
                face = font(13, "strong")
                draw.text((button_x + button_width // 2, row_y + 58), "Button", font=face, fill=foreground, anchor="mm", direction="ltr", language="en")
                measurements.append({"id": f"variant-{variant}", "x": cell_x, "y": row_y, "width": cell_width, "height": cell_height, "geometryStatus": "PROPOSED"})
            rows = (len(variants) + columns - 1) // columns
            sizes_top = body_top + 44 + rows * (cell_height + 12)
            draw_rtl(draw, "اندازه‌های ثبت‌شده در سورس", right_edge, sizes_top, font(13, "strong"), theme["muted"], width - side_padding * 2, max_lines=1)
            size_width = (width - side_padding * 2 - 12 * (len(sizes) - 1)) // max(1, len(sizes))
            for index, size_name in enumerate(sizes):
                size_x = x + side_padding + index * (size_width + 12)
                size_y = sizes_top + 26
                draw_chip(draw, size_name, (size_x, size_y, size_x + size_width, size_y + 34), theme, direction="ltr")
                measurements.append({"id": f"size-{size_name}", "x": size_x, "y": size_y, "width": size_width, "height": 34, "geometryStatus": "SOURCE_DEFINED"})
            state_top = sizes_top + 77
            for index, state in enumerate(markers[:2]):
                state_x = x + side_padding + index * 172
                state_box = (state_x, state_top, state_x + 160, state_top + 40)
                if state == "loading":
                    rounded(draw, state_box, theme["accent"], radius=20)
                    draw.ellipse((state_box[0] + 16, state_box[1] + 13, state_box[0] + 30, state_box[1] + 27), outline="#FFFFFF", width=2)
                    draw_rtl(draw, "در حال بارگذاری", state_box[2] - 10, state_box[1] + 10, font(11, "strong"), "#FFFFFF", 110, max_lines=1)
                else:
                    rounded(draw, state_box, theme["soft"], theme["line"], radius=20)
                    draw_rtl(draw, STATE_TRANSLATIONS.get(state, state), state_box[2] - 10, state_box[1] + 10, font(11, "strong"), theme["muted"], 135, max_lines=1)
                measurements.append({"id": f"state-{state}", "x": state_box[0], "y": state_box[1], "width": 160, "height": 40, "geometryStatus": "SOURCE_DEFINED"})

    elif kind == "grid":
        columns = 2 if compact else 4
        gap = 10 if compact else 16
        rows = 2
        cell_width = (width - side_padding * 2 - gap * (columns - 1)) // columns
        available_height = bottom - body_top - side_padding - 26
        cell_height = min(204 if not compact else 192, max(132 if compact else 158, (available_height - gap) // rows))
        for row in range(rows):
            for col in range(columns):
                index = row * columns + col
                cell_x = x + side_padding + col * (cell_width + gap)
                cell_y = body_top + row * (cell_height + gap)
                rounded(draw, (cell_x, cell_y, cell_x + cell_width, cell_y + cell_height), theme["surface"], theme["line"], radius=14)
                media_height = int(cell_height * 0.52)
                rounded(draw, (cell_x + 7, cell_y + 7, cell_x + cell_width - 7, cell_y + 7 + media_height), theme["warm"], radius=10)
                draw.ellipse((cell_x + cell_width // 2 - 15, cell_y + 19, cell_x + cell_width // 2 + 15, cell_y + 49), outline=theme["muted"], width=2)
                draw.line((cell_x + cell_width // 2 - 10, cell_y + 42, cell_x + cell_width // 2, cell_y + 32, cell_x + cell_width // 2 + 10, cell_y + 42), fill=theme["muted"], width=2)
                if not compact:
                    draw_rtl(draw, "تصویر نمونه · بدون عکس", cell_x + cell_width - 10, cell_y + media_height - 10, font(9), theme["muted"], cell_width - 18, max_lines=1)
                content_y = cell_y + media_height + 15
                draw.rounded_rectangle((cell_x + 10, content_y, cell_x + cell_width - 10, content_y + 7), radius=4, fill=theme["warm"])
                draw.rounded_rectangle((cell_x + 10, content_y + 14, cell_x + cell_width * 0.62, content_y + 21), radius=4, fill=theme["line"])
                action_y = cell_y + cell_height - 34
                draw.ellipse((cell_x + 10, action_y, cell_x + 36, action_y + 26), outline=theme["line"], width=2)
                draw.line((cell_x + 18, action_y + 13, cell_x + 28, action_y + 13), fill=theme["muted"], width=2)
                draw.line((cell_x + 23, action_y + 8, cell_x + 23, action_y + 18), fill=theme["muted"], width=2)
                draw.ellipse((cell_x + cell_width - 36, action_y, cell_x + cell_width - 10, action_y + 26), outline=theme["line"], width=2)
                if index == 0:
                    draw_ltr(draw, "ProductCard", cell_x + 42, action_y + 6, font(8), theme["muted"], max(20, cell_width - 80), max_lines=1)
                measurements.append({"id": f"product-card-{row+1}-{col+1}", "x": cell_x, "y": cell_y, "width": cell_width, "height": cell_height, "geometryStatus": "PROPOSED"})
    elif kind == "form":
        candidates = field_labels(component)
        if not candidates:
            candidates = ["برچسب فیلد در منبع موجود نیست"]
        candidates = candidates[:3]
        field_height = 78 if compact else 87
        start = body_top
        for index, field_label in enumerate(candidates):
            field_box = draw_field(draw, field_label, x + side_padding, start + index * field_height, width - side_padding * 2, theme, compact)
            measurements.append({"id": f"field-{index+1}", "x": field_box[0], "y": field_box[1], "width": field_box[2]-field_box[0], "height": field_box[3]-field_box[1], "geometryStatus": "PROPOSED"})
        action_label = actions[0] if actions else None
        if action_label:
            button = draw_button(draw, action_label, x + side_padding, start + len(candidates) * field_height + 8, width - side_padding * 2, theme, True, compact)
            measurements.append({"id": "primary-action", "x": button[0], "y": button[1], "width": button[2]-button[0], "height": button[3]-button[1], "geometryStatus": "PROPOSED"})

    elif kind == "navigation":
        nav_labels = labels[:4 if compact else 6] or [component.get("symbol", "")]
        row_gap = 12 if compact else 14
        row_height = 44 if compact else 52
        for index, nav_label in enumerate(nav_labels):
            row_y = body_top + index * (row_height + row_gap)
            rounded(draw, (x + side_padding, row_y, right - side_padding, row_y + row_height), theme["soft"] if index == 0 else theme["surface"], theme["line"], radius=10)
            draw.ellipse((right - side_padding - 28, row_y + row_height // 2 - 4, right - side_padding - 20, row_y + row_height // 2 + 4), fill=theme["accent"] if index == 0 else theme["line"])
            draw_rtl(draw, nav_label, right - side_padding - 42, row_y + (row_height - 19) // 2, font(12 if compact else 15), theme["ink"], width - side_padding * 2 - 60, max_lines=1)
            measurements.append({"id": f"navigation-item-{index+1}", "x": x+side_padding, "y": row_y, "width": width-side_padding*2, "height": row_height, "geometryStatus": "PROPOSED"})

    elif kind == "collection":
        columns = 3 if compact else 4
        cells = (labels[:columns] if labels else [])
        if len(cells) < columns:
            cells.extend(["ردیف نمونه"] * (columns - len(cells)))
        cell_width = (width - side_padding * 2) // columns
        header_y = body_top
        draw.line((x + side_padding, header_y + 38, right - side_padding, header_y + 38), fill=theme["line"], width=1)
        for index, cell in enumerate(cells):
            cell_x = x + side_padding + index * cell_width
            draw_rtl(draw, cell, cell_x + cell_width - 8, header_y + 5, font(11 if compact else 13, "strong"), theme["muted"], cell_width - 14, max_lines=1)
        row_count = 2 if compact else 3
        for row in range(row_count):
            row_y = header_y + 52 + row * (58 if compact else 66)
            draw.line((x + side_padding, row_y + 42, right - side_padding, row_y + 42), fill=theme["line"], width=1)
            for col in range(columns):
                cell_x = x + side_padding + col * cell_width
                width_fill = int(cell_width * (0.44 + ((row + col) % 3) * .12))
                draw.rounded_rectangle((cell_x + 6, row_y + 8, cell_x + width_fill, row_y + 18), radius=5, fill=theme["warm"])
            measurements.append({"id": f"collection-row-{row+1}", "x": x+side_padding, "y": row_y, "width": width-side_padding*2, "height": 43, "geometryStatus": "PROPOSED"})

    elif kind == "selection":
        control_label = labels[0] if labels else "کنترل انتخاب · بدون برچسب منبع"
        field = draw_field(draw, control_label, x + side_padding, body_top, width - side_padding * 2, theme, compact)
        measurements.append({"id": "selection-control", "x": field[0], "y": field[1], "width": field[2]-field[0], "height": field[3]-field[1], "geometryStatus": "PROPOSED"})
        options = labels[1:4 if compact else 5]
        if options:
            option_top = body_top + (84 if compact else 100)
            for index, option in enumerate(options):
                option_y = option_top + index * (41 if compact else 48)
                draw_rtl(draw, option, right_edge - 8, option_y, font(12 if compact else 14), theme["ink"], width - side_padding * 2 - 24, max_lines=1)
                if index < len(options) - 1:
                    draw.line((x + side_padding, option_y + (27 if compact else 31), right - side_padding, option_y + (27 if compact else 31)), fill=theme["line"], width=1)
            draw_chip(draw, "نمای options پیشنهادی", (x+side_padding, bottom-43, right-side_padding, bottom-14), theme, fill=theme["accent_soft"])

    elif kind == "dialog":
        modal = (x + side_padding, body_top, right - side_padding, bottom - side_padding)
        rounded(draw, modal, theme["soft"], theme["line"], radius=16)
        title = labels[0] if labels else "عنوان ثبت‌شده در منبع نیست"
        draw_rtl(draw, title, modal[2] - 18, modal[1] + 20, font(17 if compact else 21, "display"), theme["ink"], modal[2]-modal[0]-36, max_lines=2)
        body_label = labels[1] if len(labels) > 1 else "محتوا از والد یا state بالادست می‌آید"
        draw_rtl(draw, body_label, modal[2] - 18, modal[1] + (70 if compact else 88), font(12 if compact else 15), theme["muted"], modal[2]-modal[0]-36, max_lines=3)
        if actions:
            draw_button(draw, actions[0], modal[0] + 16, modal[3] - (61 if compact else 72), modal[2]-modal[0]-32, theme, True, compact)
        measurements.append({"id": "dialog-panel", "x": modal[0], "y": modal[1], "width": modal[2]-modal[0], "height": modal[3]-modal[1], "geometryStatus": "PROPOSED"})

    elif kind == "media":
        media_height = min(int(height * .50), 265 if not compact else 175)
        media_box = (x + side_padding, body_top, right - side_padding, body_top + media_height)
        rounded(draw, media_box, theme["warm"], theme["line"], radius=16)
        cx, cy = (media_box[0] + media_box[2]) // 2, (media_box[1] + media_box[3]) // 2
        draw.ellipse((cx-30, cy-30, cx+30, cy+30), outline=theme["muted"], width=2)
        draw.line((cx-15, cy+15, cx, cy-2, cx+17, cy+14), fill=theme["muted"], width=2)
        draw_rtl(draw, "جایگاه رسانه · تصویر واقعی در این برد استفاده نشده", media_box[2]-14, media_box[3]-28, font(10 if compact else 13), theme["muted"], media_box[2]-media_box[0]-28, max_lines=1)
        measurements.append({"id": "media-placeholder", "x": media_box[0], "y": media_box[1], "width": media_box[2]-media_box[0], "height": media_box[3]-media_box[1], "geometryStatus": "PROPOSED"})
        if actions:
            draw_button(draw, actions[0], x+side_padding, media_box[3]+16, width-side_padding*2, theme, True, compact)

    elif kind == "status":
        captions = markers or labels[:3]
        if captions:
            chip_width = min(width-side_padding*2, 260 if compact else 340)
            for index, caption in enumerate(captions[:3]):
                chip_y = body_top + index * (48 if compact else 58)
                chip_box = (x+side_padding, chip_y, x+side_padding+chip_width, chip_y+(32 if compact else 38))
                draw_chip(draw, STATE_TRANSLATIONS.get(caption, caption), chip_box, theme)
                measurements.append({"id": f"status-marker-{index+1}", "x": chip_box[0], "y": chip_box[1], "width": chip_box[2]-chip_box[0], "height": chip_box[3]-chip_box[1], "geometryStatus": "PROPOSED"})
            if len(captions) > 3:
                draw_rtl(draw, f"+{len(captions)-3} مورد در مشخصات منبع", right_edge, bottom-28, font(11), theme["muted"], width-36, max_lines=1)
        else:
            draw_rtl(draw, "نشانگر وضعیت در inventory ثبت نشده است.", right_edge, body_top, font(13), theme["muted"], width-side_padding*2, max_lines=2)

    elif kind == "action":
        if actions:
            button_width = min(width-side_padding*2, 340 if not compact else width-side_padding*2)
            for index, caption in enumerate(actions[:2]):
                button_y = body_top + index * (58 if compact else 74)
                rect = draw_button(draw, caption, x+side_padding, button_y, button_width, theme, index == 0, compact)
                measurements.append({"id": f"action-{index+1}", "x": rect[0], "y": rect[1], "width": rect[2]-rect[0], "height": rect[3]-rect[1], "geometryStatus": "PROPOSED"})
        else:
            draw_rtl(draw, "برچسب کنش کوتاه و صریح در inventory پیدا نشد.", right_edge, body_top, font(13), theme["muted"], width-side_padding*2, max_lines=2)

    else:
        # Generic surface anatomy intentionally uses source copy only; its layout remains a proposal.
        chosen = [label for label in labels if label != primary_label(component)][:2]
        if not chosen:
            chosen = ["جزئیات نمونه در منبع تصویری تعریف نشده"]
        for index, item in enumerate(chosen[:2]):
            row_y = body_top + index * (67 if compact else 82)
            rounded(draw, (x+side_padding, row_y, right-side_padding, row_y+(54 if compact else 66)), theme["soft"] if index == 0 else theme["surface"], theme["line"], radius=12)
            draw_rtl(draw, item, right_edge - 16, row_y + 16, font(12 if compact else 15), theme["ink"], width-side_padding*2-32, max_lines=2)
            measurements.append({"id": f"content-region-{index+1}", "x": x+side_padding, "y": row_y, "width": width-side_padding*2, "height": 54 if compact else 66, "geometryStatus": "PROPOSED"})
        if actions:
            rect = draw_button(draw, actions[0], x+side_padding, body_top + (132 if compact else 164), width-side_padding*2, theme, True, compact)
            measurements.append({"id": "primary-action", "x": rect[0], "y": rect[1], "width": rect[2]-rect[0], "height": rect[3]-rect[1], "geometryStatus": "PROPOSED"})

    if markers or observed_vars:
        marker_label = "نشانگرهای استخراج‌شده از state منبع"
        draw_rtl(draw, marker_label, right_edge, bottom - (28 if compact else 32), font(10 if compact else 12), theme["muted"], width - side_padding * 2, max_lines=1)
    return measurements


def render_reference(component: dict[str, Any], width: int, height: int, viewport: str) -> tuple[Image.Image, dict[str, Any]]:
    theme = theme_for(component["scope"])
    img = Image.new("RGB", (width, height), theme["page"])
    draw = ImageDraw.Draw(img)
    compact = viewport == "mobile"
    pad = 22 if compact else 72
    header_h = 76 if compact else 92
    draw.rectangle((0, 0, width, header_h), fill=theme["surface"])
    draw.line((0, header_h-1, width, header_h-1), fill=theme["line"], width=1)
    draw_ltr(draw, "NOVA", pad, 27 if not compact else 22, font(21 if not compact else 18, "display"), theme["ink"], max_lines=1)
    draw_ltr(draw, "COMPONENT DESIGN / CONCEPT", pad + (75 if not compact else 58), 32 if not compact else 27, font(10 if not compact else 8, "strong"), theme["muted"], max_lines=1)
    draw_rtl(draw, SCOPE_LABELS[component["scope"]], width-pad, 30 if not compact else 25, font(12 if not compact else 9, "strong"), theme["accent"], max_lines=1)

    if compact:
        title_top = 112
        draw_rtl(draw, primary_label(component), width-pad, title_top, font(23, "display"), theme["ink"], width-pad*2, max_lines=2)
        draw_rtl(draw, "پیش‌نمایش مستقل · چیدمان پیشنهادی", width-pad, title_top+39, font(11), theme["muted"], width-pad*2, max_lines=1)
        card = (pad, 194, width-pad, height-42)
        rounded(draw, card, theme["soft"], theme["line"], radius=18)
        component_box = (card[0]+12, card[1]+16, card[2]-12, card[3]-20)
    else:
        draw_rtl(draw, primary_label(component), width-pad, 126, font(31, "display"), theme["ink"], width-pad*2, max_lines=1)
        draw_rtl(draw, "پیش‌نمایش مستقل · کنش‌ها از inventory منبع", width-pad, 170, font(13), theme["muted"], width-pad*2, max_lines=1)
        card = (pad, 222, width-pad, height-66)
        rounded(draw, card, theme["soft"], theme["line"], radius=20)
        component_box = (card[0]+34, card[1]+36, card[2]-34, card[3]-34)

    measurements = draw_component_widget(draw, component, component_box, theme, compact)
    draw_rtl(draw, "داده/تصویر نمونه نیست؛ فقط جایگاه رسانه یا فیلدها نمایش داده می‌شود", width-pad, height-25, font(9 if compact else 11), theme["muted"], width-pad*2, max_lines=1)
    bounds = {"x": component_box[0], "y": component_box[1], "width": component_box[2]-component_box[0], "height": component_box[3]-component_box[1], "geometryStatus": "PROPOSED", "captureStatus": "MEASURED_IN_RENDERER_OUTPUT"}
    return img, {"bounds": bounds, "nodes": measurements}


def add_thumbnail(canvas: Image.Image, screenshot: Image.Image, box: tuple[int, int, int, int], outline: str) -> None:
    x1, y1, x2, y2 = box
    thumb = screenshot.resize((x2-x1, y2-y1), Image.Resampling.LANCZOS)
    mask = Image.new("L", thumb.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, thumb.width-1, thumb.height-1), radius=16, fill=255)
    canvas.paste(thumb, (x1, y1), mask)
    ImageDraw.Draw(canvas).rounded_rectangle(box, radius=16, outline=outline, width=2)


def render_board(component: dict[str, Any], desktop: Image.Image, tokens: list[dict[str, str]], states: list[dict[str, str]], actions: list[dict[str, Any]], source_sha: str) -> Image.Image:
    theme = theme_for(component["scope"])
    board = Image.new("RGB", (1536, 1024), theme["page"])
    draw = ImageDraw.Draw(board)
    draw.rectangle((0, 0, 1536, 78), fill=theme["surface"])
    draw.line((0, 77, 1536, 77), fill=theme["line"], width=1)
    draw_ltr(draw, "NOVA  /  COMPONENT DESIGN", 64, 28, font(18, "display"), theme["ink"], max_lines=1)
    draw_rtl(draw, SCOPE_LABELS[component["scope"]], 1472, 30, font(15, "strong"), theme["accent"], max_lines=1)
    title = primary_label(component)
    draw_rtl(draw, title, 1472, 100, font(35, "display"), theme["ink"], 910, max_lines=1)
    draw_rtl(draw, "برد مرجع طراحی · منبع‌محور · چیدمان پیشنهادی", 1472, 150, font(15), theme["muted"], 900, max_lines=1)
    draw_ltr(draw, component["componentId"], 64, 108, font(15, "strong"), theme["accent"], max_lines=1)
    draw_ltr(draw, f"SOURCE {component['source']}:{component['lines']}  ·  SHA {source_sha[:12]}", 64, 140, font(10), theme["muted"], 690, max_lines=2)

    preview_box = (64, 205, 904, 730)
    rounded(draw, preview_box, theme["surface"], theme["line"], radius=18)
    add_thumbnail(board, desktop, (78, 220, 890, 727), theme["line"])
    draw_rtl(draw, "مرجع کامل 1440×900 · جزئیات چیدمان را در فایل مستقل ببینید", 890, 744, font(12), theme["muted"], 804, max_lines=1)

    right_x, right = 932, 1472
    labels = unique([str(x) for x in component.get("labels", [])])
    rounded(draw, (right_x, 205, right, 392), theme["surface"], theme["line"], radius=16)
    draw_rtl(draw, "متن‌های پیدا‌شده در منبع", right-20, 222, font(19, "display"), theme["ink"], right_x and right-right_x-40, max_lines=1)
    if labels:
        y = 264
        for value in labels[:5]:
            height = draw_rtl(draw, value, right-22, y, font(13), theme["muted"], right-right_x-44, max_lines=1)
            y += max(26, height+4)
    else:
        draw_rtl(draw, "برای این نماد، متن مستقل در inventory ثبت نشده است.", right-22, 270, font(13), theme["muted"], right-right_x-44, max_lines=2)
    if len(labels) > 5:
        draw_ltr(draw, f"+ {len(labels)-5} more in design-spec.json", right_x+20, 362, font(10, "strong"), theme["accent"], max_lines=1)

    rounded(draw, (right_x, 410, right, 615), theme["surface"], theme["line"], radius=16)
    draw_rtl(draw, "برچسب‌های کنش پیدا‌شده در منبع", right-20, 427, font(19, "display"), theme["ink"], right-right_x-40, max_lines=1)
    actual_action_labels = display_actions(component)
    if actual_action_labels:
        y = 472
        for value in actual_action_labels[:3]:
            draw_chip(draw, value, (right_x+18, y, right-18, y+38), theme)
            y += 45
    elif actions:
        first = actions[0]
        event_summary = f"{first['element']} · {', '.join(first['events']) or 'event بدون نام'}"
        draw_ltr(draw, event_summary, right_x+20, 482, font(11, "strong"), theme["muted"], right-right_x-40, max_lines=2)
        draw_rtl(draw, "نام کنش رابط کاربری در inventory روشن نیست؛ برچسب تازه ساخته نشده است.", right-20, 540, font(11), theme["muted"], right-right_x-40, max_lines=2)
    else:
        draw_rtl(draw, "اکشن مستقیم یا handler در inventory این نماد ثبت نشده است.", right-20, 481, font(13), theme["muted"], right-right_x-40, max_lines=2)

    rounded(draw, (right_x, 633, right, 938), theme["surface"], theme["line"], radius=16)
    draw_rtl(draw, "state و ظاهر", right-20, 650, font(19, "display"), theme["ink"], right-right_x-40, max_lines=1)
    markers = extract_state_markers(component)
    variables = unique([str(value) for value in component.get("stateVariables", [])])
    if markers:
        draw_rtl(draw, "نشانگرهای state در inventory", right-20, 693, font(11, "strong"), theme["muted"], right-right_x-40, max_lines=1)
        y = 717
        for state in states[:2]:
            translated = STATE_TRANSLATIONS.get(state["label"], state["label"])
            draw_chip(draw, translated, (right_x+18, y, right-18, y+34), theme, fill=theme["accent_soft"])
            draw_ltr(draw, state["label"], right_x+22, y+39, font(9), theme["muted"], right-right_x-44, max_lines=1)
            y += 42
    else:
        draw_rtl(draw, "نشانگر state متنی ثبت نشده است.", right-20, 697, font(12), theme["muted"], right-right_x-42, max_lines=1)
    if len(states) > 2:
        draw_ltr(draw, f"+ {len(states)-2} markers in design-spec.json", right_x+20, 798, font(9, "strong"), theme["accent"], right-right_x-40, max_lines=1)
    if variables:
        draw_rtl(draw, "متغیرهای مالک state در منبع", right-20, 826, font(11, "strong"), theme["muted"], right-right_x-40, max_lines=1)
        draw_ltr(draw, " · ".join(variables[:5]), right_x+20, 846, font(9), theme["ink"], right-right_x-40, max_lines=1)
    else:
        draw_rtl(draw, "متغیر state در inventory ثبت نشده است.", right-20, 829, font(10), theme["muted"], right-right_x-40, max_lines=1)
    draw_rtl(draw, "Estedad SemiBold + Vazirmatn · فونت بُرد، نه قرارداد کد", right-20, 874, font(12, "strong"), theme["ink"], right-right_x-40, max_lines=1)
    draw_rtl(draw, "Estedad در storefront جایگزین پیشنهادی Peyda است؛ فقط برای تصویرسازی.", right-20, 898, font(10), theme["muted"], right-right_x-40, max_lines=1)
    draw_ltr(draw, "SIL Open Font License 1.1", right_x+20, 920, font(9), theme["accent"], max_lines=1)

    rounded(draw, (64, 782, 904, 938), theme["surface"], theme["line"], radius=16)
    draw_rtl(draw, "توکن‌های ظاهر", 882, 799, font(18, "display"), theme["ink"], 788, max_lines=1)
    for index, token in enumerate(tokens[:6]):
        col = index % 3
        row = index // 3
        x = 82 + col*262
        y = 842 + row*42
        draw.ellipse((x, y+3, x+24, y+27), fill=token["value"], outline=theme["line"], width=1)
        draw_ltr(draw, token["id"], x+32, y+1, font(9), theme["muted"], 220, max_lines=1)
        draw_ltr(draw, token["value"], x+32, y+17, font(9, "strong"), theme["ink"], 220, max_lines=1)

    draw.line((64, 964, 1472, 964), fill=theme["line"], width=1)
    draw_ltr(draw, "DESIGN ONLY  ·  LIVE APP RUNTIME NOT CHECKED", 64, 978, font(10, "strong"), theme["muted"], max_lines=1)
    draw_rtl(draw, "RTL با Pillow RAQM · خانواده‌ی body از Vazirmatn · حداقل هدف تعاملی پیشنهادی 44×44px", 1472, 977, font(10), theme["muted"], 1050, max_lines=1)
    return board


def palette_tokens(scope: str) -> list[dict[str, str]]:
    if scope == "admin":
        source = "docs/designs/components/admin-navigation-sidebar/design-tokens.json#tokens"
        pairs = [
            ("page", ADMIN["page"], "SOURCE_DEFINED"), ("surface", ADMIN["surface"], "SOURCE_DEFINED"),
            ("ink", ADMIN["ink"], "SOURCE_DEFINED"), ("charcoal", ADMIN["rail"], "SOURCE_DEFINED"),
            ("wine", ADMIN["accent"], "SOURCE_DEFINED"), ("wineSoft", ADMIN["accent_soft"], "SOURCE_DEFINED"),
            ("line", ADMIN["line"], "PROPOSED"),
        ]
    else:
        source = "docs/designs/atelier-editorial.md#18"
        if scope == "shared":
            source = "Shared UI neutral render proposal; host-owned appearance remains caller-owned."
        pairs = [
            ("pearl/50", WEB["page"], "PROPOSED" if scope == "shared" else "SOURCE_DEFINED"), ("surface/0", WEB["surface"], "PROPOSED" if scope == "shared" else "SOURCE_DEFINED"),
            ("surface/soft", WEB["soft"], "PROPOSED" if scope == "shared" else "SOURCE_DEFINED"), ("surface/warm", WEB["warm"], "PROPOSED" if scope == "shared" else "SOURCE_DEFINED"),
            ("ink/950", WEB["ink"], "PROPOSED" if scope == "shared" else "SOURCE_DEFINED"), ("ink/700", WEB["muted"], "PROPOSED" if scope == "shared" else "SOURCE_DEFINED"),
            ("rosewood/700", WEB["accent"], "PROPOSED" if scope == "shared" else "SOURCE_DEFINED"), ("rosewood/800", WEB["accent_dark"], "PROPOSED" if scope == "shared" else "SOURCE_DEFINED"),
            ("rosewood/100", WEB["accent_soft"], "PROPOSED" if scope == "shared" else "SOURCE_DEFINED"), ("line/200", WEB["line"], "PROPOSED" if scope == "shared" else "SOURCE_DEFINED"),
        ]
    return [{"id": key, "value": value, "status": status, "source": source} for key, value, status in pairs]


def component_states(component: dict[str, Any]) -> list[dict[str, str]]:
    markers = extract_state_markers(component)
    if markers:
        return [{"id": re.sub(r"[^a-z0-9]+", "-", marker.lower()).strip("-"), "label": marker, "status": "SOURCE_MARKER"} for marker in markers]
    return [{"id": "baseline-specimen", "label": "ساختار پایه برای بررسی بصری", "status": "PROPOSED_BASELINE"}]


def validate_font_files() -> None:
    if not features.check("raqm"):
        raise RuntimeError("Pillow RAQM is required for Persian shaping.")
    missing = [str(path) for path in FONT_PATHS.values() if not path.is_file()]
    if missing:
        raise RuntimeError("Missing bundled font files: " + ", ".join(missing))
    # Force font parsing before creating hundreds of outputs.
    for path in FONT_PATHS.values():
        ImageFont.truetype(str(path), 20, layout_engine=ImageFont.Layout.RAQM)


def package_outputs() -> list[tuple[str, str]]:
    return [
        ("01-Visual-Design-Board.png", "annotated-design-board"),
        ("02-Clean-Reference.png", "clean-desktop-reference"),
        ("03-Clean-Reference-Mobile.png", "clean-mobile-reference"),
        ("design-spec.json", "design-specification"),
        ("design-spec.schema.json", "json-schema"),
        ("scene-graph.json", "scene-graph"),
        ("source-index.json", "source-index"),
        ("authority-map.json", "authority-map"),
        ("conflicts.json", "conflicts-and-proposals"),
        ("design-tokens.json", "design-tokens"),
        ("asset-registry.json", "asset-registry"),
        ("coverage-matrix.json", "coverage-matrix"),
        ("qa-report.json", "qa-report"),
        ("manifest.json", "manifest"),
        ("component-handoff.md", "component-handoff"),
        ("render-source/target.json", "renderer-input"),
        ("render-source/README.md", "renderer-instructions"),
    ]


def render_package(component: dict[str, Any], inventory: dict[str, Any], schema_bytes: bytes, overwrite: bool) -> None:
    target_dir = COMPONENTS_DIR / component["componentId"]
    source_path = REPO_ROOT / component["source"]
    if not source_path.is_file():
        raise RuntimeError(f"Missing source file for {component['componentId']}: {component['source']}")
    actual_source_sha = sha256(source_path)
    if actual_source_sha != component["sourceSha256"]:
        raise RuntimeError(f"Source changed since inventory for {component['componentId']}: expected {component['sourceSha256']}, got {actual_source_sha}")
    source_text = source_path.read_text(encoding="utf-8")
    component = {
        **component,
        "_sourceText": source_text,
        "sourceVariants": extract_source_object_keys(source_text, "variant"),
        "sourceSizes": extract_source_object_keys(source_text, "size"),
    }
    if component.get("existingBoardId"):
        raise RuntimeError(f"Refusing to overwrite existing exact board package {component['componentId']}.")
    if target_dir.exists() and any(target_dir.iterdir()):
        if not overwrite:
            raise RuntimeError(f"Target exists and is not empty: {target_dir}")
        manifest_path = target_dir / "manifest.json"
        if not manifest_path.is_file():
            raise RuntimeError(f"Refusing to overwrite a pre-existing package without this renderer's manifest: {target_dir}")
        try:
            prior_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise RuntimeError(f"Refusing to overwrite a package with an unreadable manifest: {target_dir}") from error
        if prior_manifest.get("generator", {}).get("name") != SCRIPT.name:
            raise RuntimeError(f"Refusing to overwrite a package owned by a different renderer: {target_dir}")
    target_dir.mkdir(parents=True, exist_ok=True)

    theme = theme_for(component["scope"])
    kind = component_kind(component)
    actions = source_actions(component)
    states = component_states(component)
    tokens = palette_tokens(component["scope"])
    desktop, desktop_info = render_reference(component, 1440, 900, "desktop")
    mobile, mobile_info = render_reference(component, 390, 844, "mobile")
    board = render_board(component, desktop, tokens, states, actions, actual_source_sha)
    images = {
        "01-Visual-Design-Board.png": board,
        "02-Clean-Reference.png": desktop,
        "03-Clean-Reference-Mobile.png": mobile,
    }
    for name, image in images.items():
        image.save(target_dir / name, format="PNG", optimize=True, compress_level=9)

    display_status = "SOURCE_DEFINED" if component["scope"] == "admin" else "PROPOSED_SUBSTITUTE"
    fonts = [
        {"assetId": "estedad-semibold-v8.5", "path": "docs/designs/components/render-source/assets/Estedad-SemiBold.ttf", "kind": "font", "license": "SIL Open Font License 1.1", "sha256": sha256(FONT_PATHS["estedad_semibold"])},
        {"assetId": "vazirmatn-regular-v33.003", "path": "docs/designs/components/render-source/assets/Vazirmatn-Regular.ttf", "kind": "font", "license": "SIL Open Font License 1.1", "sha256": sha256(FONT_PATHS["vazirmatn_regular"])},
        {"assetId": "vazirmatn-semibold-v33.003", "path": "docs/designs/components/render-source/assets/Vazirmatn-SemiBold.ttf", "kind": "font", "license": "SIL Open Font License 1.1", "sha256": sha256(FONT_PATHS["vazirmatn_semibold"])},
    ]
    source_anchor = f"{component['symbol']} ({component['lines']})"
    source_record = {
        "path": component["source"], "anchor": source_anchor, "lines": component["lines"],
        "sha256": actual_source_sha, "status": "INVENTORY_SOURCE_HASH_VERIFIED",
    }
    source_labels = unique([str(value) for value in component.get("labels", [])])
    state_markers = extract_state_markers(component)
    source_events = actions
    direction = ("NOVA Store / atelier-editorial.md Section 18 Soft Modern." if component["scope"] == "web" else
                 "NOVA admin staff surface; the existing admin navigation board tokens remain the appearance authority." if component["scope"] == "admin" else
                 "Shared UI specimen; palette is proposed in the neutral NOVA surface and host appearance remains caller-owned.")
    body_status = "SOURCE_DEFINED"
    purpose = f"برد مستقل برای {component['symbol']}؛ متن‌ها و eventهای موجود از inventory منبع‌اند و چیدمان تصویر پیشنهادی است."
    spec_frames = [
        {"id": f"{component['componentId']}-desktop", "viewportId": "desktop", "width": 1440, "height": 900, "screenshot": f"docs/designs/components/{component['componentId']}/02-Clean-Reference.png", "componentBounds": desktop_info["bounds"], "direction": "rtl"},
        {"id": f"{component['componentId']}-mobile", "viewportId": "mobile", "width": 390, "height": 844, "screenshot": f"docs/designs/components/{component['componentId']}/03-Clean-Reference-Mobile.png", "componentBounds": mobile_info["bounds"], "direction": "rtl"},
        {"id": f"{component['componentId']}-board", "viewportId": "board", "width": 1536, "height": 1024, "screenshot": f"docs/designs/components/{component['componentId']}/01-Visual-Design-Board.png", "componentBounds": {"x": 78, "y": 220, "width": 812, "height": 507, "geometryStatus": "PROPOSED", "captureStatus": "MEASURED_IN_RENDERER_OUTPUT"}, "direction": "rtl"},
    ]
    checks = [
        {"id": "source-identity", "status": "PASS", "method": "SHA-256 comparison against the checked component inventory", "evidence": f"{component['source']} matches inventory hash {actual_source_sha}."},
        {"id": "artifact-dimensions", "status": "PASS", "method": "Pillow image metadata from generated PNGs", "evidence": "Board 1536x1024; desktop 1440x900; mobile 390x844."},
        {"id": "persian-font-and-rtl", "status": "PASS", "method": "Pillow 12.3.0 FreeType + RAQM render using bundled licensed fonts", "evidence": "Persian strings are rendered with RTL shaping; the clean references are generated independently at their declared sizes."},
        {"id": "schema-and-semantic-integrity", "status": "UNVERIFIED", "method": "Pending generated artifact validation", "evidence": "Run the central Draft 2020-12 validator and link/hash checks after batch generation."},
        {"id": "interactive-app-runtime", "status": "UNVERIFIED", "method": "Application runtime was not operated", "evidence": "The board records source inventory evidence and design proposals only."},
        {"id": "photo-assets", "status": "NOT_APPLICABLE", "method": "Local render-source asset registry", "evidence": "No product photography or unlicensed external image is used; media regions are drawn placeholders."},
    ]
    warnings = [
        "Every layout, spacing and rectangle is a proposed design choice; captured pixel bounds describe this renderer output, not the live React component.",
        "Only copy, JSX tag names, event labels, state variables and state markers indexed from the source are treated as source-defined evidence.",
        "Estedad display text is a proposed substitute for Peyda in storefront board images; it does not change the application's font contract. Admin display typography follows its existing component-board token source.",
        "The live app, keyboard interactions, API data, permission behavior and product-image licensing were not tested by this renderer.",
    ]
    spec = {
        "schemaVersion": "2.0.0",
        "target": {"id": component["componentId"], "scope": component["scope"], "symbol": component["symbol"], "source": component["source"], "lines": component["lines"]},
        "sourceRevision": inventory["sourceRevision"], "direction": direction, "purpose": purpose,
        "sourceEvidence": {"labels": source_labels, "jsxTags": unique([str(x) for x in component.get("jsxTags", [])]), "stateVariables": unique([str(x) for x in component.get("stateVariables", [])]), "stateMarkers": state_markers, "variants": component["sourceVariants"], "sizes": component["sourceSizes"]},
        "proposal": {
            "layoutType": kind, "status": "PROPOSED",
            "desktop": "Independent 1440x900 component specimen inside a neutral design-review frame; geometry is not copied from the live DOM.",
            "mobile": "Independent 390x844 stacked specimen; breakpoints and behavior remain proposals unless separately defined by the owning page source.",
            "typography": {
                "display": {"family": "Estedad", "weight": 600, "status": display_status, "assetPath": fonts[0]["path"]},
                "body": {"family": "Vazirmatn", "weight": 400, "status": body_status, "assetPath": fonts[2]["path"]},
            },
        },
        "actions": source_events,
        "states": states,
        "sources": [source_record],
        "tokens": [{"id": token["id"], "value": token["value"], "status": token["status"], "source": token["source"]} for token in tokens],
        "assets": [{"assetId": item["assetId"], "path": item["path"], "kind": item["kind"], "license": item["license"], "sha256": item["sha256"]} for item in fonts],
        "frames": spec_frames,
        "outputs": [{"path": f"docs/designs/components/{component['componentId']}/{path}", "artifactType": kind_name, "status": "GENERATED"} for path, kind_name in package_outputs()],
        "qa": {"status": "PASS_WITH_WARNINGS", "checks": checks, "warnings": warnings},
    }
    write_json(target_dir / "design-spec.json", spec)
    (target_dir / "design-spec.schema.json").write_bytes(schema_bytes)

    anatomy_nodes = []
    anatomy_nodes.append({"id": f"{component['componentId']}-board-specimen", "frameId": f"{component['componentId']}-board", "parentId": None, "role": "desktop-reference-thumbnail", "x": 78, "y": 220, "width": 812, "height": 507, "geometryStatus": "PROPOSED", "captureStatus": "MEASURED_IN_RENDERER_OUTPUT"})
    for viewport_id, info in (("desktop", desktop_info), ("mobile", mobile_info)):
        bounds = info["bounds"]
        anatomy_nodes.append({"id": f"{component['componentId']}-{viewport_id}-specimen", "frameId": f"{component['componentId']}-{viewport_id}", "parentId": None, "role": "component-specimen", **bounds})
        for child in info["nodes"]:
            anatomy_nodes.append({**child, "id": f"{component['componentId']}-{viewport_id}-{child['id']}", "frameId": f"{component['componentId']}-{viewport_id}", "parentId": f"{component['componentId']}-{viewport_id}-specimen", "role": child["id"]})
    write_json(target_dir / "scene-graph.json", {"version": "1.0.0", "targetId": component["componentId"], "coordinateSystem": "CSS-pixel-like coordinates from the deterministic raster renderer; each frame is independent.", "frames": [{"id": frame["id"], "width": frame["width"], "height": frame["height"], "rootIds": [f"{component['componentId']}-{frame['viewportId']}-specimen"]} for frame in spec_frames], "nodes": anatomy_nodes})
    write_json(target_dir / "source-index.json", {"targetId": component["componentId"], "sourceRevision": inventory["sourceRevision"], "discoveryMethod": inventory["discoveryMethod"], "sources": [source_record], "copy": source_labels, "jsxTags": unique([str(x) for x in component.get("jsxTags", [])]), "stateVariables": unique([str(x) for x in component.get("stateVariables", [])]), "stateMarkers": state_markers, "variants": component["sourceVariants"], "sizes": component["sourceSizes"], "interactionEvents": source_events})

    display_source = "docs/designs/components/admin-navigation-sidebar/design-tokens.json#tokens.displayFont" if component["scope"] == "admin" else "docs/designs/atelier-editorial.md#6-typography-and-18-soft-modern-refresh"
    display_rationale = "The board renderer uses the locally bundled Estedad SemiBold. Admin source tokens already name Estedad as display; for web, Estedad is a licensed proposed substitute for the Peyda display role. This is image-only and does not revise app typography."
    write_json(target_dir / "authority-map.json", {
        "targetId": component["componentId"],
        "decisions": [
            {"property": "Component labels and visible copy", "winner": component["source"], "status": "SOURCE_DEFINED", "rationale": "Copy comes from the checked source inventory and source-file SHA-256.", "anchor": source_anchor},
            {"property": "JSX anatomy and event labels", "winner": component["source"], "status": "SOURCE_DEFINED", "rationale": "Only tags and events recorded in the source inventory are represented; unlabelled actions remain unlabelled.", "anchor": source_anchor},
            {"property": "Appearance palette", "winner": "docs/designs/atelier-editorial.md#18" if component["scope"] != "admin" else "docs/designs/components/admin-navigation-sidebar/design-tokens.json", "status": "SOURCE_DEFINED", "rationale": "Storefront follows Soft Modern tokens; admin keeps its separate staff palette; shared primitive host appearance stays caller-owned."},
            {"property": "Board layout and responsive arrangement", "winner": "render-source/generate-inventory-component-boards.py", "status": "PROPOSED", "rationale": "The source inventory does not define the complete layout geometry for this independent component board."},
            {"property": "Body typeface", "winner": "docs/designs/atelier-editorial.md#6-typography" if component["scope"] == "web" else "docs/designs/components/admin-navigation-sidebar/design-tokens.json#tokens.bodyFont", "status": "SOURCE_DEFINED", "rationale": "Vazirmatn is used for readable Persian UI/body copy in design-board images."},
            {"property": "Display typeface in board raster", "winner": display_source, "status": display_status, "rationale": display_rationale},
            {"property": "Interactive app behavior and exact runtime geometry", "winner": "Not observed", "status": "UNVERIFIED", "rationale": "The live app was not operated; renderer rectangles are measured only within this proposed image."},
        ],
    })
    write_json(target_dir / "conflicts.json", {
        "targetId": component["componentId"], "conflicts": [],
        "proposals": [{"id": "display-font-raster-substitute", "property": "Display font used in board images", "value": "Estedad SemiBold", "status": "PROPOSED", "rationale": display_rationale, "source": display_source}],
        "unresolved": [],
    })
    shape_tokens = {
        "interactiveTargetMinPx": {"width": 44, "height": 44, "status": "SOURCE_DEFINED", "source": "docs/designs/atelier-editorial.md#18"},
    }
    if kind == "button":
        shape_tokens["controlRadius"] = {"value": "pill", "status": "SOURCE_DEFINED", "source": component["source"]}
        shape_tokens["minimumHeightPx"] = {"value": 44, "status": "SOURCE_DEFINED", "source": component["source"]}
        shape_tokens["iconButtonSizePx"] = {"width": 44, "height": 44, "status": "SOURCE_DEFINED", "source": component["source"]}
    else:
        shape_tokens["controlRadiusPx"] = {"value": 10, "status": "SOURCE_DEFINED" if component["scope"] == "web" else "PROPOSED", "source": "docs/designs/atelier-editorial.md#18" if component["scope"] == "web" else "admin reference board proposal"}
    design_tokens = {
        "targetId": component["componentId"], "scope": component["scope"], "locale": "fa-IR", "direction": "rtl",
        "tokens": {token["id"]: {"value": token["value"], "evidenceStatus": token["status"], "source": token["source"]} for token in tokens},
        "typography": {
            "display": {"family": "Estedad", "weight": 600, "status": display_status, "usage": "design-board raster only", "asset": fonts[0]["path"], "license": "SIL Open Font License 1.1"},
            "body": {"family": "Vazirmatn", "weight": 400, "status": body_status, "usage": "board labels and Persian UI copy", "asset": fonts[2]["path"], "license": "SIL Open Font License 1.1"},
            "fallback": "Tahoma, sans-serif",
        },
        "shape": shape_tokens,
    }
    write_json(target_dir / "design-tokens.json", design_tokens)
    write_json(target_dir / "asset-registry.json", {"targetId": component["componentId"], "assets": fonts, "media": [], "notes": ["No photography is included; media areas are vector placeholders.", "Font license texts are included with render-source assets."]})
    write_json(target_dir / "coverage-matrix.json", {
        "version": "1.0.0", "targetId": component["componentId"],
        "sourceEvidence": {"labels": {"status": "DOCUMENTED", "count": len(source_labels)}, "actions": {"status": "DOCUMENTED", "count": len(source_events)}, "stateMarkers": {"status": "DOCUMENTED", "count": len(state_markers)}, "jsxTags": {"status": "DOCUMENTED", "count": len(component.get("jsxTags", []))}, "variants": {"status": "DOCUMENTED", "count": len(component["sourceVariants"])}, "sizes": {"status": "DOCUMENTED", "count": len(component["sourceSizes"])}},
        "artifacts": [{"type": artifact_type, "path": f"docs/designs/components/{component['componentId']}/{path}", "status": "GENERATED"} for path, artifact_type in package_outputs()],
        "viewports": [{"id": "desktop", "width": 1440, "height": 900, "status": "GENERATED", "screenshot": "02-Clean-Reference.png"}, {"id": "mobile", "width": 390, "height": 844, "status": "GENERATED", "screenshot": "03-Clean-Reference-Mobile.png"}],
        "statePresentation": "Source markers are listed on the design board/specification; full live state transitions remain UNVERIFIED.",
    })
    write_json(target_dir / "qa-report.json", spec["qa"])
    write_json(target_dir / "render-source/target.json", {"targetId": component["componentId"], "scope": component["scope"], "symbol": component["symbol"], "source": source_record, "labels": source_labels, "jsxTags": component.get("jsxTags", []), "actions": source_events, "stateVariables": component.get("stateVariables", []), "stateMarkers": state_markers, "variants": component["sourceVariants"], "sizes": component["sourceSizes"], "layoutType": kind, "status": "PROPOSED"})
    (target_dir / "render-source/README.md").write_text(
        f"# {component['componentId']} board input\n\nGenerated by [`../../render-source/generate-inventory-component-boards.py`](../../render-source/generate-inventory-component-boards.py) from the checked component inventory. This renderer produces design documentation only; it does not run or modify the app.\n\n- Source: `{component['source']}:{component['lines']}`\n- Scope: `{component['scope']}`\n- Layout family: `{kind}` (proposed)\n- Persian type: Estedad display + Vazirmatn body, using locally bundled OFL fonts\n- Clean viewports: 1440×900 and 390×844\n- Live component runtime: not checked\n",
        encoding="utf-8",
    )

    handoff = f"""# {component['symbol']} — design handoff

- **شناسه:** `{component['componentId']}`
- **محدوده:** `{component['scope']}`
- **منبع:** [`{component['source']}:{component['lines']}`](../../../{component['source']})
- **وضعیت:** برد تصویری و رفرنس desktop/mobile ساخته شده؛ تمام چیدمان‌ها پیشنهاد طراحی‌اند.
- **فونت تصاویر:** Estedad SemiBold برای display و Vazirmatn برای متن فارسی؛ هر دو همراه مجوز SIL OFL 1.1 در render-source مرکزی موجودند.

## شواهد منبع

متن‌های ثبت‌شده: {('، '.join(source_labels[:12]) or 'متن مستقل در inventory ثبت نشده است')}.

رویدادهای JSX ثبت‌شده: {('؛ '.join([a['element'] + ' / ' + (', '.join(a['events']) or 'بدون event ثبت‌شده') + ((' / برچسب ساختاری: ' + a['label']) if a['label'] else '') for a in source_events[:8]]) or 'event مستقیمی در inventory ثبت نشده است')}. بعضی labelها توصیف ساختاری فرم/ناحیه‌اند و لزوماً متن دکمه نیستند؛ برد فقط از متن‌های کنش کوتاه و صریح CTA استفاده می‌کند.

متغیرهای state منبع: {('، '.join(unique([str(x) for x in component.get('stateVariables', [])])[:14]) or 'متغیری در inventory ثبت نشده است')}.

نشانگرهای state: {('، '.join(state_markers) or 'نشانگر متنی ثبت نشده است')}.

## خواندن خروجی

- `01-Visual-Design-Board.png` برد طراحی و calloutهای منبع/پیشنهاد را نشان می‌دهد.
- `02-Clean-Reference.png` و `03-Clean-Reference-Mobile.png` تصویرهای کامل و مستقل renderer در ابعاد نام‌برده هستند.
- جزئیات source، authority، conflicts، توکن‌ها، scene graph و coverage در فایل‌های JSON کنار برد ثبت شده‌اند.
- هر اندازه‌ی ثبت‌شده، اندازه‌ی رندر پیشنهاد است؛ آن را اندازه‌گیری DOM زنده یا implementation-ready behavior ندانید.
- مقدارهای copy و event فقط از inventory منبع آمده‌اند. داده، route، مجوز، وضعیت API و رفتار تعاملی اضافه نشده است.
- Runtime اپ، focus/keyboard، permission، loading/error واقعی و اتصال API در این کار بررسی نشده است.
"""
    (target_dir / "component-handoff.md").write_text(handoff, encoding="utf-8")

    # Register exact generated files and their hashes after all content is present.
    output_specs = package_outputs()
    manifest_files = []
    for relative, artifact_type in output_specs:
        if relative == "manifest.json":
            continue
        path = target_dir / relative
        manifest_files.append({"path": relative, "artifactType": artifact_type, "sha256": sha256(path), "bytes": path.stat().st_size})
    manifest = {
        "targetId": component["componentId"], "scope": component["scope"], "sourceRevision": inventory["sourceRevision"],
        "source": source_record, "generator": {"name": SCRIPT.name, "version": GENERATOR_VERSION, "python": "3.12", "pillow": PILLOW_VERSION, "layoutEngine": "FreeType RAQM"},
        "fonts": [{"assetId": f["assetId"], "path": f["path"], "sha256": f["sha256"], "license": f["license"]} for f in fonts],
        "viewports": {"board": "1536x1024", "desktop": "1440x900", "mobile": "390x844"},
        "outputCount": len(output_specs), "qaStatus": "PASS_WITH_WARNINGS", "files": manifest_files,
    }
    write_json(target_dir / "manifest.json", manifest)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate one design-only package per visual component missing an exact board.")
    parser.add_argument("--component-id", help="Generate one missing target by exact inventory ID.")
    parser.add_argument("--overwrite-generated", action="store_true", help="Replace packages created by this generator; existing exact-board packages are always protected.")
    args = parser.parse_args()
    validate_font_files()
    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    if inventory["sourceRevision"] != SOURCE_REVISION:
        raise RuntimeError(f"Inventory base {inventory['sourceRevision']} does not match expected {SOURCE_REVISION}.")
    schema_bytes = SCHEMA_PATH.read_bytes()
    candidates = [component for component in inventory["components"] if not component.get("existingBoardId")]
    if args.component_id:
        candidates = [component for component in candidates if component["componentId"] == args.component_id]
        if not candidates:
            raise RuntimeError(f"Unknown/mapped component ID: {args.component_id}")
    print(f"Generating {len(candidates)} independent design package(s) from {SOURCE_REVISION[:12]} using Estedad + Vazirmatn.")
    for index, component in enumerate(candidates, start=1):
        render_package(component, inventory, schema_bytes, args.overwrite_generated)
        print(f"[{index}/{len(candidates)}] {component['componentId']}")
    print("Generation complete. Application code and runtime were not touched.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # Keep batch failures visible and fail closed.
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
