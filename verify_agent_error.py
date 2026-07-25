from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto("http://127.0.0.1:4173")
        page.wait_for_load_state("networkidle")

        # Look for the button with title "Open Space Agent" and click it, force click
        page.locator("button[title='Open Space Agent']").click(force=True)
        page.wait_for_timeout(1000)

        # Find the chat input (placeholder "Ask agent to generate a widget...")
        input_locator = page.locator("input[placeholder*='Ask agent']")
        input_locator.fill("error please")
        input_locator.press("Enter")

        # Immediately take screenshot to capture streaming state
        page.wait_for_timeout(100) # Small delay to let React update state
        page.screenshot(path="/home/jules/verification/screenshots/streaming2.png")

        browser.close()

if __name__ == "__main__":
    verify()
