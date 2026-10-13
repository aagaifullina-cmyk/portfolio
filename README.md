# Asya Gaifullina — Portfolio

Personal portfolio site of Asya Gaifullina, Product · UX/UI designer.

**Live:** https://aagaifullina-cmyk.github.io/portfolio/

## Pages

| File | Content |
|------|---------|
| `Portfolio.dc.html` | Main page |
| `PredictionMiniApp.dc.html` | Access screen for the NDA case: an allowed company name opens the Figma prototype |
| `BankingMiniApp.dc.html` | Public anonymized version of the NDA case ("View public version") |
| `WeCoop.dc.html` | Case study: WeCoop — pricing and proposal system for designers |
| `Privacy.dc.html` | Privacy notice (linked from every footer; no analytics on this page) |

## Structure

- `assets/` — images (WebP)
- `media/` — videos used on the pages
- `support.js` — shared scripts
- `tools/build_allowlist.py` — builds the hashed company allowlist for the NDA case from `tools/nda-allowlist.txt` (local only, gitignored)

## Run locally

1. Open this folder in VS Code.
2. Install the **Live Server** extension (Ritwick Dey).
3. Open `Portfolio.dc.html` and click **Go Live** in the status bar.

The site opens at `http://127.0.0.1:5500/Portfolio.dc.html` and reloads on save.
