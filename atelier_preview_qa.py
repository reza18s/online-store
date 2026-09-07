from pathlib import Path

from playwright.sync_api import expect, sync_playwright


BASE_URL = "http://127.0.0.1:5173"
SCREENSHOT_DIR = Path(r"C:\Users\Asus\.codex\visualizations\2026\09\07\01a07c1a-378e-7bd1-a19f-e00e57bd013b")


def assert_no_horizontal_overflow(page):
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), (
        f"horizontal overflow at {page.viewport_size['width']}px: "
        f"{page.evaluate('document.documentElement.scrollWidth')}px"
    )


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)

    page.goto(f"{BASE_URL}/#home")
    page.wait_for_load_state("networkidle")
    expect(page.locator("html")).to_have_attribute("dir", "rtl")
    expect(page.locator("#hero-title")).to_contain_text("جزئیات آرام")
    assert page.locator(".product-card").count() == 8
    assert_no_horizontal_overflow(page)
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(SCREENSHOT_DIR / "atelier-home-1440.png"), full_page=True)

    page.get_by_role("button", name="جست‌وجو").click()
    expect(page.locator(".search-dialog")).to_be_visible()
    search_input = page.locator(".search-field input")
    search_input.fill("لینن")
    expect(page.locator(".search-dialog__results a")).to_have_count(1)
    page.keyboard.press("Escape")
    expect(page.locator(".search-dialog")).to_have_count(0)

    page.locator(".product-card a[aria-label]").first.click()
    page.wait_for_load_state("networkidle")
    expect(page.locator("#product-title")).to_be_visible()
    page.locator(".size-picker__options button").nth(1).click()
    add_button = page.get_by_role("button", name="افزودن به سبد خرید")
    expect(add_button).to_be_enabled()
    add_button.click()
    expect(page.locator(".cart-button__count")).to_contain_text("۱")
    page.get_by_role("link", name="سبد خرید، 1 کالا").click()
    page.wait_for_load_state("networkidle")
    expect(page.locator("h1")).to_contain_text("سبد خرید")
    page.get_by_role("link", name="ادامه فرایند خرید").click()
    page.wait_for_load_state("networkidle")
    expect(page.locator("h1")).to_contain_text("آدرس تحویل")
    page.get_by_role("link", name="ادامه").click()
    page.wait_for_load_state("networkidle")
    expect(page.locator("h1")).to_contain_text("روش ارسال")

    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{BASE_URL}/#home")
    page.wait_for_load_state("networkidle")
    assert_no_horizontal_overflow(page)
    page.screenshot(path=str(SCREENSHOT_DIR / "atelier-home-390.png"), full_page=True)
    page.get_by_role("button", name="باز کردن منو").click()
    expect(page.get_by_role("dialog", name="منوی فروشگاه")).to_be_visible()
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog", name="منوی فروشگاه")).to_have_count(0)

    for width in (360, 768, 1024):
        page.set_viewport_size({"width": width, "height": 900})
        page.goto(f"{BASE_URL}/#products")
        page.wait_for_load_state("networkidle")
        assert_no_horizontal_overflow(page)

    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{BASE_URL}/#admin")
    page.wait_for_load_state("networkidle")
    expect(page.locator(".admin-shell")).to_be_visible()
    expect(page.locator(".mobile-bottom-nav")).to_have_count(0)
    assert_no_horizontal_overflow(page)

    print("ATELIER_PREVIEW_QA=PASS")
    browser.close()
