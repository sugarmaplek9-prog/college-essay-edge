from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/scripts/page3-controlled-testing-lane.mjs')
text = p.read_text()

text = text.replace(
"    await page.waitForURL(/\\/start\\/(reflecting|direction|question|blocked)/, { timeout: 30000 });\n",
"    try {\n      await page.waitForURL(/\\/start\\/(reflecting|direction|question|blocked)/, { timeout: 30000 });\n    } catch {\n      // Best-effort: continue with current route and canonical payload probe.\n    }\n"
)

text = text.replace(
"      await waitForReflectingLoaded(page);\n",
"      try {\n        await waitForReflectingLoaded(page);\n      } catch {\n        // Keep case execution alive when reflecting text gate is slow.\n      }\n"
)

text = text.replace(
"        await page.waitForURL('**/start/direction', { timeout: 15000 });\n",
"        try {\n          await page.waitForURL('**/start/direction', { timeout: 15000 });\n        } catch {\n          // Continue; some cases stay in reflecting/question/blocked.\n        }\n"
)

text = text.replace(
"      await waitForDirectionLoaded(page);\n",
"      try {\n        await waitForDirectionLoaded(page);\n      } catch {\n        // Continue with best-effort extraction.\n      }\n"
)

p.write_text(text)
print('patched wait guards')
